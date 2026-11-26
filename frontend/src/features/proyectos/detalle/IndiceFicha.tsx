import { useEffect, useState } from 'react'
import { SECCIONES_FICHA } from './constantes'

/**
 * Sección visible (patrón Observer: IntersectionObserver avisa al entrar o salir cada sección).
 * Se toma como activa la primera sección que cruza la franja superior de la pantalla.
 */
export function useSeccionActiva(ids: readonly string[], activo: boolean) {
  const [actual, setActual] = useState<string>(ids[0] ?? '')
  useEffect(() => {
    if (!activo) return
    const visibles = new Map<string, boolean>()
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => visibles.set(e.target.id, e.isIntersecting))
        const primera = ids.find((id) => visibles.get(id))
        if (primera) setActual(primera)
      },
      { rootMargin: '-15% 0px -65% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observador.observe(el)
    })
    return () => observador.disconnect()
  }, [ids, activo])
  return actual
}

function irA(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reducir ? 'auto' : 'smooth', block: 'start' })
  // Lleva el foco a la sección para lectores de pantalla y teclado.
  el.setAttribute('tabindex', '-1')
  el.focus({ preventScroll: true })
}

interface Props {
  actual: string
  /** 'lateral' (escritorio, columna derecha) o 'barra' (móvil, desplazable en horizontal). */
  variante: 'lateral' | 'barra'
}

/** Índice de la ficha: enlaces a cada sección con la actual resaltada. */
export default function IndiceFicha({ actual, variante }: Props) {
  if (variante === 'barra') {
    return (
      <nav aria-label="Secciones de la ficha" className="-mx-4 overflow-x-auto px-4 pb-1 md:-mx-0 md:px-0">
        <ul className="flex w-max gap-2">
          {SECCIONES_FICHA.map((s) => {
            const activa = s.id === actual
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => { e.preventDefault(); irA(s.id) }}
                  aria-current={activa ? 'location' : undefined}
                  className={`inline-flex h-8 items-center whitespace-nowrap rounded-full border px-3 text-[12.5px] font-medium transition-colors ${
                    activa ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-muted'
                  }`}
                >
                  {s.etiqueta}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    )
  }
  return (
    <nav aria-label="Secciones de la ficha">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">En esta ficha</p>
      <ul className="space-y-0.5 border-l border-line">
        {SECCIONES_FICHA.map((s) => {
          const activa = s.id === actual
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => { e.preventDefault(); irA(s.id) }}
                aria-current={activa ? 'location' : undefined}
                className={`-ml-px block border-l-2 py-1.5 pl-3 text-[13px] transition-colors ${
                  activa
                    ? 'border-naranja font-semibold text-ink'
                    : 'border-transparent text-ink-muted hover:border-line-strong hover:text-ink'
                }`}
              >
                {s.etiqueta}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
