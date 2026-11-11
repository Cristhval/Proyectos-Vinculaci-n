from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from usuarios.models import Carrera, Usuario, RolUsuario
from usuarios.tests_utils import SIMPLE_JWT_TEST, token_para


@override_settings(SIMPLE_JWT=SIMPLE_JWT_TEST)
class UsuarioTestCase(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.carrera = Carrera.objects.create(
			codigo='TEST', nombre='Carrera Test', facultad='Facultad Test'
		)
		self.user = User.objects.create_user(username='admin', password='AdminPass123!')
		self.perfil = Usuario.objects.create(
			user=self.user, codigo='ADM-001', rol=RolUsuario.ADMIN, carrera=self.carrera
		)
		self.token = token_para(self.perfil)
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

	def test_list_usuarios(self):
		response = self.client.get('/api/v1/usuarios/')
		self.assertEqual(response.status_code, status.HTTP_200_OK)

	def test_me_endpoint(self):
		response = self.client.get('/api/v1/usuarios/me/')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(response.data['success'])
		self.assertEqual(response.data['data']['codigo'], 'ADM-001')

	def test_list_carreras(self):
		response = self.client.get('/api/v1/carreras/')
		self.assertEqual(response.status_code, status.HTTP_200_OK)


@override_settings(SIMPLE_JWT=SIMPLE_JWT_TEST)
class ProyectoTestCase(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.carrera = Carrera.objects.create(
			codigo='TEST', nombre='Carrera Test', facultad='Facultad Test'
		)
		self.user = User.objects.create_user(username='coord', password='CoordPass123!')
		self.perfil = Usuario.objects.create(
			user=self.user, codigo='CRD-001', rol=RolUsuario.COORDINADOR, carrera=self.carrera
		)
		self.token = token_para(self.perfil)
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

	def test_create_proyecto(self):
		response = self.client.post('/api/v1/proyectos/', {
			'titulo': 'Proyecto de prueba',
			'tipo': 'VINCULACION',
			'carrera_id': self.carrera.id,
			'responsable_id': self.perfil.id,
		}, format='json')
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)

	def test_list_proyectos(self):
		response = self.client.get('/api/v1/proyectos/')
		self.assertEqual(response.status_code, status.HTTP_200_OK)

	def test_enviar_revision(self):
		create = self.client.post('/api/v1/proyectos/', {
			'titulo': 'Proyecto revision',
			'tipo': 'VINCULACION',
		}, format='json')
		proyecto_id = create.data['id']
		response = self.client.post(f'/api/v1/proyectos/{proyecto_id}/enviar-revision/')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(response.data['success'])


@override_settings(SIMPLE_JWT=SIMPLE_JWT_TEST)
class ConveniosTestCase(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.carrera = Carrera.objects.create(
			codigo='TEST', nombre='Carrera Test', facultad='Facultad Test'
		)
		self.user = User.objects.create_user(username='coord', password='CoordPass123!')
		self.perfil = Usuario.objects.create(
			user=self.user, codigo='CRD-001', rol=RolUsuario.COORDINADOR, carrera=self.carrera
		)
		self.token = token_para(self.perfil)
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

	def test_create_institucion(self):
		response = self.client.post('/api/v1/instituciones/', {
			'nombre': 'Institucion Test',
			'sigla': 'IT',
		}, format='json')
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)

	def test_create_convenio(self):
		inst = self.client.post('/api/v1/instituciones/', {
			'nombre': 'ONG Test', 'sigla': 'ONG',
		}, format='json')
		response = self.client.post('/api/v1/convenios/', {
			'codigo': 'CONV-001',
			'entidad_contraparte': 'ONG Test',
			'objeto': 'Cooperacion en vinculacion',
			'tipo': 'ESPECIFICO',
		}, format='json')
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)


@override_settings(SIMPLE_JWT=SIMPLE_JWT_TEST)
class SeguimientoTestCase(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.carrera = Carrera.objects.create(
			codigo='TEST', nombre='Carrera Test', facultad='Facultad Test'
		)
		self.user = User.objects.create_user(username='coord', password='CoordPass123!')
		self.perfil = Usuario.objects.create(
			user=self.user, codigo='CRD-099', rol=RolUsuario.COORDINADOR, carrera=self.carrera
		)
		self.token = token_para(self.perfil)
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

	def test_create_actividad(self):
		proj = self.client.post('/api/v1/proyectos/', {
			'codigo': 'PRJ-TEST-ACT',
			'titulo': 'Proyecto test actividad',
			'tipo': 'VINCULACION',
			'carrera_id': self.carrera.id,
		}, format='json')
		self.assertEqual(proj.status_code, status.HTTP_201_CREATED)
		proyecto_id = proj.data['id']
		response = self.client.post('/api/v1/actividades/', {
			'proyecto': proyecto_id,
			'codigo': 'ACT-001',
			'nombre': 'Actividad de prueba',
			'descripcion': 'Descripcion de actividad',
		}, format='json')
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)

	def test_create_avance(self):
		proj = self.client.post('/api/v1/proyectos/', {
			'codigo': 'PRJ-TEST-AV',
			'titulo': 'Proyecto test avance',
			'tipo': 'VINCULACION',
		}, format='json')
		proyecto_id = proj.data['id']
		act = self.client.post('/api/v1/actividades/', {
			'proyecto': proyecto_id,
			'codigo': 'ACT-002',
			'nombre': 'Actividad avance',
			'descripcion': 'Descripcion',
		}, format='json')
		actividad_id = act.data['id']
		response = self.client.post('/api/v1/avances/', {
			'actividad': actividad_id,
			'porcentaje_avance': 50,
			'descripcion': 'Avance del 50%',
		}, format='json')
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)

	def test_list_alertas(self):
		response = self.client.get('/api/v1/alertas/')
		self.assertEqual(response.status_code, status.HTTP_200_OK)


@override_settings(SIMPLE_JWT=SIMPLE_JWT_TEST)
class ReportesTestCase(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.carrera = Carrera.objects.create(
			codigo='TEST', nombre='Carrera Test', facultad='Facultad Test'
		)
		self.user = User.objects.create_user(username='coord', password='CoordPass123!')
		self.perfil = Usuario.objects.create(
			user=self.user, codigo='CRD-001', rol=RolUsuario.COORDINADOR, carrera=self.carrera
		)
		self.token = token_para(self.perfil)
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

	def test_dashboard(self):
		response = self.client.get('/api/v1/dashboard/')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(response.data['success'])
		self.assertIn('resumen', response.data['data'])


@override_settings(SIMPLE_JWT=SIMPLE_JWT_TEST)
class ErrorHandlingTestCase(TestCase):
	def setUp(self):
		self.client = APIClient()

	def test_unauthenticated_access(self):
		response = self.client.get('/api/v1/proyectos/')
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

	def test_not_found_endpoint(self):
		response = self.client.get('/api/v1/proyectos/99999/')
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

	def test_proyecto_not_found(self):
		user = User.objects.create_user(username='test2', password='TestPass123!')
		Usuario.objects.create(user=user, codigo='TST-002')
		token = token_para(Usuario.objects.get(codigo='TST-002'))
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
		response = self.client.get('/api/v1/proyectos/99999/')
		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
