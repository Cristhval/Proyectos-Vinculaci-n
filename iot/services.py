"""Lógica de negocio del Módulo 2 (dispositivos IoT).

Patrones:
- Service Layer: las vistas solo validan permisos y delegan aquí.
- Factory: ``TokenDispositivoFactory`` crea los tokens de dispositivo.
- Strategy: ``EstrategiaEstadoConexion`` calcula el estado de conexión.
- Observer: la baja y la regeneración del token emiten ``iot.signals.dispositivo_accion``;
  el registro y la edición los audita el post_save genérico de auditoria/signals.py.
- Authentication Strategy de DRF: iot/authentication.py (``DeviceTokenAuthentication``)
  usa ``validar_token`` para autenticar al dispositivo que envía mediciones.
"""
import hashlib
import hmac
import math
import secrets
from abc import ABC, abstractmethod
from datetime import timedelta

from django.conf import settings
from django.db import models, transaction
from django.utils import timezone

from auditoria.models import TipoAccion

from .models import DispositivoIoT, Medicion
from .signals import dispositivo_accion


# --- Errores --------------------------------------------------------------------

class ErrorIoT(ValueError):
	"""Regla de negocio incumplida. La vista la convierte en 400 con el mensaje tal cual."""


class TokenInvalido(Exception):
	"""Token de dispositivo inexistente, mal formado o de un dispositivo dado de baja (401)."""


class MonitoreoDesactivado(Exception):
	"""El proyecto del dispositivo tiene el monitoreo ambiental apagado (403)."""


class MedicionInvalida(ErrorIoT):
	"""Medición fuera de rango o sin variables (400). ``errores`` trae el detalle por campo."""

	def __init__(self, mensaje, errores=None):
		super().__init__(mensaje)
		self.errores = errores or {}


MENSAJE_MONITOREO_OFF = (
	'El monitoreo ambiental de este proyecto está desactivado. '
	'Actívelo para registrar dispositivos.'
)


# --- Factory: tokens de dispositivo --------------------------------------------

class TokenDispositivoFactory:
	"""Factory de tokens de dispositivo.

	Formato: ``dv_`` + ``secrets.token_urlsafe(32)`` (unos 43 caracteres aleatorios).
	El prefijo permite reconocerlo (por ejemplo, en un escáner de secretos).
	Solo se persiste ``hash_de(token)``; el texto plano se devuelve una única vez.
	"""

	PREFIJO = 'dv_'
	BYTES_ALEATORIOS = 32

	@classmethod
	def crear(cls):
		"""Devuelve ``(token_plano, token_hash)``."""
		token = f'{cls.PREFIJO}{secrets.token_urlsafe(cls.BYTES_ALEATORIOS)}'
		return token, cls.hash_de(token)

	@staticmethod
	def hash_de(token):
		return hashlib.sha256(token.encode('utf-8')).hexdigest()

	@classmethod
	def tiene_formato(cls, token):
		return isinstance(token, str) and token.startswith(cls.PREFIJO) and len(token) > len(cls.PREFIJO)


# --- Strategy: estado de conexión ----------------------------------------------

class EstadoConexion(models.TextChoices):
	EN_LINEA = 'EN_LINEA', 'En línea'
	SIN_CONEXION = 'SIN_CONEXION', 'Sin conexión'
	PENDIENTE = 'PENDIENTE', 'Pendiente de primera lectura'


class EstrategiaEstadoConexion(ABC):
	"""Strategy: decide el estado de conexión a partir de la última lectura."""

	@abstractmethod
	def calcular(self, ultima_lectura, ahora):
		"""Devuelve un valor de ``EstadoConexion``."""


class EstadoPorUmbralMinutos(EstrategiaEstadoConexion):
	"""En línea si la última lectura tiene ≤ N minutos (settings.IOT_MINUTOS_EN_LINEA)."""

	def __init__(self, minutos=None):
		self._minutos = minutos

	@property
	def minutos(self):
		return self._minutos if self._minutos is not None else settings.IOT_MINUTOS_EN_LINEA

	def calcular(self, ultima_lectura, ahora):
		if ultima_lectura is None:
			return EstadoConexion.PENDIENTE
		if ahora - ultima_lectura <= timedelta(minutes=self.minutos):
			return EstadoConexion.EN_LINEA
		return EstadoConexion.SIN_CONEXION


ESTRATEGIA_POR_DEFECTO = EstadoPorUmbralMinutos()


def estado_conexion(dispositivo, ahora=None, estrategia=None):
	estrategia = estrategia or ESTRATEGIA_POR_DEFECTO
	return estrategia.calcular(dispositivo.ultima_lectura, ahora or timezone.now())


# --- Service Layer ---------------------------------------------------------------

def _validar_variables(mide_temperatura, mide_humedad, mide_co2):
	if not (mide_temperatura or mide_humedad or mide_co2):
		raise ErrorIoT('El dispositivo debe medir al menos una variable: temperatura, humedad o CO₂.')


def registrar_dispositivo(proyecto, *, identificador, nombre, descripcion='',
						  mide_temperatura=True, mide_humedad=True, mide_co2=True):
	"""HU-25. Devuelve ``(dispositivo, token_plano)``. El token no se vuelve a mostrar."""
	if not proyecto.monitoreo_activo:
		raise ErrorIoT(MENSAJE_MONITOREO_OFF)
	identificador = (identificador or '').strip().lower()
	if DispositivoIoT.objects.filter(identificador=identificador).exists():
		raise ErrorIoT(f'Ya existe un dispositivo con el identificador "{identificador}".')
	_validar_variables(mide_temperatura, mide_humedad, mide_co2)

	token, token_hash = TokenDispositivoFactory.crear()
	dispositivo = DispositivoIoT.objects.create(
		proyecto=proyecto,
		identificador=identificador,
		nombre=nombre.strip(),
		descripcion=(descripcion or '').strip(),
		mide_temperatura=mide_temperatura,
		mide_humedad=mide_humedad,
		mide_co2=mide_co2,
		token_hash=token_hash,
	)
	return dispositivo, token


def editar_dispositivo(dispositivo, *, nombre=None, descripcion=None):
	"""Solo nombre y descripción. No toca token, identificador, variables ni mediciones."""
	if not dispositivo.activo:
		raise ErrorIoT('No se puede editar un dispositivo dado de baja.')
	campos = []
	if nombre is not None:
		dispositivo.nombre = nombre.strip()
		campos.append('nombre')
	if descripcion is not None:
		dispositivo.descripcion = descripcion.strip()
		campos.append('descripcion')
	if campos:
		dispositivo.save(update_fields=campos)
	return dispositivo


def dar_de_baja(dispositivo, usuario=None, request=None):
	"""HU-28. Desactiva el dispositivo e invalida su token. Conserva las mediciones."""
	if not dispositivo.activo:
		raise ErrorIoT('El dispositivo ya está dado de baja.')
	ahora = timezone.now()
	# update(): evita el registro genérico ACTUALIZAR; la auditoría BAJA llega por la señal.
	# token_hash vacío: ningún token (ni el actual) puede coincidir.
	DispositivoIoT.objects.filter(pk=dispositivo.pk).update(activo=False, fecha_baja=ahora, token_hash='')
	dispositivo.activo = False
	dispositivo.fecha_baja = ahora
	dispositivo.token_hash = ''
	dispositivo_accion.send(
		sender=DispositivoIoT, dispositivo=dispositivo, accion=TipoAccion.BAJA,
		usuario=usuario, request=request,
	)
	return dispositivo


def regenerar_token(dispositivo, usuario=None, request=None):
	"""HU-26. Emite un token nuevo e invalida el anterior. Devuelve ``(dispositivo, token_plano)``."""
	if not dispositivo.activo:
		raise ErrorIoT('No se puede regenerar el token de un dispositivo dado de baja.')
	token, token_hash = TokenDispositivoFactory.crear()
	with transaction.atomic():
		DispositivoIoT.objects.filter(pk=dispositivo.pk).update(token_hash=token_hash)
		dispositivo.token_hash = token_hash
		dispositivo_accion.send(
			sender=DispositivoIoT, dispositivo=dispositivo, accion=TipoAccion.REGENERAR_TOKEN,
			usuario=usuario, request=request,
		)
	return dispositivo, token


def validar_token(token):
	"""Devuelve el dispositivo activo dueño del token o lanza ``TokenInvalido``."""
	if not TokenDispositivoFactory.tiene_formato(token):
		raise TokenInvalido('Token de dispositivo inválido.')
	calculado = TokenDispositivoFactory.hash_de(token)
	dispositivo = (
		DispositivoIoT.objects.select_related('proyecto')
		.filter(token_hash=calculado).first()
	)
	if dispositivo is None or not hmac.compare_digest(dispositivo.token_hash, calculado):
		raise TokenInvalido('Token de dispositivo inválido.')
	if not dispositivo.activo:
		raise TokenInvalido('El dispositivo está dado de baja.')
	return dispositivo


# --- HU-27: recepción de mediciones ------------------------------------------

# (campo del modelo, flag del dispositivo, mínimo, máximo, unidad, nombre)
VARIABLES_MEDICION = (
	('temperatura', 'mide_temperatura', -40, 80, '°C', 'La temperatura'),
	('humedad', 'mide_humedad', 0, 100, '%', 'La humedad'),
	('co2', 'mide_co2', 0, 10000, 'ppm', 'El CO₂'),
)


def _numero(valor):
	"""float finito o None. Rechaza booleanos, texto no numérico, NaN e infinito."""
	if isinstance(valor, bool):
		return None
	try:
		numero = float(valor)
	except (TypeError, ValueError):
		return None
	return numero if math.isfinite(numero) else None


def registrar_medicion(dispositivo, datos, ahora=None):
	"""Guarda una medición del dispositivo autenticado.

	- Monitoreo OFF en el proyecto → ``MonitoreoDesactivado`` (403); se conserva el historial.
	- Variables que el dispositivo no mide → se ignoran (se informan en ``ignoradas``).
	- Fuera de rango o no numérico → ``MedicionInvalida`` (400).
	- Ninguna variable que el dispositivo mida → ``MedicionInvalida`` (400).
	La hora es la del servidor y ``ultima_lectura`` se actualiza con un solo UPDATE.
	Devuelve ``(medicion, ignoradas)``.
	"""
	if not dispositivo.proyecto.monitoreo_activo:
		raise MonitoreoDesactivado(
			'El monitoreo ambiental del proyecto está desactivado: no se reciben mediciones.'
		)
	if not isinstance(datos, dict):
		raise MedicionInvalida('El cuerpo debe ser un objeto JSON con temperatura, humedad y/o co2.')

	valores, errores, ignoradas = {}, {}, []
	for campo, flag, minimo, maximo, unidad, nombre in VARIABLES_MEDICION:
		if datos.get(campo) is None:
			continue
		if not getattr(dispositivo, flag):
			ignoradas.append(campo)
			continue
		numero = _numero(datos[campo])
		if numero is None:
			errores[campo] = f'{nombre} debe ser un número.'
		elif not minimo <= numero <= maximo:
			errores[campo] = f'{nombre} debe estar entre {minimo} y {maximo} {unidad} (se recibió {numero:g}).'
		else:
			valores[campo] = numero

	if errores:
		raise MedicionInvalida(next(iter(errores.values())), errores)
	if not valores:
		medibles = [c for c, flag, *_ in VARIABLES_MEDICION if getattr(dispositivo, flag)]
		raise MedicionInvalida(
			'La medición no trae ningún valor de las variables que mide el dispositivo: '
			+ ', '.join(medibles) + '.'
		)

	ahora = ahora or timezone.now()
	with transaction.atomic():
		medicion = Medicion.objects.create(dispositivo=dispositivo, fecha_hora=ahora, **valores)
		# update(): una sola consulta y sin disparar la auditoría del post_save.
		DispositivoIoT.objects.filter(pk=dispositivo.pk).update(ultima_lectura=ahora)
	dispositivo.ultima_lectura = ahora
	return medicion, ignoradas
