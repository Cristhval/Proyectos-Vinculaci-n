import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Search, X, Handshake, Filter, RotateCcw, ChevronLeft, ChevronRight,
  ChevronDown, Hash, AlertTriangle, ClipboardCheck, AlertCircle, FileText,
  Clock, Eye, Pencil, Trash2, Link2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { conveniosApi, proyectoConveniosApi } from '@/api/convenios'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import Modal from '@/components/ui/Modal'
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

export default function ConveniosListPage() {
  const user = useAuthStore((s) => s.user)
  const { isAdmin, isCoordinadorOrAbove } = usePermissions()
  const rol = user?.rol || 'ESTUDIANTE'

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

  const [proyectosCount, setProyectosCount] = useState<Record<number, number>>({})
  const [deleteId, setDeleteId] = useState<number | null>(null)

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

  /* ───── Stats (carga global, no afectada por paginación) ───── */
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

  /* ───── Lista paginada ───── */
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
      setConvenios(data.results)
      setTotal(data.count)

      const ids = data.results.map((c) => c.id)
      const countMap: Record<number, number> = {}
      await Promise.all(
        ids.map(async (id) => {
          try {
            const { data: d } = await proyectoConveniosApi.list({ convenio: String(id), page_size: '1' })
            countMap[id] = d.count
          } catch {
            countMap[id] = 0
          }
        }),
      )
      setProyectosCount(countMap)
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

  const handleViewConvenio = (_id: number) => {
    toast('Detalle de convenio disponible próximamente', { icon: 'ℹ️' })
  }

  const handleEditConvenio = (_id: number) => {
    toast('Edición de convenio disponible próximamente', { icon: 'ℹ️' })
  }

  return (
    <div className="space-y-6">
      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[26px] font-bold text-ink tracking-tightest leading-tight">
              {rol === 'ADMIN' || rol === 'COORDINADOR' ? 'Convenios' : 'Convenios'}
            </h1>
            {!statsLoading && (
              <span className="inline-flex items-center px-2 py-0.5 text-2xs font-semibold rounded-full bg-bg-soft text-ink-muted border border-line">
                {stats.total} en total
              </span>
            )}
          </div>
          <p className="text-sm text-ink-muted max-w-xl">{subtitle}</p>
        </div>
        {canCreate && (
          <button
            onClick={() => toast('Formulario de nuevo convenio disponible próximamente', { icon: 'ℹ️' })}
            className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-semibold rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 btn-glow transition-all"
          >
            <Plus size={15} strokeWidth={2.5} />
            Nuevo convenio
          </button>
        )}
      </div>

      {/* ═══════════════ STATS ═══════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total convenios"
          value={stats.total}
          icon={Handshake}
          accent="ink"
          loading={statsLoading}
        />
        <StatCard
          label="Vigentes"
          value={stats.vigentes}
          icon={ClipboardCheck}
          accent="emerald"
          loading={statsLoading}
        />
        <StatCard
          label="Por vencer (30 días)"
          value={stats.porVencer}
          icon={Clock}
          accent="amber"
          loading={statsLoading}
        />
        <StatCard
          label="Vencidos"
          value={stats.vencidos}
          icon={AlertCircle}
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
              {[search, estado, tipo].filter(Boolean).length} activos
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
        </div>
      </div>

      {/* ═══════════════ TABLA ═══════════════ */}
      <div className="bg-white border border-line rounded-card shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-line">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-semibold text-ink">Listado de convenios</h3>
            {!loading && (
              <span className="text-xs text-ink-muted">
                Mostrando {from}–{to} de {total} {total === 1 ? 'convenio' : 'convenios'}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-xs text-ink-muted">Cargando convenios...</p>
            </div>
          </div>
        ) : convenios.length === 0 ? (
          <EmptyConvenios hasFilters={hasActiveFilters} onClear={handleClear} canCreate={canCreate} onCreate={() => toast('Formulario de nuevo convenio disponible próximamente', { icon: 'ℹ️' })} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-soft/60 border-b border-line">
                  <Th>Código</Th>
                  <Th>Objeto</Th>
                  <Th>Contraparte</Th>
                  <Th>Tipo</Th>
                  <Th>Estado</Th>
                  <Th>Inicio</Th>
                  <Th>Vencimiento</Th>
                  <Th className="text-center">Proyectos</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {convenios.map((c) => (
                  <tr
                    key={c.id}
                    className="group hover:bg-emerald-50/40 transition-colors duration-150"
                  >
                    <td className="px-4 py-3.5 align-middle">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium bg-bg-soft text-ink-muted rounded-md border border-line">
                        <Hash size={10} className="text-ink-light" />
                        {c.codigo}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 align-middle max-w-[280px]">
                      <p className="text-[13.5px] font-medium text-ink truncate" title={c.objeto}>
                        {c.objeto || <span className="text-ink-light">—</span>}
                      </p>
                      {c.entidad_contraparte && c.entidad_contraparte !== c.institucion?.nombre && (
                        <p className="text-xs text-ink-muted truncate" title={c.entidad_contraparte}>
                          {c.entidad_contraparte}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      {c.institucion ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] text-ink font-medium truncate max-w-[200px]" title={c.institucion.nombre}>
                            {c.institucion.nombre}
                          </span>
                          {c.institucion.sigla && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded bg-bg-soft text-ink-muted border border-line">
                              {c.institucion.sigla}
                            </span>
                          )}
                        </div>
                      ) : c.entidad_contraparte ? (
                        <span className="text-[13px] text-ink truncate max-w-[200px] block" title={c.entidad_contraparte}>
                          {c.entidad_contraparte}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-light">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-semibold rounded-md whitespace-nowrap ${TIPO_CONVENIO_COLORS[c.tipo] || 'bg-[#E5E7EB] text-[#374151]'}`}>
                        {TIPO_CONVENIO_LABELS[c.tipo] || c.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <ConvenioEstadoBadge estado={c.estado} />
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <span className="text-[13px] text-ink tabular-nums whitespace-nowrap">
                        {formatDate(c.fecha_inicio)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <VencimientoCell fechaFin={c.fecha_fin} />
                    </td>
                    <td className="px-4 py-3.5 align-middle text-center">
                      {proyectosCount[c.id] !== undefined ? (
                        <span className="inline-flex items-center justify-center gap-1 min-w-[28px] h-6 px-2 text-[11px] font-semibold rounded-md bg-bg-soft text-ink-muted border border-line">
                          <Link2 size={10} className="text-ink-light" />
                          {proyectosCount[c.id]}
                        </span>
                      ) : (
                        <div className="w-6 h-4 bg-bg-soft rounded animate-pulse mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                        <ActionIconButton
                          icon={<Eye size={14} />}
                          color="blue"
                          tooltip="Ver convenio"
                          enabled
                          onClick={() => handleViewConvenio(c.id)}
                        />
                        <ActionIconButton
                          icon={<Pencil size={14} />}
                          color="emerald"
                          tooltip={canEdit ? 'Editar convenio' : 'No tienes permiso para editar'}
                          enabled={canEdit}
                          onClick={() => handleEditConvenio(c.id)}
                        />
                        <ActionIconButton
                          icon={<Trash2 size={14} />}
                          color="rose"
                          tooltip={canDelete ? 'Eliminar convenio' : 'Solo el administrador puede eliminar'}
                          enabled={canDelete}
                          onClick={() => setDeleteId(c.id)}
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

      {/* ═══════════════ MODAL: ELIMINAR ═══════════════ */}
      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="¿Eliminar este convenio?"
        subtitle="Esta acción no se puede deshacer."
        icon={<AlertTriangle size={20} className="text-rose-600" />}
        size="md"
        footer={
          <>
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 text-sm font-medium rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-semibold rounded-btn text-white bg-rose-600 hover:bg-rose-700 transition-colors"
            >
              Sí, eliminar
            </button>
          </>
        }
      >
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200/70 rounded-lg">
          <AlertTriangle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-rose-700">
            Se eliminará el convenio y toda la información asociada (compromisos, productos y vinculaciones con proyectos).
          </p>
        </div>
      </Modal>
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
  accent: 'ink' | 'emerald' | 'amber' | 'rose'
  loading?: boolean
}) {
  const ACCENTS: Record<string, { border: string; icon: string; ring: string }> = {
    ink:     { border: 'border-l-ink',       icon: 'text-ink',     ring: 'ring-line' },
    emerald: { border: 'border-l-[#16A34A]', icon: 'text-emerald-600', ring: 'ring-emerald-100' },
    amber:   { border: 'border-l-amber-500', icon: 'text-amber-600',   ring: 'ring-amber-100' },
    rose:    { border: 'border-l-rose-500',  icon: 'text-rose-600',    ring: 'ring-rose-100' },
  }
  const a = ACCENTS[accent]!
  return (
    <div className={`group relative bg-white border border-line border-l-[3px] ${a.border} rounded-card p-5 shadow-xs hover:shadow-sm hover:border-line-strong transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-bg-soft ${a.icon} ring-1 ${a.ring} flex items-center justify-center transition-transform group-hover:scale-105`}>
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

function ConvenioEstadoBadge({ estado }: { estado: string }) {
  const style = ESTADO_CONVENIO_BADGE[estado] ?? ESTADO_CONVENIO_BADGE.BORRADOR!
  const label = ESTADO_CONVENIO_LABELS[estado] || estado
  return (
    <span
      className={`inline-flex items-center gap-0.5 min-w-[90px] justify-center ${style.bg} ${style.text}`}
      style={{ borderRadius: '20px', padding: '1px 6px', fontSize: '10px', fontWeight: 600 }}
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

function VencimientoCell({ fechaFin }: { fechaFin: string | null }) {
  if (!fechaFin) {
    return <span className="text-xs text-ink-light">—</span>
  }
  const now = new Date()
  const fin = new Date(fechaFin)
  const diffMs = fin.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <span className="text-[13px] text-rose-600 font-semibold tabular-nums whitespace-nowrap">
          {formatDate(fechaFin)}
        </span>
        <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-rose-50 text-rose-600 ring-1 ring-rose-200/70">
          Vencido
        </span>
      </div>
    )
  }
  if (diffDays <= 30) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <span className="text-[13px] text-amber-700 font-semibold tabular-nums whitespace-nowrap">
          {formatDate(fechaFin)}
        </span>
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-50 text-amber-700 ring-1 ring-amber-200/70">
          <AlertTriangle size={9} strokeWidth={2.5} />
          {diffDays}d
        </span>
      </div>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[13px] text-emerald-700 font-medium tabular-nums whitespace-nowrap">
        {formatDate(fechaFin)}
      </span>
    </span>
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
    emerald: 'text-emerald-600 hover:bg-emerald-50',
    rose:    'text-rose-600 hover:bg-rose-50',
    blue:    'text-blue-600 hover:bg-blue-50',
  }[color]
  return (
    <button
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      title={tooltip}
      className={`h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors ${enabled ? `${colorCls} cursor-pointer` : 'text-ink-light cursor-not-allowed opacity-40'}`}
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
