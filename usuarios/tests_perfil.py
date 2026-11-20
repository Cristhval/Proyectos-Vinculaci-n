from io import BytesIO

from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient

from usuarios.models import Carrera, Usuario
from usuarios.tests_utils import SIMPLE_JWT_TEST, token_para


def claims(sub='71', rol='ESTUDIANTE', documento=''):
	return {
		'sub': sub, 'username': f'u{sub}', 'email': f'u{sub}@unl.edu.ec', 'first_name': 'Ana',
		'last_name': 'Paz', 'rol': rol, 'documento_identidad': documento,
	}


def imagen(formato='PNG', tamano=(800, 500), modo='RGBA'):
	buf = BytesIO()
	Image.new(modo, tamano, (20, 80, 160, 255) if modo == 'RGBA' else (20, 80, 160)).save(buf, formato)
	buf.seek(0)
	buf.name = f'foto.{formato.lower()}'
	return buf


@override_settings(SIMPLE_JWT=SIMPLE_JWT_TEST)
class PerfilPropioTest(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.carrera = Carrera.objects.get(codigo='FEIRNNR-COMP')

	def entrar(self, **kw):
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_para(claims(**kw))}')
		return self.client.get('/api/v1/usuarios/me/').data['data']

	def test_carreras_cargadas_por_facultad(self):
		self.assertGreaterEqual(Carrera.objects.count(), 30)
		self.assertEqual(self.carrera.nombre, 'Computación')

	def test_estudiante_nuevo_tiene_pendientes(self):
		datos = self.entrar()
		self.assertEqual([p['campo'] for p in datos['campos_pendientes']], ['documento_identidad', 'carrera', 'telefono', 'direccion'])
		self.assertIsNone(datos['foto_token'])

	def test_directivo_no_requiere_carrera(self):
		datos = self.entrar(rol='DIRECTIVO')
		self.assertNotIn('carrera', [p['campo'] for p in datos['campos_pendientes']])

	def test_completa_perfil(self):
		self.entrar(documento='1105606741')
		r = self.client.patch('/api/v1/usuarios/me/', {
			'telefono': '+593 98 765 4321', 'direccion': 'Av. Universitaria y 10 de Agosto, junto al parque',
			'carrera_id': self.carrera.id,
		}, format='json')
		self.assertEqual(r.status_code, 200, r.data)
		self.assertEqual(r.data['data']['telefono'], '0987654321')
		self.assertEqual(r.data['data']['campos_pendientes'], [])

	def test_validaciones(self):
		self.entrar()
		r = self.client.patch('/api/v1/usuarios/me/', {'telefono': '12345', 'direccion': 'Loja', 'fecha_nacimiento': '2024-01-01'}, format='json')
		self.assertEqual(r.status_code, 400)
		self.assertEqual(set(r.data['data']), {'telefono', 'direccion', 'fecha_nacimiento'})

	def test_no_puede_cambiar_rol_ni_cedula(self):
		self.entrar()
		self.client.patch('/api/v1/usuarios/me/', {'rol': 'ADMIN', 'documento_identidad': '1105606741'}, format='json')
		perfil = Usuario.objects.get(auth_uid='71')
		self.assertEqual(perfil.rol, 'ESTUDIANTE')
		self.assertTrue(perfil.documento_identidad.startswith('PEND-'))

	def test_sube_foto_de_cualquier_formato_y_la_sirve(self):
		self.entrar()
		for formato, modo in (('PNG', 'RGBA'), ('JPEG', 'RGB'), ('BMP', 'RGB'), ('GIF', 'RGB'), ('TIFF', 'RGB'), ('WEBP', 'RGB')):
			r = self.client.post('/api/v1/usuarios/me/foto/', {'foto': imagen(formato, modo=modo)}, format='multipart')
			self.assertEqual(r.status_code, 200, (formato, r.data))
		token = r.data['data']['foto_token']
		anonimo = APIClient().get(f'/api/v1/usuarios/foto/{token}/')
		self.assertEqual(anonimo.status_code, 200)
		self.assertEqual(anonimo['Content-Type'], 'image/webp')
		self.assertEqual(Image.open(BytesIO(anonimo.content)).size, (320, 320))

	def test_foto_heic(self):
		from pillow_heif import from_pillow
		self.entrar()
		buf = BytesIO()
		from_pillow(Image.new('RGB', (400, 300), (200, 30, 30))).save(buf, quality=60)
		buf.seek(0)
		buf.name = 'foto.heic'
		r = self.client.post('/api/v1/usuarios/me/foto/', {'foto': buf}, format='multipart')
		self.assertEqual(r.status_code, 200, r.data)

	def test_archivo_que_no_es_imagen(self):
		self.entrar()
		falso = BytesIO(b'no soy una imagen')
		falso.name = 'virus.png'
		r = self.client.post('/api/v1/usuarios/me/foto/', {'foto': falso}, format='multipart')
		self.assertEqual(r.status_code, 400)

	def test_token_alterado_y_borrar_foto(self):
		self.entrar()
		token = self.client.post('/api/v1/usuarios/me/foto/', {'foto': imagen()}, format='multipart').data['data']['foto_token']
		self.assertEqual(APIClient().get(f'/api/v1/usuarios/foto/{token}x/').status_code, 404)
		r = self.client.delete('/api/v1/usuarios/me/foto/')
		self.assertIsNone(r.data['data']['foto_token'])
		self.assertEqual(APIClient().get(f'/api/v1/usuarios/foto/{token}/').status_code, 404)
