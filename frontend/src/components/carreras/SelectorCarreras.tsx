import { Check, Search, X } from 'lucide-react'
import type { Carrera } from '@/types/usuarios'
import { useFiltroCarreras } from './useFiltroCarreras'

interface Props {
  id: string
  carreras: Carrera[]
  /** IDs elegidos, como texto (igual que el formulario de proyectos). */
  seleccionadas: string[]
  onCambiar: (ids: string[]) => void
  maximo?: number
  error?: string
  cargando?: boolean
}

const plural = (n: number) => `${n} ${n === 1 ? 'carrera' : 'carreras'}`

/**
 * Selección múltiple de carreras: filtro por facultad, búsqueda sin tildes ni mayúsculas
 * y las elegidas como chips. Se puede combinar carreras de facultades distintas.
 */
export default function SelectorCarreras({ id, carreras, seleccionadas, onCambiar, maximo, error, cargando }: Props) {
  const { facultad, setFacultad, busqueda, setBusqueda, facultades, filtradas } = useFiltroCarreras(carreras)
  const elegidas = new Set(seleccionadas)
  const lleno = maximo !== undefined && seleccionadas.length >= maximo
  const porId = new Map(carreras.map((c) => [String(c.id), c]))

  const alternar = (c: Carrera) => {
    const clave = String(c.id)
    if (elegidas.has(clave)) onCambiar(seleccionadas.filter((s) => s !== clave))
    else if (!lleno) onCambiar([...seleccionadas, clave])
  }

  const campo = `h-9 rounded-btn border bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/10 ${
    error ? 'border-red-400' : 'border-line focus:border-ink'
  }`
  let facultadAnterior = ''

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,14rem)_1fr]">
        <select
          id={id}
          aria-label="Facultad"
          value={facultad}
          onChange={(e) => setFacultad(e.target.value)}
          className={`${campo} w-full min-w-0 cursor-pointer`}
        >
          <option value="">Todas las facultades</option>
          {facultades.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <label className="relative block min-w-0">
          <span className="sr-only">Buscar carrera</span>
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-light" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar carrera"
            className={`${campo} w-full pl-8`}
          />
        </label>
      </div>

      <ul
        aria-label="Carreras"
        className={`mt-2 max-h-56 overflow-y-auto rounded-btn border py-1 ${error ? 'border-red-400' : 'border-line'}`}
      >
        {cargando && <li className="px-3 py-4 text-sm text-ink-muted">Cargando carreras…</li>}
        {!cargando && filtradas.length === 0 && (
          <li className="px-3 py-4 text-sm text-ink-muted">
            {busqueda ? `Ninguna carrera coincide con «${busqueda}».` : 'No hay carreras en esta facultad.'}
          </li>
        )}
        {filtradas.map((c) => {
          const marcada = elegidas.has(String(c.id))
          const bloqueada = !marcada && lleno
          const titulo = !facultad && c.facultad !== facultadAnterior ? c.facultad : ''
          facultadAnterior = c.facultad
          return (
            <li key={c.id}>
              {titulo && <p className="px-3 pb-1 pt-2.5 text-[11px] font-medium text-ink-light">{titulo}</p>}
              <button
                type="button"
                role="checkbox"
                aria-checked={marcada}
                disabled={bloqueada}
                onClick={() => alternar(c)}
                title={bloqueada ? `Máximo ${maximo} carreras por proyecto` : undefined}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm text-ink hover:bg-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[3px] border ${
                    marcada ? 'border-naranja bg-naranja text-white' : 'border-line-strong bg-white'
                  }`}
                >
                  {marcada && <Check size={11} strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1 truncate">{c.nombre}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-ink-muted">
          {seleccionadas.length === 0 ? 'Ninguna carrera elegida' : plural(seleccionadas.length)}
          {maximo !== undefined && ` · máximo ${maximo}`}
        </span>
        {seleccionadas.map((clave) => {
          const c = porId.get(clave)
          return (
            <span key={clave} className="inline-flex max-w-full items-center gap-1 rounded-full border border-naranja/30 bg-naranja-suave py-0.5 pl-2.5 pr-1 text-xs text-ink">
              <span className="truncate" title={c?.facultad}>{c?.nombre ?? `Carrera ${clave}`}</span>
              <button
                type="button"
                onClick={() => onCambiar(seleccionadas.filter((s) => s !== clave))}
                className="rounded-full p-0.5 text-ink-muted hover:bg-white hover:text-ink"
                aria-label={`Quitar ${c?.nombre ?? 'carrera'}`}
              >
                <X size={12} />
              </button>
            </span>
          )
        })}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}
