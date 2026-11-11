"""Proveedores externos de identidad.

- Strategy: cada proveedor (Google, GitHub, Facebook) implementa la misma interfaz `ProveedorIdentidad`.
- Factory: `FabricaProveedores.obtener(nombre)` entrega la estrategia configurada.
"""
from abc import ABC
from dataclasses import dataclass

from authlib.integrations.requests_client import OAuth2Session
from django.conf import settings
from django.http import Http404


@dataclass
class IdentidadExterna:
	uid: str
	email: str | None
	email_verificado: bool
	nombre: str = ''


class ProveedorIdentidad(ABC):
	nombre = ''
	etiqueta = ''
	url_autorizar = ''
	url_token = ''
	scope = ''
	metodo_auth_token = 'client_secret_post'
	parametros_extra = {}

	@property
	def client_id(self):
		return getattr(settings, f'{self.nombre.upper()}_CLIENT_ID', '')

	@property
	def client_secret(self):
		return getattr(settings, f'{self.nombre.upper()}_CLIENT_SECRET', '')

	def configurado(self):
		return bool(self.client_id and self.client_secret)

	def sesion(self, redirect_uri, token=None):
		return OAuth2Session(
			self.client_id, self.client_secret, scope=self.scope, redirect_uri=redirect_uri,
			token=token, token_endpoint_auth_method=self.metodo_auth_token,
		)

	def url_autorizacion(self, state, redirect_uri):
		url, _ = self.sesion(redirect_uri).create_authorization_url(self.url_autorizar, state=state, **self.parametros_extra)
		return url

	def obtener_identidad(self, code, redirect_uri):
		sesion = self.sesion(redirect_uri)
		sesion.fetch_token(self.url_token, code=code)
		return self.leer_identidad(sesion)

	def leer_identidad(self, sesion):
		"""Con la sesión ya autorizada, devuelve la IdentidadExterna del usuario (cada proveedor la define)."""
		raise NotImplementedError


class ProveedorGoogle(ProveedorIdentidad):
	nombre, etiqueta = 'google', 'Google'
	url_autorizar = 'https://accounts.google.com/o/oauth2/v2/auth'
	url_token = 'https://oauth2.googleapis.com/token'
	scope = 'openid email profile'
	parametros_extra = {'prompt': 'select_account'}

	def leer_identidad(self, sesion):
		datos = sesion.get('https://openidconnect.googleapis.com/v1/userinfo', timeout=10).json()
		return IdentidadExterna(
			uid=str(datos['sub']), email=datos.get('email'),
			email_verificado=bool(datos.get('email_verified')), nombre=datos.get('name', ''),
		)


class ProveedorGitHub(ProveedorIdentidad):
	nombre, etiqueta = 'github', 'GitHub'
	url_autorizar = 'https://github.com/login/oauth/authorize'
	url_token = 'https://github.com/login/oauth/access_token'
	scope = 'read:user user:email'

	def leer_identidad(self, sesion):
		cabeceras = {'Accept': 'application/vnd.github+json'}
		usuario = sesion.get('https://api.github.com/user', headers=cabeceras, timeout=10).json()
		correos = sesion.get('https://api.github.com/user/emails', headers=cabeceras, timeout=10).json()
		verificados = [c for c in correos if c.get('verified')]
		dominios = {dominio.lower() for dominio in settings.DOMINIOS_PERMITIDOS}
		elegido = next(
			(
				c for c in verificados
				if c.get('email', '').rsplit('@', 1)[-1].lower() in dominios
			),
			next((c for c in verificados if c.get('primary')), verificados[0] if verificados else None),
		)
		return IdentidadExterna(
			uid=str(usuario['id']), email=elegido['email'] if elegido else None,
			email_verificado=bool(elegido), nombre=usuario.get('name') or usuario.get('login', ''),
		)


class ProveedorFacebook(ProveedorIdentidad):
	nombre, etiqueta = 'facebook', 'Facebook'
	url_autorizar = 'https://www.facebook.com/v19.0/dialog/oauth'
	url_token = 'https://graph.facebook.com/v19.0/oauth/access_token'
	scope = 'email public_profile'

	def leer_identidad(self, sesion):
		datos = sesion.get('https://graph.facebook.com/v19.0/me', params={'fields': 'id,name,email'}, timeout=10).json()
		# Facebook solo entrega el correo si está confirmado en la cuenta.
		return IdentidadExterna(
			uid=str(datos['id']), email=datos.get('email'),
			email_verificado=bool(datos.get('email')), nombre=datos.get('name', ''),
		)


class FabricaProveedores:
	_proveedores = {p.nombre: p for p in (ProveedorGoogle, ProveedorGitHub, ProveedorFacebook)}

	@classmethod
	def obtener(cls, nombre):
		clase = cls._proveedores.get(nombre)
		if clase is None or not clase().configurado():
			raise Http404('Proveedor de identidad no disponible.')
		return clase()

	@classmethod
	def configurados(cls):
		return [nombre for nombre, clase in cls._proveedores.items() if clase().configurado()]

	@classmethod
	def etiqueta(cls, nombre):
		clase = cls._proveedores.get(nombre)
		return clase.etiqueta if clase else nombre
