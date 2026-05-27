import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Handshake, ClipboardList, BarChart3, ShieldCheck, Users, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { clsx } from 'clsx'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban },
  { to: '/convenios', label: 'Convenios', icon: Handshake },
  { to: '/seguimiento', label: 'Seguimiento', icon: ClipboardList },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/usuarios', label: 'Usuarios', icon: Users },
  { to: '/auditoria', label: 'Auditoria', icon: ShieldCheck, adminOnly: true },
]

interface Props {
  open: boolean
}

export default function Sidebar({ open }: Props) {
  const { logout } = useAuth()
  const { isAdmin } = usePermissions()

  return (
    <aside className={clsx(
      'bg-white border-r flex flex-col transition-all duration-200',
      open ? 'w-64' : 'w-0 overflow-hidden'
    )}>
      <div className="h-16 flex items-center justify-center border-b">
        <span className="text-xl font-bold text-primary-700">UNL</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin()) return null
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Cerrar sesion
        </button>
      </div>
    </aside>
  )
}
