import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { RolUsuario } from '@/types/usuarios'

interface Props {
  allowedRoles?: RolUsuario[]
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const { rol: urlRol } = useParams<{ rol: string }>()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const userRol = user?.rol as RolUsuario | undefined

  if (allowedRoles && allowedRoles.length > 0) {
    if (!userRol || !allowedRoles.includes(userRol)) {
      return <Navigate to="/no-autorizado" replace />
    }
  }

  if (urlRol && userRol && urlRol.toUpperCase() !== userRol) {
    return <Navigate to="/no-autorizado" replace />
  }

  return <Outlet />
}
