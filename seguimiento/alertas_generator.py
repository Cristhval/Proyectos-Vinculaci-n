import datetime
from datetime import timedelta

from django.utils import timezone

from .models import Alerta, EstadoAlerta, PrioridadAlerta


# Ventana de tiempo (en días) para evitar alertas duplicadas para el mismo
# usuario + entidad + mensaje, sin importar el estado actual.
# Antes solo se verificaba contra alertas PENDIENTE, lo que provocaba
# duplicados cuando una alerta era marcada como LEÍDA/ATENDIDA y el
# generador volvía a ejecutarse.
VENTANA_DEDUP_DIAS = 7


def generar_alerta(usuario, mensaje, detalle='', prioridad='MEDIA', proyecto=None, convenio=None,
                   fecha_vencimiento=None, enlace=''):
    """
    Crea una alerta en el sistema si no existe ya una alerta para el mismo
    usuario + mensaje + entidad en los últimos VENTANA_DEDUP_DIAS días,
    sin importar el estado actual (PENDIENTE, LEIDA, ATENDIDA, CANCELADA).
    """
    if not usuario:
        return None

    # Evitar duplicados: si ya existe una alerta para este usuario con el
    # mismo mensaje y misma entidad (proyecto y/o convenio) en los últimos
    # N días, sin importar su estado actual, no crear otra.
    fecha_limite = timezone.now() - timedelta(days=VENTANA_DEDUP_DIAS)
    filtros = {
        'usuario': usuario,
        'mensaje': mensaje,
        'creado_en__gte': fecha_limite,
    }
    if proyecto:
        filtros['proyecto'] = proyecto
    if convenio:
        filtros['convenio'] = convenio

    if Alerta.objects.filter(**filtros).exists():
        return None

    prioridad_map = {
        'BAJA': PrioridadAlerta.BAJA,
        'MEDIA': PrioridadAlerta.MEDIA,
        'ALTA': PrioridadAlerta.ALTA,
        'URGENTE': PrioridadAlerta.URGENTE,
    }
    prioridad_valor = prioridad_map.get(prioridad, PrioridadAlerta.MEDIA)

    # Normalizar fecha_vencimiento a datetime con zona horaria si es date
    if fecha_vencimiento and hasattr(fecha_vencimiento, 'year') and not hasattr(fecha_vencimiento, 'hour'):
        fecha_vencimiento = timezone.make_aware(
            datetime.datetime.combine(fecha_vencimiento, datetime.time.min)
        )

    alerta = Alerta.objects.create(
        usuario=usuario,
        proyecto=proyecto,
        convenio=convenio,
        mensaje=mensaje,
        detalle=detalle,
        prioridad=prioridad_valor,
        estado=EstadoAlerta.PENDIENTE,
        leida=False,
        fecha_vencimiento=fecha_vencimiento,
        enlace=enlace,
    )
    return alerta
