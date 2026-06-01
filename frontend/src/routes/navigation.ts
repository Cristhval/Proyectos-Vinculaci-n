import { LayoutDashboard, FolderKanban, Handshake, ClipboardList, BarChart3, ShieldCheck, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { RolUsuario } from '@/types/usuarios'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  requiredRole?: RolUsuario
}

export const MAIN_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban },
  { to: '/convenios', label: 'Convenios', icon: Handshake },
  { to: '/seguimiento', label: 'Seguimiento', icon: ClipboardList },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/usuarios', label: 'Usuarios', icon: Users, requiredRole: 'COORDINADOR' },
  { to: '/auditoria', label: 'Auditoría', icon: ShieldCheck, requiredRole: 'ADMIN' },
]
