import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, X, Handshake, Filter, RotateCcw, ChevronLeft, ChevronRight,
  ChevronDown, Clock, ClipboardCheck, AlertCircle, FileText,
  Eye, Pencil, Trash2, Link2, Building2, ArrowUpRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { conveniosApi } from '@/api/convenios'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import ConfirmModal from '@/components/ui/ConfirmModal'
import Tooltip from '@/components/ui/Tooltip'
import {
  ESTADO_CONVENIO_LABELS, ESTADO_CONVENIO_BADGE,
  TIPO_CONVENIO_LABELS, TIPO_CONVENIO_COLORS,
} from '@/lib/constants'
import { formatDate } from '@/lib/formatters'
import type { Convenio } from '@/types/convenios'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'EN_REVISION', label: 'En revisión' },
  { value: 'VIGENTE', label: 'Vigente' },
  { value: 'VENCIDO', label: 'Vencido' },
  { value: 'SUSPENDIDO', label: 'Suspendido' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

const TIPOS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'MARCO', label: 'Marco' },
  { value: 'ESPECIFICO', label: 'Específico' },
  { value: 'COOPERACION', label: 'Cooperación' },
  { value: 'OTRO', label: 'Otro' },
]

const ROLES_CAN_CREATE: string[] = ['ADMIN', 'COORDINADOR']

interface Stats {
  total: number
  vigentes: number
  porVencer: number
  vencidos: number
}

function getInitials(name: string): string {
  if (!name) return '·'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + (parts[1]?.[0] ?? '')).toUpperCase()
}

function institucionColor(name: string): string {
  const palettes = [
    'from-indigo-500 to-violet-600',
    'from-emerald-500 to-teal-600',
    'from-sky-500 to-blue-600',
    'from-rose-500 to-pink-600',
    'from-slate-600 to-slate-800',
    'from-cyan-500 to-blue-600',
    'from-fuchsia-500 to-purple-600',
    'from-teal-500 to-cyan-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return palettes[hash % palettes.length]!
}

export default function ConveniosListPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { isAdmin, isCoordinadorOrAbove } = usePermissions()
  const rol = user?.rol || 'ESTUDIANTE'

  const basePath = `/${rol.toLowerCase()}/convenios`

  const [convenios, setConvenios] = useState<Convenio[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [estado, setEstado] = useState('')
  const [tipo, setTipo] = useState('')

  const [stats, setStats] = useState<Stats>({ total: 0, vigentes: 0, porVencer: 0, vencidos: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [colWidths, setColWidths] = useState<Record<string, number>>({
    codigo: 160,
    objeto: 320,
    vigencia: 200,
  })
  const [resizing, setResizing] = useState(false)
  const activeCol = useRef<string | null>(null)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const canCreate = ROLES_CAN_CREATE.includes(rol)
  const canEdit = isAdmin() || isCoordinadorOrAbove()
  const canDelete = isAdmin()

  const subtitle =
    rol === 'ADMIN' || rol === 'COORDINADOR'
      ? 'Gestión de todos los convenios de vinculación del sistema.'
      : rol === 'DOCENTE'
        ? 'Convenios vinculados a mi actividad académica.'
        : 'Convenios activos en los que participo.'

  const hasActiveFilters = !!search || !!estado || !!tipo
  const activeFilterChips = [
    search && { key: 'search', label: `“${search}”`, onRemove: () => { setSearch(''); setSearchInput(''); setPage(1) } },
    estado && { key: 'estado', label: ESTADOS.find(e => e.value === estado)?.label || estado, onRemove: () => { setEstado(''); setPage(1) } },
    tipo && { key: 'tipo', label: TIPOS.find(t => t.value === tipo)?.label || tipo, onRemove: () => { setTipo(''); setPage(1) } },
  ].filter(Boolean) as { key: string; label: string; onRemove: () => void }[]

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const count = async (params: Record<string, string>) => {
        const { data } = await conveniosApi.list({ ...params, page_size: '1' })
        return data.count
      }
      const [total, vigentes, suspendidos, finalizados, cancelados, borradores, enRevision] = await Promise.all([
        count({}),
        count({ estado: 'VIGENTE' }),
        count({ estado: 'SUSPENDIDO' }),
        count({ estado: 'FINALIZADO' }),
        count({ estado: 'CANCELADO' }),
        count({ estado: 'BORRADOR' }),
        count({ estado: 'EN_REVISION' }),
      ])

      let porVencer = 0
      let vencidos = 0
      try {
        const now = new Date()
        const { data } = await conveniosApi.list({ estado: 'VIGENTE', page_size: '200' })
        data.results.forEach((c) => {
          if (!c.fecha_fin) return
          const fin = new Date(c.fecha_fin)
          const diffDays = Math.ceil((fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (diffDays < 0) vencidos += 1
          else if (diffDays <= 30) porVencer += 1
        })
      } catch {
        /* silencioso */
      }

      void suspendidos
      void finalizados
      void cancelados
      void borradores
      void enRevision
      setStats({ total, vigentes, porVencer, vencidos })
    } catch {
      /* silencioso */
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const loadConvenios = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        page: String(page),
        page_size: String(pageSize),
      }
      if (search) params.search = search
      if (estado) params.estado = estado
      if (tipo) params.tipo = tipo

      const { data } = await conveniosApi.list(params)
      console.log('[Convenios API Response]:', data)
      setConvenios(data.results)
      setTotal(data.count)
    } catch {
      toast.error('Error al cargar los convenios')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, estado, tipo])

  useEffect(() => { loadConvenios() }, [loadConvenios])
  useEffect(() => { loadStats() }, [loadStats])

  const handleSearch = () => {
    setPage(1)
    setSearch(searchInput.trim())
  }
  const handleClear = () => {
    setSearchInput('')
    setSearch('')
    setEstado('')
    setTipo('')
    setPage(1)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await conveniosApi.delete(deleteId)
      toast.success('Convenio eliminado correctamente')
      if (convenios.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        loadConvenios()
        loadStats()
      }
    } catch {
      toast.error('No se pudo eliminar el convenio')
    } finally {
      setDeleteId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const handleViewConvenio = (id: number) => {
    navigate(`${basePath}/${id}`)
  }

  const handleEditConvenio = (id: number) => {
    navigate(`${basePath}/${id}/editar`)
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
      const newWidth = Math.max(100, Math.min(600, startWidth.current + diff))
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

  return (
    <div className="space-y-6">
      {/* ═══════════════ HEADER ═══════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight leading-tight">
            {rol === 'ADMIN' || rol === 'COORDINADOR' ? 'Convenios' : 'Mis convenios'}
          </h1>
          {!statsLoading && (
            <span className="inline-flex items-center px-2 py-0.5 text-2xs font-semibold rounded-full bg-bg-soft text-ink-muted border border-line">
              {stats.total} en total
            </span>
          )}
        </div>
        <p className="text-sm text-ink-muted max-w-xl">{subtitle}</p>
      </div>

      {/* ═══════════════ STATS ═══════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-t border-b border-slate-200 overflow-hidden [&>*:not(:first-child)]:border-l [&>*:not(:first-child)]:border-slate-200">
        <StatCard label="Total convenios" value={stats.total} icon={Handshake} accent="indigo" loading={statsLoading} />
        <StatCard label="Vigentes" value={stats.vigentes} icon={ClipboardCheck} accent="emerald" loading={statsLoading} />
        <StatCard label="Por vencer (30 días)" value={stats.porVencer} icon={Clock} accent="sky" loading={statsLoading} />
        <StatCard label="Vencidos" value={stats.vencidos} icon={AlertCircle} accent="rose" loading={statsLoading} />
      </div>

      {/* ═══════════════ FILTROS ═══════════════ */}
      <div className="bg-white border border-line rounded-card shadow-xs">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-line">
          <Filter size={14} className="text-ink-muted" />
          <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Filtros</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-2xs font-bold rounded-full bg-emerald-100 text-emerald-700">
              {[search, estado, tipo].filter(Boolean).length} activos
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
                  placeholder="Código, objeto o contraparte..."
                />
              </div>
            </div>
            <div className="w-48">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Estado</label>
              <SelectInput
                value={estado}
                onChange={(v) => { setEstado(v); setPage(1) }}
                options={ESTADOS}
                placeholder="Todos los estados"
              />
            </div>
            <div className="w-48">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Tipo</label>
              <SelectInput
                value={tipo}
                onChange={(v) => { setTipo(v); setPage(1) }}
                options={TIPOS}
                placeholder="Todos los tipos"
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
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-3 border-b border-line">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-semibold text-ink">Listado de convenios</h3>
            {!loading && (
              <span className="text-xs text-ink-muted">
                Mostrando {from}–{to} de {total} {total === 1 ? 'convenio' : 'convenios'}
              </span>
            )}
          </div>
          {canCreate && (
            <button
              onClick={() => navigate(`${basePath}/nuevo`)}
              className="inline-flex items-center justify-center gap-2 h-8 px-3 text-[13px] font-semibold rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 btn-glow transition-all"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span className="hidden sm:inline">Nuevo convenio</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-xs text-ink-muted">Cargando convenios...</p>
            </div>
          </div>
        ) : convenios.length === 0 ? (
          <EmptyConvenios hasFilters={hasActiveFilters} onClear={handleClear} canCreate={canCreate} onCreate={() => navigate(`${basePath}/nuevo`)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-bg-soft/60">
                  <Th resizable colWidth={colWidths.codigo}>
                    <Resizer colKey="codigo" />
                    Código
                  </Th>
                  <Th resizable colWidth={colWidths.objeto}>
                    <Resizer colKey="objeto" />
                    Objeto / Institución
                  </Th>
                  <Th className="w-[130px]">Estado</Th>
                  <Th resizable colWidth={colWidths.vigencia}>
                    <Resizer colKey="vigencia" />
                    Vigencia
                  </Th>
                  <Th className="w-[100px] text-center">Proyectos</Th>
                  <Th className="w-[80px] text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {convenios.map((c) => (
                  <ConvenioRow
                    key={c.id}
                    convenio={c}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onView={() => handleViewConvenio(c.id)}
                    onEdit={() => handleEditConvenio(c.id)}
                    onDelete={() => setDeleteId(c.id)}
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

      <ConfirmModal
        isOpen={deleteId !== null}
        titulo="¿Eliminar este convenio?"
        mensaje="Se eliminará el convenio y toda la información asociada (compromisos, productos y vinculaciones con proyectos). Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}

function Th({
  children,
  className = '',
  resizable,
  colWidth,
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
  accent: 'indigo' | 'sky' | 'emerald' | 'rose'
  loading?: boolean
}) {
  const ACCENTS: Record<string, { bg: string; text: string; hex: string }> = {
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  hex: '#4F46E5' },
    sky:     { bg: 'bg-sky-50',     text: 'text-sky-600',     hex: '#0284C7' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', hex: '#059669' },
    rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    hex: '#E11D48' },
  }
  const a = ACCENTS[accent]!
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

function ConvenioEstadoBadge({ estado }: { estado: string }) {
  const style = ESTADO_CONVENIO_BADGE[estado] ?? ESTADO_CONVENIO_BADGE.BORRADOR!
  const label = ESTADO_CONVENIO_LABELS[estado] || estado
  return (
    <span
      className={`inline-flex items-center gap-1 min-w-[84px] justify-center ${style.bg} ${style.text} ring-1 ring-inset ring-black/[0.04]`}
      style={{ borderRadius: '999px', padding: '3px 6px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.01em' }}
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

function TipoBadge({ tipo }: { tipo: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap ring-1 ring-inset ring-black/[0.04] ${TIPO_CONVENIO_COLORS[tipo] || 'bg-[#E5E7EB] text-[#374151]'}`}
      style={{ fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px' }}
    >
      {TIPO_CONVENIO_LABELS[tipo] || tipo}
    </span>
  )
}

function InstitucionCell({ convenio }: { convenio: Convenio }) {
  if (convenio.institucion) {
    const nombre = convenio.institucion.nombre
    return (
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${institucionColor(nombre)} text-white flex items-center justify-center text-[11px] font-bold shadow-sm ring-2 ring-white shrink-0`}>
          {getInitials(nombre)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-[#6B7280] truncate" title={nombre}>
            {nombre}
          </p>
        </div>
      </div>
    )
  }
  if (convenio.entidad_contraparte) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${institucionColor(convenio.entidad_contraparte)} text-white flex items-center justify-center text-[11px] font-bold shadow-sm ring-2 ring-white shrink-0`}>
          {getInitials(convenio.entidad_contraparte)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-[#6B7280] truncate" title={convenio.entidad_contraparte}>
            {convenio.entidad_contraparte}
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-bg-soft ring-1 ring-line flex items-center justify-center text-ink-light">
        <Building2 size={14} />
      </div>
      <span className="text-xs text-ink-light">Sin contraparte</span>
    </div>
  )
}

function VigenciaCell({ inicio, fin, estado }: { inicio: string | null; fin: string | null; estado: string }) {
  const now = new Date()
  const end = fin ? new Date(fin) : null
  const isExpired = estado === 'VENCIDO' || (end && end.getTime() < now.getTime())

  let diffDays: number | null = null
  if (end) {
    diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  let urgencyColor = 'text-emerald-600'
  if (isExpired || (diffDays !== null && diffDays < 0)) {
    urgencyColor = 'text-rose-600'
  } else if (diffDays !== null && diffDays <= 30) {
    urgencyColor = 'text-amber-600'
  }

  let statusText = ''
  if (diffDays !== null) {
    if (diffDays < 0) {
      statusText = `Vencido hace ${Math.abs(diffDays)} días`
    } else if (diffDays === 0) {
      statusText = 'Vence hoy'
    } else {
      statusText = `${diffDays} días restantes`
    }
  }

  return (
    <div className="min-w-[160px] space-y-1">
      <div className="flex items-center gap-1.5 text-[12px] text-ink-muted">
        <span className="tabular-nums">{formatDate(inicio)}</span>
        <ArrowUpRight size={10} className="text-ink-light shrink-0" />
        <span className={`tabular-nums font-semibold ${isExpired ? 'text-rose-600' : 'text-ink'}`}>
          {formatDate(fin)}
        </span>
      </div>
      {statusText && (
        <p className={`text-[11px] font-semibold ${urgencyColor}`}>
          {statusText}
        </p>
      )}
    </div>
  )
}

function ConvenioRow({
  convenio, canEdit, canDelete, onView, onEdit, onDelete, colWidths,
}: {
  convenio: Convenio
  canEdit: boolean
  canDelete: boolean
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  colWidths: Record<string, number>
}) {
  const objetoTruncado = !!convenio.objeto && convenio.objeto.length > 60
  return (
    <tr className="group transition-colors duration-150 hover:bg-[#F0FDF4]">
      <td
        className="px-4 py-3.5 align-middle border-b border-line/60 group-hover:border-emerald-200/60 transition-colors"
        style={{ maxWidth: colWidths.codigo }}
      >
        <div className="flex flex-col items-start gap-1.5">
          <span
            className="bg-transparent"
            style={{
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              color: '#16A34A',
            }}
          >
            {convenio.codigo}
          </span>
          <TipoBadge tipo={convenio.tipo} />
        </div>
      </td>

      <td
        className="px-4 py-3.5 align-middle border-b border-line/60 group-hover:border-emerald-200/60 transition-colors"
        style={{ maxWidth: colWidths.objeto }}
      >
        <div className="min-w-0">
          {convenio.objeto ? (
            <Tooltip content={convenio.objeto} disabled={!objetoTruncado}>
              <p
                className="text-[14px] text-ink leading-snug truncate"
                style={{ fontWeight: 500, maxWidth: '100%' }}
              >
                {objetoTruncado ? convenio.objeto.slice(0, 60) + '…' : convenio.objeto}
              </p>
            </Tooltip>
          ) : (
            <p
              className="text-[14px] text-ink-light italic leading-snug truncate"
              style={{ fontWeight: 400, maxWidth: '100%' }}
            >
              Sin objeto definido
            </p>
          )}
          <div className="mt-1">
            <InstitucionCell convenio={convenio} />
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5 align-middle border-b border-line/60 group-hover:border-emerald-200/60 transition-colors">
        <ConvenioEstadoBadge estado={convenio.estado} />
      </td>

      <td
        className="px-4 py-3.5 align-middle border-b border-line/60 group-hover:border-emerald-200/60 transition-colors"
        style={{ maxWidth: colWidths.vigencia }}
      >
        <VigenciaCell inicio={convenio.fecha_inicio} fin={convenio.fecha_fin} estado={convenio.estado} />
      </td>

      <td className="px-4 py-3.5 align-middle text-center border-b border-line/60 group-hover:border-emerald-200/60 transition-colors">
        <div className="inline-flex flex-col items-center gap-0.5">
          <span className="inline-flex items-center justify-center gap-1 min-w-[34px] h-7 px-2.5 text-xs font-bold rounded-lg bg-bg-soft text-ink ring-1 ring-line group-hover:ring-emerald-300 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-all">
            <Link2 size={11} className="text-ink-muted group-hover:text-emerald-600" />
            {convenio.proyectos_vinculados_count ?? 0}
          </span>
          <span className="text-[9px] font-semibold text-ink-muted uppercase tracking-wider">
            Vinc.
          </span>
        </div>
      </td>

      <td className="px-4 py-3.5 align-middle border-b border-line/60 group-hover:border-emerald-200/60 transition-colors">
        <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
          <ActionIconButton
            icon={<Eye size={14} />}
            color="blue"
            tooltip="Ver convenio"
            enabled
            onClick={onView}
          />
          <ActionIconButton
            icon={<Pencil size={14} />}
            color="emerald"
            tooltip={canEdit ? 'Editar convenio' : 'No tienes permiso para editar'}
            enabled={canEdit}
            onClick={onEdit}
          />
          <ActionIconButton
            icon={<Trash2 size={14} />}
            color="rose"
            tooltip={canDelete ? 'Eliminar convenio' : 'Solo el administrador puede eliminar'}
            enabled={canDelete}
            onClick={onDelete}
          />
        </div>
      </td>
    </tr>
  )
}

function ActionIconButton({
  icon, color, tooltip, onClick, enabled = true,
}: {
  icon: React.ReactNode
  color: 'emerald' | 'rose' | 'blue'
  tooltip: string
  onClick: () => void
  enabled?: boolean
}) {
  const colorCls = {
    emerald: 'text-emerald-600 hover:bg-emerald-600 hover:text-white',
    rose:    'text-rose-600 hover:bg-rose-600 hover:text-white',
    blue:    'text-blue-600 hover:bg-blue-600 hover:text-white',
  }[color]
  return (
    <button
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      title={tooltip}
      className={`h-8 w-8 inline-flex items-center justify-center rounded-none transition-colors ${enabled ? `${colorCls} cursor-pointer` : 'text-ink-light cursor-not-allowed opacity-40'}`}
    >
      {icon}
    </button>
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

function EmptyConvenios({
  hasFilters, onClear, canCreate, onCreate,
}: {
  hasFilters: boolean
  onClear: () => void
  canCreate: boolean
  onCreate: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-bg-soft flex items-center justify-center mb-4">
        <FileText size={24} className="text-ink-light" />
      </div>
      <h3 className="text-sm font-semibold text-ink">
        {hasFilters ? 'No hay resultados' : 'No hay convenios registrados'}
      </h3>
      <p className="mt-1 text-sm text-ink-muted max-w-sm">
        {hasFilters
          ? 'Intenta ajustar los filtros para encontrar lo que buscas.'
          : 'Comienza creando el primer convenio del sistema.'}
      </p>
      <div className="mt-5 flex items-center gap-2">
        {hasFilters ? (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-btn border border-line bg-white text-ink hover:bg-bg-soft transition-colors"
          >
            <X size={14} />
            Limpiar filtros
          </button>
        ) : canCreate ? (
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 h-9 px-4 text-sm font-semibold rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            Nuevo convenio
          </button>
        ) : null}
      </div>
    </div>
  )
}
