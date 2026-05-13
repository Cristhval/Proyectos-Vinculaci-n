from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
	def has_permission(self, request, view):
		if not request.user or not request.user.is_authenticated:
			return False
		return hasattr(request.user, 'perfil') and request.user.perfil.rol == 'ADMIN'


class IsCoordinadorOrAdmin(permissions.BasePermission):
	def has_permission(self, request, view):
		if not request.user or not request.user.is_authenticated:
			return False
		if not hasattr(request.user, 'perfil'):
			return False
		return request.user.perfil.rol in ('COORDINADOR', 'ADMIN')


class IsDocenteOrAbove(permissions.BasePermission):
	def has_permission(self, request, view):
		if not request.user or not request.user.is_authenticated:
			return False
		if not hasattr(request.user, 'perfil'):
			return False
		return request.user.perfil.rol in ('DOCENTE', 'COORDINADOR', 'ADMIN')
