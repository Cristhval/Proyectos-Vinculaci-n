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
    return <div className="text-center py-8 text-gray-500">Cargando...</div>
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={clsx('text-left px-4 py-3 font-medium text-gray-600', col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={keyExtractor(item)} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={clsx('px-4 py-3', col.className)}>
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
