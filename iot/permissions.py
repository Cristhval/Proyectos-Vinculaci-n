"""Permisos de IoT. Reutiliza las reglas de core/permissions.py.

- Gestionar (registrar, editar, dar de baja, regenerar token): responsable del
  proyecto, COORDINADOR o ADMIN (``puede_gestionar_proyecto``).
- Consultar: quien ya puede ver el proyecto, con la misma regla que
  ``ProyectoViewSet.get_queryset``: DOCENTE solo los suyos, ESTUDIANTE solo
  donde participa y el resto (DIRECTIVO, COORDINADOR, ADMIN) todos.
"""
from core.permissions import _obtener_rol, puede_gestionar_proyecto  # noqa: F401


def puede_ver_proyecto(usuario, proyecto):
	rol = _obtener_rol(usuario)
	if rol is None:
		return False
	perfil = usuario.perfil
	if rol == 'DOCENTE':
		return proyecto.responsable_id == perfil.pk
	if rol == 'ESTUDIANTE':
		return proyecto.participantes.filter(usuario=perfil).exists()
	return True
