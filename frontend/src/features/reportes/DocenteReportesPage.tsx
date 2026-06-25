import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import html2canvas from 'html2canvas'
import {
  FolderKanban,
  TrendingUp,
  Users,
  Wallet,
  RefreshCw,
  Download,
  Sparkles,
  Target,
  BookOpen,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
  ArrowUpRight,
  FileText,
} from 'lucide-react'
import { DonutApex, BarHorizontalApex, SparklineApex, PALETTE } from '@/components/charts/ApexCharts'
import { reportesApi } from '@/api/reportes'
import { Spinner, StatusBadge } from '@/components/ui'
import { showError } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import {
  ESTADO_PROYECTO_LABELS,
  ESTADO_ACTIVIDAD_LABELS,
  TIPO_PROYECTO_LABELS,
} from '@/lib/constants'
import { exportarReporteDocentePDF } from '@/lib/exportarReporteDocente'
import type { ReporteDocentePayload } from '@/types/reporteDocente'

/* ─────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────── */
const fmtCurrency = (n: number): string =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)

const fmtPct = (n: number): string => `${Math.round(n || 0)}%`

const ESTADO_HEX: Record<string, string> = {
  BORRADOR: '#94A3B8',
  EN_REVISION: PALETTE.blue,
  APROBADO: PALETTE.emeraldSoft,
  EN_EJECUCION: PALETTE.emerald,
  EN_SUSPENSION: PALETTE.amber,
  FINALIZADO: PALETTE.ink,
  CERRADO: '#64748B',
  CANCELADO: PALETTE.rose,
}

const ACTIVIDAD_HEX: Record<string, string> = {
  PENDIENTE: '#94A3B8',
  EN_PROCESO: PALETTE.blue,
  COMPLETADA: PALETTE.emerald,
  ATRASADA: PALETTE.rose,
  CANCELADA: '#64748B',
}

const ROL_PARTICIPANTE_LABELS: Record<string, string> = {
  LIDER: 'Líder',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
  APOYO: 'Apoyo',
  EXTERNO: 'Externo',
}

/* ─────────────────────────────────────────────────────────
   Componentes UI locales
   ───────────────────────────────────────────────────────── */
function Panel({
  title,
  subtitle,
  icon: Icon,
  accent = 'indigo',
  right,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  icon?: typeof FolderKanban
  accent?: 'emerald' | 'indigo' | 'amber' | 'rose' | 'blue' | 'violet' | 'slate'
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
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
  label,
  value,
  icon: Icon,
  accent,
  hint,
  sparkline,
  suffix,
}: {
  label: string
  value: string | number
  icon: typeof FolderKanban
  accent: 'emerald' | 'indigo' | 'amber' | 'rose' | 'blue' | 'violet'
  hint?: string
  sparkline?: number[]
  suffix?: string
}) {
  const accents: Record<string, { bg: string; text: string; hex: string; soft: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', hex: PALETTE.emerald, soft: '#D1FAE5' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', hex: PALETTE.indigo, soft: '#E0E7FF' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', hex: PALETTE.amber, soft: '#FEF3C7' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', hex: PALETTE.rose, soft: '#FFE4E6' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', hex: PALETTE.blue, soft: '#DBEAFE' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', hex: PALETTE.violet, soft: '#EDE9FE' },
  }
  const a = accents[accent]!
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40" style={{ background: a.hex }} />
      <div className="relative flex items-center justify-between mb-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.bg} ${a.text}`}>
          <Icon size={20} strokeWidth={2.2} />
        </div>
        {suffix && (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full" style={{ background: a.soft, color: a.hex }}>
            {suffix}
          </span>
        )}
      </div>
      <div className="relative">
        <div className="text-[32px] font-bold tracking-tight text-slate-900 leading-none tabular-nums">
          {value}
        </div>
        <div className="mt-2 text-[12px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
        {hint && <div className="mt-1.5 text-[11.5px] text-slate-500 leading-snug">{hint}</div>}
        {sparkline && sparkline.length > 0 && (
          <div className="mt-3 -mx-1">
            <SparklineApex data={sparkline} color={a.hex} height={42} />
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ message = 'Sin datos para graficar', icon: Icon = Sparkles }: { message?: string; icon?: typeof Sparkles }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 mb-3">
        <Icon size={20} className="text-slate-300" />
      </div>
      <p className="text-[12.5px] text-slate-400">{message}</p>
    </div>
  )
}

function ProgressRing({ value, size = 56, stroke = 6, color = PALETTE.emerald }: { value: number; size?: number; stroke?: number; color?: string }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="#E2E8F0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums" style={{ color }}>
        {Math.round(value)}%
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Página principal
   ───────────────────────────────────────────────────────── */
export default function DocenteReportesPage() {
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [data, setData] = useState<ReporteDocentePayload | null>(null)

  const chartRefs = {
    avance: useRef<HTMLDivElement>(null),
    estados: useRef<HTMLDivElement>(null),
    presupuesto: useRef<HTMLDivElement>(null),
    equipo: useRef<HTMLDivElement>(null),
    actividades: useRef<HTMLDivElement>(null),
    objetivos: useRef<HTMLDivElement>(null),
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await reportesApi.docente()
      setData(res.data.data)
    } catch (err) {
      console.error(err)
      showError('No se pudieron cargar tus reportes', 'Intenta nuevamente en unos segundos')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExportarPDF = useCallback(async () => {
    if (!data || exportando) return
    setExportando(true)
    try {
      const captures: Record<string, string> = {}
      await Promise.all(
        Object.entries(chartRefs).map(async ([key, ref]) => {
          if (ref.current) {
            const canvas = await html2canvas(ref.current, {
              scale: 2,
              backgroundColor: '#ffffff',
              useCORS: true,
            })
            captures[key] = canvas.toDataURL('image/png')
          }
        })
      )
      await exportarReporteDocentePDF(data, user, captures)
    } catch (err) {
      console.error(err)
      showError('Error al generar el PDF', 'No se pudieron capturar las gráficas')
    } finally {
      setExportando(false)
    }
  }, [data, user, exportando])

  /* ─────────── Derivados memoizados ─────────── */
  const kpis = data?.kpis
  const proyectos = data?.proyectos ?? []

  const proyectosPorEstado = useMemo(() => {
    const counts: Record<string, number> = {}
    proyectos.forEach((p) => { counts[p.estado] = (counts[p.estado] || 0) + 1 })
    return Object.entries(counts).map(([estado, value]) => ({
      name: ESTADO_PROYECTO_LABELS[estado] || estado,
      value,
      color: ESTADO_HEX[estado] || PALETTE.slate,
    }))
  }, [proyectos])

  const avancePorProyecto = useMemo(() => {
    return proyectos
      .filter((p) => p.estado !== 'BORRADOR' && p.estado !== 'CANCELADO')
      .map((p) => ({
        name: p.codigo,
        value: Math.round(p.progreso || 0),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [proyectos])

  const actividadesPorEstado = useMemo(() => {
    return (data?.actividades_por_estado || []).map((a) => ({
      name: ESTADO_ACTIVIDAD_LABELS[a.estado] || a.estado,
      value: a.total,
      color: ACTIVIDAD_HEX[a.estado] || PALETTE.slate,
    }))
  }, [data])

  const presupuestoDistribucion = useMemo(() => {
    const d = data?.presupuesto_detalle
    if (!d) return []
    return [
      { name: 'Ejecutado', value: d.ejecutado, color: PALETTE.emerald },
      { name: 'Saldo disponible', value: d.saldo, color: PALETTE.indigo },
    ]
  }, [data])

  const participantesPorRol = useMemo(() => {
    return (data?.participantes_por_rol || []).map((p) => ({
      name: ROL_PARTICIPANTE_LABELS[p.rol] || p.rol,
      value: p.total,
    }))
  }, [data])

  const objetivosPct = useMemo(() => {
    const total = kpis?.total_objetivos || 0
    if (total === 0) return 0
    return Math.round(((kpis?.objetivos_cumplidos || 0) / total) * 100)
  }, [kpis])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-[12px] text-slate-500">Cargando tu portafolio docente…</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md">
          <p className="text-slate-700 font-semibold mb-1">No pudimos cargar tus reportes</p>
          <p className="text-slate-500 text-sm mb-4">Verifica tu conexión e inténtalo de nuevo.</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          >
            <RefreshCw size={14} /> Reintentar
          </button>
        </div>
      </div>
    )
  }

  const sinProyectos = proyectos.length === 0

  return (
    <div className="space-y-6 pb-10">
      {/* ═══════════ HEADER MINIMALISTA ═══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-none border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reportes</h1>
          <p className="text-xs text-slate-500 mt-0.5">Descarga tu portafolio docente en PDF con las gráficas actualizadas.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            title="Actualizar"
            className="inline-flex items-center justify-center w-9 h-9 rounded-none border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleExportarPDF}
            disabled={exportando || sinProyectos}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            {exportando ? 'Generando…' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      {/* ═══════════ ROW 1: KPIs ═══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Mi portafolio"
          value={kpis?.total_proyectos ?? 0}
          icon={FolderKanban}
          accent="emerald"
          suffix="Proyectos"
          hint={`${kpis?.proyectos_en_ejecucion ?? 0} en ejecución · ${kpis?.proyectos_finalizados ?? 0} finalizados`}
          sparkline={avancePorProyecto.map((p) => p.value)}
        />
        <KpiCard
          label="Avance promedio"
          value={fmtPct(kpis?.avance_promedio ?? 0)}
          icon={TrendingUp}
          accent="indigo"
          suffix="Global"
          hint={`${kpis?.actividades_completadas ?? 0} actividades completadas de ${kpis?.total_actividades ?? 0}`}
          sparkline={avancePorProyecto.map((p) => p.value)}
        />
        <KpiCard
          label="Equipos de trabajo"
          value={kpis?.total_participantes ?? 0}
          icon={Users}
          accent="blue"
          suffix="Personas"
          hint={`${kpis?.total_objetivos ?? 0} objetivos · ${objetivosPct}% logrados`}
        />
        <KpiCard
          label="Presupuesto aprobado"
          value={fmtCurrency(kpis?.presupuesto_aprobado ?? 0)}
          icon={Wallet}
          accent="amber"
          suffix="USD"
          hint={`${fmtCurrency(kpis?.presupuesto_ejecutado ?? 0)} ejecutado · ${fmtCurrency(kpis?.presupuesto_saldo ?? 0)} disponible`}
        />
      </div>

      {/* ═══════════ ROW 2: AVANCE + ESTADO ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2" ref={chartRefs.avance}>
          <Panel
            title="Avance por proyecto"
            subtitle="% de ejecución por código (máx. 10)"
            icon={BarChart3}
            accent="emerald"
          >
            {avancePorProyecto.length > 0 ? (
              <BarHorizontalApex
                data={avancePorProyecto.map((p) => ({
                  ...p,
                  color: p.value >= 70 ? PALETTE.emerald : p.value >= 30 ? PALETTE.amber : PALETTE.rose,
                }))}
                height={240}
                valueFormatter={(v) => `${v}%`}
              />
            ) : (
              <EmptyState message="Sin proyectos en ejecución" icon={BarChart3} />
            )}
          </Panel>
        </div>

        <div ref={chartRefs.estados}>
          <Panel
            title="Proyectos por estado"
            subtitle="Distribución actual"
            icon={PieIcon}
            accent="indigo"
          >
            {proyectosPorEstado.length > 0 ? (
<DonutApex data={proyectosPorEstado} 
height={240}  centerLabel="Proyectos" />
            ) : (
              <EmptyState message="Sin proyectos" />
            )}
          </Panel>
        </div>
      </div>

      {/* ═══════════ ROW 3: PRESUPUESTO + EQUIPO ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div ref={chartRefs.presupuesto}>
          <Panel
            title="Mi presupuesto"
            subtitle="Ejecución y saldo disponible"
            icon={Wallet}
            accent="amber"
            right={
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                {fmtPct(((kpis?.presupuesto_ejecutado ?? 0) / Math.max(1, kpis?.presupuesto_aprobado ?? 0)) * 100)} ejecutado
              </span>
            }
          >
            {presupuestoDistribucion.some((p) => p.value > 0) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <DonutApex data={presupuestoDistribucion} height={240} centerLabel="USD" />
                <div className="space-y-3">
                  <Stat
                    icon={Wallet}
                    accent="emerald"
                    label="Aprobado"
                    value={fmtCurrency(kpis?.presupuesto_aprobado ?? 0)}
                  />
                  <Stat
                    icon={TrendingUp}
                    accent="indigo"
                    label="Ejecutado"
                    value={fmtCurrency(kpis?.presupuesto_ejecutado ?? 0)}
                  />
                  <Stat
                    icon={Wallet}
                    accent="amber"
                    label="Saldo disponible"
                    value={fmtCurrency(kpis?.presupuesto_saldo ?? 0)}
                  />
                </div>
              </div>
            ) : (
              <EmptyState message="Aún no hay presupuesto asignado" icon={Wallet} />
            )}
          </Panel>
        </div>

        <div ref={chartRefs.equipo}>
          <Panel
            title="Mi equipo"
            subtitle="Participantes y su rol en los proyectos"
            icon={Users}
            accent="blue"
          >
            {participantesPorRol.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <DonutApex
                  data={participantesPorRol.map((p, i) => ({
                    ...p,
                    color: [PALETTE.blue, PALETTE.indigo, PALETTE.violet, PALETTE.sky, PALETTE.amber, PALETTE.emerald][i % 6]!,
                  }))}
                  height={240}
                  centerLabel="Personas"
                />
                <div className="space-y-2">
                  {participantesPorRol.map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between text-[12.5px] py-1.5 border-b border-slate-100 last:border-0">
                      <span className="flex items-center gap-2 text-slate-700">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: [PALETTE.blue, PALETTE.indigo, PALETTE.violet, PALETTE.sky, PALETTE.amber, PALETTE.emerald][i % 6] }}
                        />
                        {p.name}
                      </span>
                      <span className="font-bold text-slate-900 tabular-nums">{p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState message="Sin participantes asignados" icon={Users} />
            )}
          </Panel>
        </div>
      </div>

      {/* ═══════════ ROW 4: ACTIVIDADES + OBJETIVOS ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div ref={chartRefs.actividades}>
          <Panel
            title="Estado de mis actividades"
            subtitle="Distribución por estado actual"
            icon={CheckCircle2}
            accent="emerald"
          >
            {actividadesPorEstado.length > 0 ? (
<DonutApex data={actividadesPorEstado} 
height={240}  centerLabel="Actividades" />
            ) : (
              <EmptyState message="Sin actividades registradas" icon={CheckCircle2} />
            )}
          </Panel>
        </div>

        <div ref={chartRefs.objetivos}>
          <Panel
            title="Mis objetivos"
            subtitle="Cumplimiento de objetivos del marco lógico"
            icon={Target}
            accent="violet"
          >
            <div className="flex flex-col items-center justify-center py-3">
              <ProgressRing value={objetivosPct} size={150} stroke={14} color={PALETTE.emerald} />
              <p className="text-[12.5px] text-slate-500 mt-4 text-center">
                <span className="font-bold text-slate-900">{kpis?.objetivos_cumplidos ?? 0}</span> de{' '}
                <span className="font-bold text-slate-900">{kpis?.total_objetivos ?? 0}</span> objetivos cumplidos
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-center">
                <p className="text-[20px] font-bold text-emerald-700 tabular-nums">{kpis?.objetivos_cumplidos ?? 0}</p>
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-emerald-600">Cumplidos</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-[20px] font-bold text-slate-700 tabular-nums">{kpis?.objetivos_pendientes ?? 0}</p>
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">Pendientes</p>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* ═══════════ ROW 5: TABLA DE PROYECTOS ═══════════ */}
      <Panel
        title="Detalle de mis proyectos"
        subtitle={`${proyectos.length} proyectos en tu portafolio`}
        icon={FileText}
        accent="slate"
        right={
          <Link
            to="/docente/proyectos"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 hover:text-emerald-800 transition"
          >
            Ver todos
            <ArrowUpRight size={13} />
          </Link>
        }
      >
        {proyectos.length > 0 ? (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5">Código</th>
                  <th className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5">Proyecto</th>
                  <th className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5">Estado</th>
                  <th className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5">Tipo</th>
                  <th className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5 hidden md:table-cell">Carrera</th>
                  <th className="text-right text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5 hidden lg:table-cell">Avance</th>
                  <th className="text-right text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2.5 hidden lg:table-cell">$</th>
                </tr>
              </thead>
              <tbody>
                {proyectos.slice(0, 12).map((p, i) => (
                  <tr key={p.id} className={`border-b border-slate-100 transition-colors hover:bg-emerald-50/40 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                    <td className="px-3 py-3">
                      <Link to={`/docente/proyectos/${p.id}`} className="font-mono text-[11.5px] font-semibold text-slate-700 hover:text-emerald-700">
                        {p.codigo}
                      </Link>
                    </td>
                    <td className="px-3 py-3 max-w-[280px]">
                      <p className="text-[13px] font-semibold text-slate-900 truncate" title={p.titulo}>
                        {p.titulo}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge estado={p.estado} />
                    </td>
                    <td className="px-3 py-3 text-[12px] text-slate-600">
                      {TIPO_PROYECTO_LABELS[p.tipo] || p.tipo}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-slate-600 hidden md:table-cell max-w-[150px] truncate" title={p.carrera || ''}>
                      {p.carrera || '—'}
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, p.progreso)}%`,
                              background: p.progreso >= 70 ? PALETTE.emerald : p.progreso >= 30 ? PALETTE.amber : PALETTE.rose,
                            }}
                          />
                        </div>
                        <span className="text-[11.5px] font-bold tabular-nums text-slate-700 w-9 text-right">
                          {Math.round(p.progreso)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-[12px] font-semibold text-slate-700 hidden lg:table-cell tabular-nums">
                      {fmtCurrency(Number(p.presupuesto_aprobado || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Aún no tienes proyectos" icon={BookOpen} />
        )}
      </Panel>

      {/* Footer inspiracional */}
      <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-5 py-4 flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <Sparkles size={16} />
        </div>
        <div>
          <p className="text-[12.5px] font-semibold text-emerald-900">Sigue así</p>
          <p className="text-[12px] text-emerald-800/80 mt-0.5">
            {kpis?.actividades_atrasadas
              ? `Tienes ${kpis.actividades_atrasadas} actividad(es) atrasada(s). Considera actualizar sus avances para mantener al día tu portafolio.`
              : 'No tienes actividades atrasadas. ¡Excelente trabajo manteniendo tu portafolio al día!'}
          </p>
        </div>
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  accent,
  label,
  value,
}: {
  icon: typeof FolderKanban
  accent: 'emerald' | 'indigo' | 'amber' | 'rose' | 'blue' | 'violet'
  label: string
  value: string
}) {
  const accents: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700' },
  }
  const a = accents[accent]!
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.bg} ${a.text}`}>
        <Icon size={14} strokeWidth={2.3} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-[14px] font-bold text-slate-900 tabular-nums truncate">{value}</p>
      </div>
    </div>
  )
}
