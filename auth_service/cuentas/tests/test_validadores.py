from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

from cuentas.validadores import ValidadorCedulaEcuatoriana


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
