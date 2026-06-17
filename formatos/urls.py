from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FormatoViewSet

router = DefaultRouter()
router.register(r'formatos', FormatoViewSet, basename='formato')

urlpatterns = [
	path('', include(router.urls)),
]
