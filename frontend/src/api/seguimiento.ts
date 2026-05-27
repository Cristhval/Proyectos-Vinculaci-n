import client from './client'
import type { Avance, Evidencia, Informe, Alerta, Revision, FlujoValidacion } from '@/types/seguimiento'
import type { PaginatedResponse } from '@/types/common'

export const avancesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Avance>>('/avances/', { params }),
  create: (data: Partial<Avance>) => client.post('/avances/', data),
  update: (id: number, data: Partial<Avance>) => client.patch(`/avances/${id}/`, data),
  delete: (id: number) => client.delete(`/avances/${id}/`),
  aprobar: (id: number) => client.post(`/avances/${id}/aprobar/`),
  rechazar: (id: number) => client.post(`/avances/${id}/rechazar/`),
}

export const evidenciasApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Evidencia>>('/evidencias/', { params }),
  create: (data: FormData) =>
    client.post('/evidencias/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => client.delete(`/evidencias/${id}/`),
}

export const informesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Informe>>('/informes/', { params }),
  get: (id: number) => client.get<Informe>(`/informes/${id}/`),
  create: (data: Partial<Informe>) => client.post('/informes/', data),
  update: (id: number, data: Partial<Informe>) => client.patch(`/informes/${id}/`, data),
  delete: (id: number) => client.delete(`/informes/${id}/`),
}

export const alertasApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Alerta>>('/alertas/', { params }),
  leer: (id: number) => client.post(`/alertas/${id}/leer/`),
  atender: (id: number) => client.post(`/alertas/${id}/atender/`),
}

export const revisionesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Revision>>('/revisiones/', { params }),
  create: (data: Partial<Revision>) => client.post('/revisiones/', data),
}

export const flujosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<FlujoValidacion>>('/flujos-validacion/', { params }),
  create: (data: Partial<FlujoValidacion>) => client.post('/flujos-validacion/', data),
  update: (id: number, data: Partial<FlujoValidacion>) => client.patch(`/flujos-validacion/${id}/`, data),
}
