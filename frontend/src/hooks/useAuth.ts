import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import type { LoginRequest } from '@/types/auth'

export function useAuth() {
  const navigate = useNavigate()
  const { setTokens, setUser, logout: clearAuth, user, isAuthenticated } = useAuthStore()

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      const { data } = await authApi.login(credentials)
      setTokens(data.data.access, data.data.refresh)
      setUser(data.data.user)
      toast.success('Sesion iniciada correctamente')
      navigate('/dashboard')
    } catch {
      toast.error('Credenciales invalidas')
    }
  }, [setTokens, setUser, navigate])

  const logout = useCallback(() => {
    clearAuth()
    navigate('/login')
    toast.success('Sesion cerrada')
  }, [clearAuth, navigate])

  return { login, logout, user, isAuthenticated }
}
