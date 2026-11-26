import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react'

export interface ImagenVisor {
  id: number | string
  url: string
  nombre?: string
  ancho?: number
  alto?: number
}

interface Props {
  imagenes: ImagenVisor[]
  /** Índice abierto; null cierra el visor. */
  indice: number | null
  onCambiar: (indice: number | null) => void
}

const UMBRAL_DESLIZAR = 50

/**
 * Visor ampliado a pantalla completa.
 * Teclado: ← y → navegan, Esc cierra; Tab queda dentro del visor y el foco vuelve a la miniatura al cerrar.
 * En móvil se desliza para cambiar de imagen.
 */
export default function VisorImagenes({ imagenes, indice, onCambiar }: Props) {
  const abierto = indice !== null && imagenes.length > 0
  const total = imagenes.length
  const actual = abierto ? imagenes[Math.min(indice, total - 1)] : null
  const contenedor = useRef<HTMLDivElement>(null)
  const botonCerrar = useRef<HTMLButtonElement>(null)
  const inicioToque = useRef<number | null>(null)
  const [fallida, setFallida] = useState<string | number | null>(null)

  const cerrar = useCallback(() => onCambiar(null), [onCambiar])
  const mover = useCallback(
    (paso: number) => {
      if (indice === null || total < 2) return
      onCambiar((indice + paso + total) % total)
    },
    [indice, total, onCambiar],
  )

  useEffect(() => {
    if (!abierto) return
    const previo = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    botonCerrar.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      previo?.focus?.()
    }
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); cerrar() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); mover(1) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); mover(-1) }
      else if (e.key === 'Tab' && contenedor.current) {
        const enfocables = contenedor.current.querySelectorAll<HTMLElement>('button')
        if (enfocables.length === 0) return
        const primero = enfocables[0]!
        const ultimo = enfocables[enfocables.length - 1]!
        if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus() }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus() }
      }
    }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [abierto, cerrar, mover])

  if (!abierto || !actual) return null

  const claseFlecha =
    'absolute top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-ink-deep/70 text-white ring-1 ring-white/25 transition-colors hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naranja'

  return createPortal(
    <div
      ref={contenedor}
      role="dialog"
      aria-modal="true"
      aria-label={`Imagen ${indice! + 1} de ${total}${actual.nombre ? `: ${actual.nombre}` : ''}`}
      className="fixed inset-0 z-[100000] flex flex-col bg-ink-deep/95"
      onClick={(e) => { if (e.target === e.currentTarget) cerrar() }}
      onTouchStart={(e) => { inicioToque.current = e.touches[0]?.clientX ?? null }}
      onTouchEnd={(e) => {
        const inicio = inicioToque.current
        const fin = e.changedTouches[0]?.clientX
        inicioToque.current = null
        if (inicio === null || fin === undefined) return
        if (Math.abs(fin - inicio) > UMBRAL_DESLIZAR) mover(fin < inicio ? 1 : -1)
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white sm:px-6">
        <p className="min-w-0 truncate text-sm">
          <span className="font-semibold tabular-nums">{indice! + 1} / {total}</span>
          {actual.nombre && <span className="ml-2 text-white/70">{actual.nombre}</span>}
        </p>
        <button
          ref={botonCerrar}
          type="button"
          onClick={cerrar}
          aria-label="Cerrar visor (Esc)"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naranja"
        >
          <X size={20} />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-20"
        onClick={(e) => { if (e.target === e.currentTarget) cerrar() }}
      >
        {fallida === actual.id ? (
          <div className="flex flex-col items-center gap-2 text-white/70">
            <ImageOff size={28} />
            <p className="text-sm">No se pudo cargar la imagen. Recarga la página e inténtalo de nuevo.</p>
          </div>
        ) : (
          <img
            key={actual.id}
            src={actual.url}
            alt={actual.nombre || `Imagen ${indice! + 1} del proyecto`}
            width={actual.ancho}
            height={actual.alto}
            decoding="async"
            onError={() => setFallida(actual.id)}
            className="max-h-full max-w-full select-none rounded-[4px] object-contain shadow-2xl"
          />
        )}

        {total > 1 && (
          <>
            <button type="button" onClick={() => mover(-1)} aria-label="Imagen anterior (←)" className={`${claseFlecha} left-2 sm:left-5`}>
              <ChevronLeft size={22} />
            </button>
            <button type="button" onClick={() => mover(1)} aria-label="Imagen siguiente (→)" className={`${claseFlecha} right-2 sm:right-5`}>
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
