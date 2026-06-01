import client from './client'
import { API } from '@/config/api'
import type { DashboardKPIs, ReporteProyecto, ReporteConvenio, ReporteProgreso } from '@/types/reportes'

export const reportesApi = {
  dashboard: () =>
    client.get<{ data: DashboardKPIs }>(API.REPORTES.DASHBOARD),

  proyectos: (params?: Record<string, string>) =>
    client.get<{ data: ReporteProyecto[] }>(API.REPORTES.PROYECTOS, { params }),

  convenios: (params?: Record<string, string>) =>
    client.get<{ data: ReporteConvenio[] }>(API.REPORTES.CONVENIOS, { params }),

  progreso: (params?: Record<string, string>) =>
    client.get<{ data: ReporteProgreso[] }>(API.REPORTES.PROGRESO, { params }),
}
