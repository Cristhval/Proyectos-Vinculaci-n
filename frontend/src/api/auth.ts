import client from './client'
import { API } from '@/config/api'
import type { LoginRequest, RegisterRequest, LoginResponse } from '@/types/auth'

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<{ data: LoginResponse }>(API.AUTH.LOGIN, data),

  register: (data: RegisterRequest) =>
    client.post(API.AUTH.REGISTER, data),

  refresh: (refreshToken: string) =>
    client.post<{ data: { access: string } }>(API.AUTH.REFRESH, { refresh: refreshToken }),
}
