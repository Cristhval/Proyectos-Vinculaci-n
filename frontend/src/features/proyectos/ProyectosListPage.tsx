import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, X, FolderKanban, Filter, RotateCcw, ChevronLeft, ChevronRight,
  ChevronDown, Hash, ClipboardList, CheckCircle2, Hourglass,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { proyectosApi } from '@/api/proyectos'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ActionIcon from '@/components/ui/ActionIcon'
import StatusBadge from '@/components/ui/StatusBadge'
import Tooltip from '@/components/ui/Tooltip'
import { TIPO_PROYECTO_LABELS, TIPO_PROYECTO_COLORS } from '@/lib/constants'
import { formatDate } from '@/lib/formatters'
import type { Proyecto } from '@/types/proyectos'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'EN_REVISION', label: 'En revisión' },
  { value: 'APROBADO', label: 'Aprobado' },
  { value: 'EN_EJECUCION', label: 'En ejecución' },
  { value: 'EN_SUSPENSION', label: 'Suspendido' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'CERRADO', label: 'Cerrado' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

const TIPOS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'VINCULACION', label: 'Vinculación' },
  { value: 'INVESTIGACION', label: 'Investigación' },
  { value: 'EXTENSION', label: 'Extensión' },
  { value: 'MIXTO', label: 'Mixto' },
]

interface Stats {
  total: number
  enEjecucion: number
  enRevision: number
  finalizados: number
  suspendidos: number
}

export default function ProyectosListPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { isAdmin, isDocenteOrAbove } = usePermissions()
  const rol = user?.rol || 'ESTUDIANTE'

  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [estado, setEstado] = useState('')
  const [tipo, setTipo] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [stats, setStats] = useState<Stats>({ total: 0, enEjecucion: 0, enRevision: 0, finalizados: 0, suspendidos: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  const [colWidths, setColWidths] = useState<Record<string, number>>({
    codigo: 110,
    titulo: 260,
    tipo: 130,
    estado: 140,
    responsable: 240,
  })
  const [resizing, setResizing] = useState(false)
  const activeCol = useRef<string | null>(null)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const canCreate = isAdmin() || (isDocenteOrAbove() && rol !== 'COORDINADOR')

  const subtitle =
    rol === 'ADMIN' || rol === 'COORDINADOR'
      ? 'Gestión de todos los proyectos de vinculación del sistema.'
      : rol === 'DOCENTE'
        ? 'Mis proyectos de vinculación.'
        : 'Proyectos en los que participo.'

  const basePath = `/${rol.toLowerCase()}/proyectos`

  const hasActiveFilters = !!search || !!estado || !!tipo

  const handleResizeStart = useCallback((colKey: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    activeCol.current = colKey
    startX.current = e.clientX
    startWidth.current = colWidths[colKey] ?? 0
    setResizing(true)

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX.current
      const newWidth = Math.max(60, Math.min(600, startWidth.current + diff))
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

  const Resizer = ({ colKey }: { colKey: string }) => (
    <div
      onMouseDown={handleResizeStart(colKey)}
      className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize transition-opacity ${resizing ? 'opacity-100 bg-emerald-600' : 'opacity-0 group-hover:opacity-100 bg-black/20 hover:bg-emerald-600'}`}
    />
  )

  const fetchProyectos = useCallback(async (p: number, s: string, e: string, t: string, size: number) => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(p), page_size: String(size), ordering: '-creado_en' }
      if (s) params.search = s
      if (e) params.estado = e
      if (t) params.tipo = t
      const { data } = await proyectosApi.list(params)
      setProyectos(data.results)
      setTotal(data.count)
    } catch {
      toast.error('Error al cargar proyectos')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const count = async (params: Record<string, string>) => {
        const { data } = await proyectosApi.list({ ...params, page_size: '1' })
        return data.count
      }
      const [total, enEjecucion, enRevision, finalizados, cerrados, suspendidos] = await Promise.all([
        count({}),
        count({ estado: 'EN_EJECUCION' }),
        count({ estado: 'EN_REVISION' }),
        count({ estado: 'FINALIZADO' }),
        count({ estado: 'CERRADO' }),
        count({ estado: 'EN_SUSPENSION' }),
      ])
      setStats({ total, enEjecucion, enRevision, finalizados: finalizados + cerrados, suspendidos })
    } catch {
      /* silencioso */
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => { fetchProyectos(page, search, estado, tipo, pageSize) }, [page, search, estado, tipo, pageSize, fetchProyectos])
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
      await proyectosApi.delete(deleteId)
      toast.success('Proyecto eliminado correctamente')
      if (proyectos.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        fetchProyectos(page, search, estado, tipo, pageSize)
        loadStats()
      }
    } catch {
      toast.error('No se pudo eliminar el proyecto')
    } finally {
      setDeleteId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="space-y-6">
      {/* ═══════════════ HEADER ═══════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-[26px] font-bold text-ink tracking-tightest leading-tight">
            {rol === 'ADMIN' || rol === 'COORDINADOR' ? 'Proyectos' : 'Mis proyectos'}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total proyectos" value={stats.total} icon={FolderKanban} accent="indigo" loading={statsLoading} />
        <StatCard label="En ejecución" value={stats.enEjecucion} icon={ClipboardList} accent="blue" loading={statsLoading} />
        <StatCard label="En revisión" value={stats.enRevision} icon={Hourglass} accent="amber" loading={statsLoading} />
        <StatCard label="Finalizados" value={stats.finalizados} icon={CheckCircle2} accent="slate" loading={statsLoading} />
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
                  placeholder="Título o código..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full h-9 pl-9 pr-3 border border-line rounded-btn bg-white text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
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
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-line">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-semibold text-ink">Listado de proyectos</h3>
            {!loading && (
              <span className="text-xs text-ink-muted">{from}–{to} de {total}</span>
            )}
          </div>
          {canCreate && (
            <button
              onClick={() => navigate(`${basePath}/nuevo`)}
              className="inline-flex items-center justify-center gap-2 h-8 px-3.5 text-[13px] font-semibold rounded-none bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 btn-glow transition-all"
            >
              <Plus size={14} strokeWidth={2.5} />
              Nuevo proyecto
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-xs text-ink-muted">Cargando proyectos...</p>
            </div>
          </div>
        ) : proyectos.length === 0 ? (
          <EmptyProyectos hasFilters={hasActiveFilters} onClear={handleClear} canCreate={canCreate} onCreate={() => navigate(`${basePath}/nuevo`)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-soft/60 border-b border-line">
                  <Th resizable colWidth={colWidths.codigo}>
                    <Resizer colKey="codigo" />
                    Código
                  </Th>
                  <Th resizable colWidth={colWidths.titulo}>
                    <Resizer colKey="titulo" />
                    Título
                  </Th>
                  <Th resizable colWidth={colWidths.tipo}>
                    <Resizer colKey="tipo" />
                    Tipo
                  </Th>
                  <Th resizable colWidth={colWidths.estado}>
                    <Resizer colKey="estado" />
                    Estado
                  </Th>
                  <Th resizable colWidth={colWidths.responsable}>
                    <Resizer colKey="responsable" />
                    Responsable
                  </Th>
                  <Th>Fechas</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {proyectos.map((p) => (
                  <tr
                    key={p.id}
                    className="group hover:bg-emerald-50/40 transition-colors duration-150"
                  >
                    <td className="px-4 py-3.5 align-middle" style={{ maxWidth: colWidths.codigo }}>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium bg-bg-soft text-ink-muted rounded-md border border-line">
                        <Hash size={10} className="text-ink-light" />
                        {p.codigo}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 align-middle" style={{ maxWidth: colWidths.titulo }}>
                      <Tooltip content={p.titulo} maxWidth={400}>
                        <p className="text-[13.5px] font-semibold text-ink truncate">
                          {p.titulo}
                        </p>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-3.5 align-middle" style={{ maxWidth: colWidths.tipo }}>
                      <span className={`text-xs font-semibold ${TIPO_PROYECTO_COLORS[p.tipo] || 'text-gray-700'}`}>
                        {TIPO_PROYECTO_LABELS[p.tipo] || p.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 align-middle" style={{ maxWidth: colWidths.estado }}>
                      <StatusBadge estado={p.estado} />
                    </td>
                    <td className="px-4 py-3.5 align-middle" style={{ maxWidth: colWidths.responsable }}>
                      <p className="text-[13px] font-semibold text-ink truncate">
                        {p.responsable_nombre || '—'}
                      </p>
                      {p.responsable_email && (
                        <p className="text-xs text-ink-muted truncate">{p.responsable_email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1 text-xs items-baseline">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Inicio</span>
                        <span className="font-medium text-ink tabular-nums whitespace-nowrap">{formatDate(p.fecha_inicio)}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Fin</span>
                        <span className="font-medium text-ink tabular-nums whitespace-nowrap">{formatDate(p.fecha_fin_planificada)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                        <ActionIcon
                          icon="ver"
                          enabled={true}
                          onClick={() => navigate(`${basePath}/${p.id}`)}
                          tooltipActivo="Ver proyecto"
                          tooltipDeshabilitado=""
                        />
                        <ActionIcon
                          icon="editar"
                          enabled={isAdmin() || (rol === 'DOCENTE' && p.estado === 'BORRADOR' && p.responsable === user?.id)}
                          onClick={() => navigate(`${basePath}/${p.id}/editar`)}
                          tooltipActivo="Editar proyecto"
                          tooltipDeshabilitado="No se puede editar en este estado"
                        />
                        <ActionIcon
                          icon="eliminar"
                          enabled={isAdmin()}
                          onClick={() => setDeleteId(p.id)}
                          tooltipActivo="Eliminar proyecto"
                          tooltipDeshabilitado="No tienes permiso para eliminar"
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

      {/* MODAL: Eliminar proyecto */}
      <ConfirmModal
        isOpen={deleteId !== null}
        titulo="¿Eliminar este proyecto?"
        mensaje="Se eliminarán también todas las actividades, objetivos, indicadores y demás información asociada a este proyecto. Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTES
   ═══════════════════════════════════════════════════════════════ */

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
      className={`px-4 py-2.5 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-wider align-middle relative group ${resizable ? '' : 'whitespace-nowrap'} ${className}`}
      style={resizable && colWidth ? { width: colWidth, minWidth: colWidth } : undefined}
    >
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
  icon: typeof FolderKanban
  accent: 'indigo' | 'blue' | 'amber' | 'slate'
  loading?: boolean
}) {
  const ACCENTS = {
    indigo: { bg: 'bg-indigo-50',  ring: 'ring-indigo-100',  text: 'text-indigo-600' },
    blue:   { bg: 'bg-blue-50',    ring: 'ring-blue-100',    text: 'text-blue-600' },
    amber:  { bg: 'bg-amber-50',   ring: 'ring-amber-100',   text: 'text-amber-600' },
    slate:  { bg: 'bg-slate-50',   ring: 'ring-slate-200',   text: 'text-slate-600' },
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
      className={`inline-flex items-center justify-center ${iconOnly ? 'w-9 h-9' : 'h-9 px-3'} text-sm font-medium rounded-btn border border-line bg-white text-ink hover:bg-bg-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
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

function EmptyProyectos({
  hasFilters,
  onClear,
  canCreate,
  onCreate,
}: {
  hasFilters: boolean
  onClear: () => void
  canCreate: boolean
  onCreate: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-bg-soft flex items-center justify-center mb-4">
        <FolderKanban size={24} className="text-ink-light" />
      </div>
      <h3 className="text-sm font-semibold text-ink">
        {hasFilters ? 'No hay resultados' : 'Aún no hay proyectos'}
      </h3>
      <p className="mt-1 text-sm text-ink-muted max-w-sm">
        {hasFilters
          ? 'Intenta ajustar los filtros para encontrar lo que buscas.'
          : 'Comienza creando el primer proyecto del sistema.'}
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
            Nuevo proyecto
          </button>
        ) : null}
      </div>
    </div>
  )
}
