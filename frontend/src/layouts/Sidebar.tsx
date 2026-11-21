import { NavLink } from 'react-router-dom'
import { MarcaUNL } from '@/components/marca/Marca'
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

const SECCIONES = ['General', 'Gestión', 'Seguimiento'] as const

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
        'h-full bg-ink flex flex-col border-r border-white/5 transition-all duration-200 shrink-0',
        open ? 'w-60' : 'w-0 overflow-hidden',
      )}
    >
      {/* Marca */}
      <div className="h-16 flex items-center gap-3 border-b border-white/[0.06] px-5 shrink-0">
        <MarcaUNL oscuro />
      </div>

      <nav className="flex-1 overflow-y-auto min-h-0 px-3 pb-3" aria-label="Menú principal">
        {SECCIONES.map((seccion) => {
          const items = MAIN_NAV.filter((item) =>
            item.seccion === seccion
            && !(item.requiredRole && !hasRole(item.requiredRole))
            && !(item.label === 'Reportes' && rol === 'ESTUDIANTE'))
          if (items.length === 0) return null
          return (
            <div key={seccion} className="mt-5 first:mt-3">
              <p className="px-3 pb-1.5 text-[11px] font-medium text-slate-500">{seccion}</p>
              <div className="space-y-px">
                {items.map((item) => {
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
                          'group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] transition-colors duration-150',
                          isActive
                            ? 'bg-ink-2 font-medium text-white'
                            : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Señal del elemento activo */}
                          <span className={clsx('absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-naranja', isActive ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
                          <item.icon size={17} strokeWidth={1.75} className={isActive ? 'text-naranja' : 'text-slate-500 group-hover:text-slate-300'} />
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {user && (
        <div className="flex items-center gap-3 border-t border-white/[0.06] px-4 py-3.5 shrink-0">
          {foto ? (
            <img src={foto} alt="" className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-1 ring-white/20" />
          ) : (
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-ink-2 text-xs font-semibold text-slate-200">{iniciales}</span>
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
