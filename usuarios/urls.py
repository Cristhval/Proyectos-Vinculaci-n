from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CarreraViewSet, UsuarioViewSet

router = DefaultRouter()
router.register(r'carreras', CarreraViewSet, basename='carrera')
router.register(r'usuarios', UsuarioViewSet, basename='usuario')

urlpatterns = [
	path('', include(router.urls)),
]
