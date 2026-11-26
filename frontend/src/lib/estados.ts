/**
 * Paleta única de insignias de estado. Todas las insignias (proyectos, convenios, actividades,
 * prioridades y roles) usan estos tonos suaves: fondo claro, texto fuerte y un punto de color.
 * Así un mismo estado se ve igual en cualquier pantalla.
 */
export type TonoEstado = 'neutro' | 'info' | 'revision' | 'exito' | 'atencion' | 'cierre' | 'peligro'

export interface EstiloTono {
  fondo: string
  texto: string
  borde: string
  punto: string
  /** Color del punto en hex (para estilos en línea o SVG). */
  hex: string
}

export const TONOS_ESTADO: Record<TonoEstado, EstiloTono> = {
  neutro: { fondo: 'bg-bg-muted', texto: 'text-ink-muted', borde: 'border-line', punto: 'bg-ink-light', hex: '#94A3B8' },
  info: { fondo: 'bg-indigo-50', texto: 'text-ink', borde: 'border-indigo-200', punto: 'bg-ink', hex: '#14213A' },
  revision: { fondo: 'bg-amber-50', texto: 'text-amber-800', borde: 'border-amber-100', punto: 'bg-amber-500', hex: '#F59E0B' },
  exito: { fondo: 'bg-emerald-50', texto: 'text-emerald-700', borde: 'border-emerald-100', punto: 'bg-emerald-600', hex: '#059669' },
  atencion: { fondo: 'bg-naranja-suave', texto: 'text-naranja-hover', borde: 'border-accent-muted', punto: 'bg-naranja', hex: '#E85A3C' },
  cierre: { fondo: 'bg-indigo-100', texto: 'text-ink-deep', borde: 'border-indigo-200', punto: 'bg-ink-deep', hex: '#0D1628' },
  peligro: { fondo: 'bg-red-50', texto: 'text-red-700', borde: 'border-red-100', punto: 'bg-status-error', hex: '#DC2626' },
}

export const TONO_ESTADO_PROYECTO: Record<string, TonoEstado> = {
  BORRADOR: 'neutro',
  EN_REVISION: 'revision',
  APROBADO: 'exito',
  EN_EJECUCION: 'info',
  EN_SUSPENSION: 'atencion',
  FINALIZADO: 'cierre',
  CERRADO: 'neutro',
  CANCELADO: 'peligro',
}

export const TONO_ESTADO_CONVENIO: Record<string, TonoEstado> = {
  BORRADOR: 'neutro',
  EN_REVISION: 'revision',
  VIGENTE: 'exito',
  SUSPENDIDO: 'atencion',
  FINALIZADO: 'cierre',
  VENCIDO: 'peligro',
  CANCELADO: 'peligro',
}

export const TONO_ESTADO_ACTIVIDAD: Record<string, TonoEstado> = {
  PENDIENTE: 'neutro',
  EN_PROCESO: 'info',
  COMPLETADA: 'exito',
  ATRASADA: 'peligro',
  CANCELADA: 'neutro',
}

export const TONO_PRIORIDAD: Record<string, TonoEstado> = {
  BAJA: 'neutro',
  MEDIA: 'info',
  ALTA: 'atencion',
  CRITICA: 'peligro',
}

export const TONO_ROL_PARTICIPANTE: Record<string, TonoEstado> = {
  LIDER: 'cierre',
  DOCENTE: 'info',
  ESTUDIANTE: 'neutro',
  APOYO: 'atencion',
  EXTERNO: 'revision',
}

/** Clases de insignia (fondo + texto) para un estado según su mapa de tonos. */
export function claseInsignia(mapa: Record<string, TonoEstado>, valor: string): string {
  const t = TONOS_ESTADO[mapa[valor] ?? 'neutro']
  return `${t.fondo} ${t.texto}`
}

export function estiloDe(mapa: Record<string, TonoEstado>, valor: string): EstiloTono {
  return TONOS_ESTADO[mapa[valor] ?? 'neutro']
}
