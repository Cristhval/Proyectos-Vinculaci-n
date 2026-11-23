import { clsx } from 'clsx'
import type { Dispositivo, EstadoConexion } from '@/types/iot'

/* Colores semánticos (solo estados): verde en línea, gris sin conexión, ámbar pendiente. */
const ESTILOS: Record<EstadoConexion | 'BAJA', { caja: string; punto: string; texto: string; pulso?: boolean }> = {
  EN_LINEA: { caja: 'bg-emerald-50 text-emerald-700', punto: 'bg-emerald-500', texto: 'En línea', pulso: true },
  SIN_CONEXION: { caja: 'bg-slate-100 text-slate-600', punto: 'bg-slate-400', texto: 'Sin conexión' },
  PENDIENTE: { caja: 'bg-amber-50 text-amber-700', punto: 'bg-amber-500', texto: 'Pendiente de primera lectura' },
  BAJA: { caja: 'bg-red-50 text-red-700', punto: 'bg-red-500', texto: 'Dado de baja' },
}

export default function EstadoConexionBadge({ dispositivo }: { dispositivo: Pick<Dispositivo, 'activo' | 'estado_conexion'> }) {
  const estilo = ESTILOS[dispositivo.activo ? dispositivo.estado_conexion : 'BAJA'] ?? ESTILOS.PENDIENTE
  return (
    <span className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold', estilo.caja)}>
      <span className="relative flex h-2 w-2 shrink-0">
        {estilo.pulso && <span className={clsx('absolute inline-flex h-full w-full rounded-full opacity-75 motion-safe:animate-ping', estilo.punto)} />}
        <span className={clsx('relative inline-flex h-2 w-2 rounded-full', estilo.punto)} />
      </span>
      {estilo.texto}
    </span>
  )
}
