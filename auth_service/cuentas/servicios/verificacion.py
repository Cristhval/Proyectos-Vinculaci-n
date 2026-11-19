import secrets
from datetime import timedelta

from django.contrib.auth.hashers import check_password, make_password
from django.core.cache import cache
from django.db import transaction
from django.template.loader import render_to_string
from django.utils import timezone

from cuentas.models import Cuenta, CodigoVerificacion
from cuentas.servicios.correo import obtener_emisor

EXPIRACION_MINUTOS = 10
MAX_INTENTOS = 5


def _contenido(cuenta, codigo):
	"""Arma el correo (HTML + texto plano) desde cuentas/templates/cuentas/correo/verificacion.*"""
	contexto = {'nombre': cuenta.first_name, 'email': cuenta.email, 'codigo': codigo, 'minutos': EXPIRACION_MINUTOS}
	html = render_to_string('cuentas/correo/verificacion.html', contexto)
	texto = render_to_string('cuentas/correo/verificacion.txt', contexto).strip()
	return html, texto


class ServicioVerificacionEmail:
	@staticmethod
	@transaction.atomic
	def crear(cuenta):
		CodigoVerificacion.objects.filter(cuenta=cuenta, usado=False).update(usado=True)
		codigo = f'{secrets.randbelow(1_000_000):06d}'
		CodigoVerificacion.objects.create(
			cuenta=cuenta,
			codigo_hash=make_password(codigo),
			expira=timezone.now() + timedelta(minutes=EXPIRACION_MINUTOS),
		)
		html, texto = _contenido(cuenta, codigo)
		obtener_emisor().enviar(cuenta.email, f'{codigo} es tu código de verificación · Vinculación UNL', html, texto)

	@staticmethod
	@transaction.atomic
	def verificar(email, codigo):
		from cuentas.servicios.fachada import AuthError

		cuenta = Cuenta.objects.por_email(email)
		registro = (
			CodigoVerificacion.objects.select_for_update()
			.filter(cuenta=cuenta, usado=False)
			.order_by('-creado')
			.first()
			if cuenta else None
		)
		if not registro or registro.expira < timezone.now() or registro.intentos >= MAX_INTENTOS:
			raise AuthError('codigo_invalido', 'El código no es válido o ya expiró.', 400)
		registro.intentos += 1
		registro.save(update_fields=['intentos'])
		if not check_password(codigo, registro.codigo_hash):
			raise AuthError('codigo_invalido', 'El código no es válido o ya expiró.', 400)
		registro.usado = True
		registro.save(update_fields=['usado'])
		cuenta.email_verificado = True
		solicitud = getattr(cuenta, 'solicitud', None)
		if solicitud:
			cuenta.save(update_fields=['email_verificado'])
			from cuentas.servicios.notificaciones import ServicioNotificacionesSolicitud
			ServicioNotificacionesSolicitud.notificar_creada(solicitud)
		else:
			cuenta.is_active = True
			cuenta.save(update_fields=['email_verificado', 'is_active'])

	@staticmethod
	def reenviar(email):
		"""Sin CAPTCHA: la pantalla del código no lo muestra. Lo protegen el límite por IP y la espera de 60 s por cuenta."""
		from cuentas.servicios.fachada import AuthError

		cuenta = Cuenta.objects.por_email(email)
		if not cuenta or cuenta.email_verificado or not hasattr(cuenta, 'solicitud'):
			raise AuthError('codigo_no_disponible', 'No hay un código pendiente para este correo.', 409)
		clave = f'verificacion-email:{cuenta.pk}'
		if cache.get(clave):
			raise AuthError('reenviar_demasiado_pronto', 'Espera un minuto antes de solicitar otro código.', 429)
		ServicioVerificacionEmail.crear(cuenta)
		cache.set(clave, True, 60)
