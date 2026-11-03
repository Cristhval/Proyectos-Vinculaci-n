import axios from 'axios'
import authClient from './authClient'
import { API, AUTH_BASE } from '@/config/api'
import type { ApiResult, LoginRequest, LoginResponse, RegistroRequest } from '@/types/auth'

export const authApi = {
  login: (data: LoginRequest) =>
    authClient.post<ApiResult<LoginResponse>>(API.AUTH.LOGIN, data),

  registro: (data: RegistroRequest) =>
    authClient.post<ApiResult<unknown>>(API.AUTH.REGISTRO, data),

  /** Sin interceptores: se usa desde el interceptor de 401 del cliente principal. */
  refresh: (refresh: string) =>
    axios.post<ApiResult<{ access: string; refresh: string }>>(`${AUTH_BASE}${API.AUTH.REFRESH}`, { refresh }),

  logout: (refresh: string) =>
    authClient.post(API.AUTH.LOGOUT, { refresh }),

  proveedores: () =>
    authClient.get<ApiResult<string[]>>(API.AUTH.PROVEEDORES),

  canjear: (code: string) =>
    authClient.post<ApiResult<LoginResponse>>(API.AUTH.CANJEAR, { code }),

  solicitarRecuperacion: (email: string, captcha_token: string) =>
    authClient.post<ApiResult<null>>(API.AUTH.SOLICITAR, { email, captcha_token }),

  restablecer: (data: { uid: string; token: string; password: string; password2: string }) =>
    authClient.post<ApiResult<null>>(API.AUTH.RESTABLECER, data),
}

/** Extrae el mensaje legible de un error de auth-service o de la API. */
export function mensajeDeError(err: unknown, porDefecto = 'Error de conexión con el servidor'): string {
  const e = err as { response?: { status?: number; data?: { message?: string; detail?: string } } }
  const status = e?.response?.status
  if (status === 429) return 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.'
  return e?.response?.data?.message || e?.response?.data?.detail || porDefecto
}
