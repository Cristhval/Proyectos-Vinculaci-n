from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AuditoriaViewSet

router = DefaultRouter()
router.register(r'', AuditoriaViewSet, basename='auditoria')

urlpatterns = [
	path('', include(router.urls)),
]
