from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Cuenta


@admin.register(Cuenta)
class CuentaAdmin(UserAdmin):
	list_display = ('username', 'email', 'first_name', 'last_name', 'rol', 'is_active')
	list_filter = ('rol', 'is_active')
	fieldsets = UserAdmin.fieldsets + (('Vinculación', {'fields': ('rol', 'documento_identidad')}),)
