import os
import sys
import random
from datetime import timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto_vinculacion_universidad.settings')

import django
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from usuarios.models import Carrera, Usuario, RolUsuario
from proyectos.models import Proyecto, EstadoProyecto, TipoProyecto, PrioridadProyecto

# ============================================================
# 1. CREAR CARRERAS
# ============================================================
CARRERAS = [
    {'codigo': 'SOFTWARE', 'nombre': 'Ingeniería en Software', 'facultad': 'Facultad de la Energía'},
    {'codigo': 'SISTEMAS', 'nombre': 'Ingeniería en Sistemas', 'facultad': 'Facultad de la Energía'},
    {'codigo': 'COMPUTACION', 'nombre': 'Ingeniería en Computación', 'facultad': 'Facultad de la Energía'},
    {'codigo': 'ELECTRONICA', 'nombre': 'Ingeniería Electrónica', 'facultad': 'Facultad de la Energía'},
    {'codigo': 'INDUSTRIAL', 'nombre': 'Ingeniería Industrial', 'facultad': 'Facultad de la Energía'},
    {'codigo': 'AMBIENTAL', 'nombre': 'Ingeniería Ambiental', 'facultad': 'Facultad de Ciencias'},
    {'codigo': 'BIOLOGIA', 'nombre': 'Biología', 'facultad': 'Facultad de Ciencias'},
    {'codigo': 'QUIMICA', 'nombre': 'Química', 'facultad': 'Facultad de Ciencias'},
    {'codigo': 'MATEMATICAS', 'nombre': 'Matemáticas', 'facultad': 'Facultad de Ciencias'},
    {'codigo': 'FISICA', 'nombre': 'Física', 'facultad': 'Facultad de Ciencias'},
    {'codigo': 'MEDICINA', 'nombre': 'Medicina', 'facultad': 'Facultad de Ciencias Médicas'},
    {'codigo': 'ENFERMERIA', 'nombre': 'Enfermería', 'facultad': 'Facultad de Ciencias Médicas'},
    {'codigo': 'NUTRICION', 'nombre': 'Nutrición y Dietética', 'facultad': 'Facultad de Ciencias Médicas'},
    {'codigo': 'PSICOLOGIA', 'nombre': 'Psicología', 'facultad': 'Facultad de Ciencias Sociales'},
    {'codigo': 'DERECHO', 'nombre': 'Derecho', 'facultad': 'Facultad de Ciencias Sociales'},
    {'codigo': 'ADMINISTRACION', 'nombre': 'Administración de Empresas', 'facultad': 'Facultad de Ciencias Sociales'},
    {'codigo': 'CONTABILIDAD', 'nombre': 'Contabilidad y Auditoría', 'facultad': 'Facultad de Ciencias Sociales'},
    {'codigo': 'ECONOMIA', 'nombre': 'Economía', 'facultad': 'Facultad de Ciencias Sociales'},
    {'codigo': 'EDUCACION', 'nombre': 'Educación Básica', 'facultad': 'Facultad de Humanidades'},
    {'codigo': 'LENGUA', 'nombre': 'Lengua y Literatura', 'facultad': 'Facultad de Humanidades'},
]

print('Creando carreras...')
carreras_creadas = []
for c in CARRERAS:
    carrera, created = Carrera.objects.get_or_create(
        codigo=c['codigo'],
        defaults={'nombre': c['nombre'], 'facultad': c['facultad']}
    )
    carreras_creadas.append(carrera)
    if created:
        print(f'  + {carrera.nombre}')
    else:
        print(f'  = {carrera.nombre} (ya existe)')

# ============================================================
# 2. CREAR DOCENTES
# ============================================================
DOCENTES = [
    {'username': 'docente1', 'first_name': 'Carlos', 'last_name': 'Mendoza', 'codigo': 'DOC-00010'},
    {'username': 'docente2', 'first_name': 'Ana', 'last_name': 'Martínez', 'codigo': 'DOC-00011'},
    {'username': 'docente3', 'first_name': 'Luis', 'last_name': 'Hernández', 'codigo': 'DOC-00012'},
    {'username': 'docente4', 'first_name': 'María', 'last_name': 'García', 'codigo': 'DOC-00013'},
    {'username': 'docente5', 'first_name': 'Pedro', 'last_name': 'López', 'codigo': 'DOC-00014'},
]

print('\nCreando docentes...')
docentes_objs = []
for d in DOCENTES:
    if User.objects.filter(username=d['username']).exists():
        user = User.objects.get(username=d['username'])
        try:
            usuario = Usuario.objects.get(user=user)
        except Usuario.DoesNotExist:
            carrera_random = random.choice(carreras_creadas)
            usuario = Usuario.objects.create(
                user=user, codigo=d['codigo'],
                rol=RolUsuario.DOCENTE, carrera=carrera_random
            )
        print(f'  = {d["username"]} (ya existe)')
    else:
        user = User.objects.create_user(
            username=d['username'], password='Docente123!',
            first_name=d['first_name'], last_name=d['last_name'],
            email=f'{d["username"]}@unl.edu.ec'
        )
        carrera_random = random.choice(carreras_creadas)
        usuario = Usuario.objects.create(
            user=user, codigo=d['codigo'],
            rol=RolUsuario.DOCENTE, carrera=carrera_random
        )
        print(f'  + {d["username"]} ({d["first_name"]} {d["last_name"]})')
    docentes_objs.append(usuario)

# ============================================================
# 3. CREAR PROYECTOS
# ============================================================
PROYECTOS = [
    {
        'titulo': 'Alfabetización Digital para Comunidades Rurales',
        'resumen': 'Programa de capacitación en herramientas tecnológicas para poblaciones rurales de la provincia de Loja.',
        'problema': 'Las comunidades rurales carecen de acceso y conocimiento en tecnologías de información.',
        'justificacion': 'La brecha digital limita el desarrollo socioeconómico de las poblaciones rurales.',
        'objetivo_general': 'Capacitar a 200 personas en el uso básico de computadoras e internet.',
        'tipo': 'VINCULACION',
        'prioridad': 'ALTA',
    },
    {
        'titulo': 'Monitoreo de Calidad del Agua en Ríos Urbanos',
        'resumen': 'Investigación sobre la contaminación hídrica en los ríos que atraviesan la ciudad de Loja.',
        'problema': 'Los ríos urbanos presentan niveles críticos de contaminación por desechos industriales.',
        'justificacion': 'Es necesario evaluar la calidad del agua para proponer soluciones ambientales.',
        'objetivo_general': 'Analizar la calidad del agua en 5 puntos de muestreo durante 12 meses.',
        'tipo': 'INVESTIGACION',
        'prioridad': 'ALTA',
    },
    {
        'titulo': 'Huertos Comunitarios para Seguridad Alimentaria',
        'resumen': 'Implementación de huertos orgánicos en barrios periurbanos para mejorar la alimentación.',
        'problema': 'Falta de acceso a alimentos frescos y nutritivos en zonas de alta vulnerabilidad.',
        'justificacion': 'Los huertos comunitarios fortalecen la soberanía alimentaria local.',
        'objetivo_general': 'Establecer 10 huertos comunitarios que beneficien a 50 familias.',
        'tipo': 'EXTENSION',
        'prioridad': 'MEDIA',
    },
    {
        'titulo': 'Desarrollo de App para Gestión de Residuos',
        'resumen': 'Creación de una aplicación móvil para optimizar la recolección de residuos sólidos.',
        'problema': 'La gestión ineficiente de residuos genera acumulación y problemas sanitarios.',
        'justificacion': 'La tecnología puede mejorar los procesos de recolección y reciclaje.',
        'objetivo_general': 'Desarrollar e implementar una app que optimice rutas de recolección.',
        'tipo': 'MIXTO',
        'prioridad': 'MEDIA',
    },
    {
        'titulo': 'Talleres de Emprendimiento Juvenil',
        'resumen': 'Capacitación en habilidades empresariales para jóvenes de la UNL.',
        'problema': 'Los jóvenes egresados carecen de competencias para generar sus propios empleos.',
        'justificacion': 'El emprendimiento es clave para la inserción laboral y el desarrollo económico.',
        'objetivo_general': 'Capacitar a 100 estudiantes en planificación y gestión de negocios.',
        'tipo': 'VINCULACION',
        'prioridad': 'MEDIA',
    },
    {
        'titulo': 'Rehabilitación de Ecosistemas Manglar',
        'resumen': 'Proyecto de restauración ecológica de manglares en la costa ecuatoriana.',
        'problema': 'Los manglares han perdido el 40% de su cobertura por actividad humana.',
        'justificacion': 'Los manglares son ecosistemas vitales para la biodiversidad costera.',
        'objetivo_general': 'Reforestar 5 hectáreas de manglar en la provincia de El Oro.',
        'tipo': 'INVESTIGACION',
        'prioridad': 'CRITICA',
    },
    {
        'titulo': 'Programa de Salud Mental Universitaria',
        'resumen': 'Atención psicológica gratuita para estudiantes de la UNL con estrés académico.',
        'problema': 'Alto índice de ansiedad y depresión en estudiantes universitarios.',
        'justificacion': 'La salud mental es fundamental para el rendimiento académico.',
        'objetivo_general': 'Brindar atención psicológica a 300 estudiantes durante el semestre.',
        'tipo': 'EXTENSION',
        'prioridad': 'ALTA',
    },
    {
        'titulo': 'Energía Solar para Comunidades Indígenas',
        'resumen': 'Instalación de paneles solares en comunidades sin acceso a red eléctrica.',
        'problema': 'Comunidades aisladas dependen de combustibles fósiles contaminantes.',
        'justificacion': 'La energía solar es una alternativa limpia y sostenible.',
        'objetivo_general': 'Instalar sistemas solares en 15 viviendas comunitarias.',
        'tipo': 'VINCULACION',
        'prioridad': 'ALTA',
    },
    {
        'titulo': 'Catalogación de Flora del Bosque Seco',
        'resumen': 'Inventario botánico del bosque seco tropical en la provincia de Loja.',
        'problema': 'El bosque seco está amenazado y muchas especies no han sido documentadas.',
        'justificacion': 'La catalogación es esencial para estrategias de conservación.',
        'objetivo_general': 'Identificar y catalogar 200 especies de flora del bosque seco.',
        'tipo': 'INVESTIGACION',
        'prioridad': 'MEDIA',
    },
    {
        'titulo': 'Festival Cultural de Vinculación Comunitaria',
        'resumen': 'Evento cultural que integra a la universidad con la comunidad lojana.',
        'problema': 'Distanciamiento entre la actividad universitaria y la comunidad local.',
        'justificacion': 'La cultura es un puente para la integración universidad-sociedad.',
        'objetivo_general': 'Organizar un festival que involucre a 500 personas de la comunidad.',
        'tipo': 'EXTENSION',
        'prioridad': 'BAJA',
    },
]

ESTADOS = [
    EstadoProyecto.BORRADOR,
    EstadoProyecto.EN_REVISION,
    EstadoProyecto.APROBADO,
    EstadoProyecto.EN_EJECUCION,
    EstadoProyecto.FINALIZADO,
]

print('\nCreando proyectos...')
for i, p_data in enumerate(PROYECTOS):
    docente = docentes_objs[i % len(docentes_objs)]
    carrera = carreras_creadas[i % len(carreras_creadas)]
    estado = ESTADOS[i % len(ESTADOS)]

    fecha_inicio = timezone.now().date() - timedelta(days=random.randint(30, 180))
    fecha_fin = fecha_inicio + timedelta(days=random.randint(90, 365))

    proyecto, created = Proyecto.objects.get_or_create(
        titulo=p_data['titulo'],
        defaults={
            'codigo': f'PRY-{1000 + i:04d}',
            'resumen': p_data['resumen'],
            'descripcion': p_data['resumen'],
            'problema': p_data['problema'],
            'justificacion': p_data['justificacion'],
            'objetivo_general': p_data['objetivo_general'],
            'resultados_esperados': 'Resultados esperados del proyecto.',
            'linea_intervencion': 'Desarrollo Social',
            'tipo': p_data['tipo'],
            'prioridad': p_data['prioridad'],
            'estado': estado,
            'carrera': carrera,
            'responsable': docente,
            'fecha_inicio': fecha_inicio,
            'fecha_fin_planificada': fecha_fin,
            'presupuesto_aprobado': round(random.uniform(500, 15000), 2),
            'direccion_ejecucion': 'Loja, Ecuador',
            'observaciones': '',
        }
    )
    if created:
        print(f'  + [{proyecto.codigo}] {proyecto.titulo} ({proyecto.estado})')
    else:
        print(f'  = [{proyecto.codigo}] {proyecto.titulo} (ya existe)')

print('\n--- RESUMEN ---')
print(f'Carreras: {Carrera.objects.count()}')
print(f'Docentes: {Usuario.objects.filter(rol=RolUsuario.DOCENTE).count()}')
print(f'Proyectos: {Proyecto.objects.count()}')
print('\nCredenciales docentes:')
for d in DOCENTES:
    print(f'  {d["username"]} / Docente123!')
