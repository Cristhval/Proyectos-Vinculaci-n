import { CalendarRange, Hash, UserRound, Wallet } from 'lucide-react'
import { ESTADO_PROYECTO_LABELS, PRIORIDAD_LABELS, TIPO_PROYECTO_LABELS } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { Proyecto } from '@/types/proyectos'
import { ESTADO_PUNTO } from './constantes'

interface Props {
  proyecto: Proyecto
  /** Avance real de las actividades (0-100). */
  avance: number
}

function Pastilla({ children, punto }: { children: React.ReactNode; punto?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-0.5 text-[12px] font-medium text-white">
      {punto && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: punto }} aria-hidden="true" />}
      {children}
    </span>
  )
}

function Dato({ icono, etiqueta, children }: { icono: React.ReactNode; etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-white/60">
        <span aria-hidden="true">{icono}</span>
        {etiqueta}
      </dt>
      <dd className="mt-1 truncate text-[14px] font-semibold text-white">{children}</dd>
    </div>
  )
}

/**
 * Encabezado institucional: fondo azul marino sólido (sin degradado) y una línea naranja fina.
 * Reúne la identidad del proyecto y sus datos clave; la portada vive en la galería.
 */
export default function FichaEncabezado({ proyecto, avance }: Props) {
  const carreras = proyecto.carreras?.length
    ? proyecto.carreras.map((c) => c.nombre)
    : proyecto.carrera_nombre ? [proyecto.carrera_nombre] : []
  const fechas = proyecto.fecha_inicio || proyecto.fecha_fin_planificada
    ? `${proyecto.fecha_inicio ? formatDate(proyecto.fecha_inicio) : 'Sin inicio'} – ${proyecto.fecha_fin_planificada ? formatDate(proyecto.fecha_fin_planificada) : 'Sin fin'}`
    : 'Sin fechas'
  const pct = Math.max(0, Math.min(100, Math.round(avance)))

  return (
    <header className="overflow-hidden rounded-[10px] border-b-[3px] border-naranja bg-ink text-white">
      <div className="px-5 pb-6 pt-5 sm:px-8 sm:pt-7">
        <div className="flex flex-wrap items-center gap-2">
          <Pastilla punto={ESTADO_PUNTO[proyecto.estado] ?? '#CBD5E1'}>
            {ESTADO_PROYECTO_LABELS[proyecto.estado] || proyecto.estado}
          </Pastilla>
          <Pastilla>{TIPO_PROYECTO_LABELS[proyecto.tipo] || proyecto.tipo}</Pastilla>
          <Pastilla>Prioridad {(PRIORIDAD_LABELS[proyecto.prioridad] || proyecto.prioridad).toLowerCase()}</Pastilla>
        </div>

        <h1 className="mt-3 text-[22px] font-semibold leading-tight tracking-[-0.015em] sm:text-[28px]">{proyecto.titulo}</h1>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-white/75">
          <span className="inline-flex items-center gap-1 font-mono text-[12.5px]">
            <Hash size={13} aria-hidden="true" /> {proyecto.codigo}
          </span>
          {carreras.length > 0 && <span className="text-white/30" aria-hidden="true">·</span>}
          {carreras.map((c) => (
            <span key={c} className="rounded-[4px] bg-white/10 px-2 py-0.5 text-[12px] text-white/90">{c}</span>
          ))}
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <Dato icono={<UserRound size={13} />} etiqueta="Responsable">{proyecto.responsable_nombre || 'Sin responsable'}</Dato>
          <Dato icono={<CalendarRange size={13} />} etiqueta="Fechas">{fechas}</Dato>
          <Dato icono={<Wallet size={13} />} etiqueta="Presupuesto">
            {Number(proyecto.presupuesto_aprobado) > 0 ? formatCurrency(proyecto.presupuesto_aprobado) : 'Sin presupuesto'}
          </Dato>
          <div className="min-w-0">
            <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/60">Avance</dt>
            <dd className="mt-2 flex items-center gap-3">
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Avance de las actividades"
              >
                <div className="h-full rounded-full bg-naranja transition-[width] duration-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[14px] font-semibold tabular-nums">{pct}%</span>
            </dd>
          </div>
        </dl>
      </div>
    </header>
  )
}
