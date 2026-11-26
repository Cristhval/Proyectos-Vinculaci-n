"""Visibilidad y permisos de los anexos según el rol."""
import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from proyectos.models import Anexo, ParticipanteProyecto, Proyecto
from proyectos.tests_monitoreo import crear_perfil
from usuarios.tests_utils import SIMPLE_JWT_TEST, token_para

MEDIA_TEMPORAL = tempfile.mkdtemp()


def pdf(nombre='acta.pdf'):
	return SimpleUploadedFile(nombre, b'%PDF-1.4 prueba', content_type='application/pdf')


@override_settings(SIMPLE_JWT=SIMPLE_JWT_TEST, MEDIA_ROOT=MEDIA_TEMPORAL)
class AnexoPermisosTests(APITestCase):
	@classmethod
	def tearDownClass(cls):
		super().tearDownClass()
		shutil.rmtree(MEDIA_TEMPORAL, ignore_errors=True)

	def setUp(self):
		self.docente = crear_perfil('docente', 'DOCENTE')
		self.otro_docente = crear_perfil('otrodoc', 'DOCENTE')
		self.estudiante = crear_perfil('est', 'ESTUDIANTE')
		self.estudiante_ajeno = crear_perfil('estajeno', 'ESTUDIANTE')
		self.coordinador = crear_perfil('coord', 'COORDINADOR')
		self.proyecto = Proyecto.objects.create(codigo='PV-2026-10', titulo='Huertos', responsable=self.docente)
		ParticipanteProyecto.objects.create(proyecto=self.proyecto, usuario=self.estudiante)
		self.anexo = Anexo.objects.create(proyecto=self.proyecto, nombre='acta.pdf', archivo=pdf())
		self.url = f'/api/v1/anexos/?proyecto={self.proyecto.pk}'

	def _como(self, perfil):
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_para(perfil)}')

	def _ids(self, perfil):
		self._como(perfil)
		respuesta = self.client.get(self.url)
		self.assertEqual(respuesta.status_code, 200)
		return [a['id'] for a in respuesta.data['results']]

	def test_ven_los_anexos_quienes_ven_el_proyecto(self):
		for perfil in (self.docente, self.estudiante, self.coordinador):
			with self.subTest(rol=perfil.rol, usuario=perfil.user.username):
				self.assertEqual(self._ids(perfil), [self.anexo.pk])

	def test_no_ven_los_anexos_quienes_no_ven_el_proyecto(self):
		for perfil in (self.otro_docente, self.estudiante_ajeno):
			with self.subTest(usuario=perfil.user.username):
				self.assertEqual(self._ids(perfil), [])
				respuesta = self.client.get(f'/api/v1/anexos/{self.anexo.pk}/')
				self.assertEqual(respuesta.status_code, 404)

	def test_docente_solo_adjunta_a_sus_proyectos(self):
		self._como(self.otro_docente)
		datos = {'proyecto': self.proyecto.pk, 'nombre': 'x.pdf', 'archivo': pdf('x.pdf'), 'tipo': 'OTRO'}
		self.assertEqual(self.client.post('/api/v1/anexos/', datos, format='multipart').status_code, 403)
		self._como(self.docente)
		datos['archivo'] = pdf('x.pdf')
		self.assertEqual(self.client.post('/api/v1/anexos/', datos, format='multipart').status_code, 201)
		self.assertEqual(Anexo.objects.filter(proyecto=self.proyecto).count(), 2)
