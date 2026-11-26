import toast from 'react-hot-toast'
import { X, Check, AlertTriangle } from 'lucide-react'
import { COLOR_ESTADO } from './IconoHalo'

interface ToastContent {
  type: 'success' | 'error' | 'warning'
  title: string
  subtitle?: string
}

/** Toast con título y detalle, con el mismo estilo que los toasts globales (main.tsx). */
function Toast({ type, title, subtitle, id }: ToastContent & { id: string }) {
  const config = {
    success: { color: COLOR_ESTADO.exito, icon: <Check size={13} strokeWidth={3} /> },
    error: { color: COLOR_ESTADO.error, icon: <X size={13} strokeWidth={3} /> },
    warning: { color: COLOR_ESTADO.advertencia, icon: <AlertTriangle size={12} strokeWidth={2.5} /> },
  }
  const c = config[type]

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto w-[340px] max-w-[92vw] rounded-[10px] border border-line bg-white shadow-[0_12px_32px_-12px_rgba(13,22,40,0.25)]"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: c.color }} aria-hidden="true">
          {c.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(id)}
          aria-label="Cerrar aviso"
          className="shrink-0 rounded-btn p-1 text-ink-light transition-colors hover:bg-bg-soft hover:text-ink"
        >
          <X size={14} />
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
