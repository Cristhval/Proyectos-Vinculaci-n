from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import IsCoordinadorOrAdmin, IsDocenteOrAbove
from core.utils import api_response

from .models import (
	Actividad,
	AlineacionEstrategica,
	Beneficiario,
	FirmaResponsabilidad,
	Indicador,
	Objetivo,
	ParticipanteProyecto,
	Presupuesto,
	Proyecto,
	EstadoProyecto,
)
from .serializers import (
	ActividadSerializer,
	AlineacionEstrategicaSerializer,
	BeneficiarioSerializer,
	FirmaResponsabilidadSerializer,
	IndicadorSerializer,
	ObjetivoSerializer,
	ParticipanteProyectoSerializer,
	PresupuestoSerializer,
	ProyectoCreateUpdateSerializer,
	ProyectoDetailSerializer,
	ProyectoListSerializer,
)

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter


class ProyectoViewSet(viewsets.ModelViewSet):
	queryset = Proyecto.objects.select_related('carrera', 'responsable').all()
	filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
	filterset_fields = ['estado', 'tipo', 'prioridad', 'carrera', 'activo']
	search_fields = ['codigo', 'titulo', 'descripcion', 'responsable__user__username']
	ordering_fields = ['codigo', 'titulo', 'estado', 'creado_en', 'fecha_inicio']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
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
			if not proyecto.codigo:
				proyecto.codigo = f'PRJ-{proyecto.id:05d}'
				proyecto.save(update_fields=['codigo'])

	@action(detail=True, methods=['post'], url_path='enviar-revision')
	def enviar_revision(self, request, pk=None):
		proyecto = self.get_object()
		if proyecto.estado != EstadoProyecto.BORRADOR:
			return api_response(False, 'Solo proyectos en borrador pueden enviarse a revision.', http_status=status.HTTP_400_BAD_REQUEST)
		proyecto.estado = EstadoProyecto.EN_REVISION
		proyecto.save(update_fields=['estado', 'actualizado_en'])
		return api_response(True, 'Proyecto enviado a revision.', ProyectoDetailSerializer(proyecto).data)

	@action(detail=True, methods=['post'], url_path='aprobar')
	def aprobar(self, request, pk=None):
		proyecto = self.get_object()
		if proyecto.estado not in (EstadoProyecto.EN_REVISION, EstadoProyecto.EN_SUSPENSION):
			return api_response(False, 'Solo proyectos en revision o suspension pueden aprobarse.', http_status=status.HTTP_400_BAD_REQUEST)
		proyecto.estado = EstadoProyecto.APROBADO
		proyecto.save(update_fields=['estado', 'actualizado_en'])
		return api_response(True, 'Proyecto aprobado.', ProyectoDetailSerializer(proyecto).data)

	@action(detail=True, methods=['post'], url_path='rechazar')
	def rechazar(self, request, pk=None):
		proyecto = self.get_object()
		if proyecto.estado != EstadoProyecto.EN_REVISION:
			return api_response(False, 'Solo proyectos en revision pueden rechazarse.', http_status=status.HTTP_400_BAD_REQUEST)
		proyecto.estado = EstadoProyecto.BORRADOR
		proyecto.save(update_fields=['estado', 'actualizado_en'])
		return api_response(True, 'Proyecto devuelto a borrador.', ProyectoDetailSerializer(proyecto).data)


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
		indicador.valor_actual = valor
		from django.utils import timezone
		indicador.fecha_medicion = timezone.now().date()
		if indicador.valor_actual >= indicador.meta and indicador.meta > 0:
			indicador.estado = indicador.EstadoIndicador.CUMPLIDO
		indicador.save()
		return api_response(True, 'Medicion registrada.', IndicadorSerializer(indicador).data)


class ActividadViewSet(viewsets.ModelViewSet):
	queryset = Actividad.objects.select_related('proyecto', 'responsable').all()
	serializer_class = ActividadSerializer
	filter_backends = [DjangoFilterBackend, OrderingFilter]
	filterset_fields = ['proyecto', 'estado', 'responsable']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsDocenteOrAbove()]
		return [IsAuthenticated()]


class ParticipanteProyectoViewSet(viewsets.ModelViewSet):
	queryset = ParticipanteProyecto.objects.select_related('proyecto', 'usuario').all()
	serializer_class = ParticipanteProyectoSerializer
	filter_backends = [DjangoFilterBackend]
	filterset_fields = ['proyecto', 'usuario', 'rol']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsCoordinadorOrAdmin()]
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
			return [IsCoordinadorOrAdmin()]
		return [IsAuthenticated()]
