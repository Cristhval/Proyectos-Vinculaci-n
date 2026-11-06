from rest_framework import serializers

from django.conf import settings
from rest_framework.exceptions import ValidationError

from cuentas.models import Cuenta, RegistroAcceso, Rol, SolicitudAcceso


class LoginSerializer(serializers.Serializer):
	usuario = serializers.CharField(max_length=150)
	password = serializers.CharField(max_length=128, trim_whitespace=False)
	captcha_token = serializers.CharField(required=False, allow_blank=True, default='')

	def validate_usuario(self, value):
		if '@' in value:
			return serializers.EmailField().run_validation(value)
		return value


class RegistroSerializer(serializers.Serializer):
	email = serializers.EmailField()
	password = serializers.CharField(max_length=128, trim_whitespace=False)
	first_name = serializers.CharField(max_length=150)
	last_name = serializers.CharField(max_length=150)
	documento_identidad = serializers.CharField(max_length=20)
	rol_solicitado = serializers.ChoiceField(choices=[
		(Rol.ESTUDIANTE, 'Estudiante'),
		(Rol.DOCENTE, 'Docente'),
		(Rol.COORDINADOR, 'Coordinador'),
	])
	motivo = serializers.CharField(min_length=10, max_length=500)
	captcha_token = serializers.CharField(required=False, allow_blank=True, default='')

	def validate_email(self, value):
		dominio = value.rsplit('@', 1)[-1].lower()
		if dominio not in {d.lower() for d in settings.DOMINIOS_PERMITIDOS}:
			raise ValidationError('Usa tu correo institucional @unl.edu.ec.')
		return value

	def validate_first_name(self, value):
		return self._validar_nombre(value, 'El nombre')

	def validate_last_name(self, value):
		return self._validar_nombre(value, 'El apellido')

	def validate_documento_identidad(self, value):
		if not value.isdigit() or len(value) != 10:
			raise serializers.ValidationError('El documento debe tener exactamente 10 dígitos.')
		return value

	@staticmethod
	def _validar_nombre(value, etiqueta):
		import re
		valor = value.strip()
		if len(valor) < 2 or not re.fullmatch(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+", valor):
			raise serializers.ValidationError(f'{etiqueta} solo puede contener letras y espacios.')
		return valor


class TokenSerializer(serializers.Serializer):
	refresh = serializers.CharField()


class CuentaSerializer(serializers.ModelSerializer):
	class Meta:
		model = Cuenta
		fields = ('id', 'username', 'email', 'first_name', 'last_name', 'rol', 'documento_identidad', 'is_active', 'last_login', 'date_joined')
		read_only_fields = ('id', 'username', 'last_login', 'date_joined')


class CuentaCrearSerializer(RegistroSerializer):
	username = serializers.RegexField(r'^[\w.@+-]+$', max_length=150, required=False)
	first_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
	last_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
	documento_identidad = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
	rol = serializers.ChoiceField(choices=Rol.choices)
	rol_solicitado = serializers.ChoiceField(choices=Rol.choices, required=False, write_only=True)
	motivo = serializers.CharField(required=False, write_only=True)
	captcha_token = None

	def validate_email(self, value):
		return value

	def validate_documento_identidad(self, value):
		if not value:
			return value
		return super().validate_documento_identidad(value)


class VerificarEmailSerializer(serializers.Serializer):
	email = serializers.EmailField()
	codigo = serializers.RegexField(r'^\d{6}$')


class CuentaEditarSerializer(serializers.Serializer):
	email = serializers.EmailField(required=False)
	first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
	last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
	documento_identidad = serializers.CharField(max_length=20, required=False, allow_blank=True)
	rol = serializers.ChoiceField(choices=Rol.choices, required=False)
	is_active = serializers.BooleanField(required=False)


class ContrasenaSerializer(serializers.Serializer):
	password = serializers.CharField(max_length=128, trim_whitespace=False)
	password2 = serializers.CharField(max_length=128, trim_whitespace=False)


class RegistroAccesoSerializer(serializers.ModelSerializer):
	username = serializers.CharField(source='cuenta.username', default=None, read_only=True)

	class Meta:
		model = RegistroAcceso
		fields = ('id', 'username', 'identificador', 'metodo', 'exito', 'ip', 'fecha')


class SolicitarRecuperacionSerializer(serializers.Serializer):
	email = serializers.CharField(max_length=254)
	captcha_token = serializers.CharField(required=False, allow_blank=True, default='')


class RestablecerSerializer(ContrasenaSerializer):
	uid = serializers.CharField(max_length=64)
	token = serializers.CharField(max_length=128)


class SolicitudAccesoSerializer(serializers.ModelSerializer):
	nombres = serializers.SerializerMethodField()
	email = serializers.EmailField(source='cuenta.email', read_only=True)
	documento_identidad = serializers.CharField(source='cuenta.documento_identidad', read_only=True)

	class Meta:
		model = SolicitudAcceso
		fields = (
			'id', 'nombres', 'email', 'documento_identidad', 'rol_solicitado', 'motivo',
			'estado', 'creada',
		)
		read_only_fields = fields

	def get_nombres(self, obj):
		return f'{obj.cuenta.first_name} {obj.cuenta.last_name}'.strip()


class AprobarSolicitudSerializer(serializers.Serializer):
	rol = serializers.ChoiceField(choices=Rol.choices)


class RechazarSolicitudSerializer(serializers.Serializer):
	motivo = serializers.CharField(min_length=1, max_length=500, allow_blank=False)
