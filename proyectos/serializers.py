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
		fields = '__all__'


class ObjetivoSerializer(serializers.ModelSerializer):
	indicadores = IndicadorSerializer(many=True, read_only=True)

	class Meta:
		model = Objetivo
		fields = '__all__'


class ActividadSerializer(serializers.ModelSerializer):
	class Meta:
		model = Actividad
		fields = '__all__'


class ParticipanteProyectoSerializer(serializers.ModelSerializer):
	class Meta:
		model = ParticipanteProyecto
		fields = '__all__'


class PresupuestoSerializer(serializers.ModelSerializer):
	class Meta:
		model = Presupuesto
		fields = '__all__'


class BeneficiarioSerializer(serializers.ModelSerializer):
	class Meta:
		model = Beneficiario
		fields = '__all__'


class AlineacionEstrategicaSerializer(serializers.ModelSerializer):
	class Meta:
		model = AlineacionEstrategica
		fields = '__all__'


class FirmaResponsabilidadSerializer(serializers.ModelSerializer):
	class Meta:
		model = FirmaResponsabilidad
		fields = '__all__'


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
		fields = '__all__'

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
		fields = '__all__'
		read_only_fields = ('creado_en', 'actualizado_en',)
