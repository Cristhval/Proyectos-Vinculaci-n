export interface DashboardKPIs {
  resumen: {
    proyectos_activos: number
    proyectos_finalizados: number
    actividades_atrasadas: number
    convenios_activos: number
    convenios_por_vencer: number
    alertas_pendientes: number
    compromisos_pendientes: number
  }
  proyectos_por_estado: { estado: string; total: number }[]
  proyectos_por_tipo: { tipo: string; total: number }[]
  actividades_por_estado: { estado: string; total: number }[]
}

export interface ReporteProyecto {
  id: number
  codigo: string
  titulo: string
  estado: string
  tipo: string
  carrera: string | null
  responsable: string | null
  fecha_inicio: string | null
  fecha_fin_planificada: string | null
  presupuesto_aprobado: string
  actividades_count: number
  objetivos_count: number
  progreso: number
}

export interface ReporteConvenio {
  id: number
  codigo: string
  entidad_contraparte: string
  tipo: string
  estado: string
  institucion: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  compromisos_count: number
  productos_count: number
}

export interface ReporteProgreso {
  proyecto_codigo: string
  proyecto_titulo: string
  actividades: {
    codigo: string
    nombre: string
    estado: string
    porcentaje_programado: string
    porcentaje_ejecucion: string
    fecha_inicio: string | null
    fecha_fin: string | null
  }[]
}
