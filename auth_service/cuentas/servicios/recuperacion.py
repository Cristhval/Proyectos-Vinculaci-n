"""Recuperación de contraseña con enlace temporal (30 min) de un solo uso."""
import logging
from html import escape
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from cuentas.models import Cuenta, MetodoAcceso
from cuentas.servicios.correo import obtener_emisor
from cuentas.servicios.fachada import AuthError, AuthFacade

logger = logging.getLogger(__name__)
MENSAJE_SOLICITUD = 'Si el correo está registrado, te llegará un enlace para restablecer tu contraseña.'
MENSAJE_ENLACE = 'El enlace no es válido o ya expiró.'


def _html(cuenta, enlace):
	nombre = escape(cuenta.first_name or cuenta.username)
	return (
		f'<p>Hola {nombre},</p>'
		'<p>Recibimos una solicitud para restablecer tu contraseña del Sistema de Vinculación con la Sociedad (UNL).</p>'
		f'<p><a href="{escape(enlace)}">Restablecer mi contraseña</a></p>'
		'<p>El enlace vence en 30 minutos y solo puede usarse una vez. Si no lo solicitaste, ignora este correo.</p>'
	)


class ServicioRecuperacion:
	@staticmethod
	def solicitar(email, captcha_token, ip=None):
		AuthFacade.verificar_captcha(captcha_token, ip)
		cuenta = Cuenta.objects.por_email(email)
		if not cuenta or not cuenta.is_active:
			AuthFacade.registrar_acceso(cuenta, email, MetodoAcceso.RECUPERACION, False, ip)
			return
		uid = urlsafe_base64_encode(force_bytes(cuenta.pk))
		token = default_token_generator.make_token(cuenta)
		enlace = f'{settings.FRONTEND_URL}/restablecer?{urlencode({"uid": uid, "token": token})}'
		try:
			obtener_emisor().enviar(cuenta.email, 'Restablece tu contraseña — Vinculación UNL', _html(cuenta, enlace))
		except Exception:
			logger.exception('No se pudo enviar el correo de recuperación a la cuenta %s', cuenta.pk)
		AuthFacade.registrar_acceso(cuenta, email, MetodoAcceso.RECUPERACION, True, ip)

	@staticmethod
	def restablecer(uid, token, password, password2):
		try:
			cuenta = Cuenta.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
		except (ValueError, TypeError, OverflowError, Cuenta.DoesNotExist):
			cuenta = None
		if cuenta is None or not cuenta.is_active or not default_token_generator.check_token(cuenta, token):
			raise AuthError('enlace_invalido', MENSAJE_ENLACE, 400)
		AuthFacade.fijar_contrasena(cuenta, password, password2)
