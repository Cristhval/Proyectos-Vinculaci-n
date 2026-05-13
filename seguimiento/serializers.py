from rest_framework import serializers

from .models import (
	Alerta,
	Avance,
	Evidencia,
	FlujoValidacion,
	Informe,
	Revision,
)


class EvidenciaSerializer(serializers.ModelSerializer):
	class Meta:
		model = Evidencia
		fields = '__all__'


class AvanceSerializer(serializers.ModelSerializer):
	evidencias = EvidenciaSerializer(many=True, read_only=True)
	registrado_por_nombre = serializers.SerializerMethodField()

	class Meta:
		model = Avance
		fields = '__all__'

	def get_registrado_por_nombre(self, obj):
		if obj.registrado_por:
			return str(obj.registrado_por)
		return None


class InformeListSerializer(serializers.ModelSerializer):
	proyecto_codigo = serializers.CharField(source='proyecto.codigo', read_only=True)
	elaborado_por_nombre = serializers.SerializerMethodField()

	class Meta:
		model = Informe
		fields = (
			'id', 'proyecto', 'proyecto_codigo', 'tipo', 'numero', 'titulo',
			'estado', 'fecha_emision', 'elaborado_por_nombre', 'periodo_inicio',
			'periodo_fin', 'creado_en',
		)

	def get_elaborado_por_nombre(self, obj):
		if obj.elaborado_por:
			return str(obj.elaborado_por)
		return None


class InformeDetailSerializer(serializers.ModelSerializer):
	class Meta:
		model = Informe
		fields = '__all__'


class AlertaSerializer(serializers.ModelSerializer):
	usuario_nombre = serializers.SerializerMethodField()
	proyecto_codigo = serializers.CharField(source='proyecto.codigo', read_only=True, default=None)
	convenio_codigo = serializers.CharField(source='convenio.codigo', read_only=True, default=None)

	class Meta:
		model = Alerta
		fields = '__all__'

	def get_usuario_nombre(self, obj):
		if obj.usuario:
			return str(obj.usuario)
		return None


class RevisionSerializer(serializers.ModelSerializer):
	revisor_nombre = serializers.SerializerMethodField()

	class Meta:
		model = Revision
		fields = '__all__'

	def get_revisor_nombre(self, obj):
		if obj.revisor:
			return str(obj.revisor)
		return None


class FlujoValidacionSerializer(serializers.ModelSerializer):
	responsable_nombre = serializers.SerializerMethodField()

	class Meta:
		model = FlujoValidacion
		fields = '__all__'

	def get_responsable_nombre(self, obj):
		if obj.responsable:
			return str(obj.responsable)
		return None
