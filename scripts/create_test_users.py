import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto_vinculacion_universidad.settings')

import django

django.setup()

from django.contrib.auth.models import User

from p_vinculacion.models import Carrera, RolUsuario, Usuario

carrera, _ = Carrera.objects.get_or_create(
    codigo='CAR-001',
    defaults={
        'nombre': 'Ingenieria de Sistemas',
        'facultad': 'Ingenieria',
        'descripcion': 'Carrera de prueba',
        'activa': True,
    },
)

usuarios = [
    ('ana.admin', 'Ana', 'Lopez', 'ana.admin@example.com', 'USR-ADMIN-001', RolUsuario.ADMIN),
    ('carlos.coord', 'Carlos', 'Mendez', 'carlos.coord@example.com', 'USR-COORD-001', RolUsuario.COORDINADOR),
    ('maria.doc', 'Maria', 'Perez', 'maria.doc@example.com', 'USR-DOC-001', RolUsuario.DOCENTE),
]

for username, first_name, last_name, email, codigo, rol in usuarios:
    user, created = User.objects.get_or_create(
        username=username,
        defaults={'first_name': first_name, 'last_name': last_name, 'email': email},
    )
    if created:
        user.set_password('Admin123!')
        user.save()
    else:
        user.first_name = first_name
        user.last_name = last_name
        user.email = email
        user.save(update_fields=['first_name', 'last_name', 'email'])

    perfil, _ = Usuario.objects.update_or_create(
        user=user,
        defaults={'codigo': codigo, 'rol': rol, 'carrera': carrera, 'activo': True},
    )
    print(user.username, perfil.codigo, perfil.rol)
