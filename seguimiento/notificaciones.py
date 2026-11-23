"""Notificaciones (Alerta) disparadas por señales de otras apps (patrón Observer)."""
from django.dispatch import receiver

from proyectos.signals import monitoreo_cambiado

from .alertas_generator import generar_alerta


def _ruta_rol(perfil):
	return (perfil.rol or 'docente').lower()


@receiver(monitoreo_cambiado)
def notificar_monitoreo(sender, proyecto, anterior, nuevo, usuario=None, **kwargs):
	"""HU-18: avisa al responsable y a los coordinadores activos, salvo a quien hizo el cambio."""
	from usuarios.models import Usuario

	destinatarios = {c.pk: c for c in Usuario.objects.filter(rol='COORDINADOR', activo=True)}
	if proyecto.responsable_id and proyecto.responsable.activo:
		destinatarios[proyecto.responsable_id] = proyecto.responsable
	if usuario is not None:
		destinatarios.pop(usuario.pk, None)

	estado = 'activado' if nuevo else 'desactivado'
	codigo = proyecto.codigo or f'#{proyecto.pk}'
	for perfil in destinatarios.values():
		generar_alerta(
			usuario=perfil,
			mensaje=f'Monitoreo ambiental {estado} en {codigo}',
			detalle=f'Se {estado} el monitoreo ambiental del proyecto "{proyecto.titulo}".',
			prioridad='MEDIA',
			proyecto=proyecto,
			enlace=f'/{_ruta_rol(perfil)}/proyectos/{proyecto.pk}',
			force=True,
		)
