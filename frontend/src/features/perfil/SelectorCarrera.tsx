import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import type { Carrera } from '@/types/usuarios'
import { normalizar } from '@/lib/texto'

interface Props {
  id: string
  carreras: Carrera[]
  valor: string
  onCambiar: (id: string) => void
  error?: string
}

/**
 * Combobox con búsqueda para elegir carrera. Filtra por nombre, código o facultad
 * y mantiene las carreras agrupadas por facultad. Se maneja con teclado (↑ ↓ Enter Esc).
 */
export default function SelectorCarrera({ id, carreras, valor, onCambiar, error }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [activo, setActivo] = useState(0)
  const raiz = useRef<HTMLDivElement>(null)
  const entrada = useRef<HTMLInputElement>(null)
  const lista = useRef<HTMLUListElement>(null)

  const seleccionada = carreras.find((c) => String(c.id) === valor)

  const filtradas = useMemo(() => {
    const q = normalizar(busqueda.trim())
    if (!q) return carreras
    return carreras.filter((c) => normalizar(`${c.nombre} ${c.codigo ?? ''} ${c.facultad}`).includes(q))
  }, [carreras, busqueda])

  const grupos = useMemo(() => {
    const mapa = new Map<string, Carrera[]>()
    filtradas.forEach((c) => mapa.set(c.facultad, [...(mapa.get(c.facultad) ?? []), c]))
    return [...mapa.entries()]
  }, [filtradas])

  useEffect(() => {
    if (!abierto) return
    const cerrar = (e: MouseEvent) => { if (!raiz.current?.contains(e.target as Node)) setAbierto(false) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [abierto])

  useEffect(() => { setActivo(0) }, [busqueda])

  useEffect(() => {
    lista.current?.querySelector<HTMLElement>(`[data-indice="${activo}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [activo])

  const abrir = () => {
    setBusqueda('')
    setAbierto(true)
    requestAnimationFrame(() => entrada.current?.focus())
  }

  const elegir = (c: Carrera) => {
    onCambiar(String(c.id))
    setAbierto(false)
  }

  const teclado = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActivo((i) => Math.min(i + 1, filtradas.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActivo((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter') { e.preventDefault(); const c = filtradas[activo]; if (c) elegir(c) }
    if (e.key === 'Escape') setAbierto(false)
  }

  const borde = error ? 'border-red-500 focus:ring-red-500/10' : 'border-line focus:border-ink focus:ring-ink/10'
  let indice = -1

  return (
    <div ref={raiz} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className={`flex w-full items-center gap-2 rounded-btn border bg-white px-3.5 py-2.5 text-left text-sm transition-colors focus:outline-none focus:ring-2 ${borde}`}
      >
        <span className={`min-w-0 flex-1 truncate ${seleccionada ? 'text-ink' : 'text-ink-light'}`}>
          {seleccionada ? seleccionada.nombre : 'Selecciona tu carrera'}
        </span>
        <ChevronDown size={15} className={`flex-shrink-0 text-ink-light transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>
      {seleccionada && !abierto && <p className="mt-1 truncate text-[11px] text-ink-light">{seleccionada.facultad}</p>}

      {abierto && (
        <div className="absolute left-0 right-0 z-30 mt-1.5 overflow-hidden rounded-lg border border-line bg-white shadow-lg sm:min-w-[22rem]">
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Search size={14} className="flex-shrink-0 text-ink-light" />
            <input
              ref={entrada}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={teclado}
              placeholder="Buscar carrera o facultad…"
              aria-controls={`${id}-lista`}
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-light focus:outline-none"
            />
            {busqueda && (
              <button type="button" onClick={() => { setBusqueda(''); entrada.current?.focus() }} className="text-ink-light hover:text-ink" aria-label="Limpiar búsqueda">
                <X size={14} />
              </button>
            )}
          </div>

          <ul ref={lista} id={`${id}-lista`} role="listbox" className="max-h-72 overflow-y-auto py-1">
            {grupos.length === 0 && <li className="px-3.5 py-6 text-center text-sm text-ink-muted">Sin resultados para «{busqueda}»</li>}
            {grupos.map(([facultad, items]) => (
              <li key={facultad} role="presentation">
                <p className="sticky top-0 bg-white/95 px-3.5 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-ink-light backdrop-blur">{facultad}</p>
                <ul role="presentation">
                  {items.map((c) => {
                    indice += 1
                    const i = indice
                    const marcada = String(c.id) === valor
                    return (
                      <li
                        key={c.id}
                        role="option"
                        aria-selected={marcada}
                        data-indice={i}
                        onMouseEnter={() => setActivo(i)}
                        onMouseDown={(e) => { e.preventDefault(); elegir(c) }}
                        className={`flex cursor-pointer items-center gap-2 px-3.5 py-2 text-sm ${i === activo ? 'bg-bg-soft' : ''} ${marcada ? 'font-medium text-ink' : 'text-ink'}`}
                      >
                        <span className="min-w-0 flex-1 truncate">{c.nombre}</span>
                        {marcada && <Check size={14} className="flex-shrink-0 text-ink" />}
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-3.5 py-2 text-[11px] text-ink-light">
            {filtradas.length} de {carreras.length} carreras
          </p>
        </div>
      )}
    </div>
  )
}
