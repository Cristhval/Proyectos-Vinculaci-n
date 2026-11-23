"""Pruebas de aceptación del Módulo 2, Fase 1: HU-25 (registro), HU-26 (token) y HU-28 (baja).

Los nombres siguen los casos PA-25.x, PA-26.x y PA-28.x.
"""
import hashlib
import json
from datetime import datetime, timedelta, timezone as dt_timezone

from django.contrib.auth.models import User
from django.test import SimpleTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from auditoria.models import Auditoria, TipoAccion
from proyectos.models import EstadoProyecto, ParticipanteProyecto, Proyecto
from usuarios.models import Usuario
from usuarios.tests_utils import SIMPLE_JWT_TEST, token_para

from .models import DispositivoIoT
from .services import (
	EstadoConexion,
	EstadoPorUmbralMinutos,
	TokenDispositivoFactory,
	TokenInvalido,
	validar_token,
)


def crear_perfil(nombre, rol):
	user = User.objects.create(username=nombre, email=f'{nombre}@unl.edu.ec', first_name=nombre, last_name='Prueba')
	return Usuario.objects.create(user=user, codigo=f'C-{nombre}', documento_identidad=f'D-{nombre}', rol=rol)


DATOS = {'identificador': 'esp32-huerto-01', 'nombre': 'Sensor huerto', 'descripcion': 'Invernadero norte'}


@override_settings(SIMPLE_JWT=SIMPLE_JWT_TEST)
class BaseIoT(APITestCase):
	def setUp(self):
		self.admin = crear_perfil('admin', 'ADMIN')
		self.coordinador = crear_perfil('coord', 'COORDINADOR')
		self.docente = crear_perfil('docente', 'DOCENTE')
		self.otro_docente = crear_perfil('otrodoc', 'DOCENTE')
		self.estudiante = crear_perfil('est', 'ESTUDIANTE')
		self.estudiante_ajeno = crear_perfil('est2', 'ESTUDIANTE')
		self.directivo = crear_perfil('dir', 'DIRECTIVO')
		self.proyecto = Proyecto.objects.create(
			codigo='PV-2026-01', titulo='Huertos urbanos', responsable=self.docente,
			estado=EstadoProyecto.EN_EJECUCION, monitoreo_activo=True,
		)
		ParticipanteProyecto.objects.create(proyecto=self.proyecto, usuario=self.estudiante)
		self.url_lista = f'/api/v1/proyectos/{self.proyecto.pk}/dispositivos/'

	def como(self, perfil):
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_para(perfil)}')

	def registrar(self, perfil=None, **cambios):
		self.como(perfil or self.docente)
		return self.client.post(self.url_lista, {**DATOS, **cambios}, format='json')

	def registrado(self, **cambios):
		"""Registra como responsable y devuelve ``(dispositivo, token)``."""
		respuesta = self.registrar(**cambios)
		self.assertEqual(respuesta.status_code, 201, respuesta.data)
		datos = respuesta.data['data']
		return DispositivoIoT.objects.get(pk=datos['dispositivo']['id']), datos['token']

	def url(self, dispositivo, accion=''):
		return f'/api/v1/dispositivos/{dispositivo.pk}/' + (f'{accion}/' if accion else '')


# --- HU-25: registrar y consultar dispositivos ------------------------------------

class HU25RegistroDispositivoTests(BaseIoT):
	def test_pa_25_1_registro_exitoso_devuelve_token_una_vez_y_guarda_solo_el_hash(self):
		respuesta = self.registrar()
		self.assertEqual(respuesta.status_code, 201)
		datos = respuesta.data['data']
		token = datos['token']
		self.assertTrue(token.startswith('dv_'))
		self.assertGreaterEqual(len(token), 40)
		self.assertIn('no se volverá a mostrar', datos['aviso'])
		dispositivo = DispositivoIoT.objects.get(identificador='esp32-huerto-01')
		self.assertEqual(dispositivo.token_hash, hashlib.sha256(token.encode()).hexdigest())
		self.assertNotEqual(dispositivo.token_hash, token)
		self.assertEqual(datos['dispositivo']['estado_conexion'], EstadoConexion.PENDIENTE)
		self.assertIsNone(datos['dispositivo']['ultima_lectura'])

	def test_pa_25_2_por_defecto_mide_las_tres_variables(self):
		dispositivo, _ = self.registrado()
		self.assertTrue(dispositivo.mide_temperatura)
		self.assertTrue(dispositivo.mide_humedad)
		self.assertTrue(dispositivo.mide_co2)

	def test_pa_25_3_monitoreo_desactivado_rechaza_el_registro(self):
		Proyecto.objects.filter(pk=self.proyecto.pk).update(monitoreo_activo=False)
		respuesta = self.registrar()
		self.assertEqual(respuesta.status_code, 400)
		self.assertIn('monitoreo ambiental', respuesta.data['message'])
		self.assertFalse(DispositivoIoT.objects.exists())

	def test_pa_25_4_identificador_repetido_400(self):
		self.registrado()
		otro = Proyecto.objects.create(codigo='PV-2026-02', titulo='Otro', responsable=self.docente,
									   estado=EstadoProyecto.APROBADO, monitoreo_activo=True)
		self.como(self.docente)
		respuesta = self.client.post(f'/api/v1/proyectos/{otro.pk}/dispositivos/', DATOS, format='json')
		self.assertEqual(respuesta.status_code, 400)
		self.assertIn('Ya existe un dispositivo con el identificador', respuesta.data['message'])
		self.assertEqual(DispositivoIoT.objects.count(), 1)

	def test_pa_25_5_debe_medir_al_menos_una_variable(self):
		respuesta = self.registrar(mide_temperatura=False, mide_humedad=False, mide_co2=False)
		self.assertEqual(respuesta.status_code, 400)
		self.assertIn('al menos una variable', respuesta.data['message'])

	def test_pa_25_6_datos_invalidos_400_con_mensaje_en_espanol(self):
		respuesta = self.registrar(identificador='con espacios!')
		self.assertEqual(respuesta.status_code, 400)
		self.assertIn('identificador', respuesta.data['message'])
		respuesta = self.registrar(identificador='esp32-b', nombre='')
		self.assertEqual(respuesta.status_code, 400)
		self.assertIn('nombre', respuesta.data['message'])

	def test_pa_25_7_estudiante_y_directivo_no_pueden_registrar_403(self):
		for perfil in (self.estudiante, self.directivo):
			respuesta = self.registrar(perfil)
			self.assertEqual(respuesta.status_code, 403, perfil.rol)
		self.assertFalse(DispositivoIoT.objects.exists())

	def test_pa_25_8_docente_que_no_es_responsable_403(self):
		respuesta = self.registrar(self.otro_docente)
		self.assertEqual(respuesta.status_code, 403)

	def test_pa_25_9_coordinador_y_admin_pueden_registrar(self):
		self.assertEqual(self.registrar(self.coordinador, identificador='esp32-c').status_code, 201)
		self.assertEqual(self.registrar(self.admin, identificador='esp32-a').status_code, 201)

	def test_pa_25_10_consulta_solo_para_quien_ve_el_proyecto(self):
		self.registrado()
		for perfil in (self.docente, self.estudiante, self.directivo, self.coordinador, self.admin):
			self.como(perfil)
			respuesta = self.client.get(self.url_lista)
			self.assertEqual(respuesta.status_code, 200, perfil.rol)
			self.assertEqual(len(respuesta.data['data']), 1)
		for perfil in (self.estudiante_ajeno, self.otro_docente):
			self.como(perfil)
			self.assertEqual(self.client.get(self.url_lista).status_code, 403, perfil.codigo)

	def test_pa_25_11_el_token_no_aparece_en_get_ni_en_la_auditoria(self):
		dispositivo, token = self.registrado()
		self.como(self.admin)
		for url in (self.url_lista, self.url(dispositivo)):
			cuerpo = json.dumps(self.client.get(url).data, default=str)
			self.assertNotIn(token, cuerpo)
			self.assertNotIn(dispositivo.token_hash, cuerpo)
			self.assertNotIn('token', cuerpo)
		self.client.post(self.url(dispositivo, 'regenerar-token'))
		self.client.patch(self.url(dispositivo), {'nombre': 'Nuevo'}, format='json')
		self.client.post(self.url(dispositivo, 'baja'))
		auditoria = json.dumps(list(Auditoria.objects.values()), default=str)
		self.assertNotIn(token, auditoria)
		self.assertNotIn('dv_', auditoria)
		self.assertNotIn('token_hash', auditoria)

	def test_pa_25_12_registro_y_edicion_quedan_en_auditoria(self):
		dispositivo, _ = self.registrado()
		self.client.patch(self.url(dispositivo), {'nombre': 'Nuevo'}, format='json')
		acciones = set(Auditoria.objects.filter(entidad='DispositivoIoT', entidad_id=dispositivo.pk)
					   .values_list('accion', flat=True))
		self.assertEqual(acciones, {TipoAccion.CREAR, TipoAccion.ACTUALIZAR})

	def test_pa_25_13_editar_solo_nombre_y_descripcion_sin_perder_datos(self):
		dispositivo, token = self.registrado()
		lectura = timezone.now() - timedelta(minutes=1)
		DispositivoIoT.objects.filter(pk=dispositivo.pk).update(ultima_lectura=lectura)
		respuesta = self.client.patch(self.url(dispositivo), {'nombre': 'Huerto sur', 'descripcion': 'Movido'}, format='json')
		self.assertEqual(respuesta.status_code, 200)
		dispositivo.refresh_from_db()
		self.assertEqual((dispositivo.nombre, dispositivo.descripcion), ('Huerto sur', 'Movido'))
		self.assertEqual(dispositivo.identificador, 'esp32-huerto-01')
		self.assertEqual(dispositivo.ultima_lectura, lectura)
		self.assertEqual(validar_token(token).pk, dispositivo.pk)
		# Otros campos: 400 y sin cambios.
		respuesta = self.client.patch(self.url(dispositivo), {'identificador': 'otro', 'mide_co2': False}, format='json')
		self.assertEqual(respuesta.status_code, 400)
		self.assertIn('Solo se pueden editar', respuesta.data['message'])
		dispositivo.refresh_from_db()
		self.assertEqual(dispositivo.identificador, 'esp32-huerto-01')
		self.assertTrue(dispositivo.mide_co2)

	def test_pa_25_14_editar_sin_permiso_403(self):
		dispositivo, _ = self.registrado()
		for perfil in (self.estudiante, self.directivo, self.otro_docente):
			self.como(perfil)
			respuesta = self.client.patch(self.url(dispositivo), {'nombre': 'x'}, format='json')
			self.assertEqual(respuesta.status_code, 403, perfil.rol)


class HU25EstadoConexionTests(BaseIoT):
	"""Estado de conexión con tiempos simulados (umbral IOT_MINUTOS_EN_LINEA = 5)."""

	def _estado_api(self, ultima_lectura):
		dispositivo, _ = self.registrado()
		DispositivoIoT.objects.filter(pk=dispositivo.pk).update(ultima_lectura=ultima_lectura)
		respuesta = self.client.get(self.url(dispositivo))
		return respuesta.data['data']

	def test_pa_25_15_en_linea_si_la_ultima_lectura_es_de_hace_5_min_o_menos(self):
		datos = self._estado_api(timezone.now() - timedelta(minutes=4))
		self.assertEqual(datos['estado_conexion'], EstadoConexion.EN_LINEA)
		self.assertEqual(datos['estado_conexion_display'], 'En línea')
		self.assertIsNotNone(datos['ultima_lectura'])

	def test_pa_25_16_sin_conexion_si_la_ultima_lectura_es_de_hace_mas_de_5_min(self):
		datos = self._estado_api(timezone.now() - timedelta(minutes=6))
		self.assertEqual(datos['estado_conexion'], EstadoConexion.SIN_CONEXION)
		self.assertEqual(datos['estado_conexion_display'], 'Sin conexión')

	def test_pa_25_17_pendiente_si_nunca_envio_datos(self):
		datos = self._estado_api(None)
		self.assertEqual(datos['estado_conexion'], EstadoConexion.PENDIENTE)
		self.assertEqual(datos['estado_conexion_display'], 'Pendiente de primera lectura')


@override_settings(IOT_MINUTOS_EN_LINEA=5)
class EstrategiaEstadoConexionTests(SimpleTestCase):
	"""Strategy aislada con un reloj fijo."""

	AHORA = datetime(2026, 11, 23, 12, 0, tzinfo=dt_timezone.utc)

	def test_pa_25_18_limites_exactos_del_umbral(self):
		estrategia = EstadoPorUmbralMinutos()
		casos = [
			(None, EstadoConexion.PENDIENTE),
			(self.AHORA, EstadoConexion.EN_LINEA),
			(self.AHORA - timedelta(minutes=5), EstadoConexion.EN_LINEA),
			(self.AHORA - timedelta(minutes=5, seconds=1), EstadoConexion.SIN_CONEXION),
			(self.AHORA - timedelta(days=3), EstadoConexion.SIN_CONEXION),
		]
		for ultima, esperado in casos:
			self.assertEqual(estrategia.calcular(ultima, self.AHORA), esperado, ultima)

	@override_settings(IOT_MINUTOS_EN_LINEA=10)
	def test_pa_25_19_el_umbral_se_lee_de_settings(self):
		ultima = self.AHORA - timedelta(minutes=8)
		self.assertEqual(EstadoPorUmbralMinutos().calcular(ultima, self.AHORA), EstadoConexion.EN_LINEA)
		self.assertEqual(EstadoPorUmbralMinutos(minutos=5).calcular(ultima, self.AHORA), EstadoConexion.SIN_CONEXION)


# --- HU-26: token del dispositivo ----------------------------------------------

class HU26TokenDispositivoTests(BaseIoT):
	def test_pa_26_1_factory_genera_tokens_unicos_con_prefijo_y_hash_sha256(self):
		tokens = {TokenDispositivoFactory.crear()[0] for _ in range(50)}
		self.assertEqual(len(tokens), 50)
		token, token_hash = TokenDispositivoFactory.crear()
		self.assertTrue(token.startswith('dv_'))
		self.assertEqual(token_hash, hashlib.sha256(token.encode()).hexdigest())
		self.assertEqual(len(token_hash), 64)

	def test_pa_26_2_validar_token_acepta_el_vigente_y_rechaza_otros(self):
		dispositivo, token = self.registrado()
		self.assertEqual(validar_token(token).pk, dispositivo.pk)
		for malo in ('', 'sin-prefijo', 'dv_', token + 'x', token.replace('dv_', 'xx_'), None):
			with self.assertRaises(TokenInvalido, msg=repr(malo)):
				validar_token(malo)

	def test_pa_26_3_regenerar_devuelve_token_nuevo_e_invalida_el_anterior(self):
		dispositivo, anterior = self.registrado()
		respuesta = self.client.post(self.url(dispositivo, 'regenerar-token'))
		self.assertEqual(respuesta.status_code, 200)
		nuevo = respuesta.data['data']['token']
		self.assertTrue(nuevo.startswith('dv_'))
		self.assertNotEqual(nuevo, anterior)
		self.assertIn('no se volverá a mostrar', respuesta.data['data']['aviso'])
		with self.assertRaises(TokenInvalido):
			validar_token(anterior)
		self.assertEqual(validar_token(nuevo).pk, dispositivo.pk)

	def test_pa_26_4_regenerar_token_de_dispositivo_dado_de_baja_400(self):
		dispositivo, _ = self.registrado()
		self.client.post(self.url(dispositivo, 'baja'))
		respuesta = self.client.post(self.url(dispositivo, 'regenerar-token'))
		self.assertEqual(respuesta.status_code, 400)
		self.assertEqual(respuesta.data['message'], 'No se puede regenerar el token de un dispositivo dado de baja.')

	def test_pa_26_5_regenerar_sin_permiso_403(self):
		dispositivo, token = self.registrado()
		for perfil in (self.estudiante, self.directivo, self.otro_docente):
			self.como(perfil)
			self.assertEqual(self.client.post(self.url(dispositivo, 'regenerar-token')).status_code, 403, perfil.rol)
		self.assertEqual(validar_token(token).pk, dispositivo.pk)

	def test_pa_26_6_regeneracion_auditada_sin_el_token(self):
		dispositivo, _ = self.registrado()
		self.como(self.coordinador)
		respuesta = self.client.post(self.url(dispositivo, 'regenerar-token'))
		nuevo = respuesta.data['data']['token']
		registro = Auditoria.objects.get(accion=TipoAccion.REGENERAR_TOKEN, entidad_id=dispositivo.pk)
		self.assertEqual(registro.usuario, self.coordinador)
		self.assertEqual(registro.detalle, {'identificador': 'esp32-huerto-01', 'proyecto': self.proyecto.pk})
		self.assertNotIn(nuevo, json.dumps(registro.detalle))
		# update(): no se agrega un ACTUALIZAR genérico por la regeneración.
		self.assertFalse(Auditoria.objects.filter(accion=TipoAccion.ACTUALIZAR, entidad='DispositivoIoT').exists())


# --- HU-28: dar de baja ----------------------------------------------------------

class HU28BajaDispositivoTests(BaseIoT):
	def test_pa_28_1_la_baja_invalida_el_token(self):
		dispositivo, token = self.registrado()
		respuesta = self.client.post(self.url(dispositivo, 'baja'))
		self.assertEqual(respuesta.status_code, 200)
		self.assertFalse(respuesta.data['data']['activo'])
		self.assertIsNotNone(respuesta.data['data']['fecha_baja'])
		with self.assertRaises(TokenInvalido):
			validar_token(token)

	def test_pa_28_2_la_baja_conserva_el_dispositivo_y_sus_datos(self):
		dispositivo, _ = self.registrado()
		lectura = timezone.now() - timedelta(minutes=30)
		DispositivoIoT.objects.filter(pk=dispositivo.pk).update(ultima_lectura=lectura)
		self.client.post(self.url(dispositivo, 'baja'))
		dispositivo.refresh_from_db()
		self.assertFalse(dispositivo.activo)
		self.assertEqual(dispositivo.ultima_lectura, lectura)
		respuesta = self.client.get(self.url_lista)
		self.assertEqual([d['id'] for d in respuesta.data['data']], [dispositivo.pk])
		self.assertEqual(self.client.get(self.url_lista + '?activo=true').data['data'], [])

	def test_pa_28_3_la_baja_queda_en_auditoria(self):
		dispositivo, _ = self.registrado()
		self.client.post(self.url(dispositivo, 'baja'))
		registro = Auditoria.objects.get(accion=TipoAccion.BAJA, entidad_id=dispositivo.pk)
		self.assertEqual(registro.usuario, self.docente)
		self.assertEqual(registro.entidad, 'DispositivoIoT')

	def test_pa_28_4_no_se_da_de_baja_dos_veces(self):
		dispositivo, _ = self.registrado()
		self.client.post(self.url(dispositivo, 'baja'))
		respuesta = self.client.post(self.url(dispositivo, 'baja'))
		self.assertEqual(respuesta.status_code, 400)
		self.assertIn('ya está dado de baja', respuesta.data['message'])

	def test_pa_28_5_baja_sin_permiso_403(self):
		dispositivo, _ = self.registrado()
		for perfil in (self.estudiante, self.directivo, self.otro_docente):
			self.como(perfil)
			self.assertEqual(self.client.post(self.url(dispositivo, 'baja')).status_code, 403, perfil.rol)
		dispositivo.refresh_from_db()
		self.assertTrue(dispositivo.activo)

	def test_pa_28_6_no_se_edita_un_dispositivo_dado_de_baja(self):
		dispositivo, _ = self.registrado()
		self.client.post(self.url(dispositivo, 'baja'))
		respuesta = self.client.patch(self.url(dispositivo), {'nombre': 'x'}, format='json')
		self.assertEqual(respuesta.status_code, 400)
