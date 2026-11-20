from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_GET
from rest_framework import mixins, status, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from core.permissions import IsAdmin
from core.utils import api_response

from .models import Carrera, Usuario
from . import fotos
from .serializers import CarreraSerializer, PerfilPropioSerializer, SincronizarSerializer, UsuarioSerializer
from .sincronizacion import SincronizadorUsuario


class CarreraViewSet(viewsets.ModelViewSet):
	queryset = Carrera.objects.filter(activa=True)
	serializer_class = CarreraSerializer

	def get_permissions(self):
		if self.action in ('create', 'update', 'partial_update', 'destroy'):
			return [IsAdmin()]
		return [IsAuthenticated()]


class UsuarioViewSet(
	mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin,
	mixins.DestroyModelMixin, viewsets.GenericViewSet,
):
	"""Perfiles académicos. Crear cuentas, cambiar rol y contraseña se hace en auth-service."""
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
		if self.action in ('update', 'partial_update', 'destroy', 'sincronizar'):
			return [IsAdmin()]
		return [IsAuthenticated()]

	@action(detail=False, methods=['get', 'patch'], url_path='me')
	def me(self, request):
		perfil = getattr(request.user, 'perfil', None)
		if not perfil:
			return api_response(False, 'Perfil no encontrado.', http_status=status.HTTP_404_NOT_FOUND)
		if request.method == 'PATCH':
			serializer = PerfilPropioSerializer(perfil, data=request.data, partial=True)
			if not serializer.is_valid():
				return api_response(False, 'Revisa los datos del perfil.', serializer.errors, http_status=status.HTTP_400_BAD_REQUEST)
			serializer.save()
			return api_response(True, 'Perfil actualizado.', UsuarioSerializer(perfil).data)
		return api_response(True, 'Perfil actual.', UsuarioSerializer(perfil).data)

	@action(detail=False, methods=['post', 'delete'], url_path='me/foto', parser_classes=[MultiPartParser, FormParser, JSONParser])
	def foto(self, request):
		perfil = getattr(request.user, 'perfil', None)
		if not perfil:
			return api_response(False, 'Perfil no encontrado.', http_status=status.HTTP_404_NOT_FOUND)
		if request.method == 'DELETE':
			perfil.foto, perfil.foto_actualizada = None, None
		else:
			archivo = request.FILES.get('foto')
			if not archivo:
				return api_response(False, 'Selecciona una imagen.', http_status=status.HTTP_400_BAD_REQUEST)
			try:
				perfil.foto = fotos.procesar(archivo)
			except fotos.FotoInvalida as error:
				return api_response(False, str(error), http_status=status.HTTP_400_BAD_REQUEST)
			perfil.foto_actualizada = timezone.now()
		perfil.save(update_fields=['foto', 'foto_actualizada'])
		return api_response(True, 'Foto actualizada.', UsuarioSerializer(perfil).data)

	@action(detail=False, methods=['post'], url_path='sincronizar')
	def sincronizar(self, request):
		serializer = SincronizarSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		datos = dict(serializer.validated_data)
		extra = {campo: datos.pop(campo) for campo in ('carrera_id', 'telefono', 'direccion', 'cargo', 'activo') if campo in datos}
		if 'carrera_id' in extra:
			extra['carrera'] = extra.pop('carrera_id')
		user = SincronizadorUsuario.desde_claims(datos, perfil_extra=extra)
		return api_response(True, 'Perfil sincronizado.', UsuarioSerializer(user.perfil).data)

	def perform_destroy(self, instance):
		instance.activo = False
		instance.save()


@require_GET
def foto_publica(request, token):
	"""Sirve la foto con una URL firmada: un <img> no puede enviar el token de sesión."""
	pk = fotos.perfil_desde_token(token)
	perfil = get_object_or_404(Usuario.objects.only('foto'), pk=pk, foto__isnull=False) if pk else None
	if not perfil:
		return HttpResponse(status=404)
	respuesta = HttpResponse(bytes(perfil.foto), content_type='image/webp')
	respuesta['Cache-Control'] = 'public, max-age=31536000, immutable'
	return respuesta
