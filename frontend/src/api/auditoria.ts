import client from './client'
import { API } from '@/config/api'
import type { Auditoria } from '@/types/auditoria'
import type { PaginatedResponse } from '@/types/common'

export const auditoriaApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Auditoria>>(API.AUDITORIA.LIST, { params }),
}
