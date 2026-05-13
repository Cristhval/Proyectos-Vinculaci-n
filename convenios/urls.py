from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
	CompromisoViewSet,
	ContribucionViewSet,
	ConvenioViewSet,
	InstitucionViewSet,
	ProductoViewSet,
	ProyectoConvenioViewSet,
)

router = DefaultRouter()
router.register(r'instituciones', InstitucionViewSet, basename='institucion')
router.register(r'convenios', ConvenioViewSet, basename='convenio')
router.register(r'proyecto-convenios', ProyectoConvenioViewSet, basename='proyecto_convenio')
router.register(r'compromisos', CompromisoViewSet, basename='compromiso')
router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'contribuciones', ContribucionViewSet, basename='contribucion')

urlpatterns = [
	path('', include(router.urls)),
]
