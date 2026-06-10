export type EstadoAvance = 'PENDIENTE' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO'
export type EstadoInforme = 'BORRADOR' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO'
export type TipoEvidencia = 'FOTOGRAFIA' | 'VIDEO' | 'DOCUMENTO' | 'ENLACE' | 'OTRO'
export type TipoInforme = 'INICIAL' | 'PARCIAL' | 'FINAL' | 'TECNICO' | 'FINANCIERO'
export type EstadoAlerta = 'PENDIENTE' | 'LEIDA' | 'ATENDIDA' | 'CANCELADA'
export type PrioridadAlerta = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE'

export interface Avance {
  id: number
  actividad: number
  registrado_por: number | null
  registrado_por_nombre?: string
  porcentaje_avance: string
  descripcion: string
  dificultades: string
  acciones_correctivas: string
  horas_invertidas: string
  fecha_registro: string
  estado: EstadoAvance
  evidencias?: Evidencia[]
  creado_en: string
  actualizado_en: string
}

export interface Evidencia {
  id: number
  avance: number | null
  actividad: number | null
  tipo: TipoEvidencia
  titulo: string
  descripcion: string
  archivo: string | null
  enlace_externo: string
  tamano_archivo: number | null
  mime_type: string
  subido_por: number | null
  subido_por_nombre?: string
  fecha_carga: string
  verificada: boolean
  creado_en: string
  actualizado_en: string
}

export interface Informe {
  id: number
  proyecto: number
  tipo: TipoInforme
  numero: string
  titulo: string
  resumen: string
  contenido: string
  periodo_inicio: string | null
  periodo_fin: string | null
  elaborado_por: number | null
  elaborado_por_nombre?: string
  aprobado_por: number | null
  estado: EstadoInforme
  archivo: string | null
  fecha_emision: string | null
  observaciones: string
  creado_en: string
  actualizado_en: string
}

export interface Alerta {
  id: number
  usuario: number
  usuario_nombre?: string
  proyecto: number | null
  proyecto_codigo?: string
  convenio: number | null
  convenio_codigo?: string
  mensaje: string
  detalle: string
  prioridad: PrioridadAlerta
  estado: EstadoAlerta
  enlace: string
  leida: boolean
  fecha_vencimiento: string | null
  creado_en: string
  actualizado_en: string
}

export interface Revision {
  id: number
  proyecto: number
  revisor: number
  revisor_nombre?: string
  fecha_revision: string
  decision: 'APROBADO' | 'OBSERVADO' | 'RECHAZADO'
  comentario: string
  observaciones: string
  creado_en: string
  actualizado_en: string
}

export interface FlujoValidacion {
  id: number
  proyecto: number
  paso: number
  nombre_paso: string
  responsable: number | null
  responsable_nombre?: string
  estado: 'PENDIENTE' | 'COMPLETADO' | 'RECHAZADO'
  fecha_completado: string | null
  comentario: string
  creado_en: string
  actualizado_en: string
}
