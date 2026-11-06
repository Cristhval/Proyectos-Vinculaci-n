from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase

from cuentas.models import Cuenta
from cuentas.servicios.tokens import EmisorTokens
from cuentas.tests.utils import autenticar, crear_cuenta


@override_settings(EMAIL_EMISOR='consola')
class RegistroTest(APITestCase):
	url = '/api/auth/registro/'
	datos = {
		'email': 'Nuevo@unl.edu.ec', 'password': 'Clave.Segura1',
		'first_name': 'Ana', 'last_name': 'Paz', 'documento_identidad': '1100000002', 'captcha_token': 'x',
	}

	def setUp(self):
		cache.clear()

	def test_registro_ignora_rol(self):
		r = self.client.post(self.url, {**self.datos, 'rol': 'ADMIN'}, format='json')
		self.assertEqual(r.status_code, 202, r.data)
		cuenta = Cuenta.objects.get(email='nuevo@unl.edu.ec')
		self.assertEqual(cuenta.rol, 'ESTUDIANTE')
		self.assertEqual(cuenta.email, 'nuevo@unl.edu.ec')
		self.assertFalse(cuenta.email_verificado)

	def test_registro_email_duplicado(self):
		crear_cuenta(username='otro', email='nuevo@unl.edu.ec')
		r = self.client.post(self.url, self.datos, format='json')
		self.assertEqual(r.status_code, 400)

	def test_registro_password_debil(self):
		r = self.client.post(self.url, {**self.datos, 'password': '123'}, format='json')
		self.assertEqual(r.status_code, 400)
		self.assertFalse(Cuenta.objects.filter(email='nuevo@unl.edu.ec').exists())


class SesionTest(APITestCase):
	def setUp(self):
		self.cuenta = crear_cuenta(username='doc', rol='DOCENTE')
		self.tokens = EmisorTokens.emitir(self.cuenta)

	def refrescar(self, refresh):
		return self.client.post('/api/auth/refresh/', {'refresh': refresh}, format='json')

	def test_refresh_rota_y_el_anterior_no_sirve(self):
		r = self.refrescar(self.tokens['refresh'])
		self.assertEqual(r.status_code, 200)
		self.assertTrue(r.data['data']['access'])
		self.assertNotEqual(r.data['data']['refresh'], self.tokens['refresh'])
		self.assertEqual(self.refrescar(self.tokens['refresh']).status_code, 401)

	def test_refresh_cuenta_desactivada(self):
		self.cuenta.is_active = False
		self.cuenta.save()
		self.assertEqual(self.refrescar(self.tokens['refresh']).status_code, 401)

	def test_refresh_lleva_rol_actualizado(self):
		self.cuenta.rol = 'COORDINADOR'
		self.cuenta.save()
		import jwt
		r = self.refrescar(self.tokens['refresh'])
		claims = jwt.decode(r.data['data']['access'], options={'verify_signature': False})
		self.assertEqual(claims['rol'], 'COORDINADOR')

	def test_logout_invalida_refresh(self):
		autenticar(self.client, self.cuenta)
		r = self.client.post('/api/auth/logout/', {'refresh': self.tokens['refresh']}, format='json')
		self.assertEqual(r.status_code, 200)
		self.client.credentials()
		self.assertEqual(self.refrescar(self.tokens['refresh']).status_code, 401)

	def test_me(self):
		autenticar(self.client, self.cuenta)
		r = self.client.get('/api/auth/me/')
		self.assertEqual(r.status_code, 200)
		self.assertEqual(r.data['data']['username'], 'doc')
