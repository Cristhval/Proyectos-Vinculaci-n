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


class PresupuestoInline(admin.StackedInline):
	model = m.Presupuesto
	can_delete = False
	max_num = 1
	extra = 0


class BeneficiarioInline(admin.TabularInline):
	model = m.Beneficiario
	extra = 0
	fields = ('nombre', 'tipo', 'cantidad_estimada')


class AlineacionInline(admin.TabularInline):
	model = m.AlineacionEstrategica
	extra = 0
	fields = ('eje', 'objetivo_estrategico', 'programa')


class FirmaInline(admin.TabularInline):
	model = m.FirmaResponsabilidad
	extra = 0
	fields = ('usuario', 'tipo', 'fecha_firma')


@admin.register(m.Proyecto)
class ProyectoAdmin(TimeStampedAdmin):
	list_display = ('codigo', 'titulo', 'tipo', 'estado', 'carrera', 'responsable', 'fecha_inicio', 'fecha_fin_planificada', 'objetivos_total', 'actividades_total', 'participantes_total', 'activo')
	search_fields = ('codigo', 'titulo', 'resumen', 'descripcion', 'responsable__user__username', 'carrera__nombre')
	list_filter = ('estado', 'tipo', 'prioridad', 'carrera', 'activo')
	list_select_related = ('carrera', 'responsable', 'coordinador_academico')
	inlines = (PresupuestoInline, ObjetivoInline, ActividadInline, ParticipanteInline, BeneficiarioInline, AlineacionInline, FirmaInline)

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


@admin.register(m.Beneficiario)
class BeneficiarioAdmin(TimeStampedAdmin):
	list_display = ('proyecto', 'tipo', 'nombre', 'cantidad_estimada', 'ubicacion')
	search_fields = ('proyecto__codigo', 'nombre', 'ubicacion')
	list_filter = ('tipo', 'proyecto')
	list_select_related = ('proyecto',)


@admin.register(m.AlineacionEstrategica)
class AlineacionEstrategicaAdmin(TimeStampedAdmin):
	list_display = ('proyecto', 'eje', 'objetivo_estrategico', 'programa', 'plan')
	search_fields = ('proyecto__codigo', 'eje', 'objetivo_estrategico', 'programa')
	list_filter = ('proyecto',)
	list_select_related = ('proyecto',)


@admin.register(m.FirmaResponsabilidad)
class FirmaResponsabilidadAdmin(TimeStampedAdmin):
	list_display = ('proyecto', 'usuario', 'tipo', 'fecha_firma')
	search_fields = ('proyecto__codigo', 'usuario__user__username')
	list_filter = ('tipo', 'proyecto')
	list_select_related = ('proyecto', 'usuario')
