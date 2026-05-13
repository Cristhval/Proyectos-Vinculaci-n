from django.contrib import admin

from . import models as m


class TimeStampedAdmin(admin.ModelAdmin):
	readonly_fields = ('creado_en', 'actualizado_en')
	date_hierarchy = 'creado_en'
	list_per_page = 20


@admin.register(m.Auditoria)
class AuditoriaAdmin(TimeStampedAdmin):
	list_display = ('usuario', 'accion', 'entidad', 'entidad_id', 'ip_address', 'creado_en')
	search_fields = ('usuario__user__username', 'entidad', 'detalle')
	list_filter = ('accion', 'entidad', 'usuario')
	list_select_related = ('usuario',)
