from django import template
from django.conf import settings

register = template.Library()


@register.simple_tag
def recurso_correo(nombre):
	"""URL pública de una imagen de correo, servida por el frontend en /correo/."""
	return f"{settings.FRONTEND_URL.rstrip('/')}/correo/{nombre}"
