import client from './client'
import { API } from '@/config/api'
import type { Convenio, Institucion, ProyectoConvenio, Compromiso, Producto, Contribucion } from '@/types/convenios'
import type { PaginatedResponse } from '@/types/common'

export const institucionesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Institucion>>(API.INSTITUCIONES.LIST, { params }),
  get: (id: number) => client.get<Institucion>(API.INSTITUCIONES.DETAIL(id)),
  create: (data: Partial<Institucion>) => client.post(API.INSTITUCIONES.LIST, data),
  update: (id: number, data: Partial<Institucion>) => client.patch(API.INSTITUCIONES.DETAIL(id), data),
  delete: (id: number) => client.delete(API.INSTITUCIONES.DETAIL(id)),
}

export const conveniosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Convenio>>(API.CONVENIOS.LIST, { params }),

  get: (id: number) => client.get<Convenio>(API.CONVENIOS.DETAIL(id)),
  create: (data: Partial<Convenio>) => client.post(API.CONVENIOS.LIST, data),
  update: (id: number, data: Partial<Convenio>) => client.patch(API.CONVENIOS.DETAIL(id), data),
  delete: (id: number) => client.delete(API.CONVENIOS.DETAIL(id)),

  enviarRevision: (id: number) => client.post(API.CONVENIOS.ENVIAR_REVISION(id)),
  aprobar: (id: number) => client.post(API.CONVENIOS.APROBAR(id)),
  rechazar: (id: number) => client.post(API.CONVENIOS.RECHAZAR(id)),
  suspender: (id: number) => client.post(API.CONVENIOS.SUSPENDER(id)),
  finalizar: (id: number) => client.post(API.CONVENIOS.FINALIZAR(id)),
  cancelar: (id: number) => client.post(API.CONVENIOS.CANCELAR(id)),
}

export const proyectoConveniosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<ProyectoConvenio>>(API.CONVENIOS.PROYECTO_CONVENIOS, { params }),
  create: (data: Partial<ProyectoConvenio>) => client.post(API.CONVENIOS.PROYECTO_CONVENIOS, data),
  delete: (id: number) => client.delete(`/proyecto-convenios/${id}/`),
}

export const compromisosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Compromiso>>(API.CONVENIOS.COMPROMISOS, { params }),
  create: (data: Partial<Compromiso>) => client.post(API.CONVENIOS.COMPROMISOS, data),
  update: (id: number, data: Partial<Compromiso>) => client.patch(`/compromisos/${id}/`, data),
  delete: (id: number) => client.delete(`/compromisos/${id}/`),
}

export const productosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Producto>>(API.CONVENIOS.PRODUCTOS, { params }),
  create: (data: Partial<Producto>) => client.post(API.CONVENIOS.PRODUCTOS, data),
  update: (id: number, data: Partial<Producto>) => client.patch(`/productos/${id}/`, data),
  delete: (id: number) => client.delete(`/productos/${id}/`),
}

export const contribucionesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Contribucion>>(API.CONVENIOS.CONTRIBUCIONES, { params }),
  create: (data: Partial<Contribucion>) => client.post(API.CONVENIOS.CONTRIBUCIONES, data),
  update: (id: number, data: Partial<Contribucion>) => client.patch(`/contribuciones/${id}/`, data),
  delete: (id: number) => client.delete(`/contribuciones/${id}/`),
}
