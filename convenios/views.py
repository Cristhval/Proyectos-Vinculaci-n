from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count

from core.permissions import IsCoordinadorOrAdmin, IsDocenteOrAbove
from core.utils import api_response
from .services import ConvenioWorkflowService

from .models import (
	Compromiso,
	Contribucion,
	Convenio,
	Institucion,
	Producto,
	ProyectoConvenio,
)
from .serializers import (
	CompromisoSerializer,
	ContribucionSerializer,
	ConvenioDetailSerializer,
	ConvenioListSerializer,
	InstitucionSerializer,
	ProductoSerializer,
	ProyectoConvenioSerializer,
)


class InstitucionViewSet(viewsets.ModelViewSet):
	queryset = Institucion.objects.all()
	serializer_class = InstitucionSerializer
	filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
	filterset_fields = ['activa']
	search_fields = ['nombre', 'sigla', 'email']
	ordering_fields = ['nombre', 'creado_en']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsCoordinadorOrAdmin()]
		return [IsAuthenticated()]


class ConvenioViewSet(viewsets.ModelViewSet):
	queryset = Convenio.objects.select_related('institucion').annotate(
		proyectos_vinculados_count=Count('vinculaciones_proyecto')
	).all()
	filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
	filterset_fields = ['estado', 'tipo', 'institucion', 'activo']
	search_fields = ['codigo', 'entidad_contraparte', 'objeto']
	ordering_fields = ['codigo', 'estado', 'fecha_firma', 'creado_en']

	def __init__(self, **kwargs):
		super().__init__(**kwargs)
		self.workflow = ConvenioWorkflowService()

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsCoordinadorOrAdmin()]
		return [IsAuthenticated()]

	def get_serializer_class(self):
		if self.action == 'list':
			return ConvenioListSerializer
		return ConvenioDetailSerializer

	@action(detail=False, methods=['get'], url_path='siguiente-codigo')
	def siguiente_codigo(self, request):
		return api_response(True, 'Codigo disponible.', {'codigo': Convenio._siguiente_codigo()})

	@action(detail=True, methods=['post'], url_path='enviar-revision')
	def enviar_revision(self, request, pk=None):
		convenio = self.get_object()
		try:
			self.workflow.enviar_revision(convenio)
		except ValueError as e:
			return api_response(False, str(e), http_status=status.HTTP_400_BAD_REQUEST)
		return api_response(True, 'Convenio enviado a revision.', ConvenioDetailSerializer(convenio).data)

	@action(detail=True, methods=['post'], url_path='aprobar')
	def aprobar(self, request, pk=None):
		convenio = self.get_object()
		try:
			self.workflow.aprobar(convenio)
		except ValueError as e:
			return api_response(False, str(e), http_status=status.HTTP_400_BAD_REQUEST)
		return api_response(True, 'Convenio aprobado (vigente).', ConvenioDetailSerializer(convenio).data)

	@action(detail=True, methods=['post'], url_path='rechazar')
	def rechazar(self, request, pk=None):
		convenio = self.get_object()
		try:
			self.workflow.rechazar(convenio)
		except ValueError as e:
			return api_response(False, str(e), http_status=status.HTTP_400_BAD_REQUEST)
		return api_response(True, 'Convenio devuelto a borrador.', ConvenioDetailSerializer(convenio).data)

	@action(detail=True, methods=['post'], url_path='suspender')
	def suspender(self, request, pk=None):
		convenio = self.get_object()
		try:
			self.workflow.suspender(convenio)
		except ValueError as e:
			return api_response(False, str(e), http_status=status.HTTP_400_BAD_REQUEST)
		return api_response(True, 'Convenio suspendido.', ConvenioDetailSerializer(convenio).data)

	@action(detail=True, methods=['post'], url_path='finalizar')
	def finalizar(self, request, pk=None):
		convenio = self.get_object()
		try:
			self.workflow.finalizar(convenio)
		except ValueError as e:
			return api_response(False, str(e), http_status=status.HTTP_400_BAD_REQUEST)
		return api_response(True, 'Convenio finalizado.', ConvenioDetailSerializer(convenio).data)

	@action(detail=True, methods=['post'], url_path='cancelar')
	def cancelar(self, request, pk=None):
		convenio = self.get_object()
		try:
			self.workflow.cancelar(convenio)
		except ValueError as e:
			return api_response(False, str(e), http_status=status.HTTP_400_BAD_REQUEST)
		return api_response(True, 'Convenio cancelado.', ConvenioDetailSerializer(convenio).data)


class ProyectoConvenioViewSet(viewsets.ModelViewSet):
	queryset = ProyectoConvenio.objects.select_related('proyecto', 'convenio').all()
	serializer_class = ProyectoConvenioSerializer
	filter_backends = [DjangoFilterBackend]
	filterset_fields = ['proyecto', 'convenio', 'vigente']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsCoordinadorOrAdmin()]
		return [IsAuthenticated()]


class CompromisoViewSet(viewsets.ModelViewSet):
	queryset = Compromiso.objects.select_related('convenio', 'responsable').all()
	serializer_class = CompromisoSerializer
	filter_backends = [DjangoFilterBackend, OrderingFilter]
	filterset_fields = ['convenio', 'estado', 'responsable']
	ordering_fields = ['fecha_vencimiento', 'estado', 'creado_en']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsDocenteOrAbove()]
		return [IsAuthenticated()]


class ProductoViewSet(viewsets.ModelViewSet):
	queryset = Producto.objects.select_related('convenio').all()
	serializer_class = ProductoSerializer
	filter_backends = [DjangoFilterBackend, OrderingFilter]
	filterset_fields = ['convenio', 'entregado']
	ordering_fields = ['fecha_entrega_esperada', 'creado_en']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsDocenteOrAbove()]
		return [IsAuthenticated()]


class ContribucionViewSet(viewsets.ModelViewSet):
	queryset = Contribucion.objects.select_related('proyecto', 'institucion').all()
	serializer_class = ContribucionSerializer
	filter_backends = [DjangoFilterBackend, OrderingFilter]
	filterset_fields = ['proyecto', 'institucion', 'tipo']
	ordering_fields = ['fecha_aporte', 'valor', 'creado_en']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsDocenteOrAbove()]
		return [IsAuthenticated()]
