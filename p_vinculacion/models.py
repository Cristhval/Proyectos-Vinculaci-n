from django.contrib.auth.models import User
from django.db import models


class TimeStampedModel(models.Model):
	creado_en = models.DateTimeField(auto_now_add=True)
	actualizado_en = models.DateTimeField(auto_now=True)

	class Meta:
		abstract = True


class RolUsuario(models.TextChoices):
	ADMIN = 'ADMIN', 'Administrador'
	COORDINADOR = 'COORDINADOR', 'Coordinador'
	DOCENTE = 'DOCENTE', 'Docente'
	ESTUDIANTE = 'ESTUDIANTE', 'Estudiante'
	DIRECTIVO = 'DIRECTIVO', 'Directivo'


class EstadoProyecto(models.TextChoices):
	BORRADOR = 'BORRADOR', 'Borrador'
	EN_REVISION = 'EN_REVISION', 'En revision'
	APROBADO = 'APROBADO', 'Aprobado'
	EN_EJECUCION = 'EN_EJECUCION', 'En ejecucion'
	EN_SUSPENSION = 'EN_SUSPENSION', 'En suspension'
	FINALIZADO = 'FINALIZADO', 'Finalizado'
	CERRADO = 'CERRADO', 'Cerrado'
	CANCELADO = 'CANCELADO', 'Cancelado'


class EstadoConvenio(models.TextChoices):
	BORRADOR = 'BORRADOR', 'Borrador'
	EN_REVISION = 'EN_REVISION', 'En revision'
	VIGENTE = 'VIGENTE', 'Vigente'
	VENCIDO = 'VENCIDO', 'Vencido'
	SUSPENDIDO = 'SUSPENDIDO', 'Suspendido'
	FINALIZADO = 'FINALIZADO', 'Finalizado'
	CANCELADO = 'CANCELADO', 'Cancelado'


class TipoConvenio(models.TextChoices):
	MARCO = 'MARCO', 'Marco'
	ESPECIFICO = 'ESPECIFICO', 'Especifico'
	COOPERACION = 'COOPERACION', 'Cooperacion'
	OTRO = 'OTRO', 'Otro'


class TipoProyecto(models.TextChoices):
	VINCULACION = 'VINCULACION', 'Vinculacion'
	INVESTIGACION = 'INVESTIGACION', 'Investigacion'
	EXTENSION = 'EXTENSION', 'Extension'
	MIXTO = 'MIXTO', 'Mixto'


class PrioridadProyecto(models.TextChoices):
	BAJA = 'BAJA', 'Baja'
	MEDIA = 'MEDIA', 'Media'
	ALTA = 'ALTA', 'Alta'
	CRITICA = 'CRITICA', 'Critica'


class EstadoActividad(models.TextChoices):
	PENDIENTE = 'PENDIENTE', 'Pendiente'
	EN_PROCESO = 'EN_PROCESO', 'En proceso'
	COMPLETADA = 'COMPLETADA', 'Completada'
	ATRASADA = 'ATRASADA', 'Atrasada'
	CANCELADA = 'CANCELADA', 'Cancelada'


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


class TipoObjetivo(models.TextChoices):
	GENERAL = 'GENERAL', 'General'
	ESPECIFICO = 'ESPECIFICO', 'Especifico'


class EstadoIndicador(models.TextChoices):
	ACTIVO = 'ACTIVO', 'Activo'
	EN_ALERTA = 'EN_ALERTA', 'En alerta'
	CUMPLIDO = 'CUMPLIDO', 'Cumplido'
	NO_CUMPLIDO = 'NO_CUMPLIDO', 'No cumplido'


class FrecuenciaIndicador(models.TextChoices):
	DIARIA = 'DIARIA', 'Diaria'
	SEMANAL = 'SEMANAL', 'Semanal'
	MENSUAL = 'MENSUAL', 'Mensual'
	TRIMESTRAL = 'TRIMESTRAL', 'Trimestral'
	SEMESTRAL = 'SEMESTRAL', 'Semestral'
	ANUAL = 'ANUAL', 'Anual'


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


class EstadoPresupuesto(models.TextChoices):
	BORRADOR = 'BORRADOR', 'Borrador'
	APROBADO = 'APROBADO', 'Aprobado'
	EJECUTADO = 'EJECUTADO', 'Ejecutado'
	CERRADO = 'CERRADO', 'Cerrado'


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

	def __str__(self):
		return self.sigla or self.nombre


class Carrera(TimeStampedModel):
	codigo = models.CharField(max_length=30, unique=True)
	nombre = models.CharField(max_length=255)
	facultad = models.CharField(max_length=255)
	descripcion = models.TextField(blank=True)
	activa = models.BooleanField(default=True)

	class Meta:
		ordering = ['nombre']

	def __str__(self):
		return f'{self.codigo} - {self.nombre}'


class Usuario(TimeStampedModel):
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
	codigo = models.CharField(max_length=30, unique=True)
	documento_identidad = models.CharField(max_length=20, unique=True, blank=True, null=True, default=None)
	carrera = models.ForeignKey(Carrera, null=True, blank=True, on_delete=models.SET_NULL, related_name='usuarios')
	rol = models.CharField(max_length=20, choices=RolUsuario.choices, default=RolUsuario.ESTUDIANTE)
	telefono = models.CharField(max_length=20, blank=True)
	direccion = models.CharField(max_length=255, blank=True)
	fecha_nacimiento = models.DateField(null=True, blank=True)
	biografia = models.TextField(blank=True)
	activo = models.BooleanField(default=True)

	class Meta:
		ordering = ['user__last_name', 'user__first_name']

	def __str__(self):
		nombre = self.user.get_full_name().strip()
		return f'{self.codigo} - {nombre or self.user.username}'


class Proyecto(TimeStampedModel):
	codigo = models.CharField(max_length=40, unique=True, default='')
	titulo = models.CharField(max_length=255)
	resumen = models.TextField(blank=True, default='')
	descripcion = models.TextField(blank=True, default='')
	problema = models.TextField(blank=True, default='')
	justificacion = models.TextField(blank=True, default='')
	objetivo_general = models.TextField(blank=True, default='')
	resultados_esperados = models.TextField(blank=True, default='')
	linea_intervencion = models.CharField(max_length=255, blank=True, default='')
	tipo = models.CharField(max_length=20, choices=TipoProyecto.choices, default=TipoProyecto.VINCULACION)
	prioridad = models.CharField(max_length=20, choices=PrioridadProyecto.choices, default=PrioridadProyecto.MEDIA)
	estado = models.CharField(max_length=20, choices=EstadoProyecto.choices, default=EstadoProyecto.BORRADOR)
	carrera = models.ForeignKey(Carrera, null=True, blank=True, on_delete=models.SET_NULL, related_name='proyectos')
	responsable = models.ForeignKey(Usuario, null=True, blank=True, on_delete=models.SET_NULL, related_name='proyectos_responsables')
	coordinador_academico = models.ForeignKey(Usuario, null=True, blank=True, on_delete=models.SET_NULL, related_name='proyectos_coordinados')
	fecha_inicio = models.DateField(null=True, blank=True)
	fecha_fin_planificada = models.DateField(null=True, blank=True)
	fecha_fin_real = models.DateField(null=True, blank=True)
	presupuesto_aprobado = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	direccion_ejecucion = models.CharField(max_length=255, blank=True, default='')
	observaciones = models.TextField(blank=True, default='')
	activo = models.BooleanField(default=True)

	class Meta:
		ordering = ['-creado_en']

	def __str__(self):
		return f'{self.codigo} - {self.titulo}'


class Convenio(TimeStampedModel):
	codigo = models.CharField(max_length=40, unique=True)
	institucion = models.ForeignKey(Institucion, null=True, blank=True, on_delete=models.SET_NULL, related_name='convenios')
	entidad_contraparte = models.CharField(max_length=255)
	objeto = models.TextField()
	descripcion = models.TextField(blank=True)
	fecha_firma = models.DateField(null=True, blank=True)
	fecha_inicio = models.DateField(null=True, blank=True)
	fecha_fin = models.DateField(null=True, blank=True)
	tipo = models.CharField(max_length=100, blank=True)
	estado = models.CharField(max_length=20, choices=EstadoConvenio.choices, default=EstadoConvenio.BORRADOR)
	archivo_firmado = models.FileField(upload_to='convenios/', null=True, blank=True)
	observaciones = models.TextField(blank=True)
	activo = models.BooleanField(default=True)

	class Meta:
		ordering = ['-creado_en']

	def __str__(self):
		return f'{self.codigo} - {self.entidad_contraparte}'


class Presupuesto(TimeStampedModel):
	proyecto = models.OneToOneField('Proyecto', on_delete=models.CASCADE, related_name='presupuesto')
	codigo = models.CharField(max_length=40, unique=True, default='')
	monto_aprobado = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	monto_ejecutado = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	monto_saldo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	estado = models.CharField(max_length=20, choices=EstadoPresupuesto.choices, default=EstadoPresupuesto.BORRADOR)
	fecha_aprobacion = models.DateField(null=True, blank=True)
	responsable = models.ForeignKey(Usuario, null=True, blank=True, on_delete=models.SET_NULL, related_name='presupuestos')
	observaciones = models.TextField(blank=True, default='')

	class Meta:
		ordering = ['-creado_en']

	def __str__(self):
		return f'{self.codigo} - {self.proyecto.codigo}'


class ProyectoConvenio(TimeStampedModel):
	proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='vinculaciones_convenio')
	convenio = models.ForeignKey(Convenio, on_delete=models.CASCADE, related_name='vinculaciones_proyecto')
	fecha_vinculacion = models.DateField(auto_now_add=True)
	vigente = models.BooleanField(default=True)
	observaciones = models.TextField(blank=True)

	class Meta:
		unique_together = ('proyecto', 'convenio')
		ordering = ['-creado_en']

	def __str__(self):
		return f'{self.proyecto.codigo} <-> {self.convenio.codigo}'


class Objetivo(TimeStampedModel):
	proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='objetivos')
	tipo = models.CharField(max_length=20, choices=TipoObjetivo.choices, default=TipoObjetivo.ESPECIFICO)
	orden = models.PositiveIntegerField(default=1)
	descripcion = models.TextField()
	meta = models.TextField(blank=True)
	cumplido = models.BooleanField(default=False)
	fecha_cumplimiento = models.DateField(null=True, blank=True)
	observaciones = models.TextField(blank=True)

	class Meta:
		ordering = ['proyecto', 'orden', 'id']

	def __str__(self):
		return f'{self.proyecto.codigo} - Objetivo {self.orden}'


class Indicador(TimeStampedModel):
	objetivo = models.ForeignKey(Objetivo, on_delete=models.CASCADE, related_name='indicadores')
	codigo = models.CharField(max_length=40)
	nombre = models.CharField(max_length=255)
	descripcion = models.TextField(blank=True)
	formula = models.TextField(blank=True)
	unidad_medida = models.CharField(max_length=50, blank=True)
	linea_base = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	meta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	valor_actual = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	frecuencia = models.CharField(max_length=20, choices=FrecuenciaIndicador.choices, default=FrecuenciaIndicador.MENSUAL)
	estado = models.CharField(max_length=20, choices=EstadoIndicador.choices, default=EstadoIndicador.ACTIVO)
	fecha_medicion = models.DateField(null=True, blank=True)
	observaciones = models.TextField(blank=True)

	class Meta:
		unique_together = ('objetivo', 'codigo')
		ordering = ['objetivo', 'codigo']

	def __str__(self):
		return f'{self.codigo} - {self.nombre}'


class Actividad(TimeStampedModel):
	proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='actividades')
	objetivo = models.ForeignKey(Objetivo, null=True, blank=True, on_delete=models.SET_NULL, related_name='actividades')
	codigo = models.CharField(max_length=40)
	nombre = models.CharField(max_length=255)
	descripcion = models.TextField()
	fecha_inicio = models.DateField(null=True, blank=True)
	fecha_fin = models.DateField(null=True, blank=True)
	responsable = models.ForeignKey(Usuario, null=True, blank=True, on_delete=models.SET_NULL, related_name='actividades_responsables')
	porcentaje_programado = models.DecimalField(max_digits=5, decimal_places=2, default=0)
	porcentaje_ejecucion = models.DecimalField(max_digits=5, decimal_places=2, default=0)
	estado = models.CharField(max_length=20, choices=EstadoActividad.choices, default=EstadoActividad.PENDIENTE)
	orden = models.PositiveIntegerField(default=1)
	requiere_evidencia = models.BooleanField(default=True)
	observaciones = models.TextField(blank=True)

	class Meta:
		unique_together = ('proyecto', 'codigo')
		ordering = ['proyecto', 'orden', 'id']
		verbose_name = 'Actividad'
		verbose_name_plural = 'Actividades'

	def __str__(self):
		return f'{self.proyecto.codigo} - {self.codigo} - {self.nombre}'


class Avance(TimeStampedModel):
	actividad = models.ForeignKey(Actividad, on_delete=models.CASCADE, related_name='avances')
	registrado_por = models.ForeignKey(Usuario, null=True, blank=True, on_delete=models.SET_NULL, related_name='avances_registrados')
	porcentaje_avance = models.DecimalField(max_digits=5, decimal_places=2, default=0)
	descripcion = models.TextField()
	dificultades = models.TextField(blank=True)
	acciones_correctivas = models.TextField(blank=True)
	horas_invertidas = models.DecimalField(max_digits=8, decimal_places=2, default=0)
	fecha_registro = models.DateField(auto_now_add=True)
	estado = models.CharField(max_length=20, choices=EstadoAvance.choices, default=EstadoAvance.PENDIENTE)

	class Meta:
		ordering = ['-creado_en']

	def __str__(self):
		return f'Avance {self.id} - {self.actividad.codigo}'


class Evidencia(TimeStampedModel):
	avance = models.ForeignKey(Avance, null=True, blank=True, on_delete=models.CASCADE, related_name='evidencias')
	actividad = models.ForeignKey(Actividad, null=True, blank=True, on_delete=models.CASCADE, related_name='evidencias')
	tipo = models.CharField(max_length=20, choices=TipoEvidencia.choices, default=TipoEvidencia.DOCUMENTO)
	titulo = models.CharField(max_length=255)
	descripcion = models.TextField(blank=True)
	archivo = models.FileField(upload_to='evidencias/', null=True, blank=True)
	enlace_externo = models.URLField(blank=True)
	fecha_carga = models.DateField(auto_now_add=True)
	verificada = models.BooleanField(default=False)

	class Meta:
		ordering = ['-creado_en']

	def __str__(self):
		return self.titulo


class ParticipanteProyecto(TimeStampedModel):
	proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='participantes')
	usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='participaciones')
	rol = models.CharField(max_length=20, choices=RolUsuario.choices, default=RolUsuario.ESTUDIANTE)
	fecha_inicio = models.DateField(null=True, blank=True)
	fecha_fin = models.DateField(null=True, blank=True)
	horas_comprometidas = models.DecimalField(max_digits=8, decimal_places=2, default=0)
	horas_cumplidas = models.DecimalField(max_digits=8, decimal_places=2, default=0)
	estado = models.CharField(max_length=20, choices=EstadoProyecto.choices, default=EstadoProyecto.EN_EJECUCION)
	observaciones = models.TextField(blank=True)

	class Meta:
		unique_together = ('proyecto', 'usuario', 'rol')
		ordering = ['proyecto', 'usuario']

	def __str__(self):
		return f'{self.usuario} en {self.proyecto.codigo}'


class Informe(TimeStampedModel):
	proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='informes')
	tipo = models.CharField(max_length=20, choices=TipoInforme.choices, default=TipoInforme.PARCIAL)
	numero = models.CharField(max_length=40)
	titulo = models.CharField(max_length=255)
	resumen = models.TextField(blank=True)
	contenido = models.TextField()
	periodo_inicio = models.DateField(null=True, blank=True)
	periodo_fin = models.DateField(null=True, blank=True)
	elaborado_por = models.ForeignKey(Usuario, null=True, blank=True, on_delete=models.SET_NULL, related_name='informes_elaborados')
	aprobado_por = models.ForeignKey(Usuario, null=True, blank=True, on_delete=models.SET_NULL, related_name='informes_aprobados')
	estado = models.CharField(max_length=20, choices=EstadoAvance.choices, default=EstadoAvance.PENDIENTE)
	archivo = models.FileField(upload_to='informes/', null=True, blank=True)
	fecha_emision = models.DateField(null=True, blank=True)
	observaciones = models.TextField(blank=True, default='')

	class Meta:
		unique_together = ('proyecto', 'tipo', 'numero')
		ordering = ['-creado_en']

	def __str__(self):
		return f'{self.proyecto.codigo} - {self.numero}'


class Alerta(TimeStampedModel):
	usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='alertas')
	proyecto = models.ForeignKey(Proyecto, null=True, blank=True, on_delete=models.CASCADE, related_name='alertas')
	convenio = models.ForeignKey(Convenio, null=True, blank=True, on_delete=models.CASCADE, related_name='alertas')
	mensaje = models.CharField(max_length=500)
	detalle = models.TextField(blank=True, default='')
	prioridad = models.CharField(max_length=20, choices=PrioridadAlerta.choices, default=PrioridadAlerta.MEDIA)
	estado = models.CharField(max_length=20, choices=EstadoAlerta.choices, default=EstadoAlerta.PENDIENTE)
	enlace = models.URLField(blank=True, default='')
	leida = models.BooleanField(default=False)
	fecha_vencimiento = models.DateTimeField(null=True, blank=True)

	class Meta:
		ordering = ['-creado_en']

	def __str__(self):
		return f'{self.usuario} - {self.mensaje[:40]}'