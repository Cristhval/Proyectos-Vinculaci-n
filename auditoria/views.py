from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from core.permissions import IsAdmin

from .models import Auditoria
from .serializers import AuditoriaSerializer


class AuditoriaViewSet(viewsets.ReadOnlyModelViewSet):
	queryset = Auditoria.objects.select_related('usuario', 'usuario__user').all()
	serializer_class = AuditoriaSerializer
	permission_classes = [IsAdmin]
	filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
	filterset_fields = ['usuario', 'accion', 'entidad', 'entidad_id']
	search_fields = [
		'entidad',
		'usuario__user__first_name',
		'usuario__user__last_name',
		'usuario__user__username',
		'usuario__codigo',
	]
	ordering_fields = ['creado_en', 'accion', 'entidad']
	ordering = ['-creado_en']

	def get_queryset(self):
		qs = super().get_queryset()
		fecha_desde = self.request.query_params.get('fecha_desde')
		fecha_hasta = self.request.query_params.get('fecha_hasta')
		if fecha_desde:
			qs = qs.filter(creado_en__date__gte=fecha_desde)
		if fecha_hasta:
			qs = qs.filter(creado_en__date__lte=fecha_hasta)
		return qs

	@action(detail=False, methods=['get'])
	def stats(self, request):
		today = timezone.now().date()
		qs = self.get_queryset()
		total = qs.count()
		hoy_qs = qs.filter(creado_en__date=today)
		acciones_hoy = hoy_qs.count()
		usuarios_hoy = hoy_qs.exclude(usuario=None).values('usuario').distinct().count()
		criticas = qs.filter(accion__in=['APROBAR', 'RECHAZAR', 'ELIMINAR']).count()
		return Response({
			'total': total,
			'acciones_hoy': acciones_hoy,
			'usuarios_activos_hoy': usuarios_hoy,
			'acciones_criticas': criticas,
		})
