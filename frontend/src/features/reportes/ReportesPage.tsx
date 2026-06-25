import { useState, useEffect, useCallback, useMemo, memo, type ComponentType, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import {
  FolderKanban,
  PlayCircle,
  FileSignature,
  AlertTriangle,
  Bell,
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  TableProperties,
  FileSpreadsheet,
  FileText,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Activity,
  Clock,
  type LucideIcon,
} from 'lucide-react'
import {
  DonutApex,
  BarHorizontalApex,
  ColumnApex,
  PALETTE as APEX_PALETTE,
} from '@/components/charts/ApexCharts'
import { reportesApi } from '@/api/reportes'
import { carrerasApi } from '@/api/usuarios'
import { alertasApi } from '@/api/seguimiento'
import { Spinner, StatusBadge } from '@/components/ui'
import {
  ESTADO_PROYECTO_LABELS,
  TIPO_PROYECTO_LABELS,
  ESTADO_CONVENIO_LABELS,
  PRIORIDAD_ALERTA_LABELS,
} from '@/lib/constants'
import { exportarExcel, exportarPDF } from '@/lib/exportarReportes'
import { useAuthStore } from '@/store/authStore'
import type { DashboardKPIs, ReporteProyecto, ReporteConvenio } from '@/types/reportes'
import type { Carrera } from '@/types/usuarios'

/* ─────────────────────────────────────────────
   PALETA EJECUTIVA — alineada con el sistema
   ───────────────────────────────────────────── */
const PALETTE = {
  emerald: '#16A34A',
  emeraldSoft: '#10B981',
  emeraldLight: '#D1FAE5',
  indigo: '#4F46E5',
  indigoSoft: '#6366F1',
  indigoLight: '#E0E7FF',
  amber: '#F59E0B',
  amberSoft: '#FBBF24',
  amberLight: '#FEF3C7',
  rose: '#E11D48',
  roseSoft: '#F43F5E',
  roseLight: '#FFE4E6',
  blue: '#2563EB',
  blueSoft: '#3B82F6',
  blueLight: '#DBEAFE',
  violet: '#7C3AED',
  violetSoft: '#8B5CF6',
  violetLight: '#EDE9FE',
  sky: '#0284C7',
  skyLight: '#E0F2FE',
  slate: '#475569',
  slateLight: '#94A3B8',
  ink: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  bgSoft: '#F8FAFC',
  bgMuted: '#F1F5F9',
} as const

const ESTADO_PROYECTO_COLORS: Record<string, string> = {
  BORRADOR: '#94A3B8',
  EN_REVISION: PALETTE.blue,
  APROBADO: PALETTE.emeraldSoft,
  EN_EJECUCION: PALETTE.emerald,
  EN_SUSPENSION: PALETTE.amber,
  FINALIZADO: PALETTE.ink,
  CERRADO: '#64748B',
  CANCELADO: PALETTE.rose,
}

const TIPO_PROYECTO_COLORS: Record<string, string> = {
  VINCULACION: PALETTE.emerald,
  INVESTIGACION: PALETTE.blue,
  EXTENSION: PALETTE.amber,
  MIXTO: PALETTE.violet,
}

const ESTADO_CONVENIO_COLORS: Record<string, string> = {
  BORRADOR: '#94A3B8',
  EN_REVISION: PALETTE.blue,
  VIGENTE: PALETTE.emerald,
  VENCIDO: PALETTE.rose,
  SUSPENDIDO: PALETTE.amber,
  FINALIZADO: PALETTE.ink,
  CANCELADO: '#BE123C',
}

const PRIORIDAD_ALERTA_COLORS: Record<string, string> = {
  BAJA: PALETTE.blue,
  MEDIA: PALETTE.amber,
  ALTA: '#EA580C',
  URGENTE: PALETTE.rose,
}

const PERIODOS = [
  { value: '', label: 'Todo el tiempo' },
  { value: 'year', label: 'Este año' },
  { value: 'semester', label: 'Este semestre' },
  { value: 'month', label: 'Este mes' },
] as const

const ITEMS_PER_PAGE = 20

/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   UI PRIMITIVES
   ───────────────────────────────────────────── */
function PanelHeader({
  title,
  subtitle,
  icon: Icon,
  accent = 'slate',
  right,
}: {
  title: string
  subtitle?: string
  icon?: LucideIcon
  accent?: 'emerald' | 'indigo' | 'amber' | 'rose' | 'blue' | 'violet' | 'slate'
  right?: ReactNode
}) {
  const accentMap: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600' },
    rose:    { bg: 'bg-rose-50',    text: 'text-rose-600' },
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600' },
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-600' },
    slate:   { bg: 'bg-slate-100',  text: 'text-slate-700' },
  }
  const a = accentMap[accent]!
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${a.bg} ${a.text} flex-shrink-0`}>
            <Icon size={16} strokeWidth={2.25} />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-ink leading-tight tracking-tight">{title}</h3>
          {subtitle && <p className="text-[12px] text-ink-muted mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  )
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-xl border border-line shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

function PanelBody({ children, loading, empty, emptyLabel = 'Sin datos disponibles', minH = 280 }: {
  children: ReactNode
  loading?: boolean
  empty?: boolean
  emptyLabel?: string
  minH?: number
}) {
  return (
    <div className="px-5 pb-5" style={{ minHeight: minH }}>
      {loading ? (
        <div className="flex items-center justify-center h-full" style={{ minHeight: minH }}>
          <Spinner size="md" />
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center justify-center h-full text-center" style={{ minHeight: minH }}>
          <div className="w-10 h-10 rounded-full bg-bg-soft flex items-center justify-center mb-2">
            <Activity size={16} className="text-ink-light opacity-50" />
          </div>
          <p className="text-[12px] text-ink-muted">{emptyLabel}</p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   KPI CARDS
   ───────────────────────────────────────────── */
type AccentKey = 'emerald' | 'indigo' | 'amber' | 'rose' | 'blue' | 'violet' | 'slate' | 'sky'

const KPI_ACCENT: Record<AccentKey, { bg: string; text: string; hex: string; ring: string; chip: string }> = {
  emerald: { bg: 'bg-emerald-50',  text: 'text-emerald-700',  hex: PALETTE.emerald, ring: 'ring-emerald-100', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  indigo:  { bg: 'bg-indigo-50',   text: 'text-indigo-700',   hex: PALETTE.indigo,  ring: 'ring-indigo-100',  chip: 'bg-indigo-50 text-indigo-700 ring-indigo-100' },
  amber:   { bg: 'bg-amber-50',    text: 'text-amber-700',    hex: PALETTE.amber,   ring: 'ring-amber-100',   chip: 'bg-amber-50 text-amber-700 ring-amber-100' },
  rose:    { bg: 'bg-rose-50',     text: 'text-rose-700',     hex: PALETTE.rose,    ring: 'ring-rose-100',    chip: 'bg-rose-50 text-rose-700 ring-rose-100' },
  blue:    { bg: 'bg-blue-50',     text: 'text-blue-700',     hex: PALETTE.blue,    ring: 'ring-blue-100',    chip: 'bg-blue-50 text-blue-700 ring-blue-100' },
  violet:  { bg: 'bg-violet-50',   text: 'text-violet-700',   hex: PALETTE.violet,  ring: 'ring-violet-100',  chip: 'bg-violet-50 text-violet-700 ring-violet-100' },
  slate:   { bg: 'bg-slate-100',   text: 'text-slate-700',    hex: PALETTE.slate,   ring: 'ring-slate-200',   chip: 'bg-slate-100 text-slate-700 ring-slate-200' },
  sky:     { bg: 'bg-sky-50',      text: 'text-sky-700',      hex: PALETTE.sky,     ring: 'ring-sky-100',     chip: 'bg-sky-50 text-sky-700 ring-sky-100' },
}

interface KPICardProps {
  label: string
  value: string | number
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  accent: AccentKey
  delta?: number
  deltaLabel?: string
  hint?: string
  hintAccent?: AccentKey
}

const KPICard = memo(function KPICard({ label, value, icon: Icon, accent, delta, deltaLabel, hint, hintAccent }: KPICardProps) {
  const a = KPI_ACCENT[accent]!
  const ha = hintAccent ? KPI_ACCENT[hintAccent] : a
  const hasPositiveDelta = typeof delta === 'number' && delta >= 0
  const DeltaIcon = typeof delta === 'number' ? (hasPositiveDelta ? TrendingUp : TrendingDown) : null
  const deltaColor = typeof delta === 'number' ? (hasPositiveDelta ? 'text-emerald-600' : 'text-rose-600') : ''

  return (
    <div className="group relative overflow-hidden py-5 px-6 transition-colors duration-300 hover:bg-slate-50">
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${a.bg} ${a.text} transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={18} strokeWidth={2.25} />
        </div>
        {typeof delta === 'number' && DeltaIcon && (
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 ${ha.chip}`}>
            <DeltaIcon size={11} strokeWidth={2.5} />
            {Math.abs(delta).toFixed(delta % 1 === 0 ? 0 : 1)}%
          </span>
        )}
      </div>
      <div className="text-4xl font-bold tracking-tight text-slate-900 transition-transform duration-300 group-hover:-translate-y-0.5 tabular-nums">
        {value}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div
          className="h-px w-4 transition-all duration-300 group-hover:w-8"
          style={{ backgroundColor: a.hex, opacity: 0.6 }}
        />
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </span>
      </div>
      {hint && (
        <p className="mt-2 text-[11.5px] text-ink-muted leading-snug truncate">{hint}</p>
      )}
      {deltaLabel && (
        <p className={`mt-1 text-[11px] font-medium ${deltaColor}`}>{deltaLabel}</p>
      )}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 transition-transform duration-300 group-hover:scale-x-100 origin-left"
        style={{ backgroundColor: a.hex }}
      />
    </div>
  )
})

/* ─────────────────────────────────────────────
   DONUT CHART (Proyectos por estado / Convenios por estado)
   ───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────── */
interface FiltrosState {
  estado: string
  tipo: string
  carrera: string
  responsable: string
  fechaInicio: string
  fechaFin: string
}

const filtrosIniciales: FiltrosState = {
  estado: '',
  tipo: '',
  carrera: '',
  responsable: '',
  fechaInicio: '',
  fechaFin: '',
}

export default function ReportesPage() {
  const user = useAuthStore((state) => state.user)

  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [periodo, setPeriodo] = useState('')
  const [alertasUrgentes, setAlertasUrgentes] = useState(0)
  const [avancePromedio, setAvancePromedio] = useState(0)
  const [proyectosPorCarrera, setProyectosPorCarrera] = useState<Array<{ name: string; value: number; color: string }>>([])
  const [conveniosPorEstado, setConveniosPorEstado] = useState<Array<{ estado: string; total: number }>>([])
  const [alertasPorPrioridad, setAlertasPorPrioridad] = useState<Array<{ prioridad: string; total: number }>>([])
  const [avanceProyectos, setAvanceProyectos] = useState<Array<{ nombre: string; avance: number }>>([])

  const [proyectosTabla, setProyectosTabla] = useState<ReporteProyecto[]>([])
  const [conveniosTabla, setConveniosTabla] = useState<ReporteConvenio[]>([])
  const [filtros, setFiltros] = useState<FiltrosState>(filtrosIniciales)
  const [paginaActual, setPaginaActual] = useState(1)
  const [exportando, setExportando] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dashRes, carrerasRes, urgRes, progRes, conveniosRes, alertasRes, proyectosEjecRes, todosProyectosRes] = await Promise.all([
        reportesApi.dashboard().catch(() => null),
        carrerasApi.list({ page_size: '100' }).catch(() => null),
        alertasApi.list({ estado: 'PENDIENTE', prioridad: 'URGENTE', page_size: '1' }).catch(() => null),
        reportesApi.progreso().catch(() => null),
        reportesApi.convenios().catch(() => null),
        alertasApi.list({ estado: 'PENDIENTE', page_size: '500' }).catch(() => null),
        reportesApi.proyectos({ estado: 'EN_EJECUCION', page_size: '50' }).catch(() => null),
        reportesApi.proyectos({ page_size: '500' }).catch(() => null),
      ])

      const dashData = dashRes?.data?.data ?? null
      setKpis(dashData)

      const carrerasList = carrerasRes?.data?.results || []
      setCarreras(carrerasList)
      setAlertasUrgentes(urgRes?.data?.count ?? 0)

      const actividades = (progRes?.data?.data || []).flatMap((p) =>
        (p.actividades || []).map((a) => parseFloat(a.porcentaje_ejecucion) || 0),
      )
      setAvancePromedio(actividades.length > 0 ? actividades.reduce((s, v) => s + v, 0) / actividades.length : 0)

      const todosProyectos = todosProyectosRes?.data?.data || []
      setProyectosTabla(todosProyectos)

      const carreraCounts: Array<{ name: string; value: number; color: string }> = []
      if (todosProyectos.length > 0) {
        const countsByCarrera: Record<string, number> = {}
        todosProyectos.forEach((p) => {
          if (p.carrera) {
            countsByCarrera[p.carrera] = (countsByCarrera[p.carrera] || 0) + 1
          }
        })
        const palette: string[] = [
          PALETTE.emerald,
          PALETTE.indigo,
          PALETTE.amber,
          PALETTE.rose,
          PALETTE.blue,
          PALETTE.violet,
          PALETTE.sky,
          '#0D9488',
        ]
        let i = 0

        // Build a map from carrera name/id to display name
        const carreraNameMap = new Map<string, string>()
        carrerasList.forEach((c) => {
          carreraNameMap.set(String(c.id), c.nombre)
          carreraNameMap.set(c.nombre, c.nombre)
        })

        Object.entries(countsByCarrera).forEach(([key, count]) => {
          if (count > 0) {
            const displayName = carreraNameMap.get(key) || key
            carreraCounts.push({
              name: displayName,
              value: count,
              color: palette[i % palette.length]!,
            })
            i++
          }
        })
      }
      setProyectosPorCarrera(carreraCounts)

      const conveniosList = conveniosRes?.data?.data || []
      if (conveniosList.length > 0) {
        const convenioEstadoCounts: Record<string, number> = {}
        conveniosList.forEach((c: { estado: string }) => {
          convenioEstadoCounts[c.estado] = (convenioEstadoCounts[c.estado] || 0) + 1
        })
        setConveniosPorEstado(Object.entries(convenioEstadoCounts).map(([estado, total]) => ({ estado, total })))
        setConveniosTabla(conveniosList)
      } else {
        setConveniosPorEstado([])
        setConveniosTabla([])
      }

      const alertasData = alertasRes?.data?.results || []
      if (alertasData.length > 0) {
        const prioridadCounts: Record<string, number> = {}
        alertasData.forEach((a: { prioridad: string }) => {
          prioridadCounts[a.prioridad] = (prioridadCounts[a.prioridad] || 0) + 1
        })
        setAlertasPorPrioridad(Object.entries(prioridadCounts).map(([prioridad, total]) => ({ prioridad, total })))
      } else {
        setAlertasPorPrioridad([])
      }

      const proyectosEjecData = proyectosEjecRes?.data?.data || []
      if (proyectosEjecData.length > 0) {
        const avanceArr = proyectosEjecData
          .map((p: { titulo: string; progreso: number }) => ({
            nombre: p.titulo,
            avance: Math.round(p.progreso || 0),
          }))
          .sort((a: { avance: number }, b: { avance: number }) => a.avance - b.avance)
          .slice(0, 10)
        setAvanceProyectos(avanceArr)
      } else {
        setAvanceProyectos([])
      }
    } catch {
      setKpis(null)
      setProyectosPorCarrera([])
      setConveniosPorEstado([])
      setAlertasPorPrioridad([])
      setAvanceProyectos([])
      setAlertasUrgentes(0)
      setAvancePromedio(0)
      setProyectosTabla([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const proyectosFiltrados = useMemo(() => {
    return proyectosTabla.filter((p) => {
      if (filtros.estado && p.estado !== filtros.estado) return false
      if (filtros.tipo && p.tipo !== filtros.tipo) return false
      if (filtros.carrera && p.carrera !== filtros.carrera) return false
      if (filtros.responsable) {
        const resp = (p.responsable_nombre || p.responsable || '').toLowerCase()
        if (!resp.includes(filtros.responsable.toLowerCase())) return false
      }
      if (filtros.fechaInicio && p.fecha_inicio) {
        if (new Date(p.fecha_inicio) < new Date(filtros.fechaInicio)) return false
      }
      if (filtros.fechaFin && p.fecha_fin_planificada) {
        if (new Date(p.fecha_fin_planificada) > new Date(filtros.fechaFin)) return false
      }
      return true
    })
  }, [proyectosTabla, filtros])

  const totalPaginas = Math.ceil(proyectosFiltrados.length / ITEMS_PER_PAGE)
  const proyectosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_PER_PAGE
    return proyectosFiltrados.slice(inicio, inicio + ITEMS_PER_PAGE)
  }, [proyectosFiltrados, paginaActual])

  useEffect(() => {
    setPaginaActual(1)
  }, [filtros])

  const handleLimpiarFiltros = () => setFiltros(filtrosIniciales)

  const handleExportarExcel = async () => {
    if (exportando) return
    setExportando(true)
    await exportarExcel(kpis, proyectosFiltrados, conveniosTabla)
    setExportando(false)
  }

  const handleExportarPDF = async () => {
    if (exportando) return
    setExportando(true)
    await exportarPDF(kpis, proyectosFiltrados)
    setExportando(false)
  }

  /* ─────────── DERIVED METRICS ─────────── */
  const totalProyectos = useMemo(() =>
    kpis ? kpis.proyectos_por_estado.reduce((sum, e) => sum + e.total, 0) : 0,
  [kpis])

  const proyectosEnEjecucion = useMemo(() =>
    kpis ? (kpis.proyectos_por_estado.find((e) => e.estado === 'EN_EJECUCION')?.total ?? 0) : 0,
  [kpis])

  const proyectosFinalizados = useMemo(() =>
    kpis?.resumen.proyectos_finalizados ?? 0,
  [kpis])

  const pctActivos = useMemo(() =>
    totalProyectos > 0 && kpis ? Math.round((kpis.resumen.proyectos_activos / totalProyectos) * 100) : 0,
  [totalProyectos, kpis])

  const totalConvenios = useMemo(() => {
    const fromKpis = kpis?.resumen.convenios_activos ?? 0
    const fromEstado = conveniosPorEstado.find((c) => c.estado === 'VIGENTE')?.total ?? 0
    return Math.max(fromKpis, fromEstado)
  }, [kpis, conveniosPorEstado])

  const totalConveniosGeneral = useMemo(() =>
    conveniosPorEstado.reduce((sum, c) => sum + c.total, 0),
  [conveniosPorEstado])

  const proyectosPorEstadoData = useMemo(() =>
    (kpis?.proyectos_por_estado ?? [])
      .map((e) => ({
        name: ESTADO_PROYECTO_LABELS[e.estado] || e.estado,
        value: e.total,
        color: ESTADO_PROYECTO_COLORS[e.estado] || '#94A3B8',
      })),
  [kpis])

  const proyectosPorTipoData = useMemo(() =>
    (kpis?.proyectos_por_tipo ?? [])
      .map((t) => ({
        name: TIPO_PROYECTO_LABELS[t.tipo] || t.tipo,
        value: t.total,
        color: TIPO_PROYECTO_COLORS[t.tipo] || '#94A3B8',
      })),
  [kpis])

  const conveniosPorEstadoData = useMemo(() =>
    conveniosPorEstado.map((c) => ({
      name: ESTADO_CONVENIO_LABELS[c.estado] || c.estado,
      value: c.total,
      color: ESTADO_CONVENIO_COLORS[c.estado] || '#94A3B8',
    })),
  [conveniosPorEstado])

  const alertasPorPrioridadData = useMemo(() => {
    const order = ['URGENTE', 'ALTA', 'MEDIA', 'BAJA']
    return order
      .map((p) => alertasPorPrioridad.find((a) => a.prioridad === p))
      .filter((a): a is { prioridad: string; total: number } => Boolean(a))
      .map((a) => ({
        name: PRIORIDAD_ALERTA_LABELS[a.prioridad] || a.prioridad,
        value: a.total,
        color: PRIORIDAD_ALERTA_COLORS[a.prioridad] || '#94A3B8',
      }))
  }, [alertasPorPrioridad])

  const avanceProyectosData = useMemo(() =>
    avanceProyectos.map((p) => ({ name: p.nombre, value: p.avance })),
  [avanceProyectos])

  const avancePromedioRedondeado = Math.round(avancePromedio)

  /* ─────────── FORMATTERS ─────────── */
  const formatFecha = useCallback((fecha: string | null): string => {
    if (!fecha) return '—'
    try {
      return new Date(fecha).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return fecha
    }
  }, [])

  const formatPresupuesto = useCallback((valor: string): string => {
    const num = parseFloat(valor)
    if (isNaN(num)) return valor
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num)
  }, [])

  const getProgresoColor = useCallback((progreso: number): string => {
    if (progreso < 30) return 'bg-rose-500'
    if (progreso <= 70) return 'bg-amber-500'
    return 'bg-emerald-500'
  }, [])

  if (user?.rol === 'ESTUDIANTE') {
    return <Navigate to="/estudiante/dashboard" replace />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─────────── HEADER ─────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-ink tracking-tight leading-tight">Reportes y Estadísticas</h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            {user?.rol === 'ADMIN'
              ? 'Resumen general del sistema de vinculación'
              : user?.rol === 'DOCENTE' || user?.rol === 'COORDINADOR' || user?.rol === 'DIRECTIVO'
                ? 'Resumen de tus proyectos y convenios asignados'
                : 'Resumen de vinculación'}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Período</label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full px-3 py-2 border border-line text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 rounded-btn transition-colors"
            >
              {PERIODOS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-white text-[13px] font-semibold rounded-btn hover:bg-ink/90 transition-colors shadow-sm"
          >
            <RefreshCw size={14} strokeWidth={2.25} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ─────────── ROW 1: KPIs ─────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-t border-b border-slate-200 overflow-hidden bg-white rounded-card [&>*:not(:first-child)]:border-l [&>*:not(:first-child)]:border-slate-200">
        <KPICard
          label="Total de proyectos"
          value={totalProyectos}
          icon={FolderKanban}
          accent="slate"
          hint={`${proyectosEnEjecucion} en ejecución · ${proyectosFinalizados} finalizados`}
        />
        <KPICard
          label="Proyectos activos"
          value={kpis?.resumen.proyectos_activos ?? 0}
          icon={PlayCircle}
          accent="emerald"
          delta={pctActivos}
          deltaLabel={`${pctActivos}% del total general`}
          hint={`${proyectosEnEjecucion} en ejecución continua`}
        />
        <KPICard
          label="Convenios vigentes"
          value={totalConvenios}
          icon={FileSignature}
          accent="indigo"
          hint={
            (kpis?.resumen.convenios_por_vencer ?? 0) > 0
              ? `${kpis?.resumen.convenios_por_vencer ?? 0} por vencer pronto`
              : 'Sin convenios próximos a vencer'
          }
          hintAccent={(kpis?.resumen.convenios_por_vencer ?? 0) > 0 ? 'amber' : 'emerald'}
        />
        <KPICard
          label="Alertas pendientes"
          value={kpis?.resumen.alertas_pendientes ?? 0}
          icon={Bell}
          accent="amber"
          hint={alertasUrgentes > 0 ? `${alertasUrgentes} urgentes requieren atención` : 'Sin alertas urgentes'}
          hintAccent={alertasUrgentes > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* ─────────── ROW 2: DONUT + HORIZONTAL BAR ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader
            title="Proyectos por estado"
            subtitle="Distribución según estado actual"
            icon={Activity}
            accent="emerald"
          />
          <PanelBody
            loading={loading}
            empty={proyectosPorEstadoData.length === 0 || totalProyectos === 0}
            emptyLabel="No hay proyectos registrados"
            minH={260}
          >
            <DonutApex
              data={proyectosPorEstadoData}
              height={240}
              centerLabel="Proyectos"
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Proyectos por tipo"
            subtitle="Clasificación por modalidad"
            icon={FolderKanban}
            accent="indigo"
          />
          <PanelBody
            loading={loading}
            empty={proyectosPorTipoData.length === 0}
            emptyLabel="No hay proyectos registrados"
            minH={260}
          >
            <BarHorizontalApex data={proyectosPorTipoData} height={240} valueFormatter={(v) => `${v}`} />
          </PanelBody>
        </Panel>
      </div>

      {/* ─────────── ROW 3: PROYECTOS POR CARRERA ─────────── */}
      <Panel>
        <PanelHeader
          title="Proyectos por carrera"
          subtitle="Distribución por carrera universitaria"
          icon={Users}
          accent="blue"
          right={
            <span className="text-[11px] font-medium text-ink-muted bg-bg-soft px-2 py-1 rounded-md">
              {proyectosPorCarrera.length} {proyectosPorCarrera.length === 1 ? 'carrera' : 'carreras'}
            </span>
          }
        />
        <PanelBody
          loading={loading}
          empty={proyectosPorCarrera.length === 0}
          emptyLabel="No hay proyectos asociados a carreras"
          minH={260}
        >
          <BarHorizontalApex data={proyectosPorCarrera} height={260} valueFormatter={(v) => `${v}`} />
        </PanelBody>
      </Panel>

      {/* ─────────── ROW 4: CONVENIOS DONUT + AVANCE BAR ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader
            title="Convenios por estado"
            subtitle="Distribución según vigencia"
            icon={FileSignature}
            accent="violet"
          />
          <PanelBody
            loading={loading}
            empty={conveniosPorEstadoData.length === 0 || totalConveniosGeneral === 0}
            emptyLabel="No hay convenios registrados"
            minH={260}
          >
            <DonutApex
              data={conveniosPorEstadoData}
              height={240}
              centerLabel="Convenios"
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Avance de proyectos"
            subtitle={`${avanceProyectosData.length} proyectos en ejecución · promedio ${avancePromedioRedondeado}%`}
            icon={TrendingUp}
            accent="emerald"
          />
          <PanelBody
            loading={loading}
            empty={avanceProyectosData.length === 0}
            emptyLabel="No hay proyectos en ejecución"
            minH={260}
          >
            <BarHorizontalApex
              data={avanceProyectosData.map((p) => ({
                ...p,
                color: p.value >= 70 ? APEX_PALETTE.emerald : p.value >= 30 ? APEX_PALETTE.amber : APEX_PALETTE.rose,
              }))}
              height={260}
              valueFormatter={(v) => `${v}%`}
            />
          </PanelBody>
        </Panel>
      </div>

      {/* ─────────── ROW 5: ALERTAS COLUMN + RESUMEN EJECUTIVO ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader
            title="Alertas por prioridad"
            subtitle="Distribución de alertas pendientes"
            icon={AlertTriangle}
            accent="rose"
          />
          <PanelBody
            loading={loading}
            empty={alertasPorPrioridadData.length === 0}
            emptyLabel="No hay alertas pendientes"
            minH={260}
          >
            <ColumnApex data={alertasPorPrioridadData} height={240} valueFormatter={(v) => `${v}`} />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="Resumen ejecutivo"
            subtitle="Indicadores clave del sistema"
            icon={Sparkles}
            accent="indigo"
          />
          <div className="px-5 pb-5">
            <div className="grid grid-cols-2 gap-2.5">
              <ResumenItem
                label="Tasa de ejecución"
                value={`${pctActivos}%`}
                sublabel={`${kpis?.resumen.proyectos_activos ?? 0} proyectos activos`}
                icon={PlayCircle}
                accent="emerald"
                progress={pctActivos}
              />
              <ResumenItem
                label="Alertas pendientes"
                value={kpis?.resumen.alertas_pendientes ?? 0}
                sublabel={`${alertasUrgentes} urgentes`}
                icon={Bell}
                accent={alertasUrgentes > 0 ? 'rose' : 'amber'}
              />
              <ResumenItem
                label="Convenios por vencer"
                value={kpis?.resumen.convenios_por_vencer ?? 0}
                sublabel="Vencen en 30 días"
                icon={Clock}
                accent="amber"
              />
              <ResumenItem
                label="Avance promedio"
                value={`${avancePromedioRedondeado}%`}
                sublabel={`${kpis?.resumen.actividades_atrasadas ?? 0} actividades atrasadas`}
                icon={TrendingUp}
                accent={avancePromedioRedondeado >= 70 ? 'emerald' : avancePromedioRedondeado >= 30 ? 'amber' : 'rose'}
                progress={avancePromedioRedondeado}
              />
              <div className="col-span-2">
                <ResumenItem
                  label="Proyectos activos en el sistema"
                  value={kpis?.resumen.proyectos_activos ?? 0}
                  sublabel={`${totalProyectos} proyectos en total`}
                  icon={FolderKanban}
                  accent="indigo"
                />
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* ─────────── TABLE — DETALLE DE PROYECTOS ─────────── */}
      <div className="bg-white rounded-xl border border-line shadow-sm overflow-hidden">
        <div className="p-5 border-b border-line">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-bg-muted flex items-center justify-center">
              <TableProperties size={20} className="text-ink-muted" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-ink leading-tight">Detalle de Proyectos</h3>
              <p className="text-[12px] text-ink-muted">Listado completo con filtros avanzados</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Estado</label>
              <select
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                className="w-full px-3 py-2 text-[13px] border border-line bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 rounded-btn transition-colors"
              >
                <option value="">Todos</option>
                {Object.entries(ESTADO_PROYECTO_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Tipo</label>
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                className="w-full px-3 py-2 text-[13px] border border-line bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 rounded-btn transition-colors"
              >
                <option value="">Todos</option>
                {Object.entries(TIPO_PROYECTO_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Carrera</label>
              <select
                value={filtros.carrera}
                onChange={(e) => setFiltros({ ...filtros, carrera: e.target.value })}
                className="w-full px-3 py-2 text-[13px] border border-line bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 rounded-btn transition-colors"
              >
                <option value="">Todas</option>
                {carreras.map((c) => (
                  <option key={c.id} value={c.nombre}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Responsable</label>
              <input
                type="text"
                value={filtros.responsable}
                onChange={(e) => setFiltros({ ...filtros, responsable: e.target.value })}
                placeholder="Buscar..."
                className="w-full px-3 py-2 text-[13px] border border-line bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 rounded-btn transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Fecha inicio</label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                className="w-full px-3 py-2 text-[13px] border border-line bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 rounded-btn transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Fecha fin</label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                className="w-full px-3 py-2 text-[13px] border border-line bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 rounded-btn transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFiltros({ ...filtros })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-white text-[13px] font-semibold rounded-btn hover:bg-ink/90 transition-colors"
            >
              <Filter size={13} strokeWidth={2.25} />
              Filtrar
            </button>
            <button
              onClick={handleLimpiarFiltros}
              className="inline-flex items-center gap-2 px-4 py-2 border border-line text-ink text-[13px] font-semibold rounded-btn hover:bg-bg-soft transition-colors"
            >
              <X size={13} strokeWidth={2.25} />
              Limpiar
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleExportarExcel}
                disabled={exportando}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-[13px] font-semibold rounded-btn hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                <FileSpreadsheet size={13} strokeWidth={2.25} />
                Excel
              </button>
              <button
                onClick={handleExportarPDF}
                disabled={exportando}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-700 text-white text-[13px] font-semibold rounded-btn hover:bg-rose-800 transition-colors disabled:opacity-50 shadow-sm"
              >
                <FileText size={13} strokeWidth={2.25} />
                PDF
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-soft border-b border-line">
              <tr>
                <th className="px-4 py-3 text-left text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider">Código</th>
                <th className="px-4 py-3 text-left text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider">Título</th>
                <th className="px-4 py-3 text-left text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider">Carrera</th>
                <th className="px-4 py-3 text-left text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider">Responsable</th>
                <th className="px-4 py-3 text-left text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider">F. Inicio</th>
                <th className="px-4 py-3 text-left text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider">F. Fin</th>
                <th className="px-4 py-3 text-right text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider">Presupuesto</th>
                <th className="px-4 py-3 text-left text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider min-w-[140px]">Avance</th>
                <th className="px-4 py-3 text-center text-[10.5px] font-semibold text-ink-muted uppercase tracking-wider">Part.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {proyectosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-[13px] text-ink-muted">
                    No se encontraron proyectos con los filtros aplicados
                  </td>
                </tr>
              ) : (
                proyectosPaginados.map((p, i) => (
                  <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-bg-soft/50'} hover:bg-emerald-50/40 transition-colors`}>
                    <td className="px-4 py-3 text-[12px] font-mono text-ink-muted">{p.codigo}</td>
                    <td className="px-4 py-3 text-[13px] text-ink font-medium max-w-[250px] truncate" title={p.titulo}>
                      {p.titulo}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-ink-muted">
                      {TIPO_PROYECTO_LABELS[p.tipo] || p.tipo}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge estado={p.estado} />
                    </td>
                    <td className="px-4 py-3 text-[12px] text-ink-muted max-w-[150px] truncate" title={p.carrera || ''}>
                      {p.carrera || '—'}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-ink-muted max-w-[150px] truncate" title={p.responsable_nombre || p.responsable || ''}>
                      {p.responsable_nombre || p.responsable || '—'}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-ink-muted whitespace-nowrap">
                      {formatFecha(p.fecha_inicio)}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-ink-muted whitespace-nowrap">
                      {formatFecha(p.fecha_fin_planificada)}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-ink text-right font-semibold whitespace-nowrap">
                      {formatPresupuesto(p.presupuesto_aprobado)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getProgresoColor(p.progreso)}`}
                            style={{ width: `${Math.min(p.progreso, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-ink w-10 text-right tabular-nums">
                          {p.progreso}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-bg-muted text-[11px] font-semibold text-ink">
                        {p.participantes_count ?? 0}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-line bg-bg-soft">
            <div className="text-[12px] text-ink-muted">
              Mostrando {((paginaActual - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(paginaActual * ITEMS_PER_PAGE, proyectosFiltrados.length)} de {proyectosFiltrados.length} proyectos
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                disabled={paginaActual === 1}
                className="p-2 text-ink-muted hover:bg-bg-muted rounded-btn disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                let pageNum: number
                if (totalPaginas <= 5) {
                  pageNum = i + 1
                } else if (paginaActual <= 3) {
                  pageNum = i + 1
                } else if (paginaActual >= totalPaginas - 2) {
                  pageNum = totalPaginas - 4 + i
                } else {
                  pageNum = paginaActual - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPaginaActual(pageNum)}
                    className={`w-8 h-8 text-[12px] font-semibold rounded-btn transition-colors ${
                      paginaActual === pageNum
                        ? 'bg-ink text-white'
                        : 'text-ink-muted hover:bg-bg-muted'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                disabled={paginaActual === totalPaginas}
                className="p-2 text-ink-muted hover:bg-bg-muted rounded-btn disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   RESUMEN EJECUTIVO — subcomponente
   ───────────────────────────────────────────── */
function ResumenItem({
  label,
  value,
  sublabel,
  icon: Icon,
  accent,
  progress,
}: {
  label: string
  value: string | number
  sublabel?: string
  icon: LucideIcon
  accent: AccentKey
  progress?: number
}) {
  const a = KPI_ACCENT[accent]!
  return (
    <div className="group relative p-3.5 rounded-lg border border-line bg-bg-soft/50 hover:bg-white hover:border-line hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className={`flex items-center justify-center w-8 h-8 rounded-md ${a.bg} ${a.text} flex-shrink-0`}>
          <Icon size={14} strokeWidth={2.25} />
        </div>
        <span className="text-[20px] font-bold text-ink leading-none tracking-tight tabular-nums">
          {value}
        </span>
      </div>
      <p className="text-[12px] font-semibold text-ink leading-tight">{label}</p>
      {sublabel && <p className="text-[10.5px] text-ink-muted mt-0.5 leading-snug">{sublabel}</p>}
      {typeof progress === 'number' && (
        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#F1F5F9' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(Math.max(progress, 0), 100)}%`,
              backgroundColor: a.hex,
            }}
          />
        </div>
      )}
    </div>
  )
}
