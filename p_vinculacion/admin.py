from django.contrib import admin

from . import models as m


class TimeStampedAdmin(admin.ModelAdmin):
	readonly_fields = ('creado_en', 'actualizado_en')
	date_hierarchy = 'creado_en'
	list_per_page = 20


class ObjetivoInline(admin.TabularInline):
	model = m.Objetivo
	extra = 0
	fields = ('orden', 'descripcion', 'cumplido')


class IndicadorInline(admin.TabularInline):
	model = m.Indicador
	extra = 0
	fields = ('codigo', 'nombre', 'frecuencia', 'estado')


class ActividadInline(admin.TabularInline):
	model = m.Actividad
	extra = 0
	fields = ('codigo', 'nombre', 'responsable', 'estado', 'fecha_inicio', 'fecha_fin')


class ParticipanteInline(admin.TabularInline):
	model = m.ParticipanteProyecto
	extra = 0
	fields = ('usuario', 'rol', 'horas_comprometidas', 'horas_cumplidas', 'estado')


class ProyectoConvenioInline(admin.TabularInline):
	model = m.ProyectoConvenio
	extra = 0
	fields = ('convenio', 'fecha_vinculacion', 'vigente')


class PresupuestoInline(admin.StackedInline):
	model = m.Presupuesto
	can_delete = False
	max_num = 1
	extra = 0


class EvidenciaInline(admin.TabularInline):
	model = m.Evidencia
	extra = 0
	fields = ('titulo', 'tipo', 'archivo', 'enlace_externo', 'verificada')


@admin.register(m.Institucion)
class InstitucionAdmin(TimeStampedAdmin):
	list_display = ('nombre', 'sigla', 'email', 'telefono', 'activa')
	search_fields = ('nombre', 'sigla', 'email', 'telefono')
	list_filter = ('activa',)


@admin.register(m.Carrera)
class CarreraAdmin(TimeStampedAdmin):
	list_display = ('codigo', 'nombre', 'facultad', 'activa')
	search_fields = ('codigo', 'nombre', 'facultad')
	list_filter = ('activa', 'facultad')


@admin.register(m.Usuario)
class UsuarioAdmin(TimeStampedAdmin):
	list_display = ('codigo', 'get_full_name', 'user', 'documento_identidad', 'rol', 'carrera', 'telefono', 'activo')
	search_fields = ('codigo', 'user__username', 'user__first_name', 'user__last_name', 'documento_identidad', 'telefono')
	list_filter = ('rol', 'activo', 'carrera')
	list_select_related = ('user', 'carrera')

	def get_full_name(self, obj):
		return obj.user.get_full_name()

	get_full_name.short_description = 'Nombre'


@admin.register(m.Convenio)
class ConvenioAdmin(TimeStampedAdmin):
	list_display = ('codigo', 'entidad_contraparte', 'institucion', 'tipo', 'estado', 'fecha_firma', 'activo')
	search_fields = ('codigo', 'entidad_contraparte', 'objeto', 'tipo')
	list_filter = ('estado', 'tipo', 'institucion', 'activo')
	list_select_related = ('institucion',)


@admin.register(m.Proyecto)
class ProyectoAdmin(TimeStampedAdmin):
	list_display = ('codigo', 'titulo', 'tipo', 'estado', 'carrera', 'responsable', 'fecha_inicio', 'fecha_fin_planificada', 'objetivos_total', 'actividades_total', 'participantes_total', 'activo')
	search_fields = ('codigo', 'titulo', 'resumen', 'descripcion', 'responsable__user__username', 'carrera__nombre')
	list_filter = ('estado', 'tipo', 'prioridad', 'carrera', 'activo')
	list_select_related = ('carrera', 'responsable', 'coordinador_academico')
	inlines = (PresupuestoInline, ObjetivoInline, ActividadInline, ParticipanteInline, ProyectoConvenioInline)

	@admin.display(description='Objetivos')
	def objetivos_total(self, obj):
		return obj.objetivos.count()

	@admin.display(description='Actividades')
	def actividades_total(self, obj):
		return obj.actividades.count()

	@admin.display(description='Participantes')
	def participantes_total(self, obj):
		return obj.participantes.count()


@admin.register(m.Objetivo)
class ObjetivoAdmin(TimeStampedAdmin):
	list_display = ('proyecto', 'orden', 'tipo', 'cumplido', 'fecha_cumplimiento')
	search_fields = ('proyecto__codigo', 'descripcion', 'meta')
	list_filter = ('tipo', 'cumplido', 'proyecto')
	list_select_related = ('proyecto',)
	inlines = (IndicadorInline,)


@admin.register(m.Indicador)
class IndicadorAdmin(TimeStampedAdmin):
	list_display = ('codigo', 'nombre', 'objetivo', 'frecuencia', 'estado', 'valor_actual', 'meta', 'fecha_medicion')
	search_fields = ('codigo', 'nombre', 'objetivo__descripcion')
	list_filter = ('frecuencia', 'estado', 'objetivo')
	list_select_related = ('objetivo',)


@admin.register(m.Actividad)
class ActividadAdmin(TimeStampedAdmin):
	list_display = ('codigo', 'nombre', 'proyecto', 'objetivo', 'responsable', 'estado', 'porcentaje_programado', 'porcentaje_ejecucion', 'fecha_inicio', 'fecha_fin')
	search_fields = ('codigo', 'nombre', 'descripcion', 'proyecto__codigo', 'responsable__user__username')
	list_filter = ('estado', 'proyecto', 'requiere_evidencia')
	list_select_related = ('proyecto', 'objetivo', 'responsable')


@admin.register(m.Avance)
class AvanceAdmin(TimeStampedAdmin):
	list_display = ('actividad', 'registrado_por', 'porcentaje_avance', 'estado', 'fecha_registro')
	search_fields = ('actividad__codigo', 'descripcion', 'registrado_por__user__username')
	list_filter = ('estado',)
	list_select_related = ('actividad', 'registrado_por')
	inlines = (EvidenciaInline,)


@admin.register(m.Evidencia)
class EvidenciaAdmin(TimeStampedAdmin):
	list_display = ('titulo', 'tipo', 'avance', 'actividad', 'fecha_carga', 'verificada')
	search_fields = ('titulo', 'descripcion', 'actividad__codigo', 'avance__id')
	list_filter = ('tipo', 'verificada')
	list_select_related = ('avance', 'actividad')


@admin.register(m.ParticipanteProyecto)
class ParticipanteProyectoAdmin(TimeStampedAdmin):
	list_display = ('proyecto', 'usuario', 'rol', 'fecha_inicio', 'fecha_fin', 'horas_comprometidas', 'horas_cumplidas', 'estado')
	search_fields = ('proyecto__codigo', 'usuario__user__username', 'usuario__codigo')
	list_filter = ('rol', 'estado', 'proyecto')
	list_select_related = ('proyecto', 'usuario')


@admin.register(m.Presupuesto)
class PresupuestoAdmin(TimeStampedAdmin):
	list_display = ('codigo', 'proyecto', 'monto_aprobado', 'monto_ejecutado', 'monto_saldo', 'estado', 'responsable')
	search_fields = ('codigo', 'proyecto__codigo', 'observaciones')
	list_filter = ('estado',)
	list_select_related = ('proyecto', 'responsable')


@admin.register(m.Informe)
class InformeAdmin(TimeStampedAdmin):
	list_display = ('proyecto', 'tipo', 'numero', 'titulo', 'estado', 'fecha_emision', 'elaborado_por', 'aprobado_por')
	search_fields = ('proyecto__codigo', 'numero', 'titulo', 'resumen')
	list_filter = ('tipo', 'estado')
	list_select_related = ('proyecto', 'elaborado_por', 'aprobado_por')


@admin.register(m.Alerta)
class AlertaAdmin(TimeStampedAdmin):
	list_display = ('usuario', 'proyecto', 'convenio', 'mensaje', 'prioridad', 'estado', 'leida', 'fecha_vencimiento')
	search_fields = ('usuario__user__username', 'mensaje', 'detalle')
	list_filter = ('prioridad', 'estado', 'leida')
	list_select_related = ('usuario', 'proyecto', 'convenio')
