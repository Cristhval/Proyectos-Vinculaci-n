from django.db import migrations, models


class Migration(migrations.Migration):
	dependencies = [('usuarios', '0005_usuario_auth_uid')]

	operations = [
		migrations.AddField(model_name='usuario', name='foto', field=models.BinaryField(blank=True, editable=False, null=True)),
		migrations.AddField(model_name='usuario', name='foto_actualizada', field=models.DateTimeField(blank=True, editable=False, null=True)),
	]
