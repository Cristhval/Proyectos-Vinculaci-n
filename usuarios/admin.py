from django.contrib import admin

from . import models as m


class TimeStampedAdmin(admin.ModelAdmin):
	readonly_fields = ('creado_en', 'actualizado_en')
	date_hierarchy = 'creado_en'
	list_per_page = 20


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

	@admin.display(description='Nombre')
	def get_full_name(self, obj):
		return obj.user.get_full_name()
