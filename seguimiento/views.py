from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsCoordinadorOrAdmin, IsDocenteOrAbove
from core.utils import api_response
from usuarios.models import RolUsuario
from proyectos.models import ParticipanteProyecto
from .alertas_generator import generar_alerta, recalcular_horas_cumplidas

from .models import (
	Alerta,
	Avance,
	EstadoAlerta,
	EstadoAvance,
	Evidencia,
	FlujoValidacion,
	Informe,
	Revision,
)
from .serializers import (
	AlertaSerializer,
	AvanceSerializer,
	EvidenciaSerializer,
	FlujoValidacionSerializer,
	InformeDetailSerializer,
	InformeListSerializer,
	RevisionSerializer,
)


class AvanceViewSet(viewsets.ModelViewSet):
	queryset = Avance.objects.select_related('actividad', 'registrado_por').all()
	serializer_class = AvanceSerializer
	filter_backends = [DjangoFilterBackend, OrderingFilter]
	filterset_fields = ['actividad', 'estado', 'registrado_por']
	ordering_fields = ['fecha_registro', 'porcentaje_avance', 'creado_en']

	def get_permissions(self):
		if self.action == 'destroy':
			return [IsCoordinadorOrAdmin()]
		return [IsAuthenticated()]

	def perform_create(self, serializer):
		# El frontend no envía ``registrado_por``; lo poblamos aquí con el
		# perfil del usuario autenticado. Sin esto, ``avance.registrado_por``
		# queda en ``null`` y las acciones del flujo (aprobar/rechazar) no
		# pueden notificar al autor del avance ni permitirle editarlo.
		perfil = getattr(self.request.user, 'perfil', None)
		kwargs = {}
		if perfil is not None and not serializer.validated_data.get('registrado_por'):
			kwargs['registrado_por'] = perfil
		avance = serializer.save(**kwargs)
		self._notificar_docente_avance(avance, perfil, verbo='registró')

	def perform_update(self, serializer):
		avance = serializer.save()
		perfil = getattr(self.request.user, 'perfil', None)
		self._notificar_docente_avance(avance, perfil, verbo='actualizó')

	def _notificar_docente_avance(self, avance, perfil, verbo):
		"""
		Notifica a los docentes/coordinadores encargados de que un participante
		registró o actualizó un avance en una actividad.

		Los destinatarios son, en orden de prioridad:
		  1. Responsable del proyecto.
		  2. Coordinador académico del proyecto.
		  3. Responsable de la actividad, si tiene rol docente/coordinador/directivo.
		  4. Docentes participantes del proyecto, si no hay responsables formales.

		No se notifica al autor del avance.
		"""
		actividad = getattr(avance, 'actividad', None)
		proyecto = getattr(actividad, 'proyecto', None) if actividad else None
		if actividad is None or proyecto is None:
			return

		autor_nombre = ''
		if perfil is not None:
			user = getattr(perfil, 'user', None)
			if user is not None:
				autor_nombre = (f'{user.first_name} {user.last_name}').strip() or user.username

		detalle_base = (
			f'{autor_nombre or "Un participante"} {verbo} un avance del '
			f'{avance.porcentaje_avance}%'
		)
		try:
			detalle_base += f' con {avance.horas_invertidas} horas invertidas'
		except Exception:
			pass
		detalle_base += '. Pendiente de revisión.'

		destinatarios = {}

		# 1. Responsable del proyecto
		responsable_proyecto = getattr(proyecto, 'responsable', None)
		if responsable_proyecto and responsable_proyecto != perfil:
			destinatarios[responsable_proyecto.id] = responsable_proyecto

		# 2. Coordinador académico del proyecto
		coordinador = getattr(proyecto, 'coordinador_academico', None)
		if coordinador and coordinador != perfil:
			destinatarios[coordinador.id] = coordinador

		# 3. Responsable de la actividad (solo si es un rol de gestión)
		responsable_actividad = getattr(actividad, 'responsable', None)
		if (
			responsable_actividad
			and responsable_actividad != perfil
			and responsable_actividad.rol in ('DOCENTE', 'COORDINADOR', 'DIRECTIVO', 'ADMIN')
		):
			destinatarios[responsable_actividad.id] = responsable_actividad

		# 4. Fallback: docentes participantes del proyecto
		if not destinatarios:
			for part in ParticipanteProyecto.objects.filter(
				proyecto=proyecto,
				rol__in=('DOCENTE', 'LIDER'),
				usuario__isnull=False,
			).select_related('usuario'):
				docente = part.usuario
				if docente and docente != perfil:
					destinatarios[docente.id] = docente

		if not destinatarios:
			return

		for docente in destinatarios.values():
			rol_path = (docente.rol or 'docente').lower()
			enlace = f'/{rol_path}/proyectos/{proyecto.id}/actividades/{actividad.id}'
			generar_alerta(
				usuario=docente,
				mensaje=f'Avance {verbo} en "{actividad.nombre}"',
				detalle=detalle_base,
				prioridad='MEDIA',
				proyecto=proyecto,
				enlace=enlace,
				force=True,
			)

	def _sincronizar_estado_actividad(self, actividad):
		"""Asigna el estado de la actividad según su porcentaje de ejecución.

		Respetamos estados manuales como CANCELADA o ATRASADA.
		El llamador debe guardar la actividad con los campos actualizados.
		"""
		if not actividad:
			return
		from proyectos.models import EstadoActividad
		if actividad.estado in (EstadoActividad.CANCELADA, EstadoActividad.ATRASADA):
			return
		porcentaje = float(actividad.porcentaje_ejecucion or 0)
		if porcentaje >= 100:
			actividad.estado = EstadoActividad.COMPLETADA
		elif porcentaje > 0:
			actividad.estado = EstadoActividad.EN_PROCESO
		else:
			actividad.estado = EstadoActividad.PENDIENTE

	@action(detail=True, methods=['post'], url_path='aprobar')
	def aprobar(self, request, pk=None):
		avance = self.get_object()
		avance.estado = EstadoAvance.APROBADO
		avance.save(update_fields=['estado', 'actualizado_en'])
		actividad = avance.actividad
		actividad.porcentaje_avance = avance.porcentaje_avance
		actividad.porcentaje_ejecucion = avance.porcentaje_avance
		self._sincronizar_estado_actividad(actividad)
		actividad.save(update_fields=['porcentaje_avance', 'porcentaje_ejecucion', 'estado', 'actualizado_en'])
		print(f"[PROGRESO] Actividad {actividad.codigo} actualizada a {avance.porcentaje_avance}%")
		# Sincronizar horas cumplidas del participante responsable de la actividad
		if actividad.responsable and actividad.proyecto:
			from proyectos.models import ParticipanteProyecto
			participante = ParticipanteProyecto.objects.filter(
				proyecto=actividad.proyecto,
				usuario=actividad.responsable,
			).first()
			if participante is not None:
				recalcular_horas_cumplidas(participante)
		return api_response(True, 'Avance aprobado.', AvanceSerializer(avance).data)

	@action(detail=True, methods=['post'], url_path='rechazar')
	def rechazar(self, request, pk=None):
		avance = self.get_object()
		motivo = request.data.get('motivo', '')
		avance.estado = EstadoAvance.RECHAZADO
		avance.motivo_rechazo = motivo
		avance.save(update_fields=['estado', 'motivo_rechazo', 'actualizado_en'])

		# Si el avance rechazado había sido aprobado (transición defensiva) o si
		# su porcentaje estaba reflejado en la actividad, recalcular el progreso
		# al mayor porcentaje aprobado restante para no dejar la actividad en 100%.
		actividad = avance.actividad
		if actividad:
			porcentaje_actual = actividad.porcentaje_avance or actividad.porcentaje_ejecucion or 0
			porcentaje_avance_rechazado = avance.porcentaje_avance or 0
			if porcentaje_avance_rechazado >= porcentaje_actual:
				from django.db.models import Max
				max_aprobado = (
					actividad.avances.filter(estado=EstadoAvance.APROBADO)
					.aggregate(m=Max('porcentaje_avance'))
					.get('m') or 0
				)
				actividad.porcentaje_avance = max_aprobado
				actividad.porcentaje_ejecucion = max_aprobado
				self._sincronizar_estado_actividad(actividad)
				actividad.save(update_fields=['porcentaje_avance', 'porcentaje_ejecucion', 'estado', 'actualizado_en'])

		if avance.registrado_por:
			rol_path = avance.registrado_por.rol.lower() if avance.registrado_por.rol else 'docente'
			proyecto_id = avance.actividad.proyecto.id if avance.actividad and avance.actividad.proyecto else ''
			actividad_id = avance.actividad.id if avance.actividad else ''
			generar_alerta(
				usuario=avance.registrado_por,
				mensaje='Tu avance fue rechazado',
				detalle=motivo,
				prioridad='ALTA',
				proyecto=avance.actividad.proyecto if avance.actividad else None,
				enlace=f'/{rol_path}/proyectos/{proyecto_id}/actividades/{actividad_id}',
				force=True,
			)
		# Si el avance rechazado estaba APROBADO previamente (transición inválida,
		# pero defensiva), re-sincronizar horas cumplidas del participante
		# responsable de la actividad para mantener la coherencia.
		actividad = avance.actividad
		if actividad and actividad.responsable and actividad.proyecto:
			from proyectos.models import ParticipanteProyecto
			participante = ParticipanteProyecto.objects.filter(
				proyecto=actividad.proyecto,
				usuario=actividad.responsable,
			).first()
			if participante is not None:
				recalcular_horas_cumplidas(participante)
		return api_response(True, 'Avance rechazado.', AvanceSerializer(avance).data)


class EvidenciaViewSet(viewsets.ModelViewSet):
	queryset = Evidencia.objects.all()
	serializer_class = EvidenciaSerializer
	filter_backends = [DjangoFilterBackend, OrderingFilter]
	filterset_fields = ['avance', 'actividad', 'tipo', 'verificada']
	ordering_fields = ['fecha_carga', 'creado_en']

	def get_permissions(self):
		if self.action == 'destroy':
			return [IsCoordinadorOrAdmin()]
		return [IsAuthenticated()]


class InformeViewSet(viewsets.ModelViewSet):
	queryset = Informe.objects.select_related('proyecto', 'elaborado_por', 'aprobado_por').all()
	filter_backends = [DjangoFilterBackend, OrderingFilter]
	filterset_fields = ['proyecto', 'tipo', 'estado']
	ordering_fields = ['fecha_emision', 'creado_en']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy', 'generar_ia'):
			return [IsDocenteOrAbove()]
		return [IsAuthenticated()]

	def get_serializer_class(self):
		if self.action == 'list':
			return InformeListSerializer
		return InformeDetailSerializer

	def _generar_numero(self, proyecto, tipo):
		from django.db.models import Max
		maximo = Informe.objects.filter(proyecto=proyecto, tipo=tipo).aggregate(c=Max('numero')).get('c')
		secuencia = 1
		if maximo:
			try:
				secuencia = int(str(maximo).split('-')[-1]) + 1
			except (ValueError, IndexError):
				secuencia = (Informe.objects.filter(proyecto=proyecto, tipo=tipo).count() or 0) + 1
		return f'{tipo[:3].upper()}-{secuencia:03d}'

	def perform_create(self, serializer):
		if not serializer.validated_data.get('numero'):
			proyecto = serializer.validated_data.get('proyecto')
			tipo = serializer.validated_data.get('tipo', 'INFORME')
			serializer.save(numero=self._generar_numero(proyecto, tipo))
		else:
			serializer.save()

	@action(detail=False, methods=['post'], url_path='generar-ia')
	def generar_ia(self, request):
		"""Proxy seguro hacia Anthropic Claude para redactar informes."""
		import json
		import urllib.error
		import urllib.request

		from django.conf import settings

		prompt = (request.data.get('prompt') or '').strip()
		if not prompt:
			return api_response(False, 'El prompt es obligatorio.', http_status=status.HTTP_400_BAD_REQUEST)

		api_key = getattr(settings, 'ANTHROPIC_API_KEY', '') or ''
		if not api_key:
			return api_response(
				False,
				'El servicio de IA no está configurado. Defina ANTHROPIC_API_KEY en el servidor.',
				http_status=status.HTTP_503_SERVICE_UNAVAILABLE,
			)

		model = getattr(settings, 'ANTHROPIC_MODEL', 'claude-sonnet-4-6') or 'claude-sonnet-4-6'
		max_tokens = min(int(request.data.get('max_tokens') or 4000), 8000)

		payload = {
			'model': model,
			'max_tokens': max_tokens,
			'messages': [{'role': 'user', 'content': prompt}],
		}
		body = json.dumps(payload).encode('utf-8')
		req = urllib.request.Request(
			'https://api.anthropic.com/v1/messages',
			data=body,
			method='POST',
			headers={
				'Content-Type': 'application/json',
				'x-api-key': api_key,
				'anthropic-version': '2023-06-01',
			},
		)

		try:
			with urllib.request.urlopen(req, timeout=90) as resp:
				data = json.loads(resp.read().decode('utf-8'))
		except urllib.error.HTTPError as exc:
			try:
				err_body = exc.read().decode('utf-8')
				err_data = json.loads(err_body)
				msg = err_data.get('error', {}).get('message') or err_body[:300]
			except Exception:
				msg = str(exc.reason or exc)
			return api_response(
				False,
				f'Error del servicio de IA: {msg}',
				http_status=status.HTTP_502_BAD_GATEWAY,
			)
		except urllib.error.URLError as exc:
			return api_response(
				False,
				f'No se pudo conectar con el servicio de IA: {exc.reason}',
				http_status=status.HTTP_504_GATEWAY_TIMEOUT,
			)
		except TimeoutError:
			return api_response(
				False,
				'El servicio de IA tardó demasiado en responder. Intente de nuevo.',
				http_status=status.HTTP_504_GATEWAY_TIMEOUT,
			)

		parts = data.get('content') or []
		texto = ''.join(
			block.get('text', '') for block in parts if isinstance(block, dict) and block.get('type') == 'text'
		).strip()
		if not texto:
			return api_response(
				False,
				'La IA no devolvió contenido utilizable.',
				http_status=status.HTTP_502_BAD_GATEWAY,
			)

		return api_response(True, 'Informe generado correctamente.', data={'contenido': texto})


class AlertaViewSet(viewsets.ReadOnlyModelViewSet):
	queryset = Alerta.objects.select_related('usuario', 'proyecto', 'convenio').all()
	serializer_class = AlertaSerializer
	filter_backends = [DjangoFilterBackend, OrderingFilter]
	filterset_fields = ['usuario', 'proyecto', 'convenio', 'estado', 'prioridad', 'leida']
	ordering_fields = ['fecha_vencimiento', 'prioridad', 'creado_en']

	def get_queryset(self):
		qs = super().get_queryset()
		if not hasattr(self.request.user, 'perfil'):
			return qs
		perfil = self.request.user.perfil
		if perfil.rol == RolUsuario.ADMIN:
			return qs
		return qs.filter(usuario=perfil)

	@action(detail=True, methods=['post'], url_path='leer')
	def marcar_leida(self, request, pk=None):
		alerta = self.get_object()
		alerta.leida = True
		alerta.estado = EstadoAlerta.LEIDA
		alerta.save(update_fields=['leida', 'estado', 'actualizado_en'])
		return api_response(True, 'Alerta marcada como leida.', AlertaSerializer(alerta).data)

	@action(detail=True, methods=['post'], url_path='atender')
	def atender(self, request, pk=None):
		alerta = self.get_object()
		alerta.estado = EstadoAlerta.ATENDIDA
		alerta.save(update_fields=['estado', 'actualizado_en'])
		return api_response(True, 'Alerta atendida.', AlertaSerializer(alerta).data)


class RevisionViewSet(viewsets.ModelViewSet):
	queryset = Revision.objects.select_related('proyecto', 'revisor').all()
	serializer_class = RevisionSerializer
	filter_backends = [DjangoFilterBackend]
	filterset_fields = ['proyecto', 'revisor', 'decision']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsCoordinadorOrAdmin()]
		return [IsAuthenticated()]


class FlujoValidacionViewSet(viewsets.ModelViewSet):
	queryset = FlujoValidacion.objects.select_related('proyecto', 'responsable').all()
	serializer_class = FlujoValidacionSerializer
	filter_backends = [DjangoFilterBackend]
	filterset_fields = ['proyecto', 'estado', 'responsable']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsCoordinadorOrAdmin()]
		return [IsAuthenticated()]
