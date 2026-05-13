from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
	AlertaViewSet,
	AvanceViewSet,
	EvidenciaViewSet,
	FlujoValidacionViewSet,
	InformeViewSet,
	RevisionViewSet,
)

router = DefaultRouter()
router.register(r'avances', AvanceViewSet, basename='avance')
router.register(r'evidencias', EvidenciaViewSet, basename='evidencia')
router.register(r'informes', InformeViewSet, basename='informe')
router.register(r'alertas', AlertaViewSet, basename='alerta')
router.register(r'revisiones', RevisionViewSet, basename='revision')
router.register(r'flujos-validacion', FlujoValidacionViewSet, basename='flujo_validacion')

urlpatterns = [
	path('', include(router.urls)),
]
