from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

from cuentas.validadores import ValidadorCedulaEcuatoriana, ValidadorCorreo


class ValidadorCedulaEcuatorianaTest(SimpleTestCase):
	def setUp(self):
		self.validador = ValidadorCedulaEcuatoriana()

	def test_acepta_cedulas_validas(self):
		for valor in ('1103983456', '0102030400'):
			with self.subTest(valor=valor):
				self.assertIsNone(self.validador.validar(valor))

	def test_rechaza_datos_invalidos(self):
		for valor in ('1234567891', '1111111111', '2512345678', '1163983456', '123456789', 'abcdefghij'):
			with self.subTest(valor=valor):
				with self.assertRaises(ValidationError):
					self.validador.validar(valor)

	def test_acepta_espacios_y_guiones_alrededor(self):
		self.assertIsNone(self.validador.validar('11-03983456'))


class ValidadorCorreoTest(SimpleTestCase):
	def setUp(self):
		self.validador = ValidadorCorreo()

	def test_quita_espacios_y_pasa_a_minusculas(self):
		self.assertEqual(self.validador.validar('  Ana.Paz@UNL.edu.ec '), 'ana.paz@unl.edu.ec')

	def test_rechaza_tildes_y_sugiere_correo_sin_ellas(self):
		with self.assertRaises(ValidationError) as contexto:
			self.validador.validar(' María.D.Quizhpe@unl.edu.ec')
		self.assertEqual(
			contexto.exception.messages,
			['El correo no debe llevar tildes ni ñ. ¿Quisiste decir maria.d.quizhpe@unl.edu.ec?'],
		)

	def test_sugiere_sin_n_con_virgulilla_ni_dieresis(self):
		self.assertEqual(self.validador.sugerir('ñandú.güemes@unl.edu.ec'), 'nandu.guemes@unl.edu.ec')
