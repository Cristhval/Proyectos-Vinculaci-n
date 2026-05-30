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

  if (loading) return <div className="text-center py-8 text-sm text-ink-muted">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-ink">Proyectos</h1>
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-ink text-white btn-glow">
          <Plus size={16} />
          Nuevo proyecto
        </button>
      </div>
      <div className="bg-white border border-line overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-soft border-b border-line">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-muted uppercase tracking-wider">Código</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-muted uppercase tracking-wider">Título</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-muted uppercase tracking-wider">Estado</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-muted uppercase tracking-wider">Responsable</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-muted uppercase tracking-wider">Fecha inicio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {proyectos.map((p) => (
              <tr key={p.id} className="hover:bg-bg-soft transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-ink-muted">{p.codigo}</td>
                <td className="px-4 py-3 font-medium text-ink">{p.titulo}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs font-medium ${ESTADO_COLORS[p.estado] || ''}`}>
                    {ESTADO_PROYECTO_LABELS[p.estado]}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-muted">{p.responsable_nombre || '-'}</td>
                <td className="px-4 py-3 text-ink-muted">{formatDate(p.fecha_inicio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
