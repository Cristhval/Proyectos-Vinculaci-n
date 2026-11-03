"""Verificación anti-bots (patrón Strategy): reCAPTCHA v2 en producción, desactivado solo en desarrollo/tests."""
import logging
from abc import ABC, abstractmethod

import requests
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

logger = logging.getLogger(__name__)
URL_VERIFICACION = 'https://www.google.com/recaptcha/api/siteverify'


class VerificadorCaptcha(ABC):
	@abstractmethod
	def verificar(self, token, ip=None):
		"""Devuelve True si el token demuestra que quien envía la petición es una persona."""


class RecaptchaV2(VerificadorCaptcha):
	def __init__(self, secreto):
		self.secreto = secreto

	def verificar(self, token, ip=None):
		if not token:
			return False
		datos = {'secret': self.secreto, 'response': token}
		if ip:
			datos['remoteip'] = ip
		try:
			respuesta = requests.post(URL_VERIFICACION, data=datos, timeout=5)
			return bool(respuesta.json().get('success'))
		except (requests.RequestException, ValueError):
			logger.warning('No se pudo verificar reCAPTCHA con Google.')
			return False


class CaptchaDesactivado(VerificadorCaptcha):
	def verificar(self, token, ip=None):
		return True


def obtener_verificador():
	if settings.RECAPTCHA_SECRET_KEY:
		return RecaptchaV2(settings.RECAPTCHA_SECRET_KEY)
	if settings.DEBUG or getattr(settings, 'TESTING', False):
		return CaptchaDesactivado()
	raise ImproperlyConfigured('RECAPTCHA_SECRET_KEY es obligatorio en producción.')
