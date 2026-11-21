import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { SkeletonTabla } from './Skeleton'

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
    return <SkeletonTabla filas={5} columnas={columns.length} />
  }

  return (
    <div className="bg-white border border-line overflow-hidden" style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-bg-soft border-b-2 border-line">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={clsx('text-left px-4 py-3 text-xs font-semibold text-ink uppercase tracking-wider', col.className)}>
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
                <tr key={keyExtractor(item)} className={`${i % 2 === 0 ? 'bg-white' : 'bg-bg-soft'} hover:bg-bg-soft transition-colors duration-150`}>
                  {columns.map((col) => (
                    <td key={col.key} className={clsx('px-4 py-3.5 text-ink-texto', col.className)}>
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
