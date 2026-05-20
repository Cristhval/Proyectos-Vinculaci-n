from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.utils import api_response
from .services import (
    DashboardService,
    ReporteConvenioService,
    ReporteProgresoService,
    ReporteProyectoService,
)


class ReportesViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='dashboard')
    def dashboard(self, request):
        data = DashboardService().obtener_kpis()
        return api_response(True, 'Datos del dashboard.', data)

    @action(detail=False, methods=['get'], url_path='proyectos')
    def reporte_proyectos(self, request):
        result = ReporteProyectoService().generar(
            estado=request.query_params.get('estado'),
            tipo=request.query_params.get('tipo'),
            carrera_id=request.query_params.get('carrera'),
        )
        return api_response(True, f'{len(result)} proyectos encontrados.', result)

    @action(detail=False, methods=['get'], url_path='convenios')
    def reporte_convenios(self, request):
        result = ReporteConvenioService().generar(
            estado=request.query_params.get('estado'),
            tipo=request.query_params.get('tipo'),
        )
        return api_response(True, f'{len(result)} convenios encontrados.', result)

    @action(detail=False, methods=['get'], url_path='progreso')
    def reporte_progreso(self, request):
        proyecto_id = request.query_params.get('proyecto')
        result = ReporteProgresoService().generar(proyecto_id=proyecto_id)
        return api_response(True, 'Reporte de progreso.', result)


class ReportesSchemasViewSet(viewsets.ViewSet):
	permission_classes = [IsAuthenticated]

	def list(self, request):
		routes = {
			'GET /api/v1/reportes/dashboard/': 'Dashboard con KPIs generales',
			'GET /api/v1/reportes/proyectos/': 'Reporte de proyectos (filtros: estado, tipo, carrera)',
			'GET /api/v1/reportes/convenios/': 'Reporte de convenios (filtros: estado, tipo)',
			'GET /api/v1/reportes/progreso/': 'Reporte de progreso de actividades (filtro: proyecto)',
		}
		return Response({'success': True, 'message': 'Endpoints de reportes disponibles.', 'data': routes})
