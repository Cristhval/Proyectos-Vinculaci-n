import client from './client'
import { API } from '@/config/api'
import type { FormatoInstitucional } from '@/types/formatos'
import type { PaginatedResponse } from '@/types/common'

export const formatosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<FormatoInstitucional>>(API.FORMATOS.LIST, { params }),

  create: (formData: FormData) =>
    client.post(API.FORMATOS.LIST, formData),

  delete: (id: number) =>
    client.delete(API.FORMATOS.DETAIL(id)),
}
