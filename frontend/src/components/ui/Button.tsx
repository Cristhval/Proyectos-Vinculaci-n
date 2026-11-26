import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'institucional' | 'acento' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  children: ReactNode
}

const variantStyles: Record<Variant, string> = {
  /* Acción principal de la pantalla */
  primary: 'bg-naranja text-white rounded-btn hover:bg-naranja-hover',
  /* Acción institucional (navegación, confirmaciones neutras) */
  institucional: 'bg-ink text-white rounded-btn hover:bg-ink-2',
  /* Acción que pide atención sin destruir nada (rechazar, suspender, cancelar) */
  acento: 'bg-white text-naranja border border-naranja rounded-btn hover:bg-naranja-suave',
  outline: 'bg-white text-ink border border-line-strong rounded-btn hover:bg-bg-soft',
  ghost: 'bg-transparent text-ink rounded-btn hover:bg-bg-soft',
  /* Solo para eliminar o dar de baja */
  danger: 'bg-status-error text-white rounded-btn hover:bg-red-700',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
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
        'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed',
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
