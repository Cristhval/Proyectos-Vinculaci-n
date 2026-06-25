import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderKanban,
  TrendingUp,
  FileSignature,
  Handshake,
  RefreshCw,
  Download,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart as PieIcon,
  FileText,
} from 'lucide-react'
import { DonutApex, BarHorizontalApex, PALETTE } from '@/components/charts/ApexCharts'
import { reportesApi } from '@/api/reportes'
import { carrerasApi } from '@/api/usuarios'
import { Spinner, StatusBadge } from '@/components/ui'
import { showError } from '@/components/ui/Toast'
import {
  ESTADO_PROYECTO_LABELS,
  TIPO_PROYECTO_LABELS,
  ESTADO_CONVENIO_LABELS,
} from '@/lib/constants'
import { exportarPDF } from '@/lib/exportarReportes'
import type { DashboardKPIs, ReporteProyecto, ReporteConvenio } from '@/types/reportes'
import type { Carrera } from '@/types/usuarios'

const fmtCurrency = (n: number): string =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)

const fmtPct = (n: number): string => `${Math.round(n || 0)}%`

const ESTADO_HEX: Record<string, string> = {
  BORRADOR: '#9CA3AF',
  EN_REVISION: '#2563EB',
  APROBADO: '#16A34A',
  EN_EJECUCION: '#15803D',
  EN_SUSPENSION: '#EAB308',
  FINALIZADO: '#065F46',
  CERRADO: '#374151',
  CANCELADO: '#DC2626',
}

const TIPO_HEX: Record<string, string> = {
  VINCULACION: '#16A34A',
  INVESTIGACION: '#2563EB',
  EXTENSION: '#EAB308',
  MIXTO: '#8B5CF6',
}

const ESTADO_CONVENIO_HEX: Record<string, string> = {
  VIGENTE: '#16A34A',
  VENCIDO: '#DC2626',
  EN_REVISION: '#2563EB',
  SUSPENDIDO: '#EAB308',
  BORRADOR: '#9CA3AF',
  FINALIZADO: '#065F46',
  CANCELADO: '#374151',
}

const ITEMS_PER_PAGE = 15

/* ─────────── UI local ─────────── */
function Panel({
  title, subtitle, icon: Icon, accent = 'indigo', right, children, className = '',
}: {
  title: string; subtitle?: string; icon?: typeof FolderKanban
  accent?: 'emerald' | 'indigo' | 'amber' | 'rose' | 'blue' | 'violet' | 'slate'
  right?: React.ReactNode; children: React.ReactNode; className?: string
}) {
  const accents: Record<string, { bg: string; text: string; ring: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200/60' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200/60' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200/60' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200/60' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200/60' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200/60' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-200/60' },
  }
  const a = accents[accent]!
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md ${className}`}>
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.bg} ${a.text} ring-1 ${a.ring}`}>
              <Icon size={18} strokeWidth={2.2} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-[14.5px] font-semibold text-slate-900 leading-tight tracking-tight">{title}</h3>
            {subtitle && <p className="text-[11.5px] text-slate-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </div>
  )
}

function KpiCard({
  label, value, icon: Icon, accent, hint,
}: {
  label: string; value: string | number; icon: typeof FolderKanban
  accent: 'emerald' | 'indigo' | 'amber' | 'rose' | 'blue' | 'violet'; hint?: string
}) {
  const accents: Record<string, { bg: string; text: string; hex: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', hex: PALETTE.emerald },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', hex: PALETTE.indigo },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', hex: PALETTE.amber },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', hex: PALETTE.rose },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', hex: PALETTE.blue },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', hex: PALETTE.violet },
  }
  const a = accents[accent]!
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40" style={{ background: a.hex }} />
      <div className="relative flex items-center justify-between mb-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.bg} ${a.text}`}>
          <Icon size={20} strokeWidth={2.2} />
        </div>
      </div>
      <div className="relative">
        <div className="text-[32px] font-bold tracking-tight text-slate-900 leading-none tabular-nums">{value}</div>
        <div className="mt-2 text-[12px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
        {hint && <div className="mt-1.5 text-[11.5px] text-slate-500 leading-snug">{hint}</div>}
      </div>
    </div>
  )
}

function EmptyState({ message = 'Sin datos para graficar', icon: Icon = BarChart3 }: { message?: string; icon?: typeof BarChart3 }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 mb-3">
        <Icon size={20} className="text-slate-300" />
      </div>
      <p className="text-[12.5px] text-slate-400">{message}</p>
    </div>
  )
}

/* ─────────── Página principal ─────────── */
export default function CoordinadorReportesPage() {
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [proyectos, setProyectos] = useState<ReporteProyecto[]>([])
  const [convenios, setConvenios] = useState<ReporteConvenio[]>([])
  const [carreras, setCarreras] = useState<Carrera[]>([])

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroCarrera, setFiltroCarrera] = useState('')
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')
  const [pagina, setPagina] = useState(1)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dashRes, proyRes, convRes, carrRes] = await Promise.all([
        reportesApi.dashboard(),
        reportesApi.proyectos({ page_size: '500' }),
        reportesApi.convenios({ page_size: '500' }),
        carrerasApi.list({ page_size: '200' }),
      ])
      setKpis(dashRes.data.data || null)
      setProyectos(proyRes.data.data || [])
      setConvenios(convRes.data.data || [])
      setCarreras(carrRes.data.results || [])
    } catch (err) {
      console.error(err)
      showError('No se pudieron cargar los reportes', 'Intenta nuevamente en unos segundos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPagina(1) }, [filtroEstado, filtroTipo, filtroCarrera, filtroFechaInicio, filtroFechaFin])

  /* ─────────── KPIs ─────────── */
  const totalProyectos = proyectos.length
  const proyectosEnEjecucion = proyectos.filter((p) => p.estado === 'EN_EJECUCION').length
  const proyectosEnRevision = proyectos.filter((p) => p.estado === 'EN_REVISION').length
  const conveniosVigentes = convenios.filter((c) => c.estado === 'VIGENTE').length

  /* ─────────── Datos para gráficas ─────────── */
  const proyectosPorEstadoData = useMemo(() => {
    const counts: Record<string, number> = {}
    proyectos.forEach((p) => { counts[p.estado] = (counts[p.estado] || 0) + 1 })
    return Object.entries(counts).map(([estado, value]) => ({
      name: ESTADO_PROYECTO_LABELS[estado] || estado,
      value,
      color: ESTADO_HEX[estado] || PALETTE.slate,
    }))
  }, [proyectos])

  const proyectosPorTipoData = useMemo(() => {
    const counts: Record<string, number> = {}
    proyectos.forEach((p) => { counts[p.tipo] = (counts[p.tipo] || 0) + 1 })
    return Object.entries(counts)
      .map(([tipo, value]) => ({
        name: TIPO_PROYECTO_LABELS[tipo] || tipo,
        value,
        color: TIPO_HEX[tipo] || PALETTE.slate,
      }))
      .sort((a, b) => b.value - a.value)
  }, [proyectos])

  const avanceProyectosData = useMemo(() => {
    return proyectos
      .filter((p) => p.estado === 'EN_EJECUCION')
      .map((p) => ({
        name: p.codigo,
        value: Math.round(p.progreso || 0),
      }))
      .sort((a, b) => a.value - b.value)
      .slice(0, 10)
  }, [proyectos])

  const conveniosPorEstadoData = useMemo(() => {
    const counts: Record<string, number> = {}
    convenios.forEach((c) => { counts[c.estado] = (counts[c.estado] || 0) + 1 })
    return Object.entries(counts).map(([estado, value]) => ({
      name: ESTADO_CONVENIO_LABELS[estado] || estado,
      value,
      color: ESTADO_CONVENIO_HEX[estado] || PALETTE.slate,
    }))
  }, [convenios])

  /* ─────────── Filtrado de tabla ─────────── */
  const proyectosFiltrados = useMemo(() => {
    return proyectos.filter((p) => {
      if (filtroEstado && p.estado !== filtroEstado) return false
      if (filtroTipo && p.tipo !== filtroTipo) return false
      if (filtroCarrera && p.carrera !== filtroCarrera) return false
      if (filtroFechaInicio && p.fecha_inicio && p.fecha_inicio < filtroFechaInicio) return false
      if (filtroFechaFin && p.fecha_fin_planificada && p.fecha_fin_planificada > filtroFechaFin) return false
      return true
    })
  }, [proyectos, filtroEstado, filtroTipo, filtroCarrera, filtroFechaInicio, filtroFechaFin])

  const totalPaginas = Math.max(1, Math.ceil(proyectosFiltrados.length / ITEMS_PER_PAGE))
  const paginaActual = Math.min(pagina, totalPaginas)
  const proyectosPagina = proyectosFiltrados.slice((paginaActual - 1) * ITEMS_PER_PAGE, paginaActual * ITEMS_PER_PAGE)

  /* ─────────── PDF ─────────── */
  const handleExportarPDF = async () => {
    if (exportando || !kpis) return
    setExportando(true)
    try {
      await exportarPDF(kpis, proyectosFiltrados, convenios)
    } finally {
      setExportando(false)
    }
  }

  const limpiarFiltros = () => {
    setFiltroEstado('')
    setFiltroTipo('')
    setFiltroCarrera('')
    setFiltroFechaInicio('')
    setFiltroFechaFin('')
  }

  const fechaStr = (s: string | null) => {
    if (!s) return '—'
    try { return new Date(s).toLocaleDateString('es-EC') } catch { return s }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-[12px] text-slate-500">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-none border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reportes y Estadísticas</h1>
          <p className="text-xs text-slate-500 mt-0.5">Supervisión general de todos los proyectos de vinculación.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} title="Actualizar" className="inline-flex items-center justify-center w-9 h-9 rounded-none border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleExportarPDF}
            disabled={exportando || proyectos.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            {exportando ? 'Generando…' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Proyectos registrados" value={totalProyectos} icon={FolderKanban} accent="emerald" hint={`${proyectosEnEjecucion} en ejecución · ${proyectosEnRevision} en revisión`} />
        <KpiCard label="En ejecución" value={proyectosEnEjecucion} icon={TrendingUp} accent="blue" hint={totalProyectos > 0 ? `${fmtPct((proyectosEnEjecucion / totalProyectos) * 100)} del total` : undefined} />
        <KpiCard label="En revisión" value={proyectosEnRevision} icon={FileSignature} accent="amber" hint="Pendientes de aprobación" />
        <KpiCard label="Convenios vigentes" value={conveniosVigentes} icon={Handshake} accent="indigo" hint={`${convenios.length} convenios totales`} />
      </div>

      {/* Gráfica 1: Proyectos por estado + Gráfica 2: Proyectos por tipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Proyectos por estado" subtitle="Distribución de todos los proyectos" icon={PieIcon} accent="indigo">
          {proyectosPorEstadoData.length > 0 ? (
            <DonutApex data={proyectosPorEstadoData} height={240} centerLabel="Total" />
          ) : (
            <EmptyState message="Sin proyectos registrados" />
          )}
        </Panel>
        <Panel title="Proyectos por tipo" subtitle="Clasificación por modalidad" icon={BarChart3} accent="emerald">
          {proyectosPorTipoData.length > 0 ? (
            <BarHorizontalApex data={proyectosPorTipoData} height={240} valueFormatter={(v) => `${v}`} />
          ) : (
            <EmptyState message="Sin proyectos registrados" />
          )}
        </Panel>
      </div>

      {/* Gráfica 3: Avance por proyecto + Gráfica 4: Convenios por estado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Avance por proyecto en ejecución" subtitle="Top 10 con menor avance primero" icon={TrendingUp} accent="emerald">
          {avanceProyectosData.length > 0 ? (
            <BarHorizontalApex
              data={avanceProyectosData.map((p) => ({
                ...p,
                color: p.value < 30 ? '#DC2626' : p.value <= 70 ? '#EAB308' : '#16A34A',
              }))}
              height={240}
              valueFormatter={(v) => `${v}%`}
            />
          ) : (
            <EmptyState message="Sin proyectos en ejecución" />
          )}
        </Panel>
        <Panel title="Convenios por estado" subtitle="Distribución de convenios" icon={Handshake} accent="blue">
          {conveniosPorEstadoData.length > 0 ? (
            <DonutApex data={conveniosPorEstadoData} height={240} centerLabel="Total" />
          ) : (
            <EmptyState message="Sin convenios registrados" />
          )}
        </Panel>
      </div>

      {/* Tabla de proyectos */}
      <Panel
        title="Detalle de proyectos"
        subtitle={`${proyectosFiltrados.length} proyectos encontrados`}
        icon={FileText}
        accent="slate"
        right={
          <Link to="/proyectos" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 hover:text-emerald-800 transition">
            Ver todos
          </Link>
        }
      >
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Filter size={13} /> Filtros:
          </div>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="text-[12px] border border-slate-200 rounded-none px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-emerald-500">
            <option value="">Todos los estados</option>
            {Object.entries(ESTADO_PROYECTO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="text-[12px] border border-slate-200 rounded-none px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-emerald-500">
            <option value="">Todos los tipos</option>
            {Object.entries(TIPO_PROYECTO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filtroCarrera} onChange={(e) => setFiltroCarrera(e.target.value)} className="text-[12px] border border-slate-200 rounded-none px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-emerald-500">
            <option value="">Todas las carreras</option>
            {carreras.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>
          <input type="date" value={filtroFechaInicio} onChange={(e) => setFiltroFechaInicio(e.target.value)} className="text-[12px] border border-slate-200 rounded-none px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-emerald-500" placeholder="Fecha inicio desde" />
          <input type="date" value={filtroFechaFin} onChange={(e) => setFiltroFechaFin(e.target.value)} className="text-[12px] border border-slate-200 rounded-none px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-emerald-500" placeholder="Fecha fin hasta" />
          {(filtroEstado || filtroTipo || filtroCarrera || filtroFechaInicio || filtroFechaFin) && (
            <button onClick={limpiarFiltros} className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800">
              <X size={12} /> Limpiar
            </button>
          )}
        </div>

        {/* Tabla */}
        {proyectosPagina.length > 0 ? (
          <>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5">Código</th>
                    <th className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5">Título</th>
                    <th className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5">Tipo</th>
                    <th className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5">Estado</th>
                    <th className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5 hidden md:table-cell">Responsable</th>
                    <th className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5 hidden md:table-cell">Carrera</th>
                    <th className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5 hidden lg:table-cell">Período</th>
                    <th className="text-right text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5 hidden lg:table-cell">Presupuesto</th>
                    <th className="text-right text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5">% Avance</th>
                  </tr>
                </thead>
                <tbody>
                  {proyectosPagina.map((p, i) => (
                    <tr key={p.id} className={`border-b border-slate-100 transition-colors hover:bg-emerald-50/40 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                      <td className="px-3 py-3">
                        <span className="font-mono text-[11.5px] font-semibold text-slate-700">{p.codigo}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[250px]">
                        <p className="text-[13px] font-semibold text-slate-900 truncate" title={p.titulo}>{p.titulo}</p>
                      </td>
                      <td className="px-3 py-3 text-[12px] text-slate-600">{TIPO_PROYECTO_LABELS[p.tipo] || p.tipo}</td>
                      <td className="px-3 py-3"><StatusBadge estado={p.estado} /></td>
                      <td className="px-3 py-3 text-[12px] text-slate-600 hidden md:table-cell max-w-[150px] truncate">{p.responsable_nombre || p.responsable || '—'}</td>
                      <td className="px-3 py-3 text-[12px] text-slate-600 hidden md:table-cell max-w-[150px] truncate" title={p.carrera || ''}>{p.carrera || '—'}</td>
                      <td className="px-3 py-3 text-[11px] text-slate-500 hidden lg:table-cell whitespace-nowrap">
                        {fechaStr(p.fecha_inicio)} → {fechaStr(p.fecha_fin_planificada)}
                      </td>
                      <td className="px-3 py-3 text-right text-[12px] font-semibold text-slate-700 hidden lg:table-cell tabular-nums">{fmtCurrency(Number(p.presupuesto_aprobado || 0))}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, p.progreso)}%`,
                                background: p.progreso >= 70 ? PALETTE.emerald : p.progreso >= 30 ? PALETTE.amber : PALETTE.rose,
                              }}
                            />
                          </div>
                          <span className="text-[11.5px] font-bold tabular-nums text-slate-700 w-9 text-right">{Math.round(p.progreso)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between pt-3">
              <p className="text-[11px] text-slate-500">
                Mostrando {(paginaActual - 1) * ITEMS_PER_PAGE + 1}–{Math.min(paginaActual * ITEMS_PER_PAGE, proyectosFiltrados.length)} de {proyectosFiltrados.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPagina(Math.max(1, pagina - 1))} disabled={paginaActual === 1} className="p-1.5 rounded-none border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  const start = Math.max(1, Math.min(paginaActual - 2, totalPaginas - 4))
                  const pageNum = start + i
                  if (pageNum > totalPaginas) return null
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPagina(pageNum)}
                      className={`w-8 h-8 text-[12px] font-semibold rounded-none border ${pageNum === paginaActual ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))} disabled={paginaActual === totalPaginas} className="p-1.5 rounded-none border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState message="No se encontraron proyectos con los filtros aplicados" icon={Filter} />
        )}
      </Panel>
    </div>
  )
}
