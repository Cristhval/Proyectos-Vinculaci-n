import { clsx } from 'clsx'
import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export default function Input({ label, error, helperText, className, id, ...props }: Props) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-ink-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full px-3 py-2 border text-sm transition-all focus:outline-none focus:ring-1 focus:ring-offset-0',
          error
            ? 'border-status-error focus:ring-status-error focus:border-status-error'
            : 'border-line focus:ring-accent focus:border-accent',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-status-error">{error}</p>}
      {helperText && !error && <p className="text-xs text-ink-muted">{helperText}</p>}
    </div>
  )
}
