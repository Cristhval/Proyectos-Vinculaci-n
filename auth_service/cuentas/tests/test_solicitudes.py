import re
from unittest.mock import patch

from django.core.cache import cache
from rest_framework.test import APITestCase

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
			'documento_identidad': '1100000001',
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
		self.assertEqual(self.solicitar(documento_identidad='1100000002').status_code, 202)
		segunda = Cuenta.objects.get(email='solicitante@unl.edu.ec')
		self.assertNotEqual(primera.id, segunda.id)
