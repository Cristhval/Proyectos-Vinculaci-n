from django.db import models

from core.models import TimeStampedModel


class TipoProyecto(models.TextChoices):
	VINCULACION = 'VINCULACION', 'Vinculacion'
	INVESTIGACION = 'INVESTIGACION', 'Investigacion'
	EXTENSION = 'EXTENSION', 'Extension'
	MIXTO = 'MIXTO', 'Mixto'


class EstadoProyecto(models.TextChoices):
	BORRADOR = 'BORRADOR', 'Borrador'
	EN_REVISION = 'EN_REVISION', 'En revision'
	APROBADO = 'APROBADO', 'Aprobado'
	EN_EJECUCION = 'EN_EJECUCION', 'En ejecucion'
	EN_SUSPENSION = 'EN_SUSPENSION', 'En suspension'
	FINALIZADO = 'FINALIZADO', 'Finalizado'
	CERRADO = 'CERRADO', 'Cerrado'
	CANCELADO = 'CANCELADO', 'Cancelado'


class PrioridadProyecto(models.TextChoices):
	BAJA = 'BAJA', 'Baja'
	MEDIA = 'MEDIA', 'Media'
	ALTA = 'ALTA', 'Alta'
	CRITICA = 'CRITICA', 'Critica'


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


class EstadoActividad(models.TextChoices):
	PENDIENTE = 'PENDIENTE', 'Pendiente'
	EN_PROCESO = 'EN_PROCESO', 'En proceso'
	COMPLETADA = 'COMPLETADA', 'Completada'
	ATRASADA = 'ATRASADA', 'Atrasada'
	CANCELADA = 'CANCELADA', 'Cancelada'


class EstadoPresupuesto(models.TextChoices):
	BORRADOR = 'BORRADOR', 'Borrador'
	APROBADO = 'APROBADO', 'Aprobado'
	EJECUTADO = 'EJECUTADO', 'Ejecutado'
	CERRADO = 'CERRADO', 'Cerrado'


class RolParticipante(models.TextChoices):
	LIDER = 'LIDER', 'Lider'
	DOCENTE = 'DOCENTE', 'Docente'
	ESTUDIANTE = 'ESTUDIANTE', 'Estudiante'
	APOYO = 'APOYO', 'Apoyo'
	EXTERNO = 'EXTERNO', 'Externo'


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
	carrera = models.ForeignKey('usuarios.Carrera', null=True, blank=True, on_delete=models.SET_NULL, related_name='proyectos')
	responsable = models.ForeignKey('usuarios.Usuario', null=True, blank=True, on_delete=models.SET_NULL, related_name='proyectos_responsables')
	coordinador_academico = models.ForeignKey('usuarios.Usuario', null=True, blank=True, on_delete=models.SET_NULL, related_name='proyectos_coordinados')
	fecha_inicio = models.DateField(null=True, blank=True)
	fecha_fin_planificada = models.DateField(null=True, blank=True)
	fecha_fin_real = models.DateField(null=True, blank=True)
	presupuesto_aprobado = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	direccion_ejecucion = models.CharField(max_length=255, blank=True, default='')
	observaciones = models.TextField(blank=True, default='')
	activo = models.BooleanField(default=True)

	class Meta:
		ordering = ['-creado_en']
		verbose_name = 'Proyecto'
		verbose_name_plural = 'Proyectos'

	def __str__(self):
		return f'{self.codigo} - {self.titulo}'


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
		verbose_name = 'Objetivo'
		verbose_name_plural = 'Objetivos'

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
		verbose_name = 'Indicador'
		verbose_name_plural = 'Indicadores'

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
	responsable = models.ForeignKey('usuarios.Usuario', null=True, blank=True, on_delete=models.SET_NULL, related_name='actividades_responsables')
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


class ParticipanteProyecto(TimeStampedModel):
	proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='participantes')
	usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='participaciones')
	rol = models.CharField(max_length=20, choices=RolParticipante.choices, default=RolParticipante.ESTUDIANTE)
	fecha_inicio = models.DateField(null=True, blank=True)
	fecha_fin = models.DateField(null=True, blank=True)
	horas_comprometidas = models.DecimalField(max_digits=8, decimal_places=2, default=0)
	horas_cumplidas = models.DecimalField(max_digits=8, decimal_places=2, default=0)
	estado = models.CharField(max_length=20, default='ACTIVO')
	observaciones = models.TextField(blank=True)

	class Meta:
		unique_together = ('proyecto', 'usuario', 'rol')
		ordering = ['proyecto', 'usuario']
		verbose_name = 'Participante en proyecto'
		verbose_name_plural = 'Participantes en proyectos'

	def __str__(self):
		return f'{self.usuario} en {self.proyecto.codigo}'


class Presupuesto(TimeStampedModel):
	proyecto = models.OneToOneField(Proyecto, on_delete=models.CASCADE, related_name='presupuesto')
	codigo = models.CharField(max_length=40, unique=True, default='')
	monto_aprobado = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	monto_ejecutado = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	monto_saldo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	estado = models.CharField(max_length=20, choices=EstadoPresupuesto.choices, default=EstadoPresupuesto.BORRADOR)
	fecha_aprobacion = models.DateField(null=True, blank=True)
	responsable = models.ForeignKey('usuarios.Usuario', null=True, blank=True, on_delete=models.SET_NULL, related_name='presupuestos')
	observaciones = models.TextField(blank=True, default='')

	class Meta:
		ordering = ['-creado_en']
		verbose_name = 'Presupuesto'
		verbose_name_plural = 'Presupuestos'

	def __str__(self):
		return f'{self.codigo} - {self.proyecto.codigo}'


class Beneficiario(TimeStampedModel):
	proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='beneficiarios')
	tipo = models.CharField(max_length=20, choices=[('DIRECTO', 'Directo'), ('INDIRECTO', 'Indirecto')], default='DIRECTO')
	nombre = models.CharField(max_length=255, blank=True, default='')
	descripcion = models.TextField(blank=True)
	cantidad_estimada = models.PositiveIntegerField(default=0)
	ubicacion = models.CharField(max_length=255, blank=True, default='')
	observaciones = models.TextField(blank=True)

	class Meta:
		ordering = ['proyecto', 'tipo']
		verbose_name = 'Beneficiario'
		verbose_name_plural = 'Beneficiarios'

	def __str__(self):
		return f'{self.proyecto.codigo} - {self.nombre or self.tipo}'


class AlineacionEstrategica(TimeStampedModel):
	proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='alineaciones')
	eje = models.CharField(max_length=255)
	objetivo_estrategico = models.CharField(max_length=255)
	programa = models.CharField(max_length=255, blank=True, default='')
	plan = models.CharField(max_length=255, blank=True, default='')
	descripcion = models.TextField(blank=True)

	class Meta:
		ordering = ['proyecto', 'eje']
		verbose_name = 'Alineacion estrategica'
		verbose_name_plural = 'Alineaciones estrategicas'

	def __str__(self):
		return f'{self.proyecto.codigo} - {self.eje}'


class FirmaResponsabilidad(TimeStampedModel):
	proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='firmas')
	usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='firmas')
	tipo = models.CharField(max_length=20, choices=[('RESPONSABLE', 'Responsable'), ('COORDINADOR', 'Coordinador'), ('APROBADOR', 'Aprobador')], default='RESPONSABLE')
	fecha_firma = models.DateField(auto_now_add=True)
	comentario = models.TextField(blank=True)

	class Meta:
		unique_together = ('proyecto', 'usuario', 'tipo')
		ordering = ['proyecto', '-fecha_firma']
		verbose_name = 'Firma de responsabilidad'
		verbose_name_plural = 'Firmas de responsabilidad'

	def __str__(self):
		return f'{self.usuario} - {self.proyecto.codigo} - {self.tipo}'
