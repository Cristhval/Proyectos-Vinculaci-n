import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import type { LoginRequest } from '@/types/auth'
import type { RolUsuario } from '@/types/usuarios'

const DASHBOARD_BY_ROLE: Record<RolUsuario, string> = {
  ADMIN: '/admin/dashboard',
  COORDINADOR: '/coordinador/dashboard',
  DOCENTE: '/docente/dashboard',
  ESTUDIANTE: '/estudiante/dashboard',
  DIRECTIVO: '/coordinador/dashboard',
}

export function useAuth() {
  const navigate = useNavigate()
  const { setTokens, setUser, logout: clearAuth, user, isAuthenticated } = useAuthStore()

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      const { data } = await authApi.login(credentials)
      const { access, refresh, user: userData } = data.data

      setTokens(access, refresh)
      setUser(userData)

      const nombre = userData.user_first_name || userData.user_username || 'Usuario'
      const rol = userData.rol as RolUsuario
      const destino = DASHBOARD_BY_ROLE[rol] || '/estudiante/dashboard'

      toast.success(`Bienvenido/a, ${nombre}`)
      setTimeout(() => navigate(destino), 800)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 400 || status === 401) {
        toast.error('Credenciales incorrectas. Verifica tu usuario y contraseña')
      } else {
        const msg = err?.response?.data?.message
          || err?.response?.data?.detail
          || err?.message
          || 'Error de conexión con el servidor'
        toast.error(`Error al iniciar sesión: ${msg}`)
      }
    }
  }, [setTokens, setUser, navigate])

  const logout = useCallback(() => {
    clearAuth()
    navigate('/login')
    toast.success('Sesión cerrada correctamente')
  }, [clearAuth, navigate])

  return { login, logout, user, isAuthenticated }
}
