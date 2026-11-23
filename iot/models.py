from django.db import models


class DispositivoIoT(models.Model):
	"""Dispositivo (ESP32 + DHT11 + MQ-135) asociado a un proyecto con monitoreo ambiental.

	El token de autenticación del dispositivo nunca se guarda en texto plano:
	solo su hash SHA-256 en ``token_hash`` (ver ``iot.services.TokenDispositivoFactory``).
	"""

	identificador = models.SlugField(max_length=50, unique=True, help_text='Código único del dispositivo, p. ej. esp32-huerto-01')
	nombre = models.CharField(max_length=120)
	descripcion = models.TextField(blank=True, default='')
	proyecto = models.ForeignKey('proyectos.Proyecto', on_delete=models.CASCADE, related_name='dispositivos')
	mide_temperatura = models.BooleanField(default=True)
	mide_humedad = models.BooleanField(default=True)
	mide_co2 = models.BooleanField(default=True)
	token_hash = models.CharField(max_length=64, editable=False)
	activo = models.BooleanField(default=True)
	fecha_registro = models.DateTimeField(auto_now_add=True)
	fecha_baja = models.DateTimeField(null=True, blank=True)
	ultima_lectura = models.DateTimeField(null=True, blank=True)

	class Meta:
		ordering = ['-fecha_registro']
		indexes = [
			models.Index(fields=['proyecto', 'activo'], name='dispositivo_proy_activo_idx'),
			models.Index(fields=['token_hash'], name='dispositivo_token_hash_idx'),
		]
		verbose_name = 'Dispositivo IoT'
		verbose_name_plural = 'Dispositivos IoT'

	def __str__(self):
		return f'{self.identificador} - {self.nombre}'


class Medicion(models.Model):
	"""Lectura enviada por un dispositivo (HU-27).

	Cada variable es nula si el dispositivo no la mide. ``fecha_hora`` es la hora
	del servidor al recibirla (el ESP32 no tiene un reloj confiable).
	Dar de baja o editar el dispositivo no borra sus mediciones.
	"""

	dispositivo = models.ForeignKey(DispositivoIoT, on_delete=models.CASCADE, related_name='mediciones')
	temperatura = models.FloatField(null=True, blank=True, help_text='°C')
	humedad = models.FloatField(null=True, blank=True, help_text='% de humedad relativa')
	co2 = models.FloatField(null=True, blank=True, help_text='ppm (aproximado con MQ-135)')
	fecha_hora = models.DateTimeField()

	class Meta:
		ordering = ['-fecha_hora']
		indexes = [
			models.Index(fields=['dispositivo', 'fecha_hora'], name='medicion_disp_fecha_idx'),
		]
		verbose_name = 'Medición'
		verbose_name_plural = 'Mediciones'

	def __str__(self):
		return f'{self.dispositivo.identificador} @ {self.fecha_hora:%Y-%m-%d %H:%M:%S}'
