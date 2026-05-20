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
		fields = (
			'id', 'nombre', 'sigla', 'descripcion', 'direccion',
			'telefono', 'email', 'sitio_web', 'activa',
			'creado_en', 'actualizado_en',
		)


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
		fields = (
			'id', 'codigo', 'institucion', 'institucion_id',
			'entidad_contraparte', 'objeto', 'descripcion',
			'fecha_firma', 'fecha_inicio', 'fecha_fin',
			'tipo', 'estado', 'archivo_firmado', 'observaciones',
			'activo', 'compromisos', 'productos',
			'creado_en', 'actualizado_en',
		)

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
		fields = (
			'id', 'proyecto', 'proyecto_codigo', 'convenio', 'convenio_id',
			'fecha_vinculacion', 'vigente', 'observaciones',
			'creado_en', 'actualizado_en',
		)


class CompromisoSerializer(serializers.ModelSerializer):
	responsable_nombre = serializers.SerializerMethodField()

	class Meta:
		model = Compromiso
		fields = (
			'id', 'convenio', 'codigo', 'descripcion',
			'fecha_compromiso', 'fecha_vencimiento', 'responsable',
			'responsable_nombre', 'estado', 'observaciones',
			'creado_en', 'actualizado_en',
		)

	def get_responsable_nombre(self, obj):
		if obj.responsable:
			return str(obj.responsable)
		return None


class ProductoSerializer(serializers.ModelSerializer):
	class Meta:
		model = Producto
		fields = (
			'id', 'convenio', 'codigo', 'nombre', 'descripcion',
			'tipo', 'fecha_entrega_esperada', 'fecha_entrega_real',
			'entregado', 'archivo', 'observaciones',
			'creado_en', 'actualizado_en',
		)


class ContribucionSerializer(serializers.ModelSerializer):
	institucion_nombre = serializers.CharField(source='institucion.nombre', read_only=True)

	class Meta:
		model = Contribucion
		fields = (
			'id', 'proyecto', 'institucion', 'institucion_nombre',
			'tipo', 'descripcion', 'valor', 'fecha_aporte',
			'observaciones', 'creado_en', 'actualizado_en',
		)
