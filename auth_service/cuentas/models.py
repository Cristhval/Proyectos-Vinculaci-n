from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models


class Rol(models.TextChoices):
	ADMIN = 'ADMIN', 'Administrador'
	COORDINADOR = 'COORDINADOR', 'Coordinador'
	DOCENTE = 'DOCENTE', 'Docente'
	ESTUDIANTE = 'ESTUDIANTE', 'Estudiante'
	DIRECTIVO = 'DIRECTIVO', 'Directivo'


def normalizar_email(email):
	return (email or '').strip().lower()


class CuentaManager(UserManager):
	def create_user(self, username, email=None, password=None, **extra):
		return super().create_user(username, normalizar_email(email), password, **extra)

	def create_superuser(self, username, email=None, password=None, **extra):
		extra.setdefault('rol', Rol.ADMIN)
		return super().create_superuser(username, normalizar_email(email), password, **extra)

	def por_email(self, email):
		return self.filter(email__iexact=normalizar_email(email)).first()


class Cuenta(AbstractUser):
	"""Identidad de acceso. Es la única fuente de verdad del rol del usuario."""
	email = models.EmailField('correo', unique=True)
	email_verificado = models.BooleanField(default=True)
	rol = models.CharField(max_length=20, choices=Rol.choices, default=Rol.ESTUDIANTE)
	documento_identidad = models.CharField(max_length=20, null=True, blank=True, unique=True)

	objects = CuentaManager()

	REQUIRED_FIELDS = ['email']

	class Meta:
		ordering = ['last_name', 'first_name', 'username']
		verbose_name = 'Cuenta'
		verbose_name_plural = 'Cuentas'

	def save(self, *args, **kwargs):
		self.email = normalizar_email(self.email)
		if not self.documento_identidad:
			self.documento_identidad = None
		super().save(*args, **kwargs)

	def __str__(self):
		return f'{self.username} ({self.get_rol_display()})'


class EstadoSolicitud(models.TextChoices):
	PENDIENTE = 'PENDIENTE', 'Pendiente'
	APROBADA = 'APROBADA', 'Aprobada'
	RECHAZADA = 'RECHAZADA', 'Rechazada'


class SolicitudAcceso(models.Model):
	cuenta = models.OneToOneField(Cuenta, on_delete=models.CASCADE, related_name='solicitud')
	rol_solicitado = models.CharField(max_length=20, choices=Rol.choices)
	motivo = models.TextField()
	estado = models.CharField(max_length=20, choices=EstadoSolicitud.choices, default=EstadoSolicitud.PENDIENTE)
	rol_asignado = models.CharField(max_length=20, choices=Rol.choices, null=True, blank=True)
	motivo_rechazo = models.TextField(blank=True)
	revisada_por = models.ForeignKey(
		Cuenta, null=True, blank=True, on_delete=models.SET_NULL, related_name='solicitudes_revisadas',
	)
	creada = models.DateTimeField(auto_now_add=True)
	revisada = models.DateTimeField(null=True, blank=True)

	class Meta:
		ordering = ['-creada']
		verbose_name = 'Solicitud de acceso'
		verbose_name_plural = 'Solicitudes de acceso'


class MetodoAcceso(models.TextChoices):
	PASSWORD = 'password', 'Contraseña'
	GOOGLE = 'google', 'Google'
	GITHUB = 'github', 'GitHub'
	FACEBOOK = 'facebook', 'Facebook'
	RECUPERACION = 'recuperacion', 'Recuperación de contraseña'


class RegistroAcceso(models.Model):
	"""Auditoría de intentos de acceso, exitosos y fallidos."""
	cuenta = models.ForeignKey(Cuenta, null=True, blank=True, on_delete=models.SET_NULL, related_name='accesos')
	identificador = models.CharField(max_length=150, blank=True)
	metodo = models.CharField(max_length=20, choices=MetodoAcceso.choices)
	exito = models.BooleanField(default=False)
	ip = models.GenericIPAddressField(null=True, blank=True)
	fecha = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-fecha']
		verbose_name = 'Registro de acceso'
		verbose_name_plural = 'Registros de acceso'

	def __str__(self):
		estado = 'OK' if self.exito else 'FALLO'
		return f'{self.fecha:%Y-%m-%d %H:%M} {self.metodo} {self.identificador} {estado}'


class ProveedorSocial(models.TextChoices):
	GOOGLE = 'google', 'Google'
	GITHUB = 'github', 'GitHub'
	FACEBOOK = 'facebook', 'Facebook'


class IdentidadSocial(models.Model):
	"""Vínculo entre una cuenta y su identidad en un proveedor externo."""
	cuenta = models.ForeignKey(Cuenta, on_delete=models.CASCADE, related_name='identidades')
	proveedor = models.CharField(max_length=20, choices=ProveedorSocial.choices)
	uid_externo = models.CharField(max_length=255)
	vinculada = models.DateTimeField(auto_now_add=True)

	class Meta:
		unique_together = ('proveedor', 'uid_externo')
		verbose_name = 'Identidad social'
		verbose_name_plural = 'Identidades sociales'

	def __str__(self):
		return f'{self.cuenta.username} · {self.get_proveedor_display()}'


class CodigoIntercambio(models.Model):
	"""Código de un solo uso para entregar los tokens al frontend tras el login social."""
	codigo = models.CharField(max_length=64, unique=True)
	cuenta = models.ForeignKey(Cuenta, on_delete=models.CASCADE)
	expira = models.DateTimeField()
	usado = models.BooleanField(default=False)


class CodigoVerificacion(models.Model):
	"""Código temporal almacenado como hash para confirmar un correo."""
	cuenta = models.ForeignKey(Cuenta, on_delete=models.CASCADE, related_name='codigos_verificacion')
	codigo_hash = models.CharField(max_length=128)
	expira = models.DateTimeField()
	intentos = models.PositiveSmallIntegerField(default=0)
	usado = models.BooleanField(default=False)
	creado = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-creado']
