from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('seguimiento', '0002_avance_motivo_rechazo'),
    ]

    operations = [
        migrations.AddField(
            model_name='informe',
            name='generado_con_ia',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='informe',
            name='tipo',
            field=models.CharField(
                choices=[
                    ('INICIAL', 'Inicial'),
                    ('PARCIAL', 'Parcial'),
                    ('FINAL', 'Final'),
                    ('TECNICO', 'Tecnico'),
                    ('FINANCIERO', 'Financiero'),
                    ('EJECUTIVO', 'Ejecutivo'),
                ],
                default='PARCIAL',
                max_length=20,
            ),
        ),
    ]
