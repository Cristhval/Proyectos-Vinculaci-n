import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Navigate } from 'react-router-dom'
import {
  FolderKanban,
  PlayCircle,
  FileSignature,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Eye,
  Users,
  TrendingUp,
  RefreshCw,
  TableProperties,
  FileSpreadsheet,
  FileText,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LabelList,
} from 'recharts'
import { reportesApi } from '@/api/reportes'
import { carrerasApi } from '@/api/usuarios'
import { participantesApi } from '@/api/proyectos'
import { alertasApi } from '@/api/seguimiento'
import { Spinner, StatusBadge } from '@/components/ui'
import {
  ESTADO_PROYECTO_LABELS,
  TIPO_PROYECTO_LABELS,
  ESTADO_CONVENIO_LABELS,
  PRIORIDAD_ALERTA_LABELS,
  TIPO_PROYECTO_COLORS,
} from '@/lib/constants'
import { exportarExcel, exportarPDF } from '@/lib/exportarReportes'
import { useAuthStore } from '@/store/authStore'
import type { DashboardKPIs, ReporteProyecto, ReporteConvenio } from '@/types/reportes'
import type { Carrera } from '@/types/usuarios'

const PERIODOS = [
  { value: '', label: 'Todo el tiempo' },
  { value: 'year', label: 'Este año' },
  { value: 'semester', label: 'Este semestre' },
  { value: 'month', label: 'Este mes' },
]

const MOCK_KPI: DashboardKPIs = {
  resumen: { proyectos_activos: 24, proyectos_finalizados: 18, actividades_atrasadas: 5, convenios_activos: 12, convenios_por_vencer: 3, alertas_pendientes: 9, compromisos_pendientes: 7 },
  proyectos_por_estado: [
    { estado: 'BORRADOR', total: 8 }, { estado: 'EN_REVISION', total: 6 }, { estado: 'APROBADO', total: 4 },
    { estado: 'EN_EJECUCION', total: 24 }, { estado: 'EN_SUSPENSION', total: 2 }, { estado: 'FINALIZADO', total: 18 }, { estado: 'CERRADO', total: 3 },
  ],
  proyectos_por_tipo: [
    { tipo: 'VINCULACION', total: 28 }, { tipo: 'INVESTIGACION', total: 15 }, { tipo: 'EXTENSION', total: 10 }, { tipo: 'MIXTO', total: 12 },
  ],
  actividades_por_estado: [
    { estado: 'PENDIENTE', total: 45 }, { estado: 'EN_PROCESO', total: 32 }, { estado: 'COMPLETADA', total: 78 }, { estado: 'ATRASADA', total: 5 },
  ],
}

const MOCK_CARRERAS: Array<{ name: string; value: number }> = [
  { name: 'Ingeniería en Sistemas', value: 18 }, { name: 'Ingeniería Civil', value: 12 },
  { name: 'Administración', value: 15 }, { name: 'Derecho', value: 8 },
  { name: 'Educación', value: 10 }, { name: 'Enfermería', value: 6 },
]

const MOCK_CONVENIOS: Array<{ estado: string; total: number }> = [
  { estado: 'VIGENTE', total: 12 }, { estado: 'EN_REVISION', total: 4 },
  { estado: 'FINALIZADO', total: 8 }, { estado: 'VENCIDO', total: 2 }, { estado: 'SUSPENDIDO', total: 1 },
]

const MOCK_ALERTAS: Array<{ prioridad: string; total: number }> = [
  { prioridad: 'BAJA', total: 3 }, { prioridad: 'MEDIA', total: 4 }, { prioridad: 'ALTA', total: 5 }, { prioridad: 'URGENTE', total: 2 },
]

const MOCK_AVANCE: Array<{ nombre: string; avance: number }> = [
  { nombre: 'Proyecto de vinculación comunitaria', avance: 15 }, { nombre: 'Investigación en energías renovables', avance: 28 },
  { nombre: 'Extensión rural educativa', avance: 42 }, { nombre: 'Desarrollo software gestión municipal', avance: 55 },
  { nombre: 'Plan de mejora continua institucional', avance: 68 }, { nombre: 'Estudio impacto ambiental local', avance: 75 },
  { nombre: 'Programa alfabetización digital', avance: 82 }, { nombre: 'Capacitación técnica agropecuaria', avance: 91 },
]

const ESTADO_PROYECTO_COLORES: Record<string, string> = {
  BORRADOR: '#9CA3AF',
  EN_REVISION: '#60A5FA',
  APROBADO: '#34D399',
  EN_EJECUCION: '#16A34A',
  EN_SUSPENSION: '#EAB308',
  FINALIZADO: '#065F46',
  CERRADO: '#374151',
  CANCELADO: '#F87171',
}

const TIPO_PROYECTO_COLORES: Record<string, string> = {
  VINCULACION: '#16A34A',
  INVESTIGACION: '#3B82F6',
  EXTENSION: '#F59E0B',
  MIXTO: '#8B5CF6',
}

const ESTADO_CONVENIO_COLORES: Record<string, string> = {
  BORRADOR: '#9CA3AF',
  EN_REVISION: '#60A5FA',
  VIGENTE: '#16A34A',
  VENCIDO: '#F87171',
  SUSPENDIDO: '#EAB308',
  FINALIZADO: '#065F46',
  CANCELADO: '#DC2626',
}

const PRIORIDAD_ALERTA_COLORES: Record<string, string> = {
  BAJA: '#60A5FA',
  MEDIA: '#EAB308',
  ALTA: '#F97316',
  URGENTE: '#EF4444',
}

const ITEMS_PER_PAGE = 20

interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  loading?: boolean
  empty?: boolean
}

const ChartTooltipContent = memo(function ChartTooltipContent(props: any) {
  const { active, payload, label } = props
  if (active && payload && payload.length) {
    const item = payload[0]
    return (
      <div style={{ background: '#0A0A0A', border: 'none', borderRadius: 4, padding: '8px 12px', color: 'white', fontSize: 12 }}>
        <div className="flex items-center gap-2 mb-1">
          {item.payload?.fill && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.payload.fill }} />}
          <span style={{ fontWeight: 500 }}>{label || item.name}</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{item.value}</span>
      </div>
    )
  }
  return null
})

const ChartCard = memo(function ChartCard({ title, subtitle, children, loading, empty }: ChartCardProps) {
  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] flex flex-col" style={{ padding: '20px 24px' }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: 200 }}>
        {loading ? (
          <div className="w-full space-y-3 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-3/4" />
            <div className="h-32 bg-slate-50 rounded" />
            <div className="h-4 bg-slate-100 rounded w-1/2" />
          </div>
        ) : empty ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <FolderKanban size={20} className="text-slate-300" />
            </div>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Sin datos disponibles</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
})

interface DonutChartProps {
  data: Array<{ name: string; value: number; fill: string }>
  total: number
  centerLabel?: string
}

const DonutChart = memo(function DonutChart({ data, total, centerLabel }: DonutChartProps) {
  const sortedData = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data])

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={sortedData}
          cx="35%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          animationBegin={0}
          animationDuration={800}
          cornerRadius={4}
          stroke="none"
        >
          {sortedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltipContent />} />
        <text x="35%" y="44%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 28, fontWeight: 700, fill: '#0A0A0A' }}>
          {total}
        </text>
        {centerLabel && (
          <text x="35%" y="58%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 12, fill: '#9CA3AF' }}>
            {centerLabel}
          </text>
        )}
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          content={(props: any) => {
            if (!props?.payload) return null
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16 }}>
                {props.payload.map((entry: any, index: number) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{entry.value}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0A0A0A' }}>{sortedData[index]?.value ?? ''}</span>
                  </div>
                ))}
              </div>
            )
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
})

interface HorizontalBarChartProps {
  data: Array<{ name: string; value: number; fill: string }>
}

const HorizontalBarChart = memo(function HorizontalBarChart({ data }: HorizontalBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 50)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 50, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 13, fill: '#374151' }}
          axisLine={false}
          tickLine={false}
          width={100}
        />
        <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'rgba(22,163,74,0.05)' }} />
        <Bar dataKey="value" barSize={28} radius={[0, 4, 4, 0]} animationDuration={800} background={{ fill: '#F3F4F6', radius: 4 }}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
          <LabelList dataKey="value" position="right" style={{ fontSize: 12, fontWeight: 600, fill: '#374151' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
})

interface VerticalBarChartProps {
  data: Array<{ name: string; value: number; fill: string }>
  barSize?: number
  rotateLabels?: boolean
}

const VerticalBarChart = memo(function VerticalBarChart({ data, barSize = 40, rotateLabels }: VerticalBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: rotateLabels ? 60 : 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F9FAFB" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
          angle={rotateLabels ? -35 : 0}
          textAnchor={rotateLabels ? 'end' : 'middle'}
          height={rotateLabels ? 70 : 30}
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'rgba(22,163,74,0.05)' }} />
        <Bar dataKey="value" barSize={barSize} radius={[4, 4, 0, 0]} animationDuration={800}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
          <LabelList dataKey="value" position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#374151' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
})

interface AvanceBarChartProps {
  data: Array<{ name: string; value: number }>
}

const getAvanceColor = (value: number): string => {
  if (value < 25) return '#EF4444'
  if (value <= 50) return '#F97316'
  if (value <= 75) return '#EAB308'
  return '#16A34A'
}

const AvanceTooltipContent = memo(function AvanceTooltipContent(props: any) {
  const { active, payload, label } = props
  if (active && payload && payload.length) {
    const value = payload[0].value
    const color = getAvanceColor(value)
    return (
      <div style={{ background: '#0A0A0A', border: 'none', borderRadius: 4, padding: '8px 12px', color: 'white', fontSize: 12 }}>
        <p style={{ fontWeight: 500, marginBottom: 4, margin: '0 0 4px' }}>{label}</p>
        <span style={{ fontWeight: 700, fontSize: 14, color }}>{value}% avance</span>
      </div>
    )
  }
  return null
})

const AvanceBarChart = memo(function AvanceBarChart({ data }: AvanceBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 42)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 55, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
          width={130}
        />
        <Tooltip content={<AvanceTooltipContent />} cursor={{ fill: 'rgba(22,163,74,0.05)' }} />
        <Bar dataKey="value" barSize={24} radius={[0, 4, 4, 0]} animationDuration={800} background={{ fill: '#F3F4F6', radius: 4 }}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getAvanceColor(entry.value)} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v: number) => `${v}%`}
            style={{ fontSize: 12, fontWeight: 700, fill: '#374151' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
})

interface KPICardProps {
  value: string | number
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  accent: 'slate' | 'emerald' | 'blue' | 'amber' | 'rose' | 'indigo' | 'violet' | 'teal'
  subtext?: string
  subtextColor?: string
}

const ACCENT_STYLES: Record<string, { bg: string; text: string; hex: string }> = {
  slate:   { bg: 'bg-slate-100',   text: 'text-slate-700',   hex: '#0F172A' },
  emerald: { bg: 'bg-emerald-50',  text: 'text-emerald-600', hex: '#16A34A' },
  blue:    { bg: 'bg-blue-50',     text: 'text-blue-600',    hex: '#2563EB' },
  amber:   { bg: 'bg-amber-50',    text: 'text-amber-600',   hex: '#EAB308' },
  rose:    { bg: 'bg-rose-50',     text: 'text-rose-600',    hex: '#DC2626' },
  indigo:  { bg: 'bg-indigo-50',   text: 'text-indigo-600',  hex: '#4F46E5' },
  violet:  { bg: 'bg-violet-50',   text: 'text-violet-600',  hex: '#7C3AED' },
  teal:    { bg: 'bg-teal-50',     text: 'text-teal-600',    hex: '#0D9488' },
}

const KPICard = memo(function KPICard({ value, label, icon: Icon, accent, subtext, subtextColor = 'text-slate-500' }: KPICardProps) {
  const a = ACCENT_STYLES[accent]!
  return (
    <div className="group relative overflow-hidden py-4 px-5 transition-colors duration-300 hover:bg-slate-50">
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${a.bg} ${a.text} transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={16} strokeWidth={2.25} />
        </div>
      </div>
      <div className="text-2xl font-bold tracking-tight text-slate-900 transition-transform duration-300 group-hover:-translate-y-0.5">
        {value}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div 
          className="h-px w-3 transition-all duration-300 group-hover:w-6"
          style={{ backgroundColor: a.hex, opacity: 0.5 }}
        />
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {label}
        </span>
      </div>
      {subtext && (
        <p className={`text-[11px] font-medium mt-1.5 ${subtextColor}`}>{subtext}</p>
      )}
      <div 
        className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 transition-transform duration-300 group-hover:scale-x-100 origin-left"
        style={{ backgroundColor: a.hex }}
      />
    </div>
  )
})

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
  const [carrera, setCarrera] = useState('')
  const [totalParticipantes, setTotalParticipantes] = useState(0)
  const [alertasUrgentes, setAlertasUrgentes] = useState(0)
  const [avancePromedio, setAvancePromedio] = useState(0)
  const [proyectosPorCarrera, setProyectosPorCarrera] = useState<Array<{ name: string; value: number }>>([])
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
      const [dashRes, carrerasRes, partRes, urgRes, progRes, conveniosRes, alertasRes, proyectosEjecRes, todosProyectosRes] = await Promise.all([
        reportesApi.dashboard().catch(() => null),
        carrerasApi.list({ page_size: '100' }).catch(() => null),
        participantesApi.list({ page_size: '1' }).catch(() => null),
        alertasApi.list({ estado: 'PENDIENTE', prioridad: 'URGENTE', page_size: '1' }).catch(() => null),
        reportesApi.progreso().catch(() => null),
        reportesApi.convenios().catch(() => null),
        alertasApi.list({ estado: 'PENDIENTE', page_size: '500' }).catch(() => null),
        reportesApi.proyectos({ estado: 'EN_EJECUCION', page_size: '50' }).catch(() => null),
        reportesApi.proyectos({ page_size: '500' }).catch(() => null),
      ])

      const dashData = dashRes?.data?.data
      if (dashData && (dashData.proyectos_por_estado?.length > 0 || dashData.proyectos_por_tipo?.length > 0)) {
        setKpis(dashData)
      } else {
        setKpis(MOCK_KPI)
      }

      const carrerasList = carrerasRes?.data?.results || []
      setCarreras(carrerasList)
      setTotalParticipantes(partRes?.data?.count ?? 48)
      setAlertasUrgentes(urgRes?.data?.count ?? 2)

      const actividades = (progRes?.data?.data || []).flatMap((p) =>
        (p.actividades || []).map((a) => parseFloat(a.porcentaje_ejecucion) || 0),
      )
      setAvancePromedio(actividades.length > 0 ? actividades.reduce((s, v) => s + v, 0) / actividades.length : 56)

      const todosProyectos = todosProyectosRes?.data?.data || []
      setProyectosTabla(todosProyectos)

      const carreraCounts: Array<{ name: string; value: number }> = []
      if (todosProyectos.length > 0 && carrerasList.length > 0) {
        const countsByCarrera: Record<string, number> = {}
        todosProyectos.forEach((p) => {
          if (p.carrera) {
            countsByCarrera[p.carrera] = (countsByCarrera[p.carrera] || 0) + 1
          }
        })
        carrerasList.forEach((c) => {
          const count = countsByCarrera[c.nombre] || 0
          if (count > 0) {
            carreraCounts.push({
              name: c.nombre.length > 20 ? c.nombre.substring(0, 18) + '...' : c.nombre,
              value: count,
            })
          }
        })
      }
      setProyectosPorCarrera(carreraCounts.length > 0 ? carreraCounts : MOCK_CARRERAS)

      const conveniosList = conveniosRes?.data?.data || []
      if (conveniosList.length > 0) {
        const convenioEstadoCounts: Record<string, number> = {}
        conveniosList.forEach((c: { estado: string }) => {
          convenioEstadoCounts[c.estado] = (convenioEstadoCounts[c.estado] || 0) + 1
        })
        setConveniosPorEstado(Object.entries(convenioEstadoCounts).map(([estado, total]) => ({ estado, total })))
        setConveniosTabla(conveniosList)
      } else {
        setConveniosPorEstado(MOCK_CONVENIOS)
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
        setAlertasPorPrioridad(MOCK_ALERTAS)
      }

      const proyectosEjecData = proyectosEjecRes?.data?.data || []
      if (proyectosEjecData.length > 0) {
        const avanceArr = proyectosEjecData
          .map((p: { titulo: string; progreso: number }) => ({
            nombre: p.titulo.length > 25 ? p.titulo.substring(0, 23) + '...' : p.titulo,
            avance: Math.round(p.progreso || 0),
          }))
          .sort((a: { avance: number }, b: { avance: number }) => a.avance - b.avance)
          .slice(0, 10)
        setAvanceProyectos(avanceArr)
      } else {
        setAvanceProyectos(MOCK_AVANCE)
      }
    } catch {
      setKpis(MOCK_KPI)
      setProyectosPorCarrera(MOCK_CARRERAS)
      setConveniosPorEstado(MOCK_CONVENIOS)
      setAlertasPorPrioridad(MOCK_ALERTAS)
      setAvanceProyectos(MOCK_AVANCE)
      setTotalParticipantes(48)
      setAlertasUrgentes(2)
      setAvancePromedio(56)
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

  const handleLimpiarFiltros = () => {
    setFiltros(filtrosIniciales)
  }

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

  const totalProyectos = useMemo(() =>
    kpis ? kpis.proyectos_por_estado.reduce((sum, e) => sum + e.total, 0) : 0,
  [kpis])

  const proyectosEnEjecucion = useMemo(() =>
    kpis ? (kpis.proyectos_por_estado.find((e) => e.estado === 'EN_EJECUCION')?.total ?? 0) : 0,
  [kpis])

  const proyectosEnRevision = useMemo(() =>
    kpis ? (kpis.proyectos_por_estado.find((e) => e.estado === 'EN_REVISION')?.total ?? 0) : 0,
  [kpis])

  const pctActivos = useMemo(() =>
    totalProyectos > 0 && kpis ? Math.round((kpis.resumen.proyectos_activos / totalProyectos) * 100) : 0,
  [totalProyectos, kpis])

  const proyectosPorEstadoData = useMemo(() =>
    kpis
      ? kpis.proyectos_por_estado.map((e) => ({
          name: ESTADO_PROYECTO_LABELS[e.estado] || e.estado,
          value: e.total,
          fill: ESTADO_PROYECTO_COLORES[e.estado] || '#9CA3AF',
        }))
      : [],
  [kpis])

  const proyectosPorTipoData = useMemo(() =>
    kpis
      ? kpis.proyectos_por_tipo.map((t) => ({
          name: TIPO_PROYECTO_LABELS[t.tipo] || t.tipo,
          value: t.total,
          fill: TIPO_PROYECTO_COLORES[t.tipo] || '#9CA3AF',
        }))
      : [],
  [kpis])

  const conveniosPorEstadoData = useMemo(() =>
    conveniosPorEstado.map((c) => ({
      name: ESTADO_CONVENIO_LABELS[c.estado] || c.estado,
      value: c.total,
      fill: ESTADO_CONVENIO_COLORES[c.estado] || '#9CA3AF',
    })),
  [conveniosPorEstado])

  const totalConvenios = useMemo(() =>
    conveniosPorEstado.reduce((sum, c) => sum + c.total, 0),
  [conveniosPorEstado])

  const alertasPorPrioridadData = useMemo(() =>
    alertasPorPrioridad.map((a) => ({
      name: PRIORIDAD_ALERTA_LABELS[a.prioridad] || a.prioridad,
      value: a.total,
      fill: PRIORIDAD_ALERTA_COLORES[a.prioridad] || '#9CA3AF',
    })),
  [alertasPorPrioridad])

  const avanceProyectosData = useMemo(() =>
    avanceProyectos.map((p) => ({
      name: p.nombre,
      value: p.avance,
    })),
  [avanceProyectos])

  const formatFecha = useCallback((fecha: string | null): string => {
    if (!fecha) return '—'
    try {
      const d = new Date(fecha)
      return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
    if (progreso < 30) return 'bg-red-500'
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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink tracking-tight">Reportes y Estadísticas</h1>
          <p className="mt-1 text-sm text-ink-muted">Resumen general del sistema de vinculación</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-ink-muted">Período</label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full px-3 py-2 border border-line text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#16A34A] focus:border-[#16A34A] rounded-btn"
            >
              {PERIODOS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-ink-muted">Carrera</label>
            <select
              value={carrera}
              onChange={(e) => setCarrera(e.target.value)}
              className="w-full px-3 py-2 border border-line text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#16A34A] focus:border-[#16A34A] rounded-btn min-w-[180px]"
            >
              <option value="">Todas las carreras</option>
              {carreras.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-white text-sm font-medium rounded-btn hover:bg-ink/90 transition-colors"
          >
            <RefreshCw size={14} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-t border-b border-slate-200 overflow-hidden bg-white [&>*:not(:nth-child(-n+1):nth-last-child(n+4)):not(:last-child)]:border-r [&>*:not(:nth-child(-n+1):nth-last-child(n+4)):not(:last-child)]:border-slate-200 [&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-slate-200">
        <KPICard
          value={totalProyectos}
          label="proyectos registrados"
          icon={FolderKanban}
          accent="slate"
          subtext={`${proyectosEnEjecucion} en ejecución`}
          subtextColor="text-emerald-600"
        />
        <KPICard
          value={kpis?.resumen.proyectos_activos ?? 0}
          label="en ejecución"
          icon={PlayCircle}
          accent="emerald"
          subtext={`${pctActivos}% del total`}
          subtextColor="text-emerald-600"
        />
        <KPICard
          value={kpis?.resumen.convenios_activos ?? 0}
          label="convenios vigentes"
          icon={FileSignature}
          accent="blue"
          subtext={
            (kpis?.resumen.convenios_por_vencer ?? 0) > 0
              ? `${kpis?.resumen.convenios_por_vencer} por vencer`
              : 'Sin próximos a vencer'
          }
          subtextColor={(kpis?.resumen.convenios_por_vencer ?? 0) > 0 ? 'text-amber-600' : 'text-slate-400'}
        />
        <KPICard
          value={kpis?.resumen.alertas_pendientes ?? 0}
          label="alertas pendientes"
          icon={Bell}
          accent="amber"
          subtext={
            alertasUrgentes > 0
              ? `${alertasUrgentes} urgentes`
              : 'Sin urgentes'
          }
          subtextColor={alertasUrgentes > 0 ? 'text-rose-600' : 'text-slate-400'}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-t border-b border-slate-200 overflow-hidden bg-white [&>*:not(:nth-child(-n+1):nth-last-child(n+4)):not(:last-child)]:border-r [&>*:not(:nth-child(-n+1):nth-last-child(n+4)):not(:last-child)]:border-slate-200 [&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-slate-200">
        <KPICard
          value={kpis?.resumen.proyectos_finalizados ?? 0}
          label="finalizados"
          icon={CheckCircle2}
          accent="teal"
          subtext="completados exitosamente"
          subtextColor="text-teal-600"
        />
        <KPICard
          value={proyectosEnRevision}
          label="en revisión"
          icon={Eye}
          accent="indigo"
          subtext="esperando aprobación"
          subtextColor="text-indigo-600"
        />
        <KPICard
          value={totalParticipantes}
          label="participantes"
          icon={Users}
          accent="violet"
          subtext="docentes y estudiantes"
          subtextColor="text-slate-500"
        />
        <KPICard
          value={`${Math.round(avancePromedio)}%`}
          label="avance promedio"
          icon={TrendingUp}
          accent="rose"
          subtext={`${kpis?.resumen.actividades_atrasadas ?? 0} actividades atrasadas`}
          subtextColor={(kpis?.resumen.actividades_atrasadas ?? 0) > 0 ? 'text-rose-600' : 'text-slate-400'}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard
          title="Proyectos por estado"
          subtitle="Distribución de proyectos según su estado actual"
          loading={loading}
          empty={proyectosPorEstadoData.length === 0}
        >
          <DonutChart
            data={proyectosPorEstadoData}
            total={totalProyectos}
            centerLabel="proyectos"
          />
        </ChartCard>

        <ChartCard
          title="Proyectos por tipo"
          subtitle="Cantidad de proyectos según su clasificación"
          loading={loading}
          empty={proyectosPorTipoData.length === 0}
        >
          <HorizontalBarChart data={proyectosPorTipoData} />
        </ChartCard>
      </div>

      <ChartCard
        title="Proyectos por carrera"
        subtitle="Distribución de proyectos por carrera universitaria"
        loading={loading}
        empty={proyectosPorCarrera.length === 0}
      >
        <div className={proyectosPorCarrera.length > 8 ? 'overflow-x-auto' : ''}>
          <VerticalBarChart
            data={proyectosPorCarrera.map((c) => ({ ...c, fill: '#16A34A' }))}
            barSize={40}
            rotateLabels={proyectosPorCarrera.length > 5}
          />
        </div>
      </ChartCard>

      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard
          title="Convenios por estado"
          subtitle="Distribución de convenios según su vigencia"
          loading={loading}
          empty={conveniosPorEstadoData.length === 0}
        >
          <DonutChart
            data={conveniosPorEstadoData}
            total={totalConvenios}
            centerLabel="convenios"
          />
        </ChartCard>

        <ChartCard
          title="Avance por proyecto activo"
          subtitle="Porcentaje de avance de proyectos en ejecución"
          loading={loading}
          empty={avanceProyectosData.length === 0}
        >
          <AvanceBarChart data={avanceProyectosData} />
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard
          title="Alertas por prioridad"
          subtitle="Distribución de alertas pendientes según su urgencia"
          loading={loading}
          empty={alertasPorPrioridadData.length === 0}
        >
          <VerticalBarChart data={alertasPorPrioridadData} barSize={60} />
        </ChartCard>

        <div className="bg-white rounded-lg border border-[#E5E7EB] flex flex-col" style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', margin: 0 }}>Resumen ejecutivo</h3>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>Indicadores clave del período</p>
          </div>
          <div className="flex-1">
            <div className="py-3" style={{ borderBottom: '0.5px solid #F3F4F6' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#ECFDF5' }}>
                  <PlayCircle size={16} className="text-[#16A34A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', margin: 0 }}>Tasa de ejecución</p>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{pctActivos}% de proyectos en ejecución</p>
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#16A34A' }}>{pctActivos}%</span>
              </div>
            </div>

            <div className="py-3" style={{ borderBottom: '0.5px solid #F3F4F6' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: alertasUrgentes > 0 ? '#FEF2F2' : '#FFFBEB' }}>
                  <Bell size={16} className={alertasUrgentes > 0 ? 'text-[#EF4444]' : 'text-[#EAB308]'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', margin: 0 }}>Alertas pendientes</p>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{kpis?.resumen.alertas_pendientes ?? 0} alertas requieren atención</p>
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color: alertasUrgentes > 0 ? '#EF4444' : '#EAB308' }}>{kpis?.resumen.alertas_pendientes ?? 0}</span>
              </div>
            </div>

            <div className="py-3" style={{ borderBottom: '0.5px solid #F3F4F6' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFFBEB' }}>
                  <AlertTriangle size={16} className="text-[#EAB308]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', margin: 0 }}>Convenios por vencer</p>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{kpis?.resumen.convenios_por_vencer ?? 0} convenios vencen en 30 días</p>
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#EAB308' }}>{kpis?.resumen.convenios_por_vencer ?? 0}</span>
              </div>
            </div>

            <div className="py-3" style={{ borderBottom: '0.5px solid #F3F4F6' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#ECFDF5' }}>
                  <TrendingUp size={16} className="text-[#16A34A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', margin: 0 }}>Avance promedio</p>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 6px' }}>{Math.round(avancePromedio)}% avance promedio general</p>
                  <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#F3F4F6' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(Math.round(avancePromedio), 100)}%`,
                        backgroundColor: getAvanceColor(Math.round(avancePromedio)),
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                  <FolderKanban size={16} className="text-[#0A0A0A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', margin: 0 }}>Proyectos activos</p>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{kpis?.resumen.proyectos_activos ?? 0} proyectos en ejecución</p>
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#0A0A0A' }}>{kpis?.resumen.proyectos_activos ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
        <div className="p-5 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <TableProperties size={20} className="text-slate-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Detalle de Proyectos</h3>
              <p className="text-xs text-slate-500">Listado completo con filtros avanzados</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">Estado</label>
              <select
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Todos</option>
                {Object.entries(ESTADO_PROYECTO_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">Tipo</label>
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Todos</option>
                {Object.entries(TIPO_PROYECTO_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">Carrera</label>
              <select
                value={filtros.carrera}
                onChange={(e) => setFiltros({ ...filtros, carrera: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Todas</option>
                {carreras.map((c) => (
                  <option key={c.id} value={c.nombre}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">Responsable</label>
              <input
                type="text"
                value={filtros.responsable}
                onChange={(e) => setFiltros({ ...filtros, responsable: e.target.value })}
                placeholder="Buscar..."
                className="w-full px-3 py-2 text-sm border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">Fecha inicio</label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">Fecha fin</label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFiltros({ ...filtros })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              <Filter size={14} />
              Filtrar
            </button>
            <button
              onClick={handleLimpiarFiltros}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <X size={14} />
              Limpiar
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleExportarExcel}
                disabled={exportando}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <FileSpreadsheet size={14} />
                Excel
              </button>
              <button
                onClick={handleExportarPDF}
                disabled={exportando}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-800 text-white text-sm font-medium hover:bg-red-900 transition-colors disabled:opacity-50"
              >
                <FileText size={14} />
                PDF
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Título</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Carrera</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Responsable</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">F. Inicio</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">F. Fin</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Presupuesto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase min-w-[140px]">Avance</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Part.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proyectosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-sm text-slate-500">
                    No se encontraron proyectos con los filtros aplicados
                  </td>
                </tr>
              ) : (
                proyectosPaginados.map((p, i) => (
                  <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-emerald-50/50 transition-colors`}>
                    <td className="px-4 py-3 text-xs font-mono text-slate-600">{p.codigo}</td>
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium max-w-[250px] truncate" title={p.titulo}>
                      {p.titulo}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${TIPO_PROYECTO_COLORS[p.tipo] || 'text-slate-700'} bg-slate-100`}>
                        {TIPO_PROYECTO_LABELS[p.tipo] || p.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge estado={p.estado} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[150px] truncate" title={p.carrera || ''}>
                      {p.carrera || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[150px] truncate" title={p.responsable_nombre || p.responsable || ''}>
                      {p.responsable_nombre || p.responsable || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {formatFecha(p.fecha_inicio)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {formatFecha(p.fecha_fin_planificada)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 text-right font-medium whitespace-nowrap">
                      {formatPresupuesto(p.presupuesto_aprobado)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getProgresoColor(p.progreso)}`}
                            style={{ width: `${Math.min(p.progreso, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 w-10 text-right">
                          {p.progreso}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <div className="text-xs text-slate-600">
              Mostrando {((paginaActual - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(paginaActual * ITEMS_PER_PAGE, proyectosFiltrados.length)} de {proyectosFiltrados.length} proyectos
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                disabled={paginaActual === 1}
                className="p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    className={`w-8 h-8 text-xs font-medium transition-colors ${
                      paginaActual === pageNum
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                disabled={paginaActual === totalPaginas}
                className="p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
