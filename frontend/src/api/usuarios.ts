import client from './client'
import type { Usuario, Carrera } from '@/types/usuarios'
import type { PaginatedResponse } from '@/types/common'

export const usuariosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Usuario>>('/usuarios/', { params }),

  get: (id: number) =>
    client.get<Usuario>(`/usuarios/${id}/`),

  me: () =>
    client.get<{ data: Usuario }>('/usuarios/me/'),

  create: (data: Partial<Usuario>) =>
    client.post('/usuarios/', data),

  update: (id: number, data: Partial<Usuario>) =>
    client.patch(`/usuarios/${id}/`, data),

  delete: (id: number) =>
    client.delete(`/usuarios/${id}/`),
}

export const carrerasApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Carrera>>('/carreras/', { params }),

  get: (id: number) =>
    client.get<Carrera>(`/carreras/${id}/`),

  create: (data: Partial<Carrera>) =>
    client.post('/carreras/', data),

  update: (id: number, data: Partial<Carrera>) =>
    client.patch(`/carreras/${id}/`, data),

  delete: (id: number) =>
    client.delete(`/carreras/${id}/`),
}
