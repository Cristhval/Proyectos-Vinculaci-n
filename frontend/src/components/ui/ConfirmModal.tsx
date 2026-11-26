import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, HelpCircle, Trash2, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

/**
 * Tono de la acción principal:
 * - primario: azul marino (confirmaciones institucionales: guardar, enviar, aprobar).
 * - acento: naranja (acciones que requieren atención pero no destruyen: rechazar, reemplazar).
 * - peligro: rojo, SOLO para eliminar o dar de baja.
 * El verde se reserva para el estado de éxito (OperationStatusModal), nunca para un botón.
 */
export type TonoConfirmacion = 'primario' | 'acento' | 'peligro'

interface ConfirmModalProps {
  isOpen: boolean
  titulo: string
  mensaje: string
  onConfirm: () => void
  onCancel: () => void
  children?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tono?: TonoConfirmacion
  /** Ícono de 24 px como máximo; por defecto depende del tono. */
  icono?: ReactNode
  confirmDisabled?: boolean
  /** Muestra la acción como "Procesando…" y la deshabilita (evita confirmar dos veces). */
  cargando?: boolean
  /** Ancho máximo en px (por defecto 440). */
  width?: number | string
  hideMessage?: boolean
  /** Para avisos sin decisión (p. ej. "No se puede eliminar"): solo un botón. */
  soloAceptar?: boolean
  /** @deprecated Usa `tono`. 'rose' equivale a tono="peligro"; 'emerald' a tono="primario". */
  confirmColor?: 'emerald' | 'rose'
  /** @deprecated Usa tono="peligro". */
  danger?: boolean
}

const TONOS: Record<TonoConfirmacion, { boton: string; icono: string; fondoIcono: string; Icono: typeof HelpCircle }> = {
  primario: {
    boton: 'bg-ink text-white [@media(hover:hover)]:hover:bg-ink-2 focus-visible:ring-ink/40',
    icono: 'text-ink',
    fondoIcono: 'bg-bg-muted',
    Icono: HelpCircle,
  },
  acento: {
    boton: 'bg-naranja text-white [@media(hover:hover)]:hover:bg-naranja-hover focus-visible:ring-naranja/50',
    icono: 'text-naranja',
    fondoIcono: 'bg-naranja-suave',
    Icono: AlertTriangle,
  },
  peligro: {
    boton: 'bg-status-error text-white [@media(hover:hover)]:hover:bg-red-700 focus-visible:ring-red-600/40',
    icono: 'text-status-error',
    fondoIcono: 'bg-red-50',
    Icono: Trash2,
  },
}

/** Confirmación única del sistema: [Cancelar] blanco con borde gris y la acción principal a la derecha. */
export default function ConfirmModal({
  isOpen,
  titulo,
  mensaje,
  onConfirm,
  onCancel,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tono,
  icono,
  confirmDisabled = false,
  cargando = false,
  width = 440,
  hideMessage = false,
  soloAceptar = false,
  confirmColor,
  danger = false,
}: ConfirmModalProps) {
  const [visible, setVisible] = useState(false)
  const [animate, setAnimate] = useState(false)
  const botonCancelar = useRef<HTMLButtonElement>(null)
  const botonConfirmar = useRef<HTMLButtonElement>(null)
  const tonoFinal: TonoConfirmacion = tono ?? (danger || confirmColor === 'rose' ? 'peligro' : 'primario')
  const estilo = TONOS[tonoFinal]
  const conCancelar = !soloAceptar && Boolean(cancelLabel)
  const deshabilitado = confirmDisabled || cargando

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)))
    } else {
      setAnimate(false)
      const timer = setTimeout(() => setVisible(false), 180)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflow }
  }, [isOpen])

  // Foco inicial: en acciones de peligro, en [Cancelar] para que Enter no borre por accidente.
  useEffect(() => {
    if (!animate) return
    const destino = tonoFinal === 'peligro' && conCancelar ? botonCancelar.current : botonConfirmar.current
    destino?.focus()
  }, [animate, tonoFinal, conCancelar])

  useEffect(() => {
    if (!isOpen) return
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !cargando) { e.preventDefault(); onCancel() }
    }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [isOpen, cargando, onCancel])

  if (!visible) return null

  const IconoTono = estilo.Icono

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 99999,
        background: `rgba(13, 22, 40, ${animate ? 0.55 : 0})`,
        transition: 'background 180ms ease',
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !cargando) onCancel() }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmacion-titulo"
        aria-describedby={hideMessage ? undefined : 'confirmacion-mensaje'}
        className="relative w-full rounded-[8px] border border-line bg-white shadow-2xl"
        style={{
          maxWidth: typeof width === 'number' ? `${width}px` : width,
          transform: animate ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.98)',
          opacity: animate ? 1 : 0,
          transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={cargando}
          aria-label="Cerrar"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded text-ink-light transition-colors [@media(hover:hover)]:hover:bg-bg-soft hover:text-ink disabled:opacity-40"
        >
          <X size={16} />
        </button>

        <div className="px-6 pb-5 pt-6">
          <div className="flex items-start gap-3 pr-6">
            <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${estilo.fondoIcono} ${estilo.icono}`} aria-hidden="true">
              {icono ?? <IconoTono size={20} />}
            </span>
            <div className="min-w-0 pt-1">
              <h2 id="confirmacion-titulo" className="text-[15px] font-semibold leading-5 text-ink">{titulo}</h2>
              {!hideMessage && (
                <p id="confirmacion-mensaje" className="mt-1.5 text-[13px] leading-5 text-ink-muted">{mensaje}</p>
              )}
            </div>
          </div>

          {children && <div className="mt-4 text-left">{children}</div>}
        </div>

        <div className="flex flex-col-reverse gap-2 rounded-b-[8px] border-t border-line bg-bg-soft/60 px-6 py-3.5 sm:flex-row sm:justify-end">
          {conCancelar && (
            <button
              ref={botonCancelar}
              type="button"
              onClick={onCancel}
              disabled={cargando}
              className="inline-flex h-9 items-center justify-center rounded-btn border border-line-strong bg-white px-4 text-sm font-medium text-ink transition-colors [@media(hover:hover)]:hover:bg-bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-1 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          )}
          <button
            ref={botonConfirmar}
            type="button"
            onClick={onConfirm}
            disabled={deshabilitado}
            aria-busy={cargando}
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-btn px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${estilo.boton}`}
          >
            {cargando && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
            {cargando ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
