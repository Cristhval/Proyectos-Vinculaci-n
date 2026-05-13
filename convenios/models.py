from django.db import models

from core.models import TimeStampedModel


class TipoConvenio(models.TextChoices):
	MARCO = 'MARCO', 'Marco'
	ESPECIFICO = 'ESPECIFICO', 'Especifico'
	COOPERACION = 'COOPERACION', 'Cooperacion'
	OTRO = 'OTRO', 'Otro'


class EstadoConvenio(models.TextChoices):
	BORRADOR = 'BORRADOR', 'Borrador'
	EN_REVISION = 'EN_REVISION', 'En revision'
	VIGENTE = 'VIGENTE', 'Vigente'
	VENCIDO = 'VENCIDO', 'Vencido'
	SUSPENDIDO = 'SUSPENDIDO', 'Suspendido'
	FINALIZADO = 'FINALIZADO', 'Finalizado'
	CANCELADO = 'CANCELADO', 'Cancelado'


class EstadoCompromiso(models.TextChoices):
	PENDIENTE = 'PENDIENTE', 'Pendiente'
	EN_PROCESO = 'EN_PROCESO', 'En proceso'
	CUMPLIDO = 'CUMPLIDO', 'Cumplido'
	INCUMPLIDO = 'INCUMPLIDO', 'Incumplido'


class TipoContribucion(models.TextChoices):
	FINANCIERO = 'FINANCIERO', 'Financiero'
	HORAS = 'HORAS', 'Horas'
	INFRAESTRUCTURA = 'INFRAESTRUCTURA', 'Infraestructura'
	EQUIPO = 'EQUIPO', 'Equipo'
	SERVICIO = 'SERVICIO', 'Servicio'
	EXTERNO = 'EXTERNO', 'Externo'


class Institucion(TimeStampedModel):
	nombre = models.CharField(max_length=255)
	sigla = models.CharField(max_length=50, blank=True, default='')
	descripcion = models.TextField(blank=True, default='')
	direccion = models.CharField(max_length=255, blank=True, default='')
	telefono = models.CharField(max_length=20, blank=True, default='')
	email = models.EmailField(blank=True, default='')
	sitio_web = models.URLField(blank=True, default='')
	activa = models.BooleanField(default=True)

	class Meta:
		ordering = ['nombre']
		verbose_name = 'Institucion'
		verbose_name_plural = 'Instituciones'

	def __str__(self):
		return self.sigla or self.nombre


class Convenio(TimeStampedModel):
	codigo = models.CharField(max_length=40, unique=True)
	institucion = models.ForeignKey(Institucion, null=True, blank=True, on_delete=models.SET_NULL, related_name='convenios')
	entidad_contraparte = models.CharField(max_length=255)
	objeto = models.TextField()
	descripcion = models.TextField(blank=True)
	fecha_firma = models.DateField(null=True, blank=True)
	fecha_inicio = models.DateField(null=True, blank=True)
	fecha_fin = models.DateField(null=True, blank=True)
	tipo = models.CharField(max_length=20, choices=TipoConvenio.choices, default=TipoConvenio.ESPECIFICO)
	estado = models.CharField(max_length=20, choices=EstadoConvenio.choices, default=EstadoConvenio.BORRADOR)
	archivo_firmado = models.FileField(upload_to='convenios/', null=True, blank=True)
	observaciones = models.TextField(blank=True)
	activo = models.BooleanField(default=True)

	class Meta:
		ordering = ['-creado_en']
		verbose_name = 'Convenio'
		verbose_name_plural = 'Convenios'

	def __str__(self):
		return f'{self.codigo} - {self.entidad_contraparte}'


class ProyectoConvenio(TimeStampedModel):
	proyecto = models.ForeignKey('proyectos.Proyecto', on_delete=models.CASCADE, related_name='vinculaciones_convenio')
	convenio = models.ForeignKey(Convenio, on_delete=models.CASCADE, related_name='vinculaciones_proyecto')
	fecha_vinculacion = models.DateField(auto_now_add=True)
	vigente = models.BooleanField(default=True)
	observaciones = models.TextField(blank=True)

	class Meta:
		unique_together = ('proyecto', 'convenio')
		ordering = ['-creado_en']
		verbose_name = 'Vinculacion proyecto-convenio'
		verbose_name_plural = 'Vinculaciones proyecto-convenio'

	def __str__(self):
		return f'{self.proyecto.codigo} <-> {self.convenio.codigo}'


class Compromiso(TimeStampedModel):
	convenio = models.ForeignKey(Convenio, on_delete=models.CASCADE, related_name='compromisos')
	codigo = models.CharField(max_length=40)
	descripcion = models.TextField()
	fecha_compromiso = models.DateField(null=True, blank=True)
	fecha_vencimiento = models.DateField(null=True, blank=True)
	responsable = models.ForeignKey('usuarios.Usuario', null=True, blank=True, on_delete=models.SET_NULL, related_name='compromisos_responsables')
	estado = models.CharField(max_length=20, choices=EstadoCompromiso.choices, default=EstadoCompromiso.PENDIENTE)
	observaciones = models.TextField(blank=True)

	class Meta:
		unique_together = ('convenio', 'codigo')
		ordering = ['convenio', 'fecha_vencimiento']
		verbose_name = 'Compromiso'
		verbose_name_plural = 'Compromisos'

	def __str__(self):
		return f'{self.convenio.codigo} - {self.codigo}'


class Producto(TimeStampedModel):
	convenio = models.ForeignKey(Convenio, on_delete=models.CASCADE, related_name='productos')
	codigo = models.CharField(max_length=40)
	nombre = models.CharField(max_length=255)
	descripcion = models.TextField(blank=True)
	tipo = models.CharField(max_length=50, blank=True)
	fecha_entrega_esperada = models.DateField(null=True, blank=True)
	fecha_entrega_real = models.DateField(null=True, blank=True)
	entregado = models.BooleanField(default=False)
	archivo = models.FileField(upload_to='productos/', null=True, blank=True)
	observaciones = models.TextField(blank=True)

	class Meta:
		unique_together = ('convenio', 'codigo')
		ordering = ['convenio', 'fecha_entrega_esperada']
		verbose_name = 'Producto'
		verbose_name_plural = 'Productos'

	def __str__(self):
		return f'{self.convenio.codigo} - {self.nombre}'


class Contribucion(TimeStampedModel):
	proyecto = models.ForeignKey('proyectos.Proyecto', on_delete=models.CASCADE, related_name='contribuciones')
	institucion = models.ForeignKey(Institucion, null=True, blank=True, on_delete=models.SET_NULL, related_name='contribuciones')
	tipo = models.CharField(max_length=20, choices=TipoContribucion.choices, default=TipoContribucion.FINANCIERO)
	descripcion = models.TextField()
	valor = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	fecha_aporte = models.DateField(null=True, blank=True)
	observaciones = models.TextField(blank=True)

	class Meta:
		ordering = ['proyecto', '-fecha_aporte']
		verbose_name = 'Contribucion'
		verbose_name_plural = 'Contribuciones'

	def __str__(self):
		return f'{self.proyecto.codigo} - {self.tipo}'
