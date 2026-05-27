import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario } from '@/types/usuarios'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: Usuario | null
  isAuthenticated: boolean
  setTokens: (access: string, refresh: string) => void
  setAccessToken: (access: string) => void
  setUser: (user: Usuario) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true }),
      setAccessToken: (access) =>
        set({ accessToken: access }),
      setUser: (user) =>
        set({ user }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' },
  ),
)
