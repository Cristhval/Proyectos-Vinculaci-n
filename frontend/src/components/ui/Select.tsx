import { clsx } from 'clsx'
import type { SelectHTMLAttributes } from 'react'

interface Option {
  value: string
  label: string
}

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Option[]
  placeholder?: string
}

export default function Select({ label, error, options, placeholder, className, id, ...props }: Props) {
  const selectId = id || label?.toLowerCase().replace(/\s/g, '-')

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-ink-muted">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          'w-full px-3 py-2 border text-sm transition-all focus:outline-none focus:ring-1 focus:ring-offset-0 bg-white',
          error
            ? 'border-status-error focus:ring-status-error'
            : 'border-line focus:ring-accent focus:border-accent',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-status-error">{error}</p>}
    </div>
  )
}
