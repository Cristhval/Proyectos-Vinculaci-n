"""Envío de correo (patrón Strategy).

Render (plan gratuito) bloquea el tráfico saliente SMTP, por eso en producción se usan APIs HTTP:
Gmail (recomendado: Google firma el correo y llega al instante a @unl.edu.ec) o Brevo.
En desarrollo el correo se imprime en la consola.
"""
import base64
import logging
import re
from abc import ABC, abstractmethod
from email.message import EmailMessage
from email.utils import formataddr

import requests
from django.conf import settings
from django.core.cache import cache
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


class EmisorGmail(EmisorCorreo):
	TOKEN_URL = 'https://oauth2.googleapis.com/token'
	SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'
	CLAVE_CACHE = 'gmail_access_token'

	def _access_token(self):
		token = cache.get(self.CLAVE_CACHE)
		if token:
			return token
		respuesta = requests.post(self.TOKEN_URL, data={
			'grant_type': 'refresh_token',
			'client_id': settings.GMAIL_CLIENT_ID,
			'client_secret': settings.GMAIL_CLIENT_SECRET,
			'refresh_token': settings.GMAIL_REFRESH_TOKEN,
		}, timeout=10)
		if respuesta.status_code >= 300:
			if 'invalid_grant' in respuesta.text:
				raise RuntimeError('Gmail: el refresh token venció o fue revocado. Genera uno nuevo en OAuth Playground.')
			raise RuntimeError(f'Gmail (token) respondió {respuesta.status_code}: {respuesta.text[:200]}')
		datos = respuesta.json()
		cache.set(self.CLAVE_CACHE, datos['access_token'], max(int(datos.get('expires_in', 3600)) - 60, 60))
		return datos['access_token']

	@staticmethod
	def _mensaje_raw(destino, asunto, html, texto=''):
		mensaje = EmailMessage()
		mensaje['From'] = formataddr((settings.EMAIL_REMITENTE_NOMBRE, settings.EMAIL_REMITENTE))
		mensaje['To'] = destino
		mensaje['Subject'] = asunto
		mensaje.set_content(texto or re.sub(r'<[^>]+>', '', html).strip())
		mensaje.add_alternative(html, subtype='html')
		return base64.urlsafe_b64encode(mensaje.as_bytes()).decode()

	def _post(self, raw):
		return requests.post(
			self.SEND_URL,
			headers={'Authorization': f'Bearer {self._access_token()}'},
			json={'raw': raw},
			timeout=15,
		)

	def enviar(self, destino, asunto, html, texto=''):
		raw = self._mensaje_raw(destino, asunto, html, texto)
		respuesta = self._post(raw)
		if respuesta.status_code == 401:
			# Token vencido o revocado antes de tiempo: se pide otro y se reintenta una vez.
			cache.delete(self.CLAVE_CACHE)
			respuesta = self._post(raw)
		if respuesta.status_code >= 300:
			raise RuntimeError(f'Gmail respondió {respuesta.status_code}: {respuesta.text[:200]}')
		logger.info('Correo enviado por Gmail a %s', destino)


def obtener_emisor():
	if settings.EMAIL_EMISOR == 'brevo':
		if not settings.BREVO_API_KEY or not settings.EMAIL_REMITENTE:
			raise ImproperlyConfigured('EMAIL_EMISOR=brevo requiere BREVO_API_KEY y EMAIL_REMITENTE.')
		if not settings.BREVO_API_KEY.startswith('xkeysib-'):
			# Las claves "xsmtpsib-" son de SMTP y la API HTTP las rechaza con 401 "Key not found".
			raise ImproperlyConfigured('BREVO_API_KEY debe ser una clave de API (empieza con "xkeysib-"), no una clave SMTP.')
		return EmisorBrevo()
	if settings.EMAIL_EMISOR == 'gmail':
		faltan = [n for n in ('GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN') if not getattr(settings, n, '')]
		if faltan or '@' not in settings.EMAIL_REMITENTE:
			raise ImproperlyConfigured(
				'EMAIL_EMISOR=gmail requiere GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN y EMAIL_REMITENTE.'
			)
		return EmisorGmail()
	return EmisorConsola()
