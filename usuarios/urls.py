from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CarreraViewSet, UsuarioViewSet, foto_publica

router = DefaultRouter()
router.register(r'carreras', CarreraViewSet, basename='carrera')
router.register(r'usuarios', UsuarioViewSet, basename='usuario')

urlpatterns = [
	path('usuarios/foto/<str:token>/', foto_publica, name='usuario_foto'),
	path('', include(router.urls)),
]
