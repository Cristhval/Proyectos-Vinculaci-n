import jwt
from rest_framework.test import APITestCase

from cuentas.tests.utils import autenticar, crear_cuenta

URL = '/api/auth/me/documento/'


class RegistrarDocumentoTest(APITestCase):
	def setUp(self):
		self.cuenta = crear_cuenta(username='ana', email='ana@unl.edu.ec', documento_identidad=None)
		autenticar(self.client, self.cuenta)

	def test_registra_una_vez_y_devuelve_token_con_cedula(self):
		r = self.client.post(URL, {'documento_identidad': '110560674-1'}, format='json')
		self.assertEqual(r.status_code, 200, r.data)
		self.cuenta.refresh_from_db()
		self.assertEqual(self.cuenta.documento_identidad, '1105606741')
		claims = jwt.decode(r.data['data']['access'], options={'verify_signature': False})
		self.assertEqual(claims['documento_identidad'], '1105606741')
		otra = self.client.post(URL, {'documento_identidad': '1103457899'}, format='json')
		self.assertEqual(otra.status_code, 409)

	def test_cedula_invalida(self):
		r = self.client.post(URL, {'documento_identidad': '1234567891'}, format='json')
		self.assertEqual(r.status_code, 400)

	def test_cedula_de_otra_cuenta(self):
		crear_cuenta(username='luis', email='luis@unl.edu.ec', documento_identidad='1105606741')
		r = self.client.post(URL, {'documento_identidad': '1105606741'}, format='json')
		self.assertEqual(r.status_code, 409)

	def test_requiere_sesion(self):
		self.client.credentials()
		self.assertEqual(self.client.post(URL, {'documento_identidad': '1105606741'}, format='json').status_code, 401)
