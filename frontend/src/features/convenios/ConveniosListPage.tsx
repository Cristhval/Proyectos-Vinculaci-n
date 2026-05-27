import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { conveniosApi } from '@/api/convenios'
import { ESTADO_CONVENIO_LABELS, ESTADO_COLORS } from '@/lib/constants'
import { formatDate } from '@/lib/formatters'
import type { Convenio } from '@/types/convenios'

export default function ConveniosListPage() {
  const [convenios, setConvenios] = useState<Convenio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    conveniosApi.list().then(({ data }) => {
      setConvenios(data.results)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="text-center py-8">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Convenios</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Plus size={18} />
          Nuevo convenio
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Codigo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Contraparte</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha inicio</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {convenios.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{c.codigo}</td>
                <td className="px-4 py-3 font-medium">{c.entidad_contraparte}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADO_COLORS[c.estado] || ''}`}>
                    {ESTADO_CONVENIO_LABELS[c.estado]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{c.tipo}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(c.fecha_inicio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
