import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow, format, parseISO, differenceInCalendarDays } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Alerta } from '@/types/seguimiento'
import type { Auditoria } from '@/types/auditoria'
import type { Actividad } from '@/types/proyectos'

/** Sección del panel: superficie blanca con título y, si aplica, un enlace al módulo. */
export function Bloque({ titulo, enlace, textoEnlace = 'Ver todo', children }: {
  titulo: string
  enlace?: string
  textoEnlace?: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-line bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 className="text-sm font-semibold text-ink">{titulo}</h2>
        {enlace && (
          <Link to={enlace} className="text-xs font-medium text-ink-muted transition-colors hover:text-naranja">
            {textoEnlace}
          </Link>
        )}
      </header>
      {children}
    </section>
  )
}

/** Estado vacío o de carga dentro de un bloque. */
export function Vacio({ cargando, texto }: { cargando?: boolean; texto: string }) {
  if (cargando) {
    return (
      <div className="space-y-3 px-5 py-4" aria-busy="true">
        {[0, 1, 2].map((i) => <div key={i} className="h-9 animate-pulse rounded bg-bg-muted" />)}
      </div>
    )
  }
  return <p className="px-5 py-8 text-center text-sm text-ink-muted">{texto}</p>
}

const hace = (iso: string) => formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: es })

/* Prioridad: colores semánticos (solo estados). */
const PRIORIDAD: Record<string, { punto: string; texto: string }> = {
  URGENTE: { punto: 'bg-red-600', texto: 'Urgente' },
  ALTA: { punto: 'bg-red-500', texto: 'Alta' },
  MEDIA: { punto: 'bg-amber-500', texto: 'Media' },
  BAJA: { punto: 'bg-slate-400', texto: 'Baja' },
}

export function ListaAlertas({ alertas }: { alertas: Alerta[] }) {
  return (
    <ul className="divide-y divide-line">
      {alertas.map((a) => {
        const p = PRIORIDAD[a.prioridad] ?? { punto: 'bg-slate-400', texto: 'Baja' }
        const contenido = (
          <>
            <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${p.punto}`} title={`Prioridad ${p.texto.toLowerCase()}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink-texto">{a.mensaje}</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Prioridad {p.texto.toLowerCase()}
                {a.proyecto_codigo ? `, ${a.proyecto_codigo}` : ''}
              </p>
            </div>
            <span className="flex-shrink-0 text-xs text-ink-light">{hace(a.creado_en)}</span>
          </>
        )
        return (
          <li key={a.id}>
            {a.enlace ? (
              <Link to={a.enlace} className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-bg-soft">{contenido}</Link>
            ) : (
              <div className="flex items-start gap-3 px-5 py-3">{contenido}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

const ACCION: Record<string, string> = {
  CREAR: 'creó',
  ACTUALIZAR: 'actualizó',
  ELIMINAR: 'eliminó',
  APROBAR: 'aprobó',
  RECHAZAR: 'rechazó',
  INICIAR_SESION: 'inició sesión',
}

const entidadLegible = (e: string) => e.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()

export function ListaActividadReciente({ registros }: { registros: Auditoria[] }) {
  return (
    <ul className="divide-y divide-line">
      {registros.map((r) => (
        <li key={r.id} className="flex items-baseline gap-3 px-5 py-3">
          <p className="min-w-0 flex-1 truncate text-sm text-ink-texto">
            <span className="font-medium text-ink">{r.usuario_nombre || 'Sistema'}</span>{' '}
            {ACCION[r.accion] ?? r.accion.toLowerCase()}
            {r.accion !== 'INICIAR_SESION' && (
              <> {entidadLegible(r.entidad)}{r.entidad_id ? ` #${r.entidad_id}` : ''}</>
            )}
          </p>
          <span className="flex-shrink-0 text-xs text-ink-light">{hace(r.creado_en)}</span>
        </li>
      ))}
    </ul>
  )
}

/** Fechas de actividades: muestra cuántos días faltan y marca las vencidas. */
export function ListaFechas({ actividades, rutaBase }: { actividades: Actividad[]; rutaBase: string }) {
  return (
    <ul className="divide-y divide-line">
      {actividades.map((a) => {
        const fecha = parseISO(a.fecha_fin as string)
        const dias = differenceInCalendarDays(fecha, new Date())
        const estado = dias < 0 ? { t: `Vencida hace ${-dias} d`, c: 'text-red-600' }
          : dias === 0 ? { t: 'Vence hoy', c: 'text-naranja-hover' }
            : dias <= 7 ? { t: `En ${dias} d`, c: 'text-naranja-hover' }
              : { t: `En ${dias} d`, c: 'text-ink-muted' }
        return (
          <li key={a.id}>
            <Link to={`${rutaBase}/${a.proyecto}/actividades/${a.id}`} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-bg-soft">
              <span className="w-12 flex-shrink-0 text-center leading-tight">
                <span className="block text-lg font-semibold text-ink tabular-nums">{format(fecha, 'd')}</span>
                <span className="block text-[11px] text-ink-muted">{format(fecha, 'MMM', { locale: es })}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink-texto">{a.nombre}</span>
                <span className="block text-xs text-ink-muted">{a.codigo}</span>
              </span>
              <span className={`flex-shrink-0 text-xs font-medium ${estado.c}`}>{estado.t}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
