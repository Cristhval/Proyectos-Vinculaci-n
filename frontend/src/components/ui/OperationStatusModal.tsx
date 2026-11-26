import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, Check } from 'lucide-react'
import { COMPORTAMIENTO } from '@/lib/operacion'
import type { Operacion } from '@/hooks/useOperacion'

interface Props {
  operacion: Pick<Operacion, 'estado' | 'aceptar' | 'cerrar' | 'reintentar'>
  textoAceptar?: string
}

/** Spinner discreto: arco azul marino y arco naranja girando en sentidos opuestos. */
function SpinnerInstitucional() {
  return (
    <span className="relative block h-9 w-9" aria-hidden="true">
      <span className="absolute inset-0 rounded-full border-[3px] border-line" />
      <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-ink [animation-duration:900ms]" />
      <span className="absolute inset-[7px] animate-spin rounded-full border-2 border-transparent border-b-naranja [animation-direction:reverse] [animation-duration:1200ms]" />
    </span>
  )
}

const claseBotonPrincipal =
  'inline-flex h-10 items-center justify-center rounded-btn bg-ink px-5 text-sm font-medium text-white transition-colors [@media(hover:hover)]:hover:bg-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naranja focus-visible:ring-offset-2'
const claseBotonSecundario =
  'inline-flex h-10 items-center justify-center rounded-btn border border-line-strong bg-white px-5 text-sm font-medium text-ink transition-colors [@media(hover:hover)]:hover:bg-bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2'

/**
 * Modal de estado de una operación (procesando → éxito | error). Se usa con useOperacion:
 *   const op = useOperacion()
 *   <OperationStatusModal operacion={op} />
 */
export default function OperationStatusModal({ operacion, textoAceptar = 'Aceptar' }: Props) {
  const { estado, aceptar, cerrar, reintentar } = operacion
  const botonInicial = useRef<HTMLButtonElement>(null)
  const visible = estado.tipo === 'exito' || estado.tipo === 'error' || (estado.tipo === 'procesando' && estado.visible)

  // Esc: en "procesando" no hace nada; en éxito acepta; en error cierra.
  useEffect(() => {
    if (!visible) return
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      if (!COMPORTAMIENTO[estado.tipo].cerrable) return
      if (estado.tipo === 'exito') aceptar()
      else if (estado.tipo === 'error') cerrar()
    }
    window.addEventListener('keydown', alPulsar, true)
    return () => window.removeEventListener('keydown', alPulsar, true)
  }, [visible, estado.tipo, aceptar, cerrar])

  useEffect(() => {
    if (!visible) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflow }
  }, [visible])

  useEffect(() => {
    if (estado.tipo === 'exito' || estado.tipo === 'error') botonInicial.current?.focus()
  }, [estado.tipo])

  if (!visible) return null

  const procesando = estado.tipo === 'procesando'

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-ink-deep/60 p-4 backdrop-blur-[2px] animate-fade-in"
      // Clic fuera: no cierra en "procesando"; en éxito o error tampoco, para no perder el aviso por accidente.
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        role={procesando ? 'status' : 'alertdialog'}
        aria-modal="true"
        aria-busy={procesando}
        aria-live="polite"
        aria-labelledby="operacion-titulo"
        aria-describedby="operacion-descripcion"
        className="w-full max-w-[400px] rounded-[8px] border border-line bg-white px-6 py-6 shadow-2xl"
      >
        {estado.tipo === 'procesando' && (
          <div className="flex flex-col items-center text-center">
            <SpinnerInstitucional />
            <h2 id="operacion-titulo" className="mt-4 text-[15px] font-semibold text-ink">{estado.textos.titulo}</h2>
            <p id="operacion-descripcion" className="mt-1 text-[13px] leading-5 text-ink-muted">
              {estado.textos.descripcion ?? 'Esto puede tardar unos segundos. No cierres esta ventana.'}
            </p>
          </div>
        )}

        {estado.tipo === 'exito' && (
          <div className="flex flex-col items-center text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-status-success" aria-hidden="true">
              <Check size={24} strokeWidth={2.5} />
            </span>
            <h2 id="operacion-titulo" className="mt-3 text-[15px] font-semibold text-ink">{estado.textos.titulo}</h2>
            {estado.textos.descripcion && (
              <p id="operacion-descripcion" className="mt-1 text-[13px] leading-5 text-ink-muted">{estado.textos.descripcion}</p>
            )}
            <button ref={botonInicial} type="button" onClick={aceptar} className={`${claseBotonPrincipal} mt-5 w-full sm:w-auto sm:min-w-[140px]`}>
              {textoAceptar}
            </button>
          </div>
        )}

        {estado.tipo === 'error' && (
          <div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex-shrink-0 text-status-error" aria-hidden="true">
                <AlertCircle size={24} />
              </span>
              <div className="min-w-0">
                <h2 id="operacion-titulo" className="text-[15px] font-semibold text-ink">{estado.titulo}</h2>
                <p id="operacion-descripcion" className="mt-1 break-words text-[13px] leading-5 text-ink-muted">{estado.mensaje}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button ref={estado.reintento ? undefined : botonInicial} type="button" onClick={cerrar} className={claseBotonSecundario}>Cerrar</button>
              {estado.reintento && (
                <button ref={botonInicial} type="button" onClick={reintentar} className={claseBotonPrincipal}>Intentar nuevamente</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
