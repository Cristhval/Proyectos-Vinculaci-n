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

  create: (data: Record<string, unknown>) =>
    client.post(API.AUTH.REGISTER, data),

  update: (id: number, data: Record<string, unknown>) =>
    client.patch(API.USUARIOS.DETAIL(id), data),

  delete: (id: number) =>
    client.delete(API.USUARIOS.DETAIL(id)),

  cambiarContrasena: (id: number, data: { password: string; password2: string }) =>
    client.post(`/usuarios/${id}/cambiar-contrasena/`, data),
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
