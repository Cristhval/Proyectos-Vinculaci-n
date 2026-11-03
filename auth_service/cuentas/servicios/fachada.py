"""AuthFacade (patrón Facade): punto único que usan las vistas para todo lo relacionado con el acceso.

Orquesta verificación anti-bots, búsqueda y validación de la cuenta, emisión de tokens y auditoría.
"""
from django.db.models import Q

from cuentas.models import Cuenta, MetodoAcceso, RegistroAcceso, normalizar_email
from cuentas.servicios.captcha import obtener_verificador
from cuentas.servicios.tokens import EmisorTokens

MENSAJE_CREDENCIALES = 'Usuario o contraseña incorrectos.'


class AuthError(Exception):
	def __init__(self, codigo, mensaje, http_status=400):
		super().__init__(mensaje)
		self.codigo = codigo
		self.mensaje = mensaje
		self.http_status = http_status


class AuthFacade:
	@staticmethod
	def verificar_captcha(captcha_token, ip=None):
		if not obtener_verificador().verificar(captcha_token, ip):
			raise AuthError('captcha_invalido', 'Verificación reCAPTCHA inválida o vencida. Vuelve a marcarla.', 400)

	@staticmethod
	def registrar_acceso(cuenta, identificador, metodo, exito, ip=None):
		RegistroAcceso.objects.create(
			cuenta=cuenta, identificador=(identificador or '')[:150], metodo=metodo, exito=exito, ip=ip,
		)

	@staticmethod
	def buscar_cuenta(identificador):
		valor = (identificador or '').strip()
		if not valor:
			return None
		return Cuenta.objects.filter(Q(username__iexact=valor) | Q(email__iexact=normalizar_email(valor))).first()

	@classmethod
	def login(cls, identificador, password, captcha_token, ip=None):
		cls.verificar_captcha(captcha_token, ip)
		cuenta = cls.buscar_cuenta(identificador)
		if not cuenta or not cuenta.is_active or not cuenta.check_password(password or ''):
			cls.registrar_acceso(cuenta, identificador, MetodoAcceso.PASSWORD, False, ip)
			raise AuthError('credenciales', MENSAJE_CREDENCIALES, 401)
		cls.registrar_acceso(cuenta, identificador, MetodoAcceso.PASSWORD, True, ip)
		return EmisorTokens.emitir(cuenta)
