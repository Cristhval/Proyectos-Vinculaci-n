import html
import re
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase

from cuentas.servicios.correo import EmisorBrevo, EmisorConsola
from cuentas.servicios.tokens import EmisorTokens
from cuentas.tests.utils import crear_cuenta

MENSAJE = 'Si el correo está registrado, te llegará un enlace para restablecer tu contraseña.'
FRONT = 'http://front.test'


class EmisorDoble:
	def __init__(self):
		self.enviados = []

	def enviar(self, destino, asunto, html, texto=''):
		self.enviados.append((destino, asunto, html, texto))


@override_settings(FRONTEND_URL=FRONT)
class RecuperacionTest(APITestCase):
	def setUp(self):
		cache.clear()
		self.cuenta = crear_cuenta(username='doc', email='doc@unl.edu.ec')
		self.emisor = EmisorDoble()
		parche = patch('cuentas.servicios.recuperacion.obtener_emisor', return_value=self.emisor)
		parche.start()
		self.addCleanup(parche.stop)

	def solicitar(self, email):
		return self.client.post('/api/auth/password/solicitar/', {'email': email, 'captcha_token': 'x'}, format='json')

	def enlace(self):
		self.solicitar('doc@unl.edu.ec')
		url = html.unescape(re.search(r'href="([^"]+)"', self.emisor.enviados[-1][2]).group(1))
		q = parse_qs(urlparse(url).query)
		return q['uid'][0], q['token'][0]

	def restablecer(self, uid, token, password='Nueva.Clave77', password2=None):
		return self.client.post('/api/auth/password/restablecer/', {
			'uid': uid, 'token': token, 'password': password, 'password2': password2 or password,
		}, format='json')

	def test_solicitar_misma_respuesta_exista_o_no(self):
		r1 = self.solicitar('  DOC@unl.edu.ec')
		r2 = self.solicitar('nadie@unl.edu.ec')
		self.assertEqual((r1.status_code, r2.status_code), (200, 200))
		self.assertEqual(r1.data['message'], MENSAJE)
		self.assertEqual(r2.data['message'], MENSAJE)
		self.assertEqual(len(self.emisor.enviados), 1)
		self.assertEqual(self.emisor.enviados[0][0], 'doc@unl.edu.ec')
		self.assertIn(f'{FRONT}/restablecer?uid=', self.emisor.enviados[0][2])

	def test_correo_profesional_html_y_texto(self):
		self.cuenta.first_name = 'Ana'
		self.cuenta.save()
		self.solicitar('doc@unl.edu.ec')
		destino, asunto, cuerpo, texto = self.emisor.enviados[0]
		self.assertEqual(asunto, 'Restablece tu contraseña · Vinculación UNL')
		self.assertIn('Hola, Ana', cuerpo)
		self.assertIn('Crear nueva contraseña', cuerpo)
		self.assertIn('30 minutos', cuerpo)
		self.assertIn('<!doctype html>', cuerpo.lower())
		# versión de texto plano: mismo enlace, sin escapar, para clientes sin HTML y mejor entregabilidad
		self.assertIn(f'{FRONT}/restablecer?uid=', texto)
		self.assertIn('&token=', texto)
		self.assertNotIn('<', texto)

	def test_cuenta_inactiva_no_recibe_correo(self):
		self.cuenta.is_active = False
		self.cuenta.save()
		self.assertEqual(self.solicitar('doc@unl.edu.ec').status_code, 200)
		self.assertEqual(self.emisor.enviados, [])

	def test_restablecer_cambia_password_y_cierra_sesiones(self):
		tokens = EmisorTokens.emitir(self.cuenta)
		uid, token = self.enlace()
		r = self.restablecer(uid, token)
		self.assertEqual(r.status_code, 200, r.data)
		self.cuenta.refresh_from_db()
		self.assertTrue(self.cuenta.check_password('Nueva.Clave77'))
		self.assertEqual(self.client.post('/api/auth/refresh/', {'refresh': tokens['refresh']}, format='json').status_code, 401)

	def test_token_reutilizado_falla(self):
		uid, token = self.enlace()
		self.assertEqual(self.restablecer(uid, token).status_code, 200)
		r = self.restablecer(uid, token, 'Otra.Clave88')
		self.assertEqual(r.status_code, 400)
		self.assertEqual(r.data['message'], 'El enlace no es válido o ya expiró.')

	def test_token_vencido(self):
		uid, token = self.enlace()
		with override_settings(PASSWORD_RESET_TIMEOUT=-1):
			self.assertEqual(self.restablecer(uid, token).status_code, 400)

	def test_passwords_no_coinciden(self):
		uid, token = self.enlace()
		self.assertEqual(self.restablecer(uid, token, 'Nueva.Clave77', 'Distinta.Clave77').status_code, 400)

	def test_uid_basura(self):
		self.assertEqual(self.restablecer('@@@', 'x').status_code, 400)

	def test_throttle(self):
		for _ in range(3):
			self.solicitar('doc@unl.edu.ec')
		self.assertEqual(self.solicitar('doc@unl.edu.ec').status_code, 429)


class EmisoresTest(APITestCase):
	def test_consola_no_falla(self):
		with self.assertLogs('cuentas.servicios.correo', level='INFO'):
			EmisorConsola().enviar('a@b.c', 'Asunto', '<p>hola</p>')

	@override_settings(BREVO_API_KEY='k', EMAIL_REMITENTE='rem@unl.edu.ec', EMAIL_REMITENTE_NOMBRE='Vinculación UNL')
	def test_brevo_envia_payload(self):
		with patch('cuentas.servicios.correo.requests.post') as post:
			post.return_value.status_code = 201
			EmisorBrevo().enviar('a@b.c', 'Asunto', '<p>hola</p>', 'hola')
		args, kwargs = post.call_args
		self.assertEqual(args[0], 'https://api.brevo.com/v3/smtp/email')
		self.assertEqual(kwargs['headers']['api-key'], 'k')
		self.assertEqual(kwargs['json']['to'], [{'email': 'a@b.c'}])
		self.assertEqual(kwargs['json']['sender'], {'email': 'rem@unl.edu.ec', 'name': 'Vinculación UNL'})
		self.assertEqual(kwargs['json']['textContent'], 'hola')

	@override_settings(BREVO_API_KEY='xsmtpsib-abc', EMAIL_EMISOR='brevo', EMAIL_REMITENTE='rem@unl.edu.ec')
	def test_brevo_rechaza_clave_smtp(self):
		from django.core.exceptions import ImproperlyConfigured
		from cuentas.servicios.correo import obtener_emisor
		with self.assertRaisesMessage(ImproperlyConfigured, 'xkeysib-'):
			obtener_emisor()
