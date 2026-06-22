interface ProgressBarProps {
  value: number
  max?: number
  height?: number
  color?: string
  bgColor?: string
  showLabel?: boolean
  labelClassName?: string
  className?: string
}

export default function ProgressBar({
  value,
  max = 100,
  height = 6,
  color,
  bgColor = '#E5E7EB',
  showLabel = false,
  labelClassName,
  className,
}: ProgressBarProps) {
  const pct = Math.min(Math.max(0, (value / max) * 100), 100)
  const barColor = color || (pct < 30 ? '#DC2626' : pct <= 70 ? '#EAB308' : '#16A34A')

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <div className="flex-1 rounded-full overflow-hidden" style={{ height, background: bgColor }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      {showLabel && (
        <span className={`text-[11px] font-bold tabular-nums ${labelClassName || ''}`} style={{ color: barColor }}>
          {Math.round(pct)}%
        </span>
      )}
    </div>
  )
}
