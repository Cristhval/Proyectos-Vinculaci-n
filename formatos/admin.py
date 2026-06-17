from django.contrib import admin

from .models import FormatoInstitucional


@admin.register(FormatoInstitucional)
class FormatoAdmin(admin.ModelAdmin):
	list_display = ['nombre', 'nivel', 'tipo', 'activo', 'fecha_actualizacion']
	list_filter = ['nivel', 'tipo', 'activo']
	search_fields = ['nombre', 'descripcion']
