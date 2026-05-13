from django.db import models

from core.models import TimeStampedModel


class TipoAccion(models.TextChoices):
	CREAR = 'CREAR', 'Crear'
	ACTUALIZAR = 'ACTUALIZAR', 'Actualizar'
	ELIMINAR = 'ELIMINAR', 'Eliminar'
	APROBAR = 'APROBAR', 'Aprobar'
	RECHAZAR = 'RECHAZAR', 'Rechazar'
	INICIAR_SESION = 'INICIAR_SESION', 'Iniciar sesion'


class Auditoria(TimeStampedModel):
	usuario = models.ForeignKey('usuarios.Usuario', null=True, blank=True, on_delete=models.SET_NULL, related_name='auditorias')
	accion = models.CharField(max_length=20, choices=TipoAccion.choices)
	entidad = models.CharField(max_length=100)
	entidad_id = models.PositiveIntegerField(null=True, blank=True)
	detalle = models.TextField(blank=True, default='')
	ip_address = models.GenericIPAddressField(null=True, blank=True)

	class Meta:
		ordering = ['-creado_en']
		verbose_name = 'Auditoria'
		verbose_name_plural = 'Auditorias'

	def __str__(self):
		usuario_str = self.usuario.codigo if self.usuario else 'Sistema'
		return f'{usuario_str} - {self.accion} {self.entidad}'
