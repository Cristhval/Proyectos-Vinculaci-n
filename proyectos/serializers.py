from django.db import transaction
from django.db.models import DecimalField, OuterRef, Subquery, Sum
from rest_framework import serializers

from usuarios.models import Carrera as CarreraModel, Usuario as UsuarioModel

from .models import (
	Actividad,
	AlineacionEstrategica,
	Anexo,
	Beneficiario,
	FirmaResponsabilidad,
	ImagenProyecto,
	Indicador,
	MarcoLogicoFila,
	Objetivo,
	ParticipanteProyecto,
	Presupuesto,
	Proyecto,
)
from . import imagenes
from .imagenes import ImagenInvalida, ServicioImagenesProyecto


# Columnas de texto libre de Proyecto que los listados no serializan (se omiten con .defer()).
CAMPOS_TEXTO_LARGO_PROYECTO = (
	'resumen', 'descripcion', 'problema', 'justificacion', 'objetivo_general',
	'resultados_esperados', 'estrategias_ejecucion', 'viabilidad',
	'seguimiento_evaluacion', 'observaciones',
)


class IndicadorSerializer(serializers.ModelSerializer):
	class Meta:
		model = Indicador
		fields = (
			'id', 'objetivo', 'codigo', 'nombre', 'descripcion', 'formula',
			'unidad_medida', 'linea_base', 'meta', 'valor_actual', 'frecuencia',
			'estado', 'fecha_medicion', 'observaciones', 'creado_en', 'actualizado_en',
		)


class ObjetivoSerializer(serializers.ModelSerializer):
	indicadores = IndicadorSerializer(many=True, read_only=True)

	class Meta:
		model = Objetivo
		fields = (
			'id', 'proyecto', 'tipo', 'orden', 'descripcion', 'meta',
			'cumplido', 'fecha_cumplimiento', 'observaciones',
			'indicadores', 'creado_en', 'actualizado_en',
		)


class ActividadSerializer(serializers.ModelSerializer):
	class Meta:
		model = Actividad
		fields = (
			'id', 'proyecto', 'objetivo', 'codigo', 'nombre', 'descripcion',
			'fecha_inicio', 'fecha_fin', 'responsable', 'porcentaje_programado',
			'porcentaje_ejecucion', 'porcentaje_avance', 'estado', 'orden', 'requiere_evidencia',
			'observaciones', 'creado_en', 'actualizado_en',
		)


class ParticipanteProyectoSerializer(serializers.ModelSerializer):
	usuario_nombre = serializers.SerializerMethodField()
	usuario_codigo = serializers.SerializerMethodField()
	horas_cumplidas = serializers.SerializerMethodField()

	class Meta:
		model = ParticipanteProyecto
		fields = (
			'id', 'proyecto', 'usuario', 'usuario_nombre', 'usuario_codigo', 'rol',
			'fecha_inicio', 'fecha_fin', 'horas_comprometidas', 'horas_cumplidas',
			'estado', 'observaciones', 'creado_en', 'actualizado_en',
		)

	@staticmethod
	def preparar_queryset(qs):
		"""Carga en una sola consulta lo que el serializer lee de cada participante.

		Las horas se calculan con una subconsulta por fila en lugar de una consulta
		adicional por participante (N+1). Mismo criterio que ``get_horas_cumplidas``.
		"""
		from seguimiento.models import Avance, EstadoAvance
		horas = (
			Avance.objects.filter(
				actividad__proyecto=OuterRef('proyecto'),
				actividad__responsable=OuterRef('usuario'),
				estado=EstadoAvance.APROBADO,
			)
			.order_by()
			.values('estado')
			.annotate(total=Sum('horas_invertidas'))
			.values('total')[:1]
		)
		return qs.select_related('usuario__user').defer('usuario__foto').annotate(
			_horas_cumplidas_total=Subquery(horas, output_field=DecimalField(max_digits=8, decimal_places=2)),
		)

	def get_usuario_nombre(self, obj):
		if obj.usuario:
			user = obj.usuario.user
			full = f'{user.first_name} {user.last_name}'.strip()
			return full or user.username
		return None

	def get_usuario_codigo(self, obj):
		return obj.usuario.codigo if obj.usuario else None

	def get_horas_cumplidas(self, obj):
		# Suma en tiempo real las horas_invertidas de los Avances APROBADOS
		# cuyas actividades tienen al participante como responsable dentro
		# del mismo proyecto. Es la fuente de verdad para el frontend y
		# siempre está sincronizada, incluso si el campo cacheado del modelo
		# quedó desactualizado por ediciones manuales, seeds, o nuevas
		# transiciones de estado.
		if hasattr(obj, '_horas_cumplidas_total'):
			return str(obj._horas_cumplidas_total or 0)
		from seguimiento.models import Avance, EstadoAvance
		total = Avance.objects.filter(
			actividad__proyecto=obj.proyecto,
			actividad__responsable=obj.usuario,
			estado=EstadoAvance.APROBADO,
		).aggregate(total=Sum('horas_invertidas'))['total']
		return str(total or 0)


class PresupuestoSerializer(serializers.ModelSerializer):
	class Meta:
		model = Presupuesto
		fields = (
			'id', 'proyecto', 'codigo', 'monto_aprobado', 'monto_ejecutado',
			'monto_saldo', 'monto_unl_valorado', 'monto_unl_economico',
			'monto_externo_valorado', 'monto_externo_economico',
			'estado', 'fecha_aprobacion', 'responsable',
			'observaciones', 'creado_en', 'actualizado_en',
		)


class BeneficiarioSerializer(serializers.ModelSerializer):
	class Meta:
		model = Beneficiario
		fields = (
			'id', 'proyecto', 'tipo', 'nombre', 'descripcion',
			'cantidad_estimada', 'ubicacion', 'observaciones',
			'creado_en', 'actualizado_en',
		)


class AlineacionEstrategicaSerializer(serializers.ModelSerializer):
	class Meta:
		model = AlineacionEstrategica
		fields = (
			'id', 'proyecto', 'eje', 'objetivo_estrategico', 'programa',
			'plan', 'descripcion',
			'linea_investigacion', 'programa_vinculacion', 'eje_plan_igualdad',
			'ods', 'plan_nacional_desarrollo', 'agenda_zonal',
			'creado_en', 'actualizado_en',
		)


class MarcoLogicoFilaSerializer(serializers.ModelSerializer):
	class Meta:
		model = MarcoLogicoFila
		fields = (
			'id', 'proyecto', 'nivel', 'resumen_narrativo',
			'indicadores', 'medios_verificacion', 'supuestos',
			'creado_en', 'actualizado_en',
		)


class FirmaResponsabilidadSerializer(serializers.ModelSerializer):
	usuario_nombre = serializers.SerializerMethodField()
	usuario_codigo = serializers.SerializerMethodField()

	class Meta:
		model = FirmaResponsabilidad
		fields = (
			'id', 'proyecto', 'usuario', 'usuario_nombre', 'usuario_codigo',
			'tipo', 'fecha_firma', 'comentario',
			'creado_en', 'actualizado_en',
		)

	def get_usuario_nombre(self, obj):
		if obj.usuario and obj.usuario.user:
			full = f'{obj.usuario.user.first_name} {obj.usuario.user.last_name}'.strip()
			return full or obj.usuario.user.username
		return None

	def get_usuario_codigo(self, obj):
		return obj.usuario.codigo if obj.usuario else None


def imagen_de_anexo(anexo):
	try:
		return anexo.imagen
	except ImagenProyecto.DoesNotExist:
		return None


class AnexoSerializer(serializers.ModelSerializer):
	"""Los documentos se guardan en disco como antes; las imágenes, en la base (ImagenProyecto)."""

	subido_por_nombre = serializers.SerializerMethodField()
	es_imagen = serializers.SerializerMethodField()
	miniatura = serializers.SerializerMethodField()

	class Meta:
		model = Anexo
		fields = (
			'id', 'proyecto', 'nombre', 'archivo', 'tipo', 'descripcion',
			'subido_por', 'subido_por_nombre', 'orden', 'es_imagen', 'miniatura',
			'creado_en', 'actualizado_en',
		)

	def validate(self, attrs):
		archivo = attrs.get('archivo')
		if self.instance is None and not archivo:
			raise serializers.ValidationError({'archivo': 'Selecciona un archivo.'})
		self._procesada = None
		if archivo and imagenes.es_imagen(archivo):
			proyecto = attrs.get('proyecto') or getattr(self.instance, 'proyecto', None)
			try:
				ServicioImagenesProyecto().validar_cupo(proyecto, reemplaza_anexo=self.instance)
				self._procesada = imagenes.procesar(archivo)
			except ImagenInvalida as error:
				raise serializers.ValidationError({'archivo': str(error)})
			attrs['archivo'] = ''  # La imagen no se escribe en el disco.
		return attrs

	def create(self, validated_data):
		with transaction.atomic():
			anexo = super().create(validated_data)
			if self._procesada:
				ServicioImagenesProyecto().guardar_de_anexo(anexo, self._procesada)
		return anexo

	def update(self, instance, validated_data):
		with transaction.atomic():
			if self._procesada and instance.archivo:
				instance.archivo.delete(save=False)
			anexo = super().update(instance, validated_data)
			if self._procesada:
				ServicioImagenesProyecto().guardar_de_anexo(anexo, self._procesada)
			elif validated_data.get('archivo'):
				ImagenProyecto.objects.filter(anexo=anexo).delete()
		return anexo

	def to_representation(self, instance):
		datos = super().to_representation(instance)
		imagen = imagen_de_anexo(instance)
		if imagen:
			datos['archivo'] = imagenes.url_firmada(self.context.get('request'), imagen.pk, 'completa')
		return datos

	def get_es_imagen(self, obj):
		return imagen_de_anexo(obj) is not None

	def get_miniatura(self, obj):
		imagen = imagen_de_anexo(obj)
		return imagenes.url_firmada(self.context.get('request'), imagen.pk, 'miniatura') if imagen else None

	def get_subido_por_nombre(self, obj):
		if obj.subido_por and obj.subido_por.user:
			full = f'{obj.subido_por.user.first_name} {obj.subido_por.user.last_name}'.strip()
			return full or obj.subido_por.user.username
		return None


def portada_id_subquery():
	"""Anotación con el id de la portada, para no hacer una consulta por proyecto en los listados."""
	return Subquery(
		ImagenProyecto.objects.filter(proyecto=OuterRef('pk'), es_portada=True).values('pk')[:1]
	)


class PortadaMixin(serializers.Serializer):
	"""`imagen_portada` y su miniatura: URL firmada si está en la base; si no, el archivo antiguo del disco."""

	imagen_portada = serializers.SerializerMethodField()
	imagen_portada_miniatura = serializers.SerializerMethodField()

	def _portada_id(self, obj):
		if hasattr(obj, 'portada_id'):
			return obj.portada_id
		cache = getattr(obj, '_prefetched_objects_cache', {})
		if 'imagenes' in cache:
			return next((i.pk for i in cache['imagenes'] if i.es_portada), None)
		return ImagenProyecto.objects.filter(proyecto=obj, es_portada=True).values_list('pk', flat=True).first()

	def _url_portada(self, obj, variante):
		request = self.context.get('request')
		portada_id = self._portada_id(obj)
		if portada_id:
			return imagenes.url_firmada(request, portada_id, variante)
		if obj.imagen_portada:
			url = obj.imagen_portada.url
			return request.build_absolute_uri(url) if request else url
		return None

	def get_imagen_portada(self, obj):
		return self._url_portada(obj, 'completa')

	def get_imagen_portada_miniatura(self, obj):
		return self._url_portada(obj, 'miniatura')


class ProyectoListSerializer(PortadaMixin, serializers.ModelSerializer):
	carrera_nombre = serializers.CharField(source='carrera.nombre', read_only=True)
	responsable_nombre = serializers.SerializerMethodField()
	responsable_email = serializers.SerializerMethodField()
	actividades_count = serializers.IntegerField(read_only=True)
	objetivos_count = serializers.IntegerField(read_only=True)

	class Meta:
		model = Proyecto
		fields = (
			'id', 'codigo', 'titulo', 'tipo', 'estado', 'prioridad',
			'carrera_nombre', 'responsable', 'responsable_nombre', 'responsable_email', 'fecha_inicio',
			'fecha_fin_planificada', 'presupuesto_aprobado', 'activo',
			'imagen_portada', 'imagen_portada_miniatura', 'monitoreo_activo', 'actividades_count', 'objetivos_count',
			'creado_en', 'actualizado_en',
		)

	def get_responsable_nombre(self, obj):
		if obj.responsable:
			return str(obj.responsable)
		return None

	def get_responsable_email(self, obj):
		if obj.responsable and obj.responsable.user:
			return obj.responsable.user.email
		return None


class ProyectoDetailSerializer(PortadaMixin, serializers.ModelSerializer):
	carrera = serializers.SerializerMethodField()
	carrera_nombre = serializers.CharField(source='carrera.nombre', read_only=True, default=None)
	carreras = serializers.SerializerMethodField()
	responsable = serializers.SerializerMethodField()
	responsable_nombre = serializers.SerializerMethodField()
	coordinador_academico = serializers.SerializerMethodField()
	coordinador_academico_nombre = serializers.SerializerMethodField()
	objetivos = ObjetivoSerializer(many=True, read_only=True)
	actividades = ActividadSerializer(many=True, read_only=True)
	participantes = ParticipanteProyectoSerializer(many=True, read_only=True)
	presupuesto = PresupuestoSerializer(read_only=True)
	beneficiarios = BeneficiarioSerializer(many=True, read_only=True)
	alineaciones = AlineacionEstrategicaSerializer(many=True, read_only=True)
	firmas = FirmaResponsabilidadSerializer(many=True, read_only=True)
	anexos = AnexoSerializer(many=True, read_only=True)
	marco_logico = MarcoLogicoFilaSerializer(many=True, read_only=True)
	imagenes = serializers.SerializerMethodField()

	class Meta:
		model = Proyecto
		fields = (
			'id', 'codigo', 'titulo', 'resumen', 'descripcion', 'problema',
			'justificacion', 'objetivo_general', 'resultados_esperados',
			'linea_intervencion', 'tipo', 'prioridad', 'estado',
			'carrera', 'carrera_nombre', 'carreras',
			'responsable', 'responsable_nombre',
			'coordinador_academico', 'coordinador_academico_nombre',
			'fecha_inicio', 'fecha_fin_planificada', 'fecha_fin_real',
			'presupuesto_aprobado', 'direccion_ejecucion', 'estrategias_ejecucion',
			'viabilidad', 'seguimiento_evaluacion', 'observaciones',
			'imagen_portada', 'imagen_portada_miniatura', 'imagenes', 'activo', 'monitoreo_activo', 'objetivos',
			'actividades', 'participantes', 'presupuesto', 'beneficiarios', 'alineaciones', 'firmas', 'anexos', 'marco_logico',
			'creado_en', 'actualizado_en',
		)

	def get_carrera(self, obj):
		if obj.carrera:
			from usuarios.serializers import CarreraSerializer
			return CarreraSerializer(obj.carrera).data
		return None

	def get_imagenes(self, obj):
		"""Galería: portada primero y luego las imágenes de los anexos, sin los bytes."""
		request = self.context.get('request')
		cache = getattr(obj, '_prefetched_objects_cache', {})
		lista = cache['imagenes'] if 'imagenes' in cache else obj.imagenes.defer(*ServicioImagenesProyecto.CAMPOS_PESADOS)
		return [ServicioImagenesProyecto.describir(imagen, request) for imagen in lista]

	def get_carreras(self, obj):
		from usuarios.serializers import CarreraSerializer
		return CarreraSerializer(obj.carreras.all(), many=True).data

	def get_responsable(self, obj):
		if obj.responsable:
			from usuarios.serializers import UsuarioSimpleSerializer
			return UsuarioSimpleSerializer(obj.responsable).data
		return None

	def get_responsable_nombre(self, obj):
		if obj.responsable:
			return str(obj.responsable)
		return None

	def get_coordinador_academico(self, obj):
		if obj.coordinador_academico:
			from usuarios.serializers import UsuarioSimpleSerializer
			return UsuarioSimpleSerializer(obj.coordinador_academico).data
		return None

	def get_coordinador_academico_nombre(self, obj):
		if obj.coordinador_academico:
			return str(obj.coordinador_academico)
		return None


class ProyectoCreateUpdateSerializer(serializers.ModelSerializer):
	carrera_id = serializers.PrimaryKeyRelatedField(
		queryset=CarreraModel.objects.all(), source='carrera', write_only=True, allow_null=True, required=False
	)
	carreras_ids = serializers.PrimaryKeyRelatedField(
		queryset=CarreraModel.objects.all(), many=True, write_only=True, required=False
	)
	responsable_id = serializers.PrimaryKeyRelatedField(
		queryset=UsuarioModel.objects.all(), source='responsable', write_only=True, allow_null=True, required=False
	)
	coordinador_academico_id = serializers.PrimaryKeyRelatedField(
		queryset=UsuarioModel.objects.all(), source='coordinador_academico', write_only=True, allow_null=True, required=False
	)
	clear_imagen_portada = serializers.BooleanField(write_only=True, required=False, default=False)

	monto_unl_valorado = serializers.DecimalField(write_only=True, required=False, allow_null=True, max_digits=12, decimal_places=2)
	monto_unl_economico = serializers.DecimalField(write_only=True, required=False, allow_null=True, max_digits=12, decimal_places=2)
	monto_externo_valorado = serializers.DecimalField(write_only=True, required=False, allow_null=True, max_digits=12, decimal_places=2)
	monto_externo_economico = serializers.DecimalField(write_only=True, required=False, allow_null=True, max_digits=12, decimal_places=2)

	class Meta:
		model = Proyecto
		fields = (
			'id', 'codigo', 'titulo', 'resumen', 'descripcion', 'problema',
			'justificacion', 'objetivo_general', 'resultados_esperados',
			'linea_intervencion', 'tipo', 'prioridad', 'estado',
			'carrera_id', 'carreras_ids', 'responsable_id', 'coordinador_academico_id',
			'fecha_inicio', 'fecha_fin_planificada', 'fecha_fin_real',
			'presupuesto_aprobado', 'direccion_ejecucion', 'estrategias_ejecucion',
			'viabilidad', 'seguimiento_evaluacion', 'observaciones',
			'imagen_portada', 'clear_imagen_portada', 'activo', 'creado_en', 'actualizado_en',
			'monto_unl_valorado', 'monto_unl_economico', 'monto_externo_valorado', 'monto_externo_economico',
		)
		read_only_fields = ('creado_en', 'actualizado_en',)

	def validate(self, attrs):
		archivo = attrs.get('imagen_portada')
		self._portada = None
		if archivo:
			try:
				ServicioImagenesProyecto().validar_cupo(self.instance, reemplaza_portada=True)
				self._portada = (imagenes.procesar(archivo), getattr(archivo, 'name', ''))
			except ImagenInvalida as error:
				raise serializers.ValidationError({'imagen_portada': str(error)})
		return attrs

	def _guardar_portada(self, instance, quitar=False):
		"""La portada nueva va a la base; el archivo antiguo del disco se elimina."""
		servicio = ServicioImagenesProyecto()
		if not (self._portada or quitar):
			return
		if instance.imagen_portada:
			instance.imagen_portada.delete(save=False)
			instance.imagen_portada = None
			instance.save(update_fields=['imagen_portada'])
		if self._portada:
			procesada, nombre = self._portada
			servicio.guardar_portada(instance, procesada, nombre)
		else:
			servicio.quitar_portada(instance)

	def to_representation(self, instance):
		datos = super().to_representation(instance)
		datos['imagen_portada'] = PortadaMixin(context=self.context)._url_portada(instance, 'completa')
		return datos

	def _guardar_carreras(self, instance, carreras_ids):
		if carreras_ids is not None:
			instance.carreras.set(carreras_ids)
			if carreras_ids and not instance.carrera:
				instance.carrera = carreras_ids[0]
				instance.save(update_fields=['carrera'])

	def _guardar_presupuesto(self, instance, validated_data=None, montos=None):
		if validated_data is not None:
			montos = {
				'monto_unl_valorado': validated_data.pop('monto_unl_valorado', None),
				'monto_unl_economico': validated_data.pop('monto_unl_economico', None),
				'monto_externo_valorado': validated_data.pop('monto_externo_valorado', None),
				'monto_externo_economico': validated_data.pop('monto_externo_economico', None),
			}
			validated_data.pop('presupuesto_aprobado', None)
		if not montos:
			return
		tiene_montos = any(v is not None for v in montos.values())
		if not tiene_montos:
			return
		presupuesto, _ = Presupuesto.objects.get_or_create(proyecto=instance)
		for campo, valor in montos.items():
			if valor is not None:
				setattr(presupuesto, campo, valor)
		total = (
			(presupuesto.monto_unl_valorado or 0) +
			(presupuesto.monto_unl_economico or 0) +
			(presupuesto.monto_externo_valorado or 0) +
			(presupuesto.monto_externo_economico or 0)
		)
		presupuesto.monto_aprobado = total
		presupuesto.monto_saldo = total - (presupuesto.monto_ejecutado or 0)
		if not presupuesto.codigo:
			presupuesto.codigo = f'PRE-{instance.codigo}'
		presupuesto.save()
		instance.presupuesto_aprobado = total
		instance.save(update_fields=['presupuesto_aprobado'])

	def create(self, validated_data):
		from .services import ProyectoWorkflowService
		validated_data.pop('clear_imagen_portada', False)
		validated_data.pop('imagen_portada', None)
		carreras_ids = validated_data.pop('carreras_ids', None)
		montos = {campo: validated_data.pop(campo, None) for campo in
			['monto_unl_valorado', 'monto_unl_economico', 'monto_externo_valorado', 'monto_externo_economico']}
		validated_data.pop('presupuesto_aprobado', None)
		with transaction.atomic():
			instance = super().create(validated_data)
			ProyectoWorkflowService().generar_codigo(instance)
			self._guardar_carreras(instance, carreras_ids)
			self._guardar_presupuesto(instance, montos=montos)
			self._guardar_portada(instance)
		return instance

	def update(self, instance, validated_data):
		clear_imagen = validated_data.pop('clear_imagen_portada', False)
		validated_data.pop('imagen_portada', None)
		carreras_ids = validated_data.pop('carreras_ids', None)
		with transaction.atomic():
			self._guardar_presupuesto(instance, validated_data)
			instance = super().update(instance, validated_data)
			self._guardar_carreras(instance, carreras_ids)
			self._guardar_portada(instance, quitar=clear_imagen)
		return instance
