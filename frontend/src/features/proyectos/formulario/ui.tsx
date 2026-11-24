import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { FASES, TOTAL_FASES } from './tipos'

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
export function IndicadorFases({ actual, onIr }: { actual: number; onIr: (fase: number) => void }) {
  const fase = FASES[actual - 1]
  return (
    <nav aria-label="Fases del formulario">
      <div className="md:hidden">
        <div className="flex items-baseline justify-between text-sm">
          <p className="font-semibold text-ink">Fase {actual} de {TOTAL_FASES}</p>
          <p className="text-ink-muted">{fase?.label}</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-muted" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_FASES} aria-valuenow={actual}>
          <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${(actual / TOTAL_FASES) * 100}%` }} />
        </div>
      </div>

      <ol className="hidden items-center gap-1 md:flex">
        {FASES.map((f, i) => {
          const hecha = f.num < actual
          const activa = f.num === actual
          return (
            <li key={f.num} className="flex min-w-0 flex-1 items-center gap-1 last:flex-none">
              <button
                type="button"
                onClick={() => onIr(f.num)}
                aria-current={activa ? 'step' : undefined}
                className={`flex min-w-0 items-center gap-1.5 rounded px-1 py-1 text-[13px] transition-colors hover:bg-bg-soft ${
                  activa ? 'font-semibold text-ink' : hecha ? 'text-ink' : 'text-ink-light'
                }`}
              >
                <span
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    activa ? 'bg-ink text-white' : hecha ? 'border border-ink text-ink' : 'border border-line-strong'
                  }`}
                >
                  {hecha ? <Check size={11} strokeWidth={3} /> : f.num}
                </span>
                <span className="truncate">{f.label}</span>
              </button>
              {i < FASES.length - 1 && <span className={`h-px min-w-2 flex-1 ${hecha ? 'bg-ink' : 'bg-line'}`} />}
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
