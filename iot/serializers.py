from rest_framework import serializers

from .models import DispositivoIoT
from .services import EstadoConexion, estado_conexion


class DispositivoIoTSerializer(serializers.ModelSerializer):
	"""Lectura. Nunca expone el token ni su hash."""

	estado_conexion = serializers.SerializerMethodField()
	estado_conexion_display = serializers.SerializerMethodField()

	class Meta:
		model = DispositivoIoT
		fields = (
			'id', 'identificador', 'nombre', 'descripcion', 'proyecto',
			'mide_temperatura', 'mide_humedad', 'mide_co2',
			'activo', 'fecha_registro', 'fecha_baja', 'ultima_lectura',
			'estado_conexion', 'estado_conexion_display',
		)
		read_only_fields = fields

	def _estado(self, obj):
		ahora = self.context.get('ahora')
		return estado_conexion(obj, ahora=ahora)

	def get_estado_conexion(self, obj):
		return self._estado(obj)

	def get_estado_conexion_display(self, obj):
		return EstadoConexion(self._estado(obj)).label


class RegistrarDispositivoSerializer(serializers.Serializer):
	identificador = serializers.SlugField(
		max_length=50,
		error_messages={
			'invalid': 'El identificador solo puede tener letras, números, guiones y guiones bajos.',
			'required': 'El identificador es obligatorio.',
			'blank': 'El identificador es obligatorio.',
		},
	)
	nombre = serializers.CharField(
		max_length=120,
		error_messages={'required': 'El nombre es obligatorio.', 'blank': 'El nombre es obligatorio.'},
	)
	descripcion = serializers.CharField(required=False, allow_blank=True, default='')
	mide_temperatura = serializers.BooleanField(required=False, default=True)
	mide_humedad = serializers.BooleanField(required=False, default=True)
	mide_co2 = serializers.BooleanField(required=False, default=True)


class EditarDispositivoSerializer(serializers.Serializer):
	CAMPOS_EDITABLES = {'nombre', 'descripcion'}

	nombre = serializers.CharField(
		max_length=120, required=False,
		error_messages={'blank': 'El nombre no puede quedar vacío.'},
	)
	descripcion = serializers.CharField(required=False, allow_blank=True)

	def validate(self, attrs):
		extras = set(self.initial_data.keys()) - self.CAMPOS_EDITABLES
		if extras:
			raise serializers.ValidationError(
				'Solo se pueden editar el nombre y la descripción del dispositivo.'
			)
		return attrs
