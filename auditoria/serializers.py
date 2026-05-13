from rest_framework import serializers

from .models import Auditoria


class AuditoriaSerializer(serializers.ModelSerializer):
	usuario_nombre = serializers.SerializerMethodField()

	class Meta:
		model = Auditoria
		fields = '__all__'

	def get_usuario_nombre(self, obj):
		if obj.usuario:
			return str(obj.usuario)
		return 'Sistema'
