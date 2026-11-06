from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Cuenta, SolicitudAcceso


@admin.register(Cuenta)
class CuentaAdmin(UserAdmin):
	list_display = ('username', 'email', 'first_name', 'last_name', 'rol', 'is_active')
	list_filter = ('rol', 'is_active')
	fieldsets = UserAdmin.fieldsets + (('Vinculación', {'fields': ('rol', 'documento_identidad')}),)


@admin.register(SolicitudAcceso)
class SolicitudAccesoAdmin(admin.ModelAdmin):
	list_display = ('cuenta', 'rol_solicitado', 'estado', 'creada', 'revisada')
	list_filter = ('estado', 'rol_solicitado', 'rol_asignado')
	search_fields = ('cuenta__email', 'cuenta__first_name', 'cuenta__last_name')
