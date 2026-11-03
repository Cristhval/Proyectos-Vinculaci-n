from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny

from .respuestas import api_response
from .servicios.tokens import jwks


def jwks_view(request):
	return JsonResponse(jwks())


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def salud_view(request):
	return api_response(True, 'auth-service operativo.', {'servicio': 'vinculacion-auth'})
