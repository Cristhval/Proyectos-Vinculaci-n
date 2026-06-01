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
      <div className="bg-white border border-[#E5E7EB] overflow-hidden" style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB] border-b-2 border-[#E5E7EB]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Código</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Contraparte</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Fecha inicio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {convenios.map((c, i) => (
              <tr key={c.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'} hover:bg-[#F0FDF4] transition-colors duration-150`}>
                <td className="px-4 py-3.5 font-mono text-xs text-[#374151]">{c.codigo}</td>
                <td className="px-4 py-3.5 font-medium text-[#374151]">{c.entidad_contraparte}</td>
                <td className="px-4 py-3.5">
                  <span className={`px-2 py-1 text-[11px] font-semibold ${ESTADO_COLORS[c.estado] || ''}`} style={{ borderRadius: '4px' }}>
                    {ESTADO_CONVENIO_LABELS[c.estado]}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-[#374151]">{c.tipo}</td>
                <td className="px-4 py-3.5 text-[#374151]">{formatDate(c.fecha_inicio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
