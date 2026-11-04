"""Sincroniza perfiles por auth_uid sin enlazar identidades automáticamente.

El correo y el username de un registro público no prueban la identidad de un
perfil local existente. Las vinculaciones de cuentas previas deben hacerlas
explícitamente un administrador con el comando ``vincular_cuenta``.
"""
from django.contrib.auth.models import User
from django.db import transaction

from .models import Usuario

CAMPOS_USER = ('username', 'email', 'first_name', 'last_name')


class SincronizadorUsuario:
	@classmethod
	@transaction.atomic
	def desde_claims(cls, claims, perfil_extra=None):
		sub = str(claims['sub'])
		email = (claims.get('email') or '').strip().lower()
		perfil = Usuario.objects.select_related('user').filter(auth_uid=sub).first()
		if perfil is None:
			perfil = cls._crear(sub, email, claims)
		cls._actualizar(perfil, claims, email, perfil_extra or {})
		return perfil.user

	@staticmethod
	def _crear(sub, email, claims):
		username = claims.get('username') or f'usuario{sub}'
		if User.objects.filter(username__iexact=username).exists():
			username = f'{username}-{sub}'
		user = User(username=username, email=email)
		user.set_unusable_password()
		user.save()
		return Usuario.objects.create(
			user=user, auth_uid=sub, codigo=f'USR-{sub}',
			documento_identidad=claims.get('documento_identidad') or f'PEND-{sub}',
			rol=claims.get('rol') or 'ESTUDIANTE',
		)

	@staticmethod
	def _actualizar(perfil, claims, email, perfil_extra):
		user = perfil.user
		cambios_user = []
		for campo in ('first_name', 'last_name'):
			valor = claims.get(campo) or ''
			if valor and getattr(user, campo) != valor:
				setattr(user, campo, valor)
				cambios_user.append(campo)
		if email and user.email != email:
			user.email = email
			cambios_user.append('email')
		if cambios_user:
			user.save(update_fields=cambios_user)

		cambios_perfil = []
		valores = {'rol': claims.get('rol'), **perfil_extra}
		documento = claims.get('documento_identidad')
		if documento and perfil.documento_identidad.startswith('PEND-'):
			valores['documento_identidad'] = documento
		for campo, valor in valores.items():
			if valor not in (None, '') and getattr(perfil, campo) != valor:
				setattr(perfil, campo, valor)
				cambios_perfil.append(campo)
		if cambios_perfil:
			perfil.save(update_fields=cambios_perfil)
