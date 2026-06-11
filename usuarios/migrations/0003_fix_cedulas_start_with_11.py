# Generated manually
import random
from django.db import migrations


def fix_cedulas_to_start_with_11(apps, schema_editor):
	Usuario = apps.get_model('usuarios', 'Usuario')
	usuarios = Usuario.objects.all()
	existing = set(Usuario.objects.values_list('documento_identidad', flat=True))

	for u in usuarios:
		if u.documento_identidad and not u.documento_identidad.startswith('11'):
			existing.discard(u.documento_identidad)
			while True:
				cedula = '11' + ''.join([str(random.randint(0, 9)) for _ in range(8)])
				if cedula not in existing:
					existing.add(cedula)
					u.documento_identidad = cedula
					u.save(update_fields=['documento_identidad'])
					break


class Migration(migrations.Migration):
	dependencies = [
		('usuarios', '0002_auto_20260610_1200'),
	]

	operations = [
		migrations.RunPython(fix_cedulas_to_start_with_11),
	]
