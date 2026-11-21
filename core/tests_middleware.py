from django.test import TestCase, override_settings


class PeticionesLentasTest(TestCase):
	@override_settings(PETICION_LENTA_MS=-1)
	def test_registra_metodo_ruta_tiempo_y_consultas(self):
		with self.assertLogs('rendimiento', level='WARNING') as registro:
			self.client.get('/api/v1/reportes/estadisticas-publicas/')
		self.assertEqual(len(registro.output), 1)
		self.assertRegex(registro.output[0], r'Petición lenta: GET /api/v1/reportes/estadisticas-publicas/ \d+ ms, \d+ consultas, estado \d{3}')
		self.assertNotIn(' 0 consultas', registro.output[0])

	def test_no_registra_peticiones_rapidas(self):
		with self.assertNoLogs('rendimiento', level='WARNING'):
			self.client.get('/salud/')
