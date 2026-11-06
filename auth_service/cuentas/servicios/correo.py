"""Envío de correo (patrón Strategy).

Render (plan gratuito) bloquea el tráfico saliente SMTP, por eso en producción se usa la API HTTP de Brevo.
En desarrollo el correo se imprime en la consola.
"""
import logging
from abc import ABC, abstractmethod

import requests
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

logger = logging.getLogger(__name__)


class EmisorCorreo(ABC):
	@abstractmethod
	def enviar(self, destino, asunto, html, texto=''):
		"""Envía un correo a `destino` con versión HTML y, opcionalmente, de texto plano."""


class EmisorConsola(EmisorCorreo):
	def enviar(self, destino, asunto, html, texto=''):
		logger.info('Correo para %s — %s\n%s', destino, asunto, texto or html)


class EmisorBrevo(EmisorCorreo):
	URL = 'https://api.brevo.com/v3/smtp/email'

	def enviar(self, destino, asunto, html, texto=''):
		datos = {
			'sender': {'email': settings.EMAIL_REMITENTE, 'name': settings.EMAIL_REMITENTE_NOMBRE},
			'to': [{'email': destino}],
			'subject': asunto,
			'htmlContent': html,
		}
		if texto:
			datos['textContent'] = texto
		respuesta = requests.post(
			self.URL,
			headers={'api-key': settings.BREVO_API_KEY, 'accept': 'application/json'},
			json=datos,
			timeout=10,
		)
		if respuesta.status_code >= 300:
			raise RuntimeError(f'Brevo respondió {respuesta.status_code}: {respuesta.text[:200]}')


def obtener_emisor():
	if settings.EMAIL_EMISOR == 'brevo':
		if not settings.BREVO_API_KEY or not settings.EMAIL_REMITENTE:
			raise ImproperlyConfigured('EMAIL_EMISOR=brevo requiere BREVO_API_KEY y EMAIL_REMITENTE.')
		if not settings.BREVO_API_KEY.startswith('xkeysib-'):
			# Las claves "xsmtpsib-" son de SMTP y la API HTTP las rechaza con 401 "Key not found".
			raise ImproperlyConfigured('BREVO_API_KEY debe ser una clave de API (empieza con "xkeysib-"), no una clave SMTP.')
		return EmisorBrevo()
	return EmisorConsola()
