import os
import subprocess
import sys
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.test import SimpleTestCase


AUTH_SERVICE_DIR = Path(__file__).resolve().parents[2]


class ConfiguracionTest(SimpleTestCase):
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		clave = rsa.generate_private_key(public_exponent=65537, key_size=2048)
		cls.private_key = clave.private_bytes(
			serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()
		).decode()
		cls.public_key = clave.public_key().public_bytes(
			serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
		).decode()

	def ejecutar_check(self, **variables):
		entorno = os.environ.copy()
		entorno['AUTH_ENV_FILE'] = os.devnull
		for nombre in ('DEBUG', 'SECRET_KEY', 'RECAPTCHA_SECRET_KEY', 'JWT_PRIVATE_KEY', 'JWT_PUBLIC_KEY'):
			entorno.pop(nombre, None)
		entorno.update(variables)
		return subprocess.run(
			[sys.executable, 'manage.py', 'check'],
			cwd=AUTH_SERVICE_DIR,
			env=entorno,
			capture_output=True,
			text=True,
			check=False,
		)

	def test_sin_debug_explicito_exige_recaptcha(self):
		resultado = self.ejecutar_check(SECRET_KEY='clave', JWT_PRIVATE_KEY=self.private_key, JWT_PUBLIC_KEY=self.public_key)
		self.assertNotEqual(resultado.returncode, 0)
		self.assertIn('RECAPTCHA_SECRET_KEY', resultado.stderr)

	def test_sin_debug_explicito_exige_secret_key(self):
		resultado = self.ejecutar_check(
			RECAPTCHA_SECRET_KEY='recaptcha',
			JWT_PRIVATE_KEY=self.private_key,
			JWT_PUBLIC_KEY=self.public_key,
		)
		self.assertNotEqual(resultado.returncode, 0)
		self.assertIn('SECRET_KEY', resultado.stderr)

	def test_produccion_completa_arranca(self):
		resultado = self.ejecutar_check(
			DEBUG='False',
			SECRET_KEY='clave',
			RECAPTCHA_SECRET_KEY='recaptcha',
			JWT_PRIVATE_KEY=self.private_key,
			JWT_PUBLIC_KEY=self.public_key,
		)
		self.assertEqual(resultado.returncode, 0, resultado.stderr)

	def test_desarrollo_explicito_arranca_sin_secretos(self):
		resultado = self.ejecutar_check(DEBUG='True')
		self.assertEqual(resultado.returncode, 0, resultado.stderr)
