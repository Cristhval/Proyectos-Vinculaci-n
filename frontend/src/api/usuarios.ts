import client from './client'
import { API } from '@/config/api'
import type { Usuario, Carrera } from '@/types/usuarios'
import type { PaginatedResponse } from '@/types/common'

export const usuariosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Usuario>>(API.USUARIOS.LIST, { params }),

  get: (id: number) =>
    client.get<Usuario>(API.USUARIOS.DETAIL(id)),

  me: () =>
    client.get<{ data: Usuario }>(API.USUARIOS.ME),

  update: (id: number, data: Record<string, unknown>) =>
    client.patch(API.USUARIOS.DETAIL(id), data),

  delete: (id: number) =>
    client.delete(API.USUARIOS.DETAIL(id)),

  /** Crea o actualiza el perfil local a partir de una cuenta de auth-service (solo admin). */
  sincronizar: (data: Record<string, unknown>) =>
    client.post<{ data: Usuario }>(API.USUARIOS.SINCRONIZAR, data),
}

export const carrerasApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Carrera>>(API.USUARIOS.CARRERAS, { params }),

  get: (id: number) =>
    client.get<Carrera>(`/carreras/${id}/`),

  create: (data: Partial<Carrera>) =>
    client.post(API.USUARIOS.CARRERAS, data),

  update: (id: number, data: Partial<Carrera>) =>
    client.patch(`/carreras/${id}/`, data),

  delete: (id: number) =>
    client.delete(`/carreras/${id}/`),
}
