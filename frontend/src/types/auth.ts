import type { Usuario } from './usuarios'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  first_name?: string
  last_name?: string
  email?: string
  documento_identidad?: string
  rol?: string
}

export interface LoginResponse {
  refresh: string
  access: string
  user: Usuario
}
