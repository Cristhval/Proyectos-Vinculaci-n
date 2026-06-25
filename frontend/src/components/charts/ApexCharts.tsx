import ReactApexChart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'

type ApexAxisChartSeries = Array<{ name?: string; data: Array<number | [number, number] | [string | number, number] | { x: string; y: number }> }>
type ApexNonAxisChartSeries = number[]
type ApexChartType =
  | 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'rangeBar' | 'rangeArea'
  | 'heatmap' | 'treemap' | 'boxPlot' | 'candlestick' | 'radar' | 'polarArea'
  | 'radialBar' | 'scatter' | 'bubble' | 'histogram'

/* ─────────────────────────────────────────────────────────────────
   Paleta ejecutiva alineada con el sistema (igual a ReportesPage)
   ───────────────────────────────────────────────────────────────── */
export const PALETTE = {
  emerald: '#16A34A',
  emeraldSoft: '#10B981',
  emeraldLight: '#D1FAE5',
  indigo: '#4F46E5',
  indigoSoft: '#6366F1',
  indigoLight: '#E0E7FF',
  amber: '#F59E0B',
  amberSoft: '#FBBF24',
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
  skySoft: '#38BDF8',
  skyLight: '#E0F2FE',
  teal: '#0D9488',
  slate: '#475569',
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

const CATEGORICAL = [
  PALETTE.emerald,
  PALETTE.indigo,
  PALETTE.amber,
  PALETTE.rose,
  PALETTE.blue,
  PALETTE.violet,
  PALETTE.sky,
  PALETTE.teal,
  PALETTE.emeraldSoft,
  PALETTE.indigoSoft,
]

/* ─────────── Base ─────────── */
type ChartProps = {
  options: ApexOptions
  series: ApexAxisChartSeries | ApexNonAxisChartSeries
  type: ApexChartType
  height?: number | string
  width?: number | string
}

export function ApexChart({ options, series, type, height = 280, width = '100%' }: ChartProps) {
  // Cast genérico: la combinación series/type es validada por ApexCharts en runtime
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
}: {
  data: DonutDatum[]
  height?: number
  centerLabel?: string
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const options: ApexOptions = {
    chart: { fontFamily: 'inherit', toolbar: { show: false }, animations: { enabled: true, speed: 600 } },
    labels: data.map((d) => d.name),
    colors: data.map((d, i) => d.color || CATEGORICAL[i % CATEGORICAL.length]!),
    legend: { position: 'bottom', fontSize: '12px', fontWeight: 500, markers: { size: 6, strokeWidth: 0 }, itemMargin: { horizontal: 8, vertical: 4 } },
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: ['#fff'] },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: { fontSize: '12px', fontWeight: 500, color: '#64748B', offsetY: -2 },
            value: { fontSize: '24px', fontWeight: 700, color: '#0F172A', offsetY: 4, formatter: (v: string | number) => String(v) },
            total: {
              show: true,
              showAlways: true,
              label: centerLabel,
              fontSize: '12px',
              fontWeight: 600,
              color: '#64748B',
              formatter: () => String(total),
            },
          },
        },
      },
    },
    tooltip: { y: { formatter: (v: number) => `${v}` } },
  }
  const series = data.map((d) => d.value)
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
    colors: data.map((d, i) => d.color || CATEGORICAL[i % CATEGORICAL.length]!),
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
  const options: ApexOptions = {
    chart: { fontFamily: 'inherit', toolbar: { show: false }, animations: { enabled: true, speed: 600 } },
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: '55%', distributed: true, dataLabels: { position: 'top' } },
    },
    colors: data.map((d, i) => d.color || CATEGORICAL[i % CATEGORICAL.length]!),
    dataLabels: {
      enabled: true,
      offsetY: -18,
      style: { fontSize: '11px', fontWeight: 600, colors: ['#0F172A'] },
      formatter: (v: number) => valueFormatter(v),
    },
    legend: { show: false },
    grid: { borderColor: '#E2E8F0', strokeDashArray: 4, yaxis: { lines: { show: true } } },
    xaxis: {
      categories: data.map((d) => d.name),
      labels: { style: { fontSize: '11px', fontWeight: 500, colors: '#64748B' }, rotate: -25 },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { fontSize: '11px', colors: '#94A3B8' } } },
    tooltip: { y: { formatter: (v: number) => valueFormatter(v) } },
  }
  const series = [{ name: 'Total', data: data.map((d) => d.value) }]
  return <ApexChart options={options} series={series} type="bar" height={height} />
}

/* ─────────── Horizontal Bar ─────────── */
export function BarHorizontalApex({
  data,
  height = 280,
  valueFormatter = (v: number) => `${v}`,
}: {
  data: ColumnDatum[]
  height?: number
  valueFormatter?: (v: number) => string
}) {
  const options: ApexOptions = {
    chart: { fontFamily: 'inherit', toolbar: { show: false }, animations: { enabled: true, speed: 600 } },
    plotOptions: {
      bar: { borderRadius: 6, horizontal: true, barHeight: '70%', distributed: true, dataLabels: { position: 'top' } },
    },
    colors: data.map((d, i) => d.color || CATEGORICAL[i % CATEGORICAL.length]!),
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      offsetX: 0,
      style: { fontSize: '11px', fontWeight: 600, colors: ['#fff'] },
      formatter: (v: number) => valueFormatter(v),
    },
    legend: { show: false },
    grid: { borderColor: '#E2E8F0', strokeDashArray: 4 },
    xaxis: {
      categories: data.map((d) => d.name),
      labels: { style: { fontSize: '11px', colors: '#94A3B8' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { fontSize: '12px', fontWeight: 500, colors: '#0F172A' } } },
    tooltip: { y: { formatter: (v: number) => valueFormatter(v) } },
  }
  const series = [{ name: 'Total', data: data.map((d) => d.value) }]
  return <ApexChart options={options} series={series} type="bar" height={height} />
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
    colors: series.map((s, i) => s.color || CATEGORICAL[i % CATEGORICAL.length]!),
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
