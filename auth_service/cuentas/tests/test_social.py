from datetime import timedelta
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from cuentas.models import CodigoIntercambio, IdentidadSocial, RegistroAcceso, SolicitudAcceso
from cuentas.servicios.proveedores import FabricaProveedores, IdentidadExterna, ProveedorIdentidad
from cuentas.tests.utils import crear_cuenta

FRONT = 'http://front.test'


class ProveedorFalso(ProveedorIdentidad):
	nombre = 'google'
	etiqueta = 'Google'

	def __init__(self, identidad=None, error=None):
		self.identidad = identidad
		self.error = error

	def configurado(self):
		return True

	def url_autorizacion(self, state, redirect_uri):
		return f'https://proveedor.test/auth?state={state}&redirect_uri={redirect_uri}'

	def obtener_identidad(self, code, redirect_uri):
		if self.error:
			raise self.error
		return self.identidad


@override_settings(FRONTEND_URL=FRONT)
class SocialTest(APITestCase):
	def setUp(self):
		self.docente = crear_cuenta(username='docente', rol='DOCENTE', email='docente@unl.edu.ec')
		self.proveedor = ProveedorFalso(IdentidadExterna(uid='g-1', email='Docente@UNL.edu.ec', email_verificado=True, nombre='Doc'))
		parche = patch.object(FabricaProveedores, 'obtener', side_effect=self._obtener)
		parche.start()
		self.addCleanup(parche.stop)

	def _obtener(self, nombre):
		self.proveedor.nombre = nombre
		return self.proveedor

	def iniciar(self, proveedor='google'):
		r = self.client.get(f'/api/auth/social/{proveedor}/iniciar/')
		return r, parse_qs(urlparse(r['Location']).query)['state'][0]

	def callback(self, proveedor='google', state=None):
		_, state_real = self.iniciar(proveedor)
		return self.client.get(f'/api/auth/social/{proveedor}/callback/', {'code': 'abc', 'state': state or state_real})

	def test_iniciar_redirige_y_guarda_state(self):
		r, state = self.iniciar()
		self.assertEqual(r.status_code, 302)
		self.assertTrue(r['Location'].startswith('https://proveedor.test/auth'))
		self.assertEqual(self.client.session['oauth_state_google'], state)

	def test_callback_vincula_por_correo_existente(self):
		r = self.callback()
		self.assertEqual(r.status_code, 302)
		self.assertTrue(r['Location'].startswith(f'{FRONT}/auth/callback?code='))
		self.assertTrue(IdentidadSocial.objects.filter(cuenta=self.docente, proveedor='google', uid_externo='g-1').exists())
		self.assertTrue(RegistroAcceso.objects.filter(cuenta=self.docente, metodo='google', exito=True).exists())

	def test_callback_reutiliza_identidad(self):
		IdentidadSocial.objects.create(cuenta=self.docente, proveedor='google', uid_externo='g-1')
		self.proveedor.identidad = IdentidadExterna(uid='g-1', email='cambiado@gmail.com', email_verificado=True, nombre='Doc')
		r = self.callback()
		self.assertTrue(r['Location'].startswith(f'{FRONT}/auth/callback?code='))

	def test_callback_correo_desconocido(self):
		self.proveedor.identidad = IdentidadExterna(uid='gh-9', email='intruso@gmail.com', email_verificado=True, nombre='X')
		r = self.callback('github')
		self.assertEqual(r['Location'], f'{FRONT}/login?error=cuenta_no_registrada&proveedor=github')
		self.assertTrue(RegistroAcceso.objects.filter(exito=False, metodo='github', identificador='intruso@gmail.com').exists())

	def test_callback_correo_no_verificado(self):
		self.proveedor.identidad = IdentidadExterna(uid='g-2', email='docente@unl.edu.ec', email_verificado=False, nombre='Doc')
		r = self.callback()
		self.assertEqual(r['Location'], f'{FRONT}/login?error=cuenta_no_registrada&proveedor=google')

	def test_callback_cuenta_inactiva(self):
		self.docente.is_active = False
		self.docente.save()
		r = self.callback()
		self.assertEqual(r['Location'], f'{FRONT}/login?error=cuenta_no_registrada&proveedor=google')

	def test_callback_solicitud_pendiente_redirige_con_estado(self):
		SolicitudAcceso.objects.create(
			cuenta=self.docente, rol_solicitado='DOCENTE', motivo='Necesito acceso al sistema.',
		)
		self.docente.is_active = False
		self.docente.save(update_fields=['is_active'])
		r = self.callback()
		self.assertEqual(r['Location'], f'{FRONT}/login?error=solicitud_pendiente&proveedor=google')

	def test_callback_state_alterado(self):
		r = self.callback(state='otro')
		self.assertEqual(r['Location'], f'{FRONT}/login?error=social_fallido&proveedor=google')

	def test_callback_error_del_proveedor(self):
		self.proveedor.error = RuntimeError('fallo de red')
		r = self.callback()
		self.assertEqual(r['Location'], f'{FRONT}/login?error=social_fallido&proveedor=google')

	def test_canjear_codigo_una_vez(self):
		codigo = parse_qs(urlparse(self.callback()['Location']).query)['code'][0]
		r1 = self.client.post('/api/auth/social/canjear/', {'code': codigo}, format='json')
		self.assertEqual(r1.status_code, 200)
		self.assertEqual(r1.data['data']['user']['rol'], 'DOCENTE')
		r2 = self.client.post('/api/auth/social/canjear/', {'code': codigo}, format='json')
		self.assertEqual(r2.status_code, 400)

	def test_canjear_codigo_vencido(self):
		c = CodigoIntercambio.objects.create(codigo='x' * 43, cuenta=self.docente, expira=timezone.now() - timedelta(seconds=1))
		r = self.client.post('/api/auth/social/canjear/', {'code': c.codigo}, format='json')
		self.assertEqual(r.status_code, 400)


@override_settings(GOOGLE_CLIENT_ID='id', GOOGLE_CLIENT_SECRET='s', GITHUB_CLIENT_ID='', GITHUB_CLIENT_SECRET='', FACEBOOK_CLIENT_ID='', FACEBOOK_CLIENT_SECRET='')
class FabricaTest(APITestCase):
	def test_proveedor_no_configurado_404(self):
		self.assertEqual(self.client.get('/api/auth/social/github/iniciar/').status_code, 404)
		self.assertEqual(self.client.get('/api/auth/social/twitter/iniciar/').status_code, 404)

	def test_lista_solo_configurados(self):
		r = self.client.get('/api/auth/social/proveedores/')
		self.assertEqual(r.data['data'], ['google'])

	def test_url_google_incluye_scopes_y_state(self):
		url = FabricaProveedores.obtener('google').url_autorizacion('st', 'http://cb')
		q = parse_qs(urlparse(url).query)
		self.assertEqual(q['state'], ['st'])
		self.assertIn('email', q['scope'][0])
		self.assertEqual(q['client_id'], ['id'])


class ProveedorGitHubTest(APITestCase):
	@override_settings(GITHUB_CLIENT_ID='id', GITHUB_CLIENT_SECRET='s')
	def test_github_toma_correo_verificado_principal(self):
		from cuentas.servicios.proveedores import ProveedorGitHub

		class Resp:
			def __init__(self, datos):
				self.datos = datos

			def json(self):
				return self.datos

			def raise_for_status(self):
				pass

		class SesionFalsa:
			def fetch_token(self, *a, **k):
				return {'access_token': 't'}

			def get(self, url, **k):
				if url.endswith('/user'):
					return Resp({'id': 42, 'login': 'octo', 'name': 'Octo', 'email': None})
				return Resp([
					{'email': 'otro@gmail.com', 'verified': False, 'primary': False},
					{'email': 'docente@unl.edu.ec', 'verified': True, 'primary': True},
				])

		proveedor = ProveedorGitHub()
		with patch.object(proveedor, 'sesion', return_value=SesionFalsa()):
			identidad = proveedor.obtener_identidad('code', 'http://cb')
		self.assertEqual(identidad.uid, '42')
		self.assertEqual(identidad.email, 'docente@unl.edu.ec')
		self.assertTrue(identidad.email_verificado)
