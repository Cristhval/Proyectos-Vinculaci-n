from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsAdmin

from .models import Auditoria
from .serializers import AuditoriaSerializer


class AuditoriaViewSet(viewsets.ReadOnlyModelViewSet):
	queryset = Auditoria.objects.select_related('usuario').all()
	serializer_class = AuditoriaSerializer
	permission_classes = [IsAdmin]
	filter_backends = [DjangoFilterBackend]
	filterset_fields = ['usuario', 'accion', 'entidad', 'entidad_id']
