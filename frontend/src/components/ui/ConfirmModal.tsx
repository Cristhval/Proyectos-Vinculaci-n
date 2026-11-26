import { useEffect, useRef, useState } from 'react'
import { Info, Trash2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import IconoHalo, { COLOR_ESTADO } from './IconoHalo'

/**
 * Tono de la acción principal (y del ícono):
 * - primario: azul marino, informativo (guardar, enviar, aprobar).
 * - acento: naranja, advertencia (rechazar, suspender, reemplazar).
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
  /** Reemplaza el ícono del tono (se dibuja en blanco sobre el círculo de 56 px). */
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

const TONOS: Record<TonoConfirmacion, { color: string; hover: string; icono: ReactNode }> = {
  primario: { color: COLOR_ESTADO.marino, hover: '#22355A', icono: <Info size={28} strokeWidth={2.5} /> },
  acento: { color: COLOR_ESTADO.advertencia, hover: '#CF4A2E', icono: <span className="text-[30px] font-bold leading-none">!</span> },
  peligro: { color: COLOR_ESTADO.error, hover: '#A9342F', icono: <Trash2 size={26} strokeWidth={2.25} /> },
}

const clasePildora =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

/**
 * Confirmación única del sistema, con el mismo estilo que OperationStatusModal: centrada, ícono
 * con halo según el tono y botones en píldora. Escritorio: [Cancelar] [Acción] lado a lado.
 * Móvil: apilados con la acción principal arriba.
 */
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
        className="max-h-[92vh] w-[92vw] overflow-y-auto rounded-[16px] bg-white px-8 pb-8 pt-10 text-center shadow-[0_24px_60px_-20px_rgba(13,22,40,0.35),0_2px_8px_rgba(13,22,40,0.06)]"
        style={{
          maxWidth: typeof width === 'number' ? `${width}px` : width,
          transform: animate ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.98)',
          opacity: animate ? 1 : 0,
          transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="flex justify-center">
          <IconoHalo color={estilo.color} tamano={56} animar={false}>{icono ?? estilo.icono}</IconoHalo>
        </div>

        <h2 id="confirmacion-titulo" className="mt-5 text-[20px] font-semibold leading-tight" style={{ color: COLOR_ESTADO.marino }}>
          {titulo}
        </h2>
        {!hideMessage && (
          <p id="confirmacion-mensaje" className="mx-auto mt-2 max-w-[360px] text-[15px] leading-[1.45]" style={{ color: COLOR_ESTADO.texto }}>
            {mensaje}
          </p>
        )}

        {children && <div className="mt-5 text-left">{children}</div>}

        {/* DOM: [Cancelar][Acción]. Móvil: columna invertida → la acción queda arriba. */}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
          {conCancelar && (
            <button
              ref={botonCancelar}
              type="button"
              onClick={onCancel}
              disabled={cargando}
              className={`${clasePildora} border border-line-strong bg-white text-ink [@media(hover:hover)]:hover:bg-bg-soft focus-visible:ring-ink/30 sm:flex-1`}
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
            className={`${clasePildora} bg-[var(--tono)] text-white focus-visible:ring-[var(--tono)] sm:flex-1 [@media(hover:hover)]:hover:bg-[var(--tono-hover)]`}
            // Solo variables en línea: así el hover de la clase sigue funcionando.
            style={{ ['--tono' as string]: estilo.color, ['--tono-hover' as string]: estilo.hover }}
          >
            {cargando && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
            {cargando ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
