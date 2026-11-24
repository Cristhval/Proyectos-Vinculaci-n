import type { ReactNode } from 'react'
import { AlertTriangle, Info, X, XCircle } from 'lucide-react'

export type VarianteAviso = 'info' | 'advertencia' | 'error'

/**
 * Aviso del sistema: fondo blanco, borde gris de 1 px y una franja izquierda de 3 px
 * como único acento. Info = azul marino, advertencia = naranja, error = rojo.
 */
const ESTILOS: Record<VarianteAviso, { franja: string; icono: string; Icono: typeof Info }> = {
  info: { franja: 'border-l-ink', icono: 'text-ink', Icono: Info },
  advertencia: { franja: 'border-l-naranja', icono: 'text-ink', Icono: AlertTriangle },
  error: { franja: 'border-l-status-error', icono: 'text-status-error', Icono: XCircle },
}

interface Props {
  variante?: VarianteAviso
  titulo?: ReactNode
  children?: ReactNode
  /** Reemplaza el ícono de la variante. */
  icono?: ReactNode
  /** Botón u otra acción a la derecha (abajo en móvil). */
  accion?: ReactNode
  /** Si se pasa, muestra la "x" para ocultar el aviso. */
  onCerrar?: () => void
  /** Fondo gris claro del sistema en lugar de blanco. */
  alterno?: boolean
  className?: string
}

export default function Aviso({ variante = 'info', titulo, children, icono, accion, onCerrar, alterno, className = '' }: Props) {
  const { franja, icono: colorIcono, Icono } = ESTILOS[variante]
  return (
    <div
      role={variante === 'info' ? 'status' : 'alert'}
      className={`flex items-start gap-3 rounded-btn border border-l-[3px] border-line px-4 py-3 ${franja} ${alterno ? 'bg-panel-alterno' : 'bg-white'} ${className}`}
    >
      <span className={`mt-0.5 flex-shrink-0 ${colorIcono}`} aria-hidden="true">{icono ?? <Icono size={16} />}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 text-sm">
          {titulo && <p className="font-semibold text-ink">{titulo}</p>}
          {children && <div className={titulo ? 'mt-0.5 text-ink-muted' : 'text-ink'}>{children}</div>}
        </div>
        {accion && <div className="flex-shrink-0">{accion}</div>}
      </div>
      {onCerrar && (
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Ocultar aviso"
          className="-mr-1 flex-shrink-0 rounded p-1 text-ink-muted transition-colors hover:bg-panel-alterno hover:text-ink"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
