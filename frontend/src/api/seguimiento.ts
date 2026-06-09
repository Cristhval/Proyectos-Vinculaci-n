import client from './client'
import { API } from '@/config/api'
import type { Avance, Evidencia, Informe, Alerta, Revision, FlujoValidacion } from '@/types/seguimiento'
import type { PaginatedResponse } from '@/types/common'

export const avancesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Avance>>(API.SEGUIMIENTO.AVANCES.LIST, { params }),
  get: (id: number) => client.get<Avance>(API.SEGUIMIENTO.AVANCES.DETAIL(id)),
  byActividad: (actividadId: number) =>
    client.get<PaginatedResponse<Avance>>(API.SEGUIMIENTO.AVANCES.BY_ACTIVIDAD(actividadId)),
  create: (data: Partial<Avance>) => client.post(API.SEGUIMIENTO.AVANCES.LIST, data),
  update: (id: number, data: Partial<Avance>) =>
    client.patch(API.SEGUIMIENTO.AVANCES.DETAIL(id), data),
  delete: (id: number) => client.delete(API.SEGUIMIENTO.AVANCES.DETAIL(id)),
  aprobar: (id: number) => client.post(API.SEGUIMIENTO.AVANCES.APROBAR(id)),
  rechazar: (id: number, data: { motivo: string }) =>
    client.post(API.SEGUIMIENTO.AVANCES.RECHAZAR(id), data),
}

export const evidenciasApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Evidencia>>(API.SEGUIMIENTO.EVIDENCIAS.LIST, { params }),
  byAvance: (avanceId: number) =>
    client.get<PaginatedResponse<Evidencia>>(API.SEGUIMIENTO.EVIDENCIAS.BY_AVANCE(avanceId)),
  byActividad: (actividadId: number) =>
    client.get<PaginatedResponse<Evidencia>>(API.SEGUIMIENTO.EVIDENCIAS.BY_ACTIVIDAD(actividadId)),
  get: (id: number) => client.get<Evidencia>(API.SEGUIMIENTO.EVIDENCIAS.DETAIL(id)),
  create: (data: FormData) =>
    client.post(API.SEGUIMIENTO.EVIDENCIAS.LIST, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => client.delete(API.SEGUIMIENTO.EVIDENCIAS.DETAIL(id)),
}

export const informesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Informe>>(API.SEGUIMIENTO.INFORMES.LIST, { params }),
  get: (id: number) => client.get<Informe>(API.SEGUIMIENTO.INFORMES.DETAIL(id)),
  create: (data: Partial<Informe>) => client.post(API.SEGUIMIENTO.INFORMES.LIST, data),
  update: (id: number, data: Partial<Informe>) =>
    client.patch(API.SEGUIMIENTO.INFORMES.DETAIL(id), data),
  delete: (id: number) => client.delete(API.SEGUIMIENTO.INFORMES.DETAIL(id)),
}

export const alertasApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Alerta>>(API.SEGUIMIENTO.ALERTAS.LIST, { params }),
  get: (id: number) => client.get<Alerta>(API.SEGUIMIENTO.ALERTAS.DETAIL(id)),
  leer: (id: number) => client.post(API.SEGUIMIENTO.ALERTAS.LEER(id)),
  atender: (id: number) => client.post(API.SEGUIMIENTO.ALERTAS.ATENDER(id)),
}

export const revisionesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Revision>>(API.SEGUIMIENTO.REVISIONES.LIST, { params }),
  create: (data: Partial<Revision>) => client.post(API.SEGUIMIENTO.REVISIONES.LIST, data),
}

export const flujosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<FlujoValidacion>>(API.SEGUIMIENTO.FLUJOS_VALIDACION.LIST, { params }),
  create: (data: Partial<FlujoValidacion>) =>
    client.post(API.SEGUIMIENTO.FLUJOS_VALIDACION.LIST, data),
  update: (id: number, data: Partial<FlujoValidacion>) =>
    client.patch(`/flujos-validacion/${id}/`, data),
}
