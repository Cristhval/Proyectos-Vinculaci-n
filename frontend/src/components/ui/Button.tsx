import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  children: ReactNode
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-white text-ink border border-ink hover:bg-ink hover:text-white hover:shadow-elev focus:ring-ink',
  outline: 'bg-transparent text-ink border border-line hover:border-ink hover:bg-ink hover:text-white focus:ring-ink',
  ghost: 'bg-transparent text-ink border border-transparent hover:bg-bg-soft focus:ring-line',
  danger: 'bg-white text-ink border border-ink hover:bg-red-600 hover:text-white hover:border-red-600 focus:ring-red-500',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-4 py-2 text-xs tracking-wide',
  md: 'px-6 py-3 text-sm tracking-wide',
  lg: 'px-8 py-4 text-sm tracking-wider',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: Props) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2.5 font-medium uppercase transition-all duration-300 ease-editorial focus:outline-none focus:ring-1 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon}
      {children}
    </button>
  )
}
