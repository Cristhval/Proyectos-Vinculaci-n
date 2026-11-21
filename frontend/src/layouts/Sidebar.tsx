import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthStore } from '@/store/authStore'
import { MAIN_NAV } from '@/routes/navigation'
import { ROL_LABELS } from '@/lib/constants'
import { DASHBOARD_BY_ROLE } from '@/lib/roles'
import { urlFoto } from '@/api/usuarios'
interface Props {
  open: boolean
  onNavigate?: () => void
}

const PROYECTOS_ROUTE: Record<string, string> = {
  ADMIN: '/admin/proyectos',
  COORDINADOR: '/coordinador/proyectos',
  DOCENTE: '/docente/proyectos',
  ESTUDIANTE: '/estudiante/proyectos',
  DIRECTIVO: '/coordinador/proyectos',
}

const CONVENIOS_ROUTE: Record<string, string> = {
  ADMIN: '/admin/convenios',
  COORDINADOR: '/coordinador/convenios',
  DOCENTE: '/docente/convenios',
  ESTUDIANTE: '/estudiante/convenios',
  DIRECTIVO: '/coordinador/convenios',
}

const ALERTAS_ROUTE: Record<string, string> = {
  ADMIN: '/admin/alertas',
  COORDINADOR: '/coordinador/alertas',
  DOCENTE: '/docente/alertas',
  ESTUDIANTE: '/estudiante/alertas',
  DIRECTIVO: '/coordinador/alertas',
}

const REPORTES_ROUTE: Record<string, string> = {
  ADMIN: '/admin/reportes',
  COORDINADOR: '/coordinador/reportes',
  DOCENTE: '/docente/reportes',
  ESTUDIANTE: '/estudiante/dashboard',
  DIRECTIVO: '/coordinador/reportes',
}

const FORMATOS_ROUTE: Record<string, string> = {
  ADMIN: '/admin/formatos',
  COORDINADOR: '/coordinador/formatos',
  DOCENTE: '/docente/formatos',
  ESTUDIANTE: '/estudiante/formatos',
  DIRECTIVO: '/coordinador/formatos',
}

export default function Sidebar({ open, onNavigate }: Props) {
  const { logout } = useAuth()
  const { hasRole } = usePermissions()
  const user = useAuthStore((state) => state.user)
  const rol = user?.rol || ''
  const dashboardPath = DASHBOARD_BY_ROLE[rol as keyof typeof DASHBOARD_BY_ROLE] || '/estudiante/dashboard'
  const proyectosPath = PROYECTOS_ROUTE[rol] || '/estudiante/proyectos'
  const conveniosPath = CONVENIOS_ROUTE[rol] || '/estudiante/convenios'
  const alertasPath = ALERTAS_ROUTE[rol] || '/estudiante/alertas'
  const reportesPath = REPORTES_ROUTE[rol] || '/admin/reportes'
  const formatosPath = FORMATOS_ROUTE[rol] || '/estudiante/formatos'

  const iniciales = `${user?.user_first_name?.[0] ?? ''}${user?.user_last_name?.[0] ?? ''}`.toUpperCase() || 'U'
  const foto = urlFoto(user?.foto_token)

  return (
    <aside
      className={clsx(
        'h-full bg-ink flex flex-col transition-all duration-200 shrink-0',
        open ? 'w-64' : 'w-0 overflow-hidden',
      )}
    >
      {/* Marca */}
      <div className="h-16 flex items-center gap-3 px-5 shrink-0">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-white text-sm font-bold text-ink">U</span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold tracking-tight text-white">Vinculación UNL</p>
          <p className="truncate text-[11px] text-slate-400">Universidad Nacional de Loja</p>
        </div>
      </div>

      <p className="px-5 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Menú</p>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto min-h-0">
        {MAIN_NAV.map((item) => {
          if (item.requiredRole && !hasRole(item.requiredRole)) return null

          if (item.label === 'Reportes' && rol === 'ESTUDIANTE') return null

          const to = item.label === 'Dashboard'
            ? dashboardPath
            : item.label === 'Proyectos'
              ? proyectosPath
              : item.label === 'Convenios'
                ? conveniosPath
                : item.label === 'Alertas'
                  ? alertasPath
                  : item.label === 'Reportes'
                    ? reportesPath
                    : item.label === 'Formatos'
                      ? formatosPath
                      : item.to

          return (
            <NavLink
              key={item.to}
              to={to}
              end={item.label === 'Dashboard'}
              onClick={onNavigate}
              className={({ isActive }) =>
                clsx(
                  'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-white/[0.08] text-white'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Indicador de la sección activa */}
                  <span className={clsx(
                    'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-500 transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )} />
                  <item.icon size={17} strokeWidth={isActive ? 2.25 : 1.75} className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
                  {item.label}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {user && (
        <div className="mx-3 mb-3 mt-2 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-2.5 shrink-0">
          {foto ? (
            <img src={foto} alt="" className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-1 ring-white/20" />
          ) : (
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold text-blue-300 ring-1 ring-blue-400/30">{iniciales}</span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{user.user_first_name} {user.user_last_name}</p>
            <p className="truncate text-[11px] text-slate-400">{ROL_LABELS[rol] || rol}</p>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="flex-shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut size={15} />
          </button>
        </div>
      )}
    </aside>
  )
}
