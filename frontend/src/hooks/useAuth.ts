import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi, mensajeDeError } from '@/api/auth'
import { usuariosApi } from '@/api/usuarios'
import { useAuthStore } from '@/store/authStore'
import type { LoginRequest, LoginResponse } from '@/types/auth'
import type { RolUsuario } from '@/types/usuarios'

export const DASHBOARD_BY_ROLE: Record<RolUsuario, string> = {
  ADMIN: '/admin/dashboard',
  COORDINADOR: '/coordinador/dashboard',
  DOCENTE: '/docente/dashboard',
  ESTUDIANTE: '/estudiante/dashboard',
  DIRECTIVO: '/coordinador/dashboard',
}

export function useAuth() {
  const navigate = useNavigate()
  const { setTokens, setUser, logout: clearAuth, user, isAuthenticated } = useAuthStore()

  /**
   * Guarda los tokens de auth-service y carga el perfil académico desde la API principal
   * (que en ese mismo momento sincroniza su copia local del usuario).
   */
  const loginConTokens = useCallback(async (payload: LoginResponse) => {
    setTokens(payload.access, payload.refresh)
    try {
      const { data } = await usuariosApi.me()
      setUser(data.data)
      const nombre = data.data.user_first_name || payload.user.first_name || payload.user.username
      toast.success(`Bienvenido/a, ${nombre}`)
      navigate(DASHBOARD_BY_ROLE[data.data.rol] || '/estudiante/dashboard', { replace: true })
    } catch (err) {
      clearAuth()
      throw new Error(mensajeDeError(err, 'No se pudo cargar tu perfil. Verifica que la API principal esté en línea.'))
    }
  }, [setTokens, setUser, clearAuth, navigate])

  /** Devuelve null si entra; si falla, el mensaje para mostrar en el formulario. */
  const login = useCallback(async (credentials: LoginRequest): Promise<string | null> => {
    try {
      const { data } = await authApi.login(credentials)
      await loginConTokens(data.data)
      return null
    } catch (err) {
      if (err instanceof Error && !('response' in err)) return err.message
      return mensajeDeError(err)
    }
  }, [loginConTokens])

  const logout = useCallback(async () => {
    const refresh = useAuthStore.getState().refreshToken
    if (refresh) {
      try {
        await authApi.logout(refresh)
      } catch {
        // si auth-service no responde, igual se cierra la sesión local
      }
    }
    clearAuth()
    navigate('/login')
    toast.success('Sesión cerrada correctamente')
  }, [clearAuth, navigate])

  return { login, loginConTokens, logout, user, isAuthenticated }
}
