export type TipoProyecto = 'VINCULACION' | 'INVESTIGACION' | 'EXTENSION' | 'MIXTO'
export type EstadoProyecto = 'BORRADOR' | 'EN_REVISION' | 'APROBADO' | 'EN_EJECUCION' | 'EN_SUSPENSION' | 'FINALIZADO' | 'CERRADO' | 'CANCELADO'
export type PrioridadProyecto = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA'
export type TipoObjetivo = 'GENERAL' | 'ESPECIFICO'
export type EstadoIndicador = 'ACTIVO' | 'EN_ALERTA' | 'CUMPLIDO' | 'NO_CUMPLIDO'
export type FrecuenciaIndicador = 'DIARIA' | 'SEMANAL' | 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'
export type EstadoActividad = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'ATRASADA' | 'CANCELADA'
export type RolParticipante = 'LIDER' | 'DOCENTE' | 'ESTUDIANTE' | 'APOYO' | 'EXTERNO'
export type EstadoParticipante = 'ACTIVO' | 'INACTIVO' | 'RETIRADO'
export type EstadoPresupuesto = 'PENDIENTE' | 'APROBADO' | 'EJECUTADO'
export type TipoBeneficiario = 'DIRECTO' | 'INDIRECTO'
export type TipoFirma = 'RESPONSABLE' | 'COORDINADOR' | 'APROBADOR'
export type TipoAnexo = 'CONVENIO' | 'RESOLUCION' | 'CARTA' | 'AVANCE' | 'OTRO'

export interface Proyecto {
  id: number
  codigo: string
  titulo: string
  resumen: string
  descripcion: string
  problema: string
  justificacion: string
  objetivo_general: string
  resultados_esperados: string
  linea_intervencion: string
  tipo: TipoProyecto
  prioridad: PrioridadProyecto
  estado: EstadoProyecto
  carrera: number | null
  carrera_nombre?: string
  responsable: number | null
  responsable_nombre?: string
  responsable_email?: string | null
  coordinador_academico: number | null
  coordinador_academico_nombre?: string | null
  fecha_inicio: string | null
  fecha_fin_planificada: string | null
  fecha_fin_real: string | null
  presupuesto_aprobado: string
  presupuesto?: Presupuesto | null
  direccion_ejecucion: string
  observaciones: string
  viabilidad: string
  seguimiento_evaluacion: string
  estrategias_ejecucion?: string
  beneficiarios_directos: string
  beneficiarios_indirectos: string
  imagen_portada: string | null
  activo: boolean
  actividades_count?: number
  objetivos_count?: number
  marco_logico?: MarcoLogicoFila[]
  creado_en: string
  actualizado_en: string
}

export interface Objetivo {
  id: number
  proyecto: number
  tipo: TipoObjetivo
  orden: number
  descripcion: string
  meta: string
  cumplido: boolean
  fecha_cumplimiento: string | null
  observaciones: string
  creado_en: string
  actualizado_en: string
}

export interface Indicador {
  id: number
  objetivo: number
  codigo: string
  nombre: string
  descripcion: string
  formula: string
  unidad_medida: string
  linea_base: string
  meta: string
  valor_actual: string
  frecuencia: FrecuenciaIndicador
  estado: EstadoIndicador
  fecha_medicion: string | null
  observaciones: string
  creado_en: string
  actualizado_en: string
}

export interface Actividad {
  id: number
  proyecto: number
  objetivo: number | null
  codigo: string
  nombre: string
  descripcion: string
  fecha_inicio: string | null
  fecha_fin: string | null
  responsable: number | null
  porcentaje_programado: string
  porcentaje_ejecucion: string
  porcentaje_avance: string
  estado: EstadoActividad
  orden: number
  requiere_evidencia: boolean
  observaciones: string
  creado_en: string
  actualizado_en: string
}

export interface ParticipanteProyecto {
  id: number
  proyecto: number
  usuario: number
  usuario_nombre?: string
  usuario_codigo?: string
  rol: RolParticipante
  fecha_inicio: string | null
  fecha_fin: string | null
  horas_comprometidas: string
  horas_cumplidas: string
  estado: EstadoParticipante
  observaciones: string
  creado_en: string
  actualizado_en: string
}

export interface Presupuesto {
  id: number
  proyecto: number
  codigo: string
  monto_aprobado: string
  monto_ejecutado: string
  monto_saldo: string
  monto_unl_valorado: string
  monto_unl_economico: string
  monto_externo_valorado: string
  monto_externo_economico: string
  estado: EstadoPresupuesto
  fecha_aprobacion: string | null
  responsable: number | null
  observaciones: string
  creado_en: string
  actualizado_en: string
}

export interface Beneficiario {
  id: number
  proyecto: number
  tipo: TipoBeneficiario
  nombre: string
  descripcion: string
  cantidad_estimada: number
  ubicacion: string
  observaciones: string
  creado_en: string
  actualizado_en: string
}

export interface AlineacionEstrategica {
  id: number
  proyecto: number
  eje: string
  objetivo_estrategico: string
  programa: string
  plan: string
  descripcion: string
  linea_investigacion: string
  programa_vinculacion: string
  eje_plan_igualdad: string
  ods: string
  plan_nacional_desarrollo: string
  agenda_zonal: string
  creado_en: string
  actualizado_en: string
}

export interface MarcoLogicoFila {
  id: number
  proyecto: number
  nivel: 'FIN' | 'PROPOSITO' | 'COMPONENTES' | 'ACTIVIDADES'
  resumen_narrativo: string
  indicadores: string
  medios_verificacion: string
  supuestos: string
  creado_en: string
  actualizado_en: string
}

export interface FirmaResponsabilidad {
  id: number
  proyecto: number
  usuario: number
  usuario_nombre?: string | null
  usuario_codigo?: string | null
  tipo: TipoFirma
  fecha_firma: string | null
  comentario: string
  creado_en: string
  actualizado_en: string
}

export interface Anexo {
  id: number
  proyecto: number
  nombre: string
  archivo: string
  tipo: TipoAnexo
  descripcion: string
  subido_por: number | null
  subido_por_nombre: string | null
  orden: number
  creado_en: string
  actualizado_en: string
}
