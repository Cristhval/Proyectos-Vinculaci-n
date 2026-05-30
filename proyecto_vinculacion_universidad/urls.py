from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
	path('', RedirectView.as_view(url='/api/docs/', permanent=False), name='index'),
	path('admin/', admin.site.urls),
	path('api/v1/', include('usuarios.urls')),
	path('api/v1/', include('proyectos.urls')),
	path('api/v1/', include('convenios.urls')),
	path('api/v1/', include('seguimiento.urls')),
	path('api/v1/reportes/', include('reportes.urls')),
	path('api/v1/auditoria/', include('auditoria.urls')),

	path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
	path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
	path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
	urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
