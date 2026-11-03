from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from usuarios.models import RolUsuario, Usuario
from usuarios.tests_utils import SIMPLE_JWT_TEST, token_para


def claims(sub='7', **extra):
	base = {
		'sub': sub, 'username': f'u{sub}', 'email': f'u{sub}@unl.edu.ec', 'first_name': 'Ana',
		'last_name': 'Paz', 'rol': 'DOCENTE', 'documento_identidad': '',
	}
	base.update(extra)
	return base


@override_settings(SIMPLE_JWT=SIMPLE_JWT_TEST)
class AuthServiceTest(TestCase):
	def setUp(self):
		self.client = APIClient()

	def me(self, token):
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
		return self.client.get('/api/v1/usuarios/me/')

	def test_token_valido_crea_usuario(self):
		r = self.me(token_para(claims()))
		self.assertEqual(r.status_code, 200, r.content)
		perfil = Usuario.objects.get(auth_uid='7')
		self.assertEqual(perfil.rol, 'DOCENTE')
		self.assertEqual(perfil.user.email, 'u7@unl.edu.ec')
		self.assertEqual(perfil.codigo, 'USR-7')

	def test_enlaza_admin_existente_por_correo(self):
		user = User.objects.create_user(username='admin', email='admin@unl.edu.ec', password='x')
		Usuario.objects.create(user=user, codigo='ADM-001', documento_identidad='1100000009', rol=RolUsuario.ADMIN)
		r = self.me(token_para(claims('1', username='administrador', email='Admin@UNL.edu.ec', rol='ADMIN')))
		self.assertEqual(r.status_code, 200)
		self.assertEqual(User.objects.count(), 1)
		user.perfil.refresh_from_db()
		self.assertEqual(user.perfil.auth_uid, '1')
		self.assertEqual(user.perfil.codigo, 'ADM-001')

	def test_actualiza_rol(self):
		self.me(token_para(claims()))
		self.me(token_para(claims(rol='COORDINADOR')))
		self.assertEqual(Usuario.objects.get(auth_uid='7').rol, 'COORDINADOR')

	def test_dos_usuarios_sin_documento_no_chocan(self):
		self.assertEqual(self.me(token_para(claims('1'))).status_code, 200)
		self.assertEqual(self.me(token_para(claims('2'))).status_code, 200)
		self.assertEqual(
			sorted(Usuario.objects.values_list('documento_identidad', flat=True)), ['PEND-1', 'PEND-2'],
		)

	def test_firma_aud_iss_incorrectos_401(self):
		otra = rsa.generate_private_key(public_exponent=65537, key_size=2048).private_bytes(
			serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()
		).decode()
		self.assertEqual(self.me(token_para(claims(), clave=otra)).status_code, 401)
		self.assertEqual(self.me(token_para(claims(), aud='otra-api')).status_code, 401)
		self.assertEqual(self.me(token_para(claims(), iss='otro-emisor')).status_code, 401)

	def test_usuario_inactivo_401(self):
		self.me(token_para(claims()))
		Usuario.objects.filter(auth_uid='7').update(activo=False)
		self.assertEqual(self.me(token_para(claims())).status_code, 401)

	def test_sincronizar_solo_admin(self):
		url = '/api/v1/usuarios/sincronizar/'
		datos = {**claims('9', rol='ESTUDIANTE'), 'telefono': '0999999999'}
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_para(claims())}')
		self.assertEqual(self.client.post(url, datos, format='json').status_code, 403)
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_para(claims("1", rol="ADMIN"))}')
		r = self.client.post(url, datos, format='json')
		self.assertEqual(r.status_code, 200, r.content)
		self.assertEqual(Usuario.objects.get(auth_uid='9').telefono, '0999999999')

	def test_rol_no_se_edita_desde_la_api_principal(self):
		self.me(token_para(claims('1', rol='ADMIN')))
		self.me(token_para(claims()))
		perfil = Usuario.objects.get(auth_uid='7')
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_para(claims("1", rol="ADMIN"))}')
		self.client.patch(f'/api/v1/usuarios/{perfil.pk}/', {'rol': 'ADMIN', 'telefono': '072'}, format='json')
		perfil.refresh_from_db()
		self.assertEqual(perfil.rol, 'DOCENTE')
		self.assertEqual(perfil.telefono, '072')

	def test_endpoints_viejos_eliminados(self):
		self.assertEqual(self.client.post('/api/v1/auth/login/', {}, format='json').status_code, 404)
		self.assertEqual(self.client.post('/api/v1/auth/register/', {}, format='json').status_code, 404)
