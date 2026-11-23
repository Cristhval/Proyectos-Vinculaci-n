from django.urls import path

from .views import (
	DispositivoBajaView,
	DispositivoDetalleView,
	DispositivoRegenerarTokenView,
	DispositivosProyectoView,
)

urlpatterns = [
	path('proyectos/<int:proyecto_id>/dispositivos/', DispositivosProyectoView.as_view(), name='proyecto-dispositivos'),
	path('dispositivos/<int:pk>/', DispositivoDetalleView.as_view(), name='dispositivo-detalle'),
	path('dispositivos/<int:pk>/baja/', DispositivoBajaView.as_view(), name='dispositivo-baja'),
	path('dispositivos/<int:pk>/regenerar-token/', DispositivoRegenerarTokenView.as_view(), name='dispositivo-regenerar-token'),
]
