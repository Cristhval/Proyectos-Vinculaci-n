import toast from 'react-hot-toast'
import { X, Check, AlertTriangle } from 'lucide-react'

interface ToastContent {
  type: 'success' | 'error' | 'warning'
  title: string
  subtitle?: string
}

function Toast({ type, title, subtitle, id }: ToastContent & { id: string }) {
  const config = {
    success: {
      border: 'border-l-emerald-600',
      bg: 'bg-emerald-50',
      icon: <Check size={14} className="text-emerald-600" />,
      iconBg: 'bg-emerald-100',
    },
    error: {
      border: 'border-l-red-600',
      bg: 'bg-red-50',
      icon: <X size={14} className="text-red-600" />,
      iconBg: 'bg-red-100',
    },
    warning: {
      border: 'border-l-amber-500',
      bg: 'bg-amber-50',
      icon: <AlertTriangle size={14} className="text-amber-600" />,
      iconBg: 'bg-amber-100',
    },
  }

  const c = config[type]

  return (
    <div
      className={`${c.bg} ${c.border} border-l-[3px] w-[320px] rounded-btn shadow-lg pointer-events-auto`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`flex items-center justify-center w-7 h-7 rounded-full ${c.iconBg} shrink-0`}>
          {c.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">{title}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-ink-muted leading-relaxed">{subtitle}</p>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(id)}
          className="shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
        >
          <X size={14} className="text-ink-light" />
        </button>
      </div>
    </div>
  )
}

export function showSuccess(title: string, subtitle?: string) {
  return toast.custom(
    (t) => (
      <Toast type="success" title={title} subtitle={subtitle} id={t.id} />
    ),
    { duration: 4000 },
  )
}

export function showError(title: string, subtitle?: string) {
  return toast.custom(
    (t) => (
      <Toast type="error" title={title} subtitle={subtitle} id={t.id} />
    ),
    { duration: 4000 },
  )
}

export function showWarning(title: string, subtitle?: string) {
  return toast.custom(
    (t) => (
      <Toast type="warning" title={title} subtitle={subtitle} id={t.id} />
    ),
    { duration: 4000 },
  )
}
