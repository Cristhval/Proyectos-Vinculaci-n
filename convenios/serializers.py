from rest_framework import serializers

from .models import (
	Compromiso,
	Contribucion,
	Convenio,
	Institucion,
	Producto,
	ProyectoConvenio,
)


class InstitucionSerializer(serializers.ModelSerializer):
	class Meta:
		model = Institucion
		fields = '__all__'


class ConvenioListSerializer(serializers.ModelSerializer):
	institucion_nombre = serializers.CharField(source='institucion.nombre', read_only=True)

	class Meta:
		model = Convenio
		fields = (
			'id', 'codigo', 'entidad_contraparte', 'institucion_nombre',
			'tipo', 'estado', 'fecha_firma', 'fecha_inicio', 'fecha_fin',
			'activo', 'creado_en',
		)


class ConvenioDetailSerializer(serializers.ModelSerializer):
	institucion = InstitucionSerializer(read_only=True)
	institucion_id = serializers.PrimaryKeyRelatedField(
		queryset=Institucion.objects.all(), source='institucion', write_only=True, allow_null=True, required=False
	)
	compromisos = serializers.SerializerMethodField()
	productos = serializers.SerializerMethodField()

	class Meta:
		model = Convenio
		fields = '__all__'

	def get_compromisos(self, obj):
		return CompromisoSerializer(obj.compromisos.all(), many=True).data

	def get_productos(self, obj):
		return ProductoSerializer(obj.productos.all(), many=True).data


class ProyectoConvenioSerializer(serializers.ModelSerializer):
	convenio = ConvenioListSerializer(read_only=True)
	convenio_id = serializers.PrimaryKeyRelatedField(queryset=Convenio.objects.all(), source='convenio', write_only=True)
	proyecto_codigo = serializers.CharField(source='proyecto.codigo', read_only=True)

	class Meta:
		model = ProyectoConvenio
		fields = '__all__'


class CompromisoSerializer(serializers.ModelSerializer):
	responsable_nombre = serializers.SerializerMethodField()

	class Meta:
		model = Compromiso
		fields = '__all__'

	def get_responsable_nombre(self, obj):
		if obj.responsable:
			return str(obj.responsable)
		return None


class ProductoSerializer(serializers.ModelSerializer):
	class Meta:
		model = Producto
		fields = '__all__'


class ContribucionSerializer(serializers.ModelSerializer):
	institucion_nombre = serializers.CharField(source='institucion.nombre', read_only=True)

	class Meta:
		model = Contribucion
		fields = '__all__'
