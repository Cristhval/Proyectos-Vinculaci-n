import client from './client'
import { API } from '@/config/api'
import type { Formato } from '@/types/formatos'
import type { PaginatedResponse } from '@/types/common'

export const formatosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Formato>>(API.FORMATOS.LIST, {
      params: { page_size: '1000', ...params },
    }),
  create: (data: FormData) =>
    client.post<Formato>(API.FORMATOS.LIST, data),
  delete: (id: number) => client.delete(API.FORMATOS.DETAIL(id)),
}
