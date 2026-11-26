"""Imágenes del proyecto en la base: subir, consultar, límites y acceso según el rol."""
import io
import os
import shutil
import tempfile
from pathlib import Path
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import override_settings
from PIL import Image
from rest_framework.test import APITestCase

from proyectos import imagenes
from proyectos.models import Anexo, ImagenProyecto, ParticipanteProyecto, Proyecto
from proyectos.tests_monitoreo import crear_perfil
from usuarios.tests_utils import SIMPLE_JWT_TEST, token_para


def jpg(nombre='foto.jpg', tamano=(64, 48), ruido=False):
	if ruido:
		imagen = Image.frombytes('RGB', tamano, os.urandom(tamano[0] * tamano[1] * 3))
	else:
		imagen = Image.new('RGB', tamano, (200, 80, 40))
	salida = io.BytesIO()
	imagen.save(salida, 'JPEG', quality=92)
	return SimpleUploadedFile(nombre, salida.getvalue(), content_type='image/jpeg')


def pdf(nombre='acta.pdf'):
	return SimpleUploadedFile(nombre, b'%PDF-1.4 prueba', content_type='application/pdf')


def ruta(url):
	"""Las URLs vienen absolutas (http://testserver/...); el cliente de pruebas usa la ruta."""
	return url.replace('http://testserver', '')


@override_settings(SIMPLE_JWT=SIMPLE_JWT_TEST, DEBUG=False)
class ImagenesProyectoTests(APITestCase):
	def setUp(self):
		# Carpeta media propia por prueba, para comprobar qué se escribe en disco.
		self.media = tempfile.mkdtemp()
		self.addCleanup(shutil.rmtree, self.media, ignore_errors=True)
		ajuste = self.settings(MEDIA_ROOT=self.media)
		ajuste.enable()
		self.addCleanup(ajuste.disable)
		self.docente = crear_perfil('docente', 'DOCENTE')
		self.otro_docente = crear_perfil('otrodoc', 'DOCENTE')
		self.estudiante = crear_perfil('est', 'ESTUDIANTE')
		self.estudiante_ajeno = crear_perfil('estajeno', 'ESTUDIANTE')
		self.coordinador = crear_perfil('coord', 'COORDINADOR')
		self.proyecto = Proyecto.objects.create(codigo='PV-2026-20', titulo='Huertos', responsable=self.docente)
		ParticipanteProyecto.objects.create(proyecto=self.proyecto, usuario=self.estudiante)

	def _como(self, perfil):
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_para(perfil)}')

	def _subir_anexo(self, archivo, proyecto=None):
		datos = {'proyecto': (proyecto or self.proyecto).pk, 'nombre': archivo.name, 'archivo': archivo, 'tipo': 'OTRO'}
		return self.client.post('/api/v1/anexos/', datos, format='multipart')

	def _detalle(self, perfil):
		self._como(perfil)
		return self.client.get(f'/api/v1/proyectos/{self.proyecto.pk}/')

	def _archivos_en_disco(self):
		return [p for p in Path(self.media).rglob('*') if p.is_file()]

	# Subir

	def test_portada_al_crear_se_guarda_en_la_base_y_no_en_disco(self):
		self._como(self.docente)
		respuesta = self.client.post('/api/v1/proyectos/', {
			'titulo': 'Agua segura', 'tipo': 'VINCULACION', 'estado': 'BORRADOR',
			'responsable_id': self.docente.pk, 'imagen_portada': jpg('portada.jpg'),
		}, format='multipart')
		self.assertEqual(respuesta.status_code, 201, respuesta.data)
		proyecto = Proyecto.objects.get(pk=respuesta.data['id'])
		self.assertFalse(proyecto.imagen_portada)
		portada = ImagenProyecto.objects.get(proyecto=proyecto, es_portada=True)
		self.assertEqual(portada.nombre, 'portada.jpg')
		self.assertEqual(self._archivos_en_disco(), [])
		self.assertIn('/api/v1/proyectos/imagenes/', respuesta.data['imagen_portada'])

	def test_anexo_imagen_va_a_la_base_y_documento_sigue_en_disco(self):
		self._como(self.docente)
		imagen = self._subir_anexo(jpg('evidencia.jpg'))
		documento = self._subir_anexo(pdf())
		self.assertEqual(imagen.status_code, 201, imagen.data)
		self.assertEqual(documento.status_code, 201, documento.data)
		self.assertTrue(imagen.data['es_imagen'])
		self.assertIn('/api/v1/proyectos/imagenes/', imagen.data['archivo'])
		self.assertIn('/api/v1/proyectos/imagenes/', imagen.data['miniatura'])
		self.assertFalse(documento.data['es_imagen'])
		self.assertIsNone(documento.data['miniatura'])
		self.assertIn('/media/proyectos/anexos/', documento.data['archivo'])
		self.assertEqual([p.name for p in self._archivos_en_disco()], ['acta.pdf'])

	def test_imagen_grande_queda_bajo_los_limites(self):
		procesada = imagenes.procesar(jpg('grande.jpg', tamano=(2400, 1800), ruido=True))
		self.assertLessEqual(len(procesada.contenido), imagenes.COMPLETA.limite_bytes)
		self.assertLessEqual(len(procesada.miniatura), imagenes.MINIATURA.limite_bytes)
		self.assertLessEqual(max(procesada.ancho, procesada.alto), 1600)
		self.assertEqual(Image.open(io.BytesIO(procesada.contenido)).format, 'WEBP')

	def test_archivo_que_no_es_imagen_se_rechaza(self):
		self._como(self.docente)
		falsa = SimpleUploadedFile('falsa.jpg', b'no soy una imagen', content_type='image/jpeg')
		respuesta = self._subir_anexo(falsa)
		self.assertEqual(respuesta.status_code, 400)
		self.assertIn('archivo', respuesta.data)
		self.assertFalse(Anexo.objects.exists())

	def test_maximo_diez_imagenes_por_proyecto_contando_la_portada(self):
		self._como(self.docente)
		portada = self.client.patch(f'/api/v1/proyectos/{self.proyecto.pk}/', {'imagen_portada': jpg()}, format='multipart')
		self.assertEqual(portada.status_code, 200, portada.data)
		for i in range(imagenes.MAXIMO_POR_PROYECTO - 1):
			self.assertEqual(self._subir_anexo(jpg(f'f{i}.jpg')).status_code, 201)
		exceso = self._subir_anexo(jpg('once.jpg'))
		self.assertEqual(exceso.status_code, 400)
		self.assertIn('máximo', str(exceso.data['archivo']))
		self.assertEqual(ImagenProyecto.objects.filter(proyecto=self.proyecto).count(), 10)
		# Reemplazar la portada no suma una imagen más.
		reemplazo = self.client.patch(f'/api/v1/proyectos/{self.proyecto.pk}/', {'imagen_portada': jpg('nueva.jpg')}, format='multipart')
		self.assertEqual(reemplazo.status_code, 200, reemplazo.data)
		# Los documentos no cuentan.
		self.assertEqual(self._subir_anexo(pdf()).status_code, 201)

	def test_quitar_portada_y_editar_sin_imagen_conserva_la_galeria(self):
		self._como(self.docente)
		self.client.patch(f'/api/v1/proyectos/{self.proyecto.pk}/', {'imagen_portada': jpg()}, format='multipart')
		self._subir_anexo(jpg('galeria.jpg'))
		self.client.patch(f'/api/v1/proyectos/{self.proyecto.pk}/', {'titulo': 'Huertos 2'}, format='multipart')
		self.assertEqual(ImagenProyecto.objects.filter(proyecto=self.proyecto).count(), 2)
		self.client.patch(f'/api/v1/proyectos/{self.proyecto.pk}/', {'clear_imagen_portada': 'true'}, format='multipart')
		self.assertFalse(ImagenProyecto.objects.filter(proyecto=self.proyecto, es_portada=True).exists())
		self.assertEqual(ImagenProyecto.objects.filter(proyecto=self.proyecto).count(), 1)

	# Consultar

	def test_detalle_devuelve_galeria_y_la_url_sirve_webp(self):
		self._como(self.docente)
		self.client.patch(f'/api/v1/proyectos/{self.proyecto.pk}/', {'imagen_portada': jpg('portada.jpg')}, format='multipart')
		self._subir_anexo(jpg('evidencia.jpg'))
		detalle = self._detalle(self.docente)
		self.assertEqual(detalle.status_code, 200)
		galeria = detalle.data['imagenes']
		self.assertEqual([i['nombre'] for i in galeria], ['portada.jpg', 'evidencia.jpg'])
		self.assertTrue(galeria[0]['es_portada'])
		self.assertEqual(detalle.data['imagen_portada'], galeria[0]['url'])
		self.client.credentials()  # Un <img> no envía el JWT: basta la URL firmada.
		for clave in ('url', 'miniatura'):
			respuesta = self.client.get(ruta(galeria[1][clave]))
			self.assertEqual(respuesta.status_code, 200)
			self.assertEqual(respuesta['Content-Type'], 'image/webp')
			self.assertEqual(Image.open(io.BytesIO(respuesta.content)).format, 'WEBP')

	def test_listado_incluye_la_portada_sin_una_consulta_por_proyecto(self):
		self._como(self.docente)
		self.client.patch(f'/api/v1/proyectos/{self.proyecto.pk}/', {'imagen_portada': jpg()}, format='multipart')
		from django.db import connection
		from django.test.utils import CaptureQueriesContext
		with CaptureQueriesContext(connection) as con_uno:
			self.client.get('/api/v1/proyectos/')
		for i in range(3):
			proyecto = Proyecto.objects.create(codigo=f'PV-2026-3{i}', titulo=f'P{i}', responsable=self.docente)
			self.client.patch(f'/api/v1/proyectos/{proyecto.pk}/', {'imagen_portada': jpg()}, format='multipart')
		with CaptureQueriesContext(connection) as con_cuatro:
			respuesta = self.client.get('/api/v1/proyectos/')
		self.assertEqual(len(con_cuatro), len(con_uno))
		self.assertEqual(respuesta.status_code, 200)
		con_portada = [p for p in respuesta.data['results'] if p['imagen_portada']]
		self.assertEqual(len(con_portada), 4)
		self.assertIn('/api/v1/proyectos/imagenes/', con_portada[0]['imagen_portada_miniatura'])

	def test_url_alterada_o_vencida_devuelve_404(self):
		self._como(self.docente)
		self._subir_anexo(jpg())
		url = ruta(self._detalle(self.docente).data['imagenes'][0]['url'])
		self.client.credentials()
		self.assertEqual(self.client.get(url[:-3] + 'abc/').status_code, 404)
		self.assertEqual(self.client.get('/api/v1/proyectos/imagenes/basura/').status_code, 404)
		with patch('proyectos.imagenes.time.time', return_value=10 ** 12):
			self.assertEqual(self.client.get(url).status_code, 404)

	# Acceso según el rol

	def test_ven_la_galeria_responsable_participante_y_revisor(self):
		self._como(self.docente)
		self._subir_anexo(jpg())
		for perfil in (self.docente, self.estudiante, self.coordinador):
			with self.subTest(usuario=perfil.user.username):
				detalle = self._detalle(perfil)
				self.assertEqual(detalle.status_code, 200)
				self.assertEqual(len(detalle.data['imagenes']), 1)

	def test_quienes_no_ven_el_proyecto_no_obtienen_urls(self):
		self._como(self.docente)
		self._subir_anexo(jpg())
		for perfil in (self.otro_docente, self.estudiante_ajeno):
			with self.subTest(usuario=perfil.user.username):
				self.assertEqual(self._detalle(perfil).status_code, 404)
				self.assertEqual(self.client.get(f'/api/v1/anexos/?proyecto={self.proyecto.pk}').data['results'], [])

	def test_docente_ajeno_y_estudiante_no_pueden_subir_imagenes(self):
		for perfil, codigo in ((self.otro_docente, 403), (self.estudiante, 403)):
			with self.subTest(usuario=perfil.user.username):
				self._como(perfil)
				self.assertEqual(self._subir_anexo(jpg()).status_code, codigo)
		self.assertFalse(ImagenProyecto.objects.exists())

	# Reporte de espacio

	def test_comando_reporta_el_espacio_por_proyecto_y_total(self):
		self._como(self.docente)
		self._subir_anexo(jpg())
		salida = io.StringIO()
		call_command('reporte_imagenes', stdout=salida)
		texto = salida.getvalue()
		self.assertIn('PV-2026-20', texto)
		self.assertIn('Total', texto)
		self.assertIn('0,5 GB', texto)
