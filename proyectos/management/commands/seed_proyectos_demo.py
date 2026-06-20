from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth.models import User

from proyectos.models import (
    Proyecto, EstadoProyecto, TipoProyecto, PrioridadProyecto,
    EstadoActividad, EstadoPresupuesto, RolParticipante,
    Actividad, ParticipanteProyecto, Presupuesto, Beneficiario,
    AlineacionEstrategica, Objetivo, TipoObjetivo,
)
from seguimiento.models import (
    Avance, Evidencia, Informe, EstadoAvance, TipoEvidencia, TipoInforme,
)
from usuarios.models import Usuario, Carrera, RolUsuario


class Command(BaseCommand):
    help = 'Crea 4 proyectos de demostración realistas para probar el flujo completo del sistema.'

    def handle(self, *args, **options):
        faltantes = []
        contadores = {
            'proyectos_creados': 0,
            'proyectos_existentes': 0,
            'participantes_creados': 0,
            'actividades_creadas': 0,
            'avances_creados': 0,
            'evidencias_creadas': 0,
            'informes_creados': 0,
            'alineaciones_creadas': 0,
            'beneficiarios_creados': 0,
            'presupuestos_creados': 0,
            'objetivos_creados': 0,
        }
        proyectos_resumen = []

        with transaction.atomic():
            # ------------------------------------------------------------------
            # 1. Verificar/crear estudiantes de prueba si faltan
            # ------------------------------------------------------------------
            estudiantes_existentes = list(Usuario.objects.filter(rol=RolUsuario.ESTUDIANTE).order_by('id'))
            if len(estudiantes_existentes) < 8:
                faltantes.append({
                    'proyecto': 'General',
                    'intentado': 'Crear estudiantes adicionales',
                    'error': 'Solo hay {} estudiantes; se recomienda al menos 8.'.format(len(estudiantes_existentes)),
                    'tipo': 'validacion'
                })
                self.stdout.write(self.style.WARNING('Solo hay {} estudiantes en el sistema. Se usarán los disponibles.'.format(len(estudiantes_existentes))))

            # ------------------------------------------------------------------
            # Helpers
            # ------------------------------------------------------------------
            def get_user(username, first_name, last_name, email, codigo, rol, carrera=None):
                user, _ = User.objects.get_or_create(username=username, defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                    'email': email,
                })
                usuario, _ = Usuario.objects.get_or_create(codigo=codigo, defaults={
                    'user': user,
                    'rol': rol,
                    'carrera': carrera,
                    'documento_identidad': codigo,
                })
                return usuario

            def safe_create(description, proyecto_codigo, fn):
                try:
                    return fn()
                except Exception as e:
                    tipo_err = 'modelo_inexistente' if 'does not exist' in str(e).lower() or 'no such table' in str(e).lower() else 'campo_inexistente' if 'has no column' in str(e).lower() or 'unknown column' in str(e).lower() else 'validacion'
                    faltantes.append({
                        'proyecto': proyecto_codigo,
                        'intentado': description,
                        'error': str(e),
                        'tipo': tipo_err,
                    })
                    return None

            # ------------------------------------------------------------------
            # Carreras y usuarios base (ya existen en BD)
            # ------------------------------------------------------------------
            carrera_software = Carrera.objects.filter(id=1).first()
            carrera_enfermeria = Carrera.objects.filter(id=12).first()
            carrera_ambiental = Carrera.objects.filter(id=6).first()
            carrera_biologia = Carrera.objects.filter(id=7).first()

            docentes = list(Usuario.objects.filter(rol=RolUsuario.DOCENTE).order_by('id'))
            coordinadores = list(Usuario.objects.filter(rol=RolUsuario.COORDINADOR).order_by('id'))
            estudiantes = estudiantes_existentes

            # Fallbacks robustos
            def pick_docente(idx):
                return docentes[idx % len(docentes)] if docentes else None

            def pick_coordinador(idx):
                return coordinadores[idx % len(coordinadores)] if coordinadores else None

            def pick_estudiante(idx):
                return estudiantes[idx % len(estudiantes)] if estudiantes else None

            # ------------------------------------------------------------------
            # Datos de los 4 proyectos
            # ------------------------------------------------------------------
            proyectos_data = [
                {
                    'codigo': 'PRY-2026-001',
                    'titulo': 'Alfabetización digital para adultos mayores de la comunidad Loja',
                    'tipo': TipoProyecto.VINCULACION,
                    'prioridad': PrioridadProyecto.BAJA,
                    'estado': EstadoProyecto.BORRADOR,
                    'carrera': carrera_software,
                    'responsable': pick_docente(0),
                    'coordinador': pick_coordinador(0),
                    'fecha_inicio': '2026-02-01',
                    'fecha_fin_planificada': '2026-08-01',
                    'presupuesto': 2500.00,
                    'resumen': (
                        'Este proyecto busca reducir la brecha digital entre los adultos mayores de la parroquia San Sebastián, '
                        'mediante talleres prácticos de uso de smartphones, correo electrónico y videollamadas. '
                        'Se trabajará en colaboración con el centro de día municipal para alcanzar a más de 60 beneficiarios.'
                    ),
                    'descripcion': (
                        'La intervención se desarrollará en 6 meses con sesiones semanales de dos horas en el centro comunitario. '
                        'Se contará con material didáctico adaptado y monitores estudiantiles que brindarán acompañamiento personalizado.'
                    ),
                    'problema': (
                        'Los adultos mayores de la zona rural y urbana marginal de Loja enfrentan exclusión social y dificultades '
                        'para acceder a servicios públicos digitales debido al desconocimiento de herramientas tecnológicas básicas.'
                    ),
                    'justificacion': (
                        'La alfabetización digital es un derecho fundamental en la era actual. Capacitar a este grupo vulnerable '
                        'mejora su autonomía, fortalece los lazos intergeneracionales y democratiza el acceso a la información.'
                    ),
                    'objetivo_general': (
                        'Capacitar a 60 adultos mayores en el manejo básico de dispositivos móviles y plataformas digitales '
                        'de comunicación para mejorar su calidad de vida e inclusión social en un período de 6 meses.'
                    ),
                    'resultados_esperados': (
                        'Al finalizar, el 80% de los participantes será capaz de realizar videollamadas, enviar correos y usar '
                        'WhatsApp de forma autónoma. Se generará una guía de buenas prácticas replicable en otras parroquias.'
                    ),
                    'linea_intervencion': 'Inclusión social y tecnología',
                    'estudiantes_idx': [0, 1],
                    'horas_est': [40, 30],
                    'actividades': [
                        {'codigo': 'ACT-001', 'nombre': 'Diagnóstico de necesidades tecnológicas', 'estado': EstadoActividad.PENDIENTE, 'porcentaje': 0},
                        {'codigo': 'ACT-002', 'nombre': 'Diseño de material didáctico adaptado', 'estado': EstadoActividad.PENDIENTE, 'porcentaje': 0},
                    ],
                    'alineacion': {
                        'eje': 'Inclusión digital y equidad social',
                        'objetivo_estrategico': 'Reducir la brecha digital en grupos de atención prioritaria',
                        'programa': 'Vinculación con la Sociedad',
                        'plan': 'Plan de Desarrollo Institucional 2025-2029',
                        'descripcion': 'Alineación con el eje de inclusión digital del plan estratégico institucional.',
                        'ods': 'ODS 4: Educación de calidad, ODS 10: Reducción de desigualdades',
                    },
                    'beneficiarios': [
                        {'tipo': 'DIRECTO', 'nombre': 'Adultos mayores del centro de día San Sebastián', 'cantidad': 60, 'ubicacion': 'Parroquia San Sebastián, Loja'},
                        {'tipo': 'INDIRECTO', 'nombre': 'Familiares y cuidadores de los adultos mayores', 'cantidad': 120, 'ubicacion': 'Zona urbana y rural de Loja'},
                    ],
                },
                {
                    'codigo': 'PRY-2026-002',
                    'titulo': 'Investigación sobre salud comunitaria en zonas rurales del sur',
                    'tipo': TipoProyecto.INVESTIGACION,
                    'prioridad': PrioridadProyecto.MEDIA,
                    'estado': EstadoProyecto.EN_REVISION,
                    'carrera': carrera_enfermeria,
                    'responsable': pick_docente(1),
                    'coordinador': pick_coordinador(1),
                    'fecha_inicio': '2026-01-15',
                    'fecha_fin_planificada': '2026-07-15',
                    'presupuesto': 4000.00,
                    'resumen': (
                        'Estudio descriptivo-transversal sobre determinantes sociales de la salud en comunidades rurales del sur '
                        'de la provincia de Loja. Se analizarán indicadores de nutrición, acceso a agua y prevalencia de enfermedades prevalentes.'
                    ),
                    'descripcion': (
                        'El proyecto recolectará datos primarios mediante encuestas domiciliarias y toma de signos vitales en 4 comunidades. '
                        'Los resultados alimentarán propuestas de intervención para el distrito de salud correspondiente.'
                    ),
                    'problema': (
                        'Las comunidades rurales del sur presentan tasas elevadas de desnutrición crónica infantil y enfermedades '
                        'diarreicas ligadas al acceso limitado a agua segura, sin que existan estudios recientes que cuantifiquen la magnitud del problema.'
                    ),
                    'justificacion': (
                        'La generación de evidencia científica local es indispensable para diseñar políticas públicas pertinentes. '
                        'Además, fortalece la formación investigativa de los estudiantes de enfermería y medicina.'
                    ),
                    'objetivo_general': (
                        'Caracterizar los determinantes sociales de la salud y la prevalencia de enfermedades prevalentes en 4 '
                        'comunidades rurales del sur de Loja durante el primer semestre de 2026.'
                    ),
                    'resultados_esperados': (
                        'Informe técnico con mapa de riesgos sanitarios, artículo científico en revista indexada y propuesta de '
                        'intervención comunitaria validada con líderes locales y la dirección distrital de salud.'
                    ),
                    'linea_intervencion': 'Salud comunitaria y determinantes sociales',
                    'estudiantes_idx': [2, 3],
                    'horas_est': [60, 50],
                    'actividades': [
                        {'codigo': 'ACT-001', 'nombre': 'Revisión bibliográfica y diseño de instrumentos', 'estado': EstadoActividad.PENDIENTE, 'porcentaje': 0},
                        {'codigo': 'ACT-002', 'nombre': 'Levantamiento de información en campo', 'estado': EstadoActividad.PENDIENTE, 'porcentaje': 0},
                    ],
                    'alineacion': {
                        'eje': 'Investigación e innovación para el desarrollo territorial',
                        'objetivo_estrategico': 'Generar conocimiento científico aplicado a problemáticas locales',
                        'programa': 'Investigación y Postgrado',
                        'plan': 'Plan de Desarrollo Institucional 2025-2029',
                        'descripcion': 'Alineación con el eje de investigación orientada a la salud pública y territorio.',
                        'ods': 'ODS 3: Salud y bienestar, ODS 6: Agua limpia y saneamiento',
                    },
                    'beneficiarios': [
                        {'tipo': 'DIRECTO', 'nombre': 'Habitantes de 4 comunidades rurales del sur', 'cantidad': 450, 'ubicacion': 'Cantón Loja, parroquias rurales sur'},
                        {'tipo': 'INDIRECTO', 'nombre': 'Sistema de salud pública del distrito sur', 'cantidad': 8, 'ubicacion': 'Distrito de salud 11D07'},
                    ],
                },
                {
                    'codigo': 'PRY-2026-003',
                    'titulo': 'Emprendimiento rural y desarrollo sostenible en comunidades agrícolas',
                    'tipo': TipoProyecto.EXTENSION,
                    'prioridad': PrioridadProyecto.ALTA,
                    'estado': EstadoProyecto.APROBADO,
                    'carrera': carrera_ambiental,
                    'responsable': pick_docente(2),
                    'coordinador': pick_coordinador(2),
                    'fecha_inicio': '2026-03-01',
                    'fecha_fin_planificada': '2026-09-01',
                    'presupuesto': 3500.00,
                    'resumen': (
                        'Fortalecimiento de capacidades productivas y comerciales de pequeños agricultores mediante el '
                        'acompañamiento técnico en agricultura orgánica, transformación de productos y comercialización directa.'
                    ),
                    'descripcion': (
                        'Se implementarán 3 escuelas de campo en las comunidades de El Tambo, Sanguillín y San Lucas. '
                        'Cada escuela atenderá 15 productores y se enfocará en café de sombra, miel nativa y hortalizas orgánicas.'
                    ),
                    'problema': (
                        'Los pequeños productores rurales de la zona carecen de asistencia técnica especializada y canales de '
                        'comercialización justa, lo que perpetúa la pobreza rural y la migración juvenil hacia las ciudades.'
                    ),
                    'justificacion': (
                        'La extensión universitaria tiene el deber de transferir conocimiento y tecnología al sector productivo. '
                        'Este proyecto articula la formación práctica de estudiantes con el desarrollo económico local sostenible.'
                    ),
                    'objetivo_general': (
                        'Fortalecer las capacidades técnicas y comerciales de 45 pequeños productores agrícolas de tres comunidades '
                        'rurales mediante escuelas de campo y asistencia personalizada durante 6 meses.'
                    ),
                    'resultados_esperados': (
                        '45 productores capacitados, 3 asociaciones de base formalizadas, incremento del 20% en ingresos netos '
                        'de los participantes y manual técnico de buenas prácticas agroecológicas publicado.'
                    ),
                    'linea_intervencion': 'Desarrollo productivo y agroecología',
                    'estudiantes_idx': [4, 5],
                    'horas_est': [80, 60],
                    'actividades': [
                        {'codigo': 'ACT-001', 'nombre': 'Mapeo de productores y diagnóstico productivo', 'estado': EstadoActividad.PENDIENTE, 'porcentaje': 0},
                        {'codigo': 'ACT-002', 'nombre': 'Implementación de escuelas de campo', 'estado': EstadoActividad.PENDIENTE, 'porcentaje': 0},
                    ],
                    'alineacion': {
                        'eje': 'Desarrollo territorial y economía popular y solidaria',
                        'objetivo_estrategico': 'Fortalecer el tejido productivo rural mediante innovación social y extensión universitaria',
                        'programa': 'Extensión y Proyección Social',
                        'plan': 'Plan de Desarrollo Institucional 2025-2029',
                        'descripcion': 'Alineación con el eje de desarrollo territorial y extensión universitaria.',
                        'ods': 'ODS 2: Hambre cero, ODS 8: Trabajo decente y crecimiento económico',
                    },
                    'beneficiarios': [
                        {'tipo': 'DIRECTO', 'nombre': 'Pequeños productores de El Tambo, Sanguillín y San Lucas', 'cantidad': 45, 'ubicacion': 'Comunidades rurales del cantón Loja'},
                        {'tipo': 'INDIRECTO', 'nombre': 'Comerciantes y consumidores de la feria agroecológica local', 'cantidad': 300, 'ubicacion': 'Ciudad de Loja y mercados cercanos'},
                    ],
                },
                {
                    'codigo': 'PRY-2026-004',
                    'titulo': 'Educación ambiental y gestión de residuos en instituciones educativas',
                    'tipo': TipoProyecto.MIXTO,
                    'prioridad': PrioridadProyecto.CRITICA,
                    'estado': EstadoProyecto.EN_EJECUCION,
                    'carrera': carrera_biologia,
                    'responsable': pick_docente(3),
                    'coordinador': pick_coordinador(3),
                    'fecha_inicio': '2025-11-01',
                    'fecha_fin_planificada': '2026-05-01',
                    'presupuesto': 5000.00,
                    'resumen': (
                        'Intervención integral de educación ambiental y gestión de residuos sólidos en 5 unidades educativas '
                        'de la ciudad de Loja, combinando investigación diagnóstica, capacitación a docentes y estudiantes, '
                        'e implementación de puntos ecológicos.'
                    ),
                    'descripcion': (
                        'El proyecto ejecuta un diagnóstico de la generación de residuos en cada institución, capacita a '
                        '120 docentes en metodologías de educación ambiental, instala puntos de reciclaje y monitorea '
                        'la reducción mensual de residuos no aprovechables.'
                    ),
                    'problema': (
                        'Las instituciones educativas de Loja generan aproximadamente 12 toneladas de residuos orgánicos e '
                        'inorgánicos mensuales sin clasificación adecuada, contribuyendo a la contaminación del río Malacatos '
                        'y formando hábitos poco sostenibles en la comunidad educativa.'
                    ),
                    'justificacion': (
                        'La educación ambiental en la primera infancia y adolescencia es la estrategia más efectiva para '
                        'cambiar comportamientos a largo plazo. La intervención mixta permite generar conocimiento y '
                        'aplicarlo inmediatamente en el territorio.'
                    ),
                    'objetivo_general': (
                        'Reducir en un 30% la generación de residuos no aprovechables en 5 unidades educativas de Loja '
                        'mediante educación ambiental, clasificación en fuente y compostaje comunitario en 6 meses.'
                    ),
                    'resultados_esperados': (
                        '5 diagnósticos de línea base, 120 docentes capacitados, 15 puntos ecológicos instalados, '
                        '2.400 estudiantes sensibilizados y reducción mensual comprobada del 30% en residuos no aprovechables.'
                    ),
                    'linea_intervencion': 'Educación ambiental y cambio climático',
                    'estudiantes_idx': [6, 7, 8],
                    'horas_est': [70, 50, 40],
                    'actividades': [
                        {'codigo': 'ACT-001', 'nombre': 'Diagnóstico de generación de residuos por institución', 'estado': EstadoActividad.EN_PROCESO, 'porcentaje': 45},
                        {'codigo': 'ACT-002', 'nombre': 'Capacitación a docentes multiplicadores', 'estado': EstadoActividad.EN_PROCESO, 'porcentaje': 30},
                        {'codigo': 'ACT-003', 'nombre': 'Instalación de puntos ecológicos y compostaje', 'estado': EstadoActividad.PENDIENTE, 'porcentaje': 0},
                        {'codigo': 'ACT-004', 'nombre': 'Monitoreo y evaluación de reducción de residuos', 'estado': EstadoActividad.COMPLETADA, 'porcentaje': 100},
                    ],
                    'alineacion': {
                        'eje': 'Sostenibilidad ambiental y cambio climático',
                        'objetivo_estrategico': 'Contribuir a la gestión sostenible del territorio mediante educación, investigación y vinculación',
                        'programa': 'Vinculación con la Sociedad / Investigación',
                        'plan': 'Plan de Desarrollo Institucional 2025-2029',
                        'descripcion': 'Alineación con el eje de sostenibilidad y gestión ambiental del plan estratégico.',
                        'ods': 'ODS 12: Producción y consumo responsables, ODS 13: Acción por el clima',
                    },
                    'beneficiarios': [
                        {'tipo': 'DIRECTO', 'nombre': 'Estudiantes de 5 unidades educativas de Loja', 'cantidad': 2400, 'ubicacion': 'Unidades educativas del cantón Loja'},
                        {'tipo': 'INDIRECTO', 'nombre': 'Familias de la comunidad educativa y vecindario', 'cantidad': 4800, 'ubicacion': 'Zona urbana de Loja'},
                    ],
                    'extra_avances': True,
                    'extra_informe': True,
                },
            ]

            # ------------------------------------------------------------------
            # Crear proyectos
            # ------------------------------------------------------------------
            for p_data in proyectos_data:
                codigo = p_data['codigo']
                proyecto, creado = Proyecto.objects.get_or_create(codigo=codigo, defaults={
                    'titulo': p_data['titulo'],
                    'tipo': p_data['tipo'],
                    'prioridad': p_data['prioridad'],
                    'estado': p_data['estado'],
                    'carrera': p_data['carrera'],
                    'responsable': p_data['responsable'],
                    'coordinador_academico': p_data['coordinador'],
                    'fecha_inicio': p_data['fecha_inicio'],
                    'fecha_fin_planificada': p_data['fecha_fin_planificada'],
                    'presupuesto_aprobado': p_data['presupuesto'],
                    'resumen': p_data['resumen'],
                    'descripcion': p_data['descripcion'],
                    'problema': p_data['problema'],
                    'justificacion': p_data['justificacion'],
                    'objetivo_general': p_data['objetivo_general'],
                    'resultados_esperados': p_data['resultados_esperados'],
                    'linea_intervencion': p_data.get('linea_intervencion', ''),
                })

                if not creado:
                    self.stdout.write(self.style.WARNING(f'Proyecto {codigo} ya existe. Saltando.'))
                    proyectos_resumen.append(f'{codigo} ({proyecto.estado}) - {proyecto.titulo}')
                    contadores['proyectos_existentes'] += 1
                    continue

                contadores['proyectos_creados'] += 1
                proyectos_resumen.append(f'{codigo} ({proyecto.estado}) - {proyecto.titulo}')
                self.stdout.write(self.style.SUCCESS(f'Creado proyecto {codigo}'))

                # Alineación estratégica
                def crear_alineacion():
                    AlineacionEstrategica.objects.create(
                        proyecto=proyecto,
                        eje=p_data['alineacion']['eje'],
                        objetivo_estrategico=p_data['alineacion']['objetivo_estrategico'],
                        programa=p_data['alineacion']['programa'],
                        plan=p_data['alineacion']['plan'],
                        descripcion=p_data['alineacion']['descripcion'],
                        ods=p_data['alineacion']['ods'],
                    )
                    contadores['alineaciones_creadas'] += 1

                safe_create('AlineacionEstrategica', codigo, crear_alineacion)

                # Beneficiarios
                def crear_beneficiarios():
                    for b in p_data['beneficiarios']:
                        Beneficiario.objects.create(
                            proyecto=proyecto,
                            tipo=b['tipo'],
                            nombre=b['nombre'],
                            cantidad_estimada=b['cantidad'],
                            ubicacion=b['ubicacion'],
                        )
                        contadores['beneficiarios_creados'] += 1

                safe_create('Beneficiarios', codigo, crear_beneficiarios)

                # Presupuesto
                def crear_presupuesto():
                    estado_pres = EstadoPresupuesto.BORRADOR
                    if proyecto.estado == EstadoProyecto.APROBADO:
                        estado_pres = EstadoPresupuesto.APROBADO
                    elif proyecto.estado == EstadoProyecto.EN_EJECUCION:
                        estado_pres = EstadoPresupuesto.EJECUTADO

                    Presupuesto.objects.create(
                        proyecto=proyecto,
                        codigo=f'PRE-{proyecto.codigo.split("-")[-1]}',
                        monto_aprobado=p_data['presupuesto'],
                        monto_ejecutado=p_data['presupuesto'] * 0.3 if proyecto.estado == EstadoProyecto.EN_EJECUCION else 0,
                        monto_saldo=p_data['presupuesto'] * 0.7 if proyecto.estado == EstadoProyecto.EN_EJECUCION else p_data['presupuesto'],
                        estado=estado_pres,
                        responsable=p_data['responsable'],
                    )
                    contadores['presupuestos_creados'] += 1

                safe_create('Presupuesto', codigo, crear_presupuesto)

                # Objetivo general (para poder relacionar actividades si se desea)
                def crear_objetivo():
                    Objetivo.objects.create(
                        proyecto=proyecto,
                        tipo=TipoObjetivo.GENERAL,
                        orden=1,
                        descripcion=p_data['objetivo_general'],
                    )
                    contadores['objetivos_creados'] += 1

                safe_create('Objetivo', codigo, crear_objetivo)

                # Participantes
                def crear_participantes():
                    # Líder = responsable del proyecto
                    if p_data['responsable']:
                        horas_cumplidas_lider = 0
                        if proyecto.estado == EstadoProyecto.EN_EJECUCION:
                            horas_cumplidas_lider = 20  # parcial
                        ParticipanteProyecto.objects.create(
                            proyecto=proyecto,
                            usuario=p_data['responsable'],
                            rol=RolParticipante.LIDER,
                            horas_comprometidas=60,
                            horas_cumplidas=horas_cumplidas_lider,
                        )
                        contadores['participantes_creados'] += 1

                    # Estudiantes
                    for idx_est, horas in zip(p_data['estudiantes_idx'], p_data['horas_est']):
                        est = pick_estudiante(idx_est)
                        if not est:
                            continue
                        horas_cumplidas = 0
                        if proyecto.estado == EstadoProyecto.EN_EJECUCION:
                            horas_cumplidas = round(horas * 0.35, 2)
                        ParticipanteProyecto.objects.create(
                            proyecto=proyecto,
                            usuario=est,
                            rol=RolParticipante.ESTUDIANTE,
                            horas_comprometidas=horas,
                            horas_cumplidas=horas_cumplidas,
                        )
                        contadores['participantes_creados'] += 1

                safe_create('Participantes', codigo, crear_participantes)

                # Actividades
                actividades_creadas_local = []
                def crear_actividades():
                    for i, act_data in enumerate(p_data['actividades'], start=1):
                        act = Actividad.objects.create(
                            proyecto=proyecto,
                            codigo=f'{proyecto.codigo}-ACT-{i:03d}',
                            nombre=act_data['nombre'],
                            descripcion=act_data['nombre'],
                            estado=act_data['estado'],
                            porcentaje_ejecucion=act_data['porcentaje'],
                            orden=i,
                        )
                        actividades_creadas_local.append(act)
                        contadores['actividades_creadas'] += 1

                safe_create('Actividades', codigo, crear_actividades)

                # Extras para EN_EJECUCION
                if p_data.get('extra_avances') and actividades_creadas_local:
                    def crear_avances():
                        # Tomar actividades EN_PROCESO
                        acts_proceso = [a for a in actividades_creadas_local if a.estado == EstadoActividad.EN_PROCESO]
                        for act in acts_proceso:
                            avance1 = Avance.objects.create(
                                actividad=act,
                                registrado_por=p_data['responsable'],
                                porcentaje_avance=act.porcentaje_ejecucion * 0.4,
                                descripcion=f'Primer avance de la actividad "{act.nombre}". Se completó la fase inicial de planificación y se inició la ejecución en campo.',
                                horas_invertidas=12,
                                estado=EstadoAvance.APROBADO,
                            )
                            contadores['avances_creados'] += 1
                            avance2 = Avance.objects.create(
                                actividad=act,
                                registrado_por=p_data['responsable'],
                                porcentaje_avance=act.porcentaje_ejecucion,
                                descripcion=f'Segundo avance de la actividad "{act.nombre}". Se logró un progreso significativo conforme a la planificación establecida.',
                                horas_invertidas=18,
                                estado=EstadoAvance.APROBADO,
                            )
                            contadores['avances_creados'] += 1

                            # Evidencia asociada al segundo avance
                            Evidencia.objects.create(
                                avance=avance2,
                                actividad=act,
                                tipo=TipoEvidencia.DOCUMENTO,
                                titulo=f'Informe de avance - {act.nombre}',
                                descripcion='Documento técnico que respalda el avance reportado en la actividad.',
                                enlace_externo='https://docs.google.com/document/d/ejemplo-seguimiento-ambiental',
                            )
                            contadores['evidencias_creadas'] += 1

                    safe_create('Avances/Evidencias', codigo, crear_avances)

                if p_data.get('extra_informe'):
                    def crear_informe():
                        Informe.objects.create(
                            proyecto=proyecto,
                            tipo=TipoInforme.PARCIAL,
                            numero='INF-001',
                            titulo='Informe parcial de seguimiento - Gestión de residuos',
                            contenido='Este informe presenta los avances en las actividades de diagnóstico, capacitación y monitoreo durante los primeros tres meses de ejecución.',
                            periodo_inicio='2025-11-01',
                            periodo_fin='2026-01-31',
                            elaborado_por=p_data['responsable'],
                            estado=EstadoAvance.PENDIENTE,
                        )
                        contadores['informes_creados'] += 1

                    safe_create('Informe', codigo, crear_informe)

        # ------------------------------------------------------------------
        # Resumen final
        # ------------------------------------------------------------------
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('RESUMEN DE PROYECTOS DEMO'))
        self.stdout.write('=' * 60)

        for linea in proyectos_resumen:
            self.stdout.write(f'  - {linea}')

        self.stdout.write('\n [OK] {} proyectos creados'.format(contadores['proyectos_creados']))
        if contadores['proyectos_existentes']:
            self.stdout.write('   {} proyectos ya existían (idempotente)'.format(contadores['proyectos_existentes']))
        self.stdout.write(' [OK] {} participantes asignados'.format(contadores['participantes_creados']))
        self.stdout.write(' [OK] {} actividades creadas'.format(contadores['actividades_creadas']))
        self.stdout.write(' [OK] {} avances registrados'.format(contadores['avances_creados']))
        self.stdout.write(' [OK] {} evidencias creadas'.format(contadores['evidencias_creadas']))
        self.stdout.write(' [OK] {} informes creados'.format(contadores['informes_creados']))
        self.stdout.write(' [OK] {} alineaciones estratégicas creadas'.format(contadores['alineaciones_creadas']))
        self.stdout.write(' [OK] {} beneficiarios creados'.format(contadores['beneficiarios_creados']))
        self.stdout.write(' [OK] {} presupuestos creados'.format(contadores['presupuestos_creados']))
        self.stdout.write(' [OK] {} objetivos creados'.format(contadores['objetivos_creados']))

        # ------------------------------------------------------------------
        # Faltantes
        # ------------------------------------------------------------------
        self.stdout.write('\n' + '=' * 60)
        if faltantes:
            self.stdout.write(self.style.WARNING('[WARN] FALTANTES DETECTADOS EN EL SISTEMA'))
            self.stdout.write('=' * 60)
            for i, f in enumerate(faltantes, start=1):
                tipo_label = {
                    'modelo_inexistente': 'Modelo inexistente',
                    'campo_inexistente': 'Campo inexistente',
                    'validacion': 'Error de validación',
                }.get(f['tipo'], 'Error general')
                self.stdout.write(f"\n{i}. [Proyecto {f['proyecto']}] No se pudo crear {f['intentado']}:")
                self.stdout.write(f"   Error: {f['error']} ({tipo_label})")
            self.stdout.write('')
        else:
            self.stdout.write(self.style.SUCCESS('[OK] No se detectaron faltantes.'))
            self.stdout.write('  Todos los modelos y campos necesarios existen y funcionan correctamente.')
        self.stdout.write('=' * 60 + '\n')
