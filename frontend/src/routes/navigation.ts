import { LayoutDashboard, FolderKanban, Handshake, BarChart3, ShieldCheck, Users, Building2, Bell, FileText } from 'lucide-react'
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
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users, requiredRole: 'ADMIN' },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban },
  { to: '/convenios', label: 'Convenios', icon: Handshake },
  { to: '/formatos', label: 'Formatos', icon: FileText },
  { to: '/admin/instituciones', label: 'Instituciones', icon: Building2, requiredRole: 'ADMIN' },
  { to: '/alertas', label: 'Alertas', icon: Bell },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/admin/auditoria', label: 'Auditoría', icon: ShieldCheck, requiredRole: 'ADMIN' },
]
