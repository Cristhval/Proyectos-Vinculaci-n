import json

import jwt
from rest_framework.test import APITestCase

from cuentas.servicios.tokens import EmisorTokens
from cuentas.tests.utils import crear_cuenta


class TokensTest(APITestCase):
	def test_access_contiene_claims_y_verifica_con_jwks(self):
		cuenta = crear_cuenta(username='doc', rol='DOCENTE', email='doc@unl.edu.ec', documento_identidad='1103983456')
		tokens = EmisorTokens.emitir(cuenta)

		jwk = self.client.get('/.well-known/jwks.json').json()['keys'][0]
		clave = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))
		claims = jwt.decode(
			tokens['access'], clave, algorithms=['RS256'],
			audience='vinculacion-api', issuer='vinculacion-auth',
		)

		self.assertEqual(claims['sub'], str(cuenta.id))
		self.assertEqual(claims['rol'], 'DOCENTE')
		self.assertEqual(claims['email'], 'doc@unl.edu.ec')
		self.assertEqual(claims['documento_identidad'], '1103983456')
		self.assertEqual(jwk['alg'], 'RS256')
		self.assertTrue(jwk['kid'])
		self.assertEqual(tokens['user']['rol'], 'DOCENTE')

	def test_refresh_tambien_lleva_rol(self):
		cuenta = crear_cuenta(username='coord', rol='COORDINADOR')
		tokens = EmisorTokens.emitir(cuenta)
		claims = jwt.decode(tokens['refresh'], options={'verify_signature': False})
		self.assertEqual(claims['rol'], 'COORDINADOR')

	def test_salud(self):
		respuesta = self.client.get('/salud/').json()
		self.assertIs(respuesta['success'], True)
