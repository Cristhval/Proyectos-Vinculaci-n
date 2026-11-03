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
	def enviar(self, destino, asunto, html):
		"""Envía un correo HTML a `destino`."""


class EmisorConsola(EmisorCorreo):
	def enviar(self, destino, asunto, html):
		logger.info('Correo para %s — %s\n%s', destino, asunto, html)


class EmisorBrevo(EmisorCorreo):
	URL = 'https://api.brevo.com/v3/smtp/email'

	def enviar(self, destino, asunto, html):
		respuesta = requests.post(
			self.URL,
			headers={'api-key': settings.BREVO_API_KEY, 'accept': 'application/json'},
			json={
				'sender': {'email': settings.EMAIL_REMITENTE, 'name': settings.EMAIL_REMITENTE_NOMBRE},
				'to': [{'email': destino}],
				'subject': asunto,
				'htmlContent': html,
			},
			timeout=10,
		)
		if respuesta.status_code >= 300:
			raise RuntimeError(f'Brevo respondió {respuesta.status_code}: {respuesta.text[:200]}')


def obtener_emisor():
	if settings.EMAIL_EMISOR == 'brevo':
		if not settings.BREVO_API_KEY or not settings.EMAIL_REMITENTE:
			raise ImproperlyConfigured('EMAIL_EMISOR=brevo requiere BREVO_API_KEY y EMAIL_REMITENTE.')
		return EmisorBrevo()
	return EmisorConsola()
