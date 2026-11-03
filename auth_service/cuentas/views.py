import logging
import secrets
from urllib.parse import urlencode

from django.conf import settings
from django.http import HttpResponseRedirect, JsonResponse
from django.views.decorators.http import require_GET
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .respuestas import api_response
from rest_framework import generics, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination

from .models import Cuenta, RegistroAcceso
from .permissions import EsAdmin
from .serializers import (
	ContrasenaSerializer, CuentaCrearSerializer, CuentaEditarSerializer, CuentaSerializer,
	LoginSerializer, RegistroAccesoSerializer, RegistroSerializer, TokenSerializer,
)
from .servicios.fachada import AuthError, AuthFacade
from .servicios.proveedores import FabricaProveedores
from .servicios.tokens import EmisorTokens, jwks

logger = logging.getLogger(__name__)


def ip_cliente(request):
	reenviada = request.META.get('HTTP_X_FORWARDED_FOR')
	if reenviada:
		return reenviada.split(',')[0].strip()
	return request.META.get('REMOTE_ADDR')


def respuesta_error(error):
	return api_response(False, error.mensaje, {'codigo': error.codigo, 'errores': error.detalle}, http_status=error.http_status)


def datos_validos(serializer_class, request):
	serializer = serializer_class(data=request.data)
	serializer.is_valid(raise_exception=True)
	return serializer.validated_data


class VistaPublica(APIView):
	authentication_classes = []
	permission_classes = [AllowAny]

	def handle_exception(self, exc):
		if isinstance(exc, AuthError):
			return respuesta_error(exc)
		respuesta = super().handle_exception(exc)
		if respuesta is not None and respuesta.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
			respuesta.data = {'success': False, 'message': 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.', 'data': None}
		elif respuesta is not None and respuesta.status_code == status.HTTP_400_BAD_REQUEST and 'success' not in respuesta.data:
			respuesta.data = {'success': False, 'message': 'Datos inválidos.', 'data': respuesta.data}
		return respuesta


class LoginView(VistaPublica):
	throttle_classes = [ScopedRateThrottle]
	throttle_scope = 'login'

	def post(self, request):
		datos = datos_validos(LoginSerializer, request)
		tokens = AuthFacade.login(datos['usuario'], datos['password'], datos['captcha_token'], ip_cliente(request))
		return api_response(True, 'Inicio de sesión correcto.', tokens)


class RegistroView(VistaPublica):
	def post(self, request):
		datos = datos_validos(RegistroSerializer, request)
		cuenta = AuthFacade.registrar(datos, datos['captcha_token'], ip_cliente(request))
		return api_response(True, 'Cuenta creada. Ya puedes iniciar sesión.', EmisorTokens.datos_usuario(cuenta), http_status=status.HTTP_201_CREATED)


class RefreshView(VistaPublica):
	def post(self, request):
		datos = datos_validos(TokenSerializer, request)
		return api_response(True, 'Sesión renovada.', AuthFacade.refrescar(datos['refresh']))


class LogoutView(VistaPublica):
	authentication_classes = APIView.authentication_classes
	permission_classes = [IsAuthenticated]

	def post(self, request):
		datos = datos_validos(TokenSerializer, request)
		AuthFacade.cerrar_sesion(datos['refresh'])
		return api_response(True, 'Sesión cerrada.')


class MeView(APIView):
	def get(self, request):
		return api_response(True, 'Cuenta actual.', EmisorTokens.datos_usuario(request.user))


class Paginacion(PageNumberPagination):
	page_size = 10
	page_size_query_param = 'page_size'
	max_page_size = 100

	def get_paginated_response(self, data):
		return api_response(True, 'Listado.', {
			'count': self.page.paginator.count,
			'next': self.get_next_link(),
			'previous': self.get_previous_link(),
			'results': data,
		})


class ManejoAuthError:
	def handle_exception(self, exc):
		if isinstance(exc, AuthError):
			return respuesta_error(exc)
		return super().handle_exception(exc)


class CuentaViewSet(ManejoAuthError, viewsets.GenericViewSet):
	"""Gestión de cuentas y roles. Solo administrador."""
	serializer_class = CuentaSerializer
	permission_classes = [EsAdmin]
	pagination_class = Paginacion

	def get_queryset(self):
		from django.db.models import Q
		qs = Cuenta.objects.all()
		rol = self.request.query_params.get('rol')
		buscar = self.request.query_params.get('search')
		activo = self.request.query_params.get('activo')
		if rol:
			qs = qs.filter(rol=rol)
		if activo in ('true', 'false'):
			qs = qs.filter(is_active=activo == 'true')
		if buscar:
			for termino in buscar.split():
				qs = qs.filter(
					Q(username__icontains=termino) | Q(email__icontains=termino) | Q(first_name__icontains=termino)
					| Q(last_name__icontains=termino) | Q(documento_identidad__icontains=termino)
				)
		return qs

	def list(self, request):
		pagina = self.paginate_queryset(self.get_queryset())
		return self.get_paginated_response(CuentaSerializer(pagina, many=True).data)

	def retrieve(self, request, pk=None):
		return api_response(True, 'Cuenta.', CuentaSerializer(self.get_object()).data)

	def create(self, request):
		datos = datos_validos(CuentaCrearSerializer, request)
		cuenta = AuthFacade.crear_cuenta(datos, rol=datos['rol'])
		return api_response(True, 'Cuenta creada.', CuentaSerializer(cuenta).data, http_status=status.HTTP_201_CREATED)

	def partial_update(self, request, pk=None):
		cuenta = self.get_object()
		serializer = CuentaEditarSerializer(data=request.data, partial=True)
		serializer.is_valid(raise_exception=True)
		cuenta = AuthFacade.editar_cuenta(cuenta, dict(serializer.validated_data))
		return api_response(True, 'Cuenta actualizada.', CuentaSerializer(cuenta).data)

	@action(detail=True, methods=['post'])
	def contrasena(self, request, pk=None):
		datos = datos_validos(ContrasenaSerializer, request)
		AuthFacade.fijar_contrasena(self.get_object(), datos['password'], datos['password2'])
		return api_response(True, 'Contraseña actualizada. Se cerraron sus sesiones abiertas.')


class AccesosView(generics.ListAPIView):
	queryset = RegistroAcceso.objects.select_related('cuenta')
	serializer_class = RegistroAccesoSerializer
	permission_classes = [EsAdmin]
	pagination_class = Paginacion


# --- Login social ------------------------------------------------------------

def _redirect_uri(proveedor):
	return f'{settings.AUTH_SERVICE_URL}/api/auth/social/{proveedor}/callback/'


def _volver_al_login(error, proveedor):
	return HttpResponseRedirect(f'{settings.FRONTEND_URL}/login?{urlencode({"error": error, "proveedor": proveedor})}')


@require_GET
def social_iniciar(request, proveedor):
	estrategia = FabricaProveedores.obtener(proveedor)
	state = secrets.token_urlsafe(32)
	request.session[f'oauth_state_{proveedor}'] = state
	return HttpResponseRedirect(estrategia.url_autorizacion(state, _redirect_uri(proveedor)))


@require_GET
def social_callback(request, proveedor):
	estrategia = FabricaProveedores.obtener(proveedor)
	esperado = request.session.pop(f'oauth_state_{proveedor}', None)
	recibido = request.GET.get('state', '')
	code = request.GET.get('code')
	if not esperado or not code or not secrets.compare_digest(esperado, recibido):
		return _volver_al_login('social_fallido', proveedor)
	try:
		identidad = estrategia.obtener_identidad(code, _redirect_uri(proveedor))
	except Exception:
		logger.exception('Fallo al obtener la identidad desde %s', proveedor)
		return _volver_al_login('social_fallido', proveedor)
	try:
		cuenta = AuthFacade.resolver_social(proveedor, identidad, ip_cliente(request))
	except AuthError as error:
		return _volver_al_login(error.codigo, proveedor)
	codigo = AuthFacade.crear_codigo(cuenta)
	return HttpResponseRedirect(f'{settings.FRONTEND_URL}/auth/callback?{urlencode({"code": codigo})}')


class ProveedoresView(VistaPublica):
	def get(self, request):
		return api_response(True, 'Proveedores disponibles.', FabricaProveedores.configurados())


class CanjearView(VistaPublica):
	def post(self, request):
		codigo = str(request.data.get('code', ''))
		return api_response(True, 'Inicio de sesión correcto.', AuthFacade.canjear_codigo(codigo))


def jwks_view(request):
	return JsonResponse(jwks())


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def salud_view(request):
	return api_response(True, 'auth-service operativo.', {'servicio': 'vinculacion-auth'})
