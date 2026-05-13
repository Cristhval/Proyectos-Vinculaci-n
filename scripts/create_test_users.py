import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto_vinculacion_universidad.settings')

import django
django.setup()

from django.contrib.auth.models import User

from usuarios.models import Carrera, Usuario, RolUsuario

carrera, _ = Carrera.objects.get_or_create(
	codigo='SOFTWARE',
	defaults={'nombre': 'Ingenieria en Software', 'facultad': 'Facultad de la Energia'}
)

def crear_usuario(username, first_name, last_name, rol, codigo, password='Admin123!'):
	if User.objects.filter(username=username).exists():
		print(f'Usuario {username} ya existe, omitiendo...')
		return
	user = User.objects.create_user(
		username=username, password=password,
		first_name=first_name, last_name=last_name,
		email=f'{username}@unl.edu.ec'
	)
	Usuario.objects.create(user=user, codigo=codigo, rol=rol, carrera=carrera)
	print(f'Usuario {username} ({rol}) creado.')

crear_usuario('admin', 'Admin', 'Sistema', RolUsuario.ADMIN, 'ADM-00001')
crear_usuario('coordinador', 'Juan', 'Perez', RolUsuario.COORDINADOR, 'CRD-00001')
crear_usuario('docente', 'Maria', 'Gomez', RolUsuario.DOCENTE, 'DOC-00001')
crear_usuario('estudiante', 'Carlos', 'Lopez', RolUsuario.ESTUDIANTE, 'EST-00001')

print('\nScript completado.')
print('Credenciales:')
print('  admin / Admin123!')
print('  coordinador / Admin123!')
print('  docente / Admin123!')
print('  estudiante / Admin123!')
