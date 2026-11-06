from django.urls import path
from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register('cuentas', views.CuentaViewSet, basename='cuenta')

urlpatterns = router.urls + [
	path('accesos/', views.AccesosView.as_view(), name='accesos'),
	path('password/solicitar/', views.SolicitarRecuperacionView.as_view(), name='password_solicitar'),
	path('password/restablecer/', views.RestablecerView.as_view(), name='password_restablecer'),
	path('social/proveedores/', views.ProveedoresView.as_view(), name='social_proveedores'),
	path('social/canjear/', views.CanjearView.as_view(), name='social_canjear'),
	path('social/<str:proveedor>/iniciar/', views.social_iniciar, name='social_iniciar'),
	path('social/<str:proveedor>/callback/', views.social_callback, name='social_callback'),
	path('login/', views.LoginView.as_view(), name='login'),
	path('registro/', views.RegistroView.as_view(), name='registro'),
	path('verificar-email/', views.VerificarEmailView.as_view(), name='verificar_email'),
	path('refresh/', views.RefreshView.as_view(), name='refresh'),
	path('logout/', views.LogoutView.as_view(), name='logout'),
	path('me/', views.MeView.as_view(), name='me'),
]
