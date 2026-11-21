"""Tareas que no necesitan bloquear la respuesta HTTP (p. ej., enviar correos).

Render gratis no tiene workers ni Celery, así que la tarea se ejecuta en un hilo
del mismo proceso, *después* de confirmar la transacción (así el hilo ve los
datos guardados y un rollback no envía avisos de algo que no ocurrió).

Solo debe usarse con tareas cuyo fallo ya se ignora (se registra en el log y la
petición sigue). Si el usuario necesita saber que falló, la tarea va en línea.

Con ``TAREAS_EN_SEGUNDO_PLANO = False`` (por defecto en las pruebas) la tarea se
ejecuta en línea en el momento de la llamada, igual que antes.
"""
import logging
import threading

from django.conf import settings
from django.db import connections, transaction

logger = logging.getLogger(__name__)


def _ejecutar(funcion, args, kwargs, en_hilo):
	try:
		funcion(*args, **kwargs)
	except Exception:
		logger.exception('Falló la tarea en segundo plano %s', getattr(funcion, '__qualname__', funcion))
	finally:
		if en_hilo:
			# Cada hilo abre su propia conexión: se cierra para no dejarla colgada en Neon.
			connections.close_all()


def en_segundo_plano(funcion, *args, **kwargs):
	if not getattr(settings, 'TAREAS_EN_SEGUNDO_PLANO', True):
		_ejecutar(funcion, args, kwargs, en_hilo=False)
		return

	def lanzar():
		threading.Thread(
			target=_ejecutar, args=(funcion, args, kwargs, True),
			name=f'tarea-{getattr(funcion, "__name__", "anonima")}', daemon=True,
		).start()

	transaction.on_commit(lanzar)
