from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from cuentas.models import Cuenta, EstadoSolicitud


class Command(BaseCommand):
	help = 'Elimina solicitudes pendientes no verificadas con más de 24 horas.'

	def handle(self, *args, **options):
		limite = timezone.now() - timedelta(hours=24)
		cuentas = Cuenta.objects.filter(
			solicitud__estado=EstadoSolicitud.PENDIENTE,
			email_verificado=False,
			solicitud__creada__lt=limite,
		)
		total = cuentas.count()
		cuentas.delete()
		self.stdout.write(self.style.SUCCESS(f'Se eliminaron {total} solicitud(es) no verificadas.'))
