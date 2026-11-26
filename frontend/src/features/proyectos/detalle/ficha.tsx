import type { ReactNode } from 'react'

/**
 * Piezas de la ficha institucional del proyecto (patrón de composición):
 * la ficha es UNA superficie con secciones separadas por título y línea, no una tarjeta por sección.
 */

interface SeccionProps {
  id: string
  numero: number
  titulo: string
  /** Texto breve bajo el título (qué contiene la sección). */
  descripcion?: string
  children: ReactNode
}

export function SeccionFicha({ id, numero, titulo, descripcion, children }: SeccionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-6 border-t border-line py-7 first:border-t-0 first:pt-0 last:pb-0">
      <header className="mb-5 flex items-baseline gap-3">
        <span className="text-[12px] font-semibold tabular-nums text-naranja" aria-hidden="true">
          {String(numero).padStart(2, '0')}
        </span>
        <div className="min-w-0">
          <h2 id={`${id}-titulo`} className="text-[17px] font-semibold leading-tight tracking-[-0.01em] text-ink">{titulo}</h2>
          {descripcion && <p className="mt-0.5 text-[12.5px] text-ink-muted">{descripcion}</p>}
        </div>
      </header>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

/** Subtítulo dentro de una sección (p. ej. "Beneficiarios" dentro de Diagnóstico). */
export function Subtitulo({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">{children}</h3>
}

/** Rejilla de campos: 1 columna en móvil, 2 desde 640 px. */
export function Campos({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">{children}</dl>
}

interface CampoProps {
  etiqueta: string
  valor: ReactNode
  /** Ocupa las dos columnas (textos largos). */
  completo?: boolean
  mono?: boolean
}

/** Un campo de la ficha. Si no hay valor no se muestra: la ficha no inventa datos vacíos. */
export function Campo({ etiqueta, valor, completo, mono }: CampoProps) {
  if (valor === null || valor === undefined || valor === '' || (Array.isArray(valor) && valor.length === 0)) return null
  return (
    <div className={completo ? 'sm:col-span-2' : ''}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">{etiqueta}</dt>
      <dd className={`mt-1 whitespace-pre-line break-words text-[14px] leading-[1.65] text-ink-texto ${mono ? 'font-mono text-[13px]' : ''}`}>
        {valor}
      </dd>
    </div>
  )
}

export function SinDatos({ children }: { children: ReactNode }) {
  return <p className="text-[13px] text-ink-muted">{children}</p>
}

/** Pastilla neutra (carreras, ODS, etc.). */
export function Etiqueta({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-bg-soft px-2.5 py-0.5 text-[12px] font-medium text-ink">
      {children}
    </span>
  )
}

/**
 * El formulario guarda "Instituciones participantes" al final de la descripción con un marcador.
 * Se separan para mostrarlas como dato propio.
 */
const MARCADOR_INSTITUCIONES = '[Instituciones participantes]'
export function separarInstituciones(descripcion: string | null | undefined): { descripcion: string; instituciones: string } {
  const texto = descripcion || ''
  const i = texto.indexOf(MARCADOR_INSTITUCIONES)
  if (i < 0) return { descripcion: texto.trim(), instituciones: '' }
  return {
    descripcion: texto.slice(0, i).trim(),
    instituciones: texto.slice(i + MARCADOR_INSTITUCIONES.length).trim(),
  }
}

export const tieneTexto = (...valores: (string | null | undefined)[]) => valores.some((v) => Boolean(v && v.trim()))
