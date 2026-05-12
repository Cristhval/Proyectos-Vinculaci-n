from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
	Actividad,
	Alerta,
	Avance,
	Carrera,
	Convenio,
	Evidencia,
	Informe,
	Indicador,
	Institucion,
	Objetivo,
	ParticipanteProyecto,
	Presupuesto,
	Proyecto,
	ProyectoConvenio,
	RolUsuario,
	Usuario,
)


class CarreraSerializer(serializers.ModelSerializer):
	class Meta:
		model = Carrera
		fields = '__all__'


class UsuarioSimpleSerializer(serializers.ModelSerializer):
	class Meta:
		model = Usuario
		fields = ('id', 'codigo', 'rol')


class UsuarioSerializer(serializers.ModelSerializer):
	user_username = serializers.CharField(source='user.username', read_only=True)
	user_first_name = serializers.CharField(source='user.first_name', read_only=True)
	user_last_name = serializers.CharField(source='user.last_name', read_only=True)
	carrera = CarreraSerializer(read_only=True)

	class Meta:
		model = Usuario
		fields = (
			'id',
			'codigo',
			'documento_identidad',
			'carrera',
			'rol',
			'telefono',
			'direccion',
			'fecha_nacimiento',
			'biografia',
			'activo',
			'user_username',
			'user_first_name',
			'user_last_name',
		)


class InstitucionSerializer(serializers.ModelSerializer):
	class Meta:
		model = Institucion
		fields = '__all__'


class ConvenioSerializer(serializers.ModelSerializer):
	institucion = InstitucionSerializer(read_only=True)
	institucion_id = serializers.PrimaryKeyRelatedField(
		queryset=Institucion.objects.all(), source='institucion', write_only=True, allow_null=True, required=False
	)

	class Meta:
		model = Convenio
		fields = '__all__'


class ProyectoConvenioSerializer(serializers.ModelSerializer):
	convenio = ConvenioSerializer(read_only=True)
	convenio_id = serializers.PrimaryKeyRelatedField(queryset=Convenio.objects.all(), source='convenio', write_only=True)

	class Meta:
		model = ProyectoConvenio
		fields = '__all__'


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


class AvanceSerializer(serializers.ModelSerializer):
	class Meta:
		model = Avance
		fields = '__all__'


class EvidenciaSerializer(serializers.ModelSerializer):
	class Meta:
		model = Evidencia
		fields = '__all__'


class ParticipanteProyectoSerializer(serializers.ModelSerializer):
	class Meta:
		model = ParticipanteProyecto
		fields = '__all__'


class InformeSerializer(serializers.ModelSerializer):
	class Meta:
		model = Informe
		fields = '__all__'


class PresupuestoSerializer(serializers.ModelSerializer):
	class Meta:
		model = Presupuesto
		fields = '__all__'


class AlertaSerializer(serializers.ModelSerializer):
	class Meta:
		model = Alerta
		fields = '__all__'


class ProyectoSerializer(serializers.ModelSerializer):
	carrera = CarreraSerializer(read_only=True)
	carrera_id = serializers.PrimaryKeyRelatedField(queryset=Carrera.objects.all(), source='carrera', write_only=True, allow_null=True, required=False)
	responsable = UsuarioSimpleSerializer(read_only=True)
	responsable_id = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.all(), source='responsable', write_only=True, allow_null=True, required=False)
	coordinador_academico = UsuarioSimpleSerializer(read_only=True)
	coordinador_academico_id = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.all(), source='coordinador_academico', write_only=True, allow_null=True, required=False)
	objetivos = ObjetivoSerializer(many=True, read_only=True)
	actividades = ActividadSerializer(many=True, read_only=True)
	participantes = ParticipanteProyectoSerializer(many=True, read_only=True)
	informes = InformeSerializer(many=True, read_only=True)
	alertas = AlertaSerializer(many=True, read_only=True)
	presupuesto = PresupuestoSerializer(read_only=True)
	convenios = ProyectoConvenioSerializer(source='vinculaciones_convenio', many=True, read_only=True)

	class Meta:
		model = Proyecto
		fields = '__all__'


class ProyectoDetalleSerializer(ProyectoSerializer):
	class Meta(ProyectoSerializer.Meta):
		pass


class RegisterSerializer(serializers.Serializer):
	username = serializers.CharField(max_length=150)
	password = serializers.CharField(write_only=True, min_length=8)
	first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
	last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
	email = serializers.EmailField(required=False, allow_blank=True)
	codigo = serializers.CharField(max_length=30, required=False, allow_blank=True)
	rol = serializers.ChoiceField(choices=RolUsuario.choices, required=False)

	def validate_username(self, value):
		if User.objects.filter(username=value).exists():
			raise serializers.ValidationError('El nombre de usuario ya existe.')
		return value

	def create(self, validated_data):
		password = validated_data.pop('password')
		codigo = validated_data.pop('codigo', '')
		rol = validated_data.pop('rol', RolUsuario.ESTUDIANTE)
		user = User.objects.create_user(password=password, **validated_data)
		if not codigo:
			codigo = f'USR-{user.id:05d}'
		Usuario.objects.create(user=user, codigo=codigo, rol=rol, documento_identidad=None)
		return user


class LoginResponseSerializer(serializers.Serializer):
	refresh = serializers.CharField()
	access = serializers.CharField()
	user = UsuarioSerializer()