from rest_framework import serializers

from usuarios.models import Carrera as CarreraModel, Usuario as UsuarioModel

from .models import (
	Actividad,
	AlineacionEstrategica,
	Beneficiario,
	FirmaResponsabilidad,
	Indicador,
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
	class Meta:
		model = ParticipanteProyecto
		fields = (
			'id', 'proyecto', 'usuario', 'rol', 'fecha_inicio', 'fecha_fin',
			'horas_comprometidas', 'horas_cumplidas', 'estado', 'observaciones',
			'creado_en', 'actualizado_en',
		)


class PresupuestoSerializer(serializers.ModelSerializer):
	class Meta:
		model = Presupuesto
		fields = (
			'id', 'proyecto', 'codigo', 'monto_aprobado', 'monto_ejecutado',
			'monto_saldo', 'estado', 'fecha_aprobacion', 'responsable',
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
			'plan', 'descripcion', 'creado_en', 'actualizado_en',
		)


class FirmaResponsabilidadSerializer(serializers.ModelSerializer):
	class Meta:
		model = FirmaResponsabilidad
		fields = (
			'id', 'proyecto', 'usuario', 'tipo', 'fecha_firma',
			'comentario', 'creado_en', 'actualizado_en',
		)


class ProyectoListSerializer(serializers.ModelSerializer):
	carrera_nombre = serializers.CharField(source='carrera.nombre', read_only=True)
	responsable_nombre = serializers.SerializerMethodField()
	actividades_count = serializers.IntegerField(source='actividades.count', read_only=True)
	objetivos_count = serializers.IntegerField(source='objetivos.count', read_only=True)

	class Meta:
		model = Proyecto
		fields = (
			'id', 'codigo', 'titulo', 'tipo', 'estado', 'prioridad',
			'carrera_nombre', 'responsable_nombre', 'fecha_inicio',
			'fecha_fin_planificada', 'presupuesto_aprobado', 'activo',
			'actividades_count', 'objetivos_count', 'creado_en', 'actualizado_en',
		)

	def get_responsable_nombre(self, obj):
		if obj.responsable:
			return str(obj.responsable)
		return None


class ProyectoDetailSerializer(serializers.ModelSerializer):
	carrera = serializers.SerializerMethodField()
	responsable = serializers.SerializerMethodField()
	coordinador_academico = serializers.SerializerMethodField()
	objetivos = ObjetivoSerializer(many=True, read_only=True)
	actividades = ActividadSerializer(many=True, read_only=True)
	participantes = ParticipanteProyectoSerializer(many=True, read_only=True)
	presupuesto = PresupuestoSerializer(read_only=True)
	beneficiarios = BeneficiarioSerializer(many=True, read_only=True)
	alineaciones = AlineacionEstrategicaSerializer(many=True, read_only=True)
	firmas = FirmaResponsabilidadSerializer(many=True, read_only=True)

	class Meta:
		model = Proyecto
		fields = (
			'id', 'codigo', 'titulo', 'resumen', 'descripcion', 'problema',
			'justificacion', 'objetivo_general', 'resultados_esperados',
			'linea_intervencion', 'tipo', 'prioridad', 'estado',
			'carrera', 'responsable', 'coordinador_academico',
			'fecha_inicio', 'fecha_fin_planificada', 'fecha_fin_real',
			'presupuesto_aprobado', 'direccion_ejecucion', 'observaciones',
			'activo', 'objetivos', 'actividades', 'participantes', 'presupuesto',
			'beneficiarios', 'alineaciones', 'firmas',
			'creado_en', 'actualizado_en',
		)

	def get_carrera(self, obj):
		if obj.carrera:
			from usuarios.serializers import CarreraSerializer
			return CarreraSerializer(obj.carrera).data
		return None

	def get_responsable(self, obj):
		if obj.responsable:
			from usuarios.serializers import UsuarioSimpleSerializer
			return UsuarioSimpleSerializer(obj.responsable).data
		return None

	def get_coordinador_academico(self, obj):
		if obj.coordinador_academico:
			from usuarios.serializers import UsuarioSimpleSerializer
			return UsuarioSimpleSerializer(obj.coordinador_academico).data
		return None


class ProyectoCreateUpdateSerializer(serializers.ModelSerializer):
	carrera_id = serializers.PrimaryKeyRelatedField(
		queryset=CarreraModel.objects.all(), source='carrera', write_only=True, allow_null=True, required=False
	)
	responsable_id = serializers.PrimaryKeyRelatedField(
		queryset=UsuarioModel.objects.all(), source='responsable', write_only=True, allow_null=True, required=False
	)
	coordinador_academico_id = serializers.PrimaryKeyRelatedField(
		queryset=UsuarioModel.objects.all(), source='coordinador_academico', write_only=True, allow_null=True, required=False
	)

	class Meta:
		model = Proyecto
		fields = (
			'id', 'codigo', 'titulo', 'resumen', 'descripcion', 'problema',
			'justificacion', 'objetivo_general', 'resultados_esperados',
			'linea_intervencion', 'tipo', 'prioridad', 'estado',
			'carrera_id', 'responsable_id', 'coordinador_academico_id',
			'fecha_inicio', 'fecha_fin_planificada', 'fecha_fin_real',
			'presupuesto_aprobado', 'direccion_ejecucion', 'observaciones',
			'activo', 'creado_en', 'actualizado_en',
		)
		read_only_fields = ('creado_en', 'actualizado_en',)
