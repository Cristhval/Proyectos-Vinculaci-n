from datetime import timedelta

from django.db.models import Avg, Count, FloatField, Q, Sum, Value
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone

from convenios.models import Compromiso, Convenio, EstadoConvenio, ProyectoConvenio
from proyectos.models import (
	Actividad,
	Beneficiario,
	EstadoActividad,
	EstadoIndicador,
	EstadoProyecto,
	Indicador,
	Objetivo,
	ParticipanteProyecto,
	Presupuesto,
	Proyecto,
	RolParticipante,
)
from seguimiento.models import Alerta, Avance, EstadoAvance, Evidencia, Informe
from usuarios.models import RolUsuario


def _proyectos_del_perfil(qs, perfil):
	"""Filtra un queryset de Proyecto para que solo incluya los del perfil indicado."""
	if not perfil or perfil.rol == RolUsuario.ADMIN:
		return qs
	if perfil.rol == RolUsuario.DOCENTE:
		return qs.filter(responsable=perfil)
	return qs.filter(Q(responsable=perfil) | Q(coordinador_academico=perfil))


def _convenios_del_perfil(qs, perfil):
    """Filtra un queryset de Convenio para que solo incluya los vinculados a proyectos del perfil."""
    if not perfil or perfil.rol == RolUsuario.ADMIN:
        return qs
    proyecto_ids = _proyectos_del_perfil(Proyecto.objects.all(), perfil).values_list('id', flat=True)
    convenio_ids = ProyectoConvenio.objects.filter(proyecto_id__in=proyecto_ids).values_list('convenio_id', flat=True)
    return qs.filter(id__in=convenio_ids)


class DashboardService:

    def obtener_kpis(self, perfil=None):
        hoy = timezone.now().date()
        proyectos_qs = _proyectos_del_perfil(Proyecto.objects.all(), perfil)
        convenios_qs = _convenios_del_perfil(Convenio.objects.filter(activo=True), perfil)

        alertas_qs = Alerta.objects.filter(estado='PENDIENTE')
        if perfil and perfil.rol != RolUsuario.ADMIN:
            alertas_qs = alertas_qs.filter(usuario=perfil)

        compromisos_qs = Compromiso.objects.filter(estado='PENDIENTE')
        if perfil and perfil.rol != RolUsuario.ADMIN:
            compromisos_qs = compromisos_qs.filter(convenio__in=convenios_qs)

        return {
            'resumen': {
                'proyectos_activos': proyectos_qs.filter(
                    estado__in=[EstadoProyecto.EN_EJECUCION, EstadoProyecto.EN_REVISION, EstadoProyecto.APROBADO],
                ).count(),
                'proyectos_finalizados': proyectos_qs.filter(estado=EstadoProyecto.FINALIZADO).count(),
                'actividades_atrasadas': Actividad.objects.filter(
                    estado=EstadoActividad.ATRASADA,
                    proyecto__in=proyectos_qs,
                ).count(),
                'convenios_activos': convenios_qs.filter(estado=EstadoConvenio.VIGENTE).count(),
                'convenios_por_vencer': convenios_qs.filter(
                    estado=EstadoConvenio.VIGENTE,
                    fecha_fin__lte=hoy + timedelta(days=90),
                ).count(),
                'alertas_pendientes': alertas_qs.count(),
                'compromisos_pendientes': compromisos_qs.count(),
            },
            'proyectos_por_estado': list(
                proyectos_qs.values('estado').annotate(total=Count('id')).order_by('estado')
            ),
            'proyectos_por_tipo': list(
                proyectos_qs.values('tipo').annotate(total=Count('id')).order_by('tipo')
            ),
            'actividades_por_estado': list(
                Actividad.objects.filter(proyecto__in=proyectos_qs).values('estado').annotate(total=Count('id')).order_by('estado')
            ),
        }


class ReporteProyectoService:

    def generar(self, estado=None, tipo=None, carrera_id=None, perfil=None):
        qs = _proyectos_del_perfil(
            Proyecto.objects.select_related('carrera', 'responsable').all(),
            perfil,
        )
        if estado:
            qs = qs.filter(estado=estado)
        if tipo:
            qs = qs.filter(tipo=tipo)
        if carrera_id:
            qs = qs.filter(carrera_id=carrera_id)
        qs = qs.annotate(
            _actividades_count=Count('actividades', distinct=True),
            _objetivos_count=Count('objetivos', distinct=True),
            _progreso=Coalesce(Avg('actividades__porcentaje_ejecucion'), Value(0), output_field=FloatField()),
        )
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
                'actividades_count': p._actividades_count,
                'objetivos_count': p._objetivos_count,
                'progreso': float(p._progreso),
            })
        return result


class ReporteConvenioService:

    def generar(self, estado=None, tipo=None, perfil=None):
        qs = _convenios_del_perfil(
            Convenio.objects.select_related('institucion').filter(activo=True),
            perfil,
        )
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

    def generar(self, proyecto_id=None, perfil=None):
        qs = _proyectos_del_perfil(Proyecto.objects.all(), perfil)
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


class ReporteDocenteService:
    """Dashboard personalizado para el rol DOCENTE.
    Devuelve una sola estructura agregada con todos los datos
    que consume el panel del docente (KPIs, cronograma,
    presupuesto, participantes, evidencias, etc.).
    """

    def generar(self, perfil=None):
        proyectos_qs = _proyectos_del_perfil(
            Proyecto.objects.select_related('carrera', 'responsable').all(),
            perfil,
        ).annotate(
            _actividades_count=Count('actividades', distinct=True),
            _objetivos_count=Count('objetivos', distinct=True),
            _progreso=Coalesce(
                Avg('actividades__porcentaje_ejecucion'),
                Value(0),
                output_field=FloatField(),
            ),
        )

        proyectos_data = []
        cronograma = []
        for p in proyectos_qs:
            presupuesto_aprobado = float(p.presupuesto_aprobado or 0)
            proyectos_data.append({
                'id': p.id,
                'codigo': p.codigo,
                'titulo': p.titulo,
                'estado': p.estado,
                'tipo': p.tipo,
                'carrera': str(p.carrera) if p.carrera else None,
                'carrera_id': p.carrera_id,
                'responsable': str(p.responsable) if p.responsable else None,
                'fecha_inicio': p.fecha_inicio.isoformat() if p.fecha_inicio else None,
                'fecha_fin_planificada': p.fecha_fin_planificada.isoformat() if p.fecha_fin_planificada else None,
                'presupuesto_aprobado': str(presupuesto_aprobado),
                'actividades_count': p._actividades_count,
                'objetivos_count': p._objetivos_count,
                'progreso': float(p._progreso),
            })
            if p.fecha_inicio and p.fecha_fin_planificada:
                cronograma.append({
                    'codigo': p.codigo,
                    'titulo': p.titulo,
                    'estado': p.estado,
                    'fecha_inicio': p.fecha_inicio.isoformat(),
                    'fecha_fin_planificada': p.fecha_fin_planificada.isoformat(),
                    'progreso': float(p._progreso),
                })

        # ─────────── PRESUPUESTO AGREGADO ───────────
        presupuesto_agg = Presupuesto.objects.filter(proyecto__in=proyectos_qs).aggregate(
            aprobado=Coalesce(Sum('monto_aprobado'), Value(0), output_field=FloatField()),
            ejecutado=Coalesce(Sum('monto_ejecutado'), Value(0), output_field=FloatField()),
            unl_valorado=Coalesce(Sum('monto_unl_valorado'), Value(0), output_field=FloatField()),
            unl_economico=Coalesce(Sum('monto_unl_economico'), Value(0), output_field=FloatField()),
            externo_valorado=Coalesce(Sum('monto_externo_valorado'), Value(0), output_field=FloatField()),
            externo_economico=Coalesce(Sum('monto_externo_economico'), Value(0), output_field=FloatField()),
        )
        presupuesto_aprobado_total = float(presupuesto_agg['aprobado'] or 0)
        presupuesto_ejecutado_total = float(presupuesto_agg['ejecutado'] or 0)
        presupuesto_saldo_total = max(presupuesto_aprobado_total - presupuesto_ejecutado_total, 0)

        # ─────────── PARTICIPANTES POR ROL ───────────
        participantes_por_rol = list(
            ParticipanteProyecto.objects.filter(proyecto__in=proyectos_qs)
            .values('rol')
            .annotate(total=Count('id'))
            .order_by('-total')
        )
        total_participantes = sum(p['total'] for p in participantes_por_rol)

        # ─────────── OBJETIVOS E INDICADORES ───────────
        objetivos_qs = Objetivo.objects.filter(proyecto__in=proyectos_qs)
        total_objetivos = objetivos_qs.count()
        objetivos_cumplidos = objetivos_qs.filter(cumplido=True).count()
        objetivos_pendientes = total_objetivos - objetivos_cumplidos

        indicadores_qs = Indicador.objects.filter(objetivo__proyecto__in=proyectos_qs)
        indicadores_por_estado = list(
            indicadores_qs.values('estado').annotate(total=Count('id')).order_by('-total')
        )
        total_indicadores = indicadores_qs.count()

        # ─────────── ACTIVIDADES POR ESTADO Y POR MES ───────────
        actividades_qs = Actividad.objects.filter(proyecto__in=proyectos_qs)
        actividades_por_estado = list(
            actividades_qs.values('estado').annotate(total=Count('id')).order_by('-total')
        )
        total_actividades = actividades_qs.count()
        actividades_atrasadas = actividades_qs.filter(estado=EstadoActividad.ATRASADA).count()
        actividades_completadas = actividades_qs.filter(estado=EstadoActividad.COMPLETADA).count()
        avance_promedio = (
            actividades_qs.aggregate(p=Avg('porcentaje_ejecucion'))['p'] or 0
        )

        # Carga mensual: actividades iniciadas por mes (últimos 6 meses)
        hoy = timezone.now().date()
        seis_meses_atras = hoy - timedelta(days=180)
        carga_mensual_qs = (
            actividades_qs.filter(fecha_inicio__gte=seis_meses_atras)
            .annotate(mes=TruncMonth('fecha_inicio'))
            .values('mes')
            .annotate(
                planificadas=Count('id'),
                ejecutadas=Count('id', filter=Q(porcentaje_ejecucion__gt=0)),
            )
            .order_by('mes')
        )
        carga_mensual = [
            {
                'mes': (c['mes'].isoformat() if c['mes'] else None),
                'planificadas': c['planificadas'],
                'ejecutadas': c['ejecutadas'],
            }
            for c in carga_mensual_qs
        ]

        # ─────────── EVIDENCIAS POR TIPO ───────────
        evidencias_por_tipo = list(
            Evidencia.objects.filter(actividad__proyecto__in=proyectos_qs)
            .values('tipo')
            .annotate(total=Count('id'))
            .order_by('-total')
        )
        total_evidencias = sum(e['total'] for e in evidencias_por_tipo)

        # ─────────── AVANCES POR ESTADO ───────────
        avances_por_estado = list(
            Avance.objects.filter(actividad__proyecto__in=proyectos_qs)
            .values('estado')
            .annotate(total=Count('id'))
            .order_by('-total')
        )

        # ─────────── INFORMES POR TIPO ───────────
        informes_por_tipo = list(
            Informe.objects.filter(proyecto__in=proyectos_qs)
            .values('tipo')
            .annotate(total=Count('id'))
            .order_by('-total')
        )

        # ─────────── BENEFICIARIOS ───────────
        beneficiarios_por_tipo = list(
            Beneficiario.objects.filter(proyecto__in=proyectos_qs)
            .values('tipo')
            .annotate(
                total=Count('id'),
                cantidad=Coalesce(Sum('cantidad_estimada'), Value(0)),
            )
            .order_by('-total')
        )

        # ─────────── KPIs ───────────
        proyectos_activos = proyectos_qs.filter(
            estado__in=[
                EstadoProyecto.EN_EJECUCION,
                EstadoProyecto.EN_REVISION,
                EstadoProyecto.APROBADO,
            ],
        ).count()
        proyectos_finalizados = proyectos_qs.filter(estado=EstadoProyecto.FINALIZADO).count()
        proyectos_en_ejecucion = proyectos_qs.filter(estado=EstadoProyecto.EN_EJECUCION).count()
        proyectos_borrador = proyectos_qs.filter(estado=EstadoProyecto.BORRADOR).count()

        return {
            'kpis': {
                'total_proyectos': proyectos_qs.count(),
                'proyectos_activos': proyectos_activos,
                'proyectos_en_ejecucion': proyectos_en_ejecucion,
                'proyectos_finalizados': proyectos_finalizados,
                'proyectos_borrador': proyectos_borrador,
                'total_actividades': total_actividades,
                'actividades_completadas': actividades_completadas,
                'actividades_atrasadas': actividades_atrasadas,
                'avance_promedio': float(avance_promedio or 0),
                'total_participantes': total_participantes,
                'total_objetivos': total_objetivos,
                'objetivos_cumplidos': objetivos_cumplidos,
                'objetivos_pendientes': objetivos_pendientes,
                'total_indicadores': total_indicadores,
                'total_evidencias': total_evidencias,
                'presupuesto_aprobado': presupuesto_aprobado_total,
                'presupuesto_ejecutado': presupuesto_ejecutado_total,
                'presupuesto_saldo': presupuesto_saldo_total,
            },
            'proyectos': proyectos_data,
            'cronograma': cronograma,
            'actividades_por_estado': actividades_por_estado,
            'avances_por_estado': avances_por_estado,
            'participantes_por_rol': participantes_por_rol,
            'objetivos': {
                'cumplidos': objetivos_cumplidos,
                'pendientes': objetivos_pendientes,
            },
            'indicadores_por_estado': indicadores_por_estado,
            'carga_mensual': carga_mensual,
            'evidencias_por_tipo': evidencias_por_tipo,
            'informes_por_tipo': informes_por_tipo,
            'beneficiarios_por_tipo': beneficiarios_por_tipo,
            'presupuesto_detalle': {
                'aprobado': presupuesto_aprobado_total,
                'ejecutado': presupuesto_ejecutado_total,
                'saldo': presupuesto_saldo_total,
                'unl_valorado': float(presupuesto_agg['unl_valorado'] or 0),
                'unl_economico': float(presupuesto_agg['unl_economico'] or 0),
                'externo_valorado': float(presupuesto_agg['externo_valorado'] or 0),
                'externo_economico': float(presupuesto_agg['externo_economico'] or 0),
            },
        }
