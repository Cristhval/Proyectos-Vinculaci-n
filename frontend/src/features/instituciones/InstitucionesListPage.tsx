import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Search, X, Building2, Filter, RotateCcw, ChevronLeft, ChevronRight,
  ChevronDown, Mail, Phone, Globe, Hash, AlertTriangle, Pencil, Trash2,
  ExternalLink, CheckCircle2, ShieldOff, ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { institucionesApi } from '@/api/convenios'
import { conveniosApi } from '@/api/convenios'
import { usePermissions } from '@/hooks/usePermissions'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import type { Institucion } from '@/types/convenios'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

interface Stats {
  total: number
  activas: number
  inactivas: number
  conConvenios: number
}

export default function InstitucionesListPage() {
  const { isAdmin } = usePermissions()

  const [instituciones, setInstituciones] = useState<Institucion[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterActiva, setFilterActiva] = useState('')

  const [stats, setStats] = useState<Stats>({ total: 0, activas: 0, inactivas: 0, conConvenios: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [editInst, setEditInst] = useState<Institucion | null>(null)
  const [deleteInst, setDeleteInst] = useState<Institucion | null>(null)
  const [deleteInfo, setDeleteInfo] = useState<{ hasConvenios: boolean; loading: boolean } | null>(null)

  /* ───── Stats (carga global, no afectada por paginación) ───── */
  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const count = async (params: Record<string, string>) => {
        const { data } = await institucionesApi.list({ ...params, page_size: '1' })
        return data.count
      }
      const [total, activas, inactivas] = await Promise.all([
        count({}),
        count({ activa: 'true' }),
        count({ activa: 'false' }),
      ])

      let conConvenios = 0
      try {
        const { data } = await conveniosApi.list({ page_size: '1' })
        conConvenios = data.count
      } catch {
        conConvenios = 0
      }

      setStats({ total, activas, inactivas, conConvenios })
    } catch {
      /* silencioso */
    } finally {
      setStatsLoading(false)
    }
  }, [])

  /* ───── Lista paginada ───── */
  const loadInstituciones = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        page: String(page),
        page_size: String(pageSize),
      }
      if (search) params.search = search
      if (filterActiva) params.activa = filterActiva === 'ACTIVA' ? 'true' : 'false'

      const { data } = await institucionesApi.list(params)
      setInstituciones(data.results)
      setTotal(data.count)
    } catch {
      toast.error('Error al cargar las instituciones')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, filterActiva])

  useEffect(() => { loadInstituciones() }, [loadInstituciones])
  useEffect(() => { loadStats() }, [loadStats, page, pageSize, search, filterActiva])

  const handleSearch = () => {
    setPage(1)
    setSearch(searchInput.trim())
  }
  const handleClear = () => {
    setSearchInput('')
    setSearch('')
    setFilterActiva('')
    setPage(1)
  }

  const hasActiveFilters = !!search || !!filterActiva

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const handleDeleteClick = async (inst: Institucion) => {
    setDeleteInst(inst)
    setDeleteInfo({ hasConvenios: false, loading: true })
    try {
      const { data } = await conveniosApi.list({ institucion: String(inst.id), page_size: '1' })
      const hasConvenios = data.count > 0
      setDeleteInfo({ hasConvenios, loading: false })
    } catch {
      setDeleteInfo({ hasConvenios: false, loading: false })
    }
  }

  const handleDelete = async () => {
    if (!deleteInst) return
    try {
      await institucionesApi.delete(deleteInst.id)
      toast.success('Institución eliminada')
      setDeleteInst(null)
      setDeleteInfo(null)
      loadInstituciones()
      loadStats()
    } catch {
      toast.error('No se pudo eliminar la institución')
    }
  }

  if (!isAdmin()) {
    return (
      <div className="bg-white border border-line rounded-card p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-bg-soft mx-auto flex items-center justify-center mb-4">
          <ShieldOff size={28} className="text-ink-light" />
        </div>
        <p className="text-base font-semibold text-ink">Acceso restringido</p>
        <p className="text-sm text-ink-muted mt-1 max-w-sm mx-auto">
          Solo los administradores pueden gestionar instituciones.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ═══════════════ HEADER ═══════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-[26px] font-bold text-ink tracking-tightest leading-tight">
            Instituciones
          </h1>
          {!statsLoading && (
            <span className="inline-flex items-center px-2 py-0.5 text-2xs font-semibold rounded-full bg-bg-soft text-ink-muted border border-line">
              {stats.total} en total
            </span>
          )}
        </div>
        <p className="text-sm text-ink-muted max-w-xl">
          Gestión de las instituciones contraparte y entidades externas para convenios de vinculación.
        </p>
      </div>

      {/* ═══════════════ STATS ═══════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total instituciones"
          value={stats.total}
          icon={Building2}
          accent="indigo"
          loading={statsLoading}
        />
        <StatCard
          label="Activas"
          value={stats.activas}
          icon={ShieldCheck}
          accent="emerald"
          loading={statsLoading}
        />
        <StatCard
          label="Inactivas"
          value={stats.inactivas}
          icon={ShieldOff}
          accent="slate"
          loading={statsLoading}
        />
        <StatCard
          label="Con convenios"
          value={stats.conConvenios}
          icon={Hash}
          accent="amber"
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
              {[search, filterActiva].filter(Boolean).length} activos
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
                  placeholder="Nombre, sigla o correo..."
                />
              </div>
            </div>
            <div className="w-44">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Estado</label>
              <SelectInput
                value={filterActiva}
                onChange={(v) => { setFilterActiva(v); setPage(1) }}
                options={[
                  { value: '', label: 'Todos los estados' },
                  { value: 'ACTIVA', label: 'Activas' },
                  { value: 'INACTIVA', label: 'Inactivas' },
                ]}
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
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-line">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-semibold text-ink">Listado de instituciones</h3>
            {!loading && (
              <span className="text-xs text-ink-muted">
                {from}–{to} de {total}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 h-8 px-3.5 text-[13px] font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 btn-glow transition-all"
          >
            <Plus size={14} strokeWidth={2.5} />
            Nueva institución
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-xs text-ink-muted">Cargando instituciones...</p>
            </div>
          </div>
        ) : instituciones.length === 0 ? (
          <EmptyInstituciones hasFilters={hasActiveFilters} onClear={handleClear} onCreate={() => setShowForm(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-soft/60 border-b border-line">
                  <Th>Nombre completo</Th>
                  <Th className="w-[120px] text-center">Sigla</Th>
                  <Th>Contacto</Th>
                  <Th>Sitio web</Th>
                  <Th className="text-center w-[110px]">Estado</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {instituciones.map((inst) => (
                  <tr
                    key={inst.id}
                    className="group hover:bg-emerald-50/40 transition-colors duration-150"
                  >
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <Building2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink text-[13.5px] truncate" title={inst.nombre}>
                            {inst.nombre}
                          </p>
                          {inst.direccion && (
                            <p className="text-xs text-ink-muted truncate" title={inst.direccion}>
                              {inst.direccion}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle text-center" style={{ minWidth: 120 }}>
                      {inst.sigla ? (
                        <span
                          className={`sigla-badge inline-block font-semibold whitespace-nowrap ${inst.sigla.length > 8 ? 'sigla-badge--long' : ''}`}
                          title={inst.sigla}
                        >
                          {inst.sigla}
                        </span>
                      ) : (
                        <span className="sigla-badge sigla-badge--empty inline-block font-semibold whitespace-nowrap">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="space-y-1 min-w-0">
                        {inst.email ? (
                          <div className="flex items-center gap-1.5 text-[13px] text-ink min-w-0">
                            <Mail size={12} className="text-ink-light flex-shrink-0" />
                            <span className="truncate max-w-[200px]" title={inst.email}>
                              {inst.email}
                            </span>
                          </div>
                        ) : null}
                        {inst.telefono ? (
                          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                            <Phone size={12} className="text-ink-light flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{inst.telefono}</span>
                          </div>
                        ) : null}
                        {!inst.email && !inst.telefono && (
                          <span className="text-xs text-ink-light">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      {inst.sitio_web ? (
                        <a
                          href={normalizeUrl(inst.sitio_web)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[13px] text-blue-900 hover:text-blue-700 hover:underline transition-colors"
                        >
                          <Globe size={12} />
                          <span className="truncate max-w-[180px]">{cleanUrl(inst.sitio_web)}</span>
                          <ExternalLink size={10} className="text-ink-light flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-xs text-ink-light">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-middle text-center">
                      <StatusPill activa={inst.activa} />
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                        <ActionIconButton
                          icon={<Pencil size={14} />}
                          color="emerald"
                          tooltip="Editar institución"
                          onClick={() => setEditInst(inst)}
                        />
                        <ActionIconButton
                          icon={<Trash2 size={14} />}
                          color="rose"
                          tooltip="Eliminar institución"
                          onClick={() => handleDeleteClick(inst)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* ═══════════════ MODALES ═══════════════ */}
      <InstitucionFormModal
        open={showForm}
        institucion={null}
        onClose={() => setShowForm(false)}
        onSaved={() => { loadInstituciones(); loadStats() }}
      />
      <InstitucionFormModal
        open={editInst !== null}
        institucion={editInst}
        onClose={() => setEditInst(null)}
        onSaved={() => { loadInstituciones(); loadStats() }}
      />
      <DeleteInstitucionModal
        institucion={deleteInst}
        info={deleteInfo}
        onClose={() => { setDeleteInst(null); setDeleteInfo(null) }}
        onDelete={handleDelete}
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTES
   ═══════════════════════════════════════════════════════════════ */

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-2.5 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap ${className}`}>
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
  accent: 'indigo' | 'emerald' | 'slate' | 'amber'
  loading?: boolean
}) {
  const ACCENTS = {
    indigo:  { bg: 'bg-indigo-50',  ring: 'ring-indigo-100',  text: 'text-indigo-600' },
    emerald: { bg: 'bg-emerald-50', ring: 'ring-emerald-100', text: 'text-emerald-600' },
    slate:   { bg: 'bg-slate-50',   ring: 'ring-slate-200',   text: 'text-slate-600' },
    amber:   { bg: 'bg-amber-50',   ring: 'ring-amber-100',   text: 'text-amber-600' },
  } as const
  const a = ACCENTS[accent]
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

function StatusPill({ activa }: { activa: boolean }) {
  if (activa) {
    return (
      <span className="inline-flex items-center justify-center gap-1 h-[22px] px-2.5 text-[11px] font-medium rounded-full ring-1 whitespace-nowrap bg-emerald-50 text-emerald-700 ring-emerald-200/70">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
        Activa
      </span>
    )
  }
  return (
    <span className="inline-flex items-center justify-center gap-1 h-[22px] px-2.5 text-[11px] font-medium rounded-full ring-1 whitespace-nowrap bg-bg-soft text-ink-muted ring-line">
      <X size={10} strokeWidth={2.5} className="shrink-0" />
      Inactiva
    </span>
  )
}

function ActionIconButton({
  icon, color, tooltip, onClick,
}: {
  icon: React.ReactNode
  color: 'emerald' | 'rose'
  tooltip: string
  onClick: () => void
}) {
  const colorCls = {
    emerald: 'text-emerald-600 hover:bg-emerald-50',
    rose:    'text-rose-600 hover:bg-rose-50',
  }[color]
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors ${colorCls}`}
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

function EmptyInstituciones({
  hasFilters, onClear, onCreate,
}: {
  hasFilters: boolean
  onClear: () => void
  onCreate: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-bg-soft flex items-center justify-center mb-4">
        <Building2 size={24} className="text-ink-light" />
      </div>
      <h3 className="text-sm font-semibold text-ink">
        {hasFilters ? 'No hay resultados' : 'Aún no hay instituciones'}
      </h3>
      <p className="mt-1 text-sm text-ink-muted max-w-sm">
        {hasFilters
          ? 'Intenta ajustar los filtros para encontrar lo que buscas.'
          : 'Comienza registrando la primera institución contraparte.'}
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
        ) : (
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 h-9 px-4 text-sm font-semibold rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            Nueva institución
          </button>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MODAL: CREAR / EDITAR INSTITUCIÓN
   ───────────────────────────────────────────── */
function InstitucionFormModal({
  open, institucion, onClose, onSaved,
}: {
  open: boolean
  institucion: Institucion | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = institucion !== null
  const [form, setForm] = useState({
    nombre: '', sigla: '', descripcion: '', direccion: '',
    telefono: '', email: '', sitio_web: '', activa: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (open) {
      if (institucion) {
        setForm({
          nombre: institucion.nombre || '',
          sigla: institucion.sigla || '',
          descripcion: institucion.descripcion || '',
          direccion: institucion.direccion || '',
          telefono: institucion.telefono || '',
          email: institucion.email || '',
          sitio_web: institucion.sitio_web || '',
          activa: institucion.activa,
        })
      } else {
        setForm({
          nombre: '', sigla: '', descripcion: '', direccion: '',
          telefono: '', email: '', sitio_web: '', activa: true,
        })
      }
      setErrors({})
    }
  }, [open, institucion])

  const update = (field: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => { const n = { ...e }; delete n[field]; return n })
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Formato de correo inválido'
    if (form.sitio_web && !/^https?:\/\/.+\..+/.test(form.sitio_web) && !/^[\w-]+(\.[\w-]+)+$/.test(form.sitio_web)) {
      errs.sitio_web = 'URL inválida (ej: https://ejemplo.com)'
    }
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
      const payload: Record<string, unknown> = {
        nombre: form.nombre.trim(),
        sigla: form.sigla.trim(),
        descripcion: form.descripcion.trim(),
        direccion: form.direccion.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        sitio_web: form.sitio_web.trim(),
        activa: form.activa,
      }
      if (isEdit && institucion) {
        await institucionesApi.update(institucion.id, payload)
      } else {
        await institucionesApi.create(payload)
      }
      toast.success('Institución guardada')
      onClose()
      onSaved()
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar institución' : 'Nueva institución'}
      subtitle={isEdit ? institucion?.nombre : 'Registra una nueva institución contraparte.'}
      icon={<Building2 size={20} className="text-emerald-600" />}
      size="xl"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors">
            Cancelar
          </button>
          <button onClick={handleRequestSubmit} disabled={saving} className="px-4 py-2 text-sm font-semibold rounded-btn text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-4">
          <SectionLabel>Información general</SectionLabel>
          <Field label="Nombre *" error={errors.nombre}>
            <input
              value={form.nombre}
              onChange={(e) => update('nombre', e.target.value)}
              className={inputCls(errors.nombre)}
              placeholder="Ej: Universidad Nacional de Loja"
              maxLength={255}
            />
          </Field>
          <Field label="Sigla">
            <input
              value={form.sigla}
              onChange={(e) => update('sigla', e.target.value.toUpperCase().slice(0, 10))}
              className={inputCls()}
              placeholder="Ej: UNL"
              maxLength={10}
            />
            <p className={`text-xs mt-1 ${form.sigla.length >= 10 ? 'text-amber-600' : 'text-ink-light'}`}>
              {form.sigla.length}/10 caracteres
            </p>
          </Field>
          <Field label="Descripción">
            <textarea
              value={form.descripcion}
              onChange={(e) => update('descripcion', e.target.value)}
              className={`${inputCls()} resize-none`}
              placeholder="Descripción breve de la institución..."
              rows={3}
            />
          </Field>
          <Field label="Dirección">
            <input
              value={form.direccion}
              onChange={(e) => update('direccion', e.target.value)}
              className={inputCls()}
              placeholder="Dirección física"
              maxLength={255}
            />
          </Field>
        </div>
        <div className="space-y-4">
          <SectionLabel>Contacto y estado</SectionLabel>
          <Field label="Teléfono">
            <input
              value={form.telefono}
              onChange={(e) => update('telefono', e.target.value)}
              className={inputCls()}
              placeholder="Ej: +593 7 258 1234"
              maxLength={20}
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className={inputCls(errors.email)}
              placeholder="contacto@ejemplo.com"
            />
          </Field>
          <Field label="Sitio web" error={errors.sitio_web}>
            <input
              value={form.sitio_web}
              onChange={(e) => update('sitio_web', e.target.value)}
              className={inputCls(errors.sitio_web)}
              placeholder="https://ejemplo.com"
            />
          </Field>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Estado</label>
            <div className="flex items-center gap-3 px-3 py-2.5 border border-line rounded-btn bg-white">
              <button
                type="button"
                onClick={() => update('activa', !form.activa)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.activa ? 'bg-emerald-600' : 'bg-line-strong'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${form.activa ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm font-medium text-ink">
                {form.activa ? 'Activa' : 'Inactiva'}
              </span>
              {!form.activa && (
                <span className="text-xs text-amber-600 ml-auto">
                  No podrá ser utilizada en nuevos convenios
                </span>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200/70 rounded-lg">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700">
              Las instituciones activas estarán disponibles para asociar a los convenios de vinculación.
            </p>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={showConfirm}
        titulo={isEdit ? '¿Guardar cambios?' : '¿Crear institución?'}
        mensaje={isEdit ? 'Se actualizarán los datos de la institución. ¿Estás seguro?' : 'Se creará una nueva institución en el sistema. ¿Estás seguro?'}
        onConfirm={async () => { setShowConfirm(false); await handleSubmit() }}
        onCancel={() => setShowConfirm(false)}
      />
    </Modal>
  )
}

/* ─────────────────────────────────────────────
   MODAL: ELIMINAR INSTITUCIÓN
   ───────────────────────────────────────────── */
function DeleteInstitucionModal({
  institucion, info, onClose, onDelete,
}: {
  institucion: Institucion | null
  info: { hasConvenios: boolean; loading: boolean } | null
  onClose: () => void
  onDelete: () => Promise<void>
}) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      open={institucion !== null}
      onClose={onClose}
      title="¿Eliminar esta institución?"
      subtitle="Esta acción no se puede deshacer."
      icon={<AlertTriangle size={20} className="text-rose-600" />}
      size="md"
      footer={
        info?.hasConvenios ? (
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors"
          >
            Entendido
          </button>
        ) : (
          <>
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors">
              Cancelar
            </button>
            <button onClick={handleDelete} disabled={deleting || info?.loading} className="px-4 py-2 text-sm font-semibold rounded-btn text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {deleting ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </>
        )
      }
    >
      {institucion && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-bg-soft border border-line rounded-lg">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Building2 size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{institucion.nombre}</p>
              {institucion.sigla && (
                <p className="text-xs text-ink-muted">Sigla: {institucion.sigla}</p>
              )}
            </div>
          </div>

          {info?.loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : info?.hasConvenios ? (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200/70 rounded-lg">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-semibold mb-1">No se puede eliminar</p>
                <p>
                  Esta institución tiene convenios asociados. Primero elimina o reasigna los
                  convenios vinculados para poder continuar.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200/70 rounded-lg">
              <AlertTriangle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700">
                Se eliminará la institución y no podrá ser utilizada en nuevos convenios.
                Esta acción no se puede deshacer.
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
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

function inputCls(error?: string) {
  return `w-full px-3 py-2 border text-sm rounded-btn transition-all focus:outline-none focus:ring-2 ${
    error
      ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-400'
      : 'border-line focus:ring-emerald-500/20 focus:border-emerald-400'
  }`
}

function normalizeUrl(url: string): string {
  if (!url) return '#'
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

function cleanUrl(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}
