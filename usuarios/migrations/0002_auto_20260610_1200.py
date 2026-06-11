# Generated manually
import random
from django.db import migrations, models
from django.db.models import Q


def assign_random_cedulas(apps, schema_editor):
	Usuario = apps.get_model('usuarios', 'Usuario')
	usuarios_sin_cedula = Usuario.objects.filter(
		Q(documento_identidad__isnull=True) | Q(documento_identidad='')
	)
	existing = set(
		Usuario.objects.exclude(documento_identidad__isnull=True)
		.exclude(documento_identidad='')
		.values_list('documento_identidad', flat=True)
	)

	for u in usuarios_sin_cedula:
		while True:
			cedula = '11' + ''.join([str(random.randint(0, 9)) for _ in range(8)])
			if cedula not in existing:
				existing.add(cedula)
				u.documento_identidad = cedula
				u.save(update_fields=['documento_identidad'])
				break


class Migration(migrations.Migration):
	dependencies = [
		('usuarios', '0001_initial'),
	]

	operations = [
		migrations.RunPython(assign_random_cedulas),
		migrations.AlterField(
			model_name='usuario',
			name='documento_identidad',
			field=models.CharField(max_length=20, unique=True),
		),
	]
