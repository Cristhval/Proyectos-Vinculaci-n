import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { proyectosApi } from '@/api/proyectos'
import { ESTADO_PROYECTO_LABELS, ESTADO_COLORS } from '@/lib/constants'
import { formatDate } from '@/lib/formatters'
import type { Proyecto } from '@/types/proyectos'

export default function ProyectosListPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    proyectosApi.list().then(({ data }) => {
      setProyectos(data.results)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="text-center py-8">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Proyectos</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Plus size={18} />
          Nuevo proyecto
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Codigo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Titulo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Responsable</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha inicio</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {proyectos.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{p.codigo}</td>
                <td className="px-4 py-3 font-medium">{p.titulo}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADO_COLORS[p.estado] || ''}`}>
                    {ESTADO_PROYECTO_LABELS[p.estado]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{p.responsable_nombre || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(p.fecha_inicio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
