from datetime import timedelta
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from django.core.cache import cache
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


class BaseSocial(APITestCase):
	def setUp(self):
		cache.clear()
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



@override_settings(FRONTEND_URL=FRONT)
class SocialTest(BaseSocial):
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

	@override_settings(DOMINIOS_PERMITIDOS=['unl.edu.ec'])
	def test_github_prioriza_correo_unl_verificado_secundario(self):
		from cuentas.servicios.proveedores import ProveedorGitHub

		class Resp:
			def __init__(self, datos):
				self.datos = datos

			def json(self):
				return self.datos

		class SesionFalsa:
			def fetch_token(self, *args, **kwargs):
				return {'access_token': 't'}

			def get(self, url, **kwargs):
				if url.endswith('/user'):
					return Resp({'id': 43, 'login': 'octo', 'name': 'Octo'})
				return Resp([
					{'email': 'principal@gmail.com', 'verified': True, 'primary': True},
					{'email': 'docente@unl.edu.ec', 'verified': True, 'primary': False},
				])

		proveedor = ProveedorGitHub()
		with patch.object(proveedor, 'sesion', return_value=SesionFalsa()):
			identidad = proveedor.obtener_identidad('code', 'http://cb')
		self.assertEqual(identidad.email, 'docente@unl.edu.ec')

	@override_settings(DOMINIOS_PERMITIDOS=['unl.edu.ec'])
	def test_github_no_usa_correo_unl_no_verificado(self):
		from cuentas.servicios.proveedores import ProveedorGitHub

		class Resp:
			def __init__(self, datos):
				self.datos = datos

			def json(self):
				return self.datos

		class SesionFalsa:
			def fetch_token(self, *args, **kwargs):
				return {'access_token': 't'}

			def get(self, url, **kwargs):
				if url.endswith('/user'):
					return Resp({'id': 44, 'login': 'octo', 'name': 'Octo'})
				return Resp([
					{'email': 'docente@unl.edu.ec', 'verified': False, 'primary': True},
					{'email': 'otro@gmail.com', 'verified': True, 'primary': False},
				])

		proveedor = ProveedorGitHub()
		with patch.object(proveedor, 'sesion', return_value=SesionFalsa()):
			identidad = proveedor.obtener_identidad('code', 'http://cb')
		self.assertEqual(identidad.email, 'otro@gmail.com')
		self.assertTrue(identidad.email_verificado)


@override_settings(FRONTEND_URL=FRONT, DOMINIOS_PERMITIDOS=['unl.edu.ec'])
class RegistroSocialTest(BaseSocial):
	"""Primera vez con Google: el sistema pide solo el rol y deja la cuenta pendiente de aprobación."""

	def setUp(self):
		super().setUp()
		self.admin = crear_cuenta(username='admin', rol='ADMIN', email='admin@unl.edu.ec')
		self.proveedor.identidad = IdentidadExterna(uid='g-nuevo', email='Ana.Paz@unl.edu.ec', email_verificado=True, nombre='Ana Lucía Paz Ruiz')
		parche = patch('cuentas.servicios.solicitudes.ServicioNotificacionesSolicitud.notificar_creada')
		self.notificar = parche.start()
		self.addCleanup(parche.stop)

	def pase(self):
		r = self.callback()
		self.assertTrue(r['Location'].startswith(f'{FRONT}/registro/social?'), r['Location'])
		return parse_qs(urlparse(r['Location']).query)['pase'][0]

	def enviar(self, pase, rol='DOCENTE', motivo='Dirijo un proyecto.'):
		return self.client.post('/api/auth/social/registro/', {'pase': pase, 'rol_solicitado': rol, 'motivo': motivo}, format='json')

	def test_pase_muestra_identidad_verificada(self):
		r = self.client.get('/api/auth/social/registro/', {'pase': self.pase()})
		self.assertEqual(r.status_code, 200)
		self.assertEqual(r.data['data'], {'email': 'ana.paz@unl.edu.ec', 'nombre': 'Ana Lucía Paz Ruiz', 'proveedor': 'google'})

	def test_crea_cuenta_pendiente_vinculada_y_notifica(self):
		from cuentas.models import Cuenta
		with self.captureOnCommitCallbacks(execute=True):
			r = self.enviar(self.pase())
		self.assertEqual(r.status_code, 201, r.data)
		cuenta = Cuenta.objects.get(email='ana.paz@unl.edu.ec')
		self.assertFalse(cuenta.is_active)
		self.assertTrue(cuenta.email_verificado)
		self.assertFalse(cuenta.has_usable_password())
		self.assertEqual((cuenta.first_name, cuenta.last_name), ('Ana Lucía', 'Paz Ruiz'))
		self.assertEqual(cuenta.solicitud.rol_solicitado, 'DOCENTE')
		self.assertEqual(cuenta.solicitud.estado, 'PENDIENTE')
		self.assertTrue(IdentidadSocial.objects.filter(cuenta=cuenta, proveedor='google', uid_externo='g-nuevo').exists())
		self.notificar.assert_called_once()

	def test_pendiente_no_entra_y_aprobada_si(self):
		from cuentas.servicios.solicitudes import ServicioSolicitudes
		self.enviar(self.pase())
		r = self.callback()
		self.assertIn('error=solicitud_pendiente', r['Location'])
		solicitud = SolicitudAcceso.objects.get(cuenta__email='ana.paz@unl.edu.ec')
		with patch('cuentas.servicios.solicitudes.ServicioNotificacionesSolicitud.notificar_resuelta'):
			ServicioSolicitudes.aprobar(solicitud, self.admin, 'DOCENTE')
		r = self.callback()
		self.assertTrue(r['Location'].startswith(f'{FRONT}/auth/callback?code='), r['Location'])

	def test_no_permite_roles_altos(self):
		self.assertEqual(self.enviar(self.pase(), rol='ADMIN').status_code, 400)
		self.assertEqual(self.enviar(self.pase(), rol='DIRECTIVO').status_code, 400)

	def test_pase_alterado_o_vencido(self):
		pase = self.pase()
		self.assertEqual(self.enviar(pase[:-2] + 'xx').status_code, 400)
		with patch('cuentas.servicios.solicitudes.ServicioSolicitudes.VIGENCIA_REGISTRO_SOCIAL', -1):
			self.assertEqual(self.enviar(pase).status_code, 400)

	def test_pase_no_se_reutiliza(self):
		pase = self.pase()
		self.assertEqual(self.enviar(pase).status_code, 201)
		self.assertEqual(self.enviar(pase).status_code, 409)

	def test_correo_externo_no_obtiene_pase(self):
		self.proveedor.identidad = IdentidadExterna(uid='g-2', email='ana@gmail.com', email_verificado=True, nombre='Ana')
		self.assertIn('error=cuenta_no_registrada', self.callback()['Location'])

	def test_correo_no_verificado_no_obtiene_pase(self):
		self.proveedor.identidad = IdentidadExterna(uid='g-3', email='ana@unl.edu.ec', email_verificado=False, nombre='Ana')
		self.assertIn('error=cuenta_no_registrada', self.callback()['Location'])

	def test_cuenta_desactivada_no_obtiene_pase(self):
		crear_cuenta(username='ana', email='ana.paz@unl.edu.ec', is_active=False)
		self.assertIn('error=cuenta_no_registrada', self.callback()['Location'])
