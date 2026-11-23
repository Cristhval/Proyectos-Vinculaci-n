from django.contrib import admin

from .models import DispositivoIoT


@admin.register(DispositivoIoT)
class DispositivoIoTAdmin(admin.ModelAdmin):
	list_display = ('identificador', 'nombre', 'proyecto', 'activo', 'ultima_lectura')
	list_filter = ('activo', 'mide_co2')
	search_fields = ('identificador', 'nombre', 'proyecto__codigo')
	# El hash del token no se muestra ni se edita desde el admin.
	exclude = ('token_hash',)
	readonly_fields = ('fecha_registro', 'fecha_baja', 'ultima_lectura')

	def has_add_permission(self, request):
		# Se registran por la API para que el token se genere y se muestre una sola vez.
		return False
