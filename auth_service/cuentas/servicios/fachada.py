"""AuthFacade (patrón Facade): punto único que usan las vistas para todo lo relacionado con el acceso.

Orquesta verificación anti-bots, búsqueda y validación de la cuenta, emisión de tokens y auditoría.
"""
import secrets
from datetime import timedelta

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from cuentas.models import (
	CodigoIntercambio, Cuenta, IdentidadSocial, MetodoAcceso, RegistroAcceso, Rol, normalizar_email,
)
from cuentas.servicios.captcha import obtener_verificador
from cuentas.servicios.tokens import EmisorTokens

MENSAJE_CREDENCIALES = 'Usuario o contraseña incorrectos.'
MENSAJE_SESION = 'Sesión inválida o expirada. Inicia sesión nuevamente.'


class AuthError(Exception):
	def __init__(self, codigo, mensaje, http_status=400, detalle=None):
		super().__init__(mensaje)
		self.codigo = codigo
		self.mensaje = mensaje
		self.http_status = http_status
		self.detalle = detalle or {}


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

	@staticmethod
	def validar_datos_cuenta(datos, instancia=None):
		"""Valida unicidad y fortaleza de contraseña. Lanza AuthError('datos_invalidos') con el detalle."""
		from django.contrib.auth.password_validation import validate_password
		from django.core.exceptions import ValidationError

		errores = {}
		qs = Cuenta.objects.exclude(pk=instancia.pk) if instancia else Cuenta.objects.all()
		if 'username' in datos and qs.filter(username__iexact=datos['username']).exists():
			errores['username'] = ['Ese nombre de usuario ya está en uso.']
		if 'email' in datos and qs.filter(email__iexact=normalizar_email(datos['email'])).exists():
			errores['email'] = ['Ese correo ya está registrado.']
		if datos.get('documento_identidad') and qs.filter(documento_identidad=datos['documento_identidad']).exists():
			errores['documento_identidad'] = ['Ese documento de identidad ya está registrado.']
		if 'password' in datos:
			referencia = instancia or Cuenta(username=datos.get('username', ''), email=datos.get('email', ''))
			try:
				validate_password(datos['password'], referencia)
			except ValidationError as error:
				errores['password'] = list(error.messages)
		if errores:
			raise AuthError('datos_invalidos', 'Revisa los datos ingresados.', 400, errores)

	@classmethod
	def crear_cuenta(cls, datos, rol=Rol.ESTUDIANTE):
		cls.validar_datos_cuenta(datos)
		campos = {k: datos.get(k, '') for k in ('first_name', 'last_name', 'documento_identidad')}
		return Cuenta.objects.create_user(
			username=datos['username'], email=datos['email'], password=datos['password'], rol=rol, **campos,
		)

	@classmethod
	def registrar(cls, datos, captcha_token, ip=None):
		cls.verificar_captcha(captcha_token, ip)
		return cls.crear_cuenta(datos, rol=Rol.ESTUDIANTE)

	@staticmethod
	def refrescar(refresh):
		try:
			token = RefreshToken(refresh)
			cuenta = Cuenta.objects.get(pk=token['sub'])
		except (TokenError, Cuenta.DoesNotExist, KeyError):
			raise AuthError('sesion_invalida', MENSAJE_SESION, 401)
		if not cuenta.is_active:
			token.blacklist()
			raise AuthError('sesion_invalida', MENSAJE_SESION, 401)
		token.blacklist()
		tokens = EmisorTokens.emitir(cuenta)
		return {'access': tokens['access'], 'refresh': tokens['refresh']}

	@staticmethod
	def cerrar_sesion(refresh):
		try:
			RefreshToken(refresh).blacklist()
		except TokenError:
			pass

	@classmethod
	def editar_cuenta(cls, cuenta, datos):
		cls.validar_datos_cuenta(datos, instancia=cuenta)
		for campo, valor in datos.items():
			setattr(cuenta, campo, valor)
		cuenta.save()
		if datos.get('is_active') is False:
			cls.revocar_sesiones(cuenta)
		return cuenta

	@classmethod
	def fijar_contrasena(cls, cuenta, password, password2):
		if password != password2:
			raise AuthError('datos_invalidos', 'Las contraseñas no coinciden.', 400, {'password2': ['Las contraseñas no coinciden.']})
		cls.validar_datos_cuenta({'password': password}, instancia=cuenta)
		cuenta.set_password(password)
		cuenta.save(update_fields=['password'])
		cls.revocar_sesiones(cuenta)

	@staticmethod
	def revocar_sesiones(cuenta):
		from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
		for token in OutstandingToken.objects.filter(user=cuenta):
			BlacklistedToken.objects.get_or_create(token=token)

	@classmethod
	def resolver_social(cls, proveedor, identidad, ip=None):
		"""Vincula solo cuentas existentes: por identidad ya vinculada o por correo verificado."""
		vinculo = IdentidadSocial.objects.select_related('cuenta').filter(proveedor=proveedor, uid_externo=identidad.uid).first()
		cuenta = vinculo.cuenta if vinculo else None
		if cuenta is None and identidad.email and identidad.email_verificado:
			cuenta = Cuenta.objects.por_email(identidad.email)
			if cuenta and cuenta.is_active:
				IdentidadSocial.objects.create(cuenta=cuenta, proveedor=proveedor, uid_externo=identidad.uid)
		if cuenta is None or not cuenta.is_active:
			cls.registrar_acceso(cuenta, identidad.email or identidad.uid, proveedor, False, ip)
			raise AuthError('cuenta_no_registrada', 'La cuenta no está registrada en el sistema.', 403)
		cls.registrar_acceso(cuenta, identidad.email or identidad.uid, proveedor, True, ip)
		return cuenta

	@staticmethod
	def crear_codigo(cuenta):
		codigo = secrets.token_urlsafe(32)
		CodigoIntercambio.objects.create(codigo=codigo, cuenta=cuenta, expira=timezone.now() + timedelta(seconds=60))
		return codigo

	@staticmethod
	def canjear_codigo(codigo):
		with transaction.atomic():
			registro = CodigoIntercambio.objects.select_for_update().select_related('cuenta').filter(codigo=codigo).first()
			if not registro or registro.usado or registro.expira < timezone.now() or not registro.cuenta.is_active:
				raise AuthError('codigo_invalido', 'El código de acceso no es válido o ya expiró. Inicia sesión otra vez.', 400)
			registro.usado = True
			registro.save(update_fields=['usado'])
		return EmisorTokens.emitir(registro.cuenta)
