import { useAuthStore } from '@/store/authStore'
import { ROL_LABELS } from '@/lib/constants'
import { FolderKanban, Handshake, Users, AlertTriangle } from 'lucide-react'

const STATS = [
  { label: 'Total de proyectos', value: '180+', icon: FolderKanban, accent: 'border-l-emerald-500', bg: 'bg-emerald-50 text-emerald-600' },
  { label: 'Total de convenios', value: '64', icon: Handshake, accent: 'border-l-amber-500', bg: 'bg-amber-50 text-amber-600' },
  { label: 'Usuarios registrados', value: '312', icon: Users, accent: 'border-l-emerald-500', bg: 'bg-emerald-50 text-emerald-600' },
  { label: 'Alertas pendientes', value: '7', icon: AlertTriangle, accent: 'border-l-amber-500', bg: 'bg-amber-50 text-amber-600' },
]

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user)
  const nombre = user ? `${user.user_first_name} ${user.user_last_name}`.trim() || user.user_username : 'Administrador'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink tracking-tight">
          Panel de Administración
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Vista general del sistema de vinculación.
        </p>
      </div>

      <div className="p-6 bg-white rounded-card shadow-card">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-lg font-semibold text-ink">
            Bienvenido/a, {nombre}
          </h2>
          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
            {ROL_LABELS[user?.rol || 'ADMIN']}
          </span>
        </div>
        <p className="text-sm text-ink-muted">
          Tienes acceso completo a todos los módulos del sistema.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.accent} border-l-[3px] p-6 bg-white rounded-card shadow-card`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${stat.bg}`}>
                <stat.icon size={18} />
              </div>
            </div>
            <div className="text-3xl font-bold text-ink tracking-tight">
              {stat.value}
            </div>
            <div className="mt-1 text-sm text-ink-muted">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
