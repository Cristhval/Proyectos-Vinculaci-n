from django.db import transaction
from django.utils import timezone

from .models import EstadoIndicador, EstadoProyecto, Proyecto


class ProyectoWorkflowService:

    def generar_codigo(self, proyecto):
        if not proyecto.codigo:
            proyecto.codigo = f'PRJ-{proyecto.id:05d}'
            proyecto.save(update_fields=['codigo'])

    def enviar_revision(self, proyecto):
        if proyecto.estado != EstadoProyecto.BORRADOR:
            raise ValueError('Solo proyectos en borrador pueden enviarse a revision.')
        proyecto.estado = EstadoProyecto.EN_REVISION
        proyecto.save(update_fields=['estado', 'actualizado_en'])
        return proyecto

    def aprobar(self, proyecto):
        if proyecto.estado not in (EstadoProyecto.EN_REVISION, EstadoProyecto.EN_SUSPENSION):
            raise ValueError('Solo proyectos en revision o suspension pueden aprobarse.')
        proyecto.estado = EstadoProyecto.APROBADO
        proyecto.save(update_fields=['estado', 'actualizado_en'])
        return proyecto

    def rechazar(self, proyecto):
        if proyecto.estado != EstadoProyecto.EN_REVISION:
            raise ValueError('Solo proyectos en revision pueden rechazarse.')
        proyecto.estado = EstadoProyecto.BORRADOR
        proyecto.save(update_fields=['estado', 'actualizado_en'])
        return proyecto

    def suspender(self, proyecto):
        if proyecto.estado != EstadoProyecto.EN_EJECUCION:
            raise ValueError('Solo proyectos en ejecucion pueden suspenderse.')
        proyecto.estado = EstadoProyecto.EN_SUSPENSION
        proyecto.save(update_fields=['estado', 'actualizado_en'])
        return proyecto

    def reanudar(self, proyecto):
        if proyecto.estado != EstadoProyecto.EN_SUSPENSION:
            raise ValueError('Solo proyectos en suspension pueden reanudarse.')
        proyecto.estado = EstadoProyecto.EN_EJECUCION
        proyecto.save(update_fields=['estado', 'actualizado_en'])
        return proyecto

    def iniciar_ejecucion(self, proyecto):
        if proyecto.estado != EstadoProyecto.APROBADO:
            raise ValueError('Solo proyectos aprobados pueden iniciar ejecucion.')
        proyecto.estado = EstadoProyecto.EN_EJECUCION
        proyecto.save(update_fields=['estado', 'actualizado_en'])
        return proyecto

    def finalizar(self, proyecto):
        if proyecto.estado != EstadoProyecto.EN_EJECUCION:
            raise ValueError('Solo proyectos en ejecucion pueden finalizarse.')
        proyecto.estado = EstadoProyecto.FINALIZADO
        proyecto.fecha_fin_real = timezone.now().date()
        proyecto.save(update_fields=['estado', 'fecha_fin_real', 'actualizado_en'])
        return proyecto

    def cerrar(self, proyecto):
        if proyecto.estado != EstadoProyecto.FINALIZADO:
            raise ValueError('Solo proyectos finalizados pueden cerrarse.')
        proyecto.estado = EstadoProyecto.CERRADO
        proyecto.save(update_fields=['estado', 'actualizado_en'])
        return proyecto

    def cancelar(self, proyecto):
        estados_no_cancelables = (EstadoProyecto.CERRADO, EstadoProyecto.CANCELADO)
        if proyecto.estado in estados_no_cancelables:
            raise ValueError('No se puede cancelar un proyecto cerrado o ya cancelado.')
        proyecto.estado = EstadoProyecto.CANCELADO
        proyecto.save(update_fields=['estado', 'actualizado_en'])
        return proyecto


class IndicadorMedicionService:

    def medir(self, indicador, valor):
        indicador.valor_actual = valor
        indicador.fecha_medicion = timezone.now().date()
        if indicador.valor_actual >= indicador.meta and indicador.meta > 0:
            indicador.estado = EstadoIndicador.CUMPLIDO
        indicador.save()
        return indicador


class ProyectoMonitoreoService:
    """Service Layer para el monitoreo ambiental (HU-18).

    Concentra la regla de negocio del campo ``monitoreo_activo``:
    - solo se activa en proyectos APROBADO o EN_EJECUCION;
    - desactivar se permite en cualquier estado y no borra dispositivos ni mediciones;
    - cada cambio real emite la señal ``monitoreo_cambiado`` (Observer), a la que
      se suscriben la auditoría y las notificaciones.
    Los permisos (responsable, coordinador o admin) los valida la vista con
    ``core.permissions.puede_gestionar_proyecto``.
    """

    ESTADOS_ACTIVABLES = (EstadoProyecto.APROBADO, EstadoProyecto.EN_EJECUCION)

    def cambiar(self, proyecto, activo, usuario=None, request=None):
        from .signals import monitoreo_cambiado

        anterior = proyecto.monitoreo_activo
        if anterior == activo:
            return proyecto
        if activo and proyecto.estado not in self.ESTADOS_ACTIVABLES:
            raise ValueError(
                'El monitoreo ambiental solo puede activarse en proyectos aprobados o en ejecución.'
            )
        # update() en vez de save(): un solo UPDATE y sin el registro genérico
        # ACTUALIZAR; la auditoría específica la genera la señal.
        ahora = timezone.now()
        Proyecto.objects.filter(pk=proyecto.pk).update(monitoreo_activo=activo, actualizado_en=ahora)
        proyecto.monitoreo_activo = activo
        proyecto.actualizado_en = ahora
        monitoreo_cambiado.send(
            sender=Proyecto, proyecto=proyecto, anterior=anterior, nuevo=activo,
            usuario=usuario, request=request,
        )
        return proyecto
