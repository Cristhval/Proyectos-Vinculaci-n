from django.contrib.auth.models import User
from django.db import models

from core.models import TimeStampedModel


class RolUsuario(models.TextChoices):
	ADMIN = 'ADMIN', 'Administrador'
	COORDINADOR = 'COORDINADOR', 'Coordinador'
	DOCENTE = 'DOCENTE', 'Docente'
	ESTUDIANTE = 'ESTUDIANTE', 'Estudiante'
	DIRECTIVO = 'DIRECTIVO', 'Directivo'


class Carrera(TimeStampedModel):
	codigo = models.CharField(max_length=30, unique=True)
	nombre = models.CharField(max_length=255)
	facultad = models.CharField(max_length=255)
	descripcion = models.TextField(blank=True)
	activa = models.BooleanField(default=True)

	class Meta:
		ordering = ['nombre']
		verbose_name = 'Carrera'
		verbose_name_plural = 'Carreras'

	def __str__(self):
		return f'{self.codigo} - {self.nombre}'


class Usuario(TimeStampedModel):
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
	codigo = models.CharField(max_length=30, unique=True)
	documento_identidad = models.CharField(max_length=20, unique=True, blank=True, null=True, default=None)
	carrera = models.ForeignKey(Carrera, null=True, blank=True, on_delete=models.SET_NULL, related_name='usuarios')
	rol = models.CharField(max_length=20, choices=RolUsuario.choices, default=RolUsuario.ESTUDIANTE)
	telefono = models.CharField(max_length=20, blank=True)
	direccion = models.CharField(max_length=255, blank=True)
	fecha_nacimiento = models.DateField(null=True, blank=True)
	biografia = models.TextField(blank=True)
	activo = models.BooleanField(default=True)

	class Meta:
		ordering = ['user__last_name', 'user__first_name']
		verbose_name = 'Usuario'
		verbose_name_plural = 'Usuarios'

	def __str__(self):
		nombre = self.user.get_full_name().strip()
		return f'{self.codigo} - {nombre or self.user.username}'
