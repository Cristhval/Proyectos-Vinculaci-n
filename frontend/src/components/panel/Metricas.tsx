import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** Clase del contenedor: una sola superficie dividida por líneas finas (no tarjetas sueltas). */
export const claseResumen =
  'grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-lg bg-panel-borde ring-1 ring-panel-borde shadow-[0_1px_2px_rgba(15,23,42,0.05)]'

export function ResumenMetricas({ children }: { children: ReactNode }) {
  return <section className={claseResumen}>{children}</section>
}

interface Props {
  label: string
  value: number | null | undefined
  icon?: LucideIcon
  /** Compatibilidad con las páginas existentes: 'rose' o 'red' marcan una métrica que pide atención. */
  accent?: string
  loading?: boolean
  /** Si se indica, la celda completa lleva a esa pantalla. */
  to?: string
}

/**
 * Métrica del panel: etiqueta discreta con su ícono de línea, número protagonista
 * y, solo cuando hay algo que atender, un aviso en naranja.
 */
export function Metrica({ label, value, icon: Icon, accent, loading, to }: Props) {
  const atencion = (accent === 'rose' || accent === 'red') && (value ?? 0) > 0

  const contenido = (
    <>
      <div className="flex items-center gap-2 text-[13px] font-medium text-ink-muted">
        {Icon && <Icon size={15} strokeWidth={1.75} className="flex-shrink-0 text-ink-light" />}
        <span className="truncate">{label}</span>
        {to && <ChevronRight size={15} className="ml-auto flex-shrink-0 text-ink-light transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        {loading ? (
          <span className="h-9 w-14 animate-pulse rounded bg-panel-fondo" />
        ) : (
          <span className="text-[34px] font-semibold leading-none tracking-tight text-ink tabular-nums">
            {value == null ? '—' : value.toLocaleString('es-EC')}
          </span>
        )}
        {atencion && !loading && (
          <span className="inline-flex items-center gap-1.5 pb-0.5 text-xs font-medium text-naranja-hover">
            <span className="h-1.5 w-1.5 rounded-full bg-naranja" />
            Requiere atención
          </span>
        )}
      </div>
    </>
  )

  const clase = 'group flex min-h-[118px] flex-col justify-between gap-6 bg-white px-5 py-5 md:px-6'
  return to ? (
    <Link to={to} className={`${clase} transition-colors hover:bg-[#F7FAFD] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-naranja`}>
      {contenido}
    </Link>
  ) : (
    <div className={clase}>{contenido}</div>
  )
}
