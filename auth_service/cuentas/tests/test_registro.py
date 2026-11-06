import re
from unittest.mock import patch

from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase

from cuentas.models import Cuenta, CodigoVerificacion


class EmisorFalso:
	def __init__(self):
		self.html = ''

	def enviar(self, destino, asunto, html):
		self.html = html


class EmisorFallido:
	def enviar(self, destino, asunto, html):
		raise RuntimeError('fallo de proveedor')


@override_settings(EMAIL_EMISOR='consola')
class RegistroVerificacionTest(APITestCase):
	url = '/api/auth/registro/'

	def setUp(self):
		cache.clear()
		self.emisor = EmisorFalso()
		self.captcha = patch(
			'cuentas.servicios.fachada.obtener_verificador',
			return_value=type('Captcha', (), {'verificar': lambda *args: True})(),
		)
		self.captcha.start()
		self.addCleanup(self.captcha.stop)
		self.correo = patch('cuentas.servicios.verificacion.obtener_emisor', return_value=self.emisor)
		self.correo.start()
		self.addCleanup(self.correo.stop)

	def datos(self, **extra):
		datos = {
			'email': 'ana.paz@unl.edu.ec',
			'password': 'Clave.Segura1',
			'first_name': 'Ana',
			'last_name': 'Paz',
			'documento_identidad': '1100000001',
			'rol_solicitado': 'ESTUDIANTE',
			'motivo': 'Necesito acceder al sistema para gestionar mis proyectos.',
			'captcha_token': 'ok',
		}
		datos.update(extra)
		return datos

	def test_registro_genera_username_y_exige_verificacion(self):
		respuesta = self.client.post(self.url, self.datos(), format='json')
		self.assertEqual(respuesta.status_code, 202, respuesta.content)
		cuenta = Cuenta.objects.get(email='ana.paz@unl.edu.ec')
		self.assertTrue(cuenta.username.startswith('ana.paz'))
		self.assertFalse(cuenta.email_verificado)
		self.assertFalse(cuenta.is_active)
		self.assertEqual(CodigoVerificacion.objects.filter(cuenta=cuenta, usado=False).count(), 1)
		self.assertNotIn('password', respuesta.data['data'])

	def test_registro_rechaza_campos_obligatorios_y_correo_invalido(self):
		respuesta = self.client.post(self.url, self.datos(email='correo-invalido', first_name='', documento_identidad=''), format='json')
		self.assertEqual(respuesta.status_code, 400)
		self.assertIn('email', respuesta.data['data'])
		self.assertIn('first_name', respuesta.data['data'])
		self.assertIn('documento_identidad', respuesta.data['data'])

	@patch('cuentas.servicios.verificacion.obtener_emisor', return_value=EmisorFallido())
	def test_registro_revierte_cuenta_si_falla_envio(self, emisor):
		respuesta = self.client.post(self.url, self.datos(email='fallo@unl.edu.ec'), format='json')
		self.assertEqual(respuesta.status_code, 503)
		self.assertEqual(respuesta.data['data']['codigo'], 'correo_no_enviado')
		self.assertFalse(Cuenta.objects.filter(email='fallo@unl.edu.ec').exists())

	def test_verificar_codigo_activa_cuenta(self):
		self.client.post(self.url, self.datos(), format='json')
		cuenta = Cuenta.objects.get(email='ana.paz@unl.edu.ec')
		codigo = re.search(r'\b(\d{6})\b', self.emisor.html).group(1)
		respuesta = self.client.post(
			'/api/auth/verificar-email/',
			{'email': cuenta.email, 'codigo': codigo},
			format='json',
		)
		self.assertEqual(respuesta.status_code, 200, respuesta.content)
		cuenta.refresh_from_db()
		self.assertTrue(cuenta.email_verificado)
		self.assertFalse(cuenta.is_active)
		self.assertTrue(CodigoVerificacion.objects.get(cuenta=cuenta).usado)

	def test_verificar_codigo_incorrecto_no_activa_cuenta(self):
		self.client.post(self.url, self.datos(), format='json')
		respuesta = self.client.post(
			'/api/auth/verificar-email/',
			{'email': 'ana.paz@unl.edu.ec', 'codigo': '000000'},
			format='json',
		)
		self.assertEqual(respuesta.status_code, 400)
		self.assertFalse(Cuenta.objects.get(email='ana.paz@unl.edu.ec').is_active)
