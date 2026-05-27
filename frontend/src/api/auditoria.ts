import client from './client'
import type { Auditoria } from '@/types/auditoria'
import type { PaginatedResponse } from '@/types/common'

export const auditoriaApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Auditoria>>('/auditoria/registros/', { params }),
}
