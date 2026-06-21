import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type ChipColor = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'indigo' | 'purple'

interface ChipProps {
  color?: ChipColor
  children: ReactNode
  className?: string
  dot?: boolean
  pulse?: boolean
}

const CHIP_STYLES: Record<ChipColor, { bg: string; text: string; dot: string; ring: string }> = {
  gray:   { bg: 'bg-[#F1F5F9]', text: 'text-[#475569]', dot: 'bg-[#64748B]', ring: 'ring-[#E2E8F0]' },
  blue:   { bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]', dot: 'bg-[#2563EB]', ring: 'ring-[#BFDBFE]' },
  green:  { bg: 'bg-[#F0FDF4]', text: 'text-[#15803D]', dot: 'bg-[#22C55E]', ring: 'ring-[#BBF7D0]' },
  yellow: { bg: 'bg-[#FEFCE8]', text: 'text-[#A16207]', dot: 'bg-[#F59E0B]', ring: 'ring-[#FDE68A]' },
  red:    { bg: 'bg-[#FEF2F2]', text: 'text-[#B91C1C]', dot: 'bg-[#EF4444]', ring: 'ring-[#FECACA]' },
  indigo: { bg: 'bg-[#EEF2FF]', text: 'text-[#3730A3]', dot: 'bg-[#6366F1]', ring: 'ring-[#C7D2FE]' },
  purple: { bg: 'bg-[#FAF5FF]', text: 'text-[#6B21A8]', dot: 'bg-[#9333EA]', ring: 'ring-[#E9D5FF]' },
}

export default function Chip({ color = 'gray', children, className, dot = false, pulse = false }: ChipProps) {
  const s = CHIP_STYLES[color]!
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium leading-none ring-1 ring-inset select-none whitespace-nowrap',
        s.bg,
        s.text,
        s.ring,
        className,
      )}
    >
      {dot && (
        <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
          {pulse && (
            <span
              className={clsx('absolute inset-0 rounded-full opacity-75 status-pulse', s.dot)}
            />
          )}
          <span className={clsx('relative inline-flex h-1.5 w-1.5 rounded-full', s.dot)} />
        </span>
      )}
      {children}
    </span>
  )
}
