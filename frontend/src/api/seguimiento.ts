import client from './client'
import { API } from '@/config/api'
import type { Avance, Evidencia, Informe, Alerta, Revision, FlujoValidacion } from '@/types/seguimiento'
import type { PaginatedResponse } from '@/types/common'

export const avancesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Avance>>(API.SEGUIMIENTO.AVANCES, { params }),
  create: (data: Partial<Avance>) => client.post(API.SEGUIMIENTO.AVANCES, data),
  update: (id: number, data: Partial<Avance>) => client.patch(API.SEGUIMIENTO.AVANCE_DETAIL(id), data),
  delete: (id: number) => client.delete(API.SEGUIMIENTO.AVANCE_DETAIL(id)),
  aprobar: (id: number) => client.post(API.SEGUIMIENTO.AVANCE_APROBAR(id)),
  rechazar: (id: number) => client.post(API.SEGUIMIENTO.AVANCE_RECHAZAR(id)),
}

export const evidenciasApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Evidencia>>(API.SEGUIMIENTO.EVIDENCIAS, { params }),
  create: (data: FormData) =>
    client.post(API.SEGUIMIENTO.EVIDENCIAS, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => client.delete(API.SEGUIMIENTO.EVIDENCIA_DETAIL(id)),
}

export const informesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Informe>>(API.SEGUIMIENTO.INFORMES, { params }),
  get: (id: number) => client.get<Informe>(API.SEGUIMIENTO.INFORME_DETAIL(id)),
  create: (data: Partial<Informe>) => client.post(API.SEGUIMIENTO.INFORMES, data),
  update: (id: number, data: Partial<Informe>) => client.patch(API.SEGUIMIENTO.INFORME_DETAIL(id), data),
  delete: (id: number) => client.delete(API.SEGUIMIENTO.INFORME_DETAIL(id)),
}

export const alertasApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Alerta>>(API.SEGUIMIENTO.ALERTAS, { params }),
  leer: (id: number) => client.post(API.SEGUIMIENTO.ALERTA_LEER(id)),
  atender: (id: number) => client.post(API.SEGUIMIENTO.ALERTA_ATENDER(id)),
}

export const revisionesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Revision>>(API.SEGUIMIENTO.REVISIONES, { params }),
  create: (data: Partial<Revision>) => client.post(API.SEGUIMIENTO.REVISIONES, data),
}

export const flujosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<FlujoValidacion>>(API.SEGUIMIENTO.FLUJOS_VALIDACION, { params }),
  create: (data: Partial<FlujoValidacion>) => client.post(API.SEGUIMIENTO.FLUJOS_VALIDACION, data),
  update: (id: number, data: Partial<FlujoValidacion>) => client.patch(`/flujos-validacion/${id}/`, data),
}
