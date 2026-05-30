import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface Props {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-bg-muted text-ink-muted',
  success: 'bg-accent-light text-status-success',
  warning: 'bg-orange-50 text-status-warning',
  danger: 'bg-red-50 text-status-error',
  info: 'bg-blue-50 text-status-info',
}

export default function Badge({ children, variant = 'default', className }: Props) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 text-xs font-medium',
      variantStyles[variant],
      className,
    )}>
      {children}
    </span>
  )
}
