"""Autenticación de dispositivos IoT (Authentication Strategy de DRF).

DRF elige la estrategia de autenticación por vista con ``authentication_classes``.
Los usuarios usan JWT RS256 (usuarios.autenticacion); los dispositivos usan esta
clase, con el encabezado::

	Authorization: Device dv_xxxxxxxx

No crea sesión ni usuario: ``request.user`` queda anónimo y ``request.auth`` es
el ``DispositivoIoT``. El token nunca se escribe en logs ni en la respuesta.
"""
from django.contrib.auth.models import AnonymousUser
from rest_framework import authentication, exceptions, permissions

from .models import DispositivoIoT
from .services import TokenInvalido, validar_token


class DeviceTokenAuthentication(authentication.BaseAuthentication):
	keyword = 'Device'

	def authenticate(self, request):
		partes = authentication.get_authorization_header(request).split()
		if not partes or partes[0].decode('latin-1').lower() != self.keyword.lower():
			return None  # Sin credenciales de dispositivo: la permission responde 401.
		if len(partes) != 2:
			raise exceptions.AuthenticationFailed('Encabezado inválido. Use: Authorization: Device <token>.')
		try:
			token = partes[1].decode('utf-8')
		except UnicodeError:
			raise exceptions.AuthenticationFailed('Token de dispositivo inválido.')
		try:
			dispositivo = validar_token(token)
		except TokenInvalido as e:
			raise exceptions.AuthenticationFailed(str(e))
		return AnonymousUser(), dispositivo

	def authenticate_header(self, request):
		# Con WWW-Authenticate, DRF responde 401 (y no 403) cuando falla la autenticación.
		return self.keyword


class EsDispositivoAutenticado(permissions.BasePermission):
	"""Exige un dispositivo autenticado, no un usuario."""

	message = 'Se requiere el token del dispositivo: Authorization: Device <token>.'

	def has_permission(self, request, view):
		return isinstance(request.auth, DispositivoIoT)
