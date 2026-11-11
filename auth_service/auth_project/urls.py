from django.contrib import admin
from django.urls import include, path

from cuentas.views import jwks_view, salud_view

urlpatterns = [
	path('admin/', admin.site.urls),
	path('.well-known/jwks.json', jwks_view, name='jwks'),
	path('salud/', salud_view, name='salud'),
	path('api/auth/', include('cuentas.urls')),
]
