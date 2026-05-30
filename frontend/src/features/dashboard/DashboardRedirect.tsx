import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { RolUsuario } from '@/types/usuarios'

const DASHBOARD_BY_ROLE: Record<RolUsuario, string> = {
  ADMIN: '/admin/dashboard',
  COORDINADOR: '/coordinador/dashboard',
  DOCENTE: '/docente/dashboard',
  ESTUDIANTE: '/estudiante/dashboard',
  DIRECTIVO: '/coordinador/dashboard',
}

export default function DashboardRedirect() {
  const user = useAuthStore((state) => state.user)
  const rol = user?.rol as RolUsuario | undefined
  const destino = rol ? DASHBOARD_BY_ROLE[rol] || '/estudiante/dashboard' : '/login'
  return <Navigate to={destino} replace />
}
