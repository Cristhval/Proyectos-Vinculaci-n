import type { ReactNode } from 'react'
import { AlertTriangle, Info, X, XCircle } from 'lucide-react'

export type VarianteAviso = 'info' | 'advertencia' | 'error'

/**
 * Aviso del sistema, igual en toda la aplicación:
 * - Fila gris clara con borde de 1 px, sin sombra ni franjas.
 * - Primer nivel: ícono pequeño con un punto de estado (el único color), título en azul
 *   marino y, en escritorio, una descripción breve.
 * - Segundo nivel: el detalle y, a la derecha, la acción. La "x" va arriba a la derecha.
 * El punto es azul marino (info), naranja (advertencia) o rojo (error).
 */
const ESTADO: Record<VarianteAviso, { punto: string; Icono: typeof Info }> = {
  info: { punto: 'bg-ink', Icono: Info },
  advertencia: { punto: 'bg-naranja', Icono: AlertTriangle },
  error: { punto: 'bg-status-error', Icono: XCircle },
}

interface Props {
  variante?: VarianteAviso
  titulo: ReactNode
  /** Complemento del título; solo se muestra desde 640 px. */
  descripcion?: ReactNode
  /** Detalle del segundo nivel. */
  children?: ReactNode
  /** Reemplaza el ícono de la variante (15 px). */
  icono?: ReactNode
  /** Botón compacto del segundo nivel, a la derecha en escritorio y debajo en móvil. */
  accion?: ReactNode
  /** Si se pasa, muestra la "x" para cerrar el aviso. */
  onCerrar?: () => void
  className?: string
}

export default function Aviso({ variante = 'info', titulo, descripcion, children, icono, accion, onCerrar, className = '' }: Props) {
  const { punto, Icono } = ESTADO[variante]
  return (
    <div role={variante === 'error' ? 'alert' : 'status'} className={`rounded-[6px] border border-line bg-bg-soft px-4 ${accion ? 'py-1.5' : 'py-2'} ${className}`}>
      <div className="flex items-start gap-2.5">
        <span className="relative mt-0.5 flex-shrink-0 text-ink-muted" aria-hidden="true">
          {icono ?? <Icono size={15} />}
          <span className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-bg-soft ${punto}`} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-5">
            <span className="font-semibold text-ink">{titulo}</span>
            {descripcion && (
              <span className="hidden text-ink-muted sm:inline">
                <span className="mx-1.5 text-line-strong" aria-hidden="true">·</span>
                {descripcion}
              </span>
            )}
          </p>

          {(children || accion) && (
            <div className="mt-1 flex flex-col items-start gap-1.5 sm:mt-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              {children && <div className="min-w-0 break-words text-[13px] leading-5 text-ink-muted">{children}</div>}
              {accion && <div className="flex-shrink-0">{accion}</div>}
            </div>
          )}
        </div>

        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar aviso"
            className="-mr-1.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-ink-light transition-colors hover:bg-panel-alterno hover:text-ink"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  )
}

/** Botón compacto para la acción de un aviso. */
export function AccionAviso({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-[22px] items-center whitespace-nowrap rounded-btn bg-ink px-2.5 text-xs font-medium text-white transition-colors hover:bg-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-1"
    >
      {children}
    </button>
  )
}
