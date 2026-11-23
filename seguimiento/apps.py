from django.apps import AppConfig


class SeguimientoConfig(AppConfig):
	default_auto_field = 'django.db.models.BigAutoField'
	name = 'seguimiento'

	def ready(self):
		import seguimiento.notificaciones  # noqa: F401
