import re
from abc import ABC, abstractmethod

from django.core.exceptions import ValidationError


class ValidadorDocumento(ABC):
	@abstractmethod
	def validar(self, valor):
		"""Valida un documento o lanza ValidationError."""


class ValidadorCedulaEcuatoriana(ValidadorDocumento):
	MENSAJE = 'La cédula no es válida. Revisa los 10 dígitos.'

	def validar(self, valor):
		cedula = re.sub(r'[\s-]', '', str(valor or ''))
		if not re.fullmatch(r'\d{10}', cedula) or len(set(cedula)) == 1:
			raise ValidationError(self.MENSAJE)
		provincia = int(cedula[:2])
		if provincia not in range(1, 25) and provincia != 30:
			raise ValidationError(self.MENSAJE)
		if int(cedula[2]) >= 6:
			raise ValidationError(self.MENSAJE)
		suma = sum(
			(int(digito) * coeficiente - 9 if int(digito) * coeficiente >= 10 else int(digito) * coeficiente)
			for digito, coeficiente in zip(cedula[:9], (2, 1, 2, 1, 2, 1, 2, 1, 2))
		)
		if (10 - suma % 10) % 10 != int(cedula[-1]):
			raise ValidationError(self.MENSAJE)
		return None
