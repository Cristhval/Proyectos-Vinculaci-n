"""Vistas delgadas de IoT: validan permisos y entrada, y delegan en iot.services."""
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.views import APIView

from core.utils import api_response
from proyectos.models import Proyecto

from . import services
from .models import DispositivoIoT
from .permissions import puede_gestionar_proyecto, puede_ver_proyecto
from .serializers import DispositivoIoTSerializer, EditarDispositivoSerializer, RegistrarDispositivoSerializer

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
