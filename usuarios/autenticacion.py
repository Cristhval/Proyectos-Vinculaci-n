"""Autenticación de la API principal con tokens emitidos por auth-service.

La API principal no conoce contraseñas: valida la firma RS256 con la clave pública de auth-service,
verifica emisor y audiencia, y sincroniza la copia local del usuario con los datos del token.
"""
import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

from .sincronizacion import SincronizadorUsuario


class AuthServiceJWTAuthentication(BaseAuthentication):
	www_authenticate_realm = 'api'

	def authenticate_header(self, request):
		return f'Bearer realm="{self.www_authenticate_realm}"'

	def authenticate(self, request):
		partes = get_authorization_header(request).split()
		if not partes or partes[0].lower() != b'bearer':
			return None
		if len(partes) != 2:
			raise AuthenticationFailed('Encabezado Authorization inválido.')
		claims = self.validar(partes[1].decode())
		usuario = SincronizadorUsuario.desde_claims(claims)
		if not usuario.is_active or not usuario.perfil.activo:
			raise AuthenticationFailed('Usuario inactivo.')
		return usuario, claims

	@staticmethod
	def validar(token):
		config = settings.SIMPLE_JWT
		if not config.get('VERIFYING_KEY'):
			raise AuthenticationFailed('El servidor no tiene configurada la clave pública de auth-service (AUTH_PUBLIC_KEY).')
		try:
			claims = jwt.decode(
				token, config['VERIFYING_KEY'], algorithms=['RS256'],
				audience=config['AUDIENCE'], issuer=config['ISSUER'],
				options={'require': ['exp', 'sub', 'iss', 'aud']},
			)
		except jwt.ExpiredSignatureError:
			raise AuthenticationFailed('La sesión expiró.', code='token_expired')
		except jwt.InvalidTokenError:
			raise AuthenticationFailed('Token inválido.', code='token_not_valid')
		if claims.get('token_type') != 'access':
			raise AuthenticationFailed('Se requiere un token de acceso.', code='token_not_valid')
		return claims
