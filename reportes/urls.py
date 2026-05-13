from django.urls import path

from .views import ReportesSchemasViewSet, ReportesViewSet

urlpatterns = [
	path('', ReportesSchemasViewSet.as_view({'get': 'list'}), name='reportes_index'),
	path('dashboard/', ReportesViewSet.as_view({'get': 'dashboard'}), name='reportes_dashboard'),
	path('proyectos/', ReportesViewSet.as_view({'get': 'reporte_proyectos'}), name='reportes_proyectos'),
	path('convenios/', ReportesViewSet.as_view({'get': 'reporte_convenios'}), name='reportes_convenios'),
	path('progreso/', ReportesViewSet.as_view({'get': 'reporte_progreso'}), name='reportes_progreso'),
]
