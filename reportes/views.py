from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from core.utils import api_response
from .services import (
    DashboardService,
    EstadisticasPublicasService,
    ReporteConvenioService,
    ReporteDocenteService,
    ReporteProgresoService,
    ReporteProyectoService,
)


class EstadisticasPublicasView(viewsets.GenericViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        data = EstadisticasPublicasService().obtener()
        return api_response(True, 'Estadísticas públicas.', data)


class ReportesViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]

    def _perfil_actual(self, request):
        return getattr(request.user, 'perfil', None)

    @action(detail=False, methods=['get'], url_path='dashboard')
    def dashboard(self, request):
        data = DashboardService().obtener_kpis(perfil=self._perfil_actual(request))
        return api_response(True, 'Datos del dashboard.', data)

    @action(detail=False, methods=['get'], url_path='proyectos')
    def reporte_proyectos(self, request):
        result = ReporteProyectoService().generar(
            estado=request.query_params.get('estado'),
            tipo=request.query_params.get('tipo'),
            carrera_id=request.query_params.get('carrera'),
            perfil=self._perfil_actual(request),
        )
        return api_response(True, f'{len(result)} proyectos encontrados.', result)

    @action(detail=False, methods=['get'], url_path='convenios')
    def reporte_convenios(self, request):
        result = ReporteConvenioService().generar(
            estado=request.query_params.get('estado'),
            tipo=request.query_params.get('tipo'),
            perfil=self._perfil_actual(request),
        )
        return api_response(True, f'{len(result)} convenios encontrados.', result)

    @action(detail=False, methods=['get'], url_path='progreso')
    def reporte_progreso(self, request):
        proyecto_id = request.query_params.get('proyecto')
        result = ReporteProgresoService().generar(
            proyecto_id=proyecto_id,
            perfil=self._perfil_actual(request),
        )
        return api_response(True, 'Reporte de progreso.', result)

    @action(detail=False, methods=['get'], url_path='docente')
    def reporte_docente(self, request):
        result = ReporteDocenteService().generar(perfil=self._perfil_actual(request))
        return api_response(True, 'Reporte del docente.', result)


class ReportesSchemasViewSet(viewsets.ViewSet):
	permission_classes = [IsAuthenticated]

	def list(self, request):
		routes = {
			'GET /api/v1/reportes/dashboard/': 'Dashboard con KPIs generales',
			'GET /api/v1/reportes/proyectos/': 'Reporte de proyectos (filtros: estado, tipo, carrera)',
			'GET /api/v1/reportes/convenios/': 'Reporte de convenios (filtros: estado, tipo)',
			'GET /api/v1/reportes/progreso/': 'Reporte de progreso de actividades (filtro: proyecto)',
			'GET /api/v1/reportes/docente/': 'Reporte personalizado del docente con datos agregados',
		}
		return Response({'success': True, 'message': 'Endpoints de reportes disponibles.', 'data': routes})
