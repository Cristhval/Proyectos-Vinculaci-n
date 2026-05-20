from rest_framework import permissions


ROL_JERARQUIA = {
    'ESTUDIANTE': 1,
    'DIRECTIVO': 2,
    'DOCENTE': 3,
    'COORDINADOR': 4,
    'ADMIN': 5,
}


def _tiene_nivel_minimo(usuario, nivel_requerido):
    if not usuario or not usuario.is_authenticated:
        return False
    if not hasattr(usuario, 'perfil'):
        return False
    rol = usuario.perfil.rol
    return ROL_JERARQUIA.get(rol, 0) >= nivel_requerido


def _obtener_rol(usuario):
    if not usuario or not usuario.is_authenticated:
        return None
    if not hasattr(usuario, 'perfil'):
        return None
    return usuario.perfil.rol


def RolesMinimo(nivel_minimo):
    class _RolPermission(permissions.BasePermission):
        def has_permission(self, request, view):
            return _tiene_nivel_minimo(request.user, nivel_minimo)
    return _RolPermission


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return _tiene_nivel_minimo(request.user, ROL_JERARQUIA['ADMIN'])


class IsCoordinadorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return _tiene_nivel_minimo(request.user, ROL_JERARQUIA['COORDINADOR'])


class IsDocenteOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return _tiene_nivel_minimo(request.user, ROL_JERARQUIA['DOCENTE'])


class IsDirectivoOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        return _tiene_nivel_minimo(request.user, ROL_JERARQUIA['DIRECTIVO'])


class PermissionMapMixin:
    permission_map = {
        'create': [IsCoordinadorOrAdmin],
        'update': [IsCoordinadorOrAdmin],
        'partial_update': [IsCoordinadorOrAdmin],
        'destroy': [IsCoordinadorOrAdmin],
        'default': [IsAuthenticated],
    }

    def get_permissions(self):
        permission_classes = self.permission_map.get(
            self.action,
            self.permission_map['default'],
        )
        return [permission() for permission in permission_classes]
