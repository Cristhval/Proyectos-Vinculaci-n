from rest_framework import serializers

from .models import Auditoria


class AuditoriaSerializer(serializers.ModelSerializer):
	usuario_nombre = serializers.SerializerMethodField()
	usuario_rol = serializers.SerializerMethodField()

	class Meta:
		model = Auditoria
		fields = '__all__'

	def get_usuario_nombre(self, obj):
		if obj.usuario:
			u = obj.usuario
			if hasattr(u, 'user'):
				parts = []
				if u.user.first_name:
					parts.append(u.user.first_name)
				if u.user.last_name:
					parts.append(u.user.last_name)
				if parts:
					return ' '.join(parts)
				return u.user.username
			return str(u)
		return 'Sistema'

	def get_usuario_rol(self, obj):
		if obj.usuario and hasattr(obj.usuario, 'rol'):
			return obj.usuario.rol
		return None
