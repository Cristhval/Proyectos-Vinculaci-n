import client from './client'
import type { DashboardKPIs, ReporteProyecto, ReporteConvenio, ReporteProgreso } from '@/types/reportes'

export const reportesApi = {
  dashboard: () =>
    client.get<{ data: DashboardKPIs }>('/reportes/dashboard/'),

  proyectos: (params?: Record<string, string>) =>
    client.get<{ data: ReporteProyecto[] }>('/reportes/proyectos/', { params }),

  convenios: (params?: Record<string, string>) =>
    client.get<{ data: ReporteConvenio[] }>('/reportes/convenios/', { params }),

  progreso: (params?: Record<string, string>) =>
    client.get<{ data: ReporteProgreso[] }>('/reportes/progreso/', { params }),
}
