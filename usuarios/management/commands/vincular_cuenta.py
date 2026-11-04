from django.core.management.base import BaseCommand, CommandError

from usuarios.models import Usuario


class Command(BaseCommand):
	help = 'Vincula explícitamente un perfil local con una cuenta de auth-service.'

	def add_arguments(self, parser):
		parser.add_argument('username_local')
		parser.add_argument('auth_uid')

	def handle(self, *args, **options):
		username = options['username_local']
		auth_uid = options['auth_uid']
		try:
			perfil = Usuario.objects.select_related('user').get(user__username=username)
		except Usuario.DoesNotExist as exc:
			raise CommandError(f'No existe un usuario local con username "{username}".') from exc

		otro = Usuario.objects.filter(auth_uid=auth_uid).exclude(pk=perfil.pk).exists()
		if otro:
			raise CommandError(f'El auth_uid "{auth_uid}" ya está vinculado a otro perfil.')
		if perfil.auth_uid and perfil.auth_uid != auth_uid:
			raise CommandError(
				f'El perfil de "{username}" ya tiene otro auth_uid: "{perfil.auth_uid}".'
			)

		perfil.auth_uid = auth_uid
		perfil.save(update_fields=['auth_uid'])
		self.stdout.write(self.style.SUCCESS(
			f'Cuenta "{username}" vinculada con auth_uid "{auth_uid}".',
		))
