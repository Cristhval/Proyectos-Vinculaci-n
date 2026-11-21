import { LayoutDashboard, FolderKanban, Handshake, BarChart3, ShieldCheck, Users, Building2, Bell, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { RolUsuario } from '@/types/usuarios'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  requiredRole?: RolUsuario
  /** Grupo del menú lateral; solo organiza la presentación, no cambia permisos. */
  seccion: 'General' | 'Gestión' | 'Seguimiento'
}

export const MAIN_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, seccion: 'General' },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users, seccion: 'Gestión', requiredRole: 'ADMIN' },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban, seccion: 'Gestión' },
  { to: '/convenios', label: 'Convenios', icon: Handshake, seccion: 'Gestión' },
  { to: '/formatos', label: 'Formatos', icon: FileText, seccion: 'Gestión' },
  { to: '/admin/instituciones', label: 'Instituciones', icon: Building2, seccion: 'Gestión', requiredRole: 'ADMIN' },
  { to: '/alertas', label: 'Alertas', icon: Bell, seccion: 'Seguimiento' },
  { to: '/reportes', label: 'Reportes', icon: BarChart3, seccion: 'Seguimiento' },
  { to: '/admin/auditoria', label: 'Auditoría', icon: ShieldCheck, seccion: 'Seguimiento', requiredRole: 'ADMIN' },
]
