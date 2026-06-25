export type TipoConvenio = 'MARCO' | 'ESPECIFICO' | 'COOPERACION' | 'OTRO'
export type EstadoConvenio = 'BORRADOR' | 'EN_REVISION' | 'VIGENTE' | 'VENCIDO' | 'SUSPENDIDO' | 'FINALIZADO' | 'CANCELADO'
export type EstadoCompromiso = 'PENDIENTE' | 'EN_PROCESO' | 'CUMPLIDO' | 'INCUMPLIDO'
export type TipoContribucion = 'FINANCIERO' | 'HORAS' | 'INFRAESTRUCTURA' | 'EQUIPO' | 'SERVICIO' | 'EXTERNO'

export interface Institucion {
  id: number
  nombre: string
  sigla: string
  descripcion: string
  direccion: string
  telefono: string
  email: string
  sitio_web: string
  activa: boolean
  creado_en: string
  actualizado_en: string
}

export interface Convenio {
  id: number
  codigo: string
  institucion: Institucion | null
  entidad_contraparte: string
  objeto: string
  descripcion: string
  fecha_firma: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  tipo: TipoConvenio
  estado: EstadoConvenio
  archivo_firmado: string | null
  observaciones: string
  activo: boolean
  compromisos?: Compromiso[]
  productos?: Producto[]
  proyectos_vinculados_count?: number
  creado_en: string
  actualizado_en: string
}

export interface ProyectoConvenio {
  id: number
  proyecto: number
  proyecto_codigo?: string
  convenio: Convenio | number
  convenio_id?: number
  fecha_vinculacion: string
  vigente: boolean
  observaciones: string
  creado_en: string
  actualizado_en: string
}

export interface Compromiso {
  id: number
  convenio: number
  codigo: string
  descripcion: string
  fecha_compromiso: string | null
  fecha_vencimiento: string | null
  responsable: number | null
  responsable_nombre?: string
  estado: EstadoCompromiso
  observaciones: string
  creado_en: string
  actualizado_en: string
}

export interface Producto {
  id: number
  convenio: number
  codigo: string
  nombre: string
  descripcion: string
  tipo: string
  fecha_entrega_esperada: string | null
  fecha_entrega_real: string | null
  entregado: boolean
  archivo: string | null
  observaciones: string
  creado_en: string
  actualizado_en: string
}

export interface Contribucion {
  id: number
  proyecto: number
  institucion: number | null
  institucion_nombre?: string
  tipo: TipoContribucion
  descripcion: string
  valor: string
  fecha_aporte: string | null
  observaciones: string
  creado_en: string
  actualizado_en: string
}
