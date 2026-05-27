from .models import EstadoConvenio


class ConvenioWorkflowService:

    def enviar_revision(self, convenio):
        if convenio.estado != EstadoConvenio.BORRADOR:
            raise ValueError('Solo convenios en borrador pueden enviarse a revision.')
        convenio.estado = EstadoConvenio.EN_REVISION
        convenio.save(update_fields=['estado', 'actualizado_en'])
        return convenio

    def aprobar(self, convenio):
        if convenio.estado != EstadoConvenio.EN_REVISION:
            raise ValueError('Solo convenios en revision pueden aprobarse.')
        convenio.estado = EstadoConvenio.VIGENTE
        convenio.save(update_fields=['estado', 'actualizado_en'])
        return convenio

    def rechazar(self, convenio):
        if convenio.estado != EstadoConvenio.EN_REVISION:
            raise ValueError('Solo convenios en revision pueden rechazarse.')
        convenio.estado = EstadoConvenio.BORRADOR
        convenio.save(update_fields=['estado', 'actualizado_en'])
        return convenio

    def suspender(self, convenio):
        if convenio.estado != EstadoConvenio.VIGENTE:
            raise ValueError('Solo convenios vigentes pueden suspenderse.')
        convenio.estado = EstadoConvenio.SUSPENDIDO
        convenio.save(update_fields=['estado', 'actualizado_en'])
        return convenio

    def finalizar(self, convenio):
        if convenio.estado != EstadoConvenio.VIGENTE:
            raise ValueError('Solo convenios vigentes pueden finalizarse.')
        convenio.estado = EstadoConvenio.FINALIZADO
        convenio.save(update_fields=['estado', 'actualizado_en'])
        return convenio

    def cancelar(self, convenio):
        estados_no_cancelables = (EstadoConvenio.FINALIZADO, EstadoConvenio.CANCELADO)
        if convenio.estado in estados_no_cancelables:
            raise ValueError('No se puede cancelar un convenio finalizado o ya cancelado.')
        convenio.estado = EstadoConvenio.CANCELADO
        convenio.save(update_fields=['estado', 'actualizado_en'])
        return convenio
