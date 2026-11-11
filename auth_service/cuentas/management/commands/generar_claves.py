from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.core.management.base import BaseCommand


def _una_linea(pem):
	return pem.strip().replace('\n', '\\n')


class Command(BaseCommand):
	help = 'Genera un par de claves RSA 2048 para firmar los JWT, en formato listo para .env'

	def handle(self, *args, **options):
		clave = rsa.generate_private_key(public_exponent=65537, key_size=2048)
		privada = clave.private_bytes(
			serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()
		).decode()
		publica = clave.public_key().public_bytes(
			serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
		).decode()
		self.stdout.write('# auth-service (.env)')
		self.stdout.write(f'JWT_PRIVATE_KEY="{_una_linea(privada)}"')
		self.stdout.write(f'JWT_PUBLIC_KEY="{_una_linea(publica)}"')
		self.stdout.write('\n# API principal (.env) — solo la clave pública')
		self.stdout.write(f'AUTH_PUBLIC_KEY="{_una_linea(publica)}"')
