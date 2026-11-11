import environ
from django.core.management.base import BaseCommand

from cuentas.models import Cuenta, Rol

env = environ.Env()
CONTRASENA_POR_DEFECTO = 'Vinculacion.2026'
SEMILLA = (
	('admin', Rol.ADMIN, 'Administrador', 'del Sistema'),
	('coordinador', Rol.COORDINADOR, 'Coordinador', 'de Vinculación'),
	('docente', Rol.DOCENTE, 'Docente', 'de Prueba'),
	('estudiante', Rol.ESTUDIANTE, 'Estudiante', 'de Prueba'),
)


class Command(BaseCommand):
	help = 'Crea una cuenta de demostración por rol si no existen (idempotente).'

	def handle(self, *args, **options):
		for username, rol, nombre, apellido in SEMILLA:
			clave = rol.upper()
			email = env(f'SEED_{clave}_EMAIL', default=f'{username}@unl.edu.ec')
			password = env(f'SEED_{clave}_PASSWORD', default=CONTRASENA_POR_DEFECTO)
			if Cuenta.objects.filter(username=username).exists() or Cuenta.objects.por_email(email):
				self.stdout.write(f'  = {username} ya existe')
				continue
			Cuenta.objects.create_user(
				username=username, email=email, password=password, rol=rol,
				first_name=nombre, last_name=apellido, is_staff=rol == Rol.ADMIN, is_superuser=rol == Rol.ADMIN,
			)
			self.stdout.write(self.style.SUCCESS(f'  + {username} ({rol}) <{email}>'))
