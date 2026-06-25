export interface ReporteDocentePayload {
  kpis: {
    total_proyectos: number
    proyectos_activos: number
    proyectos_en_ejecucion: number
    proyectos_finalizados: number
    proyectos_borrador: number
    total_actividades: number
    actividades_completadas: number
    actividades_atrasadas: number
    avance_promedio: number
    total_participantes: number
    total_objetivos: number
    objetivos_cumplidos: number
    objetivos_pendientes: number
    total_indicadores: number
    total_evidencias: number
    presupuesto_aprobado: number
    presupuesto_ejecutado: number
    presupuesto_saldo: number
  }
  proyectos: ReporteDocenteProyecto[]
  cronograma: ReporteDocenteCronograma[]
  actividades_por_estado: { estado: string; total: number }[]
  avances_por_estado: { estado: string; total: number }[]
  participantes_por_rol: { rol: string; total: number }[]
  objetivos: { cumplidos: number; pendientes: number }
  indicadores_por_estado: { estado: string; total: number }[]
  carga_mensual: { mes: string; planificadas: number; ejecutadas: number }[]
  evidencias_por_tipo: { tipo: string; total: number }[]
  informes_por_tipo: { tipo: string; total: number }[]
  beneficiarios_por_tipo: { tipo: string; total: number; cantidad: number }[]
  presupuesto_detalle: {
    aprobado: number
    ejecutado: number
    saldo: number
    unl_valorado: number
    unl_economico: number
    externo_valorado: number
    externo_economico: number
  }
}

export interface ReporteDocenteProyecto {
  id: number
  codigo: string
  titulo: string
  estado: string
  tipo: string
  carrera: string | null
  carrera_id: number | null
  responsable: string | null
  fecha_inicio: string | null
  fecha_fin_planificada: string | null
  presupuesto_aprobado: string
  actividades_count: number
  objetivos_count: number
  progreso: number
}

export interface ReporteDocenteCronograma {
  codigo: string
  titulo: string
  estado: string
  fecha_inicio: string
  fecha_fin_planificada: string
  progreso: number
}
