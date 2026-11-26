"""Imágenes del proyecto (portada y galería) guardadas en la base, como la foto de perfil.

Render no tiene disco persistente: lo que se escribe en media/ se pierde en cada reinicio.
Por eso cada imagen se convierte a WebP y se guarda en ImagenProyecto (BinaryField), con
límites de tamaño pensados para el plan gratuito de Neon (0,5 GB en total).

Patrones:
- Strategy: PerfilCompresion describe cómo comprimir (lado, calidad, límite) y
  CompresorWebP aplica cualquier perfil; la imagen completa y la miniatura son dos perfiles.
- Proxy: los <img> no pueden enviar el JWT, así que la vista `imagen_publica` sirve los bytes
  solo con una URL firmada que expira. La URL se emite únicamente a quien ya puede ver el
  proyecto (los querysets filtran por rol).
"""
import time
from dataclasses import dataclass
from io import BytesIO

from django.core import signing
from django.urls import reverse
from PIL import Image

from usuarios.fotos import TAMANO_MAXIMO, FotoInvalida, abrir_rgb

MAXIMO_POR_PROYECTO = 10
SAL = 'proyectos.imagen'
# La URL vale entre 12 y 24 h. Se redondea a bloques de 12 h para que la misma imagen
# conserve la misma URL durante el bloque y el navegador la pueda guardar en caché.
BLOQUE_SEGUNDOS = 12 * 60 * 60
EXTENSIONES_IMAGEN = ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif')


class ImagenInvalida(FotoInvalida):
	pass


@dataclass(frozen=True)
class PerfilCompresion:
	lado_maximo: int
	calidad: int
	limite_bytes: int
	calidad_minima: int = 40


COMPLETA = PerfilCompresion(lado_maximo=1600, calidad=80, limite_bytes=300 * 1024)
MINIATURA = PerfilCompresion(lado_maximo=480, calidad=72, limite_bytes=40 * 1024, calidad_minima=30)


@dataclass(frozen=True)
class ImagenProcesada:
	contenido: bytes
	miniatura: bytes
	ancho: int
	alto: int


class CompresorWebP:
	"""Baja la calidad y, si no alcanza, reduce el tamaño, hasta quedar bajo el límite del perfil.

	En vez de bajar de a poco (lento en imágenes con mucho detalle) estima la escala: el peso
	de un WebP crece casi en proporción al número de píxeles.
	"""

	REBAJA_CALIDAD = 20
	MARGEN = 0.9
	INTENTOS = 5

	def comprimir(self, imagen, perfil):
		imagen = self._ajustar(imagen, perfil.lado_maximo)
		datos = self._webp(imagen, perfil.calidad)
		if len(datos) <= perfil.limite_bytes:
			return imagen, datos
		calidad = max(perfil.calidad_minima, perfil.calidad - self.REBAJA_CALIDAD)
		datos = self._webp(imagen, calidad)
		for _ in range(self.INTENTOS):
			if len(datos) <= perfil.limite_bytes:
				break
			escala = (perfil.limite_bytes / len(datos)) ** 0.5 * self.MARGEN
			imagen = self._ajustar(imagen, max(64, int(max(imagen.size) * escala)))
			datos = self._webp(imagen, calidad)
		return imagen, datos

	@staticmethod
	def _ajustar(imagen, lado):
		if max(imagen.size) <= lado:
			return imagen
		copia = imagen.copy()
		copia.thumbnail((lado, lado), Image.Resampling.LANCZOS)
		return copia

	@staticmethod
	def _webp(imagen, calidad):
		salida = BytesIO()
		imagen.save(salida, 'WEBP', quality=calidad, method=4)
		return salida.getvalue()


def es_imagen(archivo):
	"""Decide por el tipo MIME o la extensión; los documentos siguen guardándose en disco."""
	tipo = (getattr(archivo, 'content_type', '') or '').lower()
	nombre = (getattr(archivo, 'name', '') or '').lower()
	return tipo.startswith('image/') or nombre.endswith(EXTENSIONES_IMAGEN)


def procesar(archivo, compresor=None):
	if archivo.size > TAMANO_MAXIMO:
		raise ImagenInvalida('La imagen supera los 10 MB.')
	try:
		imagen = abrir_rgb(archivo)
	except FotoInvalida as error:
		raise ImagenInvalida(str(error)) from error
	compresor = compresor or CompresorWebP()
	completa, contenido = compresor.comprimir(imagen, COMPLETA)
	_, miniatura = compresor.comprimir(completa, MINIATURA)
	return ImagenProcesada(contenido=contenido, miniatura=miniatura, ancho=completa.width, alto=completa.height)


def url_firmada(request, imagen_id, variante='completa'):
	"""variante: 'completa' o 'miniatura'."""
	vence = (int(time.time()) // BLOQUE_SEGUNDOS + 2) * BLOQUE_SEGUNDOS
	token = signing.Signer(salt=SAL).sign_object({'id': imagen_id, 'v': variante[0], 'e': vence}, compress=True)
	ruta = reverse('imagen_proyecto', args=[token])
	return request.build_absolute_uri(ruta) if request else ruta


def leer_token(token):
	"""Devuelve (id, 'completa'|'miniatura') o None si la firma no vale o ya venció."""
	try:
		datos = signing.Signer(salt=SAL).unsign_object(token)
		if int(datos['e']) < time.time():
			return None
		return int(datos['id']), 'miniatura' if datos['v'] == 'm' else 'completa'
	except (signing.BadSignature, KeyError, TypeError, ValueError):
		return None


class ServicioImagenesProyecto:
	"""Reglas de guardado: cupo de MAXIMO_POR_PROYECTO (portada incluida) y una sola portada."""

	CAMPOS_PESADOS = ('contenido', 'miniatura')

	@staticmethod
	def _modelo():
		from .models import ImagenProyecto
		return ImagenProyecto

	def validar_cupo(self, proyecto, *, reemplaza_portada=False, reemplaza_anexo=None):
		"""Lanza ImagenInvalida si agregar una imagen supera el máximo del proyecto."""
		if proyecto is None or proyecto.pk is None:
			return
		existentes = self._modelo().objects.filter(proyecto=proyecto)
		if reemplaza_portada:
			existentes = existentes.exclude(es_portada=True)
		if reemplaza_anexo is not None:
			existentes = existentes.exclude(anexo=reemplaza_anexo)
		if existentes.count() >= MAXIMO_POR_PROYECTO:
			raise ImagenInvalida(
				f'El proyecto ya tiene {MAXIMO_POR_PROYECTO} imágenes, el máximo permitido. Quita alguna antes de subir otra.'
			)

	def guardar_portada(self, proyecto, procesada, nombre=''):
		modelo = self._modelo()
		modelo.objects.filter(proyecto=proyecto, es_portada=True).delete()
		return modelo.objects.create(proyecto=proyecto, es_portada=True, nombre=nombre, **self._campos(procesada))

	def quitar_portada(self, proyecto):
		self._modelo().objects.filter(proyecto=proyecto, es_portada=True).delete()

	def guardar_de_anexo(self, anexo, procesada):
		modelo = self._modelo()
		modelo.objects.filter(anexo=anexo).delete()
		return modelo.objects.create(proyecto=anexo.proyecto, anexo=anexo, nombre=anexo.nombre, **self._campos(procesada))

	@staticmethod
	def _campos(procesada):
		return {
			'contenido': procesada.contenido, 'miniatura': procesada.miniatura,
			'ancho': procesada.ancho, 'alto': procesada.alto,
		}

	@staticmethod
	def describir(imagen, request):
		"""Datos públicos de una imagen (sin bytes) para la galería."""
		return {
			'id': imagen.pk,
			'nombre': imagen.nombre,
			'es_portada': imagen.es_portada,
			'anexo': imagen.anexo_id,
			'url': url_firmada(request, imagen.pk, 'completa'),
			'miniatura': url_firmada(request, imagen.pk, 'miniatura'),
			'ancho': imagen.ancho,
			'alto': imagen.alto,
		}
