from django.test import TestCase, override_settings


class PeticionesLentasTest(TestCase):
	@override_settings(PETICION_LENTA_MS=-1)
	def test_registra_las_peticiones_que_superan_el_umbral(self):
		with self.assertLogs('rendimiento', level='WARNING') as registro:
			self.client.get('/salud/')
		self.assertRegex(registro.output[0], r'Petición lenta: GET /salud/ \d+ ms, \d+ consultas, estado 200')

	def test_no_registra_peticiones_rapidas(self):
		with self.assertNoLogs('rendimiento', level='WARNING'):
			self.client.get('/salud/')

	def test_gzip_despues_de_whitenoise(self):
		from django.conf import settings
		middleware = settings.MIDDLEWARE
		self.assertIn('django.middleware.gzip.GZipMiddleware', middleware)
		self.assertGreater(
			middleware.index('django.middleware.gzip.GZipMiddleware'),
			middleware.index('whitenoise.middleware.WhiteNoiseMiddleware'),
		)
