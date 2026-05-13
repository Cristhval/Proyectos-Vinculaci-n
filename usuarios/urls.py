from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CarreraViewSet, LoginAPIView, RegisterAPIView, TokenRefreshAPIView, UsuarioViewSet

router = DefaultRouter()
router.register(r'carreras', CarreraViewSet, basename='carrera')
router.register(r'usuarios', UsuarioViewSet, basename='usuario')

urlpatterns = [
	path('auth/register/', RegisterAPIView.as_view(), name='auth_register'),
	path('auth/login/', LoginAPIView.as_view(), name='auth_login'),
	path('auth/refresh/', TokenRefreshAPIView.as_view(), name='auth_refresh'),
	path('', include(router.urls)),
]
