"""Utilidades de pruebas: firma tokens RS256 como lo haría auth-service."""
import time
import uuid

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.conf import settings

_CLAVE = rsa.generate_private_key(public_exponent=65537, key_size=2048)
CLAVE_PRIVADA_TEST = _CLAVE.private_bytes(
	serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()
).decode()
CLAVE_PUBLICA_TEST = _CLAVE.public_key().public_bytes(
	serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
).decode()

SIMPLE_JWT_TEST = {**settings.SIMPLE_JWT, 'VERIFYING_KEY': CLAVE_PUBLICA_TEST}


def claims_de(perfil, **extra):
	if not perfil.auth_uid:
		perfil.auth_uid = str(perfil.user.pk + 1000)
		perfil.save(update_fields=['auth_uid'])
	user = perfil.user
	claims = {
		'sub': perfil.auth_uid,
		'username': user.username,
		'email': user.email or f'{user.username}@unl.edu.ec',
		'first_name': user.first_name,
		'last_name': user.last_name,
		'rol': perfil.rol,
		'documento_identidad': perfil.documento_identidad,
	}
	claims.update(extra)
	return claims


def token_para(perfil_o_claims, clave=None, **extra):
	"""Acepta un `Usuario` (perfil) o un dict de claims."""
	claims = dict(perfil_o_claims) if isinstance(perfil_o_claims, dict) else claims_de(perfil_o_claims)
	ahora = int(time.time())
	claims = {
		'token_type': 'access', 'jti': uuid.uuid4().hex, 'iat': ahora, 'exp': ahora + 1800,
		'iss': settings.SIMPLE_JWT['ISSUER'], 'aud': settings.SIMPLE_JWT['AUDIENCE'],
		**claims, **extra,
	}
	return jwt.encode(claims, clave or CLAVE_PRIVADA_TEST, algorithm='RS256')
