import client from './client'
import { API } from '@/config/api'
import type { Auditoria } from '@/types/auditoria'
import type { PaginatedResponse } from '@/types/common'

export interface AuditoriaStats {
  total: number
  acciones_24h: number
  usuarios_activos_24h: number
  acciones_criticas: number
}

export const auditoriaApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Auditoria>>(API.AUDITORIA.LIST, { params }),

  stats: () =>
    client.get<AuditoriaStats>(API.AUDITORIA.STATS),
}
