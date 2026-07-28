import ReactApexChart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'

type ApexAxisChartSeries = Array<{ name?: string; data: Array<number | [number, number] | [string | number, number] | { x: string; y: number }> }>
type ApexNonAxisChartSeries = number[]
type ApexChartType =
  | 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'rangeBar' | 'rangeArea'
  | 'heatmap' | 'treemap' | 'boxPlot' | 'candlestick' | 'radar' | 'polarArea'
  | 'radialBar' | 'scatter' | 'bubble' | 'histogram'

/* ─────────────────────────────────────────────────────────────────
   Paleta ejecutiva — sistema + contraste perceptual (no repetitiva)
   ───────────────────────────────────────────────────────────────── */
export const PALETTE = {
  emerald: '#16A34A',
  emeraldSoft: '#10B981',
  emeraldLight: '#D1FAE5',
  indigo: '#4F46E5',
  indigoSoft: '#6366F1',
  indigoLight: '#E0E7FF',
  amber: '#D97706',
  amberSoft: '#F59E0B',
  amberLight: '#FEF3C7',
  rose: '#E11D48',
  roseSoft: '#F43F5E',
  roseLight: '#FFE4E6',
  blue: '#2563EB',
  blueSoft: '#3B82F6',
  blueLight: '#DBEAFE',
  violet: '#7C3AED',
  violetSoft: '#8B5CF6',
  violetLight: '#EDE9FE',
  sky: '#0284C7',
  skySoft: '#0EA5E9',
  skyLight: '#E0F2FE',
  teal: '#0D9488',
  tealSoft: '#14B8A6',
  orange: '#EA580C',
  fuchsia: '#C026D3',
  cyan: '#0891B2',
  lime: '#65A30D',
  slate: '#475569',
  slateSoft: '#64748B',
  ink: '#0F172A',
} as const

export const SEMANTIC_COLORS: Record<string, string> = {
  emerald: PALETTE.emerald,
  indigo: PALETTE.indigo,
  amber: PALETTE.amber,
  rose: PALETTE.rose,
  blue: PALETTE.blue,
  violet: PALETTE.violet,
  sky: PALETTE.sky,
  slate: PALETTE.slate,
}

/** Categorías bien separadas en tono (evita barras “todas verdes”) */
const CATEGORICAL = [
  PALETTE.indigo,
  PALETTE.emerald,
  PALETTE.amber,
  PALETTE.sky,
  PALETTE.violet,
  PALETTE.rose,
  PALETTE.teal,
  PALETTE.blue,
  PALETTE.orange,
  PALETTE.fuchsia,
  PALETTE.cyan,
  PALETTE.lime,
  PALETTE.indigoSoft,
  PALETTE.emeraldSoft,
  PALETTE.amberSoft,
  PALETTE.skySoft,
]

export function colorAt(index: number): string {
  return CATEGORICAL[index % CATEGORICAL.length]!
}

export function assignUniqueColors<T extends { color?: string }>(items: T[]): (T & { color: string })[] {
  return items.map((item, i) => ({
    ...item,
    color: item.color || colorAt(i),
  }))
}

/** Color semántico de avance (umbral) con matices para no repetir idéntico */
export function progressColor(value: number, index = 0): string {
  const variantsLow = [PALETTE.rose, PALETTE.roseSoft, '#BE123C', '#F43F5E']
  const variantsMid = [PALETTE.amber, PALETTE.amberSoft, PALETTE.orange, '#CA8A04']
  const variantsHigh = [PALETTE.emerald, PALETTE.emeraldSoft, PALETTE.teal, '#15803D']
  if (value < 30) return variantsLow[index % variantsLow.length]!
  if (value < 70) return variantsMid[index % variantsMid.length]!
  return variantsHigh[index % variantsHigh.length]!
}

function truncateLabel(label: string, max = 28): string {
  const t = String(label ?? '').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function maxLabelLen(labels: string[], cap = 32): number {
  if (!labels.length) return 8
  return Math.min(cap, Math.max(...labels.map((l) => l.length), 8))
}

/* ─────────── Base ─────────── */
type ChartProps = {
  options: ApexOptions
  series: ApexAxisChartSeries | ApexNonAxisChartSeries
  type: ApexChartType
  height?: number | string
  width?: number | string
}

export function ApexChart({ options, series, type, height = 280, width = '100%' }: ChartProps) {
  return (
    <ReactApexChart
      options={options}
      series={series as any}
      type={type as any}
      height={height}
      width={width}
    />
  )
}

/* ─────────── Donut / Pie ─────────── */
export type DonutDatum = { name: string; value: number; color?: string }

export function DonutApex({
  data,
  height = 280,
  centerLabel = 'Total',
  showPercent = true,
}: {
  data: DonutDatum[]
  height?: number
  centerLabel?: string
  showPercent?: boolean
}) {
  const filtered = data.filter((d) => d.value > 0)
  const total = filtered.reduce((s, d) => s + d.value, 0)
  const colors = filtered.map((d, i) => d.color || colorAt(i))

  const options: ApexOptions = {
    chart: {
      fontFamily: 'inherit',
      toolbar: { show: false },
      animations: { enabled: true, speed: 600 },
    },
    labels: filtered.map((d) => d.name),
    colors,
    legend: {
      position: 'bottom',
      fontSize: '11px',
      fontWeight: 500,
      markers: { size: 7, strokeWidth: 0, offsetX: -2 },
      itemMargin: { horizontal: 10, vertical: 4 },
      formatter: (seriesName: string, opts?: { w: { globals: { series: number[] } }; seriesIndex: number }) => {
        if (!opts) return seriesName
        const val = opts.w.globals.series[opts.seriesIndex] as number
        const pct = total > 0 ? Math.round((val / total) * 100) : 0
        return showPercent ? `${seriesName}  ·  ${val} (${pct}%)` : `${seriesName}  ·  ${val}`
      },
    },
    dataLabels: { enabled: false },
    stroke: { width: 3, colors: ['#fff'] },
    plotOptions: {
      pie: {
        expandOnClick: true,
        donut: {
          size: '68%',
          labels: {
            show: true,
            name: { fontSize: '11px', fontWeight: 500, color: '#64748B', offsetY: -4 },
            value: {
              fontSize: '22px',
              fontWeight: 700,
              color: '#0F172A',
              offsetY: 2,
              formatter: (v: string | number) => String(v),
            },
            total: {
              show: true,
              showAlways: true,
              label: centerLabel,
              fontSize: '11px',
              fontWeight: 600,
              color: '#64748B',
              formatter: () => String(total),
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (v: number) => {
          const pct = total > 0 ? Math.round((v / total) * 100) : 0
          return `${v} (${pct}%)`
        },
      },
    },
    states: {
      hover: { filter: { type: 'darken' } },
      active: { filter: { type: 'none' } },
    },
  }
  const series = filtered.map((d) => d.value)
  return <ApexChart options={options} series={series} type="donut" height={height} />
}

/* ─────────── Radial Bars ─────────── */
export type RadialDatum = { name: string; value: number; color?: string }

export function RadialApex({
  data,
  height = 280,
}: {
  data: RadialDatum[]
  height?: number
}) {
  const options: ApexOptions = {
    chart: { fontFamily: 'inherit', toolbar: { show: false }, animations: { enabled: true, speed: 700 } },
    plotOptions: {
      radialBar: {
        hollow: { size: '32%', background: 'transparent' },
        track: { background: '#E2E8F0', strokeWidth: '100%', margin: 5 },
        dataLabels: {
          name: { fontSize: '12px', fontWeight: 600, color: '#475569', offsetY: -2 },
          value: { fontSize: '18px', fontWeight: 700, color: '#0F172A', offsetY: 2, formatter: (v: number | string) => `${v}%` },
          total: { show: true, label: 'Total', fontSize: '12px', fontWeight: 600, color: '#64748B', formatter: () => `${data.length} ítems` },
        },
      },
    },
    colors: data.map((d, i) => d.color || colorAt(i)),
    labels: data.map((d) => d.name),
    legend: { show: false },
    stroke: { lineCap: 'round' },
  }
  const series = data.map((d) => Math.min(100, Math.max(0, d.value)))
  return <ApexChart options={options} series={series} type="radialBar" height={height} />
}

/* ─────────── Vertical Bar (Column) ─────────── */
export type ColumnDatum = { name: string; value: number; color?: string }

export function ColumnApex({
  data,
  height = 280,
  valueFormatter = (v: number) => `${v}`,
}: {
  data: ColumnDatum[]
  height?: number
  valueFormatter?: (v: number) => string
}) {
  const labels = data.map((d) => truncateLabel(d.name, 14))
  const maxVal = Math.max(...data.map((d) => d.value), 1)

  const options: ApexOptions = {
    chart: {
      fontFamily: 'inherit',
      toolbar: { show: false },
      animations: { enabled: true, speed: 600 },
      parentHeightOffset: 0,
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        borderRadiusApplication: 'end',
        columnWidth: data.length <= 3 ? '42%' : '58%',
        distributed: true,
        dataLabels: { position: 'top' },
      },
    },
    colors: data.map((d, i) => d.color || colorAt(i)),
    dataLabels: {
      enabled: true,
      offsetY: -22,
      style: { fontSize: '11px', fontWeight: 700, colors: ['#0F172A'] },
      formatter: (v: number) => valueFormatter(v),
      background: { enabled: false },
    },
    legend: { show: false },
    grid: {
      borderColor: '#E2E8F0',
      strokeDashArray: 4,
      padding: { top: 16, right: 8, bottom: 0, left: 4 },
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      categories: labels,
      labels: {
        style: { fontSize: '11px', fontWeight: 600, colors: '#64748B' },
        rotate: labels.some((l) => l.length > 8) ? -20 : 0,
        rotateAlways: false,
        hideOverlappingLabels: true,
        trim: true,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      min: 0,
      max: Math.ceil(maxVal * 1.18),
      tickAmount: Math.min(5, Math.max(2, maxVal)),
      labels: {
        style: { fontSize: '11px', colors: '#94A3B8' },
        formatter: (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(0)),
      },
    },
    tooltip: {
      y: { formatter: (v: number) => valueFormatter(v) },
      x: {
        formatter: (_val, opts) => data[opts?.dataPointIndex ?? 0]?.name ?? '',
      },
    },
    states: {
      hover: { filter: { type: 'darken' } },
    },
  }
  const series = [{ name: 'Total', data: data.map((d) => d.value) }]
  return <ApexChart options={options} series={series} type="bar" height={height} />
}

/* ─────────── Horizontal Bar ─────────── */
export function BarHorizontalApex({
  data,
  height,
  valueFormatter = (v: number) => `${v}`,
  labelMaxLength = 26,
  valueIsPercent = false,
}: {
  data: ColumnDatum[]
  height?: number
  valueFormatter?: (v: number) => string
  labelMaxLength?: number
  /** Si true, eje X 0–100 y labels de valor más legibles en % */
  valueIsPercent?: boolean
}) {
  const labels = data.map((d) => truncateLabel(d.name, labelMaxLength))
  const rawMax = Math.max(...data.map((d) => d.value), 1)
  const maxVal = valueIsPercent ? 100 : rawMax
  const yChars = maxLabelLen(labels, labelMaxLength)
  // Espacio Y para nombres largos + padding derecho para labels fuera de barra
  const yLabelWidth = Math.min(160, Math.max(72, yChars * 6.2))
  const autoHeight = Math.max(200, 48 + data.length * 36)
  const chartHeight = height ?? autoHeight

  const options: ApexOptions = {
    chart: {
      fontFamily: 'inherit',
      toolbar: { show: false },
      animations: { enabled: true, speed: 600 },
      parentHeightOffset: 0,
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        borderRadiusApplication: 'end',
        horizontal: true,
        barHeight: data.length <= 4 ? '52%' : '68%',
        distributed: true,
        dataLabels: { position: 'top' },
      },
    },
    colors: data.map((d, i) => d.color || colorAt(i)),
    fill: { opacity: 0.95, type: 'solid' },
    dataLabels: {
      enabled: true,
      // Fuera de la barra: evita texto blanco “cortado” o ilegible en barras cortas
      textAnchor: 'start',
      offsetX: 8,
      style: {
        fontSize: '11px',
        fontWeight: 700,
        colors: ['#0F172A'],
      },
      formatter: (v: number) => valueFormatter(v),
      background: {
        enabled: true,
        foreColor: '#0F172A',
        padding: 4,
        borderRadius: 4,
        borderWidth: 0,
        opacity: 0.06,
      },
      dropShadow: { enabled: false },
    },
    legend: { show: false },
    grid: {
      borderColor: '#E2E8F0',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
      padding: { top: 0, right: 28, bottom: 0, left: 4 },
    },
    xaxis: {
      min: 0,
      max: valueIsPercent ? 100 : Math.ceil(maxVal * 1.22),
      tickAmount: valueIsPercent ? 5 : Math.min(6, Math.max(3, Math.ceil(maxVal))),
      labels: {
        style: { fontSize: '10px', colors: '#94A3B8', fontWeight: 500 },
        formatter: (val: string) => {
          const n = Number(val)
          if (Number.isNaN(n)) return val
          return valueIsPercent ? `${Math.round(n)}%` : String(Math.round(n))
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        maxWidth: yLabelWidth,
        style: { fontSize: '11px', fontWeight: 600, colors: '#334155' },
        offsetX: 0,
      },
    },
    tooltip: {
      y: { formatter: (v: number) => valueFormatter(v) },
      x: {
        formatter: (_val, opts) => data[opts?.dataPointIndex ?? 0]?.name ?? '',
      },
    },
    states: {
      hover: { filter: { type: 'darken' } },
    },
  }

  // categories van en xaxis aunque sea horizontal en Apex
  const optionsWithCats: ApexOptions = {
    ...options,
    xaxis: {
      ...options.xaxis,
      categories: labels,
    },
  }

  const series = [{ name: 'Total', data: data.map((d) => d.value) }]
  return <ApexChart options={optionsWithCats} series={series} type="bar" height={chartHeight} />
}

/* ─────────── Stacked Area (Carga mensual) ─────────── */
export type AreaSeries = { name: string; data: number[]; color?: string }

export function StackedAreaApex({
  categories,
  series,
  height = 280,
  valueFormatter = (v: number) => `${v}`,
}: {
  categories: string[]
  series: AreaSeries[]
  height?: number
  valueFormatter?: (v: number) => string
}) {
  const options: ApexOptions = {
    chart: {
      fontFamily: 'inherit',
      toolbar: { show: false },
      animations: { enabled: true, speed: 600 },
      stacked: true,
    },
    colors: series.map((s, i) => s.color || colorAt(i)),
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.55, opacityTo: 0.25, shadeIntensity: 1 } },
    legend: { position: 'top', horizontalAlign: 'left', fontSize: '12px', fontWeight: 500, markers: { size: 6, strokeWidth: 0 } },
    grid: { borderColor: '#E2E8F0', strokeDashArray: 4, padding: { left: 10, right: 10 } },
    xaxis: {
      categories,
      labels: { style: { fontSize: '11px', fontWeight: 500, colors: '#64748B' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { fontSize: '11px', colors: '#94A3B8' } } },
    tooltip: { y: { formatter: (v: number) => valueFormatter(v) } },
  }
  return <ApexChart options={options} series={series} type="area" height={height} />
}

/* ─────────── Line (Avance promedio) ─────────── */
export function LineApex({
  categories,
  data,
  color = PALETTE.emerald,
  height = 280,
  name = 'Avance',
}: {
  categories: string[]
  data: number[]
  color?: string
  height?: number
  name?: string
}) {
  const options: ApexOptions = {
    chart: { fontFamily: 'inherit', toolbar: { show: false }, animations: { enabled: true, speed: 700 } },
    colors: [color],
    stroke: { curve: 'smooth', width: 3 },
    markers: { size: 5, strokeWidth: 0, hover: { size: 7 } },
    grid: { borderColor: '#E2E8F0', strokeDashArray: 4 },
    xaxis: { categories, labels: { style: { fontSize: '11px', colors: '#64748B' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { fontSize: '11px', colors: '#94A3B8' }, formatter: (v: number) => `${v}%` }, max: 100 },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v: number) => `${v}%` } },
  }
  const series = [{ name, data }]
  return <ApexChart options={options} series={series} type="line" height={height} />
}

/* ─────────── Timeline / Range Bar (Cronograma) ─────────── */
export type TimelineDatum = {
  codigo: string
  titulo: string
  estado: string
  fechaInicio: string
  fechaFin: string
  progreso: number
}

const ESTADO_TIMELINE_COLORS: Record<string, string> = {
  BORRADOR: '#94A3B8',
  EN_REVISION: PALETTE.blue,
  APROBADO: PALETTE.emeraldSoft,
  EN_EJECUCION: PALETTE.emerald,
  EN_SUSPENSION: PALETTE.amber,
  FINALIZADO: PALETTE.ink,
  CERRADO: '#64748B',
  CANCELADO: PALETTE.rose,
}

export function TimelineApex({
  data,
  height = 320,
}: {
  data: TimelineDatum[]
  height?: number
}) {
  const series = data.map((d) => ({
    x: d.codigo,
    y: [new Date(d.fechaInicio).getTime(), new Date(d.fechaFin).getTime()] as [number, number],
    fillColor: ESTADO_TIMELINE_COLORS[d.estado] || PALETTE.slate,
    goals: [
      {
        name: 'Avance',
        value: (new Date(d.fechaInicio).getTime() +
          (new Date(d.fechaFin).getTime() - new Date(d.fechaInicio).getTime()) * (d.progreso / 100)),
        strokeHeight: 5,
        strokeColor: PALETTE.ink,
      },
    ],
  }))
  const options: ApexOptions = {
    chart: { fontFamily: 'inherit', toolbar: { show: false }, animations: { enabled: true, speed: 700 }, height },
    plotOptions: {
      bar: { horizontal: true, borderRadius: 6, barHeight: '60%' },
    },
    colors: data.map((d) => ESTADO_TIMELINE_COLORS[d.estado] || PALETTE.slate),
    fill: { type: 'solid', opacity: 0.85 },
    dataLabels: { enabled: false },
    grid: { borderColor: '#E2E8F0', strokeDashArray: 4 },
    xaxis: {
      type: 'datetime',
      labels: { style: { fontSize: '11px', colors: '#94A3B8' }, datetimeUTC: false, format: 'MMM yy' },
      axisBorder: { show: false },
    },
    yaxis: { labels: { style: { fontSize: '11px', fontWeight: 600, colors: '#0F172A' } } },
    tooltip: { custom: () => '' },
    legend: { show: false },
  }
  return <ApexChart options={options} series={[{ data: series as unknown as Array<number | { x: string; y: number }> }]} type="rangeBar" height={height} />
}

/* ─────────── Heatmap ─────────── */
export type HeatmapRow = { name: string; data: { x: string; y: number }[] }

export function HeatmapApex({
  rows,
  height = 280,
}: {
  rows: HeatmapRow[]
  height?: number
  color?: string
}) {
  const options: ApexOptions = {
    chart: { fontFamily: 'inherit', toolbar: { show: false }, animations: { enabled: true, speed: 500 } },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.6,
        radius: 4,
        colorScale: {
          ranges: [
            { from: 0, to: 0, color: '#F1F5F9', name: 'Sin datos' },
            { from: 1, to: 2, color: '#D1FAE5', name: 'Bajo' },
            { from: 3, to: 5, color: '#6EE7B7', name: 'Medio' },
            { from: 6, to: 9, color: '#10B981', name: 'Alto' },
            { from: 10, to: 9999, color: '#047857', name: 'Muy alto' },
          ],
        },
      },
    },
    dataLabels: { enabled: false },
    grid: { borderColor: '#E2E8F0' },
    xaxis: { labels: { style: { fontSize: '10px', colors: '#64748B' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { fontSize: '11px', fontWeight: 600, colors: '#0F172A' } } },
    legend: { show: false },
    stroke: { width: 2, colors: ['#fff'] },
  }
  return <ApexChart options={options} series={rows} type="heatmap" height={height} />
}

/* ─────────── Sparkline (mini gráfico inline) ─────────── */
export function SparklineApex({
  data,
  color = PALETTE.emerald,
  height = 50,
}: {
  data: number[]
  color?: string
  height?: number
}) {
  const options: ApexOptions = {
    chart: { fontFamily: 'inherit', sparkline: { enabled: true }, animations: { enabled: true, speed: 400 } },
    colors: [color],
    stroke: { curve: 'smooth', width: 2 },
    tooltip: { enabled: false },
  }
  return <ApexChart options={options} series={[{ data }]} type="line" height={height} />
}
