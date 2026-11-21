import { clsx } from 'clsx'
import type { CSSProperties } from 'react'

/**
 * Esqueletos de carga: ocupan el mismo espacio que el contenido que reemplazan,
 * así la página no "salta" cuando llegan los datos (menos CLS).
 *
 * La animación usa `motion-safe:`, por lo que no se anima si el sistema tiene
 * activado "reducir movimiento" (prefers-reduced-motion).
 */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" className={clsx('block rounded bg-bg-muted motion-safe:animate-pulse', className)} style={style} />
}

/** Anchos fijos (no aleatorios) para que las filas parezcan texto real sin cambiar en cada render. */
const ANCHOS = ['72%', '48%', '60%', '40%', '55%', '35%', '66%']

interface SkeletonTablaProps {
  /** Normalmente el tamaño de página, para reservar la misma altura que la tabla cargada. */
  filas?: number
  columnas?: number
  /** Alto de cada fila en px (las filas con dos líneas, como código + título, miden ~68). */
  altoFila?: number
  etiqueta?: string
}

/** Reemplaza el spinner de los listados: encabezado + filas con la altura de las filas reales. */
export function SkeletonTabla({ filas = 10, columnas = 5, altoFila = 56, etiqueta = 'Cargando…' }: SkeletonTablaProps) {
  const cols = Array.from({ length: columnas }, (_, i) => i)
  return (
    <div role="status" aria-busy="true" className="w-full overflow-hidden">
      <span className="sr-only">{etiqueta}</span>
      <div className="flex h-[41px] items-center gap-6 border-b border-line bg-bg-soft/60 px-4">
        {cols.map((c) => (
          <div key={c} className="flex-1">
            <Skeleton className="h-2.5" style={{ width: '45%', maxWidth: 88 }} />
          </div>
        ))}
      </div>
      <div className="divide-y divide-line/60">
        {Array.from({ length: filas }, (_, f) => (
          <div key={f} className="flex items-center gap-6 px-4" style={{ height: altoFila }}>
            {cols.map((c) => (
              <div key={c} className="flex-1">
                <Skeleton className="h-3.5" style={{ width: ANCHOS[(f + c) % ANCHOS.length] }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Página de reportes mientras cargan: encabezado, 4 indicadores y 2 paneles de gráficos. */
export function SkeletonReporte({ etiqueta = 'Cargando reportes…' }: { etiqueta?: string }) {
  return (
    <div role="status" aria-busy="true" className="space-y-6 pb-10">
      <span className="sr-only">{etiqueta}</span>
      <div className="flex h-[74px] items-center justify-between border border-slate-200 bg-white p-4 shadow-sm">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-72 max-w-[50vw]" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[178px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="mb-4 h-11 w-11 rounded-xl" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="mt-3 h-3 w-32" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-[340px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-56" />
            <Skeleton className="mx-auto mt-8 h-[200px] w-[200px] rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
