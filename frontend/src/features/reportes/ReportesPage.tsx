import { useState, useEffect, useCallback } from 'react'
import {
  FolderKanban,
  PlayCircle,
  FileSignature,
  Bell,
  CheckCircle2,
  Eye,
  Users,
  TrendingUp,
  RefreshCw,
} from 'lucide-react'
import { reportesApi } from '@/api/reportes'
import { carrerasApi } from '@/api/usuarios'
import { participantesApi } from '@/api/proyectos'
import { alertasApi } from '@/api/seguimiento'
import { Spinner } from '@/components/ui'
import type { DashboardKPIs } from '@/types/reportes'
import type { Carrera } from '@/types/usuarios'

const PERIODOS = [
  { value: '', label: 'Todo el tiempo' },
  { value: 'year', label: 'Este año' },
  { value: 'semester', label: 'Este semestre' },
  { value: 'month', label: 'Este mes' },
]

interface KPICardProps {
  value: string | number
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  borderColor: string
  subtext?: string
  subtextColor?: string
  progressValue?: number
}

function KPICard({ value, label, icon: Icon, borderColor, subtext, subtextColor = 'text-[#16A34A]', progressValue }: KPICardProps) {
  return (
    <div className="bg-white rounded-card shadow-card p-5 border-l-4 flex flex-col gap-3 transition-shadow duration-200 hover:shadow-card-hover" style={{ borderLeftColor: borderColor }}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
          <Icon size={18} className="text-slate-600" />
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold tracking-tight text-slate-900">{value}</div>
        <div className="text-xs font-medium uppercase tracking-wider text-slate-500 mt-1">{label}</div>
      </div>
      {progressValue !== undefined && (
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#16A34A] rounded-full transition-all duration-500" style={{ width: `${Math.min(progressValue, 100)}%` }} />
        </div>
      )}
      {subtext && (
        <div className={`text-xs font-medium ${subtextColor}`}>{subtext}</div>
      )}
    </div>
  )
}

export default function ReportesPage() {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [periodo, setPeriodo] = useState('')
  const [carrera, setCarrera] = useState('')
  const [totalParticipantes, setTotalParticipantes] = useState(0)
  const [alertasUrgentes, setAlertasUrgentes] = useState(0)
  const [avancePromedio, setAvancePromedio] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dashRes, carrerasRes, partRes, urgRes, progRes] = await Promise.all([
        reportesApi.dashboard(),
        carrerasApi.list({ page_size: '100' }),
        participantesApi.list({ page_size: '1' }),
        alertasApi.list({ estado: 'PENDIENTE', prioridad: 'URGENTE', page_size: '1' }),
        reportesApi.progreso(),
      ])

      setKpis(dashRes.data.data)
      setCarreras(carrerasRes.data.results || [])
      setTotalParticipantes(partRes.data.count ?? 0)
      setAlertasUrgentes(urgRes.data.count ?? 0)

      const actividades = (progRes.data.data || []).flatMap((p) =>
        (p.actividades || []).map((a) => parseFloat(a.porcentaje_ejecucion) || 0),
      )
      if (actividades.length > 0) {
        setAvancePromedio(actividades.reduce((s, v) => s + v, 0) / actividades.length)
      } else {
        setAvancePromedio(0)
      }
    } catch {
      setKpis(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalProyectos = kpis
    ? kpis.proyectos_por_estado.reduce((sum, e) => sum + e.total, 0)
    : 0

  const proyectosEnEjecucion = kpis
    ? (kpis.proyectos_por_estado.find((e) => e.estado === 'EN_EJECUCION')?.total ?? 0)
    : 0

  const proyectosEnRevision = kpis
    ? (kpis.proyectos_por_estado.find((e) => e.estado === 'EN_REVISION')?.total ?? 0)
    : 0

  const pctActivos = totalProyectos > 0 && kpis
    ? Math.round((kpis.resumen.proyectos_activos / totalProyectos) * 100)
    : 0

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

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          value={totalProyectos}
          label="proyectos registrados"
          icon={FolderKanban}
          borderColor="#0A0A0A"
          subtext={`${proyectosEnEjecucion} en ejecución`}
          subtextColor="text-[#16A34A]"
        />
        <KPICard
          value={kpis?.resumen.proyectos_activos ?? 0}
          label="en ejecución"
          icon={PlayCircle}
          borderColor="#16A34A"
          subtext={`${pctActivos}% del total`}
          subtextColor="text-[#16A34A]"
        />
        <KPICard
          value={kpis?.resumen.convenios_activos ?? 0}
          label="convenios vigentes"
          icon={FileSignature}
          borderColor="#2563EB"
          subtext={
            (kpis?.resumen.convenios_por_vencer ?? 0) > 0
              ? `${kpis?.resumen.convenios_por_vencer} por vencer`
              : 'Sin próximos a vencer'
          }
          subtextColor={(kpis?.resumen.convenios_por_vencer ?? 0) > 0 ? 'text-[#EAB308]' : 'text-slate-400'}
        />
        <KPICard
          value={kpis?.resumen.alertas_pendientes ?? 0}
          label="alertas pendientes"
          icon={Bell}
          borderColor="#EAB308"
          subtext={
            alertasUrgentes > 0
              ? `${alertasUrgentes} urgentes`
              : 'Sin urgentes'
          }
          subtextColor={alertasUrgentes > 0 ? 'text-red-600' : 'text-slate-400'}
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          value={kpis?.resumen.proyectos_finalizados ?? 0}
          label="proyectos finalizados"
          icon={CheckCircle2}
          borderColor="#15803D"
          subtext="completados exitosamente"
          subtextColor="text-[#15803D]"
        />
        <KPICard
          value={proyectosEnRevision}
          label="en revisión"
          icon={Eye}
          borderColor="#2563EB"
          subtext="esperando aprobación"
          subtextColor="text-[#2563EB]"
        />
        <KPICard
          value={totalParticipantes}
          label="participantes totales"
          icon={Users}
          borderColor="#16A34A"
          subtext="docentes y estudiantes"
          subtextColor="text-slate-500"
        />
        <KPICard
          value={`${Math.round(avancePromedio)}%`}
          label="avance promedio"
          icon={TrendingUp}
          borderColor="#EAB308"
          progressValue={avancePromedio}
        />
      </div>
    </div>
  )
}
