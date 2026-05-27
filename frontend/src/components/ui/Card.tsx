import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  title?: string
  actions?: ReactNode
}

export default function Card({ children, className, title, actions }: Props) {
  return (
    <div className={clsx('bg-white rounded-xl shadow-sm border', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-6 py-4 border-b">
          {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
