import type { TipoProyecto, PrioridadProyecto, Beneficiario, AlineacionEstrategica, MarcoLogicoFila } from '@/types/proyectos'

/** Estado y opciones del formulario de formulación de proyectos (7 fases). */

export const FASES = [
  { num: 1, label: 'General', titulo: 'Datos generales' },
  { num: 2, label: 'Alineación', titulo: 'Alineación estratégica' },
  { num: 3, label: 'Diagnóstico', titulo: 'Diagnóstico y beneficiarios' },
  { num: 4, label: 'Marco lógico', titulo: 'Matriz de marco lógico' },
  { num: 5, label: 'Planificación', titulo: 'Planificación y presupuesto' },
  { num: 6, label: 'Responsables', titulo: 'Responsables y firmas' },
  { num: 7, label: 'Confirmación', titulo: 'Revisión y envío' },
] as const

export const TOTAL_FASES = FASES.length
export const MAX_CARRERAS = 5

export const TIPOS: { value: TipoProyecto; label: string }[] = [
  { value: 'VINCULACION', label: 'Vinculación' },
  { value: 'INVESTIGACION', label: 'Investigación' },
  { value: 'EXTENSION', label: 'Extensión' },
  { value: 'MIXTO', label: 'Mixto' },
]

export const PRIORIDADES: { value: PrioridadProyecto; label: string }[] = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Crítica' },
]

export const PERIODOS = [
  'Agosto - Diciembre 2026',
  'Abril - Agosto 2026',
  'Agosto - Diciembre 2025',
  'Abril - Agosto 2025',
]

export const LINEAS_INVESTIGACION = [
  'Educación y pedagogía',
  'Salud y bienestar',
  'Tecnología e innovación',
  'Desarrollo sostenible y ambiente',
  'Gestión social y económica',
  'Arte y cultura',
  'Otro',
]

export const PROGRAMAS_VINCULACION = [
  'Servicios comunitarios y sociales',
  'Innovación',
  'Servicios especializados',
  'Educación continua',
  'Prácticas preprofesionales',
]

export const EJES_IGUALDAD = [
  { value: 'GENERO', label: 'Género' },
  { value: 'PUEBLOS', label: 'Pueblos y nacionalidades' },
  { value: 'DISCAPACIDADES', label: 'Discapacidades' },
  { value: 'SOCIOECONOMICA', label: 'Condición socioeconómica' },
  { value: 'NO_APLICA', label: 'No aplica' },
]

export const ODS = [
  '1. Fin de la pobreza',
  '2. Hambre cero',
  '3. Salud y bienestar',
  '4. Educación de calidad',
  '5. Igualdad de género',
  '6. Agua limpia y saneamiento',
  '7. Energía asequible y no contaminante',
  '8. Trabajo decente y crecimiento económico',
  '9. Industria, innovación e infraestructura',
  '10. Reducción de las desigualdades',
  '11. Ciudades y comunidades sostenibles',
  '12. Producción y consumo responsables',
  '13. Acción por el clima',
  '14. Vida submarina',
  '15. Vida de ecosistemas terrestres',
  '16. Paz, justicia e instituciones sólidas',
  '17. Alianzas para lograr los objetivos',
]

export const NIVELES_MARCO = ['FIN', 'PROPOSITO', 'COMPONENTES', 'ACTIVIDADES'] as const
export type NivelMarco = (typeof NIVELES_MARCO)[number]

export const NIVEL_INFO: Record<NivelMarco, { titulo: string; ayuda: string }> = {
  FIN: { titulo: 'Fin', ayuda: 'Impacto general al que contribuye el proyecto.' },
  PROPOSITO: { titulo: 'Propósito', ayuda: 'Cambio logrado al terminar el proyecto.' },
  COMPONENTES: { titulo: 'Componentes', ayuda: 'Resultados o productos que entrega el proyecto.' },
  ACTIVIDADES: { titulo: 'Actividades', ayuda: 'Acciones principales para lograr los componentes.' },
}

export const ALINEACION_VACIA = {
  eje: '',
  objetivo_estrategico: '',
  programa: '',
  plan: '',
  descripcion: '',
  linea_investigacion: '',
  programa_vinculacion: '',
  eje_plan_igualdad: '',
  ods: '',
  plan_nacional_desarrollo: '',
  agenda_zonal: '',
}

export const BENEFICIARIO_VACIO = {
  tipo: 'DIRECTO' as 'DIRECTO' | 'INDIRECTO',
  nombre: '',
  cantidad_estimada: '',
  ubicacion: '',
  observaciones: '',
}

export interface BeneficiarioItem extends Omit<Beneficiario, 'id' | 'proyecto' | 'cantidad_estimada' | 'creado_en' | 'actualizado_en' | 'descripcion'> {
  id?: number
  _key: string
  cantidad_estimada: string
}

export interface AlineacionItem extends Omit<AlineacionEstrategica, 'id' | 'proyecto' | 'creado_en' | 'actualizado_en'> {
  id?: number
  _key: string
}

export interface AnexoFile {
  _key: string
  file: File
  name: string
  size: number
}

export interface MarcoLogicoItem extends Omit<MarcoLogicoFila, 'id' | 'proyecto' | 'creado_en' | 'actualizado_en'> {
  id?: number
  _key: string
}

export interface FormState {
  titulo: string
  tipo: TipoProyecto
  prioridad: PrioridadProyecto
  carreras: string[]
  linea_intervencion: string
  resumen: string
  descripcion: string
  instituciones_participantes: string
  problema: string
  justificacion: string
  objetivo_general: string
  resultados_esperados: string
  viabilidad: string
  beneficiarios: BeneficiarioItem[]
  alineaciones: AlineacionItem[]
  marco_logico: MarcoLogicoItem[]
  fecha_inicio: string
  fecha_fin_planificada: string
  presupuesto_aprobado: string
  monto_unl_valorado: string
  monto_unl_economico: string
  monto_externo_valorado: string
  monto_externo_economico: string
  observaciones: string
  estrategias_ejecucion: string
  seguimiento_evaluacion: string
  responsable: string
  coordinador_academico: string
  responsable_cedula: string
  responsable_celular: string
  responsable_cargo: string
  anexos: AnexoFile[]
  confirm: boolean
  periodo_academico: string
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export const marcoLogicoVacio = (): MarcoLogicoItem[] =>
  NIVELES_MARCO.map((nivel) => ({ _key: uid(), nivel, resumen_narrativo: '', indicadores: '', medios_verificacion: '', supuestos: '' }))

export const formularioVacio = (): FormState => ({
  titulo: '',
  tipo: 'VINCULACION',
  prioridad: 'MEDIA',
  carreras: [],
  linea_intervencion: '',
  resumen: '',
  descripcion: '',
  instituciones_participantes: '',
  problema: '',
  justificacion: '',
  objetivo_general: '',
  resultados_esperados: '',
  viabilidad: '',
  beneficiarios: [],
  alineaciones: [],
  marco_logico: marcoLogicoVacio(),
  fecha_inicio: '',
  fecha_fin_planificada: '',
  presupuesto_aprobado: '',
  monto_unl_valorado: '',
  monto_unl_economico: '',
  monto_externo_valorado: '',
  monto_externo_economico: '',
  observaciones: '',
  estrategias_ejecucion: '',
  seguimiento_evaluacion: '',
  responsable: '',
  coordinador_academico: '',
  responsable_cedula: '',
  responsable_celular: '',
  responsable_cargo: '',
  anexos: [],
  confirm: false,
  periodo_academico: '',
})

/** ¿El usuario ya escribió algo? (para pedir confirmación antes de sobrescribir). */
export function tieneDatos(form: FormState): boolean {
  const vacio = formularioVacio()
  const textos: (keyof FormState)[] = [
    'titulo', 'linea_intervencion', 'resumen', 'descripcion', 'instituciones_participantes', 'problema',
    'justificacion', 'objetivo_general', 'resultados_esperados', 'viabilidad', 'fecha_inicio',
    'fecha_fin_planificada', 'monto_unl_valorado', 'monto_unl_economico', 'monto_externo_valorado',
    'monto_externo_economico', 'observaciones', 'estrategias_ejecucion', 'seguimiento_evaluacion',
    'responsable', 'coordinador_academico', 'periodo_academico',
  ]
  return (
    textos.some((k) => String(form[k] ?? '').trim() !== String(vacio[k] ?? '')) ||
    form.carreras.length > 0 || form.beneficiarios.length > 0 || form.alineaciones.length > 0 ||
    form.anexos.length > 0 || form.marco_logico.some((m) => m.resumen_narrativo.trim() || m.indicadores.trim())
  )
}

export const totalPresupuesto = (f: Pick<FormState, 'monto_unl_valorado' | 'monto_unl_economico' | 'monto_externo_valorado' | 'monto_externo_economico'>) =>
  Number(f.monto_unl_valorado || 0) + Number(f.monto_unl_economico || 0) +
  Number(f.monto_externo_valorado || 0) + Number(f.monto_externo_economico || 0)
