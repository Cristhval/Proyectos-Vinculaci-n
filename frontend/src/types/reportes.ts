export interface DashboardKPIs {
  resumen: {
    total_proyectos: number
    proyectos_activos: number
    total_convenios: number
    convenios_vigentes: number
  }
  proyectos_por_estado: Record<string, number>
  proyectos_por_tipo: Record<string, number>
  actividades_por_estado: Record<string, number>
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
  actividad_id: number
  actividad_codigo: string
  actividad_nombre: string
  estado: string
  porcentaje_programado: number
  porcentaje_ejecucion: number
  responsable: string | null
}
