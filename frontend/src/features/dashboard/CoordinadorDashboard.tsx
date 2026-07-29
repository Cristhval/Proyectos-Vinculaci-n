import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { ROL_LABELS } from '@/lib/constants'
import { FileSearch, CheckCircle, Handshake, Bell } from 'lucide-react'
import { proyectosApi } from '@/api/proyectos'
import { conveniosApi } from '@/api/convenios'
import { reportesApi } from '@/api/reportes'

export default function CoordinadorDashboard() {
  const user = useAuthStore((state) => state.user)
  const nombre = user ? `${user.user_first_name} ${user.user_last_name}`.trim() || user.user_username : 'Coordinador'

  const [enRevision, setEnRevision] = useState<number | null>(null)
  const [aprobados, setAprobados] = useState<number | null>(null)
  const [vigentes, setVigentes] = useState<number | null>(null)
  const [alertasActivas, setAlertasActivas] = useState<number | null>(null)

  useEffect(() => {
    Promise.allSettled([
      proyectosApi.list({ estado: 'EN_REVISION', page_size: '1' }).then(r => setEnRevision(r.data.count)),
      proyectosApi.list({ estado: 'APROBADO', page_size: '1' }).then(r => setAprobados(r.data.count)),
      conveniosApi.list({ estado: 'VIGENTE', page_size: '1' }).then(r => setVigentes(r.data.count)),
      reportesApi.dashboard().then(r => setAlertasActivas(r.data.data.resumen.alertas_pendientes)),
    ])
  }, [])

  const STATS = [
    { label: 'Proyectos en revisión', value: enRevision, icon: FileSearch, accent: '#4F46E5', bg: 'bg-indigo-50 text-indigo-600' },
    { label: 'Proyectos aprobados', value: aprobados, icon: CheckCircle, accent: '#059669', bg: 'bg-emerald-50 text-emerald-600' },
    { label: 'Convenios vigentes', value: vigentes, icon: Handshake, accent: '#D97706', bg: 'bg-amber-50 text-amber-600' },
    { label: 'Alertas activas', value: alertasActivas, icon: Bell, accent: '#E11D48', bg: 'bg-rose-50 text-rose-600' },
  ]

  const formatValue = (v: number | null): string => (v != null ? String(v) : '—')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">
          Panel de Coordinación
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Gestión de proyectos y convenios de tu carrera.
        </p>
      </div>

      <div className="p-6 bg-white rounded-card shadow-card">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-lg font-semibold text-ink">
            Bienvenido/a, {nombre}
          </h2>
          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            {ROL_LABELS[user?.rol || 'COORDINADOR']}
          </span>
        </div>
        <p className="text-sm text-ink-muted">
          Coordina proyectos, revisa avances y gestiona convenios institucionales.
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
