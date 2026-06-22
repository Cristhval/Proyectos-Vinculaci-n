from rest_framework import serializers

from usuarios.models import Carrera as CarreraModel, Usuario as UsuarioModel

from .models import (
	Actividad,
	AlineacionEstrategica,
	Anexo,
	Beneficiario,
	FirmaResponsabilidad,
	Indicador,
	MarcoLogicoFila,
	Objetivo,
	ParticipanteProyecto,
	Presupuesto,
	Proyecto,
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
			'porcentaje_ejecucion', 'estado', 'orden', 'requiere_evidencia',
			'observaciones', 'creado_en', 'actualizado_en',
		)


class ParticipanteProyectoSerializer(serializers.ModelSerializer):
	usuario_nombre = serializers.SerializerMethodField()
	usuario_codigo = serializers.SerializerMethodField()

	class Meta:
		model = ParticipanteProyecto
		fields = (
			'id', 'proyecto', 'usuario', 'usuario_nombre', 'usuario_codigo', 'rol',
			'fecha_inicio', 'fecha_fin', 'horas_comprometidas', 'horas_cumplidas',
			'estado', 'observaciones', 'creado_en', 'actualizado_en',
		)

	def get_usuario_nombre(self, obj):
		if obj.usuario:
			user = obj.usuario.user
			full = f'{user.first_name} {user.last_name}'.strip()
			return full or user.username
		return None

	def get_usuario_codigo(self, obj):
		return obj.usuario.codigo if obj.usuario else None


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


class AnexoSerializer(serializers.ModelSerializer):
	subido_por_nombre = serializers.SerializerMethodField()

	class Meta:
		model = Anexo
		fields = (
			'id', 'proyecto', 'nombre', 'archivo', 'tipo', 'descripcion',
			'subido_por', 'subido_por_nombre', 'orden',
			'creado_en', 'actualizado_en',
		)

	def get_subido_por_nombre(self, obj):
		if obj.subido_por and obj.subido_por.user:
			full = f'{obj.subido_por.user.first_name} {obj.subido_por.user.last_name}'.strip()
			return full or obj.subido_por.user.username
		return None


class ProyectoListSerializer(serializers.ModelSerializer):
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
			'imagen_portada', 'actividades_count', 'objetivos_count', 'creado_en', 'actualizado_en',
		)

	def get_responsable_nombre(self, obj):
		if obj.responsable:
			return str(obj.responsable)
		return None

	def get_responsable_email(self, obj):
		if obj.responsable and obj.responsable.user:
			return obj.responsable.user.email
		return None


class ProyectoDetailSerializer(serializers.ModelSerializer):
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
			'imagen_portada', 'activo', 'objetivos', 'actividades', 'participantes', 'presupuesto',
			'beneficiarios', 'alineaciones', 'firmas', 'anexos', 'marco_logico',
			'creado_en', 'actualizado_en',
		)

	def get_carrera(self, obj):
		if obj.carrera:
			from usuarios.serializers import CarreraSerializer
			return CarreraSerializer(obj.carrera).data
		return None

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
		)
		read_only_fields = ('creado_en', 'actualizado_en',)

	def _guardar_carreras(self, instance, carreras_ids):
		if carreras_ids is not None:
			instance.carreras.set(carreras_ids)
			if carreras_ids and not instance.carrera:
				instance.carrera = carreras_ids[0]
				instance.save(update_fields=['carrera'])

	def create(self, validated_data):
		validated_data.pop('clear_imagen_portada', False)
		carreras_ids = validated_data.pop('carreras_ids', None)
		instance = super().create(validated_data)
		self._guardar_carreras(instance, carreras_ids)
		return instance

	def update(self, instance, validated_data):
		clear_imagen = validated_data.pop('clear_imagen_portada', False)
		carreras_ids = validated_data.pop('carreras_ids', None)
		instance = super().update(instance, validated_data)
		self._guardar_carreras(instance, carreras_ids)
		if clear_imagen:
			if instance.imagen_portada:
				instance.imagen_portada.delete(save=False)
			instance.imagen_portada = None
			instance.save(update_fields=['imagen_portada'])
		return instance
