from rest_framework.throttling import SimpleRateThrottle


class MedicionDispositivoThrottle(SimpleRateThrottle):
	"""Una medición cada 30 s por dispositivo (scope por id de dispositivo, no por IP).

	La tasa está en settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']['iot_medicion'].
	Usa la caché de Django (LocMemCache por defecto): basta con una sola instancia,
	como en Render (plan gratuito). Con varias instancias habría que usar una caché
	compartida (Redis) para que el límite sea global.
	"""

	scope = 'iot_medicion'

	def get_cache_key(self, request, view):
		dispositivo = getattr(request, 'auth', None)
		if dispositivo is None or not getattr(dispositivo, 'pk', None):
			return None
		return self.cache_format % {'scope': self.scope, 'ident': f'dispositivo-{dispositivo.pk}'}

	def parse_rate(self, rate):
		"""Acepta periodos con número ('1/30s', '2/5m'); DRF solo lee la primera letra."""
		if rate is None:
			return (None, None)
		num, periodo = rate.split('/')
		cantidad = ''.join(c for c in periodo if c.isdigit()) or '1'
		unidad = periodo[len(cantidad) if periodo[0].isdigit() else 0]
		segundos = {'s': 1, 'm': 60, 'h': 3600, 'd': 86400}[unidad]
		return int(num), int(cantidad) * segundos
