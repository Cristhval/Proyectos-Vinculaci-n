import client from './client'
import type { Convenio, Institucion, ProyectoConvenio, Compromiso, Producto, Contribucion } from '@/types/convenios'
import type { PaginatedResponse } from '@/types/common'

export const institucionesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Institucion>>('/instituciones/', { params }),
  get: (id: number) => client.get<Institucion>(`/instituciones/${id}/`),
  create: (data: Partial<Institucion>) => client.post('/instituciones/', data),
  update: (id: number, data: Partial<Institucion>) => client.patch(`/instituciones/${id}/`, data),
  delete: (id: number) => client.delete(`/instituciones/${id}/`),
}

export const conveniosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Convenio>>('/convenios/', { params }),

  get: (id: number) => client.get<Convenio>(`/convenios/${id}/`),
  create: (data: Partial<Convenio>) => client.post('/convenios/', data),
  update: (id: number, data: Partial<Convenio>) => client.patch(`/convenios/${id}/`, data),
  delete: (id: number) => client.delete(`/convenios/${id}/`),

  // Workflow actions
  enviarRevision: (id: number) => client.post(`/convenios/${id}/enviar-revision/`),
  aprobar: (id: number) => client.post(`/convenios/${id}/aprobar/`),
  rechazar: (id: number) => client.post(`/convenios/${id}/rechazar/`),
  suspender: (id: number) => client.post(`/convenios/${id}/suspender/`),
  finalizar: (id: number) => client.post(`/convenios/${id}/finalizar/`),
  cancelar: (id: number) => client.post(`/convenios/${id}/cancelar/`),
}

export const proyectoConveniosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<ProyectoConvenio>>('/proyecto-convenios/', { params }),
  create: (data: Partial<ProyectoConvenio>) => client.post('/proyecto-convenios/', data),
  delete: (id: number) => client.delete(`/proyecto-convenios/${id}/`),
}

export const compromisosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Compromiso>>('/compromisos/', { params }),
  create: (data: Partial<Compromiso>) => client.post('/compromisos/', data),
  update: (id: number, data: Partial<Compromiso>) => client.patch(`/compromisos/${id}/`, data),
  delete: (id: number) => client.delete(`/compromisos/${id}/`),
}

export const productosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Producto>>('/productos/', { params }),
  create: (data: Partial<Producto>) => client.post('/productos/', data),
  update: (id: number, data: Partial<Producto>) => client.patch(`/productos/${id}/`, data),
  delete: (id: number) => client.delete(`/productos/${id}/`),
}

export const contribucionesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Contribucion>>('/contribuciones/', { params }),
  create: (data: Partial<Contribucion>) => client.post('/contribuciones/', data),
  update: (id: number, data: Partial<Contribucion>) => client.patch(`/contribuciones/${id}/`, data),
  delete: (id: number) => client.delete(`/contribuciones/${id}/`),
}
