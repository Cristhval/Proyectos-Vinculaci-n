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
      bg: 'bg-green-600',
      icon: <Check size={16} className="text-white" />,
    },
    error: {
      bg: 'bg-red-600',
      icon: <X size={16} className="text-white" />,
    },
    warning: {
      bg: 'bg-amber-500',
      icon: <AlertTriangle size={16} className="text-white" />,
    },
  }

  const c = config[type]

  return (
    <div
      className={`${c.bg} w-[320px] rounded shadow-lg pointer-events-auto`}
    >
      <div className="flex items-center gap-3 p-4">
        <div className="flex items-center justify-center shrink-0">
          {c.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{title}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-white/80 leading-relaxed">{subtitle}</p>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(id)}
          className="shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X size={14} className="text-white/70" />
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
