"""Registro de peticiones lentas (sin dependencias ni APM).

Mide el tiempo total de cada petición y cuenta las consultas SQL con un
``execute_wrapper`` (funciona aunque DEBUG=False, a diferencia de
``connection.queries``). Si supera ``PETICION_LENTA_MS`` deja una línea en el log:

    Petición lenta: GET /api/v1/proyectos/ 1234 ms, 37 consultas, estado 200
"""
import logging
import time

from django.conf import settings
from django.db import connection

logger = logging.getLogger('rendimiento')


class PeticionesLentasMiddleware:
	def __init__(self, get_response):
		self.get_response = get_response

	def __call__(self, request):
		consultas = 0

		def contar(execute, sql, params, many, context):
			nonlocal consultas
			consultas += 1
			return execute(sql, params, many, context)

		inicio = time.perf_counter()
		with connection.execute_wrapper(contar):
			respuesta = self.get_response(request)
		duracion_ms = (time.perf_counter() - inicio) * 1000
		if duracion_ms > getattr(settings, 'PETICION_LENTA_MS', 800):
			logger.warning(
				'Petición lenta: %s %s %.0f ms, %d consultas, estado %s',
				request.method, request.path, duracion_ms, consultas, respuesta.status_code,
			)
		return respuesta
