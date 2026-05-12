from django.contrib import admin

from . import models as m


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
class InstitucionAdmin(admin.ModelAdmin):
	list_display = ('nombre', 'sigla', 'activa')
	search_fields = ('nombre', 'sigla')
	list_filter = ('activa',)


@admin.register(m.Carrera)
class CarreraAdmin(admin.ModelAdmin):
	list_display = ('codigo', 'nombre', 'facultad', 'activa')
	search_fields = ('codigo', 'nombre')
	list_filter = ('activa', 'facultad')


@admin.register(m.Usuario)
class UsuarioAdmin(admin.ModelAdmin):
	list_display = ('codigo', 'get_full_name', 'documento_identidad', 'rol', 'carrera', 'activo')
	search_fields = ('codigo', 'user__username', 'user__first_name', 'user__last_name', 'documento_identidad')
	list_filter = ('rol', 'activo', 'carrera')

	def get_full_name(self, obj):
		return obj.user.get_full_name()

	get_full_name.short_description = 'Nombre'


@admin.register(m.Convenio)
class ConvenioAdmin(admin.ModelAdmin):
	list_display = ('codigo', 'entidad_contraparte', 'institucion', 'estado', 'fecha_firma')
	search_fields = ('codigo', 'entidad_contraparte')
	list_filter = ('estado', 'institucion')


@admin.register(m.Proyecto)
class ProyectoAdmin(admin.ModelAdmin):
	list_display = ('codigo', 'titulo', 'tipo', 'estado', 'carrera', 'responsable', 'fecha_inicio', 'fecha_fin_planificada', 'activo')
	search_fields = ('codigo', 'titulo', 'responsable__user__username')
	list_filter = ('estado', 'tipo', 'carrera', 'activo')
	inlines = (PresupuestoInline, ObjetivoInline, ActividadInline, ParticipanteInline, ProyectoConvenioInline)


@admin.register(m.Objetivo)
class ObjetivoAdmin(admin.ModelAdmin):
	list_display = ('proyecto', 'orden', 'cumplido')
	list_filter = ('cumplido',)
	inlines = (IndicadorInline,)


@admin.register(m.Indicador)
class IndicadorAdmin(admin.ModelAdmin):
	list_display = ('codigo', 'nombre', 'objetivo', 'frecuencia', 'estado')
	search_fields = ('codigo', 'nombre')
	list_filter = ('frecuencia', 'estado')


@admin.register(m.Actividad)
class ActividadAdmin(admin.ModelAdmin):
	list_display = ('codigo', 'nombre', 'proyecto', 'responsable', 'estado', 'fecha_inicio', 'fecha_fin')
	search_fields = ('codigo', 'nombre', 'proyecto__codigo')
	list_filter = ('estado', 'proyecto')


@admin.register(m.Avance)
class AvanceAdmin(admin.ModelAdmin):
	list_display = ('actividad', 'registrado_por', 'porcentaje_avance', 'estado', 'fecha_registro')
	search_fields = ('actividad__codigo', 'registrado_por__user__username')
	list_filter = ('estado',)
	inlines = (EvidenciaInline,)


@admin.register(m.Evidencia)
class EvidenciaAdmin(admin.ModelAdmin):
	list_display = ('titulo', 'tipo', 'avance', 'actividad', 'fecha_carga', 'verificada')
	search_fields = ('titulo', 'actividad__codigo', 'avance__id')
	list_filter = ('tipo', 'verificada')


@admin.register(m.ParticipanteProyecto)
class ParticipanteProyectoAdmin(admin.ModelAdmin):
	list_display = ('proyecto', 'usuario', 'rol', 'horas_comprometidas', 'horas_cumplidas', 'estado')
	search_fields = ('proyecto__codigo', 'usuario__user__username')
	list_filter = ('rol', 'estado')


@admin.register(m.Presupuesto)
class PresupuestoAdmin(admin.ModelAdmin):
	list_display = ('codigo', 'proyecto', 'monto_aprobado', 'monto_ejecutado', 'monto_saldo', 'estado')
	search_fields = ('codigo', 'proyecto__codigo')
	list_filter = ('estado',)


@admin.register(m.Informe)
class InformeAdmin(admin.ModelAdmin):
	list_display = ('proyecto', 'tipo', 'numero', 'titulo', 'fecha_emision', 'aprobado_por')
	search_fields = ('proyecto__codigo', 'numero', 'titulo')
	list_filter = ('tipo',)


@admin.register(m.Alerta)
class AlertaAdmin(admin.ModelAdmin):
	list_display = ('usuario', 'mensaje', 'prioridad', 'estado', 'leida', 'fecha_vencimiento')
	search_fields = ('usuario__user__username', 'mensaje')
	list_filter = ('prioridad', 'estado', 'leida')
