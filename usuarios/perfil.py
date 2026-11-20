"""Requisitos para considerar completo un perfil (patrón Strategy por rol).

Cada rol define qué datos son obligatorios; la vista y el frontend solo preguntan
`pendientes(perfil)` sin conocer las reglas.
"""
from .models import RolUsuario

ETIQUETAS = {
	'documento_identidad': 'Cédula',
	'carrera': 'Carrera',
	'telefono': 'Teléfono',
	'direccion': 'Dirección',
}


class RequisitosPerfil:
	"""Base: datos que todo usuario debe registrar."""
	campos = ('documento_identidad', 'telefono', 'direccion')

	def faltantes(self, perfil):
		return [campo for campo in self.campos if not self._tiene(perfil, campo)]

	@staticmethod
	def _tiene(perfil, campo):
		valor = getattr(perfil, campo)
		if campo == 'documento_identidad':
			return bool(valor) and not valor.startswith('PEND-')
		return bool(valor and str(valor).strip()) if campo != 'carrera' else valor is not None


class RequisitosAcademicos(RequisitosPerfil):
	"""Estudiantes, docentes y coordinadores pertenecen a una carrera."""
	campos = ('documento_identidad', 'carrera', 'telefono', 'direccion')


class FabricaRequisitos:
	_por_rol = {
		RolUsuario.ESTUDIANTE: RequisitosAcademicos,
		RolUsuario.DOCENTE: RequisitosAcademicos,
		RolUsuario.COORDINADOR: RequisitosAcademicos,
	}

	@classmethod
	def para(cls, rol):
		return cls._por_rol.get(rol, RequisitosPerfil)()


def pendientes(perfil):
	"""Lista de {campo, etiqueta} que faltan para completar el perfil."""
	return [{'campo': c, 'etiqueta': ETIQUETAS[c]} for c in FabricaRequisitos.para(perfil.rol).faltantes(perfil)]
