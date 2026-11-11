import logging
from abc import ABC, abstractmethod

from django.conf import settings
from django.template.loader import render_to_string
from django.utils import formats, timezone

from cuentas.models import Cuenta, EstadoSolicitud, Rol
from cuentas.servicios.correo import obtener_emisor

logger = logging.getLogger(__name__)


class ObservadorSolicitud(ABC):
	@abstractmethod
	def on_creada(self, solicitud):
		pass

	@abstractmethod
	def on_resuelta(self, solicitud):
		pass


class ObservadorCorreo(ObservadorSolicitud):
	def _enviar(self, destino, asunto, plantilla, contexto):
		html = render_to_string(f'cuentas/correo/{plantilla}.html', contexto)
		texto = render_to_string(f'cuentas/correo/{plantilla}.txt', contexto).strip()
		obtener_emisor().enviar(destino, asunto, html, texto)

	def on_creada(self, solicitud):
		cuenta = solicitud.cuenta
		contexto = {
			'nombre': f'{cuenta.first_name} {cuenta.last_name}'.strip(),
			'email': cuenta.email,
			'rol_solicitado': solicitud.get_rol_solicitado_display(),
			'motivo': solicitud.motivo,
			'enlace': f'{settings.FRONTEND_URL}/admin/solicitudes',
			'fecha': formats.date_format(timezone.localtime(solicitud.creada), 'j \\d\\e F \\d\\e Y, H:i'),
		}
		for admin in Cuenta.objects.filter(rol=Rol.ADMIN, is_active=True):
			self._enviar(admin.email, 'Nueva solicitud de acceso — Vinculación UNL', 'solicitud_nueva', contexto)

	def on_resuelta(self, solicitud):
		cuenta = solicitud.cuenta
		aprobada = solicitud.estado == EstadoSolicitud.APROBADA
		contexto = {
			'nombre': f'{cuenta.first_name} {cuenta.last_name}'.strip(),
			'rol_asignado': solicitud.get_rol_asignado_display() if aprobada else '',
			'motivo': solicitud.motivo_rechazo,
			'enlace': f'{settings.FRONTEND_URL}/login',
		}
		plantilla = 'solicitud_aprobada' if aprobada else 'solicitud_rechazada'
		asunto = 'Solicitud de acceso aprobada — Vinculación UNL' if aprobada else 'Solicitud de acceso no aprobada — Vinculación UNL'
		self._enviar(cuenta.email, asunto, plantilla, contexto)


class ServicioNotificacionesSolicitud:
	observadores = [ObservadorCorreo()]

	@classmethod
	def notificar_creada(cls, solicitud):
		for observador in cls.observadores:
			try:
				observador.on_creada(solicitud)
			except Exception:
				logger.exception('No se pudo notificar una nueva solicitud de acceso')

	@classmethod
	def notificar_resuelta(cls, solicitud):
		for observador in cls.observadores:
			try:
				observador.on_resuelta(solicitud)
			except Exception:
				logger.exception('No se pudo notificar la resolución de una solicitud de acceso')
