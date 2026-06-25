import { useMemo } from 'react'

/* ─────────────────────────────────────────────
   GRÁFICOS LIGEROS CON SVG
   Reemplazan a react-apexcharts para evitar
   problemas de renderizado y facilitar PDF.
   ───────────────────────────────────────────── */

export interface ChartDatum {
  name: string
  value: number
  color: string
}

function formatLabel(name: string, max = 30): string {
  if (!name) return ''
  return name.length > max ? `${name.slice(0, max).trim()}…` : name
}

/* ─────────── DONUT CHART ─────────── */
export function DonutChart({
  data,
  total,
  centerLabel,
}: {
  data: ChartDatum[]
  total: number
  centerLabel: string
}) {
  const radius = 80
  const stroke = 28
  const circumference = 2 * Math.PI * radius

  const segments = useMemo(() => {
    if (total <= 0) return []
    let offset = 0
    return data.map((d) => {
      const pct = d.value / total
      const dash = pct * circumference
      const segment = {
        ...d,
        pct,
        dash,
        offset,
      }
      offset -= dash
      return segment
    })
  }, [data, total, circumference])

  if (total <= 0 || segments.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-[13px] text-ink-muted">
        Sin datos para graficar
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[220px] h-[220px]">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="#E2E8F0"
            strokeWidth={stroke}
          />
          {segments.map((s, i) => (
            <circle
              key={i}
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${s.dash} ${circumference - s.dash}`}
              strokeDashoffset={s.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[28px] font-bold text-ink tabular-nums leading-none">{total}</span>
          <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wide mt-1">{centerLabel}</span>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[12px]">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-ink-muted">{formatLabel(s.name, 22)}</span>
            <span className="font-semibold text-ink tabular-nums">{s.value}</span>
            <span className="text-[10px] text-ink-light">({Math.round(s.pct * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────── HORIZONTAL BAR CHART ─────────── */
export function HorizontalBarChart({
  data,
  valueSuffix = '',
  showValues = true,
}: {
  data: ChartDatum[]
  valueSuffix?: string
  showValues?: boolean
}) {
  const sorted = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data])
  const max = useMemo(() => Math.max(1, ...sorted.map((d) => d.value)), [sorted])

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px] text-[13px] text-ink-muted">
        Sin datos para graficar
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sorted.map((d, i) => {
        const pct = Math.min(100, Math.max(0, (d.value / max) * 100))
        return (
          <div key={i} className="group">
            <div className="flex items-center justify-between text-[12px] mb-1">
              <span className="text-ink font-medium truncate max-w-[65%]" title={d.name}>
                {formatLabel(d.name, 38)}
              </span>
              {showValues && (
                <span className="text-ink font-semibold tabular-nums">
                  {d.value}
                  {valueSuffix}
                </span>
              )}
            </div>
            <div className="h-2.5 w-full bg-bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: d.color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─────────── COLUMN CHART ─────────── */
export function ColumnChart({
  data,
  valueSuffix = '',
}: {
  data: ChartDatum[]
  valueSuffix?: string
}) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-[13px] text-ink-muted">
        Sin datos para graficar
      </div>
    )
  }

  return (
    <div className="h-[240px] flex items-end gap-2 px-2">
      {data.map((d, i) => {
        const pct = Math.min(100, Math.max(0, (d.value / max) * 100))
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
            <span className="text-[11px] font-bold text-ink tabular-nums mb-1">
              {d.value}
              {valueSuffix}
            </span>
            <div className="w-full px-0.5 flex items-end" style={{ height: `${pct}%` }}>
              <div
                className="w-full rounded-t-md min-h-[4px] transition-all duration-700 ease-out"
                style={{ backgroundColor: d.color, height: '100%' }}
              />
            </div>
            <span className="text-[10px] text-ink-muted text-center mt-2 truncate w-full" title={d.name}>
              {formatLabel(d.name, 14)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ─────────── PROGRESS BAR CHART ─────────── */
function progressColor(value: number): string {
  if (value < 30) return '#E11D48'
  if (value < 60) return '#F59E0B'
  return '#16A34A'
}

export function ProgressBarChart({
  data,
}: {
  data: Array<{ name: string; value: number }>
}) {
  const sorted = useMemo(() => [...data].sort((a, b) => a.value - b.value), [data])

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px] text-[13px] text-ink-muted">
        Sin datos para graficar
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sorted.map((d, i) => {
        const pct = Math.min(100, Math.max(0, d.value))
        return (
          <div key={i} className="group">
            <div className="flex items-center justify-between text-[12px] mb-1">
              <span className="text-ink font-medium truncate max-w-[75%]" title={d.name}>
                {formatLabel(d.name, 38)}
              </span>
              <span className="text-ink font-semibold tabular-nums">{pct}%</span>
            </div>
            <div className="h-2 w-full bg-bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: progressColor(pct) }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
