from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
	ActividadViewSet,
	AlineacionEstrategicaViewSet,
	AnexoViewSet,
	BeneficiarioViewSet,
	FirmaResponsabilidadViewSet,
	IndicadorViewSet,
	MarcoLogicoFilaViewSet,
	ObjetivoViewSet,
	ParticipanteProyectoViewSet,
	PresupuestoViewSet,
	ProyectoViewSet,
)

router = DefaultRouter()
router.register(r'proyectos', ProyectoViewSet, basename='proyecto')
router.register(r'objetivos', ObjetivoViewSet, basename='objetivo')
router.register(r'indicadores', IndicadorViewSet, basename='indicador')
router.register(r'actividades', ActividadViewSet, basename='actividad')
router.register(r'participantes', ParticipanteProyectoViewSet, basename='participante')
router.register(r'presupuestos', PresupuestoViewSet, basename='presupuesto')
router.register(r'beneficiarios', BeneficiarioViewSet, basename='beneficiario')
router.register(r'alineaciones', AlineacionEstrategicaViewSet, basename='alineacion')
router.register(r'firmas', FirmaResponsabilidadViewSet, basename='firma')
router.register(r'anexos', AnexoViewSet, basename='anexo')
router.register(r'marco-logico', MarcoLogicoFilaViewSet, basename='marco-logico')

urlpatterns = [
	path('', include(router.urls)),
]
