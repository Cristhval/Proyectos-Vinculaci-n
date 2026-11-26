import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import { COMPORTAMIENTO, type Progreso } from '@/lib/operacion'
import type { Operacion } from '@/hooks/useOperacion'

interface Props {
  operacion: Pick<Operacion, 'estado' | 'aceptar' | 'cerrar' | 'reintentar'>
  textoAceptar?: string
}

/** Colores del modal de estado (diseño minimalista con ícono protagonista). */
const COLOR = {
  marino: '#14213A',
  naranja: '#E85A3C',
  pista: '#E6ECF4',
  texto: '#5B6B82',
  exito: '#2F9E6E',
  error: '#C8403A',
  advertencia: '#E85A3C',
} as const

type Variante = 'exito' | 'error' | 'advertencia'

/** Ícono de 72 px sobre un halo de 104 px del mismo color al 12 %. */
function IconoEstado({ variante }: { variante: Variante }) {
  const color = COLOR[variante]
  return (
    <span
      className="relative flex h-[104px] w-[104px] items-center justify-center rounded-full motion-safe:animate-icono-entrada"
      style={{ backgroundColor: `${color}1F` /* 12 % de opacidad */ }}
      aria-hidden="true"
    >
      <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-white" style={{ backgroundColor: color }}>
        {variante === 'exito' && <Check size={36} strokeWidth={3.25} />}
        {variante === 'error' && <X size={36} strokeWidth={3.25} />}
        {variante === 'advertencia' && <span className="text-[40px] font-bold leading-none">!</span>}
      </span>
    </span>
  )
}

const LADO = 72
const TRAZO = 5
const RADIO = (LADO - TRAZO) / 2
const CIRCUNFERENCIA = 2 * Math.PI * RADIO
const PUNTA = CIRCUNFERENCIA * 0.045

/**
 * Rueda de 72 px con trazo de 5 px: pista gris, arco azul marino y punta naranja.
 * - Indeterminada (sin porcentaje): un arco fijo que gira (0,9 s; más lento con movimiento reducido).
 * - Determinada: el arco mide el porcentaje REAL de la subida y el número va al centro.
 */
function Rueda({ progreso }: { progreso: Progreso | null }) {
  const porcentaje = progreso?.porcentaje ?? null
  const determinada = porcentaje !== null
  const largo = determinada ? Math.max(PUNTA, (porcentaje / 100) * CIRCUNFERENCIA) : CIRCUNFERENCIA * 0.3
  const marino = Math.max(0, largo - PUNTA)
  return (
    <span className="relative flex h-[104px] w-[104px] items-center justify-center motion-safe:animate-icono-entrada" aria-hidden="true">
      <svg
        width={LADO}
        height={LADO}
        viewBox={`0 0 ${LADO} ${LADO}`}
        className={determinada ? '' : 'motion-safe:animate-giro-suave motion-reduce:animate-giro-lento'}
      >
        <circle cx={LADO / 2} cy={LADO / 2} r={RADIO} fill="none" stroke={COLOR.pista} strokeWidth={TRAZO} />
        <g transform={`rotate(-90 ${LADO / 2} ${LADO / 2})`}>
          {marino > 0 && (
            <circle
              cx={LADO / 2} cy={LADO / 2} r={RADIO} fill="none" stroke={COLOR.marino} strokeWidth={TRAZO}
              strokeLinecap="round" strokeDasharray={`${marino} ${CIRCUNFERENCIA}`}
              style={{ transition: determinada ? 'stroke-dasharray 250ms ease-out' : undefined }}
            />
          )}
          <circle
            cx={LADO / 2} cy={LADO / 2} r={RADIO} fill="none" stroke={COLOR.naranja} strokeWidth={TRAZO}
            strokeLinecap="round" strokeDasharray={`${PUNTA * 0.35} ${CIRCUNFERENCIA}`}
            strokeDashoffset={-(largo - PUNTA * 0.35)}
            style={{ transition: determinada ? 'stroke-dashoffset 250ms ease-out' : undefined }}
          />
        </g>
      </svg>
      {determinada && (
        <span className="absolute text-[18px] font-semibold tabular-nums" style={{ color: COLOR.marino }}>
          {porcentaje}%
        </span>
      )}
    </span>
  )
}

const clasePildora =
  'mx-auto flex h-12 w-full max-w-[280px] items-center justify-center rounded-full bg-ink px-6 text-base font-medium text-white transition-colors [@media(hover:hover)]:hover:bg-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14213A]/35 focus-visible:ring-offset-2'
const claseEnlace =
  'mx-auto mt-3 block rounded px-2 py-1 text-[15px] font-medium underline-offset-4 transition-colors [@media(hover:hover)]:hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14213A]/30'

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
  let icono: ReactNode
  let titulo: string
  let descripcion: string | undefined
  let detalle: string | undefined
  if (estado.tipo === 'procesando') {
    icono = <Rueda key="rueda" progreso={estado.progreso} />
    titulo = estado.textos.titulo
    descripcion = estado.textos.descripcion ?? 'Esto puede tardar unos segundos. No cierres esta ventana.'
    detalle = estado.progreso?.detalle
  } else if (estado.tipo === 'exito') {
    icono = <IconoEstado key="exito" variante={estado.textos.variante ?? 'exito'} />
    titulo = estado.textos.titulo
    descripcion = estado.textos.descripcion
  } else if (estado.tipo === 'error') {
    icono = <IconoEstado key="error" variante="error" />
    titulo = estado.titulo
    descripcion = estado.mensaje
  } else {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-ink-deep/55 p-4 animate-fade-in"
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
        className="w-[92vw] max-w-[440px] rounded-[16px] bg-white px-8 pb-8 pt-10 text-center shadow-[0_24px_60px_-20px_rgba(13,22,40,0.35),0_2px_8px_rgba(13,22,40,0.06)]"
      >
        <div className="flex justify-center">{icono}</div>

        <h2 id="operacion-titulo" className="mt-5 text-[22px] font-semibold leading-tight" style={{ color: COLOR.marino }}>
          {titulo}
        </h2>
        {descripcion && (
          // Máximo 2 líneas a la vista; el texto completo queda en title y para lectores de pantalla.
          <p id="operacion-descripcion" title={descripcion} className="mx-auto mt-2 line-clamp-2 max-w-[360px] text-[15px] leading-[1.45]" style={{ color: COLOR.texto }}>
            {descripcion}
          </p>
        )}
        {detalle && (
          <p className="mt-3 text-[14px] font-medium tabular-nums" style={{ color: COLOR.marino }} aria-live="polite">
            {detalle}
          </p>
        )}

        {estado.tipo === 'exito' && (
          <div className="mt-7">
            <button ref={botonInicial} type="button" onClick={aceptar} className={clasePildora}>
              {textoAceptar}
            </button>
          </div>
        )}

        {estado.tipo === 'error' && (
          <div className="mt-7">
            {estado.reintento ? (
              <>
                <button ref={botonInicial} type="button" onClick={reintentar} className={clasePildora}>
                  Intentar nuevamente
                </button>
                <button type="button" onClick={cerrar} className={claseEnlace} style={{ color: COLOR.texto }}>
                  Cerrar
                </button>
              </>
            ) : (
              <button ref={botonInicial} type="button" onClick={cerrar} className={clasePildora}>
                Cerrar
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
