from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
	usuario = serializers.CharField(max_length=150)
	password = serializers.CharField(max_length=128, trim_whitespace=False)
	captcha_token = serializers.CharField(required=False, allow_blank=True, default='')
