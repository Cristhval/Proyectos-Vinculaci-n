from django.db import transaction
from django.db.models import Count, Prefetch
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.shortcuts import get_object_or_404

from core.permissions import IsCoordinadorOrAdmin, IsDocenteOrAbove, IsCreadorProyecto, puede_gestionar_proyecto
from core.utils import api_response

from auditoria.utils import registrar_desde_request
from auditoria.models import TipoAccion as AuditoriaAccion
from seguimiento.alertas_generator import generar_alerta

from .models import (
	Actividad,
	AlineacionEstrategica,
	Anexo,
	Beneficiario,
	FirmaResponsabilidad,
	Indicador,
	MarcoLogicoFila,
	Objetivo,
	ParticipanteProyecto,
	Presupuesto,
	Proyecto,
	EstadoProyecto,
)
from .serializers import (
	CAMPOS_TEXTO_LARGO_PROYECTO,
	ActividadSerializer,
	AlineacionEstrategicaSerializer,
	AnexoSerializer,
	BeneficiarioSerializer,
	FirmaResponsabilidadSerializer,
	IndicadorSerializer,
	MarcoLogicoFilaSerializer,
	ObjetivoSerializer,
	ParticipanteProyectoSerializer,
	PresupuestoSerializer,
	ProyectoCreateUpdateSerializer,
	ProyectoDetailSerializer,
	ProyectoListSerializer,
)
from .services import ProyectoWorkflowService, IndicadorMedicionService, ProyectoMonitoreoService

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter


def filtrar_por_rol(qs, user, prefijo=''):
	"""Visibilidad por rol: el DOCENTE ve sus proyectos y el ESTUDIANTE aquellos en que participa.

	`prefijo` es la ruta hasta el proyecto ('' para Proyecto, 'proyecto__' para sus hijos).
	Los demás roles (COORDINADOR, DIRECTIVO, ADMIN) ven todo.
	"""
	if not hasattr(user, 'perfil'):
		return qs
	rol = user.perfil.rol
	if rol == 'DOCENTE':
		return qs.filter(**{f'{prefijo}responsable': user.perfil})
	if rol == 'ESTUDIANTE':
		return qs.filter(**{f'{prefijo}participantes__usuario': user.perfil}).distinct()
	return qs


class ProyectoViewSet(viewsets.ModelViewSet):
	queryset = Proyecto.objects.select_related('carrera', 'responsable').all()

	def get_queryset(self):
		qs = filtrar_por_rol(super().get_queryset(), self.request.user)
		if self.action == 'list':
			# El listado no usa los campos de texto largos ni la foto del responsable.
			qs = qs.select_related('responsable__user').defer(
				*CAMPOS_TEXTO_LARGO_PROYECTO, 'responsable__foto',
			).annotate(
				actividades_count=Count('actividades', distinct=True),
				objetivos_count=Count('objetivos', distinct=True),
			)
		elif self.action == 'retrieve':
			qs = qs.select_related(
				'responsable__user', 'coordinador_academico__user', 'presupuesto',
			).defer('responsable__foto', 'coordinador_academico__foto').prefetch_related(
				'carreras',
				Prefetch('objetivos', queryset=Objetivo.objects.prefetch_related('indicadores')),
				'actividades',
				Prefetch('participantes', queryset=ParticipanteProyectoSerializer.preparar_queryset(ParticipanteProyecto.objects.all())),
				'beneficiarios',
				'alineaciones',
				Prefetch('firmas', queryset=FirmaResponsabilidad.objects.select_related('usuario__user').defer('usuario__foto')),
				Prefetch('anexos', queryset=Anexo.objects.select_related('subido_por__user').defer('subido_por__foto')),
				'marco_logico',
			)
		return qs
	filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
	filterset_fields = ['estado', 'tipo', 'prioridad', 'carrera', 'activo']
	search_fields = ['codigo', 'titulo', 'descripcion', 'responsable__user__username']
	ordering_fields = ['codigo', 'titulo', 'estado', 'creado_en', 'fecha_inicio']

	def __init__(self, **kwargs):
		super().__init__(**kwargs)
		self.workflow = ProyectoWorkflowService()
		self.monitoreo_service = ProyectoMonitoreoService()

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update'):
			return [IsCreadorProyecto()]
		if self.action == 'destroy':
			return [IsCoordinadorOrAdmin()]
		return [IsAuthenticated()]

	def get_serializer_class(self):
		if self.action in ('create', 'update', 'partial_update'):
			return ProyectoCreateUpdateSerializer
		if self.action == 'list':
			return ProyectoListSerializer
		return ProyectoDetailSerializer

	def perform_create(self, serializer):
		with transaction.atomic():
			proyecto = serializer.save()
			for nivel, _ in MarcoLogicoFila.NIVEL_CHOICES:
				MarcoLogicoFila.objects.get_or_create(proyecto=proyecto, nivel=nivel)

	@action(detail=True, methods=['post'], url_path='monitoreo')
	def monitoreo(self, request, pk=None):
		"""HU-18: activa o desactiva el monitoreo ambiental. Body: {"activo": true|false}."""
		# Se busca sin el filtro por rol del queryset para responder 403 (no 404)
		# a un docente que no es el responsable.
		proyecto = get_object_or_404(Proyecto.objects.select_related('responsable'), pk=pk)
		if not puede_gestionar_proyecto(request.user, proyecto):
			return api_response(
				False,
				'Solo el responsable del proyecto, un coordinador o un administrador pueden cambiar el monitoreo ambiental.',
				http_status=status.HTTP_403_FORBIDDEN,
			)
		activo = request.data.get('activo')
		if not isinstance(activo, bool):
			return api_response(False, 'El campo "activo" es obligatorio y debe ser true o false.', http_status=status.HTTP_400_BAD_REQUEST)
		try:
			self.monitoreo_service.cambiar(proyecto, activo, usuario=request.user.perfil, request=request)
		except ValueError as e:
			return api_response(False, str(e), http_status=status.HTTP_400_BAD_REQUEST)
		mensaje = 'Monitoreo ambiental activado.' if activo else 'Monitoreo ambiental desactivado.'
		return api_response(True, mensaje, {'id': proyecto.pk, 'monitoreo_activo': proyecto.monitoreo_activo})

	@action(detail=True, methods=['post'], url_path='enviar-revision')
	def enviar_revision(self, request, pk=None):
		proyecto = self.get_object()
		try:
			self.workflow.enviar_revision(proyecto)
		except ValueError as e:
			return api_response(False, str(e), http_status=status.HTTP_400_BAD_REQUEST)
		registrar_desde_request(request, AuditoriaAccion.ACTUALIZAR, 'Proyecto', proyecto.pk, f'Proyecto {proyecto.codigo} enviado a revisión')
		from usuarios.models import Usuario
		coordinadores = Usuario.objects.filter(rol='COORDINADOR', activo=True)
		for coord in coordinadores:
			generar_alerta(
				usuario=coord,
				mensaje=f'Proyecto {proyecto.codigo} enviado a revisión',
				detalle=f'{proyecto.titulo} requiere revisión y aprobación',
				prioridad='MEDIA',
				proyecto=proyecto,
				enlace=f'/coordinador/proyectos/{proyecto.id}',
				force=True,
			)
		return api_response(True, 'Proyecto enviado a revision.', ProyectoDetailSerializer(proyecto).data)

	@action(detail=True, methods=['post'], url_path='aprobar')
	def aprobar(self, request, pk=None):
		proyecto = self.get_object()
		try:
			self.workflow.aprobar(proyecto)
		except ValueError as e:
			return api_response(False, str(e), http_status=status.HTTP_400_BAD_REQUEST)
		registrar_desde_request(request, AuditoriaAccion.APROBAR, 'Proyecto', proyecto.pk, f'Proyecto {proyecto.codigo} aprobado')
		if proyecto.responsable and hasattr(proyecto.responsable, 'user'):
			try:
				generar_alerta(
					usuario=proyecto.responsable,
					mensaje=f'Tu proyecto {proyecto.codigo} fue aprobado',
					detalle=f'El proyecto "{proyecto.titulo}" fue aprobado. Ya puedes iniciar la ejecución.',
					prioridad='MEDIA',
					proyecto=proyecto,
					enlace=f'/docente/proyectos/{proyecto.id}',
					force=True,
				)
				print(f'[ALERTA OK] Enviada a {proyecto.responsable.user.email}')
			except Exception as e:
				print(f'[ALERTA ERROR] {e}')
		return api_response(True, 'Proyecto aprobado.', ProyectoDetailSerializer(proyecto).data)

	@action(detail=True, methods=['post'], url_path='rechazar')
	def rechazar(self, request, pk=None):
		proyecto = self.get_object()
		motivo = request.data.get('motivo', '')
		try:
			self.workflow.rechazar(proyecto)
		except ValueError as e:
			return api_response(False, str(e), http_status=status.HTTP_400_BAD_REQUEST)
		registrar_desde_request(request, AuditoriaAccion.RECHAZAR, 'Proyecto', proyecto.pk, f'Proyecto {proyecto.codigo} rechazado. Motivo: {motivo}')
		if proyecto.responsable:
			generar_alerta(
				usuario=proyecto.responsable,
				mensaje=f'Tu proyecto {proyecto.codigo} fue rechazado',
				detalle=motivo,
				prioridad='ALTA',
				proyecto=proyecto,
				enlace=f'/docente/proyectos/{proyecto.id}',
				force=True,
			)
		return api_response(True, 'Proyecto devuelto a borrador.', ProyectoDetailSerializer(proyecto).data)

	@action(detail=True, methods=['post'], url_path='iniciar-ejecucion')
	def iniciar_ejecucion(self, request, pk=None):
		proyecto = self.get_object()
		try:
			self.workflow.iniciar_ejecucion(proyecto)
		except ValueError as e:
			return api_response(False, str(e), http_status=status.HTTP_400_BAD_REQUEST)
		return api_response(True, 'Proyecto en ejecucion.', ProyectoDetailSerializer(proyecto).data)

	@action(detail=True, methods=['post'], url_path='suspender')
	def suspender(self, request, pk=None):
		proyecto = self.get_object()
		try:
			self.workflow.suspender(proyecto)
		except ValueError as e:
			return api_response(False, str(e), http_status=status.HTTP_400_BAD_REQUEST)
		return api_response(True, 'Proyecto suspendido.', ProyectoDetailSerializer(proyecto).data)

	@action(detail=True, methods=['post'], url_path='reanudar')
	def reanudar(self, request, pk=None):
		proyecto = self.get_object()
		try:
			self.workflow.reanudar(proyecto)
		except ValueError as e:
			return api_response(False, str(e), http_status=status.HTTP_400_BAD_REQUEST)
		return api_response(True, 'Proyecto reanudado.', ProyectoDetailSerializer(proyecto).data)

	@action(detail=True, methods=['post'], url_path='finalizar')
	def finalizar(self, request, pk=None):
		proyecto = self.get_object()
		try:
			self.workflow.finalizar(proyecto)
		except ValueError as e:
			return api_response(False, str(e), http_status=status.HTTP_400_BAD_REQUEST)
		registrar_desde_request(request, AuditoriaAccion.ACTUALIZAR, 'Proyecto', proyecto.pk, f'Proyecto {proyecto.codigo} finalizado')
		from usuarios.models import Usuario
		coordinadores = Usuario.objects.filter(rol='COORDINADOR', activo=True)
		for coord in coordinadores:
			generar_alerta(
				usuario=coord,
				mensaje=f'Proyecto {proyecto.codigo} finalizado',
				detalle=f'El responsable declaró finalizado el proyecto "{proyecto.titulo}"',
				prioridad='MEDIA',
				proyecto=proyecto,
				enlace=f'/coordinador/proyectos/{proyecto.id}',
				force=True,
			)
		return api_response(True, 'Proyecto finalizado.', ProyectoDetailSerializer(proyecto).data)

	@action(detail=True, methods=['post'], url_path='cerrar')
	def cerrar(self, request, pk=None):
		proyecto = self.get_object()
		try:
			self.workflow.cerrar(proyecto)
		except ValueError as e:
			return api_response(False, str(e), http_status=status.HTTP_400_BAD_REQUEST)
		return api_response(True, 'Proyecto cerrado.', ProyectoDetailSerializer(proyecto).data)

	@action(detail=True, methods=['post'], url_path='cancelar')
	def cancelar(self, request, pk=None):
		proyecto = self.get_object()
		try:
			self.workflow.cancelar(proyecto)
		except ValueError as e:
			return api_response(False, str(e), http_status=status.HTTP_400_BAD_REQUEST)
		return api_response(True, 'Proyecto cancelado.', ProyectoDetailSerializer(proyecto).data)


class ObjetivoViewSet(viewsets.ModelViewSet):
	queryset = Objetivo.objects.select_related('proyecto').prefetch_related('indicadores')
	serializer_class = ObjetivoSerializer
	filter_backends = [DjangoFilterBackend, OrderingFilter]
	filterset_fields = ['proyecto', 'tipo', 'cumplido']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsCoordinadorOrAdmin()]
		return [IsAuthenticated()]


class IndicadorViewSet(viewsets.ModelViewSet):
	queryset = Indicador.objects.select_related('objetivo__proyecto').all()
	serializer_class = IndicadorSerializer
	filter_backends = [DjangoFilterBackend, OrderingFilter]
	filterset_fields = ['objetivo', 'estado', 'frecuencia']

	def __init__(self, **kwargs):
		super().__init__(**kwargs)
		self.medicion_service = IndicadorMedicionService()

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsDocenteOrAbove()]
		return [IsAuthenticated()]

	@action(detail=True, methods=['post'], url_path='medir')
	def medir(self, request, pk=None):
		indicador = self.get_object()
		valor = request.data.get('valor_actual')
		if valor is None:
			return api_response(False, 'valor_actual es requerido.', http_status=status.HTTP_400_BAD_REQUEST)
		self.medicion_service.medir(indicador, valor)
		return api_response(True, 'Medicion registrada.', IndicadorSerializer(indicador).data)


class ActividadViewSet(viewsets.ModelViewSet):
	queryset = Actividad.objects.select_related('proyecto', 'responsable__user').defer(
		'responsable__foto', *(f'proyecto__{campo}' for campo in CAMPOS_TEXTO_LARGO_PROYECTO),
	)
	serializer_class = ActividadSerializer
	filter_backends = [DjangoFilterBackend, OrderingFilter]
	filterset_fields = ['proyecto', 'estado', 'responsable']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update'):
			return [IsDocenteOrAbove()]
		if self.action == 'destroy':
			return [IsCoordinadorOrAdmin()]
		return [IsAuthenticated()]

	def perform_create(self, serializer):
		actividad = serializer.save()
		if actividad.responsable and actividad.responsable.user != self.request.user:
			rol_path = actividad.responsable.rol.lower() if actividad.responsable.rol else 'estudiante'
			print(f"[ALERTA] Enviando alerta de asignación a {actividad.responsable.user.email}")
			generar_alerta(
				usuario=actividad.responsable,
				mensaje=f'Se te asignó la actividad "{actividad.nombre}"',
				detalle=f'Eres responsable de la actividad en el proyecto {actividad.proyecto.codigo}. Fecha límite: {actividad.fecha_fin or "Sin fecha definida"}.',
				prioridad='MEDIA',
				proyecto=actividad.proyecto,
				enlace=f'/{rol_path}/proyectos/{actividad.proyecto.id}/actividades/{actividad.id}',
				force=True,
			)

	def perform_update(self, serializer):
		actividad = serializer.save()
		if actividad.responsable and actividad.responsable.user != self.request.user:
			rol_path = actividad.responsable.rol.lower() if actividad.responsable.rol else 'estudiante'
			print(f"[ALERTA] Enviando alerta de asignación a {actividad.responsable.user.email}")
			generar_alerta(
				usuario=actividad.responsable,
				mensaje=f'Se te asignó la actividad "{actividad.nombre}"',
				detalle=f'Eres responsable de la actividad en el proyecto {actividad.proyecto.codigo}. Fecha límite: {actividad.fecha_fin or "Sin fecha definida"}.',
				prioridad='MEDIA',
				proyecto=actividad.proyecto,
				enlace=f'/{rol_path}/proyectos/{actividad.proyecto.id}/actividades/{actividad.id}',
				force=True,
			)


class ParticipanteProyectoViewSet(viewsets.ModelViewSet):
	queryset = ParticipanteProyectoSerializer.preparar_queryset(ParticipanteProyecto.objects.select_related('proyecto'))
	serializer_class = ParticipanteProyectoSerializer
	filter_backends = [DjangoFilterBackend]
	filterset_fields = ['proyecto', 'usuario', 'rol']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsDocenteOrAbove()]
		return [IsAuthenticated()]


class PresupuestoViewSet(viewsets.ModelViewSet):
	queryset = Presupuesto.objects.select_related('proyecto', 'responsable').all()
	serializer_class = PresupuestoSerializer
	filter_backends = [DjangoFilterBackend]
	filterset_fields = ['proyecto', 'estado']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsCoordinadorOrAdmin()]
		return [IsAuthenticated()]


class BeneficiarioViewSet(viewsets.ModelViewSet):
	queryset = Beneficiario.objects.select_related('proyecto').all()
	serializer_class = BeneficiarioSerializer
	filter_backends = [DjangoFilterBackend]
	filterset_fields = ['proyecto', 'tipo']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsDocenteOrAbove()]
		return [IsAuthenticated()]


class AlineacionEstrategicaViewSet(viewsets.ModelViewSet):
	queryset = AlineacionEstrategica.objects.select_related('proyecto').all()
	serializer_class = AlineacionEstrategicaSerializer
	filter_backends = [DjangoFilterBackend]
	filterset_fields = ['proyecto']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsDocenteOrAbove()]
		return [IsAuthenticated()]


class FirmaResponsabilidadViewSet(viewsets.ModelViewSet):
	queryset = FirmaResponsabilidad.objects.select_related('proyecto', 'usuario__user').defer('usuario__foto')
	serializer_class = FirmaResponsabilidadSerializer
	filter_backends = [DjangoFilterBackend]
	filterset_fields = ['proyecto', 'usuario', 'tipo']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsDocenteOrAbove()]
		return [IsAuthenticated()]


class AnexoViewSet(viewsets.ModelViewSet):
	queryset = Anexo.objects.select_related('proyecto', 'subido_por__user').defer('subido_por__foto')
	serializer_class = AnexoSerializer
	filter_backends = [DjangoFilterBackend]
	filterset_fields = ['proyecto', 'tipo']

	def get_queryset(self):
		# Mismas reglas de visibilidad que el proyecto: sin esto, cualquier usuario
		# autenticado podía listar los anexos de todos los proyectos.
		return filtrar_por_rol(super().get_queryset(), self.request.user, prefijo='proyecto__')

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update'):
			return [IsDocenteOrAbove()]
		if self.action == 'destroy':
			return [IsCoordinadorOrAdmin()]
		return [IsAuthenticated()]

	def perform_create(self, serializer):
		subido_por = None
		user = self.request.user
		if hasattr(user, 'perfil'):
			subido_por = user.perfil
			proyecto = serializer.validated_data['proyecto']
			if subido_por.rol == 'DOCENTE' and proyecto.responsable_id != subido_por.pk:
				raise PermissionDenied('Solo puedes adjuntar anexos a los proyectos de los que eres responsable.')
		serializer.save(subido_por=subido_por)


class MarcoLogicoFilaViewSet(viewsets.ModelViewSet):
	queryset = MarcoLogicoFila.objects.select_related('proyecto').all()
	serializer_class = MarcoLogicoFilaSerializer
	filter_backends = [DjangoFilterBackend]
	filterset_fields = ['proyecto', 'nivel']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsDocenteOrAbove()]
		return [IsAuthenticated()]
