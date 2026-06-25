import client from './client'
import { API } from '@/config/api'
import type { DashboardKPIs, EstadisticasPublicas, ReporteProyecto, ReporteConvenio, ReporteProgreso } from '@/types/reportes'
import type { ReporteDocentePayload } from '@/types/reporteDocente'

export const reportesApi = {
  dashboard: () =>
    client.get<{ data: DashboardKPIs }>(API.REPORTES.DASHBOARD),

  estadisticasPublicas: () =>
    client.get<{ data: EstadisticasPublicas }>(API.REPORTES.ESTADISTICAS_PUBLICAS),

  proyectos: (params?: Record<string, string>) =>
    client.get<{ data: ReporteProyecto[] }>(API.REPORTES.PROYECTOS, { params }),

  convenios: (params?: Record<string, string>) =>
    client.get<{ data: ReporteConvenio[] }>(API.REPORTES.CONVENIOS, { params }),

  progreso: (params?: Record<string, string>) =>
    client.get<{ data: ReporteProgreso[] }>(API.REPORTES.PROGRESO, { params }),

  docente: () =>
    client.get<{ data: ReporteDocentePayload }>(API.REPORTES.DOCENTE),
}
