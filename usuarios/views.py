from django.contrib.auth import authenticate
from django.db import IntegrityError
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken

from core.permissions import IsAdmin, IsDocenteOrAbove
from core.utils import api_response

from .models import Carrera, Usuario
from .serializers import (
	CarreraSerializer,
	LoginResponseSerializer,
	RegisterSerializer,
	UsuarioSerializer,
)


class RegisterAPIView(generics.CreateAPIView):
	serializer_class = RegisterSerializer
	permission_classes = [AllowAny]

	def create(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		try:
			user = serializer.save()
		except IntegrityError:
			return api_response(False, 'No se pudo registrar el usuario por un conflicto de datos.', http_status=status.HTTP_400_BAD_REQUEST)
		return api_response(True, 'Usuario registrado correctamente.', UsuarioSerializer(user.perfil).data, http_status=status.HTTP_201_CREATED)


class LoginAPIView(generics.GenericAPIView):
	serializer_class = RegisterSerializer
	permission_classes = [AllowAny]

	def post(self, request, *args, **kwargs):
		username = request.data.get('username')
		password = request.data.get('password')
		user = authenticate(username=username, password=password)
		if not user:
			return api_response(False, 'Credenciales invalidas.', http_status=status.HTTP_400_BAD_REQUEST)
		perfil = getattr(user, 'perfil', None)
		refresh = RefreshToken.for_user(user)
		payload = {
			'refresh': str(refresh),
			'access': str(refresh.access_token),
			'user': UsuarioSerializer(perfil).data if perfil else None,
		}
		return api_response(True, 'Inicio de sesion correcto.', payload)


class TokenRefreshAPIView(generics.GenericAPIView):
	permission_classes = [AllowAny]

	def post(self, request, *args, **kwargs):
		refresh_token = request.data.get('refresh')
		if not refresh_token:
			return api_response(False, 'Token de refresco requerido.', http_status=status.HTTP_400_BAD_REQUEST)
		try:
			refresh = RefreshToken(refresh_token)
			return api_response(True, 'Token renovado.', {
				'access': str(refresh.access_token),
			})
		except Exception:
			return api_response(False, 'Token de refresco invalido o expirado.', http_status=status.HTTP_400_BAD_REQUEST)


class CarreraViewSet(viewsets.ReadOnlyModelViewSet):
	queryset = Carrera.objects.filter(activa=True)
	serializer_class = CarreraSerializer
	permission_classes = [IsAuthenticated]


class UsuarioViewSet(viewsets.ModelViewSet):
	queryset = Usuario.objects.filter(activo=True)
	serializer_class = UsuarioSerializer
	permission_classes = [IsAuthenticated]

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsAdmin()]
		return [IsAuthenticated()]

	@action(detail=False, methods=['get'], url_path='me')
	def me(self, request):
		perfil = getattr(request.user, 'perfil', None)
		if not perfil:
			return api_response(False, 'Perfil no encontrado.', http_status=status.HTTP_404_NOT_FOUND)
		return api_response(True, 'Perfil actual.', UsuarioSerializer(perfil).data)

	def perform_destroy(self, instance):
		instance.activo = False
		instance.save()
