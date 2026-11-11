from rest_framework.permissions import BasePermission

from .models import Rol


class EsAdmin(BasePermission):
	message = 'Solo el administrador puede realizar esta acción.'

	def has_permission(self, request, view):
		usuario = request.user
		return bool(usuario and usuario.is_authenticated and usuario.rol == Rol.ADMIN)
