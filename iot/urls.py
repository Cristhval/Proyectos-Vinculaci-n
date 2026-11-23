from django.urls import path

from .views import (
	DispositivoBajaView,
	DispositivoDetalleView,
	DispositivoRegenerarTokenView,
	DispositivosProyectoView,
	MedicionesDispositivoView,
	RecibirMedicionView,
)

urlpatterns = [
	path('proyectos/<int:proyecto_id>/dispositivos/', DispositivosProyectoView.as_view(), name='proyecto-dispositivos'),
	path('dispositivos/<int:pk>/', DispositivoDetalleView.as_view(), name='dispositivo-detalle'),
	path('dispositivos/<int:pk>/baja/', DispositivoBajaView.as_view(), name='dispositivo-baja'),
	path('dispositivos/<int:pk>/regenerar-token/', DispositivoRegenerarTokenView.as_view(), name='dispositivo-regenerar-token'),
	path('dispositivos/<int:pk>/mediciones/', MedicionesDispositivoView.as_view(), name='dispositivo-mediciones'),
	path('iot/mediciones/', RecibirMedicionView.as_view(), name='iot-mediciones'),
]
