from rest_framework import serializers

from cuentas.models import Cuenta, RegistroAcceso, Rol


class LoginSerializer(serializers.Serializer):
	usuario = serializers.CharField(max_length=150)
	password = serializers.CharField(max_length=128, trim_whitespace=False)
	captcha_token = serializers.CharField(required=False, allow_blank=True, default='')


class RegistroSerializer(serializers.Serializer):
	username = serializers.RegexField(r'^[\w.@+-]+$', max_length=150)
	email = serializers.EmailField()
	password = serializers.CharField(max_length=128, trim_whitespace=False)
	first_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
	last_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
	documento_identidad = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
	captcha_token = serializers.CharField(required=False, allow_blank=True, default='')


class TokenSerializer(serializers.Serializer):
	refresh = serializers.CharField()


class CuentaSerializer(serializers.ModelSerializer):
	class Meta:
		model = Cuenta
		fields = ('id', 'username', 'email', 'first_name', 'last_name', 'rol', 'documento_identidad', 'is_active', 'last_login', 'date_joined')
		read_only_fields = ('id', 'username', 'last_login', 'date_joined')


class CuentaCrearSerializer(RegistroSerializer):
	rol = serializers.ChoiceField(choices=Rol.choices)
	captcha_token = None


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
