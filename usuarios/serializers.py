import re
from datetime import date

from django.contrib.auth.models import User
from rest_framework import serializers

from . import fotos
from .perfil import pendientes

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
	foto_token = serializers.SerializerMethodField()
	campos_pendientes = serializers.SerializerMethodField()

	class Meta:
		model = Usuario
		fields = (
			'id', 'codigo', 'documento_identidad', 'carrera', 'carrera_id',
			'rol', 'telefono', 'direccion', 'fecha_nacimiento', 'biografia', 'cargo',
			'foto_token', 'campos_pendientes',
			'activo', 'auth_uid', 'user_username', 'user_first_name', 'user_last_name', 'user_email',
			'creado_en', 'actualizado_en',
		)
		# El rol y la identidad los administra auth-service; aquí solo se leen.
		read_only_fields = ('rol', 'auth_uid', 'codigo', 'documento_identidad', 'activo')

	def get_foto_token(self, obj):
		return fotos.token(obj) if obj.foto_actualizada else None

	def get_campos_pendientes(self, obj):
		return pendientes(obj)


TELEFONO_EC = re.compile(r'^(09\d{8}|0[2-7]\d{7})$')


class PerfilPropioSerializer(serializers.ModelSerializer):
	"""Datos que cada usuario puede editar de su propio perfil."""
	carrera_id = serializers.PrimaryKeyRelatedField(
		queryset=Carrera.objects.filter(activa=True), source='carrera', allow_null=True, required=False,
		error_messages={'does_not_exist': 'Elige una carrera de la lista.'},
	)

	class Meta:
		model = Usuario
		fields = ('telefono', 'direccion', 'carrera_id', 'cargo', 'fecha_nacimiento', 'biografia')
		extra_kwargs = {'biografia': {'max_length': 600}}

	def validate_telefono(self, valor):
		limpio = re.sub(r'[\s()-]', '', valor or '')
		if limpio.startswith('+593'):
			limpio = '0' + limpio[4:]
		if limpio and not TELEFONO_EC.match(limpio):
			raise serializers.ValidationError('Escribe un celular (09XXXXXXXX) o un teléfono fijo con código de provincia (0XXXXXXXX).')
		return limpio

	def validate_direccion(self, valor):
		valor = ' '.join((valor or '').split())
		if valor and len(valor) < 8:
			raise serializers.ValidationError('Escribe la dirección completa: calle principal, secundaria y referencia.')
		return valor

	def validate_fecha_nacimiento(self, valor):
		if valor is None:
			return valor
		hoy = date.today()
		edad = hoy.year - valor.year - ((hoy.month, hoy.day) < (valor.month, valor.day))
		if not 15 <= edad <= 100:
			raise serializers.ValidationError('Revisa la fecha de nacimiento.')
		return valor


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
