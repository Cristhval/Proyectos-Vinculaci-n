from django.contrib import admin

from . import models as m


class TimeStampedAdmin(admin.ModelAdmin):
	readonly_fields = ('creado_en', 'actualizado_en')
	date_hierarchy = 'creado_en'
	list_per_page = 20


class EvidenciaInline(admin.TabularInline):
	model = m.Evidencia
	extra = 0
	fields = ('titulo', 'tipo', 'archivo', 'enlace_externo', 'verificada')


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


@admin.register(m.Revision)
class RevisionAdmin(TimeStampedAdmin):
	list_display = ('proyecto', 'revisor', 'decision', 'fecha_revision')
	search_fields = ('proyecto__codigo', 'revisor__user__username', 'comentario')
	list_filter = ('decision', 'proyecto')
	list_select_related = ('proyecto', 'revisor')


@admin.register(m.FlujoValidacion)
class FlujoValidacionAdmin(TimeStampedAdmin):
	list_display = ('proyecto', 'paso', 'nombre_paso', 'responsable', 'estado', 'fecha_completado')
	search_fields = ('proyecto__codigo', 'nombre_paso')
	list_filter = ('estado', 'proyecto')
	list_select_related = ('proyecto', 'responsable')
