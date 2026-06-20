from django.db import transaction
from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import IsCoordinadorOrAdmin, IsDocenteOrAbove
from core.utils import api_response

from auditoria.utils import registrar_desde_request
from auditoria.models import TipoAccion as AuditoriaAccion

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
from .services import ProyectoWorkflowService, IndicadorMedicionService

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter


class ProyectoViewSet(viewsets.ModelViewSet):
	queryset = Proyecto.objects.select_related('carrera', 'responsable').all()

	def get_queryset(self):
		qs = super().get_queryset()
		user = self.request.user
		if hasattr(user, 'perfil'):
			rol = user.perfil.rol
			if rol == 'DOCENTE':
				qs = qs.filter(responsable=user.perfil)
			elif rol == 'ESTUDIANTE':
				qs = qs.filter(participantes__usuario=user.perfil).distinct()
		if self.action == 'list':
			qs = qs.annotate(
				actividades_count=Count('actividades', distinct=True),
				objetivos_count=Count('objetivos', distinct=True),
			)
		return qs
	filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
	filterset_fields = ['estado', 'tipo', 'prioridad', 'carrera', 'activo']
	search_fields = ['codigo', 'titulo', 'descripcion', 'responsable__user__username']
	ordering_fields = ['codigo', 'titulo', 'estado', 'creado_en', 'fecha_inicio']

	def __init__(self, **kwargs):
		super().__init__(**kwargs)
		self.workflow = ProyectoWorkflowService()

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update'):
			return [IsDocenteOrAbove()]
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
			self.workflow.generar_codigo(proyecto)
			for nivel, _ in MarcoLogicoFila.NIVEL_CHOICES:
				MarcoLogicoFila.objects.get_or_create(proyecto=proyecto, nivel=nivel)

	@action(detail=True, methods=['post'], url_path='enviar-revision')
	def enviar_revision(self, request, pk=None):
		proyecto = self.get_object()
		try:
			self.workflow.enviar_revision(proyecto)
		except ValueError as e:
			return api_response(False, str(e), http_status=status.HTTP_400_BAD_REQUEST)
		registrar_desde_request(request, AuditoriaAccion.ACTUALIZAR, 'Proyecto', proyecto.pk, f'Proyecto {proyecto.codigo} enviado a revisión')
		return api_response(True, 'Proyecto enviado a revision.', ProyectoDetailSerializer(proyecto).data)

	@action(detail=True, methods=['post'], url_path='aprobar')
	def aprobar(self, request, pk=None):
		proyecto = self.get_object()
		try:
			self.workflow.aprobar(proyecto)
		except ValueError as e:
			return api_response(False, str(e), http_status=status.HTTP_400_BAD_REQUEST)
		registrar_desde_request(request, AuditoriaAccion.APROBAR, 'Proyecto', proyecto.pk, f'Proyecto {proyecto.codigo} aprobado')
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
	queryset = Objetivo.objects.select_related('proyecto').all()
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
	queryset = Actividad.objects.select_related('proyecto', 'responsable').all()
	serializer_class = ActividadSerializer
	filter_backends = [DjangoFilterBackend, OrderingFilter]
	filterset_fields = ['proyecto', 'estado', 'responsable']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update'):
			return [IsDocenteOrAbove()]
		if self.action == 'destroy':
			return [IsCoordinadorOrAdmin()]
		return [IsAuthenticated()]


class ParticipanteProyectoViewSet(viewsets.ModelViewSet):
	queryset = ParticipanteProyecto.objects.select_related('proyecto', 'usuario').all()
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
	queryset = FirmaResponsabilidad.objects.select_related('proyecto', 'usuario').all()
	serializer_class = FirmaResponsabilidadSerializer
	filter_backends = [DjangoFilterBackend]
	filterset_fields = ['proyecto', 'usuario', 'tipo']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsDocenteOrAbove()]
		return [IsAuthenticated()]


class AnexoViewSet(viewsets.ModelViewSet):
	queryset = Anexo.objects.select_related('proyecto', 'subido_por').all()
	serializer_class = AnexoSerializer
	filter_backends = [DjangoFilterBackend]
	filterset_fields = ['proyecto', 'tipo']

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
