"""Regresión de rendimiento: los listados no deben hacer una consulta por fila (N+1).

Cada prueba mide las consultas de un endpoint con pocos registros y con más
registros; el número debe ser el mismo. Así la prueba no depende del total
exacto de consultas (que cambia si se agrega un filtro) sino de que no crezca.
"""
from django.contrib.auth.models import User
from django.db import connection
from django.test import TestCase, override_settings
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient

from auditoria.models import Auditoria
from convenios.models import Compromiso, Convenio, Institucion, Producto, ProyectoConvenio
from proyectos.models import Actividad, Objetivo, ParticipanteProyecto, Proyecto
from seguimiento.models import Alerta, Avance, Evidencia
from usuarios.models import Usuario
from usuarios.tests_utils import SIMPLE_JWT_TEST, token_para


@override_settings(SIMPLE_JWT=SIMPLE_JWT_TEST)
class ConsultasPorListadoTest(TestCase):
	def setUp(self):
		self.admin = self._perfil('admin', 'ADMIN')
		self.cliente = APIClient()
		self.cliente.credentials(HTTP_AUTHORIZATION=f'Bearer {token_para(self.admin)}')
		self.siguiente = 0

	def _perfil(self, nombre, rol):
		user = User.objects.create(username=nombre, email=f'{nombre}@unl.edu.ec', first_name=nombre, last_name='X')
		return Usuario.objects.create(user=user, codigo=f'C-{nombre}', documento_identidad=f'D-{nombre}', rol=rol, foto=b'x' * 1000)

	def _sembrar(self, cantidad):
		for _ in range(cantidad):
			self.siguiente += 1
			n = self.siguiente
			docente = self._perfil(f'doc{n}', 'DOCENTE')
			estudiante = self._perfil(f'est{n}', 'ESTUDIANTE')
			proyecto = Proyecto.objects.create(codigo=f'P-{n}', titulo=f'P {n}', responsable=docente, coordinador_academico=self.admin)
			Objetivo.objects.create(proyecto=proyecto, descripcion='o')
			actividad = Actividad.objects.create(proyecto=proyecto, codigo=f'A{n}', nombre='a', descripcion='d', responsable=estudiante)
			avance = Avance.objects.create(actividad=actividad, registrado_por=estudiante, descripcion='a', estado='APROBADO')
			Evidencia.objects.create(avance=avance, actividad=actividad, titulo='e')
			ParticipanteProyecto.objects.create(proyecto=proyecto, usuario=estudiante)
			convenio = Convenio.objects.create(institucion=Institucion.objects.create(nombre=f'I{n}'), entidad_contraparte='E', objeto='o')
			Compromiso.objects.create(convenio=convenio, codigo=f'K{n}', descripcion='k', responsable=docente)
			Producto.objects.create(convenio=convenio, codigo=f'R{n}', nombre='r')
			ProyectoConvenio.objects.create(proyecto=proyecto, convenio=convenio)
			Alerta.objects.create(usuario=self.admin, proyecto=proyecto, mensaje='m')
			Auditoria.objects.create(usuario=estudiante, accion='CREAR', entidad='Proyecto', entidad_id=proyecto.pk)

	def _consultas(self, url):
		with CaptureQueriesContext(connection) as ctx:
			respuesta = self.cliente.get(url)
		self.assertEqual(respuesta.status_code, 200, url)
		return len(ctx.captured_queries)

	def assertNoCreceConLasFilas(self, url):
		self._sembrar(2)
		pocas = self._consultas(url)
		self._sembrar(6)
		muchas = self._consultas(url)
		self.assertEqual(pocas, muchas, f'{url}: {pocas} consultas con 2 filas y {muchas} con 8 (N+1)')

	def test_proyectos(self):
		self.assertNoCreceConLasFilas('/api/v1/proyectos/')

	def test_convenios_y_vinculaciones(self):
		self.assertNoCreceConLasFilas('/api/v1/proyecto-convenios/')

	def test_compromisos(self):
		self.assertNoCreceConLasFilas('/api/v1/compromisos/')

	def test_participantes(self):
		self.assertNoCreceConLasFilas('/api/v1/participantes/')

	def test_avances(self):
		self.assertNoCreceConLasFilas('/api/v1/avances/')

	def test_alertas(self):
		self.assertNoCreceConLasFilas('/api/v1/alertas/')

	def test_auditoria(self):
		self.assertNoCreceConLasFilas('/api/v1/auditoria/registros/')

	def test_usuarios(self):
		self.assertNoCreceConLasFilas('/api/v1/usuarios/')

	def test_detalle_de_proyecto(self):
		proyecto = Proyecto.objects.create(codigo='P-D', titulo='D', responsable=self.admin)
		url = f'/api/v1/proyectos/{proyecto.pk}/'

		def agregar(n):
			estudiante = self._perfil(f'pd{n}', 'ESTUDIANTE')
			ParticipanteProyecto.objects.create(proyecto=proyecto, usuario=estudiante)
			Actividad.objects.create(proyecto=proyecto, codigo=f'AD{n}', nombre='a', descripcion='d', responsable=estudiante)
			Objetivo.objects.create(proyecto=proyecto, descripcion='o')

		agregar(0)
		pocas = self._consultas(url)
		for n in range(1, 6):
			agregar(n)
		self.assertEqual(pocas, self._consultas(url))

	def test_detalle_de_convenio(self):
		convenio = Convenio.objects.create(entidad_contraparte='E', objeto='o')
		url = f'/api/v1/convenios/{convenio.pk}/'
		pocas = self._consultas(url)
		for n in range(5):
			Compromiso.objects.create(convenio=convenio, codigo=f'KD{n}', descripcion='k', responsable=self._perfil(f'cd{n}', 'DOCENTE'))
		self.assertEqual(pocas, self._consultas(url))

	def test_horas_cumplidas_iguales_a_la_suma_de_avances_aprobados(self):
		self._sembrar(1)
		participante = ParticipanteProyecto.objects.get()
		actividad = Actividad.objects.get()
		Avance.objects.create(actividad=actividad, registrado_por=participante.usuario, descripcion='b', horas_invertidas='2.50', estado='APROBADO')
		Avance.objects.create(actividad=actividad, registrado_por=participante.usuario, descripcion='c', horas_invertidas='9', estado='PENDIENTE')
		from proyectos.serializers import ParticipanteProyectoSerializer
		datos = self.cliente.get('/api/v1/participantes/').json()['results']
		# Sin anotación el serializer usa el cálculo original (una consulta por fila).
		esperado = ParticipanteProyectoSerializer(participante).data['horas_cumplidas']
		self.assertEqual(datos[0]['horas_cumplidas'], esperado)
		self.assertEqual(float(esperado), 2.5)
