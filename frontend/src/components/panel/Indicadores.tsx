import type { LucideIcon } from 'lucide-react'
import { Metrica, ResumenMetricas } from './Metricas'

export interface Indicador {
  etiqueta: string
  valor: number | null
  icono: LucideIcon
  /** Pantalla con el detalle: la celda completa lleva allí. */
  ruta?: string
  /** Métrica que pide acción (alertas, vencimientos): se avisa en naranja si es mayor a cero. */
  atencion?: boolean
}

/** Resumen de indicadores de los paneles de cada rol (misma pieza que usan los listados). */
export function PanelIndicadores({ items }: { items: Indicador[] }) {
  return (
    <ResumenMetricas>
      {items.map((i) => (
        <Metrica key={i.etiqueta} label={i.etiqueta} value={i.valor} icon={i.icono} to={i.ruta} accent={i.atencion ? 'rose' : undefined} />
      ))}
    </ResumenMetricas>
  )
}

/** Encabezado común de los paneles: saludo, título, contexto y rol. */
export function Bienvenida({ titulo, nombre, rol, mensaje }: {
  titulo: string
  descripcion?: string
  nombre: string
  rol?: string
  mensaje: string
}) {
  const primerNombre = nombre.split(' ')[0]
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm text-ink-muted">Hola, {primerNombre}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink md:text-[28px]">{titulo}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">{mensaje}</p>
      </div>
      {rol && (
        <span className="inline-flex flex-shrink-0 items-center gap-2 self-start rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink ring-1 ring-panel-borde sm:self-auto">
          <span className="h-1.5 w-1.5 rounded-full bg-naranja" />
          {rol}
        </span>
      )}
    </header>
  )
}
