from unittest.mock import MagicMock, patch

from django.core.cache import cache
from rest_framework.test import APITestCase

from cuentas.models import Rol, SolicitudAcceso
from cuentas.tests.utils import crear_cuenta

URL = '/api/auth/verificar-email/reenviar/'


class ReenvioCodigoTest(APITestCase):
	def setUp(self):
		cache.clear()
		self.cuenta = crear_cuenta(username='ana', email='ana@unl.edu.ec', is_active=False)
		self.cuenta.email_verificado = False
		self.cuenta.save()
		SolicitudAcceso.objects.create(cuenta=self.cuenta, rol_solicitado=Rol.DOCENTE)
		self.emisor = MagicMock()
		parche = patch('cuentas.servicios.verificacion.obtener_emisor', return_value=self.emisor)
		parche.start()
		self.addCleanup(parche.stop)

	def test_reenvia_sin_captcha_aunque_recaptcha_este_activo(self):
		verificador = MagicMock()
		verificador.verificar.return_value = False
		with patch('cuentas.servicios.fachada.obtener_verificador', return_value=verificador):
			r = self.client.post(URL, {'email': 'ana@unl.edu.ec'}, format='json')
		self.assertEqual(r.status_code, 200, r.data)
		self.emisor.enviar.assert_called_once()

	def test_espera_entre_reenvios(self):
		self.client.post(URL, {'email': 'ana@unl.edu.ec'}, format='json')
		self.assertEqual(self.client.post(URL, {'email': 'ana@unl.edu.ec'}, format='json').status_code, 429)

	def test_limite_por_ip(self):
		for _ in range(3):
			self.client.post(URL, {'email': 'otro@unl.edu.ec'}, format='json')
		self.assertEqual(self.client.post(URL, {'email': 'ana@unl.edu.ec'}, format='json').status_code, 429)
