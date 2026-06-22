import { clsx } from 'clsx'

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

const ESTADO_STYLES: Record<string, EstadoStyle> = {
  ACTIVO: {
    bg: 'bg-[#DCFCE7]',
    text: 'text-[#15803D]',
    pulse: true,
    pulseColor: 'bg-[#16A34A]',
    label: 'Activo',
  },
  INACTIVO: {
    bg: 'bg-[#F3F4F6]',
    text: 'text-[#6B7280]',
    pulse: false,
    label: 'Inactivo',
  },
  RETIRADO: {
    bg: 'bg-[#FEE2E2]',
    text: 'text-[#B91C1C]',
    pulse: false,
    label: 'Retirado',
  },
}

const FALLBACK: EstadoStyle = {
  bg: 'bg-[#F3F4F6]',
  text: 'text-[#6B7280]',
  pulse: false,
  label: '',
}

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
