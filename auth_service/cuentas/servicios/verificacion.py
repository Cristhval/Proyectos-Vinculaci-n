import secrets
from datetime import timedelta
from html import escape

from django.contrib.auth.hashers import check_password, make_password
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from cuentas.models import Cuenta, CodigoVerificacion
from cuentas.servicios.correo import obtener_emisor

EXPIRACION_MINUTOS = 10
MAX_INTENTOS = 5


def _html(cuenta, codigo):
	return (
		f'<p>Hola {escape(cuenta.first_name)},</p>'
		'<p>Usa este código para verificar tu correo en el Sistema de Vinculación con la Sociedad:</p>'
		f'<p style="font-size:28px;font-weight:bold;letter-spacing:8px">{codigo}</p>'
		'<p>El código vence en 10 minutos. Si no solicitaste esta cuenta, ignora este correo.</p>'
	)


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
		obtener_emisor().enviar(
			cuenta.email,
			'Verifica tu correo — Vinculación UNL',
			_html(cuenta, codigo),
		)

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
