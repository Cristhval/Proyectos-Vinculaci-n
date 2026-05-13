from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from usuarios.models import Carrera, Usuario, RolUsuario


class AuthTestCase(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.carrera = Carrera.objects.create(
			codigo='TEST', nombre='Carrera de Prueba', facultad='Facultad Test'
		)

	def test_register_usuario(self):
		response = self.client.post('/api/v1/auth/register/', {
			'username': 'testuser',
			'password': 'TestPass123!',
			'first_name': 'Test',
			'last_name': 'User',
			'email': 'test@test.com',
			'rol': 'ESTUDIANTE',
		}, format='json')
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(response.data['success'])
		self.assertEqual(response.data['message'], 'Usuario registrado correctamente.')

	def test_register_duplicate_username(self):
		User.objects.create_user(username='testuser', password='TestPass123!')
		response = self.client.post('/api/v1/auth/register/', {
			'username': 'testuser',
			'password': 'TestPass123!',
		}, format='json')
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	def test_login_success(self):
		user = User.objects.create_user(username='testuser', password='TestPass123!')
		Usuario.objects.create(user=user, codigo='TST-001', rol=RolUsuario.ESTUDIANTE, carrera=self.carrera)
		response = self.client.post('/api/v1/auth/login/', {
			'username': 'testuser',
			'password': 'TestPass123!',
		}, format='json')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(response.data['success'])
		self.assertIn('access', response.data['data'])
		self.assertIn('refresh', response.data['data'])

	def test_login_invalid_credentials(self):
		response = self.client.post('/api/v1/auth/login/', {
			'username': 'noexiste',
			'password': 'wrongpass',
		}, format='json')
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertFalse(response.data['success'])


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
		login = self.client.post('/api/v1/auth/login/', {
			'username': 'admin', 'password': 'AdminPass123!'
		}, format='json')
		self.token = login.data['data']['access']
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
		login = self.client.post('/api/v1/auth/login/', {
			'username': 'coord', 'password': 'CoordPass123!'
		}, format='json')
		self.token = login.data['data']['access']
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
		login = self.client.post('/api/v1/auth/login/', {
			'username': 'coord', 'password': 'CoordPass123!'
		}, format='json')
		self.token = login.data['data']['access']
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
		login = self.client.post('/api/v1/auth/login/', {
			'username': 'coord', 'password': 'CoordPass123!'
		}, format='json')
		self.token = login.data['data']['access']
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
		login = self.client.post('/api/v1/auth/login/', {
			'username': 'coord', 'password': 'CoordPass123!'
		}, format='json')
		self.token = login.data['data']['access']
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

	def test_dashboard(self):
		response = self.client.get('/api/v1/dashboard/')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(response.data['success'])
		self.assertIn('resumen', response.data['data'])


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
		login = self.client.post('/api/v1/auth/login/', {
			'username': 'test2', 'password': 'TestPass123!'
		}, format='json')
		token = login.data['data']['access']
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
		response = self.client.get('/api/v1/proyectos/99999/')
		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
