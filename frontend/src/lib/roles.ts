import type { RolUsuario } from '@/types/usuarios'

export const ROLES_USUARIO: RolUsuario[] = [
  'ADMIN',
  'COORDINADOR',
  'DOCENTE',
  'ESTUDIANTE',
  'DIRECTIVO',
]

export const DASHBOARD_BY_ROLE: Record<RolUsuario, string> = {
  ADMIN: '/admin/dashboard',
  COORDINADOR: '/coordinador/dashboard',
  DOCENTE: '/docente/dashboard',
  ESTUDIANTE: '/estudiante/dashboard',
  DIRECTIVO: '/coordinador/dashboard',
}
