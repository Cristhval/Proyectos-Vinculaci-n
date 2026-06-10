import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, X, Bell, Filter, RotateCcw, ChevronLeft, ChevronRight,
  ChevronDown, Info, AlertTriangle, AlertOctagon,
  Eye, Check, CheckCheck, Calendar, Hash, ArrowUpRight, Building2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { alertasApi } from '@/api/seguimiento'
import { useAuthStore } from '@/store/authStore'
import {
  PRIORIDAD_ALERTA_LABELS, PRIORIDAD_ALERTA_STYLES,
  ESTADO_ALERTA_LABELS, ESTADO_ALERTA_BADGE,
} from '@/lib/constants'
import { formatDate, formatDateTime } from '@/lib/formatters'
import Tooltip from '@/components/ui/Tooltip'
import type { Alerta, PrioridadAlerta, EstadoAlerta } from '@/types/seguimiento'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const PRIORIDADES: PrioridadAlerta[] = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE']
const ESTADOS: EstadoAlerta[] = ['PENDIENTE', 'LEIDA', 'ATENDIDA', 'CANCELADA']

interface Stats {
  total: number
  urgentes: number
  pendientes: number
  atendidas: number
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

export default function AlertasPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const rol = user?.rol || 'ESTUDIANTE'

  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterPrioridad, setFilterPrioridad] = useState<PrioridadAlerta | ''>('')
  const [filterEstado, setFilterEstado] = useState<EstadoAlerta | ''>('')

  const [stats, setStats] = useState<Stats>({ total: 0, urgentes: 0, pendientes: 0, atendidas: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  const [viewAlerta, setViewAlerta] = useState<Alerta | null>(null)
  const [acting, setActing] = useState<number | null>(null)

  const [colWidths, setColWidths] = useState<Record<string, number>>({
    prioridad: 130,
    mensaje: 320,
    relacionado: 180,
  })
  const [resizing, setResizing] = useState(false)
  const activeCol = useRef<string | null>(null)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const subtitle =
    rol === 'ADMIN' || rol === 'COORDINADOR'
      ? 'Alertas del sistema'
      : rol === 'DOCENTE'
        ? 'Mis alertas y notificaciones'
        : 'Mis alertas'

  const proyectosBasePath = `/${rol.toLowerCase()}/proyectos`
  const conveniosBasePath = `/${rol.toLowerCase()}/convenios`

  const hasActiveFilters = !!search || !!filterPrioridad || !!filterEstado

  const activeFilterChips = [
    search && { key: 'search', label: `“${search}”`, onRemove: () => { setSearch(''); setSearchInput(''); setPage(1) } },
    filterPrioridad && { key: 'prio', label: `Prioridad: ${PRIORIDAD_ALERTA_LABELS[filterPrioridad]}`, onRemove: () => { setFilterPrioridad(''); setPage(1) } },
    filterEstado && { key: 'estado', label: `Estado: ${ESTADO_ALERTA_LABELS[filterEstado]}`, onRemove: () => { setFilterEstado(''); setPage(1) } },
  ].filter(Boolean) as { key: string; label: string; onRemove: () => void }[]

  const loadAlertas = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await alertasApi.list({ page: String(page), page_size: String(pageSize) })
      setAlertas(data.results)
      setTotal(data.count)
    } catch {
      toast.error('Error al cargar las alertas')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const count = async (params: Record<string, string>) => {
        const { data } = await alertasApi.list({ ...params, page_size: '1' })
        return data.count
      }
      const [total, urgentes, pendientes, atendidas] = await Promise.all([
        count({}),
        count({ prioridad: 'URGENTE' }),
        count({ estado: 'PENDIENTE' }),
        count({ estado: 'ATENDIDA' }),
      ])
      setStats({ total, urgentes, pendientes, atendidas })
    } catch {
      /* silencioso */
    } finally {
      setStatsLoading(false)
    }
  }, [])

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
      loadAlertas()
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
      loadAlertas()
      loadStats()
    } catch {
      toast.error('No se pudo atender la alerta')
    } finally {
      setActing(null)
    }
  }

  const handleResizeStart = useCallback((colKey: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    activeCol.current = colKey
    startX.current = e.clientX
    startWidth.current = colWidths[colKey] ?? 100
    setResizing(true)

    const handleMouseMove = (ev: MouseEvent) => {
      const diff = ev.clientX - startX.current
      const newWidth = Math.max(80, Math.min(500, startWidth.current + diff))
      setColWidths((prev) => ({ ...prev, [colKey]: newWidth }))
    }

    const handleMouseUp = () => {
      activeCol.current = null
      setResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [colWidths])

  const Resizer = ({ colKey }: { colKey: string }) => {
    const [hover, setHover] = useState(false)
    return (
      <div
        onMouseDown={handleResizeStart(colKey)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="absolute right-0 top-0 bottom-0 cursor-col-resize transition-all"
        style={{
          width: resizing || hover ? '3px' : '2px',
          background: resizing || hover ? '#16A34A' : '#D1D5DB',
          opacity: resizing || hover ? 1 : 0.4,
        }}
      />
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="space-y-6">
      {/* ═══════════════ HEADER ═══════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-[26px] font-bold text-ink tracking-tightest leading-tight">Alertas</h1>
          {!statsLoading && (
            <span className="inline-flex items-center px-2 py-0.5 text-2xs font-semibold rounded-full bg-bg-soft text-ink-muted border border-line">
              {stats.pendientes} pendiente{stats.pendientes === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <p className="text-sm text-ink-muted max-w-xl">{subtitle}</p>
      </div>

      {/* ═══════════════ STATS ═══════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total alertas" value={stats.total} icon={Bell} accent="indigo" loading={statsLoading} />
        <StatCard label="Urgentes" value={stats.urgentes} icon={AlertOctagon} accent="rose" loading={statsLoading} />
        <StatCard label="Pendientes" value={stats.pendientes} icon={AlertTriangle} accent="amber" loading={statsLoading} />
        <StatCard label="Atendidas" value={stats.atendidas} icon={CheckCheck} accent="emerald" loading={statsLoading} />
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
              type="button"
              onClick={handleSearch}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-semibold rounded-btn bg-ink text-white hover:bg-ink/90 btn-glow transition-all"
            >
              <Search size={14} strokeWidth={2.5} />
              Buscar
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!hasActiveFilters}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium rounded-btn border border-ink bg-white text-ink hover:bg-bg-soft disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
                  className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  {chip.label}
                  <button
                    onClick={chip.onRemove}
                    className="w-4 h-4 rounded-none inline-flex items-center justify-center hover:bg-emerald-200/60 transition-colors"
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

      {/* ═══════════════ TABLA ═══════════════ */}
      <div className="bg-white border border-line rounded-card shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-line">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-semibold text-ink">Listado de alertas</h3>
            {!loading && (
              <span className="text-xs text-ink-muted">
                Mostrando {from}–{to} de {total} {total === 1 ? 'alerta' : 'alertas'}
              </span>
            )}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-bg-soft/60">
                  <Th resizable colWidth={colWidths.prioridad}>
                    <Resizer colKey="prioridad" />
                    Prioridad
                  </Th>
                  <Th resizable colWidth={colWidths.mensaje}>
                    <Resizer colKey="mensaje" />
                    Mensaje
                  </Th>
                  <Th resizable colWidth={colWidths.relacionado}>
                    <Resizer colKey="relacionado" />
                    Proyecto / Convenio
                  </Th>
                  <Th>Estado</Th>
                  <Th className="w-[120px]">Creada</Th>
                  <Th className="w-[120px]">Vence</Th>
                  <Th className="w-[120px] text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <AlertaRow
                    key={a.id}
                    alerta={a}
                    acting={acting === a.id}
                    onView={() => setViewAlerta(a)}
                    onMarcarLeida={() => handleMarcarLeida(a)}
                    onAtender={() => handleAtender(a)}
                    onProyectoClick={() => a.proyecto && navigate(`${proyectosBasePath}/${a.proyecto}`)}
                    onConvenioClick={() => a.convenio && navigate(`${conveniosBasePath}/${a.convenio}`)}
                    colWidths={colWidths}
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

      {/* MODAL: Ver alerta */}
      {viewAlerta && (
        <AlertaDetalleModal
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

function Th({
  children, className = '', resizable, colWidth,
}: {
  children: React.ReactNode
  className?: string
  resizable?: boolean
  colWidth?: number
}) {
  return (
    <th
      className={`px-4 py-2.5 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-wider align-middle relative group border-b border-line ${resizable ? '' : 'whitespace-nowrap'} ${className}`}
      style={resizable && colWidth ? { width: colWidth, minWidth: colWidth } : undefined}
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
  accent: 'indigo' | 'sky' | 'emerald' | 'rose' | 'amber'
  loading?: boolean
}) {
  const ACCENTS: Record<string, { bg: string; ring: string; text: string }> = {
    indigo:  { bg: 'bg-indigo-50',  ring: 'ring-indigo-100',  text: 'text-indigo-600' },
    sky:     { bg: 'bg-sky-50',     ring: 'ring-sky-100',     text: 'text-sky-600' },
    emerald: { bg: 'bg-emerald-50', ring: 'ring-emerald-100', text: 'text-emerald-600' },
    rose:    { bg: 'bg-rose-50',    ring: 'ring-rose-100',    text: 'text-rose-600' },
    amber:   { bg: 'bg-amber-50',   ring: 'ring-amber-200',   text: 'text-amber-600' },
  }
  const a = ACCENTS[accent]!
  return (
    <div className="group relative bg-white border border-line rounded-card p-5 shadow-xs hover:shadow-sm hover:border-line-strong transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${a.bg} ${a.text} ring-1 ${a.ring} flex items-center justify-center transition-transform group-hover:scale-105`}>
          <Icon size={18} strokeWidth={2.25} />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-bg-soft rounded animate-pulse" />
      ) : (
        <div className="text-[28px] font-bold text-ink tracking-tightest leading-none">
          {value.toLocaleString('es-EC')}
        </div>
      )}
      <div className="mt-1.5 text-xs font-medium text-ink-muted uppercase tracking-wider">
        {label}
      </div>
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

/* ═══════════════════════════════════════════════════════════════
   PRIORIDAD BADGE
   ═══════════════════════════════════════════════════════════════ */
function PrioridadBadge({ prioridad }: { prioridad: PrioridadAlerta }) {
  const style = PRIORIDAD_ALERTA_STYLES[prioridad] ?? PRIORIDAD_ALERTA_STYLES.BAJA!
  const label = PRIORIDAD_ALERTA_LABELS[prioridad] || prioridad
  const Icon = prioridad === 'URGENTE' ? AlertOctagon
    : prioridad === 'ALTA' ? AlertTriangle
    : prioridad === 'MEDIA' ? AlertTriangle
    : Info
  const isPulsing = prioridad === 'URGENTE' || prioridad === 'ALTA'
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${style.bg} ${style.text} ring-1 ring-inset ring-black/[0.04]`}
      style={{ borderRadius: '999px', padding: '3px 10px', fontSize: '11px', fontWeight: 600 }}
    >
      <span className="relative inline-flex h-2 w-2 shrink-0">
        {isPulsing && (
          <span className={`absolute inset-0 rounded-full opacity-75 ${style.icon.replace('text-', 'bg-')} status-pulse`} />
        )}
        <Icon size={12} className={style.icon} />
      </span>
      {label}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ESTADO BADGE
   ═══════════════════════════════════════════════════════════════ */
function EstadoBadge({ estado }: { estado: EstadoAlerta }) {
  const style = ESTADO_ALERTA_BADGE[estado] ?? ESTADO_ALERTA_BADGE.PENDIENTE!
  const label = ESTADO_ALERTA_LABELS[estado] || estado
  return (
    <span
      className={`inline-flex items-center gap-0.5 min-w-[88px] justify-center ${style.bg} ${style.text} ring-1 ring-inset ring-black/[0.04]`}
      style={{ borderRadius: '999px', padding: '2px 8px', fontSize: '10px', fontWeight: 600 }}
    >
      <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
        {style.pulse && (
          <span className={`absolute inset-0 rounded-full opacity-75 ${style.pulseColor ?? style.dot} status-pulse`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${style.dot}`} />
      </span>
      {label}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════
   FECHA VENCIMIENTO
   ═══════════════════════════════════════════════════════════════ */
function VencimientoCell({ fecha }: { fecha: string | null }) {
  if (!fecha) {
    return <span className="text-xs text-ink-light">—</span>
  }
  const d = new Date(fecha)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const isExpired = diffDays < 0
  const isSoon = diffDays >= 0 && diffDays <= 3

  let colorClass = 'text-ink-muted'
  if (isExpired) colorClass = 'text-rose-600 font-semibold'
  else if (isSoon) colorClass = 'text-amber-600 font-semibold'

  return (
    <div className="space-y-0.5">
      <p className={`text-xs tabular-nums ${colorClass}`}>
        {formatDate(fecha)}
      </p>
      {isExpired && (
        <p className="text-[10px] font-semibold text-rose-600">
          Vencida hace {Math.abs(diffDays)} día{Math.abs(diffDays) === 1 ? '' : 's'}
        </p>
      )}
      {isSoon && (
        <p className="text-[10px] font-semibold text-amber-600">
          Vence en {diffDays} día{diffDays === 1 ? '' : 's'}
        </p>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   FILA DE ALERTA
   ═══════════════════════════════════════════════════════════════ */
function AlertaRow({
  alerta, acting, onView, onMarcarLeida, onAtender, onProyectoClick, onConvenioClick, colWidths,
}: {
  alerta: Alerta
  acting: boolean
  onView: () => void
  onMarcarLeida: () => void
  onAtender: () => void
  onProyectoClick: () => void
  onConvenioClick: () => void
  colWidths: Record<string, number>
}) {
  const canMarcarLeida = alerta.estado === 'PENDIENTE'
  const canAtender = alerta.estado === 'PENDIENTE' || alerta.estado === 'LEIDA'

  const mensajeTruncado = (alerta.mensaje || '').length > 90

  return (
    <tr className="group transition-colors duration-150 hover:bg-[#F0FDF4]">
      <td
        className="px-4 py-3.5 align-middle border-b border-line/60 group-hover:border-emerald-200/60 transition-colors"
        style={{ maxWidth: colWidths.prioridad }}
      >
        <PrioridadBadge prioridad={alerta.prioridad} />
      </td>

      <td
        className="px-4 py-3.5 align-middle border-b border-line/60 group-hover:border-emerald-200/60 transition-colors"
        style={{ maxWidth: colWidths.mensaje }}
      >
        <div className="min-w-0 space-y-0.5">
          <Tooltip content={alerta.mensaje} disabled={!mensajeTruncado}>
            <p className="text-[13.5px] font-semibold text-ink truncate">
              {alerta.mensaje}
            </p>
          </Tooltip>
          {alerta.detalle && (
            <p className="text-[11.5px] text-ink-muted line-clamp-1">
              {alerta.detalle}
            </p>
          )}
        </div>
      </td>

      <td
        className="px-4 py-3.5 align-middle border-b border-line/60 group-hover:border-emerald-200/60 transition-colors"
        style={{ maxWidth: colWidths.relacionado }}
      >
        <div className="flex flex-col gap-1">
          {alerta.proyecto_codigo && (
            <button
              type="button"
              onClick={onProyectoClick}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10.5px] font-mono font-medium text-[#16A34A] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors w-fit"
              style={{ borderRadius: '3px' }}
              title="Ver proyecto"
            >
              <Hash size={10} />
              {alerta.proyecto_codigo}
            </button>
          )}
          {alerta.convenio_codigo && (
            <button
              type="button"
              onClick={onConvenioClick}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10.5px] font-mono font-medium text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors w-fit"
              style={{ borderRadius: '3px' }}
              title="Ver convenio"
            >
              <Building2 size={10} />
              {alerta.convenio_codigo}
            </button>
          )}
          {!alerta.proyecto_codigo && !alerta.convenio_codigo && (
            <span className="text-xs text-ink-light">—</span>
          )}
        </div>
      </td>

      <td className="px-4 py-3.5 align-middle border-b border-line/60 group-hover:border-emerald-200/60 transition-colors">
        <EstadoBadge estado={alerta.estado} />
      </td>

      <td className="px-4 py-3.5 align-middle border-b border-line/60 group-hover:border-emerald-200/60 transition-colors">
        <p className="text-xs text-ink tabular-nums">{formatDate(alerta.creado_en)}</p>
        <p className="text-[10px] text-ink-muted">{formatRelative(alerta.creado_en)}</p>
      </td>

      <td className="px-4 py-3.5 align-middle border-b border-line/60 group-hover:border-emerald-200/60 transition-colors">
        <VencimientoCell fecha={alerta.fecha_vencimiento} />
      </td>

      <td className="px-4 py-3.5 align-middle border-b border-line/60 group-hover:border-emerald-200/60 transition-colors">
        <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
          <ActionIconButton
            icon={<Eye size={14} />}
            color="blue"
            tooltip="Ver detalle"
            enabled
            onClick={onView}
          />
          {canMarcarLeida && (
            <ActionIconButton
              icon={<Check size={14} />}
              color="slate"
              tooltip={acting ? 'Procesando...' : 'Marcar leída'}
              enabled={!acting}
              onClick={onMarcarLeida}
            />
          )}
          {canAtender && (
            <ActionIconButton
              icon={<CheckCheck size={14} />}
              color="emerald"
              tooltip={acting ? 'Procesando...' : 'Atender'}
              enabled={!acting}
              onClick={onAtender}
            />
          )}
        </div>
      </td>
    </tr>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ACTION ICON BUTTON
   ═══════════════════════════════════════════════════════════════ */
function ActionIconButton({
  icon, color, tooltip, onClick, enabled = true,
}: {
  icon: React.ReactNode
  color: 'emerald' | 'rose' | 'blue' | 'slate'
  tooltip: string
  onClick: () => void
  enabled?: boolean
}) {
  const colorCls = {
    emerald: 'text-emerald-600 hover:bg-emerald-50',
    rose:    'text-rose-600 hover:bg-rose-50',
    blue:    'text-blue-600 hover:bg-blue-50',
    slate:   'text-slate-600 hover:bg-slate-100',
  }[color]
  return (
    <button
      type="button"
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      title={tooltip}
      className={`h-8 w-8 inline-flex items-center justify-center rounded-none transition-colors ${enabled ? `${colorCls} cursor-pointer` : 'text-ink-light cursor-not-allowed opacity-40'}`}
    >
      {icon}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════ */
function EmptyAlertas({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-bg-soft flex items-center justify-center mb-4">
        <Bell size={24} className="text-ink-light" />
      </div>
      <h3 className="text-sm font-semibold text-ink">
        {hasFilters ? 'No hay resultados' : 'No tienes alertas pendientes'}
      </h3>
      <p className="mt-1 text-sm text-ink-muted max-w-sm">
        {hasFilters
          ? 'Intenta ajustar los filtros para encontrar lo que buscas.'
          : 'Aquí aparecerán las alertas sobre proyectos, convenios y actividades.'}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-btn border border-ink bg-white text-ink hover:bg-bg-soft transition-colors"
        >
          <X size={14} />
          Limpiar filtros
        </button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MODAL DETALLE DE ALERTA
   ═══════════════════════════════════════════════════════════════ */
function AlertaDetalleModal({
  alerta, onClose, onMarcarLeida, onAtender, onProyectoClick, onConvenioClick,
}: {
  alerta: Alerta
  onClose: () => void
  onMarcarLeida: () => void
  onAtender: () => void
  onProyectoClick: () => void
  onConvenioClick: () => void
}) {
  const canMarcarLeida = alerta.estado === 'PENDIENTE'
  const canAtender = alerta.estado === 'PENDIENTE' || alerta.estado === 'LEIDA'

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="bg-white flex flex-col"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          margin: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bell size={18} className="text-[#16A34A]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Detalle de alerta</h2>
              <p className="text-sm text-gray-500 mt-0.5 inline-flex items-center gap-1">
                <Calendar size={12} /> {formatDateTime(alerta.creado_en)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-none text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <PrioridadBadge prioridad={alerta.prioridad} />
            <EstadoBadge estado={alerta.estado} />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Mensaje</p>
            <p className="text-sm font-semibold text-ink mt-1 leading-relaxed">{alerta.mensaje}</p>
          </div>

          {alerta.detalle && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Detalle</p>
              <p className="text-sm text-ink mt-1 leading-relaxed whitespace-pre-line">{alerta.detalle}</p>
            </div>
          )}

          {(alerta.proyecto_codigo || alerta.convenio_codigo) && (
            <div className="bg-bg-soft/50 border border-[#E5E7EB] p-3" style={{ borderRadius: '4px' }}>
              {alerta.proyecto_codigo && (
                <button
                  type="button"
                  onClick={onProyectoClick}
                  className="flex items-center gap-2 text-xs text-ink hover:text-[#16A34A] transition-colors"
                >
                  <span className="text-ink-muted">Proyecto:</span>
                  <span className="font-mono font-semibold inline-flex items-center gap-1">
                    <Hash size={11} /> {alerta.proyecto_codigo}
                  </span>
                  <ArrowUpRight size={12} className="text-ink-muted" />
                </button>
              )}
              {alerta.convenio_codigo && (
                <button
                  type="button"
                  onClick={onConvenioClick}
                  className="flex items-center gap-2 text-xs text-ink hover:text-[#1E3A8A] transition-colors mt-1"
                >
                  <span className="text-ink-muted">Convenio:</span>
                  <span className="font-mono font-semibold inline-flex items-center gap-1">
                    <Building2 size={11} /> {alerta.convenio_codigo}
                  </span>
                  <ArrowUpRight size={12} className="text-ink-muted" />
                </button>
              )}
            </div>
          )}

          {alerta.fecha_vencimiento && (
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <Calendar size={12} />
              <span>Vence: {formatDateTime(alerta.fecha_vencimiento)}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2 flex-shrink-0 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-ink bg-white border border-ink hover:bg-gray-50 transition-colors"
            style={{ borderRadius: '4px' }}
          >
            Cerrar
          </button>
          {canMarcarLeida && (
            <button
              type="button"
              onClick={onMarcarLeida}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-ink bg-white border border-ink hover:bg-bg-soft transition-colors"
              style={{ borderRadius: '4px' }}
            >
              <Check size={14} /> Marcar leída
            </button>
          )}
          {canAtender && (
            <button
              type="button"
              onClick={onAtender}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] transition-colors"
              style={{ borderRadius: '4px' }}
            >
              <CheckCheck size={14} /> Atender
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
