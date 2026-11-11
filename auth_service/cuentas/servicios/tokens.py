"""Emisión de tokens JWT firmados con RS256 y publicación de la clave pública (JWKS)."""
import hashlib
import json

import jwt
from cryptography.hazmat.primitives import serialization
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

CLAIMS_CUENTA = ('username', 'email', 'first_name', 'last_name', 'rol', 'documento_identidad')


class EmisorTokens:
	@staticmethod
	def datos_usuario(cuenta):
		datos = {'id': cuenta.id}
		datos.update({campo: getattr(cuenta, campo) or '' for campo in CLAIMS_CUENTA})
		return datos

	@classmethod
	def emitir(cls, cuenta):
		refresh = RefreshToken.for_user(cuenta)
		for campo in CLAIMS_CUENTA:
			refresh[campo] = getattr(cuenta, campo) or ''
		return {
			'access': str(refresh.access_token),
			'refresh': str(refresh),
			'user': cls.datos_usuario(cuenta),
		}


def _clave_publica():
	return serialization.load_pem_public_key(settings.JWT_PUBLIC_KEY.encode())


def kid():
	der = _clave_publica().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
	return hashlib.sha256(der).hexdigest()[:16]


def jwks():
	jwk = json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(_clave_publica()))
	jwk.update({'use': 'sig', 'alg': 'RS256', 'kid': kid()})
	return {'keys': [jwk]}
