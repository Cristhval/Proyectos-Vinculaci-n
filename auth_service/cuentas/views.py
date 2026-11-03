from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .respuestas import api_response
from .serializers import LoginSerializer
from .servicios.fachada import AuthError, AuthFacade
from .servicios.tokens import jwks


def ip_cliente(request):
	reenviada = request.META.get('HTTP_X_FORWARDED_FOR')
	if reenviada:
		return reenviada.split(',')[0].strip()
	return request.META.get('REMOTE_ADDR')


def respuesta_error(error):
	return api_response(False, error.mensaje, {'codigo': error.codigo}, http_status=error.http_status)


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


def jwks_view(request):
	return JsonResponse(jwks())


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def salud_view(request):
	return api_response(True, 'auth-service operativo.', {'servicio': 'vinculacion-auth'})
