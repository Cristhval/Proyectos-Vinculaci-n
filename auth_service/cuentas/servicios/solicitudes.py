import logging

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from cuentas.models import Cuenta, EstadoSolicitud, Rol, SolicitudAcceso, normalizar_email
from cuentas.servicios.fachada import AuthError, AuthFacade
from cuentas.servicios.notificaciones import ServicioNotificacionesSolicitud
from cuentas.servicios.verificacion import ServicioVerificacionEmail

logger = logging.getLogger(__name__)


class ServicioSolicitudes:
	ROLES_SOLICITABLES = {Rol.ESTUDIANTE, Rol.DOCENTE, Rol.COORDINADOR}

	@classmethod
	@transaction.atomic
	def crear(cls, datos, captcha_token, ip=None):
		email = normalizar_email(datos['email'])
		dominio = email.rsplit('@', 1)[-1]
		if dominio.lower() not in {d.lower() for d in settings.DOMINIOS_PERMITIDOS}:
			raise AuthError('dominio_no_permitido', 'Usa tu correo institucional @unl.edu.ec.', 400)
		if datos['rol_solicitado'] not in cls.ROLES_SOLICITABLES:
			raise AuthError('rol_no_permitido', 'El rol solicitado no está permitido.', 400)
		AuthFacade.verificar_captcha(captcha_token, ip)
		existente = Cuenta.objects.por_email(email)
		if existente:
			solicitud = getattr(existente, 'solicitud', None)
			if existente.email_verificado or not solicitud or solicitud.estado != EstadoSolicitud.PENDIENTE:
				raise AuthError('correo_registrado', 'Ese correo ya tiene una solicitud o cuenta.', 409)
			existente.delete()
		cuenta = AuthFacade.crear_cuenta(datos, rol=Rol.ESTUDIANTE)
		cuenta.email_verificado = False
		cuenta.is_active = False
		cuenta.save(update_fields=['email_verificado', 'is_active'])
		solicitud = SolicitudAcceso.objects.create(
			cuenta=cuenta,
			rol_solicitado=datos['rol_solicitado'],
			motivo=datos['motivo'].strip(),
		)
		try:
			ServicioVerificacionEmail.crear(cuenta)
		except Exception as error:
			logger.exception('No se pudo enviar el código de verificación durante la solicitud de acceso')
			raise AuthError(
				'correo_no_enviado',
				'No pudimos enviar el código de verificación. Inténtalo de nuevo en unos minutos.',
				503,
			) from error
		return cuenta, solicitud

	@classmethod
	@transaction.atomic
	def aprobar(cls, solicitud, admin, rol):
		if solicitud.estado != EstadoSolicitud.PENDIENTE or not solicitud.cuenta.email_verificado:
			raise AuthError('solicitud_no_pendiente', 'La solicitud no está pendiente o el correo no está verificado.', 409)
		solicitud.estado = EstadoSolicitud.APROBADA
		solicitud.rol_asignado = rol
		solicitud.revisada_por = admin
		solicitud.revisada = timezone.now()
		solicitud.save(update_fields=['estado', 'rol_asignado', 'revisada_por', 'revisada'])
		cuenta = solicitud.cuenta
		cuenta.rol = rol
		cuenta.is_active = True
		cuenta.save(update_fields=['rol', 'is_active'])
		ServicioNotificacionesSolicitud.notificar_resuelta(solicitud)
		return solicitud

	@classmethod
	@transaction.atomic
	def rechazar(cls, solicitud, admin, motivo):
		if solicitud.estado != EstadoSolicitud.PENDIENTE or not solicitud.cuenta.email_verificado:
			raise AuthError('solicitud_no_pendiente', 'La solicitud no está pendiente o el correo no está verificado.', 409)
		solicitud.estado = EstadoSolicitud.RECHAZADA
		solicitud.motivo_rechazo = motivo.strip()
		solicitud.revisada_por = admin
		solicitud.revisada = timezone.now()
		solicitud.save(update_fields=['estado', 'motivo_rechazo', 'revisada_por', 'revisada'])
		ServicioNotificacionesSolicitud.notificar_resuelta(solicitud)
		return solicitud
