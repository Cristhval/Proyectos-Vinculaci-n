"""El período académico del formulario se guarda y se recupera."""
from django.test import override_settings
from rest_framework.test import APITestCase

from proyectos.models import Proyecto
from proyectos.tests_monitoreo import crear_perfil
from usuarios.tests_utils import SIMPLE_JWT_TEST, token_para


@override_settings(SIMPLE_JWT=SIMPLE_JWT_TEST)
class PeriodoAcademicoTests(APITestCase):
	def setUp(self):
		self.docente = crear_perfil('docente', 'DOCENTE')
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_para(self.docente)}')

	def test_se_guarda_al_crear_y_se_recupera_en_el_detalle(self):
		respuesta = self.client.post('/api/v1/proyectos/', {
			'titulo': 'Huertos', 'tipo': 'VINCULACION', 'estado': 'BORRADOR',
			'responsable_id': self.docente.pk, 'periodo_academico': 'Agosto - Diciembre 2026',
		}, format='multipart')
		self.assertEqual(respuesta.status_code, 201, respuesta.data)
		pid = respuesta.data['id']
		self.assertEqual(Proyecto.objects.get(pk=pid).periodo_academico, 'Agosto - Diciembre 2026')
		detalle = self.client.get(f'/api/v1/proyectos/{pid}/')
		self.assertEqual(detalle.data['periodo_academico'], 'Agosto - Diciembre 2026')

	def test_se_actualiza_y_es_opcional(self):
		proyecto = Proyecto.objects.create(codigo='PV-1', titulo='Huertos', responsable=self.docente)
		self.assertEqual(self.client.get(f'/api/v1/proyectos/{proyecto.pk}/').data['periodo_academico'], '')
		url = f'/api/v1/proyectos/{proyecto.pk}/'
		self.assertEqual(self.client.patch(url, {'periodo_academico': 'Abril - Agosto 2026'}, format='multipart').status_code, 200)
		self.assertEqual(self.client.get(url).data['periodo_academico'], 'Abril - Agosto 2026')
		self.assertEqual(self.client.patch(url, {'periodo_academico': ''}, format='multipart').status_code, 200)
		self.assertEqual(self.client.get(url).data['periodo_academico'], '')
