import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, X, Bell, Filter, RotateCcw, ChevronLeft, ChevronRight,
  ChevronDown, AlertTriangle, AlertOctagon, Check, CheckCheck,
  Hash, ArrowUpRight, Building2, Eye,
  Clock, Inbox, RefreshCw,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'
import { alertasApi } from '@/api/seguimiento'
import { useAuthStore } from '@/store/authStore'
import {
  PRIORIDAD_ALERTA_LABELS,
  ESTADO_ALERTA_LABELS,
} from '@/lib/constants'
import { formatDate, formatDateTime } from '@/lib/formatters'
import Tooltip from '@/components/ui/Tooltip'
import type { Alerta, PrioridadAlerta, EstadoAlerta } from '@/types/seguimiento'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const PRIORIDADES: PrioridadAlerta[] = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE']
const ESTADOS: EstadoAlerta[] = ['PENDIENTE', 'LEIDA', 'ATENDIDA', 'CANCELADA']

interface Stats {
  total: number
  pendientes: number
  altaPrioridad: number
  proximasVencer: number
}

function formatRelative(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  if (diffSec < 60) return 'hace un momento'
  if (diffMin < 60) return `hace ${diffMin} min`
  if (diffHr < 24) return `hace ${diffHr} h${diffHr === 1 ? '' : 's'}`
  if (diffDay === 1) return 'ayer'
  if (diffDay < 7) return `hace ${diffDay} días`
  if (diffDay < 30) return `hace ${Math.floor(diffDay / 7)} sem`
  return formatDate(dateStr)
}

function isVencida(a: Alerta): boolean {
  if (!a.fecha_vencimiento) return false
  if (a.estado === 'ATENDIDA' || a.estado === 'CANCELADA') return false
  return new Date(a.fecha_vencimiento).getTime() < Date.now()
}

function isProximaVencer(a: Alerta): boolean {
  if (!a.fecha_vencimiento) return false
  if (a.estado === 'ATENDIDA' || a.estado === 'CANCELADA') return false
  const diffDays = Math.ceil((new Date(a.fecha_vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= 3
}

export default function AlertasPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const rol = user?.rol || 'ESTUDIANTE'

  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterPrioridad, setFilterPrioridad] = useState<PrioridadAlerta | ''>('')
  const [filterEstado, setFilterEstado] = useState<EstadoAlerta | ''>('')

  const [stats, setStats] = useState<Stats>({ total: 0, pendientes: 0, altaPrioridad: 0, proximasVencer: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  const [viewAlerta, setViewAlerta] = useState<Alerta | null>(null)
  const [acting, setActing] = useState<number | null>(null)
  const [bulkActing, setBulkActing] = useState(false)

  const isAdmin = rol === 'ADMIN'

  const baseParams = useMemo<Record<string, string>>(() => {
    const params: Record<string, string> = {}
    if (!isAdmin && user?.id) {
      params.usuario = String(user.id)
    }
    return params
  }, [isAdmin, user?.id])

  const subtitle =
    isAdmin || rol === 'COORDINADOR'
      ? 'Centro de notificaciones del sistema de vinculación.'
      : rol === 'DOCENTE'
        ? 'Mis alertas y notificaciones académicas.'
        : 'Mis alertas y recordatorios.'

  const proyectosBasePath = `/${rol.toLowerCase()}/proyectos`
  const conveniosBasePath = `/${rol.toLowerCase()}/convenios`

  const hasActiveFilters = !!search || !!filterPrioridad || !!filterEstado

  const activeFilterChips = [
    search && { key: 'search', label: `“${search}”`, onRemove: () => { setSearch(''); setSearchInput(''); setPage(1) } },
    filterPrioridad && { key: 'prio', label: `Prioridad: ${PRIORIDAD_ALERTA_LABELS[filterPrioridad]}`, onRemove: () => { setFilterPrioridad(''); setPage(1) } },
    filterEstado && { key: 'estado', label: `Estado: ${ESTADO_ALERTA_LABELS[filterEstado]}`, onRemove: () => { setFilterEstado(''); setPage(1) } },
  ].filter(Boolean) as { key: string; label: string; onRemove: () => void }[]

  const loadAlertas = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const params: Record<string, string> = {
        ...baseParams,
        page: String(page),
        page_size: String(pageSize),
      }
      if (search) params.search = search
      if (filterPrioridad) params.prioridad = filterPrioridad
      if (filterEstado) params.estado = filterEstado
      const { data } = await alertasApi.list(params)
      setAlertas(data.results)
      setTotal(data.count)
      setLastUpdate(new Date())
    } catch {
      toast.error('Error al cargar las alertas')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [baseParams, page, pageSize, search, filterPrioridad, filterEstado])

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const count = async (params: Record<string, string>) => {
        const { data } = await alertasApi.list({ ...baseParams, ...params, page_size: '1' })
        return data.count
      }
      const [totalC, pendientesC, altaC, urgenteC] = await Promise.all([
        count({}),
        count({ estado: 'PENDIENTE' }),
        count({ prioridad: 'ALTA' }),
        count({ prioridad: 'URGENTE' }),
      ])
      let proximas = 0
      try {
        const { data } = await alertasApi.list({ ...baseParams, estado: 'PENDIENTE', page_size: '200' })
        data.results.forEach((a) => {
          if (isProximaVencer(a)) proximas += 1
        })
      } catch {
        /* silencioso */
      }
      setStats({
        total: totalC,
        pendientes: pendientesC,
        altaPrioridad: altaC + urgenteC,
        proximasVencer: proximas,
      })
    } catch {
      /* silencioso */
    } finally {
      setStatsLoading(false)
    }
  }, [baseParams])

  useEffect(() => { loadAlertas() }, [loadAlertas])
  useEffect(() => { loadStats() }, [loadStats])

  const filtered = useMemo(() => {
    return alertas.filter((a) => {
      if (search) {
        const q = search.toLowerCase()
        if (!(a.mensaje || '').toLowerCase().includes(q) && !(a.detalle || '').toLowerCase().includes(q)) {
          return false
        }
      }
      if (filterPrioridad && a.prioridad !== filterPrioridad) return false
      if (filterEstado && a.estado !== filterEstado) return false
      return true
    })
  }, [alertas, search, filterPrioridad, filterEstado])

  const handleSearch = () => {
    setPage(1)
    setSearch(searchInput.trim())
  }
  const handleClear = () => {
    setSearchInput('')
    setSearch('')
    setFilterPrioridad('')
    setFilterEstado('')
    setPage(1)
  }

  const handleMarcarLeida = async (a: Alerta) => {
    if (a.estado !== 'PENDIENTE') return
    setActing(a.id)
    try {
      await alertasApi.leer(a.id)
      toast.success('Alerta marcada como leída')
      loadAlertas(true)
      loadStats()
    } catch {
      toast.error('No se pudo marcar la alerta')
    } finally {
      setActing(null)
    }
  }

  const handleAtender = async (a: Alerta) => {
    if (a.estado === 'ATENDIDA' || a.estado === 'CANCELADA') return
    setActing(a.id)
    try {
      await alertasApi.atender(a.id)
      toast.success('Alerta atendida')
      loadAlertas(true)
      loadStats()
    } catch {
      toast.error('No se pudo atender la alerta')
    } finally {
      setActing(null)
    }
  }

  const handleMarkAllRead = async () => {
    if (!stats.pendientes) {
      toast('No hay alertas pendientes', { icon: 'ℹ️' })
      return
    }
    setBulkActing(true)
    let ok = 0
    let fail = 0
    try {
      const { data } = await alertasApi.list({ ...baseParams, estado: 'PENDIENTE', page_size: '200' })
      for (const a of data.results) {
        try {
          await alertasApi.leer(a.id)
          ok += 1
        } catch {
          fail += 1
        }
      }
    } catch {
      toast.error('No se pudo obtener la lista de pendientes')
    }
    if (ok > 0) toast.success(`${ok} alerta${ok === 1 ? '' : 's'} marcada${ok === 1 ? '' : 's'} como leída${ok === 1 ? '' : 's'}`)
    if (fail > 0) toast.error(`${fail} no se pudieron procesar`)
    setBulkActing(false)
    loadAlertas(true)
    loadStats()
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="space-y-6">
      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight leading-tight">
              {isAdmin ? 'Alertas' : 'Mis alertas'}
            </h1>
            {!statsLoading && stats.pendientes > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-2xs font-semibold rounded-full bg-bg-soft text-ink-muted border border-line">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                {stats.pendientes} pendiente{stats.pendientes === 1 ? '' : 's'}
              </span>
            )}
            {!statsLoading && (
              <span className="inline-flex items-center px-2 py-0.5 text-2xs font-semibold rounded-full bg-bg-soft text-ink-muted border border-line">
                {stats.total} en total
              </span>
            )}
          </div>
          <p className="text-sm text-ink-muted max-w-xl">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => loadAlertas(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3 text-[12.5px] font-medium rounded-btn border border-line bg-white text-ink hover:bg-bg-soft transition-all disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} strokeWidth={2.25} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          {isAdmin && stats.pendientes > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={bulkActing}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 text-[12.5px] font-semibold rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 btn-glow transition-all disabled:opacity-50"
            >
              <CheckCheck size={14} strokeWidth={2.5} />
              Marcar todas leídas
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════ STATS (NO TOCAR) ═══════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-t border-b border-slate-200 overflow-hidden bg-white rounded-card [&>*:not(:first-child)]:border-l [&>*:not(:first-child)]:border-slate-200">
        <StatCard label="Total de alertas" value={stats.total} icon={Bell} accent="indigo" loading={statsLoading} />
        <StatCard label="Pendientes" value={stats.pendientes} icon={Clock} accent="emerald" loading={statsLoading} />
        <StatCard label="Prioridad alta" value={stats.altaPrioridad} icon={AlertOctagon} accent="rose" loading={statsLoading} />
        <StatCard label="Próximas a vencer" value={stats.proximasVencer} icon={AlertTriangle} accent="amber" loading={statsLoading} />
      </div>

      {/* ═══════════════ FILTROS ═══════════════ */}
      <div className="bg-white border border-line rounded-card shadow-xs">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-line">
          <Filter size={14} className="text-ink-muted" />
          <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Filtros</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-2xs font-bold rounded-full bg-emerald-100 text-emerald-700">
              {[search, filterPrioridad, filterEstado].filter(Boolean).length} activos
            </span>
          )}
        </div>
        <div className="p-5 space-y-3.5">
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
                  placeholder="Buscar en mensaje o detalle..."
                />
              </div>
            </div>
            <div className="w-44">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Prioridad</label>
              <SelectInput
                value={filterPrioridad}
                onChange={(v) => { setFilterPrioridad(v as PrioridadAlerta | ''); setPage(1) }}
                options={[{ value: '', label: 'Todas' }, ...PRIORIDADES.map((p) => ({ value: p, label: PRIORIDAD_ALERTA_LABELS[p] || p }))]}
                placeholder="Todas"
              />
            </div>
            <div className="w-44">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Estado</label>
              <SelectInput
                value={filterEstado}
                onChange={(v) => { setFilterEstado(v as EstadoAlerta | ''); setPage(1) }}
                options={[{ value: '', label: 'Todos' }, ...ESTADOS.map((e) => ({ value: e, label: ESTADO_ALERTA_LABELS[e] || e }))]}
                placeholder="Todos"
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
          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-dashed border-line">
              <span className="text-2xs font-semibold text-ink-muted uppercase tracking-wider mr-1">Aplicados:</span>
              {activeFilterChips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70"
                >
                  {chip.label}
                  <button
                    onClick={chip.onRemove}
                    className="w-4 h-4 rounded-full inline-flex items-center justify-center hover:bg-emerald-100 transition-colors"
                    title="Quitar filtro"
                  >
                    <X size={10} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════ TABLA REDISEÑADA ═══════════════ */}
      <div className="bg-white border border-line rounded-card shadow-xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-3 border-b border-line">
          <div className="flex items-baseline gap-2 min-w-0">
            <h3 className="text-sm font-semibold text-ink">Listado de alertas</h3>
            {!loading && (
              <span className="text-xs text-ink-muted">
                Mostrando {from}–{to} de {total} {total === 1 ? 'alerta' : 'alertas'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-ink-muted">
            {refreshing && (
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw size={11} className="animate-spin" />
                Sincronizando…
              </span>
            )}
            <span className="hidden md:inline-flex items-center gap-1.5">
              <Inbox size={12} />
              Actualizado {formatRelative(lastUpdate.toISOString())}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-xs text-ink-muted">Cargando alertas...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyAlertas hasFilters={hasActiveFilters} onClear={handleClear} />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm table-fixed" style={{ minWidth: '960px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                  <Th style={{ width: '120px' }}>Código</Th>
                  <Th style={{ width: '320px' }}>Alerta</Th>
                  <Th style={{ width: '110px' }} className="text-center">Prioridad</Th>
                  <Th style={{ width: '110px' }} className="text-center">Estado</Th>
                  <Th style={{ width: '110px' }}>Creada</Th>
                  <Th style={{ width: '110px' }}>Vencimiento</Th>
                  <Th style={{ width: '80px' }} className="text-center">Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <AlertaRow
                    key={a.id}
                    alerta={a}
                    acting={acting === a.id}
                    onView={() => setViewAlerta(a)}
                    onAtender={() => handleAtender(a)}
                    onProyectoClick={() => a.proyecto && navigate(`${proyectosBasePath}/${a.proyecto}`)}
                    onConvenioClick={() => a.convenio && navigate(`${conveniosBasePath}/${a.convenio}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 0 && !loading && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-line bg-bg-soft/30">
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <span className="text-xs">Filas por página</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="h-9 px-3 pr-8 border border-line bg-white text-sm text-ink rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 appearance-none bg-no-repeat cursor-pointer"
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
              <PageButton onClick={() => setPage(1)} disabled={page === 1} iconOnly>«</PageButton>
              <PageButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} iconOnly>
                <ChevronLeft size={14} />
              </PageButton>
              <span className="px-3 h-9 inline-flex items-center text-sm font-medium text-ink bg-white border border-line rounded-btn">
                {page} <span className="text-ink-muted">/ {totalPages}</span>
              </span>
              <PageButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} iconOnly>
                <ChevronRight size={14} />
              </PageButton>
              <PageButton onClick={() => setPage(totalPages)} disabled={page === totalPages} iconOnly>»</PageButton>
            </div>
          </div>
        )}
      </div>

      {/* SLIDE-OVER: Detalle de alerta */}
      {viewAlerta && (
        <AlertaDetalleSlideOver
          alerta={viewAlerta}
          onClose={() => setViewAlerta(null)}
          onMarcarLeida={() => { handleMarcarLeida(viewAlerta); setViewAlerta(null) }}
          onAtender={() => { handleAtender(viewAlerta); setViewAlerta(null) }}
          onProyectoClick={() => { if (viewAlerta.proyecto) { setViewAlerta(null); navigate(`${proyectosBasePath}/${viewAlerta.proyecto}`) } }}
          onConvenioClick={() => { if (viewAlerta.convenio) { setViewAlerta(null); navigate(`${conveniosBasePath}/${viewAlerta.convenio}`) } }}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTES
   ═══════════════════════════════════════════════════════════════ */

function Th({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <th
      className={clsx('text-left text-[11px] font-semibold text-[#6B7280] uppercase whitespace-nowrap', className)}
      style={{ padding: '10px 16px', letterSpacing: '0.05em', ...style }}
    >
      {children}
    </th>
  )
}

function StatCard({
  label, value, icon: Icon, accent, loading,
}: {
  label: string
  value: number
  icon: LucideIcon
  accent: 'indigo' | 'emerald' | 'slate' | 'amber' | 'rose'
  loading?: boolean
}) {
  const ACCENTS = {
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  hex: '#4F46E5' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', hex: '#059669' },
    slate:   { bg: 'bg-slate-50',   text: 'text-slate-600',   hex: '#475569' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   hex: '#D97706' },
    rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    hex: '#E11D48' },
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
        <div className="text-4xl font-bold tracking-tight text-slate-900 transition-transform duration-300 group-hover:-translate-y-0.5 tabular-nums">
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

function PageButton({
  children, onClick, disabled, iconOnly,
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
      className={`inline-flex items-center justify-center ${iconOnly ? 'w-9 h-9' : 'h-9 px-3'} text-sm font-medium rounded-btn border border-line bg-white text-ink hover:bg-bg-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
    >
      {children}
    </button>
  )
}

function SelectInput({
  value, onChange, options, placeholder,
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

/* ─────────────────────────────────────────────
   PRIORIDAD BADGE — pill compacto
   ───────────────────────────────────────────── */
function PrioridadBadge({ prioridad, pulse }: { prioridad: PrioridadAlerta; pulse: boolean }) {
  const label = PRIORIDAD_ALERTA_LABELS[prioridad] || prioridad
  const STYLES: Record<PrioridadAlerta, { bg: string; text: string; dot: string }> = {
    BAJA:    { bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-500' },
    MEDIA:   { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500' },
    ALTA:    { bg: 'bg-red-100',    text: 'text-red-800',     dot: 'bg-red-600' },
    URGENTE: { bg: 'bg-red-200',    text: 'text-red-900',     dot: 'bg-red-700' },
  }
  const s = STYLES[prioridad]
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-md whitespace-nowrap',
        s.bg, s.text,
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {pulse && (
          <span className={clsx('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', s.dot)} />
        )}
        <span className={clsx('relative inline-flex rounded-full h-2 w-2', s.dot)} />
      </span>
      {label}
    </span>
  )
}

/* ─────────────────────────────────────────────
   ESTADO BADGE — pill compacto
   ───────────────────────────────────────────── */
function EstadoBadge({ alerta }: { alerta: Alerta }) {
  if (isVencida(alerta)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-md whitespace-nowrap bg-red-50 text-red-700">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        Vencida
      </span>
    )
  }
  const STYLES: Record<EstadoAlerta, { bg: string; text: string; dot: string; pulse: boolean }> = {
    PENDIENTE: { bg: 'bg-amber-50',    text: 'text-amber-700',    dot: 'bg-amber-500',   pulse: true },
    LEIDA:     { bg: 'bg-violet-50',   text: 'text-violet-700',   dot: 'bg-violet-500',  pulse: false },
    ATENDIDA:  { bg: 'bg-emerald-50',  text: 'text-emerald-700',  dot: 'bg-emerald-500', pulse: false },
    CANCELADA: { bg: 'bg-slate-50',    text: 'text-slate-700',    dot: 'bg-slate-500',   pulse: false },
  }
  const s = STYLES[alerta.estado]
  const label =
    alerta.estado === 'ATENDIDA' ? 'Completada' :
    alerta.estado === 'LEIDA' ? 'Leída' :
    ESTADO_ALERTA_LABELS[alerta.estado] || alerta.estado
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-md whitespace-nowrap',
        s.bg, s.text,
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {s.pulse && (
          <span className={clsx('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', s.dot)} />
        )}
        <span className={clsx('relative inline-flex rounded-full h-2 w-2', s.dot)} />
      </span>
      {label}
    </span>
  )
}

/* ─────────────────────────────────────────────
   ACTION BUTTON — patrón ActionIcon con colores del spec
   ───────────────────────────────────────────── */
function AlertaActionBtn({
  enabled, onClick, hoverColor, ariaLabel, tooltip, children,
}: {
  enabled: boolean
  onClick: () => void
  hoverColor: 'blue' | 'emerald'
  ariaLabel: string
  tooltip: string
  children: React.ReactNode
}) {
  const DEFAULT_TEXT: Record<typeof hoverColor, string> = {
    blue: 'text-[#2563EB]',
    emerald: 'text-[#16A34A]',
  }
  const HOVER_BG: Record<typeof hoverColor, string> = {
    blue: 'hover:bg-[#2563EB] hover:text-white',
    emerald: 'hover:bg-[#16A34A] hover:text-white',
  }
  return (
    <Tooltip content={tooltip} position="top">
      <button
        type="button"
        onClick={enabled ? onClick : undefined}
        disabled={!enabled}
        aria-label={ariaLabel}
        className={clsx(
          'h-8 w-8 inline-flex items-center justify-center transition-colors duration-150',
          enabled
            ? `${DEFAULT_TEXT[hoverColor]} cursor-pointer ${HOVER_BG[hoverColor]}`
            : 'text-[#9CA3AF] cursor-not-allowed opacity-40',
        )}
      >
        {children}
      </button>
    </Tooltip>
  )
}

/* ─────────────────────────────────────────────
   FILA DE ALERTA — 5 columnas alineadas
   ───────────────────────────────────────────── */
function AlertaRow({
  alerta, acting, onView, onAtender, onProyectoClick, onConvenioClick,
}: {
  alerta: Alerta
  acting: boolean
  onView: () => void
  onAtender: () => void
  onProyectoClick: () => void
  onConvenioClick: () => void
}) {
  const canAtender = alerta.estado === 'PENDIENTE' || alerta.estado === 'LEIDA'
  const isPending = alerta.estado === 'PENDIENTE'

  return (
    <tr
      className="transition-colors duration-150"
      style={{ borderBottom: '1px solid #F3F4F6' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F0FDF4' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {/* COLUMNA 1: Código (proyecto / convenio) */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        {(alerta.proyecto_codigo || alerta.convenio_codigo) ? (
          <div className="flex flex-col gap-1 items-start">
            {alerta.proyecto_codigo && (
              <button
                type="button"
                onClick={onProyectoClick}
                className="inline-flex items-center gap-1 transition-colors hover:opacity-80"
                style={{
                  background: '#F3F4F6',
                  color: '#16A34A',
                  fontSize: '11px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontWeight: 500,
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
                title="Ver proyecto"
              >
                <Hash size={10} strokeWidth={2.5} />
                {alerta.proyecto_codigo}
              </button>
            )}
            {alerta.convenio_codigo && (
              <button
                type="button"
                onClick={onConvenioClick}
                className="inline-flex items-center gap-1 transition-colors hover:opacity-80"
                style={{
                  background: '#F3F4F6',
                  color: '#16A34A',
                  fontSize: '11px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontWeight: 500,
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
                title="Ver convenio"
              >
                <Building2 size={10} strokeWidth={2.5} />
                {alerta.convenio_codigo}
              </button>
            )}
          </div>
        ) : (
          <span className="text-[12px] text-[#9CA3AF]">—</span>
        )}
      </td>

      {/* COLUMNA 2: Alerta (mensaje) */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#0A0A0A', lineHeight: 1.4, margin: 0 }}>
          {alerta.mensaje}
        </p>
        {alerta.detalle && (
          <p className="text-[12px] text-[#6B7280] mt-0.5 line-clamp-1 leading-snug">
            {alerta.detalle}
          </p>
        )}
      </td>

      {/* COLUMNA 3: Prioridad */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
        <PrioridadBadge prioridad={alerta.prioridad} pulse={isPending} />
      </td>

      {/* COLUMNA 4: Estado */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
        <EstadoBadge alerta={alerta} />
      </td>

      {/* COLUMNA 5: Creada */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        <p className="text-[12px] text-[#374151] tabular-nums">{formatDate(alerta.creado_en)}</p>
      </td>

      {/* COLUMNA 6: Vencimiento */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
        {alerta.fecha_vencimiento ? (
          <p className={clsx(
            'text-[12px] tabular-nums',
            isVencida(alerta) ? 'text-[#DC2626] font-semibold' :
            isProximaVencer(alerta) ? 'text-[#F97316] font-semibold' :
            'text-[#374151]',
          )}>
            {formatDate(alerta.fecha_vencimiento)}
          </p>
        ) : (
          <span className="text-[12px] text-[#9CA3AF]">—</span>
        )}
      </td>

      {/* COLUMNA 7: Acciones */}
      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
        <div className="inline-flex items-center gap-0.5">
          <AlertaActionBtn
            enabled={true}
            onClick={onView}
            hoverColor="blue"
            ariaLabel="Ver detalle"
            tooltip="Ver detalle"
          >
            <Eye size={15} strokeWidth={2.25} />
          </AlertaActionBtn>
          <AlertaActionBtn
            enabled={canAtender && !acting}
            onClick={onAtender}
            hoverColor="emerald"
            ariaLabel="Marcar como atendida"
            tooltip={canAtender ? (acting ? 'Procesando…' : 'Marcar como atendida') : 'Ya atendida'}
          >
            <Check size={15} strokeWidth={2.25} />
          </AlertaActionBtn>
        </div>
      </td>
    </tr>
  )
}

function EmptyAlertas({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 ring-1 ring-emerald-100">
        <Bell size={24} className="text-emerald-600" strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-semibold text-ink">
        {hasFilters ? 'Sin coincidencias' : 'No tienes alertas pendientes'}
      </h3>
      <p className="mt-1.5 text-sm text-ink-muted max-w-sm">
        {hasFilters
          ? 'Ninguna alerta coincide con los filtros aplicados. Ajusta los criterios o limpia los filtros para ver el listado completo.'
          : 'Buen trabajo. Cuando el sistema genere nuevas alertas, aparecerán aquí.'}
      </p>
      {hasFilters && (
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-2 h-9 px-4 text-sm font-semibold rounded-btn bg-ink text-white hover:bg-ink/90 btn-glow transition-all"
          >
            <X size={14} strokeWidth={2.5} />
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  )
}

function AlertaDetalleSlideOver({
  alerta, onClose, onMarcarLeida, onAtender, onProyectoClick, onConvenioClick,
}: {
  alerta: Alerta
  onClose: () => void
  onMarcarLeida: () => void
  onAtender: () => void
  onProyectoClick: () => void
  onConvenioClick: () => void
}) {
  const [animate, setAnimate] = useState(false)
  const canMarcarLeida = alerta.estado === 'PENDIENTE'
  const canAtender = alerta.estado === 'PENDIENTE' || alerta.estado === 'LEIDA'

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)))
    document.body.style.overflow = 'hidden'
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onEsc)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onEsc)
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0"
      style={{
        zIndex: 99999,
        background: `rgba(15, 23, 42, ${animate ? '0.45' : '0'})`,
        backdropFilter: animate ? 'blur(3px)' : 'blur(0px)',
        WebkitBackdropFilter: animate ? 'blur(3px)' : 'blur(0px)',
        transition: 'all 220ms ease',
      }}
      onClick={onClose}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className="absolute top-0 right-0 h-full bg-white flex flex-col shadow-card"
        style={{
          width: 'min(560px, 100%)',
          transform: animate ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div className="relative px-6 pt-6 pb-5 border-b border-line flex-shrink-0 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-bg-soft">
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center shadow-sm shadow-ink/20">
                  <Bell size={17} className="text-white" strokeWidth={2.25} />
                </div>
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-ink">
                    Detalle de alerta
                  </p>
                  <p className="text-[11.5px] text-ink-muted">
                    #{alerta.id} · {formatDateTime(alerta.creado_en)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <PrioridadBadge prioridad={alerta.prioridad} pulse={alerta.estado === 'PENDIENTE'} />
                <EstadoBadge alerta={alerta} />
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-none text-ink-muted hover:text-ink hover:bg-bg-soft transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          <div className="space-y-5">
            <section>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-muted mb-1.5">
                Mensaje
              </p>
              <p className="text-[15px] font-semibold text-ink leading-relaxed">
                {alerta.mensaje}
              </p>
            </section>

            {alerta.detalle && (
              <section>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-muted mb-1.5">
                  Detalle
                </p>
                <div className="rounded-md bg-bg-soft/60 border border-line p-3.5">
                  <p className="text-[13.5px] text-ink leading-relaxed whitespace-pre-line">
                    {alerta.detalle}
                  </p>
                </div>
              </section>
            )}

            {(alerta.proyecto_codigo || alerta.convenio_codigo) && (
              <section>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-muted mb-1.5">
                  Vincular a
                </p>
                <div className="rounded-md border border-line overflow-hidden divide-y divide-line">
                  {alerta.proyecto_codigo && (
                    <button
                      type="button"
                      onClick={onProyectoClick}
                      className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-bg-soft transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                        <Hash size={14} className="text-ink" strokeWidth={2.25} />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">Proyecto</p>
                        <p className="text-[13px] font-mono font-semibold text-ink truncate">{alerta.proyecto_codigo}</p>
                      </div>
                      <ArrowUpRight size={14} className="text-ink-light group-hover:text-ink transition-colors" />
                    </button>
                  )}
                  {alerta.convenio_codigo && (
                    <button
                      type="button"
                      onClick={onConvenioClick}
                      className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-bg-soft transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                        <Building2 size={14} className="text-ink" strokeWidth={2.25} />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">Convenio</p>
                        <p className="text-[13px] font-mono font-semibold text-ink truncate">{alerta.convenio_codigo}</p>
                      </div>
                      <ArrowUpRight size={14} className="text-ink-light group-hover:text-ink transition-colors" />
                    </button>
                  )}
                </div>
              </section>
            )}

            {alerta.fecha_vencimiento && (
              <section>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-muted mb-1.5">
                  Vencimiento
                </p>
                <p className="text-[13.5px] text-ink tabular-nums">
                  {formatDateTime(alerta.fecha_vencimiento)}
                </p>
              </section>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t border-line bg-bg-soft/40 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors"
          >
            Cerrar
          </button>
          {canMarcarLeida && (
            <button
              type="button"
              onClick={onMarcarLeida}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors"
            >
              <Check size={14} /> Marcar leída
            </button>
          )}
          {canAtender && (
            <button
              type="button"
              onClick={onAtender}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-btn text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-colors"
            >
              <CheckCheck size={14} /> Atender
            </button>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  )
}
