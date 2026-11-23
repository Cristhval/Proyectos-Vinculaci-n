"""Vistas delgadas de IoT: validan permisos y entrada, y delegan en iot.services."""
from datetime import datetime, time

from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import exceptions, status
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView

from core.utils import api_response
from proyectos.models import Proyecto

from . import services
from .authentication import DeviceTokenAuthentication, EsDispositivoAutenticado
from .models import DispositivoIoT, Medicion
from .permissions import puede_gestionar_proyecto, puede_ver_proyecto
from .serializers import (
	DispositivoIoTSerializer,
	EditarDispositivoSerializer,
	MedicionEntradaSchema,
	MedicionSerializer,
	RegistrarDispositivoSerializer,
)
from .throttling import MedicionDispositivoThrottle

MENSAJE_SIN_ACCESO = 'No tiene acceso a este proyecto.'
MENSAJE_SIN_PERMISO = (
	'Solo el docente responsable del proyecto, un coordinador o un administrador '
	'pueden gestionar dispositivos.'
)
AVISO_TOKEN = 'Guarde este token ahora: no se volverá a mostrar.'


def _primer_error(errores):
	"""Primer mensaje legible de un dict/lista de errores de DRF."""
	if isinstance(errores, dict):
		for valor in errores.values():
			return _primer_error(valor)
	if isinstance(errores, (list, tuple)) and errores:
		return _primer_error(errores[0])
	return str(errores)


def _error(mensaje, codigo, data=None):
	return api_response(False, mensaje, data, http_status=codigo)


def _serializar(dispositivo, many=False):
	return DispositivoIoTSerializer(dispositivo, many=many, context={'ahora': timezone.now()}).data


def _con_token(dispositivo, token):
	"""Única respuesta que incluye el token en texto plano (crear y regenerar)."""
	return {'dispositivo': _serializar(dispositivo), 'token': token, 'aviso': AVISO_TOKEN}


class DispositivosProyectoView(APIView):
	"""GET/POST /api/v1/proyectos/{id}/dispositivos/ (HU-25)."""

	@extend_schema(tags=['IoT'], responses=DispositivoIoTSerializer(many=True))
	def get(self, request, proyecto_id):
		proyecto = get_object_or_404(Proyecto, pk=proyecto_id)
		if not puede_ver_proyecto(request.user, proyecto):
			return _error(MENSAJE_SIN_ACCESO, status.HTTP_403_FORBIDDEN)
		dispositivos = proyecto.dispositivos.all()
		if request.query_params.get('activo') in ('true', 'false'):
			dispositivos = dispositivos.filter(activo=request.query_params['activo'] == 'true')
		return api_response(True, 'Dispositivos del proyecto.', _serializar(dispositivos, many=True))

	@extend_schema(tags=['IoT'], request=RegistrarDispositivoSerializer, responses={201: DispositivoIoTSerializer})
	def post(self, request, proyecto_id):
		proyecto = get_object_or_404(Proyecto, pk=proyecto_id)
		if not puede_gestionar_proyecto(request.user, proyecto):
			return _error(MENSAJE_SIN_PERMISO, status.HTTP_403_FORBIDDEN)
		entrada = RegistrarDispositivoSerializer(data=request.data)
		if not entrada.is_valid():
			return _error(_primer_error(entrada.errors), status.HTTP_400_BAD_REQUEST, entrada.errors)
		try:
			dispositivo, token = services.registrar_dispositivo(proyecto, **entrada.validated_data)
		except services.ErrorIoT as e:
			return _error(str(e), status.HTTP_400_BAD_REQUEST)
		return api_response(True, 'Dispositivo registrado.', _con_token(dispositivo, token), http_status=status.HTTP_201_CREATED)


class _DispositivoBaseView(APIView):
	def _obtener(self, request, pk, gestionar):
		"""Devuelve ``(dispositivo, respuesta_error)``."""
		dispositivo = get_object_or_404(DispositivoIoT.objects.select_related('proyecto'), pk=pk)
		proyecto = dispositivo.proyecto
		if gestionar:
			if not puede_gestionar_proyecto(request.user, proyecto):
				return None, _error(MENSAJE_SIN_PERMISO, status.HTTP_403_FORBIDDEN)
		elif not puede_ver_proyecto(request.user, proyecto):
			return None, _error(MENSAJE_SIN_ACCESO, status.HTTP_403_FORBIDDEN)
		return dispositivo, None


class DispositivoDetalleView(_DispositivoBaseView):
	"""GET/PATCH /api/v1/dispositivos/{id}/ (PATCH solo nombre y descripción)."""

	@extend_schema(tags=['IoT'], responses=DispositivoIoTSerializer)
	def get(self, request, pk):
		dispositivo, error = self._obtener(request, pk, gestionar=False)
		if error:
			return error
		return api_response(True, 'Dispositivo.', _serializar(dispositivo))

	@extend_schema(tags=['IoT'], request=EditarDispositivoSerializer, responses=DispositivoIoTSerializer)
	def patch(self, request, pk):
		dispositivo, error = self._obtener(request, pk, gestionar=True)
		if error:
			return error
		entrada = EditarDispositivoSerializer(data=request.data, partial=True)
		if not entrada.is_valid():
			return _error(_primer_error(entrada.errors), status.HTTP_400_BAD_REQUEST, entrada.errors)
		try:
			services.editar_dispositivo(dispositivo, **entrada.validated_data)
		except services.ErrorIoT as e:
			return _error(str(e), status.HTTP_400_BAD_REQUEST)
		return api_response(True, 'Dispositivo actualizado.', _serializar(dispositivo))


class DispositivoBajaView(_DispositivoBaseView):
	"""POST /api/v1/dispositivos/{id}/baja/ (HU-28)."""

	@extend_schema(tags=['IoT'], request=None, responses=DispositivoIoTSerializer)
	def post(self, request, pk):
		dispositivo, error = self._obtener(request, pk, gestionar=True)
		if error:
			return error
		try:
			services.dar_de_baja(dispositivo, usuario=request.user.perfil, request=request)
		except services.ErrorIoT as e:
			return _error(str(e), status.HTTP_400_BAD_REQUEST)
		return api_response(True, 'Dispositivo dado de baja. Sus mediciones se conservan.', _serializar(dispositivo))


class DispositivoRegenerarTokenView(_DispositivoBaseView):
	"""POST /api/v1/dispositivos/{id}/regenerar-token/ (HU-26)."""

	@extend_schema(tags=['IoT'], request=None, responses=DispositivoIoTSerializer)
	def post(self, request, pk):
		dispositivo, error = self._obtener(request, pk, gestionar=True)
		if error:
			return error
		try:
			dispositivo, token = services.regenerar_token(dispositivo, usuario=request.user.perfil, request=request)
		except services.ErrorIoT as e:
			return _error(str(e), status.HTTP_400_BAD_REQUEST)
		return api_response(True, 'Token regenerado. El anterior ya no es válido.', _con_token(dispositivo, token))


# --- HU-27: mediciones ------------------------------------------------------------

class RecibirMedicionView(APIView):
	"""POST /api/v1/iot/mediciones/ — lo llama el ESP32 con ``Authorization: Device <token>``.

	Sin JWT ni sesión: Authentication Strategy propia (DeviceTokenAuthentication) y
	throttle de 1 medición cada 30 s por dispositivo.
	"""

	authentication_classes = [DeviceTokenAuthentication]
	permission_classes = [EsDispositivoAutenticado]
	throttle_classes = [MedicionDispositivoThrottle]

	def handle_exception(self, exc):
		# 401/403/429 con el mismo formato {success, message, data} que el resto de la API.
		respuesta = super().handle_exception(exc)
		if isinstance(exc, exceptions.APIException):
			detalle = exc.detail
			if isinstance(exc, exceptions.Throttled):
				espera = f'{exc.wait:.0f} s' if exc.wait is not None else 'unos segundos'
				detalle = f'Demasiadas mediciones: espere {espera} antes de enviar otra (máximo 1 cada 30 s).'
			respuesta.data = {'success': False, 'message': str(detalle), 'data': None}
		return respuesta

	@extend_schema(tags=['IoT'], request=MedicionEntradaSchema, responses={201: MedicionSerializer}, auth=[])
	def post(self, request):
		dispositivo = request.auth
		try:
			medicion, ignoradas = services.registrar_medicion(dispositivo, request.data)
		except services.MonitoreoDesactivado as e:
			return _error(str(e), status.HTTP_403_FORBIDDEN)
		except services.MedicionInvalida as e:
			return _error(str(e), status.HTTP_400_BAD_REQUEST, e.errores or None)
		datos = {**MedicionSerializer(medicion).data, 'ignoradas': ignoradas}
		return api_response(True, 'Medición registrada.', datos, http_status=status.HTTP_201_CREATED)


def _fecha_param(valor, fin_del_dia=False):
	"""Acepta '2026-11-23' o un ISO 8601 con hora. Devuelve datetime aware o lanza ValueError."""
	fecha_hora = parse_datetime(valor)
	if fecha_hora is None:
		fecha = parse_date(valor)
		if fecha is None:
			raise ValueError
		fecha_hora = datetime.combine(fecha, time.max if fin_del_dia else time.min)
	if timezone.is_naive(fecha_hora):
		fecha_hora = timezone.make_aware(fecha_hora)
	return fecha_hora


class MedicionesDispositivoView(_DispositivoBaseView, ListAPIView):
	"""GET /api/v1/dispositivos/{id}/mediciones/?desde=&hasta= (paginado, más recientes primero).

	``desde``/``hasta``: fecha (AAAA-MM-DD, día completo) o fecha y hora ISO 8601.
	Lo usará el Módulo 3 (visualización). Incluye las de dispositivos dados de baja.
	"""

	serializer_class = MedicionSerializer
	queryset = Medicion.objects.none()  # solo para el esquema; get() arma la consulta real

	@extend_schema(tags=['IoT'], parameters=[
		OpenApiParameter('desde', str, description='AAAA-MM-DD o ISO 8601'),
		OpenApiParameter('hasta', str, description='AAAA-MM-DD o ISO 8601'),
	])
	def get(self, request, pk):
		dispositivo, error = self._obtener(request, pk, gestionar=False)
		if error:
			return error
		mediciones = dispositivo.mediciones.all()
		try:
			if request.query_params.get('desde'):
				mediciones = mediciones.filter(fecha_hora__gte=_fecha_param(request.query_params['desde']))
			if request.query_params.get('hasta'):
				mediciones = mediciones.filter(fecha_hora__lte=_fecha_param(request.query_params['hasta'], fin_del_dia=True))
		except ValueError:
			return _error('Fecha inválida. Use AAAA-MM-DD o fecha y hora ISO 8601 en "desde" y "hasta".', status.HTTP_400_BAD_REQUEST)
		pagina = self.paginate_queryset(mediciones.order_by('-fecha_hora', '-id'))
		return self.get_paginated_response(MedicionSerializer(pagina, many=True).data)
