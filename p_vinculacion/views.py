from django.contrib.auth import authenticate
from django.db import IntegrityError
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken

from .models import Proyecto
from .serializers import LoginResponseSerializer, ProyectoDetalleSerializer, ProyectoSerializer, RegisterSerializer, UsuarioSerializer


def api_response(success, message, data=None, http_status=status.HTTP_200_OK):
	return Response({'success': success, 'message': message, 'data': data}, status=http_status)


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
			return api_response(False, 'Credenciales inválidas.', http_status=status.HTTP_400_BAD_REQUEST)
		perfil = getattr(user, 'perfil', None)
		refresh = RefreshToken.for_user(user)
		payload = {
			'refresh': str(refresh),
			'access': str(refresh.access_token),
			'user': UsuarioSerializer(perfil).data if perfil else None,
		}
		return api_response(True, 'Inicio de sesión correcto.', payload)


class ProyectoListCreateAPIView(generics.ListCreateAPIView):
	queryset = Proyecto.objects.all()
	serializer_class = ProyectoSerializer
	permission_classes = [IsAuthenticated]


class ProyectoRetrieveAPIView(generics.RetrieveAPIView):
	queryset = Proyecto.objects.all()
	serializer_class = ProyectoDetalleSerializer
	permission_classes = [IsAuthenticated]
