import logging

from django.conf import settings
from django.core import signing
from django.db import transaction
from django.utils import timezone

from cuentas.models import Cuenta, EstadoSolicitud, IdentidadSocial, Rol, SolicitudAcceso, normalizar_email
from cuentas.servicios.fachada import AuthError, AuthFacade
from cuentas.servicios.notificaciones import ServicioNotificacionesSolicitud
from cuentas.servicios.tareas import en_segundo_plano
from cuentas.servicios.verificacion import ServicioVerificacionEmail

logger = logging.getLogger(__name__)


def dominio_permitido(email):
	return normalizar_email(email).rsplit('@', 1)[-1] in {d.lower() for d in settings.DOMINIOS_PERMITIDOS}


class ServicioSolicitudes:
	ROLES_SOLICITABLES = {Rol.ESTUDIANTE, Rol.DOCENTE, Rol.COORDINADOR}
	SAL_REGISTRO_SOCIAL = 'cuentas.registro-social'
	VIGENCIA_REGISTRO_SOCIAL = 15 * 60  # segundos

	# --- Solicitud con identidad social (Google/GitHub) ------------------------
	# El proveedor ya verificó el correo; aquí solo se pide el rol. La cuenta nace inactiva
	# y el administrador decide, igual que en el formulario normal.

	@classmethod
	def puede_registrarse_social(cls, identidad):
		return bool(
			identidad.email and identidad.email_verificado and dominio_permitido(identidad.email)
			and not Cuenta.objects.por_email(identidad.email)
		)

	@classmethod
	def pase_registro_social(cls, proveedor, identidad):
		"""Firma la identidad verificada para completar la solicitud en el frontend (15 min)."""
		return signing.dumps(
			{'p': proveedor, 'uid': identidad.uid, 'email': normalizar_email(identidad.email), 'nombre': identidad.nombre or ''},
			salt=cls.SAL_REGISTRO_SOCIAL, compress=True,
		)

	@classmethod
	def leer_pase_social(cls, pase):
		try:
			return signing.loads(pase, salt=cls.SAL_REGISTRO_SOCIAL, max_age=cls.VIGENCIA_REGISTRO_SOCIAL)
		except signing.BadSignature as error:
			raise AuthError('pase_invalido', 'El tiempo para completar la solicitud terminó. Vuelve a continuar con Google.', 400) from error

	@staticmethod
	def _dividir_nombre(nombre):
		partes = nombre.split()
		corte = 2 if len(partes) >= 4 else 1
		return ' '.join(partes[:corte])[:150], ' '.join(partes[corte:])[:150]

	@classmethod
	@transaction.atomic
	def crear_desde_social(cls, pase, rol_solicitado, motivo=''):
		datos = cls.leer_pase_social(pase)
		if rol_solicitado not in cls.ROLES_SOLICITABLES:
			raise AuthError('rol_no_permitido', 'El rol solicitado no está permitido.', 400)
		if not dominio_permitido(datos['email']):
			raise AuthError('dominio_no_permitido', 'Usa tu correo institucional @unl.edu.ec.', 400)
		# Una solicitud antigua sin verificar con ese correo se reemplaza; una cuenta real, no.
		AuthFacade._liberar_solicitudes_abandonadas({'email': datos['email']})
		if Cuenta.objects.por_email(datos['email']) or IdentidadSocial.objects.filter(proveedor=datos['p'], uid_externo=datos['uid']).exists():
			raise AuthError('correo_registrado', 'Ese correo ya tiene una solicitud o cuenta.', 409)
		nombres, apellidos = cls._dividir_nombre(datos['nombre'])
		cuenta = Cuenta.objects.create_user(
			username=AuthFacade.username_desde_email(datos['email']), email=datos['email'], password=None,
			rol=Rol.ESTUDIANTE, first_name=nombres, last_name=apellidos,
		)
		cuenta.is_active = False
		cuenta.email_verificado = True
		cuenta.save(update_fields=['is_active', 'email_verificado'])
		IdentidadSocial.objects.create(cuenta=cuenta, proveedor=datos['p'], uid_externo=datos['uid'])
		solicitud = SolicitudAcceso.objects.create(cuenta=cuenta, rol_solicitado=rol_solicitado, motivo=(motivo or '').strip())
		en_segundo_plano(ServicioNotificacionesSolicitud.notificar_creada, solicitud)
		return solicitud

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
		en_segundo_plano(ServicioNotificacionesSolicitud.notificar_resuelta, solicitud)
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
		en_segundo_plano(ServicioNotificacionesSolicitud.notificar_resuelta, solicitud)
		return solicitud
