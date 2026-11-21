import threading

from django.test import TestCase, override_settings

from cuentas.servicios.tareas import en_segundo_plano


@override_settings(TAREAS_EN_SEGUNDO_PLANO=True)
class TareasEnSegundoPlanoTest(TestCase):
	def test_se_ejecuta_en_otro_hilo_despues_del_commit(self):
		listo = threading.Event()
		hilos = []

		def tarea(valor):
			hilos.append((threading.current_thread() is not threading.main_thread(), valor))
			listo.set()

		with self.captureOnCommitCallbacks(execute=True) as callbacks:
			en_segundo_plano(tarea, 'ok')
			self.assertFalse(listo.is_set(), 'No debe ejecutarse antes del commit')
		self.assertEqual(len(callbacks), 1)
		self.assertTrue(listo.wait(5))
		self.assertEqual(hilos, [(True, 'ok')])

	def test_un_error_se_registra_y_no_se_propaga(self):
		listo = threading.Event()

		def tarea():
			listo.set()
			raise RuntimeError('correo caído')

		with self.assertLogs('cuentas.servicios.tareas', level='ERROR'):
			with self.captureOnCommitCallbacks(execute=True):
				en_segundo_plano(tarea)
			self.assertTrue(listo.wait(5))
			for hilo in threading.enumerate():
				if hilo.name.startswith('tarea-'):
					hilo.join(5)

	@override_settings(TAREAS_EN_SEGUNDO_PLANO=False)
	def test_en_linea_cuando_esta_desactivado(self):
		resultado = []
		en_segundo_plano(resultado.append, 1)
		self.assertEqual(resultado, [1])
