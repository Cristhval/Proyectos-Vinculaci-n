import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import { AUTH_BASE } from '@/config/api'

/** Cliente HTTP hacia auth-service (login, sesión, cuentas). */
const authClient = axios.create({ baseURL: AUTH_BASE, timeout: 70000 })

authClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default authClient
