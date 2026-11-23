"""HU-18: monitoreo ambiental ON/OFF (endpoint POST /api/v1/proyectos/{id}/monitoreo/)."""
from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework.test import APITestCase

from auditoria.models import Auditoria, TipoAccion
from proyectos.models import EstadoProyecto, Proyecto
from seguimiento.models import Alerta
from usuarios.models import Usuario
from usuarios.tests_utils import SIMPLE_JWT_TEST, token_para


def crear_perfil(nombre, rol):
	user = User.objects.create(username=nombre, email=f'{nombre}@unl.edu.ec', first_name=nombre, last_name='Prueba')
	return Usuario.objects.create(user=user, codigo=f'C-{nombre}', documento_identidad=f'D-{nombre}', rol=rol)


@override_settings(SIMPLE_JWT=SIMPLE_JWT_TEST)
class MonitoreoProyectoTests(APITestCase):
	def setUp(self):
		self.admin = crear_perfil('admin', 'ADMIN')
		self.coordinador = crear_perfil('coord', 'COORDINADOR')
		self.coordinador2 = crear_perfil('coord2', 'COORDINADOR')
		self.docente = crear_perfil('docente', 'DOCENTE')
		self.otro_docente = crear_perfil('otrodoc', 'DOCENTE')
		self.estudiante = crear_perfil('est', 'ESTUDIANTE')
		self.directivo = crear_perfil('dir', 'DIRECTIVO')
		self.proyecto = Proyecto.objects.create(
			codigo='PV-2026-01', titulo='Huertos urbanos', responsable=self.docente,
			estado=EstadoProyecto.EN_EJECUCION,
		)
		self.url = f'/api/v1/proyectos/{self.proyecto.pk}/monitoreo/'

	def _como(self, perfil):
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_para(perfil)}')

	def _cambiar(self, perfil, activo):
		self._como(perfil)
		return self.client.post(self.url, {'activo': activo}, format='json')

	def test_por_defecto_esta_desactivado_y_se_lee_en_el_detalle(self):
		self.assertFalse(Proyecto.objects.get(pk=self.proyecto.pk).monitoreo_activo)
		self._como(self.admin)
		respuesta = self.client.get(f'/api/v1/proyectos/{self.proyecto.pk}/')
		self.assertEqual(respuesta.status_code, 200)
		self.assertIn('monitoreo_activo', respuesta.data)
		self.assertFalse(respuesta.data['monitoreo_activo'])

	def test_responsable_coordinador_y_admin_pueden_cambiarlo(self):
		for perfil, activo in ((self.docente, True), (self.coordinador, False), (self.admin, True)):
			respuesta = self._cambiar(perfil, activo)
			self.assertEqual(respuesta.status_code, 200, perfil.rol)
			self.proyecto.refresh_from_db()
			self.assertEqual(self.proyecto.monitoreo_activo, activo)

	def test_otros_roles_reciben_403(self):
		for perfil in (self.estudiante, self.directivo, self.otro_docente):
			respuesta = self._cambiar(perfil, True)
			self.assertEqual(respuesta.status_code, 403, perfil.rol)
		self.proyecto.refresh_from_db()
		self.assertFalse(self.proyecto.monitoreo_activo)

	def test_no_se_activa_fuera_de_aprobado_o_en_ejecucion(self):
		for estado in (EstadoProyecto.BORRADOR, EstadoProyecto.EN_REVISION, EstadoProyecto.EN_SUSPENSION,
					   EstadoProyecto.FINALIZADO, EstadoProyecto.CERRADO, EstadoProyecto.CANCELADO):
			Proyecto.objects.filter(pk=self.proyecto.pk).update(estado=estado)
			respuesta = self._cambiar(self.coordinador, True)
			self.assertEqual(respuesta.status_code, 400, estado)
			self.assertIn('aprobados o en ejecución', respuesta.data['message'])
		self.proyecto.refresh_from_db()
		self.assertFalse(self.proyecto.monitoreo_activo)

	def test_se_activa_en_aprobado_y_en_ejecucion(self):
		for estado in (EstadoProyecto.APROBADO, EstadoProyecto.EN_EJECUCION):
			Proyecto.objects.filter(pk=self.proyecto.pk).update(estado=estado, monitoreo_activo=False)
			respuesta = self._cambiar(self.coordinador, True)
			self.assertEqual(respuesta.status_code, 200, estado)
			self.assertTrue(respuesta.data['data']['monitoreo_activo'])

	def test_desactivar_se_permite_en_cualquier_estado(self):
		Proyecto.objects.filter(pk=self.proyecto.pk).update(estado=EstadoProyecto.FINALIZADO, monitoreo_activo=True)
		respuesta = self._cambiar(self.docente, False)
		self.assertEqual(respuesta.status_code, 200)
		self.proyecto.refresh_from_db()
		self.assertFalse(self.proyecto.monitoreo_activo)

	def test_valor_invalido_400(self):
		for cuerpo in ({}, {'activo': 'si'}, {'activo': 1}):
			self._como(self.admin)
			respuesta = self.client.post(self.url, cuerpo, format='json')
			self.assertEqual(respuesta.status_code, 400, cuerpo)

	def test_cada_cambio_genera_auditoria_con_valor_anterior_y_nuevo(self):
		self._cambiar(self.docente, True)
		self._cambiar(self.coordinador, False)
		registros = Auditoria.objects.filter(accion=TipoAccion.MONITOREO, entidad_id=self.proyecto.pk).order_by('creado_en', 'id')
		self.assertEqual(registros.count(), 2)
		primero, segundo = registros
		self.assertEqual(primero.usuario, self.docente)
		self.assertEqual(primero.detalle, {'campo': 'monitoreo_activo', 'anterior': False, 'nuevo': True})
		self.assertEqual(segundo.usuario, self.coordinador)
		self.assertEqual(segundo.detalle, {'campo': 'monitoreo_activo', 'anterior': True, 'nuevo': False})

	def test_sin_cambio_real_no_audita_ni_notifica(self):
		respuesta = self._cambiar(self.coordinador, False)
		self.assertEqual(respuesta.status_code, 200)
		self.assertFalse(Auditoria.objects.filter(accion=TipoAccion.MONITOREO).exists())
		self.assertFalse(Alerta.objects.exists())

	def test_notifica_a_responsable_y_coordinadores_menos_a_quien_cambia(self):
		self._cambiar(self.coordinador, True)
		alertas = Alerta.objects.filter(proyecto=self.proyecto)
		destinatarios = set(alertas.values_list('usuario_id', flat=True))
		self.assertEqual(destinatarios, {self.docente.pk, self.coordinador2.pk})
		alerta_docente = alertas.get(usuario=self.docente)
		self.assertEqual(alerta_docente.mensaje, 'Monitoreo ambiental activado en PV-2026-01')
		self.assertEqual(alerta_docente.enlace, f'/docente/proyectos/{self.proyecto.pk}')
		self.assertEqual(alertas.get(usuario=self.coordinador2).enlace, f'/coordinador/proyectos/{self.proyecto.pk}')

	def test_notificacion_al_desactivar_no_incluye_al_responsable_que_cambia(self):
		Proyecto.objects.filter(pk=self.proyecto.pk).update(monitoreo_activo=True)
		self._cambiar(self.docente, False)
		alertas = Alerta.objects.filter(proyecto=self.proyecto)
		self.assertEqual(set(alertas.values_list('usuario_id', flat=True)), {self.coordinador.pk, self.coordinador2.pk})
		self.assertTrue(all(a.mensaje == 'Monitoreo ambiental desactivado en PV-2026-01' for a in alertas))

	def test_no_se_puede_cambiar_por_patch_del_proyecto(self):
		self._como(self.admin)
		self.client.patch(f'/api/v1/proyectos/{self.proyecto.pk}/', {'monitoreo_activo': True}, format='json')
		self.proyecto.refresh_from_db()
		self.assertFalse(self.proyecto.monitoreo_activo)
