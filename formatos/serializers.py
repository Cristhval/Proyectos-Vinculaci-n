from rest_framework import serializers

from .models import FormatoInstitucional


class FormatoSerializer(serializers.ModelSerializer):
	activo = serializers.BooleanField(default=True, required=False)

	class Meta:
		model = FormatoInstitucional
		fields = '__all__'
		read_only_fields = ['tamano_kb', 'fecha_actualizacion']

	def create(self, validated_data):
		archivo = validated_data.get('archivo')
		if archivo:
			validated_data['tamano_kb'] = archivo.size // 1024
		return super().create(validated_data)

	def update(self, instance, validated_data):
		archivo = validated_data.get('archivo')
		if archivo and archivo != instance.archivo:
			validated_data['tamano_kb'] = archivo.size // 1024
		return super().update(instance, validated_data)
