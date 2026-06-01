import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import { API, API_BASE } from '@/config/api'

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}${API.AUTH.REFRESH}`, {
            refresh: refreshToken,
          })
          useAuthStore.getState().setAccessToken(data.data.access)
          originalRequest.headers.Authorization = `Bearer ${data.data.access}`
          return client(originalRequest)
        } catch {
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

export default client
