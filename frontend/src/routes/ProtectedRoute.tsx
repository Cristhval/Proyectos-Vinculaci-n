import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { RolUsuario } from '@/types/usuarios'

interface Props {
  allowedRoles?: RolUsuario[]
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRol = user?.rol as RolUsuario | undefined
    if (!userRol || !allowedRoles.includes(userRol)) {
      return <Navigate to="/no-autorizado" replace />
    }
  }

  return <Outlet />
}
