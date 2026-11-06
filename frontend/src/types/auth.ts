import type { RolUsuario } from './usuarios'

export interface LoginRequest {
  usuario: string
  password: string
  captcha_token: string
}

export interface RegistroRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  documento_identidad: string
  captcha_token: string
}

/** Cuenta tal como la devuelve auth-service. */
export interface CuentaAuth {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  rol: RolUsuario
  documento_identidad: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: CuentaAuth
}

export interface ApiResult<T> {
  success: boolean
  message: string
  data: T
}
