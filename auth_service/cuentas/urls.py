from django.urls import path
from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register('cuentas', views.CuentaViewSet, basename='cuenta')

urlpatterns = router.urls + [
	path('accesos/', views.AccesosView.as_view(), name='accesos'),
	path('login/', views.LoginView.as_view(), name='login'),
	path('registro/', views.RegistroView.as_view(), name='registro'),
	path('refresh/', views.RefreshView.as_view(), name='refresh'),
	path('logout/', views.LogoutView.as_view(), name='logout'),
	path('me/', views.MeView.as_view(), name='me'),
]
