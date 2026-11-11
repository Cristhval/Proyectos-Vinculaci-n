from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

	dependencies = [
		('cuentas', '0003_codigointercambio_identidadsocial'),
	]

	operations = [
		migrations.AddField(
			model_name='cuenta',
			name='email_verificado',
			field=models.BooleanField(default=True),
		),
		migrations.CreateModel(
			name='CodigoVerificacion',
			fields=[
				('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
				('codigo_hash', models.CharField(max_length=128)),
				('expira', models.DateTimeField()),
				('intentos', models.PositiveSmallIntegerField(default=0)),
				('usado', models.BooleanField(default=False)),
				('creado', models.DateTimeField(auto_now_add=True)),
				('cuenta', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='codigos_verificacion', to='cuentas.cuenta')),
			],
			options={'ordering': ['-creado']},
		),
	]
