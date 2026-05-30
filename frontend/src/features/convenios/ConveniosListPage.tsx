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

  if (loading) return <div className="text-center py-8 text-sm text-ink-muted">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-ink">Convenios</h1>
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-ink text-white btn-glow">
          <Plus size={16} />
          Nuevo convenio
        </button>
      </div>
      <div className="bg-white border border-line overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-soft border-b border-line">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-muted uppercase tracking-wider">Código</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-muted uppercase tracking-wider">Contraparte</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-muted uppercase tracking-wider">Estado</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-muted uppercase tracking-wider">Tipo</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-muted uppercase tracking-wider">Fecha inicio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {convenios.map((c) => (
              <tr key={c.id} className="hover:bg-bg-soft transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-ink-muted">{c.codigo}</td>
                <td className="px-4 py-3 font-medium text-ink">{c.entidad_contraparte}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs font-medium ${ESTADO_COLORS[c.estado] || ''}`}>
                    {ESTADO_CONVENIO_LABELS[c.estado]}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-muted">{c.tipo}</td>
                <td className="px-4 py-3 text-ink-muted">{formatDate(c.fecha_inicio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
