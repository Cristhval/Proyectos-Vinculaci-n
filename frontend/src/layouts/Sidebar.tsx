import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthStore } from '@/store/authStore'
import { MAIN_NAV } from '@/routes/navigation'
import { ROL_LABELS } from '@/lib/constants'
interface Props {
  open: boolean
}

const DASHBOARD_ROUTE: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  COORDINADOR: '/coordinador/dashboard',
  DOCENTE: '/docente/dashboard',
  ESTUDIANTE: '/estudiante/dashboard',
  DIRECTIVO: '/coordinador/dashboard',
}

const PROYECTOS_ROUTE: Record<string, string> = {
  ADMIN: '/admin/proyectos',
  COORDINADOR: '/coordinador/proyectos',
  DOCENTE: '/docente/proyectos',
  ESTUDIANTE: '/estudiante/proyectos',
  DIRECTIVO: '/coordinador/proyectos',
}

export default function Sidebar({ open }: Props) {
  const { logout } = useAuth()
  const { hasRole } = usePermissions()
  const user = useAuthStore((state) => state.user)
  const rol = user?.rol || ''
  const dashboardPath = DASHBOARD_ROUTE[rol] || '/estudiante/dashboard'
  const proyectosPath = PROYECTOS_ROUTE[rol] || '/estudiante/proyectos'

  return (
    <aside
      className={clsx(
        'h-full bg-ink flex flex-col transition-all duration-200 shrink-0',
        open ? 'w-60' : 'w-0 overflow-hidden',
      )}
    >
      <div className="h-16 flex items-center justify-center border-b border-white/10 shrink-0">
        <span className="text-sm font-semibold text-white tracking-tight">Vinculación UNL</span>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto min-h-0">
        {MAIN_NAV.map((item) => {
          if (item.requiredRole && !hasRole(item.requiredRole)) return null

          const to = item.label === 'Dashboard'
            ? dashboardPath
            : item.label === 'Proyectos'
              ? proyectosPath
              : item.to

          return (
            <NavLink
              key={item.to}
              to={to}
              end={item.label === 'Dashboard'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-btn transition-colors duration-150',
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white',
                )
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {user && (
        <div className="px-3 pb-2 shrink-0">
          <div className="px-3 py-2 rounded-btn bg-white/5">
            <p className="text-xs font-medium text-white truncate">
              {user.user_first_name} {user.user_last_name}
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-2xs font-semibold rounded-full">
              {ROL_LABELS[rol] || rol}
            </span>
          </div>
        </div>
      )}

      <div className="p-3 border-t border-white/10 shrink-0">
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2 w-full text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white rounded-btn transition-colors duration-150"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
