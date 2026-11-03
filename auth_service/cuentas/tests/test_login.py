from unittest.mock import patch

from django.core.cache import cache
from rest_framework.test import APITestCase

from cuentas.models import RegistroAcceso
from cuentas.tests.utils import crear_cuenta

MENSAJE = 'Usuario o contraseña incorrectos.'


class CaptchaFalso:
	def __init__(self, valido=True):
		self.valido = valido

	def verificar(self, token, ip=None):
		return self.valido


class LoginTest(APITestCase):
	url = '/api/auth/login/'

	def setUp(self):
		cache.clear()
		self.admin = crear_cuenta(username='admin', rol='ADMIN', email='admin@unl.edu.ec')
		parche = patch('cuentas.servicios.fachada.obtener_verificador', return_value=CaptchaFalso())
		self.verificador = parche.start()
		self.addCleanup(parche.stop)

	def login(self, usuario, password='Clave.Segura1'):
		return self.client.post(self.url, {'usuario': usuario, 'password': password, 'captcha_token': 'ok'}, format='json')

	def test_login_correcto_por_username(self):
		r = self.login('admin')
		self.assertEqual(r.status_code, 200)
		self.assertTrue(r.data['data']['access'])
		self.assertEqual(r.data['data']['user']['rol'], 'ADMIN')
		self.assertTrue(RegistroAcceso.objects.filter(cuenta=self.admin, exito=True, metodo='password').exists())

	def test_login_por_correo_normaliza(self):
		r = self.login('  Admin@UNL.edu.ec ')
		self.assertEqual(r.status_code, 200)

	def test_password_incorrecta_y_usuario_inexistente_mismo_mensaje(self):
		r1 = self.login('admin', 'otra-clave')
		r2 = self.login('nadie')
		self.assertEqual(r1.status_code, 401)
		self.assertEqual(r2.status_code, 401)
		self.assertEqual(r1.data['message'], MENSAJE)
		self.assertEqual(r2.data['message'], MENSAJE)
		self.assertEqual(RegistroAcceso.objects.filter(exito=False).count(), 2)

	def test_cuenta_inactiva(self):
		self.admin.is_active = False
		self.admin.save()
		r = self.login('admin')
		self.assertEqual(r.status_code, 401)
		self.assertEqual(r.data['message'], MENSAJE)

	def test_captcha_invalido(self):
		self.verificador.return_value = CaptchaFalso(valido=False)
		r = self.login('admin')
		self.assertEqual(r.status_code, 400)
		self.assertIn('reCAPTCHA', r.data['message'])
		self.assertFalse(RegistroAcceso.objects.filter(exito=True).exists())

	def test_throttle(self):
		for _ in range(5):
			self.login('admin', 'mala')
		r = self.login('admin', 'mala')
		self.assertEqual(r.status_code, 429)


class VerificadorCaptchaTest(APITestCase):
	def test_sin_secreto_en_tests_usa_desactivado(self):
		from cuentas.servicios.captcha import CaptchaDesactivado, obtener_verificador
		with self.settings(RECAPTCHA_SECRET_KEY=''):
			self.assertIsInstance(obtener_verificador(), CaptchaDesactivado)

	def test_recaptcha_error_de_red_es_invalido(self):
		import requests
		from cuentas.servicios.captcha import RecaptchaV2
		with patch('cuentas.servicios.captcha.requests.post', side_effect=requests.RequestException):
			self.assertFalse(RecaptchaV2('secreto').verificar('token'))

	def test_recaptcha_token_vacio_es_invalido(self):
		from cuentas.servicios.captcha import RecaptchaV2
		self.assertFalse(RecaptchaV2('secreto').verificar(''))
