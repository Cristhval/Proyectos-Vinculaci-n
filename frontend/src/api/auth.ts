import client from './client'
import type { LoginRequest, RegisterRequest, LoginResponse } from '@/types/auth'

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<{ data: LoginResponse }>('/auth/login/', data),

  register: (data: RegisterRequest) =>
    client.post('/auth/register/', data),

  refresh: (refreshToken: string) =>
    client.post<{ data: { access: string } }>('/auth/refresh/', { refresh: refreshToken }),
}
