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
			'rol', 'telefono', 'direccion', 'fecha_nacimiento', 'biografia', 'cargo',
			'activo', 'auth_uid', 'user_username', 'user_first_name', 'user_last_name', 'user_email',
			'creado_en', 'actualizado_en',
		)
		# El rol y la identidad los administra auth-service; aquí solo se leen.
		read_only_fields = ('rol', 'auth_uid', 'codigo', 'documento_identidad', 'activo')


class SincronizarSerializer(serializers.Serializer):
	"""Datos de una cuenta recién creada en auth-service + datos académicos del perfil."""
	sub = serializers.CharField(max_length=64)
	username = serializers.CharField(max_length=150)
	email = serializers.EmailField()
	first_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
	last_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
	rol = serializers.ChoiceField(choices=RolUsuario.choices)
	documento_identidad = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
	activo = serializers.BooleanField(required=False)
	carrera_id = serializers.PrimaryKeyRelatedField(queryset=Carrera.objects.all(), required=False, allow_null=True)
	telefono = serializers.CharField(max_length=20, required=False, allow_blank=True)
	direccion = serializers.CharField(max_length=255, required=False, allow_blank=True)
	cargo = serializers.CharField(max_length=100, required=False, allow_blank=True)
