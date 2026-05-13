from django.db import models

from core.models import TimeStampedModel


class EstadoAvance(models.TextChoices):
	PENDIENTE = 'PENDIENTE', 'Pendiente'
	EN_REVISION = 'EN_REVISION', 'En revision'
	APROBADO = 'APROBADO', 'Aprobado'
	RECHAZADO = 'RECHAZADO', 'Rechazado'


class TipoEvidencia(models.TextChoices):
	FOTOGRAFIA = 'FOTOGRAFIA', 'Fotografia'
	VIDEO = 'VIDEO', 'Video'
	DOCUMENTO = 'DOCUMENTO', 'Documento'
	ENLACE = 'ENLACE', 'Enlace'
	OTRO = 'OTRO', 'Otro'


class TipoInforme(models.TextChoices):
	INICIAL = 'INICIAL', 'Inicial'
	PARCIAL = 'PARCIAL', 'Parcial'
	FINAL = 'FINAL', 'Final'
	TECNICO = 'TECNICO', 'Tecnico'
	FINANCIERO = 'FINANCIERO', 'Financiero'


class EstadoAlerta(models.TextChoices):
	PENDIENTE = 'PENDIENTE', 'Pendiente'
	LEIDA = 'LEIDA', 'Leida'
	ATENDIDA = 'ATENDIDA', 'Atendida'
	CANCELADA = 'CANCELADA', 'Cancelada'


class PrioridadAlerta(models.TextChoices):
	BAJA = 'BAJA', 'Baja'
	MEDIA = 'MEDIA', 'Media'
	ALTA = 'ALTA', 'Alta'
	URGENTE = 'URGENTE', 'Urgente'


class Avance(TimeStampedModel):
	actividad = models.ForeignKey('proyectos.Actividad', on_delete=models.CASCADE, related_name='avances')
	registrado_por = models.ForeignKey('usuarios.Usuario', null=True, blank=True, on_delete=models.SET_NULL, related_name='avances_registrados')
	porcentaje_avance = models.DecimalField(max_digits=5, decimal_places=2, default=0)
	descripcion = models.TextField()
	dificultades = models.TextField(blank=True)
	acciones_correctivas = models.TextField(blank=True)
	horas_invertidas = models.DecimalField(max_digits=8, decimal_places=2, default=0)
	fecha_registro = models.DateField(auto_now_add=True)
	estado = models.CharField(max_length=20, choices=EstadoAvance.choices, default=EstadoAvance.PENDIENTE)

	class Meta:
		ordering = ['-creado_en']
		verbose_name = 'Avance'
		verbose_name_plural = 'Avances'

	def __str__(self):
		return f'Avance {self.id} - {self.actividad.codigo}'


class Evidencia(TimeStampedModel):
	avance = models.ForeignKey(Avance, null=True, blank=True, on_delete=models.CASCADE, related_name='evidencias')
	actividad = models.ForeignKey('proyectos.Actividad', null=True, blank=True, on_delete=models.CASCADE, related_name='evidencias')
	tipo = models.CharField(max_length=20, choices=TipoEvidencia.choices, default=TipoEvidencia.DOCUMENTO)
	titulo = models.CharField(max_length=255)
	descripcion = models.TextField(blank=True)
	archivo = models.FileField(upload_to='evidencias/', null=True, blank=True)
	enlace_externo = models.URLField(blank=True, default='')
	fecha_carga = models.DateField(auto_now_add=True)
	verificada = models.BooleanField(default=False)

	class Meta:
		ordering = ['-creado_en']
		verbose_name = 'Evidencia'
		verbose_name_plural = 'Evidencias'

	def __str__(self):
		return self.titulo


class Informe(TimeStampedModel):
	proyecto = models.ForeignKey('proyectos.Proyecto', on_delete=models.CASCADE, related_name='informes')
	tipo = models.CharField(max_length=20, choices=TipoInforme.choices, default=TipoInforme.PARCIAL)
	numero = models.CharField(max_length=40)
	titulo = models.CharField(max_length=255)
	resumen = models.TextField(blank=True)
	contenido = models.TextField()
	periodo_inicio = models.DateField(null=True, blank=True)
	periodo_fin = models.DateField(null=True, blank=True)
	elaborado_por = models.ForeignKey('usuarios.Usuario', null=True, blank=True, on_delete=models.SET_NULL, related_name='informes_elaborados')
	aprobado_por = models.ForeignKey('usuarios.Usuario', null=True, blank=True, on_delete=models.SET_NULL, related_name='informes_aprobados')
	estado = models.CharField(max_length=20, choices=EstadoAvance.choices, default=EstadoAvance.PENDIENTE)
	archivo = models.FileField(upload_to='informes/', null=True, blank=True)
	fecha_emision = models.DateField(null=True, blank=True)
	observaciones = models.TextField(blank=True, default='')

	class Meta:
		unique_together = ('proyecto', 'tipo', 'numero')
		ordering = ['-creado_en']
		verbose_name = 'Informe'
		verbose_name_plural = 'Informes'

	def __str__(self):
		return f'{self.proyecto.codigo} - {self.numero}'


class Alerta(TimeStampedModel):
	usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='alertas')
	proyecto = models.ForeignKey('proyectos.Proyecto', null=True, blank=True, on_delete=models.CASCADE, related_name='alertas')
	convenio = models.ForeignKey('convenios.Convenio', null=True, blank=True, on_delete=models.CASCADE, related_name='alertas')
	mensaje = models.CharField(max_length=500)
	detalle = models.TextField(blank=True, default='')
	prioridad = models.CharField(max_length=20, choices=PrioridadAlerta.choices, default=PrioridadAlerta.MEDIA)
	estado = models.CharField(max_length=20, choices=EstadoAlerta.choices, default=EstadoAlerta.PENDIENTE)
	enlace = models.URLField(blank=True, default='')
	leida = models.BooleanField(default=False)
	fecha_vencimiento = models.DateTimeField(null=True, blank=True)

	class Meta:
		ordering = ['-creado_en']
		verbose_name = 'Alerta'
		verbose_name_plural = 'Alertas'

	def __str__(self):
		return f'{self.usuario} - {self.mensaje[:40]}'


class Revision(TimeStampedModel):
	proyecto = models.ForeignKey('proyectos.Proyecto', on_delete=models.CASCADE, related_name='revisiones')
	revisor = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='revisiones_realizadas')
	fecha_revision = models.DateField(auto_now_add=True)
	decision = models.CharField(max_length=20, choices=[('APROBADO', 'Aprobado'), ('OBSERVADO', 'Observado'), ('RECHAZADO', 'Rechazado')], default='OBSERVADO')
	comentario = models.TextField(blank=True)
	observaciones = models.TextField(blank=True)

	class Meta:
		ordering = ['proyecto', '-fecha_revision']
		verbose_name = 'Revision'
		verbose_name_plural = 'Revisiones'

	def __str__(self):
		return f'{self.proyecto.codigo} - {self.decision} por {self.revisor}'


class FlujoValidacion(TimeStampedModel):
	proyecto = models.ForeignKey('proyectos.Proyecto', on_delete=models.CASCADE, related_name='flujos_validacion')
	paso = models.PositiveIntegerField()
	nombre_paso = models.CharField(max_length=255)
	responsable = models.ForeignKey('usuarios.Usuario', null=True, blank=True, on_delete=models.SET_NULL, related_name='flujos_asignados')
	estado = models.CharField(max_length=20, choices=[('PENDIENTE', 'Pendiente'), ('COMPLETADO', 'Completado'), ('RECHAZADO', 'Rechazado')], default='PENDIENTE')
	fecha_completado = models.DateField(null=True, blank=True)
	comentario = models.TextField(blank=True)

	class Meta:
		ordering = ['proyecto', 'paso']
		verbose_name = 'Flujo de validacion'
		verbose_name_plural = 'Flujos de validacion'

	def __str__(self):
		return f'{self.proyecto.codigo} - Paso {self.paso}: {self.nombre_paso}'
