import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface Indicador {
  etiqueta: string
  valor: number | null
  icono: LucideIcon
  /** Pantalla con el detalle; si existe, la tarjeta muestra el botón "Ver". */
  ruta?: string
}

/**
 * Tarjeta de indicador del panel (estilo común a todos los roles):
 * banda azulada con la etiqueta, valor protagonista y acción al pie.
 */
function TarjetaIndicador({ etiqueta, valor, icono: Icono, ruta }: Indicador) {
  return (
    <article className="flex flex-col overflow-hidden rounded-md bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-panel-borde/70">
      <header className="flex h-10 items-center bg-panel-banda px-4">
        <h3 className="truncate text-[11px] font-semibold uppercase tracking-wider text-ink/80">{etiqueta}</h3>
      </header>
      <div className="flex flex-1 items-end justify-between gap-3 px-4 pb-4 pt-5">
        <span className="text-4xl font-bold tracking-tight text-ink tabular-nums">{valor ?? '—'}</span>
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-panel-fondo text-ink">
          <Icono size={22} strokeWidth={1.75} />
        </span>
      </div>
      {ruta && (
        <footer className="flex justify-end border-t border-panel-banda/70 px-4 py-3">
          <Link to={ruta} className="inline-flex items-center gap-1.5 rounded-btn bg-ink px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-ink-deep">
            Ver
            <ArrowRight size={13} />
          </Link>
        </footer>
      )}
    </article>
  )
}

export function PanelIndicadores({ items }: { items: Indicador[] }) {
  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => <TarjetaIndicador key={item.etiqueta} {...item} />)}
    </section>
  )
}

/** Encabezado de bienvenida común a los paneles de cada rol. */
export function Bienvenida({ titulo, descripcion, nombre, rol, mensaje }: {
  titulo: string
  descripcion: string
  nombre: string
  rol?: string
  mensaje: string
}) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">{titulo}</h1>
        <p className="mt-1 text-sm text-ink-muted">{descripcion}</p>
      </div>
      <div className="flex flex-col gap-1 rounded-md border-l-4 border-naranja bg-white px-6 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-panel-borde/70">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-ink">Bienvenido/a, {nombre}</h2>
          {rol && <span className="rounded-full bg-naranja-suave px-2.5 py-0.5 text-xs font-semibold text-naranja-hover">{rol}</span>}
        </div>
        <p className="text-sm text-ink-muted">{mensaje}</p>
      </div>
    </>
  )
}
