from django.core.cache import cache
from django.core.management import call_command
from rest_framework.test import APITestCase

from cuentas.models import Cuenta, RegistroAcceso
from cuentas.tests.utils import autenticar, crear_cuenta


class AdminCuentasTest(APITestCase):
	def setUp(self):
		cache.clear()
		self.admin = crear_cuenta(username='admin', rol='ADMIN')
		self.docente = crear_cuenta(username='doc', rol='DOCENTE')

	def test_no_admin_recibe_403(self):
		autenticar(self.client, self.docente)
		self.assertEqual(self.client.get('/api/auth/cuentas/').status_code, 403)
		self.assertEqual(self.client.post('/api/auth/cuentas/', {}, format='json').status_code, 403)
		r = self.client.post(f'/api/auth/cuentas/{self.docente.id}/contrasena/', {'password': 'Otra.Clave99', 'password2': 'Otra.Clave99'}, format='json')
		self.assertEqual(r.status_code, 403)
		self.assertEqual(self.client.get('/api/auth/accesos/').status_code, 403)

	def test_admin_crea_cuenta_con_rol(self):
		autenticar(self.client, self.admin)
		r = self.client.post('/api/auth/cuentas/', {
			'username': 'coord', 'email': 'coord@unl.edu.ec', 'password': 'Clave.Segura1',
			'first_name': 'Luis', 'last_name': 'Mora', 'rol': 'COORDINADOR',
		}, format='json')
		self.assertEqual(r.status_code, 201, r.data)
		self.assertEqual(Cuenta.objects.get(username='coord').rol, 'COORDINADOR')
		self.assertEqual(r.data['data']['rol'], 'COORDINADOR')

	def test_admin_lista_y_filtra(self):
		autenticar(self.client, self.admin)
		r = self.client.get('/api/auth/cuentas/?rol=DOCENTE')
		self.assertEqual(r.status_code, 200)
		self.assertEqual([c['username'] for c in r.data['data']['results']], ['doc'])

	def test_admin_cambia_rol_y_desactiva(self):
		autenticar(self.client, self.admin)
		r = self.client.patch(f'/api/auth/cuentas/{self.docente.id}/', {'rol': 'COORDINADOR', 'is_active': False}, format='json')
		self.assertEqual(r.status_code, 200, r.data)
		self.docente.refresh_from_db()
		self.assertEqual(self.docente.rol, 'COORDINADOR')
		self.assertFalse(self.docente.is_active)

	def test_admin_fija_contrasena(self):
		autenticar(self.client, self.admin)
		r = self.client.post(f'/api/auth/cuentas/{self.docente.id}/contrasena/', {'password': 'Nueva.Clave77', 'password2': 'Nueva.Clave77'}, format='json')
		self.assertEqual(r.status_code, 200, r.data)
		self.docente.refresh_from_db()
		self.assertTrue(self.docente.check_password('Nueva.Clave77'))

	def test_contrasenas_distintas(self):
		autenticar(self.client, self.admin)
		r = self.client.post(f'/api/auth/cuentas/{self.docente.id}/contrasena/', {'password': 'Nueva.Clave77', 'password2': 'Otra.Clave77'}, format='json')
		self.assertEqual(r.status_code, 400)

	def test_accesos_lista_intentos(self):
		RegistroAcceso.objects.create(identificador='doc', metodo='password', exito=False)
		autenticar(self.client, self.admin)
		r = self.client.get('/api/auth/accesos/')
		self.assertEqual(r.status_code, 200)
		self.assertFalse(r.data['data']['results'][0]['exito'])


class SembrarCuentasTest(APITestCase):
	def test_sembrar_cuentas_idempotente(self):
		call_command('sembrar_cuentas', verbosity=0)
		call_command('sembrar_cuentas', verbosity=0)
		self.assertEqual(Cuenta.objects.count(), 4)
		self.assertEqual(sorted(Cuenta.objects.values_list('rol', flat=True)), ['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE'])
		self.assertTrue(Cuenta.objects.get(username='admin').check_password('Vinculacion.2026'))
