import { clsx } from 'clsx'
import { ESTADO_PROYECTO_LABELS } from '@/lib/constants'

interface StatusBadgeProps {
  estado: string
  texto?: string
}

interface StatusStyle {
  bg: string
  text: string
  dot: string
  pulse: boolean
  pulseColor?: string
}

const STATUS_STYLES: Record<string, StatusStyle> = {
  EN_EJECUCION: {
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#B45309]',
    dot: 'bg-[#EAB308]',
    pulse: true,
    pulseColor: 'bg-[#EAB308]',
  },
  EN_REVISION: {
    bg: 'bg-[#DBEAFE]',
    text: 'text-[#1D4ED8]',
    dot: 'bg-[#2563EB]',
    pulse: true,
    pulseColor: 'bg-[#2563EB]',
  },
  EN_SUSPENSION: {
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#B45309]',
    dot: 'bg-[#EAB308]',
    pulse: true,
    pulseColor: 'bg-[#EAB308]',
  },
  CANCELADO: {
    bg: 'bg-[#FEE2E2]',
    text: 'text-[#B91C1C]',
    dot: 'bg-[#DC2626]',
    pulse: false,
  },
  BORRADOR: {
    bg: 'bg-[#F3F4F6]',
    text: 'text-[#4B5563]',
    dot: 'bg-[#9CA3AF]',
    pulse: false,
  },
  FINALIZADO: {
    bg: 'bg-[#E0F2FE]',
    text: 'text-[#0C4A6E]',
    dot: 'bg-[#0284C7]',
    pulse: false,
  },
  CERRADO: {
    bg: 'bg-[#F1F5F9]',
    text: 'text-[#475569]',
    dot: 'bg-[#64748B]',
    pulse: false,
  },
  APROBADO: {
    bg: 'bg-[#DCFCE7]',
    text: 'text-[#15803D]',
    dot: 'bg-[#16A34A]',
    pulse: false,
  },
}

const FALLBACK: StatusStyle = {
  bg: 'bg-[#F3F4F6]',
  text: 'text-[#6B7280]',
  dot: 'bg-[#9CA3AF]',
  pulse: false,
}

export default function StatusBadge({ estado, texto }: StatusBadgeProps) {
  const style: StatusStyle = STATUS_STYLES[estado] ?? FALLBACK
  const label = texto || ESTADO_PROYECTO_LABELS[estado] || estado

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
            style.pulse ? style.pulseColor : style.dot,
          )}
        />
      </span>
      {label}
    </span>
  )
}
