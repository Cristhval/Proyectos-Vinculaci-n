"""Mantiene la copia local (User + Usuario) alineada con la cuenta de auth-service."""
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q

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
			perfil = cls._enlazar_existente(sub, email, claims.get('username', ''))
		if perfil is None:
			perfil = cls._crear(sub, email, claims)
		cls._actualizar(perfil, claims, email, perfil_extra or {})
		return perfil.user

	@staticmethod
	def _enlazar_existente(sub, email, username):
		filtro = Q(user__email__iexact=email) if email else Q()
		if username:
			filtro |= Q(user__username__iexact=username)
		if not filtro:
			return None
		perfil = Usuario.objects.select_related('user').filter(filtro, auth_uid__isnull=True).first()
		if perfil:
			perfil.auth_uid = sub
			perfil.save(update_fields=['auth_uid'])
		return perfil

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
