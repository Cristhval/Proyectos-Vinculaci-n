import { useEffect, useState, useCallback } from 'react'
import {
  Search, Filter, RotateCcw, Download, ShieldCheck,
  Plus, Pencil, Trash2, Check, X, User, ChevronLeft,
  ChevronRight, ChevronDown, Activity, ExternalLink,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { auditoriaApi } from '@/api/auditoria'
import type { Auditoria, TipoAccion } from '@/types/auditoria'
import type { AuditoriaStats } from '@/api/auditoria'
import { ROL_AVATAR_STYLES, ROL_LABELS } from '@/lib/constants'
import { showSuccess, showError } from '@/components/ui/Toast'
import Tooltip from '@/components/ui/Tooltip'
import Modal from '@/components/ui/Modal'

const PAGE_SIZE = 20

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

const ACCION_CONFIG: Record<TipoAccion, { label: string; bg: string; text: string; icon: LucideIcon }> = {
  CREAR: { label: 'Crear', bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', icon: Plus },
  ACTUALIZAR: { label: 'Actualizar', bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', icon: Pencil },
  ELIMINAR: { label: 'Eliminar', bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]', icon: Trash2 },
  APROBAR: { label: 'Aprobar', bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', icon: Check },
  RECHAZAR: { label: 'Rechazar', bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]', icon: X },
  INICIAR_SESION: { label: 'Iniciar sesión', bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]', icon: User },
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

  const [stats, setStats] = useState<AuditoriaStats>({ total: 0, acciones_hoy: 0, usuarios_activos_hoy: 0, acciones_criticas: 0 })
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
        page_size: String(PAGE_SIZE),
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
  }, [page, search, filterAccion, filterEntidad, filterUsuario, filterFechaDesde, filterFechaHasta])

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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="space-y-6">
      {/* ═══════════════ HEADER ═══════════════ */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight leading-tight mb-1">
          Registro de Auditoría
        </h1>
        <p className="text-sm text-ink-muted max-w-xl">
          Trazabilidad completa de todas las acciones realizadas en el sistema
        </p>
        <div className="mt-4 flex items-start gap-3 px-4 py-3 bg-[#EFF6FF] border-l-[3px] border-[#2563EB] rounded-r-lg">
          <span className="text-sm mt-0.5">ℹ️</span>
          <p className="text-sm text-[#1E40AF]">
            Este registro es de solo lectura. Todas las acciones del sistema quedan registradas automáticamente para garantizar la trazabilidad institucional según el RNF-02.
          </p>
        </div>
      </div>

      {/* ═══════════════ ESTADÍSTICAS ═══════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-t border-b border-slate-200 overflow-hidden [&>*:not(:first-child)]:border-l [&>*:not(:first-child)]:border-slate-200">
        <StatCard
          label="acciones registradas"
          value={stats.total}
          borderColor="#000000"
          loading={statsLoading}
        />
        <StatCard
          label="acciones en las últimas 24 horas"
          value={stats.acciones_hoy}
          borderColor="#16A34A"
          loading={statsLoading}
        />
        <StatCard
          label="usuarios con actividad"
          value={stats.usuarios_activos_hoy}
          borderColor="#2563EB"
          loading={statsLoading}
        />
        <StatCard
          label="aprobaciones, rechazos y eliminaciones"
          value={stats.acciones_criticas}
          borderColor="#EAB308"
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
            <div className="w-40">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Acción</label>
              <SelectInput
                value={filterAccion}
                onChange={(v) => { setFilterAccion(v); setPage(1) }}
                options={ACCION_OPTIONS}
              />
            </div>
            <div className="w-40">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Entidad</label>
              <SelectInput
                value={filterEntidad}
                onChange={(v) => { setFilterEntidad(v); setPage(1) }}
                options={ENTIDAD_OPTIONS}
              />
            </div>
            <div className="w-44">
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
            <div className="w-40">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Fecha desde</label>
              <input
                type="date"
                value={filterFechaDesde}
                onChange={(e) => setFilterFechaDesde(e.target.value)}
                className="w-full h-9 px-3 border border-line rounded-btn bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
              />
            </div>
            <div className="w-40">
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
              Filtrar
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
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 py-3 border-b border-line">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-semibold text-ink">Registros de auditoría</h3>
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
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-bg-soft flex items-center justify-center mb-4">
              <ShieldCheck size={24} className="text-ink-light" />
            </div>
            <h3 className="text-sm font-semibold text-ink">No hay registros de auditoría</h3>
            <p className="mt-1 text-sm text-ink-muted max-w-sm">
              Las acciones del sistema aparecerán aquí automáticamente
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleLimpiar}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-btn border border-line bg-white text-ink hover:bg-bg-soft transition-colors"
              >
                <X size={14} />
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-soft/60 border-b border-line">
                  <Th style={{ width: 160 }}>Fecha y hora</Th>
                  <Th style={{ width: 180 }}>Usuario</Th>
                  <Th style={{ width: 130 }}>Acción</Th>
                  <Th style={{ width: 130 }}>Entidad</Th>
                  <Th>Detalle</Th>
                  <Th style={{ width: 80 }}>ID Entidad</Th>
                  <Th style={{ width: 110 }}>IP</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {registros.map((row) => {
                   const initials = getInitials(row.usuario_nombre)
                   const rol = row.usuario_rol || ''
                   const accionCfg = ACCION_CONFIG[row.accion]
                   const AccionIcon = accionCfg?.icon || Activity
                   const entidadLabel = ENTIDAD_LABELS[row.entidad] || row.entidad
                   const detalle = generarDetalle(row)
                   return (
                    <tr key={row.id} className="group hover:bg-[#F9FAFB] transition-colors duration-150">
                       <td className="px-4 py-3" style={{ width: 160 }}>
                         <div className="text-[13px] font-medium text-ink">{formatDatePart(row.creado_en)}</div>
                         <div className="text-[11px] text-ink-muted">{formatTimePart(row.creado_en)}</div>
                       </td>
                       <td className="px-4 py-3" style={{ width: 180 }}>
                         <div className="flex items-center gap-2.5 min-w-0">
                           <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ring-1 ring-white shadow-sm ${ROL_AVATAR_STYLES[rol] || 'bg-gradient-to-br from-slate-500 to-slate-700 text-white'}`}>
                             {initials}
                           </div>
                           <div className="min-w-0">
                             <p className="font-semibold text-ink truncate text-[13px]">
                               {row.usuario_nombre || 'Sistema'}
                             </p>
                             <p className="text-[11px] text-ink-muted truncate">
                               {rol ? (ROL_LABELS[rol] || rol) : '—'}
                             </p>
                           </div>
                         </div>
                       </td>
                       <td className="px-4 py-3" style={{ width: 130 }}>
                         {accionCfg && (
                           <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium ${accionCfg.bg} ${accionCfg.text}`}>
                             <AccionIcon size={11} strokeWidth={2.5} />
                             {accionCfg.label}
                           </span>
                         )}
                       </td>
                       <td className="px-4 py-3" style={{ width: 130 }}>
                         <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-[#F3F4F6] text-[#374151]">
                           {entidadLabel}
                         </span>
                       </td>
                       <td className="px-4 py-3">
                         <button
                           onClick={() => setRegistroSeleccionado(row)}
                           className="text-left w-full"
                         >
                           <Tooltip content={detalle} disabled={detalle.length <= 80}>
                             <span className="text-[13px] text-[#374151] block truncate max-w-[400px] hover:text-emerald-600 transition-colors cursor-pointer">
                               {detalle.length > 80 ? detalle.substring(0, 77) + '...' : detalle}
                             </span>
                           </Tooltip>
                         </button>
                       </td>
                       <td className="px-4 py-3" style={{ width: 80 }}>
                         {row.entidad_id ? (
                           <button
                             onClick={() => setRegistroSeleccionado(row)}
                             className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-mono font-medium bg-[#F3F4F6] text-[#374151] hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                           >
                             #{row.entidad_id}
                           </button>
                         ) : (
                           <span className="text-[11px] text-ink-muted">—</span>
                         )}
                       </td>
                       <td className="px-4 py-3" style={{ width: 110 }}>
                         <span className="text-[11px] font-mono text-[#9CA3AF]">
                           {row.ip_address || '—'}
                         </span>
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
            <span className="text-xs text-ink-muted">
              Mostrando {from} - {to} de <span className="font-semibold text-ink">{total}</span> registros
            </span>
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
    <th className={`px-4 py-2.5 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-wider ${className}`} style={style}>
      {children}
    </th>
  )
}

function StatCard({
  label,
  value,
  borderColor,
  loading,
}: {
  label: string
  value: number
  borderColor: string
  loading?: boolean
}) {
  return (
    <div className="relative overflow-hidden py-5 px-6 transition-colors duration-300 hover:bg-slate-50" style={{ borderLeft: `4px solid ${borderColor}` }}>
      {loading ? (
        <div className="h-10 w-16 bg-bg-soft rounded animate-pulse" />
      ) : (
        <div className="text-4xl font-bold tracking-tight text-slate-900">
          {value.toLocaleString('es-EC')}
        </div>
      )}
      <div className="mt-2">
        <span className="text-xs font-medium text-slate-500">
          {label}
        </span>
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
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 appearance-none pl-3 pr-9 border border-line rounded-btn bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
    </div>
  )
}

function RegistroDetalle({ registro }: { registro: Auditoria }) {
  const initials = getInitials(registro.usuario_nombre)
  const rol = registro.usuario_rol || ''
  const accionCfg = ACCION_CONFIG[registro.accion]
  const AccionIcon = accionCfg?.icon || Activity
  const entidadLabel = ENTIDAD_LABELS[registro.entidad] || registro.entidad
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
          {accionCfg && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium ${accionCfg.bg} ${accionCfg.text}`}>
              <AccionIcon size={12} strokeWidth={2.5} />
              {accionCfg.label}
            </span>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-ink-muted mb-2">Entidad afectada</p>
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-[#F3F4F6] text-[#374151]">
            {entidadLabel}
          </span>
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
