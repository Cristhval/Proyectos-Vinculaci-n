from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Carrera, RolUsuario, Usuario


class CarreraSerializer(serializers.ModelSerializer):
	class Meta:
		model = Carrera
		fields = (
			'id', 'codigo', 'nombre', 'facultad', 'descripcion',
			'activa', 'creado_en', 'actualizado_en',
		)


class UsuarioSimpleSerializer(serializers.ModelSerializer):
	class Meta:
		model = Usuario
		fields = ('id', 'codigo', 'rol', 'user')


class UsuarioSerializer(serializers.ModelSerializer):
	user_username = serializers.CharField(source='user.username', read_only=True)
	user_first_name = serializers.CharField(source='user.first_name', read_only=True)
	user_last_name = serializers.CharField(source='user.last_name', read_only=True)
	user_email = serializers.EmailField(source='user.email', read_only=True)
	carrera = CarreraSerializer(read_only=True)
	carrera_id = serializers.PrimaryKeyRelatedField(
		queryset=Carrera.objects.all(), source='carrera', write_only=True, allow_null=True, required=False
	)

	class Meta:
		model = Usuario
		fields = (
			'id', 'codigo', 'documento_identidad', 'carrera', 'carrera_id',
			'rol', 'telefono', 'direccion', 'fecha_nacimiento', 'biografia',
			'activo', 'user_username', 'user_first_name', 'user_last_name', 'user_email',
		)


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
