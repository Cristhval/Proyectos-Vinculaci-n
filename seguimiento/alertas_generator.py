import datetime
from decimal import Decimal
from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone

from .models import Alerta, Avance, EstadoAlerta, EstadoAvance, PrioridadAlerta


def recalcular_horas_cumplidas(participante):
    """
    Suma las horas_invertidas de los Avances APROBADOS cuyas actividades
    tienen al participante como responsable dentro del mismo proyecto,
    y persiste el resultado en ``ParticipanteProyecto.horas_cumplidas``.

    Debe invocarse cada vez que cambia el estado de un Avance o cuando
    se editan sus horas, para mantener sincronizado el campo cacheado
    que consume el frontend y el admin.

    Retorna el total calculado (Decimal) o None si ``participante`` es None.
    """
    if participante is None:
        return None

    total = Avance.objects.filter(
        actividad__proyecto=participante.proyecto,
        actividad__responsable=participante.usuario,
        estado=EstadoAvance.APROBADO,
    ).aggregate(total=Sum('horas_invertidas'))['total'] or Decimal('0')

    if participante.horas_cumplidas != total:
        participante.horas_cumplidas = total
        participante.save(update_fields=['horas_cumplidas', 'actualizado_en'])
    return total


# Ventana de tiempo (en días) para evitar alertas duplicadas para el mismo
# usuario + entidad + mensaje, sin importar el estado actual.
# Antes solo se verificaba contra alertas PENDIENTE, lo que provocaba
# duplicados cuando una alerta era marcada como LEÍDA/ATENDIDA y el
# generador volvía a ejecutarse.
VENTANA_DEDUP_DIAS = 7


def generar_alerta(usuario, mensaje, detalle='', prioridad='MEDIA', proyecto=None, convenio=None,
                   fecha_vencimiento=None, enlace='', force=False):
    """
    Crea una alerta en el sistema si no existe ya una alerta para el mismo
    usuario + mensaje + entidad en los últimos VENTANA_DEDUP_DIAS días,
    sin importar el estado actual (PENDIENTE, LEIDA, ATENDIDA, CANCELADA).

    El parámetro ``force=True`` omite la verificación de duplicados y siempre
    crea la alerta. Está pensado para eventos de workflow explícitos
    (enviar a revisión, aprobar, rechazar) donde cada ocurrencia debe
    notificar, incluso si el mismo mensaje se generó hace pocos días.
    """
    if not usuario:
        return None

    if not force:
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
