import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { FASES, TOTAL_FASES } from './tipos'
import type { EstadoDeFase, EstadoFase } from './validacion'

/** Piezas visuales del formulario de proyectos: sin cajas anidadas, sombras ni íconos de adorno. */

const base = 'w-full rounded-btn border bg-white text-sm text-ink placeholder:text-ink-light transition-colors focus:outline-none focus:ring-2'
const estado = (error?: unknown) =>
  error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15' : 'border-line hover:border-line-strong focus:border-ink focus:ring-ink/10'

export const claseInput = (error?: unknown) => `${base} h-9 px-3 ${estado(error)}`
export const claseSelect = (error?: unknown) => `${base} h-9 cursor-pointer px-3 ${estado(error)}`
export const claseTextarea = (error?: unknown) => `${base} resize-y px-3 py-2 leading-relaxed ${estado(error)}`

export function Campo({ etiqueta, obligatorio, error, ayuda, contador, htmlFor, ancho, children }: {
  etiqueta: string
  obligatorio?: boolean
  error?: string
  ayuda?: string
  contador?: string
  htmlFor?: string
  /** Ocupa las dos columnas de la grilla. */
  ancho?: boolean
  children: ReactNode
}) {
  return (
    <div className={ancho ? 'md:col-span-2' : undefined}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink">
        {etiqueta}
        {obligatorio && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </label>
      {children}
      {(error || ayuda || contador) && (
        <div className="mt-1 flex items-start justify-between gap-3 text-xs">
          {error ? <p className="text-red-600" role="alert">{error}</p> : <p className="text-ink-light">{ayuda}</p>}
          {contador && <p className="flex-shrink-0 tabular-nums text-ink-light">{contador}</p>}
        </div>
      )}
    </div>
  )
}

/** Sección de una fase: título simple, espacio y grilla de 2 columnas en escritorio. */
export function Seccion({ titulo, accion, children, columnas = true }: {
  titulo?: string
  accion?: ReactNode
  columnas?: boolean
  children: ReactNode
}) {
  return (
    <section className="border-t border-line pt-6 first:border-t-0 first:pt-0">
      {(titulo || accion) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {titulo && <h3 className="text-sm font-semibold text-ink">{titulo}</h3>}
          {accion}
        </div>
      )}
      <div className={columnas ? 'grid gap-x-5 gap-y-4 md:grid-cols-2' : 'space-y-4'}>{children}</div>
    </section>
  )
}

/** Pasos en una línea en escritorio; "Fase 2 de 7" con barra en móvil. */
const TEXTO_ESTADO: Record<EstadoFase, string> = {
  actual: 'fase actual',
  completada: 'completada',
  incompleta: 'con campos obligatorios pendientes',
  error: 'con errores',
  pendiente: 'pendiente',
}

/** Punto de aviso sobre el círculo: ámbar (incompleta) o rojo (error al validar). */
function PuntoAviso({ estado }: { estado: EstadoFase }) {
  if (estado !== 'incompleta' && estado !== 'error') return null
  return (
    <span
      className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-white ${estado === 'error' ? 'bg-status-error' : 'bg-status-warning'}`}
      aria-hidden="true"
    />
  )
}

/**
 * Indicador de las 7 fases.
 * - Completada: check verde discreto. - Actual: azul marino con subrayado naranja.
 * - Pendiente: gris. - Con errores: punto ámbar (faltan campos) o rojo (falló la validación).
 */
export function IndicadorFases({ actual, onIr, estados }: { actual: number; onIr: (fase: number) => void; estados: EstadoDeFase[] }) {
  const fase = FASES[actual - 1]
  const estadoActual = estados[actual - 1]
  return (
    <nav aria-label="Fases del formulario">
      {/* Móvil: fase actual y 7 segmentos con el estado de cada fase. */}
      <div className="md:hidden">
        <div className="flex items-baseline justify-between text-sm">
          <p className="font-semibold text-ink">Fase {actual} de {TOTAL_FASES}</p>
          <p className="text-ink-muted">{fase?.label}</p>
        </div>
        <ol className="mt-2 flex gap-1">
          {FASES.map((f, i) => {
            const e = estados[i]?.estado ?? 'pendiente'
            const activa = f.num === actual
            const color = activa ? 'bg-ink'
              : e === 'completada' ? 'bg-status-success/70'
                : e === 'error' ? 'bg-status-error'
                  : e === 'incompleta' ? 'bg-status-warning'
                    : 'bg-bg-muted'
            return (
              <li key={f.num} className="flex-1">
                <button
                  type="button"
                  onClick={() => onIr(f.num)}
                  aria-current={activa ? 'step' : undefined}
                  aria-label={`Fase ${f.num}, ${f.label}: ${activa ? 'fase actual' : TEXTO_ESTADO[e]}`}
                  className="block w-full py-1.5"
                >
                  <span className={`block h-1.5 rounded-full ${color} ${activa ? 'shadow-[0_2px_0_0_rgb(var(--rgb-naranja))]' : ''}`} />
                </button>
              </li>
            )
          })}
        </ol>
        {estadoActual?.estado === 'error' && (
          <p className="mt-1 text-xs text-status-error">Esta fase tiene {estadoActual.errores} {estadoActual.errores === 1 ? 'campo' : 'campos'} por corregir.</p>
        )}
      </div>

      {/* Escritorio: las 7 fases con nombre. */}
      <ol className="hidden items-center gap-1 md:flex">
        {FASES.map((f, i) => {
          const { estado: e } = estados[i] ?? { estado: 'pendiente' as EstadoFase }
          const activa = f.num === actual
          const completada = !activa && e === 'completada'
          const pendiente = !activa && e === 'pendiente'
          return (
            <li key={f.num} className="flex flex-1 items-center gap-1 last:flex-none">
              <button
                type="button"
                onClick={() => onIr(f.num)}
                aria-current={activa ? 'step' : undefined}
                title={`${f.titulo}: ${activa ? 'fase actual' : TEXTO_ESTADO[e]}`}
                className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded px-1 py-1 text-[13px] transition-colors hover:bg-bg-soft ${
                  activa ? 'font-semibold text-ink' : pendiente ? 'text-ink-light' : 'text-ink'
                }`}
              >
                <span
                  className={`relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    activa
                      ? 'bg-ink text-white'
                      : completada
                        ? 'bg-emerald-50 text-status-success ring-1 ring-inset ring-status-success/30'
                        : pendiente
                          ? 'border border-line-strong text-ink-light'
                          : 'border border-ink-muted/40 text-ink'
                  }`}
                >
                  {completada ? <Check size={11} strokeWidth={3} aria-hidden="true" /> : f.num}
                  <PuntoAviso estado={e} />
                </span>
                <span className={activa ? 'border-b-2 border-naranja pb-px' : 'border-b-2 border-transparent pb-px'}>{f.label}</span>
                {!activa && <span className="sr-only">({TEXTO_ESTADO[e]})</span>}
              </button>
              {i < FASES.length - 1 && <span className={`h-px min-w-2 flex-1 ${completada ? 'bg-status-success/40' : 'bg-line'}`} />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** Dato de solo lectura en el resumen de la fase 7. */
export function Dato({ etiqueta, valor, ancho }: { etiqueta: string; valor?: ReactNode; ancho?: boolean }) {
  return (
    <div className={ancho ? 'md:col-span-2' : undefined}>
      <dt className="text-xs text-ink-muted">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-ink">{valor || '—'}</dd>
    </div>
  )
}
