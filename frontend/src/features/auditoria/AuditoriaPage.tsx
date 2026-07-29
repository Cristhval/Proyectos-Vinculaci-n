import { useEffect, useState, useCallback } from 'react'
import {
  Search, Filter, RotateCcw, Download, ShieldCheck,
  X, ChevronLeft, ChevronRight, ChevronDown,
  ExternalLink, Users, AlertTriangle, Zap, Info, Activity,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { auditoriaApi } from '@/api/auditoria'
import type { Auditoria, TipoAccion } from '@/types/auditoria'
import type { AuditoriaStats } from '@/api/auditoria'
import { ROL_AVATAR_STYLES, ROL_LABELS } from '@/lib/constants'
import { showSuccess, showError } from '@/components/ui/Toast'
import Tooltip from '@/components/ui/Tooltip'
import Modal from '@/components/ui/Modal'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

const ACCION_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'CREAR', label: 'Crear' },
  { value: 'ACTUALIZAR', label: 'Actualizar' },
  { value: 'ELIMINAR', label: 'Eliminar' },
  { value: 'APROBAR', label: 'Aprobar' },
  { value: 'RECHAZAR', label: 'Rechazar' },
  { value: 'INICIAR_SESION', label: 'Iniciar sesión' },
]

const ENTIDAD_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'Proyecto', label: 'Proyecto' },
  { value: 'Convenio', label: 'Convenio' },
  { value: 'Usuario', label: 'Usuario' },
  { value: 'Actividad', label: 'Actividad' },
  { value: 'Avance', label: 'Avance' },
  { value: 'Informe', label: 'Informe' },
  { value: 'Alerta', label: 'Alerta' },
  { value: 'Institucion', label: 'Institución' },
]

const ENTIDAD_LABELS: Record<string, string> = {
  Proyecto: 'Proyecto',
  Convenio: 'Convenio',
  Usuario: 'Usuario',
  Carrera: 'Carrera',
  Objetivo: 'Objetivo',
  Indicador: 'Indicador',
  Actividad: 'Actividad',
  ParticipanteProyecto: 'Participante',
  Presupuesto: 'Presupuesto',
  Beneficiario: 'Beneficiario',
  AlineacionEstrategica: 'Alineación',
  FirmaResponsabilidad: 'Firma',
  Institucion: 'Institución',
  ProyectoConvenio: 'Proyecto-Convenio',
  Compromiso: 'Compromiso',
  Producto: 'Producto',
  Contribucion: 'Contribución',
  Avance: 'Avance',
  Evidencia: 'Evidencia',
  Informe: 'Informe',
  Revision: 'Revisión',
  FlujoValidacion: 'Flujo de validación',
  Alerta: 'Alerta',
}

interface AccionStyle {
  bg: string
  text: string
  dot: string
  pulse: boolean
  pulseColor?: string
  label: string
}

const ACCION_CONFIG: Record<TipoAccion, AccionStyle> = {
  CREAR:          { label: 'Crear',          bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', dot: 'bg-[#16A34A]', pulse: true,  pulseColor: 'bg-[#16A34A]' },
  ACTUALIZAR:     { label: 'Actualizar',     bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', dot: 'bg-[#2563EB]', pulse: true,  pulseColor: 'bg-[#2563EB]' },
  ELIMINAR:       { label: 'Eliminar',       bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]', dot: 'bg-[#DC2626]', pulse: false },
  APROBAR:        { label: 'Aprobar',        bg: 'bg-[#16A34A]', text: 'text-white',     dot: 'bg-white',     pulse: false },
  RECHAZAR:       { label: 'Rechazar',       bg: 'bg-[#DC2626]', text: 'text-white',     dot: 'bg-white',     pulse: false },
  INICIAR_SESION: { label: 'Iniciar sesión', bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]', dot: 'bg-[#9CA3AF]', pulse: false },
}

const ENTIDAD_BADGE_STYLE: AccionStyle = {
  bg: 'bg-[#F3F4F6]',
  text: 'text-[#6B7280]',
  dot: 'bg-[#9CA3AF]',
  pulse: false,
  label: '',
}

function AccionBadge({ accion }: { accion: TipoAccion }) {
  const cfg = ACCION_CONFIG[accion]
  if (!cfg) return null
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 min-w-[130px] px-2 py-0.5 text-[10px] font-semibold rounded-md whitespace-nowrap',
        cfg.bg,
        cfg.text,
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {cfg.pulse && cfg.pulseColor && (
          <span className={clsx('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', cfg.pulseColor)} />
        )}
        <span className={clsx('relative inline-flex rounded-full h-2 w-2', cfg.pulse ? cfg.pulseColor : cfg.dot)} />
      </span>
      {cfg.label}
    </span>
  )
}

function EntidadBadge({ nombre }: { nombre: string }) {
  const label = ENTIDAD_LABELS[nombre] || nombre
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 min-w-[130px] px-2 py-0.5 text-[10px] font-semibold rounded-md whitespace-nowrap',
        ENTIDAD_BADGE_STYLE.bg,
        ENTIDAD_BADGE_STYLE.text,
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className={clsx('relative inline-flex rounded-full h-2 w-2', ENTIDAD_BADGE_STYLE.dot)} />
      </span>
      {label}
    </span>
  )
}

function generarDetalle(row: Auditoria): string {
  const accionLabel = ACCION_CONFIG[row.accion]?.label || row.accion
  const entidadLabel = ENTIDAD_LABELS[row.entidad] || row.entidad
  if (row.accion === 'INICIAR_SESION') {
    return `${row.usuario_nombre || 'Sistema'} inició sesión en el sistema`
  }
  const idText = row.entidad_id ? ` (ID: ${row.entidad_id})` : ''
  return `Se ${accionLabel.toLowerCase()} el registro de ${entidadLabel}${idText}`
}

function getEntidadLink(row: Auditoria): string | null {
  if (!row.entidad_id) return null
  switch (row.entidad) {
    case 'Proyecto': return `/admin/proyectos/${row.entidad_id}`
    case 'Convenio': return `/admin/convenios/${row.entidad_id}`
    default: return null
  }
}

export default function AuditoriaPage() {
  const navigate = useNavigate()

  const [registros, setRegistros] = useState<Auditoria[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [stats, setStats] = useState<AuditoriaStats>({ total: 0, acciones_24h: 0, usuarios_activos_24h: 0, acciones_criticas: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterAccion, setFilterAccion] = useState('')
  const [filterEntidad, setFilterEntidad] = useState('')
  const [filterUsuario, setFilterUsuario] = useState('')
  const [filterFechaDesde, setFilterFechaDesde] = useState('')
  const [filterFechaHasta, setFilterFechaHasta] = useState('')
  const [registroSeleccionado, setRegistroSeleccionado] = useState<Auditoria | null>(null)

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const { data } = await auditoriaApi.stats()
      setStats(data)
    } catch {
      /* silencioso */
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const loadRegistros = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        page: String(page),
        page_size: String(pageSize),
      }
      if (search) params.search = search
      if (filterAccion) params.accion = filterAccion
      if (filterEntidad) params.entidad = filterEntidad
      if (filterFechaDesde) params.fecha_desde = filterFechaDesde
      if (filterFechaHasta) params.fecha_hasta = filterFechaHasta
      const { data } = await auditoriaApi.list(params)
      let results = data.results
      if (filterUsuario) {
        results = results.filter(r =>
          (r.usuario_nombre || '').toLowerCase().includes(filterUsuario.toLowerCase())
        )
      }
      setRegistros(results)
      setTotal(filterUsuario ? results.length : data.count)
    } catch {
      toast.error('Error al cargar los registros de auditoría')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, filterAccion, filterEntidad, filterUsuario, filterFechaDesde, filterFechaHasta])

  useEffect(() => { loadRegistros() }, [loadRegistros])
  useEffect(() => { loadStats() }, [loadStats])

  const handleFilter = () => {
    setPage(1)
    setSearch(searchInput.trim())
  }

  const handleLimpiar = () => {
    setSearchInput('')
    setSearch('')
    setFilterAccion('')
    setFilterEntidad('')
    setFilterUsuario('')
    setFilterFechaDesde('')
    setFilterFechaHasta('')
    setPage(1)
  }

  const hasActiveFilters = !!search || !!filterAccion || !!filterEntidad || !!filterUsuario || !!filterFechaDesde || !!filterFechaHasta

  const handleExportar = async () => {
    const loadingToast = showSuccess('Exportando Excel...', 'Generando archivo')
    try {
      const params: Record<string, string> = { page_size: '9999' }
      if (search) params.search = search
      if (filterAccion) params.accion = filterAccion
      if (filterEntidad) params.entidad = filterEntidad
      if (filterFechaDesde) params.fecha_desde = filterFechaDesde
      if (filterFechaHasta) params.fecha_hasta = filterFechaHasta
      const { data } = await auditoriaApi.list(params)
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()
      const rows = data.results.map(r => ({
        'Fecha y hora': formatFechaCompleta(r.creado_en),
        'Usuario': r.usuario_nombre || 'Sistema',
        'Rol': r.usuario_rol ? (ROL_LABELS[r.usuario_rol] || r.usuario_rol) : '—',
        'Acción': ACCION_CONFIG[r.accion]?.label || r.accion,
        'Entidad': ENTIDAD_LABELS[r.entidad] || r.entidad,
        'ID Entidad': r.entidad_id || '—',
        'Detalle': generarDetalle(r),
        'IP': r.ip_address || '—',
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = [
        { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
        { wch: 18 }, { wch: 12 }, { wch: 50 }, { wch: 16 },
      ]
      XLSX.utils.book_append_sheet(wb, ws, 'Auditoría')
      const fecha = format(new Date(), 'yyyy-MM-dd')
      XLSX.writeFile(wb, `Auditoria_Vinculacion_${fecha}.xlsx`)
      if (loadingToast) toast.dismiss(String(loadingToast))
      showSuccess('Archivo descargado', `Auditoria_Vinculacion_${fecha}.xlsx`)
    } catch {
      if (loadingToast) toast.dismiss(String(loadingToast))
      showError('Error al exportar', 'No se pudo generar el archivo Excel')
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
          <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight leading-tight">
            Registro de Auditoría
          </h1>
          {!statsLoading && (
            <span className="inline-flex items-center px-2 py-0.5 text-2xs font-semibold rounded-full bg-bg-soft text-ink-muted border border-line">
              {stats.total} en total
            </span>
          )}
        </div>
        <p className="text-sm text-ink-muted max-w-xl">
          Trazabilidad completa de todas las acciones realizadas en el sistema
        </p>
        <div className="mt-4 flex items-start gap-3 px-4 py-3 bg-[#EFF6FF] border-l-[3px] border-[#2563EB] rounded-r-lg">
          <Info size={16} className="text-[#2563EB] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
          <p className="text-sm text-[#1E40AF]">
            Este registro es de solo lectura. Todas las acciones del sistema quedan registradas automáticamente para garantizar la trazabilidad institucional según el RNF-02.
          </p>
        </div>
      </div>

      {/* ═══════════════ ESTADÍSTICAS ═══════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-t border-b border-slate-200 overflow-hidden [&>*:not(:first-child)]:border-l [&>*:not(:first-child)]:border-slate-200">
        <StatCard
          label="Total acciones"
          value={stats.total}
          icon={Activity}
          accent="indigo"
          loading={statsLoading}
        />
        <StatCard
          label="Últimas 24 horas"
          value={stats.acciones_24h}
          icon={Zap}
          accent="emerald"
          loading={statsLoading}
        />
        <StatCard
          label="Usuarios activos"
          value={stats.usuarios_activos_24h}
          icon={Users}
          accent="blue"
          loading={statsLoading}
        />
        <StatCard
          label="Acciones críticas"
          value={stats.acciones_criticas}
          icon={AlertTriangle}
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
              {[search, filterAccion, filterEntidad, filterUsuario, filterFechaDesde, filterFechaHasta].filter(Boolean).length} activos
            </span>
          )}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Buscar</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                  className="w-full h-9 pl-9 pr-3 border border-line rounded-btn bg-white text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  placeholder="Buscar por usuario, entidad o detalle..."
                />
              </div>
            </div>
            <div className="w-full sm:w-40">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Acción</label>
              <SelectInput
                value={filterAccion}
                onChange={(v) => { setFilterAccion(v); setPage(1) }}
                options={ACCION_OPTIONS}
                placeholder="Todas"
              />
            </div>
            <div className="w-full sm:w-40">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Entidad</label>
              <SelectInput
                value={filterEntidad}
                onChange={(v) => { setFilterEntidad(v); setPage(1) }}
                options={ENTIDAD_OPTIONS}
                placeholder="Todas"
              />
            </div>
            <div className="w-full sm:w-44">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Usuario</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light pointer-events-none" />
                <input
                  type="text"
                  value={filterUsuario}
                  onChange={(e) => setFilterUsuario(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 border border-line rounded-btn bg-white text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  placeholder="Nombre del usuario"
                />
              </div>
            </div>
            <div className="w-full sm:w-40">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Fecha desde</label>
              <input
                type="date"
                value={filterFechaDesde}
                onChange={(e) => setFilterFechaDesde(e.target.value)}
                className="w-full h-9 px-3 border border-line rounded-btn bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
              />
            </div>
            <div className="w-full sm:w-40">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Fecha hasta</label>
              <input
                type="date"
                value={filterFechaHasta}
                onChange={(e) => setFilterFechaHasta(e.target.value)}
                className="w-full h-9 px-3 border border-line rounded-btn bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
              />
            </div>
            <button
              onClick={handleFilter}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-semibold rounded-btn bg-ink text-white hover:bg-ink/90 btn-glow transition-all"
            >
              <Search size={14} strokeWidth={2.5} />
              Buscar
            </button>
            <button
              onClick={handleLimpiar}
              disabled={!hasActiveFilters}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium rounded-btn border border-line bg-white text-ink hover:bg-bg-soft disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <RotateCcw size={14} />
              Limpiar
            </button>
            <button
              onClick={handleExportar}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-semibold rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 btn-glow transition-all"
            >
              <Download size={14} strokeWidth={2.5} />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════ TABLA ═══════════════ */}
      <div className="bg-white border border-line rounded-card shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-3 border-b border-line">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-semibold text-ink">Listado de registros</h3>
            {!loading && (
              <span className="text-xs text-ink-muted">
                {from}–{to} de {total}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-xs text-ink-muted">Cargando registros...</p>
            </div>
          </div>
        ) : registros.length === 0 ? (
          <EmptyAuditoria hasFilters={hasActiveFilters} onClear={handleLimpiar} />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm table-fixed min-w-[640px]">
              <thead>
                <tr className="bg-bg-soft/60 border-b border-line">
                  <Th style={{ width: 170 }}>Fecha y hora</Th>
                  <Th style={{ width: 220 }}>Usuario</Th>
                  <Th style={{ width: 140 }}>Acción</Th>
                  <Th style={{ width: 140 }}>Entidad</Th>
                  <Th>Detalle</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {registros.map((row) => {
                  const initials = getInitials(row.usuario_nombre)
                  const rol = row.usuario_rol || ''
                  const detalle = generarDetalle(row)
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setRegistroSeleccionado(row)}
                      className="group hover:bg-emerald-50/40 transition-colors duration-150 cursor-pointer"
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex flex-col gap-0.5 leading-tight">
                          <span className="text-[13px] font-medium text-ink tabular-nums">{formatDatePart(row.creado_en)}</span>
                          <span className="text-[11px] text-ink-muted tabular-nums">{formatTimePart(row.creado_en)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle overflow-hidden">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ring-1 ring-white shadow-sm ${ROL_AVATAR_STYLES[rol] || 'bg-gradient-to-br from-slate-500 to-slate-700 text-white'}`}>
                            {initials}
                          </div>
                          <div className="min-w-0 overflow-hidden">
                            <p className="font-semibold text-ink truncate text-[13px]" title={row.usuario_nombre || 'Sistema'}>
                              {row.usuario_nombre || 'Sistema'}
                            </p>
                            <p className="text-[11px] text-ink-muted truncate">
                              {rol ? (ROL_LABELS[rol] || rol) : '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <AccionBadge accion={row.accion} />
                      </td>
                      <td className="px-4 py-3.5 align-middle overflow-hidden">
                        <EntidadBadge nombre={row.entidad} />
                      </td>
                      <td className="px-4 py-3.5 align-middle overflow-hidden">
                        <Tooltip content={detalle} disabled={detalle.length <= 90} maxWidth={400}>
                          <p className="text-[13px] text-ink-muted block truncate group-hover:text-emerald-700 transition-colors">
                            {detalle.length > 90 ? detalle.substring(0, 87) + '...' : detalle}
                          </p>
                        </Tooltip>
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

      {/* ═══════════════ MODAL DETALLE ═══════════════ */}
      <Modal
        open={!!registroSeleccionado}
        onClose={() => setRegistroSeleccionado(null)}
        title="Detalle del registro"
        size="lg"
        footer={
          <div className="flex items-center gap-3">
            {registroSeleccionado && getEntidadLink(registroSeleccionado) && (
              <button
                onClick={() => {
                  const link = getEntidadLink(registroSeleccionado)
                  if (link) {
                    navigate(link)
                    setRegistroSeleccionado(null)
                  }
                }}
                className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-semibold rounded-btn bg-ink text-white hover:bg-ink/90 transition-all"
              >
                <ExternalLink size={14} />
                Ver {ENTIDAD_LABELS[registroSeleccionado.entidad] || registroSeleccionado.entidad}
              </button>
            )}
            <button
              onClick={() => setRegistroSeleccionado(null)}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium rounded-btn border border-line bg-white text-ink hover:bg-bg-soft transition-all"
            >
              Cerrar
            </button>
          </div>
        }
      >
        {registroSeleccionado && (
          <RegistroDetalle registro={registroSeleccionado} />
        )}
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
    SUB-COMPONENTES
    ═══════════════════════════════════════════════════════════════ */

function Th({ children, style, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <th className={`px-4 py-2.5 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap ${className}`} style={style}>
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
  accent: 'indigo' | 'emerald' | 'blue' | 'amber'
  loading?: boolean
}) {
  const ACCENTS = {
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  hex: '#4F46E5' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', hex: '#059669' },
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    hex: '#2563EB' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   hex: '#D97706' },
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

function EmptyAuditoria({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean
  onClear: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-bg-soft flex items-center justify-center mb-4">
        <ShieldCheck size={24} className="text-ink-light" />
      </div>
      <h3 className="text-sm font-semibold text-ink">
        {hasFilters ? 'No hay resultados' : 'No hay registros de auditoría'}
      </h3>
      <p className="mt-1 text-sm text-ink-muted max-w-sm">
        {hasFilters
          ? 'Intenta ajustar los filtros para encontrar lo que buscas.'
          : 'Las acciones del sistema aparecerán aquí automáticamente.'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-5 inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-btn border border-line bg-white text-ink hover:bg-bg-soft transition-colors"
        >
          <X size={14} />
          Limpiar filtros
        </button>
      )}
    </div>
  )
}

function RegistroDetalle({ registro }: { registro: Auditoria }) {
  const initials = getInitials(registro.usuario_nombre)
  const rol = registro.usuario_rol || ''
  const detalle = generarDetalle(registro)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-ink-muted mb-1">Fecha y hora</p>
          <p className="text-sm font-medium text-ink">{formatFechaCompleta(registro.creado_en)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-ink-muted mb-1">IP Address</p>
          <p className="text-sm font-mono text-ink">{registro.ip_address || '—'}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-ink-muted mb-2">Usuario</p>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ring-1 ring-white shadow-sm ${ROL_AVATAR_STYLES[rol] || 'bg-gradient-to-br from-slate-500 to-slate-700 text-white'}`}>
            {initials}
          </div>
          <div>
            <p className="font-semibold text-ink">{registro.usuario_nombre || 'Sistema'}</p>
            <p className="text-sm text-ink-muted">{rol ? (ROL_LABELS[rol] || rol) : '—'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-ink-muted mb-2">Acción</p>
          <AccionBadge accion={registro.accion} />
        </div>
        <div>
          <p className="text-xs font-medium text-ink-muted mb-2">Entidad afectada</p>
          <EntidadBadge nombre={registro.entidad} />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-ink-muted mb-1">ID de la entidad</p>
        <p className="text-sm font-mono text-ink">{registro.entidad_id ? `#${registro.entidad_id}` : '—'}</p>
      </div>

      <div>
        <p className="text-xs font-medium text-ink-muted mb-1">Detalle completo</p>
        <p className="text-sm text-ink bg-bg-soft p-3 rounded-lg">{detalle}</p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
    HELPERS
    ═══════════════════════════════════════════════════════════════ */

function getInitials(nombre: string | undefined): string {
  if (!nombre || nombre === 'Sistema') return 'S'
  const parts = nombre.trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const second = parts[1]?.[0] || ''
  return (first + second).toUpperCase() || 'S'
}

function formatDatePart(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy', { locale: es })
  } catch {
    return '—'
  }
}

function formatTimePart(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'HH:mm:ss')
  } catch {
    return '—'
  }
}

function formatFechaCompleta(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy HH:mm:ss')
  } catch {
    return dateStr
  }
}
