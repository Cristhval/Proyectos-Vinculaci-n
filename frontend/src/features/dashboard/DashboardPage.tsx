import { useEffect, useState } from 'react'
import { FolderKanban, Handshake, Activity, AlertTriangle } from 'lucide-react'
import { reportesApi } from '@/api/reportes'
import type { DashboardKPIs } from '@/types/reportes'

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)

  useEffect(() => {
    reportesApi.dashboard().then(({ data }) => setKpis(data.data))
  }, [])

  if (!kpis) return <div className="text-center py-8">Cargando...</div>

  const cards = [
    { label: 'Proyectos activos', value: kpis.resumen.proyectos_activos, icon: FolderKanban, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total proyectos', value: kpis.resumen.total_proyectos, icon: Activity, color: 'text-green-600 bg-green-50' },
    { label: 'Convenios vigentes', value: kpis.resumen.convenios_vigentes, icon: Handshake, color: 'text-purple-600 bg-purple-50' },
    { label: 'Total convenios', value: kpis.resumen.total_convenios, icon: AlertTriangle, color: 'text-orange-600 bg-orange-50' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-gray-800">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
