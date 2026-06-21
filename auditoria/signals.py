from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .middleware import get_client_ip, get_current_request
from .models import Auditoria, TipoAccion

MODELOS_AUDITADOS = [
    'usuarios.Usuario',
    'usuarios.Carrera',
    'proyectos.Proyecto',
    'proyectos.Objetivo',
    'proyectos.Indicador',
    'proyectos.Actividad',
    'proyectos.ParticipanteProyecto',
    'proyectos.Presupuesto',
    'proyectos.Beneficiario',
    'proyectos.AlineacionEstrategica',
    'proyectos.FirmaResponsabilidad',
    'convenios.Institucion',
    'convenios.Convenio',
    'convenios.ProyectoConvenio',
    'convenios.Compromiso',
    'convenios.Producto',
    'convenios.Contribucion',
    'seguimiento.Avance',
    'seguimiento.Evidencia',
    'seguimiento.Informe',
    'seguimiento.Revision',
    'seguimiento.FlujoValidacion',
]


def _get_usuario_perfil(request):
    if request and hasattr(request, 'user') and request.user.is_authenticated:
        return getattr(request.user, 'perfil', None)
    return None


def _registrar(accion, instance, **kwargs):
	app_label = instance._meta.app_label
	model_name = instance._meta.object_name
	label = f'{app_label}.{model_name}'
	if label not in MODELOS_AUDITADOS:
		return
	if isinstance(instance, Auditoria):
		return

	request = get_current_request()
	if request is None:
		return
	usuario = _get_usuario_perfil(request)
	if usuario is None:
		return
	ip = get_client_ip(request)

	Auditoria.objects.create(
		usuario=usuario,
		accion=accion,
		entidad=model_name,
		entidad_id=instance.pk,
		detalle={'app': app_label, 'modelo': model_name, 'accion': accion},
		ip_address=ip,
	)


@receiver(post_save)
def auditoria_post_save(sender, instance, created, **kwargs):
    accion = TipoAccion.CREAR if created else TipoAccion.ACTUALIZAR
    _registrar(accion, instance)


@receiver(post_delete)
def auditoria_post_delete(sender, instance, **kwargs):
    _registrar(TipoAccion.ELIMINAR, instance)
