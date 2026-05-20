from datetime import timedelta

from django.db.models import Avg, Count, Q
from django.utils import timezone

from convenios.models import Compromiso, Convenio, EstadoConvenio
from proyectos.models import Actividad, EstadoActividad, EstadoProyecto, Proyecto
from seguimiento.models import Alerta


class DashboardService:

    def obtener_kpis(self):
        hoy = timezone.now().date()
        return {
            'resumen': {
                'proyectos_activos': Proyecto.objects.filter(
                    estado__in=[EstadoProyecto.EN_EJECUCION, EstadoProyecto.EN_REVISION, EstadoProyecto.APROBADO],
                    activo=True,
                ).count(),
                'proyectos_finalizados': Proyecto.objects.filter(estado=EstadoProyecto.FINALIZADO).count(),
                'actividades_atrasadas': Actividad.objects.filter(estado=EstadoActividad.ATRASADA).count(),
                'convenios_activos': Convenio.objects.filter(estado=EstadoConvenio.VIGENTE).count(),
                'convenios_por_vencer': Convenio.objects.filter(
                    estado=EstadoConvenio.VIGENTE,
                    fecha_fin__lte=hoy + timedelta(days=90),
                ).count(),
                'alertas_pendientes': Alerta.objects.filter(estado='PENDIENTE').count(),
                'compromisos_pendientes': Compromiso.objects.filter(estado='PENDIENTE').count(),
            },
            'proyectos_por_estado': list(
                Proyecto.objects.values('estado').annotate(total=Count('id')).order_by('estado')
            ),
            'proyectos_por_tipo': list(
                Proyecto.objects.values('tipo').annotate(total=Count('id')).order_by('tipo')
            ),
            'actividades_por_estado': list(
                Actividad.objects.values('estado').annotate(total=Count('id')).order_by('estado')
            ),
        }


class ReporteProyectoService:

    def generar(self, estado=None, tipo=None, carrera_id=None):
        qs = Proyecto.objects.select_related('carrera', 'responsable').filter(activo=True)
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
        return result


class ReporteConvenioService:

    def generar(self, estado=None, tipo=None):
        qs = Convenio.objects.select_related('institucion').filter(activo=True)
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
        return result


class ReporteProgresoService:

    def generar(self, proyecto_id=None):
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
        return result
