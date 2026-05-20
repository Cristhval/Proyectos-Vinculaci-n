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
		fields = (
			'id', 'avance', 'actividad', 'tipo', 'titulo', 'descripcion',
			'archivo', 'enlace_externo', 'fecha_carga', 'verificada',
			'creado_en', 'actualizado_en',
		)


class AvanceSerializer(serializers.ModelSerializer):
	evidencias = EvidenciaSerializer(many=True, read_only=True)
	registrado_por_nombre = serializers.SerializerMethodField()

	class Meta:
		model = Avance
		fields = (
			'id', 'actividad', 'registrado_por', 'registrado_por_nombre',
			'porcentaje_avance', 'descripcion', 'dificultades',
			'acciones_correctivas', 'horas_invertidas', 'fecha_registro',
			'estado', 'evidencias', 'creado_en', 'actualizado_en',
		)

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
		fields = (
			'id', 'proyecto', 'tipo', 'numero', 'titulo', 'resumen',
			'contenido', 'periodo_inicio', 'periodo_fin',
			'elaborado_por', 'aprobado_por', 'estado', 'archivo',
			'fecha_emision', 'observaciones', 'creado_en', 'actualizado_en',
		)


class AlertaSerializer(serializers.ModelSerializer):
	usuario_nombre = serializers.SerializerMethodField()
	proyecto_codigo = serializers.CharField(source='proyecto.codigo', read_only=True, default=None)
	convenio_codigo = serializers.CharField(source='convenio.codigo', read_only=True, default=None)

	class Meta:
		model = Alerta
		fields = (
			'id', 'usuario', 'usuario_nombre', 'proyecto', 'proyecto_codigo',
			'convenio', 'convenio_codigo', 'mensaje', 'detalle',
			'prioridad', 'estado', 'enlace', 'leida',
			'fecha_vencimiento', 'creado_en', 'actualizado_en',
		)

	def get_usuario_nombre(self, obj):
		if obj.usuario:
			return str(obj.usuario)
		return None


class RevisionSerializer(serializers.ModelSerializer):
	revisor_nombre = serializers.SerializerMethodField()

	class Meta:
		model = Revision
		fields = (
			'id', 'proyecto', 'revisor', 'revisor_nombre',
			'fecha_revision', 'decision', 'comentario', 'observaciones',
			'creado_en', 'actualizado_en',
		)

	def get_revisor_nombre(self, obj):
		if obj.revisor:
			return str(obj.revisor)
		return None


class FlujoValidacionSerializer(serializers.ModelSerializer):
	responsable_nombre = serializers.SerializerMethodField()

	class Meta:
		model = FlujoValidacion
		fields = (
			'id', 'proyecto', 'paso', 'nombre_paso', 'responsable',
			'responsable_nombre', 'estado', 'fecha_completado',
			'comentario', 'creado_en', 'actualizado_en',
		)

	def get_responsable_nombre(self, obj):
		if obj.responsable:
			return str(obj.responsable)
		return None
