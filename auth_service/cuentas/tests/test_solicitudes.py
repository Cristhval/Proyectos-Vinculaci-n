import re
from datetime import timedelta
from unittest.mock import patch

from django.core.cache import cache
from django.core.management import call_command
from rest_framework.test import APITestCase
from django.utils import timezone

from cuentas.models import Cuenta, EstadoSolicitud, SolicitudAcceso
from cuentas.tests.utils import autenticar, crear_cuenta


class EmisorFalso:
	def __init__(self):
		self.mensajes = []

	def enviar(self, destino, asunto, html, texto=''):
		self.mensajes.append((destino, asunto, html, texto))


class SolicitudesAccesoTest(APITestCase):
	def setUp(self):
		cache.clear()
		self.emisor = EmisorFalso()
		self.admin = crear_cuenta(username='admin', rol='ADMIN', email='admin@unl.edu.ec')
		self.captcha = patch(
			'cuentas.servicios.fachada.obtener_verificador',
			return_value=type('Captcha', (), {'verificar': lambda *args: True})(),
		)
		self.captcha.start()
		self.addCleanup(self.captcha.stop)
		self.correo = patch('cuentas.servicios.verificacion.obtener_emisor', return_value=self.emisor)
		self.correo.start()
		self.addCleanup(self.correo.stop)

	def datos(self, **extra):
		datos = {
			'email': 'solicitante@unl.edu.ec',
			'password': 'Clave.Segura1',
			'first_name': 'Ana',
			'last_name': 'Paz',
			'documento_identidad': '1103983456',
			'rol_solicitado': 'DOCENTE',
			'motivo': 'Necesito colaborar en proyectos de vinculación.',
			'captcha_token': 'ok',
		}
		datos.update(extra)
		return datos

	def solicitar(self, **extra):
		return self.client.post('/api/auth/registro/', self.datos(**extra), format='json')

	def verificar(self):
		codigo = re.search(r'\b(\d{6})\b', self.emisor.mensajes[0][2]).group(1)
		return self.client.post(
			'/api/auth/verificar-email/',
			{'email': 'solicitante@unl.edu.ec', 'codigo': codigo},
			format='json',
		)

	def test_solo_acepta_correo_institucional_y_roles_publicos(self):
		self.assertEqual(self.solicitar(email='persona@gmail.com').status_code, 400)
		self.assertEqual(self.solicitar(rol_solicitado='ADMIN').status_code, 400)

	def test_verificar_correo_no_activa_la_cuenta(self):
		self.assertEqual(self.solicitar().status_code, 202)
		self.assertEqual(self.verificar().status_code, 200)
		cuenta = Cuenta.objects.get(email='solicitante@unl.edu.ec')
		self.assertTrue(cuenta.email_verificado)
		self.assertFalse(cuenta.is_active)
		self.assertEqual(SolicitudAcceso.objects.get(cuenta=cuenta).estado, EstadoSolicitud.PENDIENTE)

	def test_solicitud_no_verificada_no_aparece_ni_notifica(self):
		self.assertEqual(self.solicitar().status_code, 202)
		autenticar(self.client, self.admin)
		self.assertEqual(self.client.get('/api/auth/solicitudes/').data['data']['count'], 0)
		self.assertEqual(self.client.get('/api/auth/solicitudes/contador/').data['data']['pendientes'], 0)
		self.assertFalse(any(destino == self.admin.email for destino, *_ in self.emisor.mensajes))

	def test_solicitud_no_verificada_no_se_puede_aprobar(self):
		self.solicitar()
		solicitud = SolicitudAcceso.objects.get()
		autenticar(self.client, self.admin)
		r = self.client.post(f'/api/auth/solicitudes/{solicitud.id}/aprobar/', {'rol': 'DOCENTE'}, format='json')
		self.assertEqual(r.status_code, 409)

	def test_login_pendiente_requiere_password_correcta(self):
		self.solicitar()
		r = self.client.post('/api/auth/login/', {
			'usuario': 'solicitante@unl.edu.ec', 'password': 'otra', 'captcha_token': 'ok',
		}, format='json')
		self.assertEqual(r.status_code, 401)
		r = self.client.post('/api/auth/login/', {
			'usuario': 'solicitante@unl.edu.ec', 'password': 'Clave.Segura1', 'captcha_token': 'ok',
		}, format='json')
		self.assertEqual(r.status_code, 403)
		self.assertEqual(r.data['data']['codigo'], 'solicitud_pendiente')

	def test_admin_aprueba_con_rol_elegido_y_no_se_puede_repetir(self):
		self.solicitar()
		self.verificar()
		solicitud = SolicitudAcceso.objects.get()
		autenticar(self.client, self.admin)
		r = self.client.post(f'/api/auth/solicitudes/{solicitud.id}/aprobar/', {'rol': 'DIRECTIVO'}, format='json')
		self.assertEqual(r.status_code, 200, r.data)
		solicitud.cuenta.refresh_from_db()
		self.assertTrue(solicitud.cuenta.is_active)
		self.assertEqual(solicitud.cuenta.rol, 'DIRECTIVO')
		self.assertEqual(self.client.post(f'/api/auth/solicitudes/{solicitud.id}/aprobar/', {'rol': 'DOCENTE'}, format='json').status_code, 409)

	@patch('cuentas.servicios.notificaciones.ObservadorCorreo.on_resuelta', side_effect=RuntimeError('correo caído'))
	def test_fallo_de_notificacion_no_revierte_aprobacion(self, fallo):
		self.solicitar()
		self.verificar()
		solicitud = SolicitudAcceso.objects.get()
		autenticar(self.client, self.admin)
		r = self.client.post(f'/api/auth/solicitudes/{solicitud.id}/aprobar/', {'rol': 'DOCENTE'}, format='json')
		self.assertEqual(r.status_code, 200, r.data)
		solicitud.refresh_from_db()
		self.assertEqual(solicitud.estado, EstadoSolicitud.APROBADA)

	def test_rechazar_exige_motivo_y_no_admin_recibe_403(self):
		self.solicitar()
		self.verificar()
		solicitud = SolicitudAcceso.objects.get()
		usuario = crear_cuenta(username='doc', rol='DOCENTE', email='doc@unl.edu.ec')
		autenticar(self.client, usuario)
		self.assertEqual(self.client.get('/api/auth/solicitudes/').status_code, 403)
		autenticar(self.client, self.admin)
		self.assertEqual(self.client.post(f'/api/auth/solicitudes/{solicitud.id}/rechazar/', {'motivo': ''}, format='json').status_code, 400)
		r = self.client.post(f'/api/auth/solicitudes/{solicitud.id}/rechazar/', {'motivo': 'No se pudo validar la necesidad.'}, format='json')
		self.assertEqual(r.status_code, 200, r.data)
		self.assertEqual(solicitud.cuenta.is_active, False)

	def test_reintento_reemplaza_cuenta_no_verificada(self):
		self.solicitar()
		primera = Cuenta.objects.get(email='solicitante@unl.edu.ec')
		self.assertEqual(self.solicitar(documento_identidad='0102030400').status_code, 202)
		segunda = Cuenta.objects.get(email='solicitante@unl.edu.ec')
		self.assertNotEqual(primera.id, segunda.id)

	def test_limpieza_elimina_solicitudes_no_verificadas_antiguas(self):
		self.solicitar()
		solicitud = SolicitudAcceso.objects.get()
		SolicitudAcceso.objects.filter(pk=solicitud.pk).update(creada=timezone.now() - timedelta(hours=25))
		call_command('limpiar_solicitudes', verbosity=0)
		self.assertFalse(Cuenta.objects.filter(email='solicitante@unl.edu.ec').exists())

	def test_disponibilidad_devuelve_cedula_y_correo_libres(self):
		respuesta = self.client.post(
			'/api/auth/disponibilidad/',
			{'campo': 'documento_identidad', 'valor': '0102030400'},
			format='json',
		)
		self.assertEqual(respuesta.status_code, 200)
		self.assertTrue(respuesta.data['data']['disponible'])
		respuesta = self.client.post(
			'/api/auth/disponibilidad/',
			{'campo': 'email', 'valor': '  Nueva@UNL.EDU.EC '},
			format='json',
		)
		self.assertEqual(respuesta.status_code, 200)
		self.assertTrue(respuesta.data['data']['disponible'])

	def test_disponibilidad_detecta_cedula_y_correo_ocupados(self):
		crear_cuenta(
			username='ocupado',
			email='Ocupado@UNL.EDU.EC',
			documento_identidad='1103983456',
		)
		respuesta = self.client.post(
			'/api/auth/disponibilidad/',
			{'campo': 'documento_identidad', 'valor': '1103983456'},
			format='json',
		)
		self.assertFalse(respuesta.data['data']['disponible'])
		self.assertIn('Esta cédula ya está registrada.', respuesta.data['data']['mensaje'])
		respuesta = self.client.post(
			'/api/auth/disponibilidad/',
			{'campo': 'email', 'valor': ' ocupado@unl.edu.ec '},
			format='json',
		)
		self.assertFalse(respuesta.data['data']['disponible'])
		self.assertIn('Este correo ya está registrado.', respuesta.data['data']['mensaje'])

	def test_disponibilidad_no_bloquea_solicitud_pendiente_sin_verificar(self):
		self.solicitar()
		for campo, valor in (
			('email', 'solicitante@unl.edu.ec'),
			('documento_identidad', '1103983456'),
		):
			respuesta = self.client.post(
				'/api/auth/disponibilidad/', {'campo': campo, 'valor': valor}, format='json',
			)
			self.assertTrue(respuesta.data['data']['disponible'])

	def test_disponibilidad_rechaza_formato_sin_consultar(self):
		with patch('cuentas.views.AuthFacade.verificar_disponibilidad') as verificar:
			respuesta = self.client.post(
				'/api/auth/disponibilidad/',
				{'campo': 'email', 'valor': 'correo-no-institucional@gmail.com'},
				format='json',
			)
		self.assertEqual(respuesta.status_code, 400)
		verificar.assert_not_called()

	def test_disponibilidad_rechaza_campo_no_permitido(self):
		respuesta = self.client.post(
			'/api/auth/disponibilidad/',
			{'campo': 'username', 'valor': 'admin'},
			format='json',
		)
		self.assertEqual(respuesta.status_code, 400)

	def test_disponibilidad_aplica_throttle_en_la_decima_primera_consulta(self):
		for indice in range(10):
			respuesta = self.client.post(
				'/api/auth/disponibilidad/',
				{'campo': 'email', 'valor': f'consulta{indice}@unl.edu.ec'},
				format='json',
			)
			self.assertEqual(respuesta.status_code, 200)
		respuesta = self.client.post(
			'/api/auth/disponibilidad/',
			{'campo': 'email', 'valor': 'consulta-final@unl.edu.ec'},
			format='json',
		)
		self.assertEqual(respuesta.status_code, 429)

	# Una solicitud abandonada (correo sin verificar) no debe bloquear la cédula ni el correo.
	def test_cedula_de_solicitud_sin_verificar_se_libera(self):
		self.assertEqual(self.solicitar(email='falso.correo@unl.edu.ec').status_code, 202)
		r = self.solicitar()
		self.assertEqual(r.status_code, 202, getattr(r, 'data', r))
		self.assertFalse(Cuenta.objects.filter(email='falso.correo@unl.edu.ec').exists())
		self.assertEqual(Cuenta.objects.get(documento_identidad='1103983456').email, 'solicitante@unl.edu.ec')

	def test_cedula_de_solicitud_verificada_sigue_bloqueada(self):
		self.solicitar()
		self.verificar()
		r = self.solicitar(email='otra.persona@unl.edu.ec')
		self.assertEqual(r.status_code, 400)
		self.assertIn('documento_identidad', r.data['data']['errores'])

	def test_admin_crea_cuenta_con_correo_de_solicitud_sin_verificar(self):
		self.solicitar()
		autenticar(self.client, self.admin)
		r = self.client.post('/api/auth/cuentas/', {
			'email': 'solicitante@unl.edu.ec', 'password': 'Clave.Segura1', 'password2': 'Clave.Segura1',
			'rol': 'DOCENTE', 'first_name': 'Ana', 'last_name': 'Paz',
		}, format='json')
		self.assertEqual(r.status_code, 201, r.data)
