from rest_framework import serializers


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
