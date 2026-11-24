/**
 * Contenido de los proyectos de prueba: temas reales de vinculación en la provincia de Loja.
 * `{lugar}` se reemplaza por la parroquia o barrio elegido ("la parroquia El Valle").
 * Solo es texto: los IDs (carreras, docentes, instituciones) salen siempre de la API.
 */

export interface Lugar {
  nombre: string
  frase: string
  ubicacion: string
}

export const LUGARES: Lugar[] = [
  { nombre: 'El Valle', frase: 'la parroquia El Valle', ubicacion: 'Parroquia El Valle, cantón Loja' },
  { nombre: 'Sucre', frase: 'la parroquia Sucre', ubicacion: 'Parroquia Sucre, cantón Loja' },
  { nombre: 'Punzara', frase: 'el barrio Punzara', ubicacion: 'Barrio Punzara, parroquia San Sebastián, Loja' },
  { nombre: 'Motupe', frase: 'el barrio Motupe', ubicacion: 'Barrio Motupe, parroquia El Valle, Loja' },
  { nombre: 'Zamora Huayco', frase: 'el barrio Zamora Huayco', ubicacion: 'Barrio Zamora Huayco, parroquia San Sebastián, Loja' },
  { nombre: 'Vilcabamba', frase: 'la parroquia Vilcabamba', ubicacion: 'Parroquia Vilcabamba, cantón Loja' },
  { nombre: 'Malacatos', frase: 'la parroquia Malacatos', ubicacion: 'Parroquia Malacatos, cantón Loja' },
  { nombre: 'Taquil', frase: 'la parroquia Taquil', ubicacion: 'Parroquia Taquil, cantón Loja' },
  { nombre: 'Chuquiribamba', frase: 'la parroquia Chuquiribamba', ubicacion: 'Parroquia Chuquiribamba, cantón Loja' },
  { nombre: 'San Lucas', frase: 'la parroquia San Lucas', ubicacion: 'Parroquia San Lucas, cantón Loja' },
  { nombre: 'Jimbilla', frase: 'la parroquia Jimbilla', ubicacion: 'Parroquia Jimbilla, cantón Loja' },
  { nombre: 'Yangana', frase: 'la parroquia Yangana', ubicacion: 'Parroquia Yangana, cantón Loja' },
  { nombre: 'Carigán', frase: 'el sector Carigán', ubicacion: 'Sector Carigán, parroquia Sucre, Loja' },
  { nombre: 'Ciudad Victoria', frase: 'el barrio Ciudad Victoria', ubicacion: 'Barrio Ciudad Victoria, parroquia Sucre, Loja' },
]

export interface TemaDemo {
  titulos: string[]
  /** Fragmentos de nombres de carrera (sin tildes) para elegir carreras afines. */
  carreras: string[]
  linea: string
  lineaInvestigacion: string
  programaVinculacion: string
  ods: string[]
  ejeIgualdad: string
  eje: string
  objetivoEstrategico: string
  programa: string
  resumen: string
  descripcion: string
  problema: string
  justificacion: string
  objetivo: string
  resultados: string
  viabilidad: string
  directo: { nombre: string; min: number; max: number; observaciones: string }
  indirecto: { nombre: string; min: number; max: number }
  fin: string
  proposito: string
  componentes: string
  actividades: string[]
  indicadores: { fin: string; proposito: string; componentes: string; actividades: string }
  medios: string
  supuestos: string
  estrategias: string
}

export const TEMAS: TemaDemo[] = [
  {
    titulos: [
      'Huertos orgánicos familiares para la seguridad alimentaria en {lugar}',
      'Implementación de huertos orgánicos escolares y familiares en {lugar}',
    ],
    carreras: ['agronomia', 'ingenieria agricola', 'educacion basica', 'ingenieria ambiental'],
    linea: 'Soberanía alimentaria y producción agroecológica',
    lineaInvestigacion: 'Desarrollo sostenible y ambiente',
    programaVinculacion: 'Servicios comunitarios y sociales',
    ods: ['2. Hambre cero', '12. Producción y consumo responsables'],
    ejeIgualdad: 'SOCIOECONOMICA',
    eje: 'Desarrollo productivo sostenible',
    objetivoEstrategico: 'Contribuir a la soberanía alimentaria de la región sur mediante la transferencia de prácticas agroecológicas a familias rurales y periurbanas.',
    programa: 'Programa de Agroecología y Soberanía Alimentaria UNL',
    resumen: 'Estudiantes y docentes acompañan a familias de {lugar} en el diseño, siembra y manejo de huertos orgánicos con hortalizas de ciclo corto, compostaje y riego por goteo de bajo costo.',
    descripcion: 'El proyecto combina talleres prácticos en campo, visitas de seguimiento quincenales y una feria final de intercambio de semillas y productos entre las familias participantes.',
    problema: 'Las familias de {lugar} dependen de hortalizas compradas en el mercado mayorista, con precios variables y residuos de agroquímicos; además, muchos terrenos familiares permanecen sin cultivar por falta de asistencia técnica.',
    justificacion: 'Un huerto de 30 m² bien manejado cubre buena parte del consumo de hortalizas de una familia de cuatro personas, reduce el gasto mensual en alimentos y aprovecha los residuos orgánicos del hogar como abono.',
    objetivo: 'Mejorar el acceso a alimentos sanos de las familias de {lugar} mediante la implementación y el manejo agroecológico de huertos orgánicos.',
    resultados: 'Huertos en producción en al menos el 80 % de las familias inscritas, una composta comunitaria funcionando y un banco local de semillas con variedades adaptadas a la zona.',
    viabilidad: 'Técnicamente viable: la carrera cuenta con laboratorio de suelos y vivero. Socialmente, la junta parroquial respalda la iniciativa y presta su casa comunal. Económicamente, los insumos son de bajo costo y la mano de obra es aportada por las familias.',
    directo: { nombre: 'Familias productoras de {nombre}', min: 25, max: 45, observaciones: 'Familias con terreno disponible de al menos 20 m².' },
    indirecto: { nombre: 'Habitantes de {nombre} que acceden a la feria de productos', min: 300, max: 900 },
    fin: 'Contribuir a la seguridad alimentaria y a la economía familiar de las comunidades de {lugar}.',
    proposito: 'Las familias participantes producen y consumen hortalizas orgánicas de forma sostenida.',
    componentes: 'C1. Familias capacitadas en manejo agroecológico. C2. Huertos implementados con riego eficiente. C3. Banco comunitario de semillas en funcionamiento.',
    actividades: ['Diagnóstico de suelos y levantamiento de línea base', 'Talleres de siembra, compostaje y control biológico de plagas', 'Instalación de huertos y sistemas de riego por goteo', 'Feria de intercambio de semillas y productos'],
    indicadores: { fin: 'Reducción del gasto familiar mensual en hortalizas.', proposito: 'Porcentaje de familias con huerto productivo al cierre.', componentes: 'Número de huertos instalados y familias capacitadas.', actividades: 'Talleres ejecutados frente a planificados.' },
    medios: 'Fichas de seguimiento por familia, registro fotográfico, listas de asistencia y actas de entrega de insumos.',
    supuestos: 'Las condiciones climáticas permiten la siembra en la época prevista y las familias mantienen su compromiso de participación.',
    estrategias: 'Trabajo por grupos de cinco familias, cada uno acompañado por dos estudiantes; los docentes supervisan en campo cada quince días y la junta parroquial coordina la convocatoria.',
  },
  {
    titulos: [
      'Alfabetización digital para adultos mayores de {lugar}',
      'Alfabetización digital y uso seguro de internet en {lugar}',
    ],
    carreras: ['computacion', 'telecomunicaciones', 'educacion basica', 'comunicacion'],
    linea: 'Inclusión digital',
    lineaInvestigacion: 'Tecnología e innovación',
    programaVinculacion: 'Educación continua',
    ods: ['4. Educación de calidad', '10. Reducción de las desigualdades'],
    ejeIgualdad: 'SOCIOECONOMICA',
    eje: 'Inclusión digital y educación permanente',
    objetivoEstrategico: 'Reducir la brecha digital de la población lojana con talleres de uso de dispositivos, trámites en línea y seguridad informática.',
    programa: 'Programa de Inclusión Digital Comunitaria',
    resumen: 'Talleres presenciales en los que estudiantes enseñan a adultos mayores de {lugar} a usar el teléfono inteligente, realizar trámites públicos en línea y reconocer fraudes por mensajería.',
    descripcion: 'Cada participante recibe una guía impresa con letra grande y practica en grupos pequeños, con un estudiante tutor por cada tres personas.',
    problema: 'Muchos adultos mayores de {lugar} no saben realizar pagos de servicios, agendar citas médicas en línea ni identificar mensajes fraudulentos, lo que los hace depender de terceros y los expone a estafas.',
    justificacion: 'Cada vez más trámites públicos y bancarios se hacen solo por internet; enseñar competencias digitales básicas devuelve autonomía a este grupo y reduce el riesgo de fraude.',
    objetivo: 'Desarrollar competencias digitales básicas en adultos mayores de {lugar} para que realicen trámites cotidianos en línea con autonomía y seguridad.',
    resultados: 'Participantes capaces de usar mensajería, videollamadas, banca móvil y el portal de agendamiento de citas; una guía de seguridad digital validada con la comunidad.',
    viabilidad: 'La carrera dispone de laboratorios y equipos portátiles; el GAD parroquial facilita el local y la conexión a internet. Los costos se limitan a material impreso y transporte.',
    directo: { nombre: 'Adultos mayores de {nombre}', min: 30, max: 60, observaciones: 'Prioridad a personas que viven solas.' },
    indirecto: { nombre: 'Familiares de los participantes', min: 80, max: 200 },
    fin: 'Contribuir a la inclusión digital y a la autonomía de los adultos mayores de {lugar}.',
    proposito: 'Los adultos mayores participantes usan herramientas digitales para sus trámites cotidianos.',
    componentes: 'C1. Módulos de capacitación diseñados. C2. Talleres impartidos por estudiantes tutores. C3. Guía de seguridad digital publicada.',
    actividades: ['Diagnóstico de competencias digitales', 'Diseño de módulos y guías con letra grande', 'Talleres prácticos de uso del teléfono y trámites en línea', 'Evaluación final y entrega de certificados'],
    indicadores: { fin: 'Porcentaje de participantes que hacen trámites sin ayuda.', proposito: 'Participantes que aprueban la evaluación práctica.', componentes: 'Módulos y talleres ejecutados.', actividades: 'Asistencia promedio por taller.' },
    medios: 'Evaluaciones prácticas de entrada y salida, listas de asistencia, fotografías y certificados entregados.',
    supuestos: 'Los participantes cuentan con un teléfono inteligente propio o de un familiar y el local mantiene la conexión a internet.',
    estrategias: 'Aprendizaje práctico en grupos reducidos con un tutor por cada tres participantes, sesiones de dos horas dos veces por semana y refuerzo por videollamada.',
  },
  {
    titulos: [
      'Asesoría jurídica comunitaria gratuita en {lugar}',
      'Consultorio jurídico móvil para familias de {lugar}',
    ],
    carreras: ['derecho', 'trabajo social', 'administracion publica'],
    linea: 'Acceso a la justicia',
    lineaInvestigacion: 'Gestión social y económica',
    programaVinculacion: 'Servicios especializados',
    ods: ['16. Paz, justicia e instituciones sólidas', '5. Igualdad de género'],
    ejeIgualdad: 'GENERO',
    eje: 'Derechos humanos y acceso a la justicia',
    objetivoEstrategico: 'Garantizar el acceso a orientación jurídica gratuita a la población vulnerable de la provincia mediante el consultorio jurídico universitario.',
    programa: 'Consultorio Jurídico Gratuito UNL',
    resumen: 'Estudiantes de los últimos ciclos, supervisados por docentes abogados, brindan orientación legal gratuita en {lugar} sobre alimentos, herencias, linderos, violencia intrafamiliar y derechos laborales.',
    descripcion: 'El consultorio atiende en la casa comunal un día por semana, lleva un registro confidencial de casos y deriva a la Defensoría Pública los que requieren patrocinio.',
    problema: 'Las familias de {lugar} desconocen sus derechos y procedimientos legales básicos; contratar un abogado es costoso y viajar a la ciudad implica perder un día de trabajo.',
    justificacion: 'La orientación temprana evita juicios innecesarios, protege a víctimas de violencia y permite que los estudiantes practiquen con casos reales bajo supervisión académica.',
    objetivo: 'Brindar orientación jurídica gratuita y de calidad a las familias de {lugar} para facilitar su acceso a la justicia.',
    resultados: 'Casos atendidos con informe de orientación, charlas sobre derechos realizadas y una red de derivación activa con la Defensoría Pública y la Junta de Protección de Derechos.',
    viabilidad: 'La carrera cuenta con el consultorio jurídico acreditado y docentes con experiencia en litigio; el GAD parroquial facilita el espacio de atención.',
    directo: { nombre: 'Personas usuarias del consultorio en {nombre}', min: 60, max: 120, observaciones: 'Atención priorizada a mujeres jefas de hogar.' },
    indirecto: { nombre: 'Familias de las personas atendidas', min: 150, max: 400 },
    fin: 'Contribuir al ejercicio de los derechos y al acceso a la justicia de la población de {lugar}.',
    proposito: 'Las familias de {lugar} reciben orientación jurídica oportuna y gratuita.',
    componentes: 'C1. Consultorio móvil funcionando. C2. Charlas de difusión de derechos. C3. Red de derivación institucional.',
    actividades: ['Difusión del servicio con la junta parroquial', 'Atención semanal de consultas jurídicas', 'Charlas sobre pensiones alimenticias y violencia intrafamiliar', 'Informe de casos y derivaciones'],
    indicadores: { fin: 'Casos resueltos sin litigio.', proposito: 'Número de consultas atendidas.', componentes: 'Charlas realizadas y derivaciones efectivas.', actividades: 'Jornadas de atención cumplidas.' },
    medios: 'Registro confidencial de casos, informes de orientación, fichas de derivación y listas de asistencia.',
    supuestos: 'La comunidad confía en el servicio y las instituciones de derivación mantienen su apertura.',
    estrategias: 'Atención en duplas de estudiantes supervisadas por un docente, agenda semanal fija y seguimiento telefónico de cada caso.',
  },
  {
    titulos: [
      'Salud preventiva y detección temprana de enfermedades crónicas en {lugar}',
      'Promoción de la salud y prevención de hipertensión y diabetes en {lugar}',
    ],
    carreras: ['enfermeria', 'medicina', 'laboratorio clinico', 'psicologia clinica'],
    linea: 'Salud comunitaria',
    lineaInvestigacion: 'Salud y bienestar',
    programaVinculacion: 'Servicios comunitarios y sociales',
    ods: ['3. Salud y bienestar'],
    ejeIgualdad: 'NO_APLICA',
    eje: 'Salud integral y comunitaria',
    objetivoEstrategico: 'Fortalecer la atención primaria en salud de la región sur con acciones de promoción, prevención y tamizaje en comunidades rurales.',
    programa: 'Programa de Salud Comunitaria UNL',
    resumen: 'Brigadas de salud en {lugar} para medir presión arterial, glucosa e índice de masa corporal, con charlas de alimentación saludable y derivación al centro de salud de los casos de riesgo.',
    descripcion: 'Cada brigada se coordina con el subcentro de salud del Ministerio, que recibe las fichas de tamizaje y da seguimiento a las personas derivadas.',
    problema: 'En {lugar} aumentan los casos de hipertensión y diabetes no diagnosticadas; muchas personas acuden al médico solo cuando aparecen complicaciones.',
    justificacion: 'La detección temprana y la educación en hábitos saludables reducen complicaciones y costos de tratamiento, y los estudiantes fortalecen sus competencias clínicas en atención primaria.',
    objetivo: 'Contribuir a la detección temprana de hipertensión y diabetes en la población adulta de {lugar} mediante brigadas de tamizaje y educación para la salud.',
    resultados: 'Población adulta tamizada, casos de riesgo derivados y en seguimiento, y clubes de pacientes crónicos conformados con apoyo del subcentro de salud.',
    viabilidad: 'Se cuenta con equipos de tamizaje de la facultad y con el aval del distrito de salud; los insumos de laboratorio tienen costo moderado y están presupuestados.',
    directo: { nombre: 'Personas adultas tamizadas en {nombre}', min: 120, max: 300, observaciones: 'Mayores de 30 años.' },
    indirecto: { nombre: 'Núcleos familiares de las personas tamizadas', min: 400, max: 1000 },
    fin: 'Contribuir a reducir la carga de enfermedades crónicas no transmisibles en {lugar}.',
    proposito: 'La población adulta de {lugar} conoce su estado de salud y los casos de riesgo reciben seguimiento.',
    componentes: 'C1. Brigadas de tamizaje ejecutadas. C2. Charlas de alimentación y actividad física. C3. Casos de riesgo derivados al subcentro.',
    actividades: ['Coordinación con el distrito y el subcentro de salud', 'Brigadas de tamizaje de presión arterial y glucosa', 'Charlas de alimentación saludable y actividad física', 'Seguimiento de casos derivados'],
    indicadores: { fin: 'Prevalencia de casos no diagnosticados.', proposito: 'Porcentaje de casos de riesgo con seguimiento.', componentes: 'Personas tamizadas y charlas realizadas.', actividades: 'Brigadas ejecutadas frente a planificadas.' },
    medios: 'Fichas de tamizaje, registros del subcentro de salud, listas de asistencia y fotografías.',
    supuestos: 'El distrito de salud mantiene el convenio y la población acude a las brigadas convocadas.',
    estrategias: 'Brigadas mensuales en la casa comunal con estaciones de toma de signos, laboratorio y consejería; la derivación se hace con ficha única acordada con el subcentro.',
  },
  {
    titulos: [
      'Fortalecimiento contable y tributario de emprendimientos de {lugar}',
      'Educación financiera y formalización de microemprendimientos en {lugar}',
    ],
    carreras: ['contabilidad', 'administracion de empresas', 'finanzas', 'economia'],
    linea: 'Economía popular y solidaria',
    lineaInvestigacion: 'Gestión social y económica',
    programaVinculacion: 'Servicios especializados',
    ods: ['8. Trabajo decente y crecimiento económico', '1. Fin de la pobreza'],
    ejeIgualdad: 'GENERO',
    eje: 'Desarrollo económico local',
    objetivoEstrategico: 'Impulsar la economía popular y solidaria de la región sur con asesoría contable, tributaria y financiera a emprendimientos locales.',
    programa: 'Programa de Apoyo a Emprendimientos Locales',
    resumen: 'Estudiantes asesoran a emprendedores de {lugar} en registros contables simples, obligaciones con el SRI, costos de producción y fijación de precios.',
    descripcion: 'Cada emprendimiento recibe un diagnóstico inicial, un plan de mejora y acompañamiento mensual hasta presentar sus declaraciones tributarias a tiempo.',
    problema: 'La mayoría de emprendimientos de {lugar} no llevan registros de ingresos y gastos, desconocen sus obligaciones tributarias y fijan precios sin calcular costos, lo que los expone a multas y pérdidas.',
    justificacion: 'Llevar cuentas claras y cumplir con el SRI permite acceder a créditos y a nuevos mercados; los estudiantes aplican lo aprendido en casos reales.',
    objetivo: 'Fortalecer la gestión contable y tributaria de los emprendimientos de {lugar} para mejorar su sostenibilidad y formalización.',
    resultados: 'Emprendimientos con registro contable al día, declaraciones presentadas sin multas y una calculadora de costos adaptada a cada negocio.',
    viabilidad: 'La carrera cuenta con docentes contadores y software académico; la asociación de emprendedores aporta el local y la convocatoria. Los costos son bajos.',
    directo: { nombre: 'Emprendedores y emprendedoras de {nombre}', min: 20, max: 40, observaciones: 'Negocios con al menos seis meses de funcionamiento.' },
    indirecto: { nombre: 'Familias que dependen de los emprendimientos', min: 60, max: 160 },
    fin: 'Contribuir a la sostenibilidad económica de los emprendimientos de {lugar}.',
    proposito: 'Los emprendimientos participantes gestionan sus cuentas y obligaciones tributarias de forma ordenada.',
    componentes: 'C1. Diagnóstico de cada emprendimiento. C2. Talleres de contabilidad básica y costos. C3. Acompañamiento tributario mensual.',
    actividades: ['Diagnóstico contable y tributario de cada negocio', 'Talleres de registros contables y cálculo de costos', 'Acompañamiento en declaraciones al SRI', 'Feria de emprendimientos y cierre'],
    indicadores: { fin: 'Emprendimientos activos un año después.', proposito: 'Negocios con registros contables al día.', componentes: 'Diagnósticos y talleres ejecutados.', actividades: 'Asesorías mensuales realizadas.' },
    medios: 'Fichas de diagnóstico, comprobantes de declaración, listas de asistencia y fotografías.',
    supuestos: 'Los emprendedores disponen de tiempo para las asesorías y no cambia de forma abrupta la normativa tributaria.',
    estrategias: 'Asignación de dos estudiantes por emprendimiento, talleres grupales quincenales y visitas al negocio para revisar los registros.',
  },
  {
    titulos: [
      'Bienestar animal y control de zoonosis en {lugar}',
      'Campaña de esterilización y tenencia responsable de mascotas en {lugar}',
    ],
    carreras: ['medicina veterinaria', 'zootecnia', 'enfermeria'],
    linea: 'Una salud: animal, humana y ambiental',
    lineaInvestigacion: 'Salud y bienestar',
    programaVinculacion: 'Servicios comunitarios y sociales',
    ods: ['3. Salud y bienestar', '15. Vida de ecosistemas terrestres'],
    ejeIgualdad: 'NO_APLICA',
    eje: 'Salud pública veterinaria',
    objetivoEstrategico: 'Promover la tenencia responsable de animales de compañía y la prevención de zoonosis en barrios y parroquias de Loja.',
    programa: 'Programa de Bienestar Animal UNL',
    resumen: 'Jornadas de esterilización, desparasitación y vacunación de perros y gatos en {lugar}, acompañadas de charlas sobre tenencia responsable y prevención de enfermedades transmitidas por animales.',
    descripcion: 'Las cirugías se realizan en un quirófano móvil con docentes veterinarios, y cada familia recibe una ficha clínica del animal atendido.',
    problema: 'En {lugar} hay una población creciente de perros callejeros, casos de mordeduras y enfermedades parasitarias que afectan sobre todo a niños.',
    justificacion: 'La esterilización y la desparasitación periódica reducen la sobrepoblación y el riesgo de zoonosis; los estudiantes adquieren práctica clínica supervisada.',
    objetivo: 'Reducir la sobrepoblación de animales de compañía y el riesgo de zoonosis en {lugar} mediante jornadas veterinarias y educación comunitaria.',
    resultados: 'Animales esterilizados, desparasitados y vacunados con ficha clínica, y familias capacitadas en tenencia responsable.',
    viabilidad: 'La carrera cuenta con el hospital veterinario y un quirófano móvil; el GAD municipal aporta medicamentos y la junta parroquial convoca a las familias.',
    directo: { nombre: 'Familias con mascotas de {nombre}', min: 80, max: 160, observaciones: 'Cada familia puede registrar hasta dos animales.' },
    indirecto: { nombre: 'Población de {nombre} expuesta a zoonosis', min: 800, max: 2500 },
    fin: 'Contribuir a la salud pública y al bienestar animal en {lugar}.',
    proposito: 'Disminuye la población de animales sin control sanitario en {lugar}.',
    componentes: 'C1. Jornadas de esterilización. C2. Campañas de desparasitación y vacunación. C3. Charlas de tenencia responsable.',
    actividades: ['Censo de animales de compañía con la junta parroquial', 'Jornadas de esterilización en quirófano móvil', 'Desparasitación y vacunación casa por casa', 'Charlas de tenencia responsable en escuelas'],
    indicadores: { fin: 'Casos de mordeduras reportados.', proposito: 'Animales esterilizados frente al censo.', componentes: 'Jornadas y campañas ejecutadas.', actividades: 'Animales atendidos por jornada.' },
    medios: 'Fichas clínicas, registros quirúrgicos, censo animal y fotografías.',
    supuestos: 'Las familias llevan a sus animales a las jornadas y el GAD entrega los medicamentos a tiempo.',
    estrategias: 'Jornadas mensuales con turnos agendados, equipos de estudiantes por estación (triaje, cirugía, recuperación) y supervisión docente permanente.',
  },
  {
    titulos: [
      'Refuerzo de lectura y escritura para niños de {lugar}',
      'Club de lectura y refuerzo escolar en {lugar}',
    ],
    carreras: ['educacion basica', 'pedagogia de la lengua', 'psicopedagogia', 'educacion inicial'],
    linea: 'Calidad educativa',
    lineaInvestigacion: 'Educación y pedagogía',
    programaVinculacion: 'Servicios comunitarios y sociales',
    ods: ['4. Educación de calidad'],
    ejeIgualdad: 'SOCIOECONOMICA',
    eje: 'Educación de calidad e inclusión',
    objetivoEstrategico: 'Mejorar los aprendizajes básicos de niñas y niños de escuelas fiscales de Loja con acompañamiento pedagógico de estudiantes universitarios.',
    programa: 'Programa de Acompañamiento Pedagógico Comunitario',
    resumen: 'Estudiantes de educación realizan sesiones de refuerzo de lectura, escritura y comprensión lectora con niñas y niños de la escuela fiscal de {lugar}, en coordinación con sus docentes.',
    descripcion: 'Las sesiones son en grupos pequeños, dos veces por semana, con material didáctico elaborado por los estudiantes y una biblioteca de aula itinerante.',
    problema: 'Las evaluaciones de la escuela de {lugar} muestran que muchos estudiantes de cuarto a séptimo año no comprenden textos acordes a su nivel, lo que afecta su rendimiento en todas las materias.',
    justificacion: 'La comprensión lectora es la base del aprendizaje; un refuerzo sostenido en grupos pequeños mejora los resultados y los estudiantes universitarios ganan experiencia docente.',
    objetivo: 'Mejorar la comprensión lectora y la producción escrita de niñas y niños de la escuela fiscal de {lugar}.',
    resultados: 'Niños con mejora medible en comprensión lectora, una biblioteca de aula funcionando y material didáctico entregado a la escuela.',
    viabilidad: 'La escuela abre sus aulas en horario extracurricular y los padres respaldan la iniciativa; el material se elabora con recursos de bajo costo.',
    directo: { nombre: 'Niñas y niños de la escuela fiscal de {nombre}', min: 40, max: 90, observaciones: 'Estudiantes de cuarto a séptimo año de EGB.' },
    indirecto: { nombre: 'Docentes y familias de la escuela', min: 100, max: 250 },
    fin: 'Contribuir a la calidad de la educación básica en {lugar}.',
    proposito: 'Los niños participantes mejoran su comprensión lectora y su escritura.',
    componentes: 'C1. Diagnóstico lector. C2. Sesiones de refuerzo en grupos pequeños. C3. Biblioteca de aula itinerante.',
    actividades: ['Evaluación diagnóstica de comprensión lectora', 'Elaboración de material didáctico', 'Sesiones de refuerzo dos veces por semana', 'Evaluación final y feria de lectura'],
    indicadores: { fin: 'Promedio de la escuela en lengua y literatura.', proposito: 'Niños que suben de nivel lector.', componentes: 'Sesiones realizadas y libros en circulación.', actividades: 'Asistencia promedio a las sesiones.' },
    medios: 'Pruebas de entrada y salida, registros de asistencia, portafolios de los niños y fotografías.',
    supuestos: 'La escuela mantiene el horario acordado y los padres envían a sus hijos a las sesiones.',
    estrategias: 'Grupos de seis niños con un estudiante tutor, planificación semanal revisada por el docente supervisor y reuniones mensuales con los maestros de la escuela.',
  },
  {
    titulos: [
      'Gestión de residuos sólidos y reciclaje comunitario en {lugar}',
      'Manejo de residuos y protección de microcuencas en {lugar}',
    ],
    carreras: ['ingenieria ambiental', 'ingenieria forestal', 'geologia', 'turismo'],
    linea: 'Gestión ambiental comunitaria',
    lineaInvestigacion: 'Desarrollo sostenible y ambiente',
    programaVinculacion: 'Innovación',
    ods: ['11. Ciudades y comunidades sostenibles', '6. Agua limpia y saneamiento', '13. Acción por el clima'],
    ejeIgualdad: 'NO_APLICA',
    eje: 'Ambiente y cambio climático',
    objetivoEstrategico: 'Promover la gestión responsable de los recursos naturales y los residuos en las comunidades de la región sur con participación ciudadana.',
    programa: 'Programa de Gestión Ambiental Participativa',
    resumen: 'Estudiantes y vecinos de {lugar} implementan la separación de residuos en la fuente, un punto de acopio de reciclables y mingas de limpieza de la quebrada cercana.',
    descripcion: 'El proyecto trabaja con el comité barrial y la empresa municipal de aseo para que los reciclables lleguen a gestores autorizados.',
    problema: 'En {lugar} los residuos se mezclan y una parte termina en la quebrada, lo que contamina el agua, atrae vectores y genera malos olores.',
    justificacion: 'Separar en la fuente reduce el volumen que llega al relleno sanitario, genera ingresos a recicladores de base y protege la microcuenca que abastece al barrio.',
    objetivo: 'Reducir la contaminación por residuos sólidos en {lugar} mediante la separación en la fuente y la participación de la comunidad.',
    resultados: 'Hogares que separan sus residuos, un punto de acopio funcionando con un gestor autorizado y la quebrada limpia con señalética de protección.',
    viabilidad: 'La empresa municipal de aseo respalda la iniciativa y el comité barrial asume el cuidado del punto de acopio. Los contenedores tienen un costo moderado.',
    directo: { nombre: 'Hogares de {nombre}', min: 80, max: 200, observaciones: 'Hogares cercanos a la quebrada.' },
    indirecto: { nombre: 'Población de la microcuenca', min: 1000, max: 3000 },
    fin: 'Contribuir a un ambiente sano y a la protección de las fuentes de agua de {lugar}.',
    proposito: 'Los hogares de {lugar} separan sus residuos y disminuye la basura en la quebrada.',
    componentes: 'C1. Hogares capacitados en separación. C2. Punto de acopio de reciclables. C3. Mingas de limpieza y señalética.',
    actividades: ['Caracterización de residuos en hogares', 'Talleres casa por casa de separación en la fuente', 'Instalación del punto de acopio', 'Mingas de limpieza de la quebrada'],
    indicadores: { fin: 'Calidad del agua de la quebrada.', proposito: 'Kilogramos de reciclables recuperados al mes.', componentes: 'Hogares capacitados y mingas realizadas.', actividades: 'Visitas casa por casa ejecutadas.' },
    medios: 'Registros de pesaje, actas del comité barrial, análisis de agua y fotografías.',
    supuestos: 'La empresa municipal mantiene la ruta de recolección diferenciada y los vecinos participan en las mingas.',
    estrategias: 'Visitas casa por casa en parejas de estudiantes, mingas mensuales convocadas por el comité barrial y reportes de pesaje compartidos en asamblea.',
  },
]
