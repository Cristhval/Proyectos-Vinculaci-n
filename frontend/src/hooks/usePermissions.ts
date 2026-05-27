import { useAuthStore } from '@/store/authStore'
import type { RolUsuario } from '@/types/usuarios'

const ROL_JERARQUIA: Record<RolUsuario, number> = {
  ESTUDIANTE: 1,
  DIRECTIVO: 2,
  DOCENTE: 3,
  COORDINADOR: 4,
  ADMIN: 5,
}

export function usePermissions() {
  const user = useAuthStore((state) => state.user)
  const rol = user?.rol

  const hasRole = (rolRequerido: RolUsuario): boolean => {
    if (!rol) return false
    return ROL_JERARQUIA[rol] >= ROL_JERARQUIA[rolRequerido]
  }

  const isAdmin = () => hasRole('ADMIN')
  const isCoordinadorOrAbove = () => hasRole('COORDINADOR')
  const isDocenteOrAbove = () => hasRole('DOCENTE')

  return { rol, hasRole, isAdmin, isCoordinadorOrAbove, isDocenteOrAbove }
}
