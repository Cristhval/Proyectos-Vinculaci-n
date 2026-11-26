import { clsx } from 'clsx'
import { TONOS_ESTADO } from '@/lib/estados'

interface EstadoBadgeProps {
  estado: string
  texto?: string
}

interface EstadoStyle {
  bg: string
  text: string
  pulse: boolean
  pulseColor?: string
  label: string
}

/** Tonos de la paleta única (lib/estados.ts): activo = éxito, inactivo = neutro, retirado = peligro. */
const ESTADO_STYLES: Record<string, EstadoStyle> = {
  ACTIVO: { bg: TONOS_ESTADO.exito.fondo, text: TONOS_ESTADO.exito.texto, pulse: true, pulseColor: TONOS_ESTADO.exito.punto, label: 'Activo' },
  INACTIVO: { bg: TONOS_ESTADO.neutro.fondo, text: TONOS_ESTADO.neutro.texto, pulse: false, label: 'Inactivo' },
  RETIRADO: { bg: TONOS_ESTADO.peligro.fondo, text: TONOS_ESTADO.peligro.texto, pulse: false, label: 'Retirado' },
}

const FALLBACK: EstadoStyle = { bg: TONOS_ESTADO.neutro.fondo, text: TONOS_ESTADO.neutro.texto, pulse: false, label: '' }

export default function EstadoBadge({ estado, texto }: EstadoBadgeProps) {
  const style: EstadoStyle = ESTADO_STYLES[estado] ?? FALLBACK
  const label = texto || style.label || estado

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-md whitespace-nowrap',
        style.bg,
        style.text,
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {style.pulse && style.pulseColor && (
          <span
            className={clsx(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              style.pulseColor,
            )}
          />
        )}
        <span
          className={clsx(
            'relative inline-flex rounded-full h-2 w-2',
            style.pulse ? style.pulseColor : 'bg-current opacity-40',
          )}
        />
      </span>
      {label}
    </span>
  )
}
