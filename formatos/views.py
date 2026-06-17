from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated

from core.permissions import IsAdmin, PermissionMapMixin

from .models import FormatoInstitucional
from .serializers import FormatoSerializer


class FormatoViewSet(PermissionMapMixin, viewsets.ModelViewSet):
	queryset = FormatoInstitucional.objects.filter(activo=True)
	serializer_class = FormatoSerializer
	filter_backends = [DjangoFilterBackend]
	filterset_fields = ['nivel', 'tipo']
	permission_map = {
		'create': [IsAdmin],
		'update': [IsAdmin],
		'partial_update': [IsAdmin],
		'destroy': [IsAdmin],
		'default': [IsAuthenticated],
	}
