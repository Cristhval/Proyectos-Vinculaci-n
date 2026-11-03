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
