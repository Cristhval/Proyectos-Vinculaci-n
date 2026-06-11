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
    bg: 'bg-[#6B7280]',
    text: 'text-[#F9FAFB]',
    dot: 'bg-[#E5E7EB]',
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

export default function StatusBadge({ estado, texto }: StatusBadgeProps) {
  const style = STATUS_STYLES[estado] ?? STATUS_STYLES.BORRADOR!
  const label = texto || ESTADO_PROYECTO_LABELS[estado] || estado

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-0.5 min-w-[75px] justify-center',
        style.bg,
        style.text,
      )}
      style={{ borderRadius: '20px', padding: '1px 4px', fontSize: '9px', fontWeight: 500 }}
    >
      <span className="relative inline-flex h-1 w-1 shrink-0">
        {style.pulse && (
          <span
            className={clsx(
              'absolute inset-0 rounded-full opacity-75',
              style.pulseColor,
              estado === 'EN_SUSPENSION' ? 'status-pulse-slow' : 'status-pulse',
            )}
          />
        )}
        <span className={clsx('relative inline-flex h-1 w-1 rounded-full', style.dot)} />
      </span>
      {label}
    </span>
  )
}
