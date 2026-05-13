from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsCoordinadorOrAdmin, IsDocenteOrAbove

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
	queryset = Institucion.objects.filter(activa=True)
	serializer_class = InstitucionSerializer
	filter_backends = [SearchFilter, OrderingFilter]
	search_fields = ['nombre', 'sigla', 'email']
	ordering_fields = ['nombre', 'creado_en']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsCoordinadorOrAdmin()]
		return [IsAuthenticated()]


class ConvenioViewSet(viewsets.ModelViewSet):
	queryset = Convenio.objects.select_related('institucion').all()
	filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
	filterset_fields = ['estado', 'tipo', 'institucion', 'activo']
	search_fields = ['codigo', 'entidad_contraparte', 'objeto']
	ordering_fields = ['codigo', 'estado', 'fecha_firma', 'creado_en']

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsCoordinadorOrAdmin()]
		return [IsAuthenticated()]

	def get_serializer_class(self):
		if self.action == 'list':
			return ConvenioListSerializer
		return ConvenioDetailSerializer


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
