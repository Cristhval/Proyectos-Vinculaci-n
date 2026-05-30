import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  title?: string
  actions?: ReactNode
  hover?: boolean
}

export default function Card({ children, className, title, actions, hover }: Props) {
  return (
    <div
      className={clsx(
        'bg-white rounded-card shadow-card',
        hover && 'card-hover',
        className,
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          {title && <h3 className="text-sm font-semibold text-ink">{title}</h3>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
