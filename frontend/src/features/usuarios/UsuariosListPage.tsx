import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Search, Plus, Pencil, KeyRound, Users, Eye, EyeOff, AlertTriangle, UserPlus,
  ShieldCheck, Briefcase, GraduationCap, User, Building2, Filter, RotateCcw,
  Calendar, ChevronLeft, ChevronRight, UserX, Shield,
  ChevronDown, X, Circle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { usuariosApi, carrerasApi } from '@/api/usuarios'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ActionIcon from '@/components/ui/ActionIcon'
import { ROL_LABELS, ROL_BADGE_STYLES, ROL_AVATAR_STYLES } from '@/lib/constants'
import type { Usuario, RolUsuario, Carrera } from '@/types/usuarios'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const ROL_ICON: Record<string, LucideIcon> = {
  ADMIN: ShieldCheck,
  COORDINADOR: Briefcase,
  DOCENTE: GraduationCap,
  ESTUDIANTE: User,
  DIRECTIVO: Building2,
}

const ROL_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los roles' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'COORDINADOR', label: 'Coordinador' },
  { value: 'DOCENTE', label: 'Docente' },
  { value: 'ESTUDIANTE', label: 'Estudiante' },
]

const ESTADO_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'INACTIVO', label: 'Inactivos' },
]

interface Stats {
  total: number
  docentes: number
  estudiantes: number
  coordinadores: number
  inactivos: number
}

export default function UsuariosListPage() {
  const currentUser = useAuthStore((s) => s.user)
  const { isAdmin } = usePermissions()

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterRol, setFilterRol] = useState('')
  const [filterActivo, setFilterActivo] = useState('')

  const [stats, setStats] = useState<Stats>({ total: 0, docentes: 0, estudiantes: 0, coordinadores: 0, inactivos: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  const [carreras, setCarreras] = useState<Carrera[]>([])

  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<Usuario | null>(null)
  const [changePassUser, setChangePassUser] = useState<Usuario | null>(null)
  const [deleteUser, setDeleteUser] = useState<Usuario | null>(null)

  const filtersApplied = useMemo(
    () => ({ search, rol: filterRol, activo: filterActivo }),
    [search, filterRol, filterActivo],
  )

  /* ───── Stats (carga global, no afectada por paginación) ───── */
  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const count = async (params: Record<string, string>) => {
        const { data } = await usuariosApi.list({ ...params, page_size: '1' })
        return data.count
      }
      const [total, docentes, estudiantes, coordinadores, inactivos] = await Promise.all([
        count({}),
        count({ rol: 'DOCENTE' }),
        count({ rol: 'ESTUDIANTE' }),
        count({ rol: 'COORDINADOR' }),
        count({ activo: 'false' }),
      ])
      setStats({ total, docentes, estudiantes, coordinadores, inactivos })
    } catch {
      /* silencioso */
    } finally {
      setStatsLoading(false)
    }
  }, [])

  /* ───── Lista paginada ───── */
  const loadUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        page: String(page),
        page_size: String(pageSize),
      }
      if (search) params.search = search
      if (filterRol) params.rol = filterRol
      if (filterActivo) params.activo = filterActivo === 'ACTIVO' ? 'true' : 'false'

      const { data } = await usuariosApi.list(params)
      setUsuarios(data.results)
      setTotal(data.count)
    } catch {
      toast.error('Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, filterRol, filterActivo])

  useEffect(() => { loadUsuarios() }, [loadUsuarios])
  useEffect(() => { loadStats() }, [loadStats, filtersApplied])

  useEffect(() => {
    carrerasApi.list({ page_size: '100' }).then(({ data }) => setCarreras(data.results)).catch(() => {})
  }, [])

  const handleSearch = () => {
    setPage(1)
    setSearch(searchInput.trim())
  }
  const handleClear = () => {
    setSearchInput('')
    setSearch('')
    setFilterRol('')
    setFilterActivo('')
    setPage(1)
  }

  const hasActiveFilters = !!search || !!filterRol || !!filterActivo

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const formatFechaCorta = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
  }

  if (!isAdmin()) {
    return (
      <div className="bg-white border border-line rounded-card p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-bg-soft mx-auto flex items-center justify-center mb-4">
          <Shield size={28} className="text-ink-light" />
        </div>
        <p className="text-base font-semibold text-ink">Acceso restringido</p>
        <p className="text-sm text-ink-muted mt-1 max-w-sm mx-auto">
          Solo los administradores pueden gestionar usuarios del sistema.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ═══════════════ HEADER ═══════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight leading-tight">
            Gestión de Usuarios
          </h1>
          {!statsLoading && (
            <span className="inline-flex items-center px-2 py-0.5 text-2xs font-semibold rounded-full bg-bg-soft text-ink-muted border border-line">
              {stats.total} en total
            </span>
          )}
        </div>
        <p className="text-sm text-ink-muted max-w-xl">
          Administra los usuarios, roles y accesos registrados en el sistema de vinculación.
        </p>
      </div>

      {/* ═══════════════ STATS ═══════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-t border-b border-slate-200 overflow-hidden [&>*:not(:first-child)]:border-l [&>*:not(:first-child)]:border-slate-200">
        <StatCard
          label="Usuarios totales"
          value={stats.total}
          icon={Users}
          accent="indigo"
          loading={statsLoading}
        />
        <StatCard
          label="Docentes"
          value={stats.docentes}
          icon={GraduationCap}
          accent="orange"
          loading={statsLoading}
        />
        <StatCard
          label="Estudiantes"
          value={stats.estudiantes}
          icon={User}
          accent="sky"
          loading={statsLoading}
        />
        <StatCard
          label="Usuarios inactivos"
          value={stats.inactivos}
          icon={UserX}
          accent="rose"
          loading={statsLoading}
        />
      </div>

      {/* ═══════════════ FILTROS ═══════════════ */}
      <div className="bg-white border border-line rounded-card shadow-xs">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-line">
          <Filter size={14} className="text-ink-muted" />
          <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Filtros</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-2xs font-bold rounded-full bg-emerald-100 text-emerald-700">
              {[search, filterRol, filterActivo].filter(Boolean).length} activos
            </span>
          )}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Buscar</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full h-9 pl-9 pr-3 border border-line rounded-btn bg-white text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  placeholder="Buscar por nombre, correo, cédula o código..."
                />
              </div>
            </div>
            <div className="w-48">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Rol</label>
              <SelectInput
                value={filterRol}
                onChange={(v) => { setFilterRol(v); setPage(1) }}
                options={ROL_FILTERS}
                placeholder="Todos los roles"
              />
            </div>
            <div className="w-44">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Estado</label>
              <SelectInput
                value={filterActivo}
                onChange={(v) => { setFilterActivo(v); setPage(1) }}
                options={ESTADO_FILTERS}
                placeholder="Todos los estados"
              />
            </div>
            <button
              onClick={handleSearch}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-semibold rounded-btn bg-ink text-white hover:bg-ink/90 btn-glow transition-all"
            >
              <Search size={14} strokeWidth={2.5} />
              Buscar
            </button>
            <button
              onClick={handleClear}
              disabled={!hasActiveFilters}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium rounded-btn border border-line bg-white text-ink hover:bg-bg-soft disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <RotateCcw size={14} />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════ TABLA ═══════════════ */}
      <div className="bg-white border border-line rounded-card shadow-xs overflow-hidden">
        {/* Toolbar de la tabla */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-3 border-b border-line">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-semibold text-ink">Listado de usuarios</h3>
            {!loading && (
              <span className="text-xs text-ink-muted">
                {from}–{to} de {total}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center gap-2 h-8 px-3 text-[13px] font-semibold rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 btn-glow transition-all"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Nuevo usuario</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-xs text-ink-muted">Cargando usuarios...</p>
            </div>
          </div>
        ) : usuarios.length === 0 ? (
          <EmptyUsers hasFilters={hasActiveFilters} onClear={handleClear} onCreate={() => setShowCreate(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-soft/60 border-b border-line">
                  <Th>Usuario</Th>
                  <Th>Cédula</Th>
                  <Th className="text-center">Rol</Th>
                  <Th className="text-center">Estado</Th>
                  <Th>Registro</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {usuarios.map((u) => {
                  const initials = `${(u.user_first_name?.[0] || '')}${(u.user_last_name?.[0] || '')}`.toUpperCase() || '?'
                  const RolIcon = ROL_ICON[u.rol] || User
                  const isSelf = u.id === currentUser?.id
                  return (
                    <tr
                      key={u.id}
                      className="group hover:bg-emerald-50/40 transition-colors duration-150"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ring-2 ring-white shadow-sm ${ROL_AVATAR_STYLES[u.rol] || 'bg-gradient-to-br from-slate-500 to-slate-700 text-white'}`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-ink truncate text-[13.5px]">
                              {u.user_first_name || u.user_last_name ? `${u.user_first_name || ''} ${u.user_last_name || ''}`.trim() : (u.user_username || u.user_email || 'Sin nombre')}
                            </p>
                            <p className="text-xs text-ink-muted truncate">{u.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[13px] text-ink tabular-nums">
                          {u.documento_identidad || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <RoleBadge rol={u.rol} icon={RolIcon} />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusPill activo={u.activo} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                          <Calendar size={12} className="text-ink-light" />
                          {formatFechaCorta(u.creado_en)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                          <ActionIcon
                            icon="editar"
                            enabled={true}
                            onClick={() => setEditUser(u)}
                            tooltipActivo="Editar usuario"
                            tooltipDeshabilitado=""
                          />
                          <ActionIcon
                            icon="clave"
                            enabled={true}
                            onClick={() => setChangePassUser(u)}
                            tooltipActivo="Cambiar contraseña"
                            tooltipDeshabilitado=""
                          />
                          <ActionIcon
                            icon="eliminar"
                            enabled={!isSelf}
                            onClick={() => {
                              if (isSelf) {
                                toast.error('No puedes eliminar tu propia cuenta')
                                return
                              }
                              setDeleteUser(u)
                            }}
                            tooltipActivo="Eliminar usuario"
                            tooltipDeshabilitado="No puedes eliminar tu propia cuenta"
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ═══════════════ PAGINACIÓN ═══════════════ */}
        {total > 0 && !loading && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-line bg-bg-soft/30">
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <span className="text-xs">Filas por página</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="h-9 px-3 pr-8 border border-line bg-white text-sm text-ink rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 appearance-none bg-no-repeat"
                style={{ backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5'%3e%3cpath d='M6 9l6 6 6-6'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.625rem center" }}
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="hidden sm:inline ml-2 text-xs">
                {from}–{to} de <span className="font-semibold text-ink">{total}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <PageButton onClick={() => setPage(1)} disabled={page === 1} iconOnly>
                «
              </PageButton>
              <PageButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} iconOnly>
                <ChevronLeft size={14} />
              </PageButton>
              <span className="px-3 py-1.5 text-sm font-medium text-ink bg-white border border-line rounded-btn">
                {page} <span className="text-ink-muted">/ {totalPages}</span>
              </span>
              <PageButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} iconOnly>
                <ChevronRight size={14} />
              </PageButton>
              <PageButton onClick={() => setPage(totalPages)} disabled={page === totalPages} iconOnly>
                »
              </PageButton>
            </div>
          </div>
        )}
      </div>

      {/* MODALES */}
      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} carreras={carreras} onCreated={() => { loadUsuarios(); loadStats() }} />
      <EditUserModal user={editUser} onClose={() => setEditUser(null)} carreras={carreras} onSaved={() => { loadUsuarios(); loadStats() }} />
      <ChangePasswordModal user={changePassUser} onClose={() => setChangePassUser(null)} />
      <DeleteUserModal user={deleteUser} onClose={() => setDeleteUser(null)} onDeleted={() => { loadUsuarios(); loadStats() }} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTES
   ═══════════════════════════════════════════════════════════════ */

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-2.5 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-wider ${className}`}>
      {children}
    </th>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  loading,
}: {
  label: string
  value: number
  icon: LucideIcon
  accent: 'indigo' | 'orange' | 'sky' | 'rose'
  loading?: boolean
}) {
  const ACCENTS = {
    indigo: { bg: 'bg-indigo-50',  text: 'text-indigo-600',  hex: '#4F46E5' },
    orange: { bg: 'bg-orange-50',  text: 'text-orange-600',  hex: '#EA580C' },
    sky:    { bg: 'bg-sky-50',     text: 'text-sky-600',     hex: '#0284C7' },
    rose:   { bg: 'bg-rose-50',    text: 'text-rose-600',    hex: '#E11D48' },
  } as const
  const a = ACCENTS[accent]
  return (
    <div className="group relative overflow-hidden py-5 px-6 transition-colors duration-300 hover:bg-slate-50">
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${a.bg} ${a.text} transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={18} strokeWidth={2.25} />
        </div>
      </div>
      {loading ? (
        <div className="h-10 w-16 bg-bg-soft rounded animate-pulse" />
      ) : (
        <div className="text-4xl font-bold tracking-tight text-slate-900 transition-transform duration-300 group-hover:-translate-y-0.5">
          {value.toLocaleString('es-EC')}
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        <div 
          className="h-px w-4 transition-all duration-300 group-hover:w-8"
          style={{ backgroundColor: a.hex, opacity: 0.6 }}
        />
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </span>
      </div>
      <div 
        className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 transition-transform duration-300 group-hover:scale-x-100 origin-left"
        style={{ backgroundColor: a.hex }}
      />
    </div>
  )
}

function RoleBadge({ rol, icon: Icon }: { rol: string; icon: LucideIcon }) {
  const FALLBACK = ROL_BADGE_STYLES.ESTUDIANTE!
  const s = ROL_BADGE_STYLES[rol] ?? FALLBACK
  return (
    <span className={`inline-flex items-center justify-center gap-1 h-[22px] px-2.5 text-[11px] font-medium rounded-full ring-1 whitespace-nowrap ${s.bg} ${s.text} ${s.ring}`}>
      <Icon size={11} strokeWidth={2.5} className="shrink-0" />
      {ROL_LABELS[rol] || rol}
    </span>
  )
}

function StatusPill({ activo }: { activo: boolean }) {
  if (activo) {
    return (
      <span className="inline-flex items-center justify-center gap-1 h-[22px] px-2.5 text-[11px] font-medium rounded-full ring-1 whitespace-nowrap bg-emerald-50 text-emerald-700 ring-emerald-200/70">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
        Activo
      </span>
    )
  }
  return (
    <span className="inline-flex items-center justify-center gap-1 h-[22px] px-2.5 text-[11px] font-medium rounded-full ring-1 whitespace-nowrap bg-bg-soft text-ink-muted ring-line">
      <Circle size={10} strokeWidth={2.5} className="shrink-0" />
      Inactivo
    </span>
  )
}

function PageButton({
  children,
  onClick,
  disabled,
  iconOnly,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  iconOnly?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center ${iconOnly ? 'w-9 h-9' : 'px-3 h-9'} text-sm font-medium rounded-btn border border-line bg-white text-ink hover:bg-bg-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
    >
      {children}
    </button>
  )
}

function SelectInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 appearance-none pl-3 pr-9 border border-line rounded-btn bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all cursor-pointer"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
    </div>
  )
}

function EmptyUsers({ hasFilters, onClear, onCreate }: { hasFilters: boolean; onClear: () => void; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-bg-soft flex items-center justify-center mb-4">
        <Users size={24} className="text-ink-light" />
      </div>
      <h3 className="text-sm font-semibold text-ink">
        {hasFilters ? 'No hay resultados' : 'Aún no hay usuarios'}
      </h3>
      <p className="mt-1 text-sm text-ink-muted max-w-sm">
        {hasFilters
          ? 'Intenta ajustar los filtros para encontrar lo que buscas.'
          : 'Comienza creando el primer usuario del sistema.'}
      </p>
      <div className="mt-5 flex items-center gap-2">
        {hasFilters ? (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-btn border border-line bg-white text-ink hover:bg-bg-soft transition-colors"
          >
            <X size={14} />
            Limpiar filtros
          </button>
        ) : (
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            Nuevo usuario
          </button>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MODAL: CREAR USUARIO
   ───────────────────────────────────────────── */
function CreateUserModal({ open, onClose, carreras, onCreated }: { open: boolean; onClose: () => void; carreras: Carrera[]; onCreated: () => void }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    documento_identidad: '', carrera_id: '', rol: '' as RolUsuario | '',
    telefono: '', password: '', password2: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => { const n = { ...e }; delete n[field]; return n })
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.first_name.trim()) errs.first_name = 'Los nombres son obligatorios'
    if (!form.last_name.trim()) errs.last_name = 'Los apellidos son obligatorios'
    if (!form.email.trim()) errs.email = 'El correo es obligatorio'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Formato de correo inválido'
    if (!form.rol) errs.rol = 'Selecciona un rol'
    if (!form.password) errs.password = 'La contraseña es obligatoria'
    else if (form.password.length < 8) errs.password = 'Mínimo 8 caracteres'
    if (form.password !== form.password2) errs.password2 = 'Las contraseñas no coinciden'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleRequestSubmit = () => {
    if (!validate()) return
    setShowConfirm(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await usuariosApi.create({
        username: form.email,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
        documento_identidad: form.documento_identidad.trim() || undefined,
        rol: form.rol || undefined,
      })
      toast.success('Usuario creado correctamente')
      setForm({ first_name: '', last_name: '', email: '', documento_identidad: '', carrera_id: '', rol: '', telefono: '', password: '', password2: '' })
      onClose()
      onCreated()
    } catch {
      toast.error('No se pudo crear el usuario')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo usuario"
      subtitle="Crea un nuevo usuario en el sistema."
      icon={<UserPlus size={20} className="text-emerald-600" />}
      size="xl"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors">Cancelar</button>
          <button onClick={handleRequestSubmit} disabled={saving} className="px-4 py-2 text-sm font-semibold rounded-btn text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Creando...' : 'Crear usuario'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-4">
          <SectionLabel>Información personal</SectionLabel>
          <Field label="Nombres *" error={errors.first_name}>
            <input value={form.first_name} onChange={(e) => update('first_name', e.target.value)} className={inputCls(errors.first_name)} placeholder="Nombres" />
          </Field>
          <Field label="Apellidos *" error={errors.last_name}>
            <input value={form.last_name} onChange={(e) => update('last_name', e.target.value)} className={inputCls(errors.last_name)} placeholder="Apellidos" />
          </Field>
          <Field label="Correo electrónico *" error={errors.email}>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputCls(errors.email)} placeholder="correo@ejemplo.com" />
          </Field>
          <Field label="Cédula / Pasaporte">
            <input value={form.documento_identidad} onChange={(e) => update('documento_identidad', e.target.value)} className={inputCls()} placeholder="Documento de identidad" />
          </Field>
        </div>
        <div className="space-y-4">
          <SectionLabel>Rol y acceso</SectionLabel>
          <Field label="Rol *" error={errors.rol}>
            <select value={form.rol} onChange={(e) => update('rol', e.target.value)} className={inputCls(errors.rol)}>
              <option value="">Seleccionar rol...</option>
              <option value="ADMIN">Administrador</option>
              <option value="COORDINADOR">Coordinador</option>
              <option value="DOCENTE">Docente</option>
              <option value="ESTUDIANTE">Estudiante</option>
            </select>
          </Field>
          <Field label="Carrera">
            <select value={form.carrera_id} onChange={(e) => update('carrera_id', e.target.value)} className={inputCls()}>
              <option value="">Seleccionar carrera...</option>
              {carreras.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Field>
          <Field label="Teléfono">
            <input value={form.telefono} onChange={(e) => update('telefono', e.target.value)} className={inputCls()} placeholder="Teléfono" />
          </Field>
          <Field label="Contraseña *" error={errors.password}>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} className={inputCls(errors.password)} placeholder="Mínimo 8 caracteres" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink-muted transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <Field label="Confirmar contraseña *" error={errors.password2}>
            <div className="relative">
              <input type={showPass2 ? 'text' : 'password'} value={form.password2} onChange={(e) => update('password2', e.target.value)} className={inputCls(errors.password2)} placeholder="Repite la contraseña" />
              <button type="button" onClick={() => setShowPass2(!showPass2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink-muted transition-colors">
                {showPass2 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
        </div>
      </div>
      <ConfirmModal
        isOpen={showConfirm}
        titulo="¿Crear usuario?"
        mensaje="Se creará un nuevo usuario en el sistema. ¿Estás seguro?"
        onConfirm={async () => { setShowConfirm(false); await handleSubmit() }}
        onCancel={() => setShowConfirm(false)}
      />
    </Modal>
  )
}

/* ─────────────────────────────────────────────
   MODAL: EDITAR USUARIO
   ───────────────────────────────────────────── */
function EditUserModal({ user, onClose, carreras, onSaved }: { user: Usuario | null; onClose: () => void; carreras: Carrera[]; onSaved: () => void }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', telefono: '', documento_identidad: '', carrera_id: '', rol: '' as RolUsuario | '', activo: true })
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.user_first_name || '',
        last_name: user.user_last_name || '',
        email: user.user_email || '',
        telefono: user.telefono || '',
        documento_identidad: user.documento_identidad || '',
        carrera_id: user.carrera ? String(user.carrera.id) : '',
        rol: user.rol,
        activo: user.activo,
      })
    }
  }, [user])

  const update = (field: string, value: string | boolean) => setForm((f) => ({ ...f, [field]: value }))

  const handleRequestSubmit = () => {
    if (!user) return
    setShowConfirm(true)
  }

  const handleSubmit = async () => {
    if (!user) return
    setSaving(true)
    try {
      await usuariosApi.update(user.id, {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        telefono: form.telefono || undefined,
        documento_identidad: form.documento_identidad || undefined,
        carrera_id: form.carrera_id ? Number(form.carrera_id) : undefined,
        rol: form.rol as RolUsuario,
        activo: form.activo,
      })
      toast.success('Usuario actualizado correctamente')
      onClose()
      onSaved()
    } catch {
      toast.error('No se pudo actualizar el usuario')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title="Editar usuario"
      subtitle={user ? `${user.user_first_name} ${user.user_last_name}` : ''}
      icon={<Pencil size={20} className="text-emerald-600" />}
      size="xl"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors">Cancelar</button>
          <button onClick={handleRequestSubmit} disabled={saving} className="px-4 py-2 text-sm font-semibold rounded-btn text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </>
      }
    >
      {user && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-4">
              <SectionLabel>Información personal</SectionLabel>
              <Field label="Nombres *">
                <input value={form.first_name} onChange={(e) => update('first_name', e.target.value)} className={inputCls()} />
              </Field>
              <Field label="Apellidos *">
                <input value={form.last_name} onChange={(e) => update('last_name', e.target.value)} className={inputCls()} />
              </Field>
              <Field label="Correo electrónico *">
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputCls()} />
              </Field>
              <Field label="Teléfono">
                <input value={form.telefono} onChange={(e) => update('telefono', e.target.value)} className={inputCls()} />
              </Field>
              <Field label="Cédula / Pasaporte">
                <input value={form.documento_identidad} onChange={(e) => update('documento_identidad', e.target.value)} className={inputCls()} />
              </Field>
              <Field label="Carrera">
                <select value={form.carrera_id} onChange={(e) => update('carrera_id', e.target.value)} className={inputCls()}>
                  <option value="">Seleccionar carrera...</option>
                  {carreras.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </Field>
            </div>
            <div className="space-y-4">
              <SectionLabel>Rol y acceso</SectionLabel>
              <Field label="Rol *">
                <select value={form.rol} onChange={(e) => update('rol', e.target.value)} className={inputCls()}>
                  <option value="ADMIN">Administrador</option>
                  <option value="COORDINADOR">Coordinador</option>
                  <option value="DOCENTE">Docente</option>
                  <option value="ESTUDIANTE">Estudiante</option>
                </select>
              </Field>
              {form.rol && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-ink-muted">Vista previa:</span>
                  <RoleBadge rol={form.rol} icon={ROL_ICON[form.rol] || User} />
                </div>
              )}
              <div className="pt-2">
                <label className="block text-sm font-medium text-ink-muted mb-2">Estado de la cuenta</label>
                <button
                  type="button"
                  onClick={() => update('activo', !form.activo)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-none transition-colors ${form.activo ? 'bg-emerald-600' : 'bg-line-strong'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${form.activo ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="ml-3 text-sm text-ink">{form.activo ? 'Activo' : 'Inactivo'}</span>
                {!form.activo && (
                  <p className="text-xs text-amber-600 mt-2">El usuario no podrá iniciar sesión mientras esté inactivo.</p>
                )}
              </div>
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200/70 rounded-lg">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">El usuario deberá cerrar sesión y volver a ingresar para que los cambios de rol tomen efecto.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={showConfirm}
        titulo="¿Guardar cambios?"
        mensaje="Se actualizarán los datos del usuario. ¿Estás seguro?"
        onConfirm={async () => { setShowConfirm(false); await handleSubmit() }}
        onCancel={() => setShowConfirm(false)}
      />
    </Modal>
  )
}

/* ─────────────────────────────────────────────
   MODAL: CAMBIAR CONTRASEÑA
   ───────────────────────────────────────────── */
function ChangePasswordModal({ user, onClose }: { user: Usuario | null; onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const strength = getPasswordStrength(password)
  const hasError = password.length > 0 && password.length < 8
  const hasMismatch = password2.length > 0 && password !== password2

  const handleRequestSubmit = () => {
    if (!user || password.length < 8 || password !== password2) return
    setShowConfirm(true)
  }

  const handleSubmit = async () => {
    if (!user || password.length < 8 || password !== password2) return
    setSaving(true)
    try {
      await usuariosApi.cambiarContrasena(user.id, { password, password2 })
      toast.success('Contraseña actualizada correctamente')
      setPassword('')
      setPassword2('')
      onClose()
    } catch {
      toast.error('No se pudo cambiar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={user !== null}
      onClose={() => { setPassword(''); setPassword2(''); onClose() }}
      title="Cambiar contraseña"
      subtitle={user ? `${user.user_first_name} ${user.user_last_name}` : ''}
      icon={<KeyRound size={20} className="text-amber-600" />}
      size="md"
      footer={
        <>
          <button onClick={() => { setPassword(''); setPassword2(''); onClose() }} className="px-4 py-2 text-sm font-medium rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors">Cancelar</button>
          <button onClick={handleRequestSubmit} disabled={saving || password.length < 8 || password !== password2} className="px-4 py-2 text-sm font-semibold rounded-btn text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </>
      }
    >
      {user && (
        <div className="space-y-4">
          <Field label="Nueva contraseña *" error={hasError ? 'La contraseña debe tener mínimo 8 caracteres' : ''}>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls(hasError)} placeholder="Mínimo 8 caracteres" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink-muted transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-2">
                <div className="h-1.5 bg-bg-soft rounded-full overflow-hidden">
                  <div className={`h-full transition-all ${strength.color}`} style={{ width: strength.percent }} />
                </div>
                <p className="text-xs text-ink-muted mt-1.5">{strength.label}</p>
              </div>
            )}
          </Field>
          <Field label="Confirmar nueva contraseña *" error={hasMismatch ? 'Las contraseñas no coinciden' : ''}>
            <div className="relative">
              <input type={showPass2 ? 'text' : 'password'} value={password2} onChange={(e) => setPassword2(e.target.value)} className={inputCls(hasMismatch)} placeholder="Repite la contraseña" />
              <button type="button" onClick={() => setShowPass2(!showPass2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink-muted transition-colors">
                {showPass2 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
        </div>
      )}
      <ConfirmModal
        isOpen={showConfirm}
        titulo="¿Cambiar contraseña?"
        mensaje="Se actualizará la contraseña del usuario. ¿Estás seguro?"
        onConfirm={async () => { setShowConfirm(false); await handleSubmit() }}
        onCancel={() => setShowConfirm(false)}
      />
    </Modal>
  )
}

/* ─────────────────────────────────────────────
   MODAL: ELIMINAR USUARIO
   ───────────────────────────────────────────── */
function DeleteUserModal({ user, onClose, onDeleted }: { user: Usuario | null; onClose: () => void; onDeleted: () => void }) {
  const handleDelete = async () => {
    if (!user) return
    try {
      await usuariosApi.delete(user.id)
      toast.success('Usuario eliminado')
      onClose()
      onDeleted()
    } catch {
      toast.error('No se pudo eliminar el usuario')
    }
  }

  return (
    <ConfirmModal
      isOpen={user !== null}
      titulo="¿Eliminar usuario?"
      mensaje={`Se eliminará el usuario ${user?.user_first_name || ''} ${user?.user_last_name || ''} (${user?.user_email || ''}). Esta acción no se puede deshacer.`}
      onConfirm={handleDelete}
      onCancel={onClose}
    />
  )
}

/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider -mb-1">
      {children}
    </h4>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-muted mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-rose-500 mt-1 animate-fade-in">{error}</p>}
    </div>
  )
}

function inputCls(error?: string | boolean) {
  const hasError = typeof error === 'string' ? error : error === true
  return `w-full px-3 py-2 border text-sm rounded-btn transition-all focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-400'
      : 'border-line focus:ring-emerald-500/20 focus:border-emerald-400'
  }`
}

function getPasswordStrength(pw: string): { label: string; percent: string; color: string } {
  if (pw.length === 0) return { label: '', percent: '0%', color: '' }
  if (pw.length < 5) return { label: 'Débil', percent: '25%', color: 'bg-rose-500' }
  if (pw.length < 8) return { label: 'Regular', percent: '50%', color: 'bg-amber-500' }
  const hasUpper = /[A-Z]/.test(pw)
  const hasNumber = /\d/.test(pw)
  const hasSymbol = /[^A-Za-z0-9]/.test(pw)
  if (hasUpper && hasNumber && hasSymbol) return { label: 'Fuerte', percent: '100%', color: 'bg-emerald-600' }
  if (hasUpper || hasNumber) return { label: 'Buena', percent: '75%', color: 'bg-emerald-500' }
  return { label: 'Regular', percent: '50%', color: 'bg-amber-500' }
}
