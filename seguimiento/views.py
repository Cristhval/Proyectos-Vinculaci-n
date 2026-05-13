from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsCoordinadorOrAdmin, IsDocenteOrAbove
from core.utils import api_response

from .models import (
	Alerta,
	Avance,
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

	@action(detail=True, methods=['post'], url_path='aprobar')
	def aprobar(self, request, pk=None):
		avance = self.get_object()
		avance.estado = EstadoAvance.APROBADO
		avance.save(update_fields=['estado', 'actualizado_en'])
		return api_response(True, 'Avance aprobado.', AvanceSerializer(avance).data)

	@action(detail=True, methods=['post'], url_path='rechazar')
	def rechazar(self, request, pk=None):
		avance = self.get_object()
		avance.estado = EstadoAvance.RECHAZADO
		avance.save(update_fields=['estado', 'actualizado_en'])
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
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsDocenteOrAbove()]
		return [IsAuthenticated()]

	def get_serializer_class(self):
		if self.action == 'list':
			return InformeListSerializer
		return InformeDetailSerializer


class AlertaViewSet(viewsets.ReadOnlyModelViewSet):
	queryset = Alerta.objects.select_related('usuario', 'proyecto', 'convenio').all()
	serializer_class = AlertaSerializer
	filter_backends = [DjangoFilterBackend, OrderingFilter]
	filterset_fields = ['usuario', 'proyecto', 'convenio', 'estado', 'prioridad']
	ordering_fields = ['fecha_vencimiento', 'prioridad', 'creado_en']

	def get_queryset(self):
		qs = super().get_queryset()
		if hasattr(self.request.user, 'perfil'):
			return qs.filter(usuario=self.request.user.perfil)
		return qs

	@action(detail=True, methods=['post'], url_path='leer')
	def marcar_leida(self, request, pk=None):
		alerta = self.get_object()
		alerta.leida = True
		alerta.estado = alerta.EstadoAlerta.LEIDA
		alerta.save(update_fields=['leida', 'estado', 'actualizado_en'])
		return api_response(True, 'Alerta marcada como leida.', AlertaSerializer(alerta).data)

	@action(detail=True, methods=['post'], url_path='atender')
	def atender(self, request, pk=None):
		alerta = self.get_object()
		alerta.estado = alerta.EstadoAlerta.ATENDIDA
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
