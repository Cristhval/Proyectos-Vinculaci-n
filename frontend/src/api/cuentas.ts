import authClient from './authClient'
import { API } from '@/config/api'
import type { ApiResult } from '@/types/auth'
import type { RolUsuario } from '@/types/usuarios'

export interface Cuenta {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  rol: RolUsuario
  documento_identidad: string | null
  is_active: boolean
}

/** Gestión de cuentas en auth-service (solo administrador): alta, rol, estado y contraseña. */
export const cuentasApi = {
  create: (data: Record<string, unknown>) =>
    authClient.post<ApiResult<Cuenta>>(API.AUTH.CUENTAS, data),

  update: (id: number | string, data: Record<string, unknown>) =>
    authClient.patch<ApiResult<Cuenta>>(API.AUTH.CUENTA(id), data),

  cambiarContrasena: (id: number | string, data: { password: string; password2: string }) =>
    authClient.post<ApiResult<null>>(API.AUTH.CUENTA_CONTRASENA(id), data),

  accesos: (params?: Record<string, string>) =>
    authClient.get(API.AUTH.ACCESOS, { params }),
}

/** Primer mensaje de validación que devuelve auth-service ({ data: { errores: { campo: [..] } } }). */
export function primerErrorDeCampo(err: unknown): string | null {
  const e = err as { response?: { data?: { data?: { errores?: Record<string, string[]> } } } }
  const errores = e?.response?.data?.data?.errores
  if (!errores) return null
  const primero = Object.values(errores).find((m) => Array.isArray(m) && m.length > 0)
  return primero?.[0] ?? null
}
