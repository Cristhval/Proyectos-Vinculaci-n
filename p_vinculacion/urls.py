from django.urls import path

from .views import LoginAPIView, ProyectoListCreateAPIView, ProyectoRetrieveAPIView, RegisterAPIView


urlpatterns = [
	path('auth/register/', RegisterAPIView.as_view(), name='auth_register'),
	path('auth/login/', LoginAPIView.as_view(), name='auth_login'),
	path('proyectos/', ProyectoListCreateAPIView.as_view(), name='proyecto_list_create'),
	path('proyectos/<int:pk>/', ProyectoRetrieveAPIView.as_view(), name='proyecto_detail'),
]
