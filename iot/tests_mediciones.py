"""HU-27: recepción de mediciones.

Numeración del documento de diseño: PA-27.1 válida (201), PA-27.2 token inválido,
regenerado o dado de baja (401), PA-27.3 monitoreo OFF (403), PA-27.4 fuera de
rango (400) y PA-27.5 antes de 30 s (429). PA-27.6 (cola del ESP32 al reconectar)
es una verificación manual con hardware: ver docs/m2-dispositivos/README.md.
La consulta paginada es una prueba sin código PA.

POST /api/v1/iot/mediciones/ con ``Authorization: Device <token>`` y
GET /api/v1/dispositivos/{id}/mediciones/ (paginado).
"""
import time
from datetime import timedelta
from unittest import mock

from django.core.cache import cache
from django.test import SimpleTestCase
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework.test import APIClient

from proyectos.models import EstadoProyecto, Proyecto

from .models import DispositivoIoT, Medicion
from .services import EstadoConexion
from .tests import BaseIoT
from .throttling import MedicionDispositivoThrottle

URL = '/api/v1/iot/mediciones/'
LECTURA = {'temperatura': 22.5, 'humedad': 61, 'co2': 640}


class BaseMediciones(BaseIoT):
	def setUp(self):
		super().setUp()
		cache.clear()  # el throttle guarda su historial en la caché
		self.dispositivo, self.token = self.registrado()
		self.esp32 = APIClient()  # sin JWT: solo el token del dispositivo

	def enviar(self, datos=None, token=None, cliente=None):
		cliente = cliente or self.esp32
		cliente.credentials(HTTP_AUTHORIZATION=f'Device {token or self.token}')
		return cliente.post(URL, LECTURA if datos is None else datos, format='json')

	def despues_de(self, segundos):
		"""Simula que pasaron ``segundos`` para el throttle."""
		instante = time.time() + segundos
		return mock.patch.object(MedicionDispositivoThrottle, 'timer', staticmethod(lambda: instante))


class HU27RecepcionMedicionesTests(BaseMediciones):
	def test_pa_27_1_medicion_valida_201_guarda_hora_del_servidor_y_actualiza_ultima_lectura(self):
		antes = timezone.now()
		respuesta = self.enviar({**LECTURA, 'fecha_hora': '2000-01-01T00:00:00Z'})
		despues = timezone.now()
		self.assertEqual(respuesta.status_code, 201, respuesta.data)
		medicion = Medicion.objects.get(dispositivo=self.dispositivo)
		self.assertEqual((medicion.temperatura, medicion.humedad, medicion.co2), (22.5, 61.0, 640.0))
		# La hora la pone el servidor (se ignora la que mande el dispositivo).
		self.assertTrue(antes <= medicion.fecha_hora <= despues)
		self.dispositivo.refresh_from_db()
		self.assertEqual(self.dispositivo.ultima_lectura, medicion.fecha_hora)
		self.assertEqual(parse_datetime(respuesta.data['data']['fecha_hora']), medicion.fecha_hora)
		# Y el estado pasa de Pendiente a En línea.
		detalle = self.client.get(self.url(self.dispositivo)).data['data']
		self.assertEqual(detalle['estado_conexion'], EstadoConexion.EN_LINEA)

	def test_pa_27_4_valores_fuera_de_rango_400(self):
		casos = [
			({'temperatura': -40.1}, 'temperatura'), ({'temperatura': 80.5}, 'temperatura'),
			({'humedad': -1}, 'humedad'), ({'humedad': 100.1}, 'humedad'),
			({'co2': -5}, 'co2'), ({'co2': 10001}, 'co2'),
		]
		for datos, campo in casos:
			cache.clear()
			respuesta = self.enviar(datos)
			self.assertEqual(respuesta.status_code, 400, datos)
			self.assertIn(campo, respuesta.data['data'])
			self.assertIn('debe estar entre', respuesta.data['message'])
		self.assertFalse(Medicion.objects.exists())
		self.dispositivo.refresh_from_db()
		self.assertIsNone(self.dispositivo.ultima_lectura)
		# Los límites exactos sí se aceptan.
		for datos in ({'temperatura': -40, 'humedad': 0, 'co2': 0}, {'temperatura': 80, 'humedad': 100, 'co2': 10000}):
			cache.clear()
			self.assertEqual(self.enviar(datos).status_code, 201, datos)

	def test_pa_27_2_token_invalido_regenerado_o_dado_de_baja_401(self):
		otro = APIClient()
		self.assertEqual(otro.post(URL, LECTURA, format='json').status_code, 401)  # sin encabezado
		for encabezado in ('Device dv_noexiste123', 'Device', 'Device a b', f'Bearer {self.token}'):
			otro.credentials(HTTP_AUTHORIZATION=encabezado)
			respuesta = otro.post(URL, LECTURA, format='json')
			self.assertEqual(respuesta.status_code, 401, encabezado)
			self.assertFalse(respuesta.data['success'])
		# Token regenerado: el anterior ya no sirve.
		nuevo = self.client.post(self.url(self.dispositivo, 'regenerar-token')).data['data']['token']
		self.assertEqual(self.enviar().status_code, 401)
		self.assertEqual(self.enviar(token=nuevo).status_code, 201)
		# Dado de baja → 401.
		self.client.post(self.url(self.dispositivo, 'baja'))
		cache.clear()
		respuesta = self.enviar(token=nuevo)
		self.assertEqual(respuesta.status_code, 401)
		self.assertEqual(respuesta['WWW-Authenticate'], 'Device')
		self.assertEqual(Medicion.objects.count(), 1)

	def test_pa_27_3_monitoreo_desactivado_403_y_se_conserva_el_historial(self):
		self.assertEqual(self.enviar().status_code, 201)
		self.como(self.docente)
		self.client.post(f'/api/v1/proyectos/{self.proyecto.pk}/monitoreo/', {'activo': False}, format='json')
		cache.clear()
		respuesta = self.enviar()
		self.assertEqual(respuesta.status_code, 403)
		self.assertIn('monitoreo ambiental', respuesta.data['message'])
		self.assertEqual(Medicion.objects.filter(dispositivo=self.dispositivo).count(), 1)
		self.assertEqual(self.client.get(self.url(self.dispositivo, 'mediciones')).data['count'], 1)

	def test_pa_27_5_antes_de_30_segundos_429_por_dispositivo(self):
		self.assertEqual(self.enviar().status_code, 201)
		respuesta = self.enviar()
		self.assertEqual(respuesta.status_code, 429)
		self.assertIn('espere', respuesta.data['message'])
		self.assertIn('Retry-After', respuesta)
		with self.despues_de(29):
			self.assertEqual(self.enviar().status_code, 429)
		# Otro dispositivo (aunque venga de la misma IP) no se ve afectado.
		_, token2 = self.registrado(identificador='esp32-b')
		self.assertEqual(self.enviar(token=token2, cliente=APIClient()).status_code, 201)
		with self.despues_de(31):
			self.assertEqual(self.enviar().status_code, 201)
		self.assertEqual(Medicion.objects.filter(dispositivo=self.dispositivo).count(), 2)

	def test_consulta_paginada_con_rango_de_fechas_y_permisos(self):
		base = timezone.now().replace(microsecond=0) - timedelta(days=3)
		Medicion.objects.bulk_create([
			Medicion(dispositivo=self.dispositivo, temperatura=20 + i % 5, fecha_hora=base + timedelta(hours=i))
			for i in range(30)
		])
		url = self.url(self.dispositivo, 'mediciones')
		respuesta = self.client.get(url)
		self.assertEqual(respuesta.status_code, 200)
		self.assertEqual(respuesta.data['count'], 30)
		self.assertEqual(len(respuesta.data['results']), 10)
		self.assertIsNotNone(respuesta.data['next'])
		fechas = [parse_datetime(m['fecha_hora']) for m in respuesta.data['results']]
		self.assertEqual(fechas, sorted(fechas, reverse=True))
		self.assertEqual(len(self.client.get(url, {'page_size': 50}).data['results']), 30)
		# Rango (ambos extremos incluidos).
		desde = (base + timedelta(hours=5)).isoformat()
		hasta = (base + timedelta(hours=14)).isoformat()
		self.assertEqual(self.client.get(url, {'desde': desde, 'hasta': hasta}).data['count'], 10)
		self.assertEqual(self.client.get(url, {'desde': 'ayer'}).status_code, 400)
		# Fecha sin hora: 'hasta' incluye el día completo.
		dia = (base + timedelta(hours=29)).astimezone(timezone.get_current_timezone()).date().isoformat()
		self.assertGreaterEqual(self.client.get(url, {'hasta': dia}).data['count'], 1)
		# Permisos de consulta: quien ve el proyecto sí, el resto 403.
		for perfil in (self.estudiante, self.directivo, self.coordinador):
			self.como(perfil)
			self.assertEqual(self.client.get(url).status_code, 200, perfil.rol)
		for perfil in (self.estudiante_ajeno, self.otro_docente):
			self.como(perfil)
			self.assertEqual(self.client.get(url).status_code, 403, perfil.codigo)
		self.assertEqual(APIClient().get(url).status_code, 401)

	# Sin código PA

	def test_variable_que_el_dispositivo_no_mide_se_ignora(self):
		_, token = self.registrado(identificador='esp32-sin-co2', mide_co2=False)
		respuesta = self.enviar({'temperatura': 20, 'humedad': 50, 'co2': 99999}, token=token, cliente=APIClient())
		self.assertEqual(respuesta.status_code, 201, respuesta.data)
		self.assertEqual(respuesta.data['data']['ignoradas'], ['co2'])
		self.assertIsNone(Medicion.objects.get(dispositivo__identificador='esp32-sin-co2').co2)

	def test_sin_ninguna_variable_valida_400(self):
		for datos in ({}, {'presion': 1013}, {'temperatura': None}):
			cache.clear()
			respuesta = self.enviar(datos)
			self.assertEqual(respuesta.status_code, 400, datos)
			self.assertIn('ningún valor', respuesta.data['message'])
		_, token = self.registrado(identificador='esp32-solo-temp', mide_humedad=False, mide_co2=False)
		respuesta = self.enviar({'humedad': 40}, token=token, cliente=APIClient())
		self.assertEqual(respuesta.status_code, 400)

	def test_valores_no_numericos_400(self):
		for valor in ('caliente', True, 'NaN', 'inf', [1]):
			cache.clear()
			respuesta = self.enviar({'temperatura': valor})
			self.assertEqual(respuesta.status_code, 400, valor)
			self.assertIn('debe ser un número', respuesta.data['message'])

	def test_ultima_lectura_se_actualiza_con_update_sin_auditoria(self):
		from auditoria.models import Auditoria
		antes = Auditoria.objects.count()
		self.enviar()
		self.assertEqual(Auditoria.objects.count(), antes)

	def test_no_acepta_jwt_de_usuario_ni_otros_metodos(self):
		self.como(self.admin)
		self.assertEqual(self.client.post(URL, LECTURA, format='json').status_code, 401)
		self.esp32.credentials(HTTP_AUTHORIZATION=f'Device {self.token}')
		self.assertEqual(self.esp32.get(URL).status_code, 405)


class MedicionesConservadasTests(BaseMediciones):
	"""Pendientes de la Fase 1 (PA-26.1 y PA-26.3) con mediciones reales."""

	def _con_mediciones(self, n=3):
		for i in range(n):
			with self.despues_de(31 * i):
				self.assertEqual(self.enviar({'temperatura': 20 + i}).status_code, 201)
		return list(Medicion.objects.filter(dispositivo=self.dispositivo).values_list('id', flat=True))

	def test_pa_26_1_editar_no_pierde_mediciones(self):
		ids = self._con_mediciones()
		respuesta = self.client.patch(self.url(self.dispositivo), {'nombre': 'Renombrado', 'descripcion': 'x'}, format='json')
		self.assertEqual(respuesta.status_code, 200)
		self.assertEqual(sorted(Medicion.objects.filter(dispositivo=self.dispositivo).values_list('id', flat=True)), sorted(ids))
		self.assertEqual(self.client.get(self.url(self.dispositivo, 'mediciones')).data['count'], 3)

	def test_pa_26_3_dar_de_baja_conserva_las_mediciones(self):
		ids = self._con_mediciones()
		self.assertEqual(self.client.post(self.url(self.dispositivo, 'baja')).status_code, 200)
		self.assertEqual(sorted(Medicion.objects.filter(dispositivo=self.dispositivo).values_list('id', flat=True)), sorted(ids))
		respuesta = self.client.get(self.url(self.dispositivo, 'mediciones'))
		self.assertEqual(respuesta.status_code, 200)
		self.assertEqual(respuesta.data['count'], 3)


class ParseRateThrottleTests(SimpleTestCase):
	def test_acepta_periodos_con_numero(self):
		throttle = MedicionDispositivoThrottle.__new__(MedicionDispositivoThrottle)
		self.assertEqual(throttle.parse_rate('1/30s'), (1, 30))
		self.assertEqual(throttle.parse_rate('2/5m'), (2, 300))
		self.assertEqual(throttle.parse_rate('10/h'), (10, 3600))
		self.assertEqual(throttle.parse_rate(None), (None, None))
