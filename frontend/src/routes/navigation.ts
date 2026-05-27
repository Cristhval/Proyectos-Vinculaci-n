import { LayoutDashboard, FolderKanban, Handshake, ClipboardList, BarChart3, ShieldCheck, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { RolUsuario } from '@/types/usuarios'
import { ROUTES } from './routes'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  requiredRole?: RolUsuario
}

export const MAIN_NAV: NavItem[] = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.PROYECTOS, label: 'Proyectos', icon: FolderKanban },
  { to: ROUTES.CONVENIOS, label: 'Convenios', icon: Handshake },
  { to: ROUTES.SEGUIMIENTO, label: 'Seguimiento', icon: ClipboardList },
  { to: ROUTES.REPORTES, label: 'Reportes', icon: BarChart3 },
  { to: ROUTES.USUARIOS, label: 'Usuarios', icon: Users, requiredRole: 'COORDINADOR' },
  { to: ROUTES.AUDITORIA, label: 'Auditoria', icon: ShieldCheck, requiredRole: 'ADMIN' },
]
