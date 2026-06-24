from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('proyectos', '0005_proyecto_carreras'),
    ]

    operations = [
        migrations.AddField(
            model_name='actividad',
            name='porcentaje_avance',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
    ]
