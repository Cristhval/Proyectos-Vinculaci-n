"""Espacio que ocupan en la base las imágenes de proyecto, por proyecto y en total.

Sirve para vigilar el límite del plan gratuito de Neon (0,5 GB para toda la base).
Uso: python manage.py reporte_imagenes [--top 20]
"""
from django.core.management.base import BaseCommand
from django.db.models import Count, F, Sum
from django.db.models.functions import Coalesce, Length

from proyectos.models import ImagenProyecto

LIMITE_NEON_BYTES = 512 * 1024 * 1024  # 0,5 GB
ALERTA_PORCENTAJE = 60


def legible(n):
	for unidad in ('B', 'KB', 'MB'):
		if n < 1024:
			return f'{n:.0f} {unidad}' if unidad == 'B' else f'{n:.1f} {unidad}'.replace('.', ',')
		n /= 1024
	return f'{n:.2f} GB'.replace('.', ',')


class Command(BaseCommand):
	help = 'Reporta cuánto ocupan en la base las imágenes de proyecto (por proyecto y en total).'

	def add_arguments(self, parser):
		parser.add_argument('--top', type=int, default=20, help='Cuántos proyectos listar (los que más ocupan).')

	def handle(self, *args, **opciones):
		# Length() cuenta bytes sin traer las imágenes a Python.
		peso = Coalesce(Length('contenido'), 0) + Coalesce(Length('miniatura'), 0)
		por_proyecto = (
			ImagenProyecto.objects.values('proyecto_id', codigo=F('proyecto__codigo'), titulo=F('proyecto__titulo'))
			.annotate(imagenes=Count('id'), bytes=Sum(peso))
			.order_by('-bytes')
		)
		filas = list(por_proyecto)
		total = sum(f['bytes'] or 0 for f in filas)
		cantidad = sum(f['imagenes'] for f in filas)

		self.stdout.write(f'{"Proyecto":<16} {"Imágenes":>8} {"Espacio":>10}  Título')
		for fila in filas[: opciones['top']]:
			self.stdout.write(
				f'{fila["codigo"] or fila["proyecto_id"]:<16} {fila["imagenes"]:>8} {legible(fila["bytes"] or 0):>10}  '
				f'{(fila["titulo"] or "")[:50]}'
			)
		if len(filas) > opciones['top']:
			self.stdout.write(f'… y {len(filas) - opciones["top"]} proyectos más.')

		porcentaje = total / LIMITE_NEON_BYTES * 100
		porcentaje_texto = f'{porcentaje:.2f}'.replace('.', ',')
		resumen = (
			f'Total: {cantidad} imágenes en {len(filas)} proyectos, {legible(total)} '
			f'({porcentaje_texto} % del límite de 0,5 GB de Neon; el límite es para toda la base).'
		)
		estilo = self.style.WARNING if porcentaje >= ALERTA_PORCENTAJE else self.style.SUCCESS
		self.stdout.write(estilo(resumen))
