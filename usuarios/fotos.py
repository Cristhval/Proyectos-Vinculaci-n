"""Procesamiento y entrega de la foto de perfil."""
from io import BytesIO

from django.core import signing
from PIL import Image, ImageOps, UnidentifiedImageError

try:  # Fotos HEIC/HEIF de iPhone
	from pillow_heif import register_heif_opener
	register_heif_opener()
except ImportError:  # pragma: no cover
	pass

TAMANO_MAXIMO = 10 * 1024 * 1024  # 10 MB por archivo subido
LADO = 320                         # píxeles del avatar guardado
SAL = 'usuarios.foto'


class FotoInvalida(Exception):
	pass


def procesar(archivo):
	"""Abre cualquier imagen que Pillow soporte, la recorta al centro en cuadrado y la guarda como WebP."""
	if archivo.size > TAMANO_MAXIMO:
		raise FotoInvalida('La imagen supera los 10 MB.')
	try:
		imagen = Image.open(archivo)
		imagen.seek(0)  # GIF/WebP animados: primer cuadro
		imagen = ImageOps.exif_transpose(imagen)
	except (UnidentifiedImageError, OSError, ValueError) as error:
		raise FotoInvalida('El archivo no es una imagen válida.') from error
	if imagen.mode in ('RGBA', 'LA', 'P'):
		fondo = Image.new('RGB', imagen.size, (255, 255, 255))
		imagen = imagen.convert('RGBA')
		fondo.paste(imagen, mask=imagen.split()[-1])
		imagen = fondo
	else:
		imagen = imagen.convert('RGB')
	imagen = ImageOps.fit(imagen, (LADO, LADO), Image.Resampling.LANCZOS)
	salida = BytesIO()
	imagen.save(salida, 'WEBP', quality=85, method=4)
	return salida.getvalue()


def token(perfil):
	"""Token firmado para la URL pública de la foto (cambia al actualizarla, así se invalida la caché)."""
	version = int(perfil.foto_actualizada.timestamp()) if perfil.foto_actualizada else 0
	return signing.dumps({'id': perfil.pk, 'v': version}, salt=SAL, compress=True)


def perfil_desde_token(valor):
	try:
		return signing.loads(valor, salt=SAL)['id']
	except (signing.BadSignature, KeyError, TypeError):
		return None
