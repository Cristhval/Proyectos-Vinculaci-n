from django.db import models


class Nivel(models.TextChoices):
	PREGRADO = 'PREGRADO', 'Pregrado'
	POSGRADO = 'POSGRADO', 'Posgrado'


class Tipo(models.TextChoices):
	GUIA = 'GUIA', 'Guía metodológica'
	FORMULACION = 'FORMULACION', 'Formato de formulación'
	AVANCE = 'AVANCE', 'Informe de avance'
	FINAL = 'FINAL', 'Informe final'


class FormatoInstitucional(models.Model):
	nombre = models.CharField(max_length=255)
	nivel = models.CharField(max_length=20, choices=Nivel.choices)
	tipo = models.CharField(max_length=20, choices=Tipo.choices)
	descripcion = models.TextField(blank=True)
	archivo = models.FileField(upload_to='formatos/%Y/%m/')
	tamano_kb = models.PositiveIntegerField(null=True, blank=True)
	activo = models.BooleanField(default=True)
	fecha_actualizacion = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['-fecha_actualizacion']
		verbose_name = 'Formato Institucional'
		verbose_name_plural = 'Formatos Institucionales'

	def __str__(self):
		return self.nombre
