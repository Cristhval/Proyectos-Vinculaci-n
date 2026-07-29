import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { ROL_LABELS } from '@/lib/constants'
import { FolderKanban, ClipboardCheck, Upload, Clock } from 'lucide-react'
import { reportesApi } from '@/api/reportes'
import { avancesApi } from '@/api/seguimiento'

export default function DocenteDashboard() {
  const user = useAuthStore((state) => state.user)
  const nombre = user ? `${user.user_first_name} ${user.user_last_name}`.trim() || user.user_username : 'Docente'

  const [proyectosActivos, setProyectosActivos] = useState<number | null>(null)
  const [actividadesPendientes, setActividadesPendientes] = useState<number | null>(null)
  const [avancesRegistrados, setAvancesRegistrados] = useState<number | null>(null)
  const [proximosVencimientos, setProximosVencimientos] = useState<number | null>(null)

  useEffect(() => {
    Promise.allSettled([
      reportesApi.dashboard().then(r => {
        const resumen = r.data.data.resumen
        setProyectosActivos(resumen.proyectos_activos)
        setActividadesPendientes(
          r.data.data.actividades_por_estado
            .filter(a => a.estado === 'PENDIENTE' || a.estado === 'EN_PROCESO')
            .reduce((acc, a) => acc + a.total, 0)
        )
        setProximosVencimientos(resumen.actividades_atrasadas)
      }),
      avancesApi.list({ page_size: '1' }).then(r => setAvancesRegistrados(r.data.count)),
    ])
  }, [])

  const STATS = [
    { label: 'Mis proyectos activos', value: proyectosActivos, icon: FolderKanban, accent: '#059669', bg: 'bg-emerald-50 text-emerald-600' },
    { label: 'Actividades pendientes', value: actividadesPendientes, icon: ClipboardCheck, accent: '#D97706', bg: 'bg-amber-50 text-amber-600' },
    { label: 'Avances registrados', value: avancesRegistrados, icon: Upload, accent: '#4F46E5', bg: 'bg-indigo-50 text-indigo-600' },
    { label: 'Próximos vencimientos', value: proximosVencimientos, icon: Clock, accent: '#E11D48', bg: 'bg-rose-50 text-rose-600' },
  ]

  const formatValue = (v: number | null): string => (v != null ? String(v) : '—')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">
          Panel del Docente
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Administra tus proyectos y actividades de vinculación.
        </p>
      </div>

      <div className="p-6 bg-white rounded-card shadow-card">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-lg font-semibold text-ink">
            Bienvenido/a, {nombre}
          </h2>
          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
            {ROL_LABELS[user?.rol || 'DOCENTE']}
          </span>
        </div>
        <p className="text-sm text-ink-muted">
          Gestiona tus proyectos, registra avances y cumple con las actividades asignadas.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-b border-slate-200 overflow-hidden">
        {STATS.map((stat, index) => (
          <div
            key={stat.label}
            className={`group relative overflow-hidden py-5 px-6 transition-colors duration-300 hover:bg-slate-50 ${
              index !== 0 ? 'border-l border-slate-200' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${stat.bg} transition-transform duration-300 group-hover:scale-110`}>
                <stat.icon size={18} />
              </div>
            </div>
            <div className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 transition-transform duration-300 group-hover:-translate-y-0.5">
              {formatValue(stat.value)}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div 
                className="h-px w-4 transition-all duration-300 group-hover:w-8"
                style={{ backgroundColor: stat.accent, opacity: 0.6 }}
              />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {stat.label}
              </span>
            </div>
            <div 
              className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 transition-transform duration-300 group-hover:scale-x-100 origin-left"
              style={{ backgroundColor: stat.accent }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
