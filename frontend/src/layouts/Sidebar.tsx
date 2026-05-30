import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { MAIN_NAV } from '@/routes/navigation'

interface Props {
  open: boolean
}

export default function Sidebar({ open }: Props) {
  const { logout } = useAuth()
  const { hasRole } = usePermissions()

  return (
    <aside className={clsx(
      'bg-white border-r border-line flex flex-col transition-all duration-200',
      open ? 'w-60' : 'w-0 overflow-hidden'
    )}>
      <div className="h-14 flex items-center justify-center border-b border-line">
        <span className="text-sm font-semibold text-ink">UNL</span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {MAIN_NAV.map((item) => {
          if (item.requiredRole && !hasRole(item.requiredRole)) return null
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => clsx(
                'flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-bg-soft text-ink' : 'text-ink-muted hover:bg-bg-soft hover:text-ink'
              )}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
      <div className="p-3 border-t border-line">
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2 w-full text-sm font-medium text-ink-muted hover:bg-bg-soft hover:text-status-error transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
