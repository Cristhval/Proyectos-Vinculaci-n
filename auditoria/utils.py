from .middleware import get_client_ip, get_current_request
from .models import Auditoria, TipoAccion


def get_usuario_from_request(request=None):
	if request is None:
		request = get_current_request()
	if request and hasattr(request, 'user') and request.user.is_authenticated:
		return getattr(request.user, 'perfil', None)
	return None


def registrar_auditoria(
	usuario,
	accion,
	entidad,
	entidad_id,
	detalle='',
	ip_address='',
):
	Auditoria.objects.create(
		usuario=usuario,
		accion=accion,
		entidad=entidad,
		entidad_id=entidad_id,
		detalle={'detalle': detalle} if isinstance(detalle, str) else detalle,
		ip_address=ip_address,
	)


def registrar_desde_request(request, accion, entidad, entidad_id, detalle=''):
	usuario = get_usuario_from_request(request)
	ip = get_client_ip(request) if request else ''
	registrar_auditoria(
		usuario=usuario,
		accion=accion,
		entidad=entidad,
		entidad_id=entidad_id,
		detalle=detalle,
		ip_address=ip,
	)
