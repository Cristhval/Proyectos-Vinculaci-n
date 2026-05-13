from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.db.models import Count, Sum, Q, Avg
from django.utils import timezone
from datetime import timedelta

from core.utils import api_response
from proyectos.models import Proyecto, EstadoProyecto, Actividad, EstadoActividad
from convenios.models import Convenio, EstadoConvenio, Compromiso
from seguimiento.models import Alerta


class ReportesViewSet(viewsets.GenericViewSet):
	permission_classes = [IsAuthenticated]

	@action(detail=False, methods=['get'], url_path='dashboard')
	def dashboard(self, request):
		hoy = timezone.now().date()
		proyectos_activos = Proyecto.objects.filter(
			estado__in=[EstadoProyecto.EN_EJECUCION, EstadoProyecto.EN_REVISION, EstadoProyecto.APROBADO],
			activo=True,
		).count()
		proyectos_finalizados = Proyecto.objects.filter(estado=EstadoProyecto.FINALIZADO).count()
		proyectos_por_estado = Proyecto.objects.values('estado').annotate(total=Count('id')).order_by('estado')
		proyectos_por_tipo = Proyecto.objects.values('tipo').annotate(total=Count('id')).order_by('tipo')
		actividades_atrasadas = Actividad.objects.filter(estado=EstadoActividad.ATRASADA).count()
		actividades_por_estado = Actividad.objects.values('estado').annotate(total=Count('id')).order_by('estado')
		convenios_activos = Convenio.objects.filter(estado=EstadoConvenio.VIGENTE).count()
		convenios_por_vencer = Convenio.objects.filter(
			estado=EstadoConvenio.VIGENTE,
			fecha_fin__lte=hoy + timedelta(days=90),
		).count()
		alertas_pendientes = Alerta.objects.filter(estado='PENDIENTE').count()
		compromisos_pendientes = Compromiso.objects.filter(estado='PENDIENTE').count()

		data = {
			'resumen': {
				'proyectos_activos': proyectos_activos,
				'proyectos_finalizados': proyectos_finalizados,
				'actividades_atrasadas': actividades_atrasadas,
				'convenios_activos': convenios_activos,
				'convenios_por_vencer': convenios_por_vencer,
				'alertas_pendientes': alertas_pendientes,
				'compromisos_pendientes': compromisos_pendientes,
			},
			'proyectos_por_estado': list(proyectos_por_estado),
			'proyectos_por_tipo': list(proyectos_por_tipo),
			'actividades_por_estado': list(actividades_por_estado),
		}
		return api_response(True, 'Datos del dashboard.', data)

	@action(detail=False, methods=['get'], url_path='proyectos')
	def reporte_proyectos(self, request):
		qs = Proyecto.objects.select_related('carrera', 'responsable').filter(activo=True)
		estado = request.query_params.get('estado')
		tipo = request.query_params.get('tipo')
		carrera_id = request.query_params.get('carrera')
		if estado:
			qs = qs.filter(estado=estado)
		if tipo:
			qs = qs.filter(tipo=tipo)
		if carrera_id:
			qs = qs.filter(carrera_id=carrera_id)

		result = []
		for p in qs:
			result.append({
				'id': p.id,
				'codigo': p.codigo,
				'titulo': p.titulo,
				'estado': p.estado,
				'tipo': p.tipo,
				'carrera': str(p.carrera) if p.carrera else None,
				'responsable': str(p.responsable) if p.responsable else None,
				'fecha_inicio': p.fecha_inicio,
				'fecha_fin_planificada': p.fecha_fin_planificada,
				'presupuesto_aprobado': str(p.presupuesto_aprobado),
				'actividades_count': p.actividades.count(),
				'objetivos_count': p.objetivos.count(),
				'progreso': p.actividades.aggregate(avg=Avg('porcentaje_ejecucion'))['avg'] or 0,
			})
		return api_response(True, f'{len(result)} proyectos encontrados.', result)

	@action(detail=False, methods=['get'], url_path='convenios')
	def reporte_convenios(self, request):
		qs = Convenio.objects.select_related('institucion').filter(activo=True)
		estado = request.query_params.get('estado')
		tipo = request.query_params.get('tipo')
		if estado:
			qs = qs.filter(estado=estado)
		if tipo:
			qs = qs.filter(tipo=tipo)

		result = []
		for c in qs:
			result.append({
				'id': c.id,
				'codigo': c.codigo,
				'entidad_contraparte': c.entidad_contraparte,
				'estado': c.estado,
				'tipo': c.tipo,
				'fecha_firma': c.fecha_firma,
				'fecha_fin': c.fecha_fin,
				'compromisos_count': c.compromisos.count(),
				'productos_count': c.productos.count(),
			})
		return api_response(True, f'{len(result)} convenios encontrados.', result)

	@action(detail=False, methods=['get'], url_path='progreso')
	def reporte_progreso(self, request):
		proyecto_id = request.query_params.get('proyecto')
		qs = Proyecto.objects.filter(activo=True)
		if proyecto_id:
			qs = qs.filter(id=proyecto_id)

		result = []
		for p in qs.prefetch_related('actividades'):
			actividades_data = []
			for a in p.actividades.all():
				actividades_data.append({
					'codigo': a.codigo,
					'nombre': a.nombre,
					'estado': a.estado,
					'porcentaje_programado': str(a.porcentaje_programado),
					'porcentaje_ejecucion': str(a.porcentaje_ejecucion),
					'fecha_inicio': a.fecha_inicio,
					'fecha_fin': a.fecha_fin,
				})
			result.append({
				'proyecto_codigo': p.codigo,
				'proyecto_titulo': p.titulo,
				'actividades': actividades_data,
			})
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
