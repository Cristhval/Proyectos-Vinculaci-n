import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import { API_BASE } from '@/config/api'
import { authApi } from './auth'

const client = axios.create({
  baseURL: API_BASE,
})

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Dejamos que axios/browser manejen el Content-Type automáticamente
  // (application/json para objetos, multipart/form-data para FormData)
  return config
})

/**
 * auth-service rota el refresh token en cada renovación: si varias peticiones reciben 401 a la vez,
 * todas deben esperar la MISMA renovación (con el token viejo solo se puede renovar una vez).
 */
let renovacionEnCurso: Promise<string> | null = null

function renovarAcceso(): Promise<string> {
  if (!renovacionEnCurso) {
    const refreshToken = useAuthStore.getState().refreshToken
    renovacionEnCurso = (refreshToken ? authApi.refresh(refreshToken) : Promise.reject(new Error('sin refresh')))
      .then(({ data }) => {
        useAuthStore.getState().setTokens(data.data.access, data.data.refresh)
        return data.data.access
      })
      .finally(() => {
        renovacionEnCurso = null
      })
  }
  return renovacionEnCurso
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const access = await renovarAcceso()
        originalRequest.headers.Authorization = `Bearer ${access}`
        return client(originalRequest)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default client
