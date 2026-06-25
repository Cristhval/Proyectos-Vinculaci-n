from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import IntegrityError
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken

from auditoria.models import TipoAccion
from auditoria.utils import registrar_auditoria
from auditoria.middleware import get_client_ip
from core.permissions import IsAdmin, IsDocenteOrAbove
from core.utils import api_response

from .models import Carrera, RolUsuario, Usuario
from .serializers import (
	CarreraSerializer,
	LoginResponseSerializer,
	LoginSerializer,
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
	serializer_class = LoginSerializer
	permission_classes = [AllowAny]

	def post(self, request, *args, **kwargs):
		username = request.data.get('username')
		password = request.data.get('password')
		user = authenticate(username=username, password=password)
		if not user:
			try:
				user_obj = User.objects.get(email=username)
				user = authenticate(username=user_obj.username, password=password)
			except User.DoesNotExist:
				user = None
		if not user:
			return api_response(False, 'Credenciales invalidas.', http_status=status.HTTP_400_BAD_REQUEST)
		perfil, creado = Usuario.objects.get_or_create(
			user=user,
			defaults={'rol': RolUsuario.ESTUDIANTE, 'activo': True, 'codigo': f'USR-{user.id:05d}'},
		)
		# Auditar el inicio de sesion. Si el perfil se acaba de crear, el signal
		# post_save ya registro un CREAR Usuario, asi que evitamos duplicar.
		if not creado:
			registrar_auditoria(
				usuario=perfil,
				accion=TipoAccion.INICIAR_SESION,
				entidad='Usuario',
				entidad_id=perfil.pk,
				detalle=f'Inicio de sesion de {user.username}',
				ip_address=get_client_ip(request),
			)
		refresh = RefreshToken.for_user(user)
		payload = {
			'refresh': str(refresh),
			'access': str(refresh.access_token),
			'user': UsuarioSerializer(perfil).data,
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


class CarreraViewSet(viewsets.ModelViewSet):
	queryset = Carrera.objects.filter(activa=True)
	serializer_class = CarreraSerializer

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsAdmin()]
		return [IsAuthenticated()]


class UsuarioViewSet(viewsets.ModelViewSet):
	queryset = Usuario.objects.select_related('user', 'carrera').all()
	serializer_class = UsuarioSerializer
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		qs = super().get_queryset()
		rol = self.request.query_params.get('rol')
		activo = self.request.query_params.get('activo')
		search = self.request.query_params.get('search')
		if rol:
			qs = qs.filter(rol=rol)
		if activo is not None and activo != '':
			qs = qs.filter(activo=activo.lower() in ('true', '1', 'si'))
		if search:
			from django.db.models import Q
			terms = search.split()
			q = Q()
			for term in terms:
				q &= (
					Q(user__first_name__icontains=term) |
					Q(user__last_name__icontains=term) |
					Q(user__email__icontains=term) |
					Q(user__username__icontains=term) |
					Q(codigo__icontains=term) |
					Q(documento_identidad__icontains=term)
				)
			qs = qs.filter(q)
		return qs

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy', 'cambiar_contrasena'):
			return [IsAdmin()]
		return [IsAuthenticated()]

	@action(detail=False, methods=['get'], url_path='me')
	def me(self, request):
		perfil = getattr(request.user, 'perfil', None)
		if not perfil:
			return api_response(False, 'Perfil no encontrado.', http_status=status.HTTP_404_NOT_FOUND)
		return api_response(True, 'Perfil actual.', UsuarioSerializer(perfil).data)

	@action(detail=True, methods=['post'], url_path='cambiar-contrasena')
	def cambiar_contrasena(self, request, pk=None):
		usuario = self.get_object()
		password = request.data.get('password')
		password2 = request.data.get('password2')
		if not password or not password2:
			return api_response(False, 'Ambas contrasenas son requeridas.', http_status=status.HTTP_400_BAD_REQUEST)
		if password != password2:
			return api_response(False, 'Las contrasenas no coinciden.', http_status=status.HTTP_400_BAD_REQUEST)
		if len(password) < 8:
			return api_response(False, 'La contrasena debe tener al menos 8 caracteres.', http_status=status.HTTP_400_BAD_REQUEST)
		usuario.user.set_password(password)
		usuario.user.save()
		return api_response(True, 'Contrasena actualizada correctamente.')

	def perform_destroy(self, instance):
		instance.activo = False
		instance.save()
