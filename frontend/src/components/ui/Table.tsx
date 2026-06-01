import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  className?: string
  render: (item: T) => ReactNode
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string | number
  emptyMessage?: string
  loading?: boolean
}

export default function Table<T>({ columns, data, keyExtractor, emptyMessage = 'Sin datos', loading }: Props<T>) {
  if (loading) {
    return <div className="text-center py-8 text-sm text-ink-muted">Cargando...</div>
  }

  return (
    <div className="bg-white border border-[#E5E7EB] overflow-hidden" style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB] border-b-2 border-[#E5E7EB]">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={clsx('text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider', col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-ink-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, i) => (
                <tr key={keyExtractor(item)} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'} hover:bg-[#F0FDF4] transition-colors duration-150`}>
                  {columns.map((col) => (
                    <td key={col.key} className={clsx('px-4 py-3.5 text-[#374151]', col.className)}>
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
