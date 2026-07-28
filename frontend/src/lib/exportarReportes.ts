import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  ESTADO_PROYECTO_LABELS,
  TIPO_PROYECTO_LABELS,
  ESTADO_CONVENIO_LABELS,
} from '@/lib/constants'
import type { ReporteProyecto, ReporteConvenio, DashboardKPIs } from '@/types/reportes'

type JsPDFWithAutoTable = jsPDF & { autoTable: typeof autoTable; lastAutoTable: { finalY: number } }
type RGB = [number, number, number]

/** Paleta alineada al sistema (emerald + indigo + semántica) */
const C = {
  primary: [22, 163, 74] as RGB,       // emerald-600
  primaryDeep: [6, 95, 70] as RGB,     // emerald-900-ish
  primarySoft: [209, 250, 229] as RGB, // emerald-100
  accent: [79, 70, 229] as RGB,        // indigo-600
  accentDeep: [55, 48, 163] as RGB,
  accentSoft: [224, 231, 255] as RGB,
  ink: [15, 23, 42] as RGB,
  slate: [71, 85, 105] as RGB,
  muted: [100, 116, 139] as RGB,
  subtle: [148, 163, 184] as RGB,
  light: [248, 250, 252] as RGB,
  mutedBg: [241, 245, 249] as RGB,
  border: [226, 232, 240] as RGB,
  white: [255, 255, 255] as RGB,
  amber: [217, 119, 6] as RGB,
  amberSoft: [254, 243, 199] as RGB,
  rose: [225, 29, 72] as RGB,
  roseSoft: [255, 228, 230] as RGB,
  sky: [2, 132, 199] as RGB,
  teal: [13, 148, 136] as RGB,
  violet: [124, 58, 237] as RGB,
  blue: [37, 99, 235] as RGB,
} as const

const ESTADO_RGB: Record<string, RGB> = {
  BORRADOR: [148, 163, 184],
  EN_REVISION: [2, 132, 199],
  APROBADO: [79, 70, 229],
  EN_EJECUCION: [22, 163, 74],
  EN_SUSPENSION: [217, 119, 6],
  FINALIZADO: [15, 118, 110],
  CERRADO: [100, 116, 139],
  CANCELADO: [225, 29, 72],
}

const TIPO_RGB: Record<string, RGB> = {
  VINCULACION: [22, 163, 74],
  INVESTIGACION: [79, 70, 229],
  EXTENSION: [217, 119, 6],
  MIXTO: [124, 58, 237],
}

const CONVENIO_RGB: Record<string, RGB> = {
  BORRADOR: [148, 163, 184],
  EN_REVISION: [2, 132, 199],
  VIGENTE: [22, 163, 74],
  VENCIDO: [225, 29, 72],
  SUSPENDIDO: [217, 119, 6],
  FINALIZADO: [15, 118, 110],
  CANCELADO: [190, 18, 60],
}

const CATEGORICAL_RGB: RGB[] = [
  [79, 70, 229],
  [22, 163, 74],
  [217, 119, 6],
  [2, 132, 199],
  [124, 58, 237],
  [225, 29, 72],
  [13, 148, 136],
  [37, 99, 235],
  [234, 88, 12],
  [192, 38, 211],
]

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—'
  try { return format(new Date(dateStr), 'dd/MM/yyyy') } catch { return dateStr }
}

const formatCurrency = (value: string): string => {
  const num = parseFloat(value)
  if (isNaN(num)) return value
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(num)
}

const fmtPct = (n: number): string => `${Math.round(n || 0)}%`

const drawFill = (doc: JsPDFWithAutoTable, x: number, y: number, w: number, h: number, color: RGB) => {
  doc.setFillColor(color[0], color[1], color[2])
  doc.rect(x, y, w, h, 'F')
}

const drawRoundFill = (doc: JsPDFWithAutoTable, x: number, y: number, w: number, h: number, r: number, color: RGB) => {
  doc.setFillColor(color[0], color[1], color[2])
  doc.roundedRect(x, y, w, h, r, r, 'F')
}

const drawText = (
  doc: JsPDFWithAutoTable,
  text: string, x: number, y: number,
  size = 10, color: RGB = C.ink,
  style: 'normal' | 'bold' | 'italic' = 'normal',
  align: 'left' | 'center' | 'right' = 'left',
) => {
  doc.setFontSize(size)
  doc.setFont('helvetica', style)
  doc.setTextColor(color[0], color[1], color[2])
  doc.text(String(text ?? ''), x, y, { align })
}

const drawLine = (
  doc: JsPDFWithAutoTable,
  x1: number, y1: number, x2: number, y2: number,
  color: RGB = C.border, w = 0.3,
) => {
  doc.setDrawColor(color[0], color[1], color[2])
  doc.setLineWidth(w)
  doc.line(x1, y1, x2, y2)
}

function buildDoc(): JsPDFWithAutoTable {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as unknown as JsPDFWithAutoTable
  doc.autoTable = autoTable
  return doc
}

function progressRgb(val: number): RGB {
  if (val >= 70) return C.primary
  if (val >= 30) return C.amber
  return C.rose
}

/** Barra horizontal compacta (tabla visual) */
function drawHBarChart(
  doc: JsPDFWithAutoTable,
  items: Array<{ label: string; value: number; color: RGB }>,
  x: number,
  y: number,
  width: number,
  opts?: { maxLabel?: number; barH?: number; gap?: number; showPct?: boolean; forceMax?: number },
): number {
  const maxLabel = opts?.maxLabel ?? 32
  const barH = opts?.barH ?? 5.5
  const gap = opts?.gap ?? 7.2
  const showPct = opts?.showPct ?? true
  const maxVal = opts?.forceMax ?? Math.max(...items.map((i) => i.value), 1)
  const labelW = Math.min(52, width * 0.32)
  const valueW = 14
  const barW = width - labelW - valueW - 4
  let cy = y

  items.forEach((item) => {
    const label = item.label.length > maxLabel ? `${item.label.slice(0, maxLabel - 1)}…` : item.label
    drawText(doc, label, x, cy + 4, 8, C.slate, 'normal', 'left')

    // track
    drawRoundFill(doc, x + labelW, cy + 1.2, barW, barH, 1.2, C.mutedBg)
    const fill = Math.max(1.5, (item.value / maxVal) * barW)
    drawRoundFill(doc, x + labelW, cy + 1.2, fill, barH, 1.2, item.color)

    const valLabel = showPct && opts?.forceMax === 100
      ? `${Math.round(item.value)}%`
      : showPct && maxVal > 0
        ? `${item.value}`
        : String(item.value)
    drawText(doc, valLabel, x + labelW + barW + 2, cy + 4.2, 8, C.ink, 'bold', 'left')
    cy += gap
  })

  return cy
}

function drawKpiCard(
  doc: JsPDFWithAutoTable,
  x: number, y: number, w: number, h: number,
  label: string, value: string, accent: RGB, soft: RGB,
) {
  drawRoundFill(doc, x, y, w, h, 2.5, C.white)
  doc.setDrawColor(C.border[0], C.border[1], C.border[2])
  doc.setLineWidth(0.25)
  doc.roundedRect(x, y, w, h, 2.5, 2.5, 'S')
  // accent strip left
  doc.setFillColor(accent[0], accent[1], accent[2])
  doc.rect(x, y + 2, 1.4, h - 4, 'F')
  drawRoundFill(doc, x + 5, y + 4, 6, 6, 1.2, soft)
  drawText(doc, value, x + 5, y + h - 8, 14, C.ink, 'bold', 'left')
  drawText(doc, label, x + 5, y + h - 3.5, 7, C.muted, 'normal', 'left')
}

function ensureSpace(doc: JsPDFWithAutoTable, y: number, needed: number, pageH: number): number {
  if (y + needed > pageH - 18) {
    doc.addPage()
    return 28
  }
  return y
}

function sectionTitle(doc: JsPDFWithAutoTable, title: string, y: number, margin: number, pageW: number) {
  drawText(doc, title, margin, y, 12, C.primaryDeep, 'bold', 'left')
  drawLine(doc, margin, y + 2.5, pageW - margin, y + 2.5, C.primary, 0.7)
  return y + 8
}

/* ═══════════════════════════════════════════════════════════
   Exportar Excel
   ═══════════════════════════════════════════════════════════ */
export async function exportarExcel(
  kpis: DashboardKPIs | null,
  proyectos: ReporteProyecto[],
  convenios: ReporteConvenio[],
): Promise<void> {
  const loadingToast = toast.loading('Generando Excel...')
  try {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    const fecha = format(new Date(), 'yyyy-MM-dd')

    const resumenData = [
      ['RESUMEN DE INDICADORES'], [],
      ['Indicador', 'Valor'],
      ['Proyectos Activos', kpis?.resumen.proyectos_activos ?? 0],
      ['Proyectos Finalizados', kpis?.resumen.proyectos_finalizados ?? 0],
      ['Convenios Activos', kpis?.resumen.convenios_activos ?? 0],
      ['Convenios por Vencer', kpis?.resumen.convenios_por_vencer ?? 0],
      ['Alertas Pendientes', kpis?.resumen.alertas_pendientes ?? 0],
      ['Actividades Atrasadas', kpis?.resumen.actividades_atrasadas ?? 0],
    ]
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
    wsResumen['!cols'] = [{ wch: 25 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen KPIs')

    const proyectosData = proyectos.map((p) => ({
      'Código': p.codigo, 'Título': p.titulo,
      'Tipo': TIPO_PROYECTO_LABELS[p.tipo] || p.tipo,
      'Estado': ESTADO_PROYECTO_LABELS[p.estado] || p.estado,
      'Carrera': p.carrera || '—',
      'Responsable': p.responsable_nombre || p.responsable || '—',
      'Fecha Inicio': formatDate(p.fecha_inicio),
      'Fecha Fin': formatDate(p.fecha_fin_planificada),
      'Presupuesto': formatCurrency(p.presupuesto_aprobado),
      '% Avance': p.progreso, 'Participantes': p.participantes_count ?? 0,
    }))
    const wsProyectos = XLSX.utils.json_to_sheet(proyectosData)
    wsProyectos['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 14 }, { wch: 16 }, { wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsProyectos, 'Proyectos')

    const conveniosData = convenios.map((c) => ({
      'Código': c.codigo, 'Entidad': c.entidad_contraparte,
      'Tipo': c.tipo, 'Estado': c.estado,
      'Institución': c.institucion || '—',
      'Fecha Inicio': formatDate(c.fecha_inicio), 'Fecha Fin': formatDate(c.fecha_fin),
    }))
    const wsConvenios = XLSX.utils.json_to_sheet(conveniosData)
    wsConvenios['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 14 }, { wch: 14 }, { wch: 25 }, { wch: 12 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsConvenios, 'Convenios')

    XLSX.writeFile(wb, `Reporte_Vinculacion_${fecha}.xlsx`)
    toast.dismiss(loadingToast)
    toast.success(`Excel descargado: Reporte_Vinculacion_${fecha}.xlsx`)
  } catch {
    toast.dismiss(loadingToast)
    toast.error('Error al exportar Excel')
  }
}

/* ═══════════════════════════════════════════════════════════
   Exportar PDF — Admin / Coordinador (diseño ejecutivo)
   ═══════════════════════════════════════════════════════════ */
export async function exportarPDF(
  kpis: DashboardKPIs | null,
  proyectos: ReporteProyecto[],
  convenios: ReporteConvenio[] = [],
): Promise<void> {
  const loadingToast = toast.loading('Generando PDF profesional...')
  try {
    const doc = buildDoc()
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 14
    const contentW = pageW - margin * 2
    const fechaISO = format(new Date(), 'yyyy-MM-dd')
    const fechaLarga = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })

    const totalProyectos = proyectos.length
    const enEjecucion = proyectos.filter((p) => p.estado === 'EN_EJECUCION').length
    const enRevision = proyectos.filter((p) => p.estado === 'EN_REVISION').length
    const finalizados = proyectos.filter((p) => p.estado === 'FINALIZADO' || p.estado === 'CERRADO').length
    const activos = kpis?.resumen.proyectos_activos ?? proyectos.filter((p) =>
      ['EN_EJECUCION', 'APROBADO', 'EN_REVISION'].includes(p.estado),
    ).length
    const avgAvance = totalProyectos > 0
      ? Math.round(proyectos.reduce((s, p) => s + (p.progreso || 0), 0) / totalProyectos)
      : 0

    /* ═════ PORTADA ═════ */
    drawFill(doc, 0, 0, pageW, pageH, C.white)
    drawFill(doc, 0, 0, pageW, 52, C.primaryDeep)
    drawFill(doc, 0, 52, pageW, 3, C.primary)
    drawFill(doc, 0, 55, pageW, 1.2, C.accent)

    drawText(doc, 'UNIVERSIDAD NACIONAL DE LOJA', pageW / 2, 22, 13, C.white, 'bold', 'center')
    drawText(doc, 'Coordinación de Vinculación con la Sociedad', pageW / 2, 32, 10, C.primarySoft, 'normal', 'center')
    drawText(doc, 'Sistema de Gestión de Proyectos', pageW / 2, 42, 8.5, [167, 243, 208], 'normal', 'center')

    drawText(doc, 'REPORTE EJECUTIVO', pageW / 2, 88, 20, C.ink, 'bold', 'center')
    drawText(doc, 'Gestión y seguimiento de proyectos de vinculación', pageW / 2, 100, 11, C.slate, 'normal', 'center')

    // decorative line
    drawLine(doc, pageW / 2 - 28, 108, pageW / 2 + 28, 108, C.primary, 1.1)

    // highlight stats on cover
    const coverCards = [
      { label: 'Proyectos', value: String(totalProyectos), accent: C.primary, soft: C.primarySoft },
      { label: 'En ejecución', value: String(enEjecucion), accent: C.accent, soft: C.accentSoft },
      { label: 'Finalizados', value: String(finalizados), accent: C.teal, soft: [204, 251, 241] as RGB },
      { label: 'Avance medio', value: `${avgAvance}%`, accent: C.amber, soft: C.amberSoft },
    ]
    const cw = (contentW - 9) / 4
    coverCards.forEach((card, i) => {
      drawKpiCard(doc, margin + i * (cw + 3), 122, cw, 28, card.label, card.value, card.accent, card.soft)
    })

    drawRoundFill(doc, margin, 168, contentW, 36, 3, C.light)
    drawText(doc, 'Alcance del informe', margin + 8, 178, 9, C.muted, 'bold', 'left')
    drawText(doc, `Período: proyectos registrados en el sistema · Corte: ${fechaLarga}`, margin + 8, 186, 9, C.slate, 'normal', 'left')
    drawText(doc, `Incluye ${totalProyectos} proyectos${convenios.length ? ` y ${convenios.length} convenios` : ''}`, margin + 8, 194, 9, C.slate, 'normal', 'left')

    drawText(doc, `Loja, ${fechaLarga}`, pageW / 2, pageH - 36, 10, C.slate, 'italic', 'center')
    drawFill(doc, 0, pageH - 12, pageW, 12, C.primaryDeep)
    drawText(doc, 'Documento confidencial · Uso institucional', pageW / 2, pageH - 5, 8, C.white, 'normal', 'center')

    /* ═════ PÁGINA 2: RESUMEN EJECUTIVO + KPIs ═════ */
    doc.addPage()
    let y = 28
    y = sectionTitle(doc, '1. Resumen ejecutivo', y, margin, pageW)

    const kpiRows: Array<{ label: string; value: string; accent: RGB; soft: RGB }> = [
      { label: 'Total proyectos', value: String(totalProyectos), accent: C.ink, soft: C.mutedBg },
      { label: 'Proyectos activos', value: String(activos), accent: C.primary, soft: C.primarySoft },
      { label: 'En ejecución', value: String(enEjecucion), accent: C.teal, soft: [204, 251, 241] as RGB },
      { label: 'En revisión', value: String(enRevision), accent: C.sky, soft: [224, 242, 254] as RGB },
      { label: 'Convenios vigentes', value: String(kpis?.resumen.convenios_activos ?? 0), accent: C.accent, soft: C.accentSoft },
      { label: 'Por vencer (30d)', value: String(kpis?.resumen.convenios_por_vencer ?? 0), accent: C.amber, soft: C.amberSoft },
      { label: 'Alertas pendientes', value: String(kpis?.resumen.alertas_pendientes ?? 0), accent: C.rose, soft: C.roseSoft },
      { label: 'Act. atrasadas', value: String(kpis?.resumen.actividades_atrasadas ?? 0), accent: C.violet, soft: [237, 233, 254] as RGB },
    ]

    const cardW = (contentW - 9) / 4
    const cardH = 26
    kpiRows.forEach((k, i) => {
      const col = i % 4
      const row = Math.floor(i / 4)
      drawKpiCard(doc, margin + col * (cardW + 3), y + row * (cardH + 4), cardW, cardH, k.label, k.value, k.accent, k.soft)
    })
    y += 2 * (cardH + 4) + 10

    drawText(doc, `Generado el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm")}`, margin, y, 7.5, C.subtle, 'italic', 'left')
    y += 10

    /* Distribución por estado — tabla + barras */
    y = sectionTitle(doc, '2. Distribución de proyectos por estado', y, margin, pageW)

    const estadoOrder = ['BORRADOR', 'EN_REVISION', 'APROBADO', 'EN_EJECUCION', 'EN_SUSPENSION', 'FINALIZADO', 'CERRADO', 'CANCELADO']
    const estadoItems = estadoOrder
      .map((estado) => {
        const count = proyectos.filter((p) => p.estado === estado).length
        return {
          estado,
          label: ESTADO_PROYECTO_LABELS[estado] || estado,
          value: count,
          color: ESTADO_RGB[estado] || C.slate,
        }
      })
      .filter((i) => i.value > 0)

    if (estadoItems.length) {
      y = drawHBarChart(doc, estadoItems, margin, y, contentW, { maxLabel: 18, barH: 5.2, gap: 7 })
      y += 4

      autoTable(doc, {
        startY: y,
        head: [['Estado', 'Cantidad', '% del total']],
        body: [
          ...estadoItems.map((i) => [
            i.label,
            String(i.value),
            totalProyectos > 0 ? fmtPct((i.value / totalProyectos) * 100) : '0%',
          ]),
          ['TOTAL', String(totalProyectos), '100%'],
        ],
        headStyles: { fillColor: C.primaryDeep, textColor: C.white, fontStyle: 'bold', fontSize: 8.5, halign: 'left' },
        bodyStyles: { fontSize: 8.5, cellPadding: 2.8, lineColor: C.border, lineWidth: 0.1 },
        alternateRowStyles: { fillColor: C.light },
        didParseCell: (dataItem: any) => {
          if (dataItem.section === 'body' && dataItem.row.index < estadoItems.length && dataItem.column.index === 0) {
            const item = estadoItems[dataItem.row.index]
            if (item) dataItem.cell.styles.textColor = item.color
          }
          if (dataItem.section === 'body' && dataItem.row.index === estadoItems.length) {
            dataItem.cell.styles.fontStyle = 'bold'
            dataItem.cell.styles.fillColor = C.primarySoft
            dataItem.cell.styles.textColor = C.primaryDeep
          }
        },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { cellWidth: 40, halign: 'center' },
          2: { cellWidth: 40, halign: 'center' },
        },
        margin: { left: margin, right: margin },
        theme: 'grid',
      })
      y = doc.lastAutoTable.finalY + 12
    } else {
      drawText(doc, 'No hay proyectos para distribuir.', margin, y, 9, C.muted, 'italic', 'left')
      y += 12
    }

    /* Por tipo */
    y = ensureSpace(doc, y, 70, pageH)
    y = sectionTitle(doc, '3. Distribución por tipo de proyecto', y, margin, pageW)

    const tipoOrder = ['VINCULACION', 'INVESTIGACION', 'EXTENSION', 'MIXTO']
    const tipoItems = tipoOrder
      .map((t) => ({
        label: TIPO_PROYECTO_LABELS[t] || t,
        value: proyectos.filter((p) => p.tipo === t).length,
        color: TIPO_RGB[t] || C.slate,
      }))
      .filter((i) => i.value > 0)

    if (tipoItems.length) {
      y = drawHBarChart(doc, tipoItems, margin, y, contentW * 0.92, { maxLabel: 16, barH: 6, gap: 8 })
      y += 6
      autoTable(doc, {
        startY: y,
        head: [['Tipo', 'Cantidad', '%']],
        body: tipoItems.map((i) => [
          i.label,
          String(i.value),
          totalProyectos > 0 ? fmtPct((i.value / totalProyectos) * 100) : '0%',
        ]),
        headStyles: { fillColor: C.accentDeep, textColor: C.white, fontSize: 8.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8.5, cellPadding: 2.8, lineColor: C.border, lineWidth: 0.1 },
        alternateRowStyles: { fillColor: C.light },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { cellWidth: 40, halign: 'center' },
          2: { cellWidth: 40, halign: 'center' },
        },
        margin: { left: margin, right: margin },
        theme: 'grid',
      })
      y = doc.lastAutoTable.finalY + 12
    }

    /* Por carrera */
    const carreraCounts: Record<string, number> = {}
    proyectos.forEach((p) => {
      const key = p.carrera || 'Sin carrera'
      carreraCounts[key] = (carreraCounts[key] || 0) + 1
    })
    const carreraItems = Object.entries(carreraCounts)
      .map(([label, value], i) => ({
        label,
        value,
        color: CATEGORICAL_RGB[i % CATEGORICAL_RGB.length]!,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12)

    if (carreraItems.length) {
      y = ensureSpace(doc, y, 20 + carreraItems.length * 7.5, pageH)
      y = sectionTitle(doc, '4. Proyectos por carrera', y, margin, pageW)
      y = drawHBarChart(doc, carreraItems, margin, y, contentW, { maxLabel: 28, barH: 5, gap: 6.8 })
      y += 10
    }

    /* Convenios */
    if (convenios.length > 0) {
      y = ensureSpace(doc, y, 60, pageH)
      y = sectionTitle(doc, '5. Convenios por estado', y, margin, pageW)
      const convCounts: Record<string, number> = {}
      convenios.forEach((c) => {
        convCounts[c.estado] = (convCounts[c.estado] || 0) + 1
      })
      const convItems = Object.entries(convCounts).map(([estado, value]) => ({
        label: ESTADO_CONVENIO_LABELS[estado] || estado,
        value,
        color: CONVENIO_RGB[estado] || C.slate,
      }))
      y = drawHBarChart(doc, convItems, margin, y, contentW * 0.9, { maxLabel: 16, barH: 5.5, gap: 7.5 })
      y += 10
    }

    /* Avance top proyectos en ejecución */
    const avanceItems = proyectos
      .filter((p) => p.estado === 'EN_EJECUCION')
      .map((p) => ({
        label: p.titulo || p.codigo,
        value: Math.round(p.progreso || 0),
        color: progressRgb(Math.round(p.progreso || 0)),
      }))
      .sort((a, b) => a.value - b.value)
      .slice(0, 10)

    if (avanceItems.length) {
      y = ensureSpace(doc, y, 24 + avanceItems.length * 7.2, pageH)
      y = sectionTitle(doc, '6. Avance de proyectos en ejecución', y, margin, pageW)
      drawText(doc, 'Escala 0–100%  ·  Rojo <30%  ·  Ámbar 30–69%  ·  Verde ≥70%', margin, y - 2, 7, C.subtle, 'normal', 'left')
      y += 2
      y = drawHBarChart(doc, avanceItems, margin, y, contentW, {
        maxLabel: 30,
        barH: 5,
        gap: 6.8,
        forceMax: 100,
        showPct: true,
      })
      y += 8
    }

    /* ═════ LISTADO DETALLADO ═════ */
    doc.addPage()
    y = 28
    y = sectionTitle(doc, '7. Listado detallado de proyectos', y, margin, pageW)
    drawText(doc, `${proyectos.length} registro${proyectos.length === 1 ? '' : 's'} · orden de exportación`, margin, y - 3, 8, C.muted, 'normal', 'left')
    y += 2

    if (proyectos.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['N°', 'Código', 'Título', 'Tipo', 'Estado', 'Responsable', 'Inicio', 'Fin', 'Presup.', 'Avance']],
        body: proyectos.map((p, i) => [
          String(i + 1),
          p.codigo,
          (p.titulo || '').length > 32 ? `${(p.titulo || '').substring(0, 30)}…` : (p.titulo || ''),
          TIPO_PROYECTO_LABELS[p.tipo] || p.tipo,
          ESTADO_PROYECTO_LABELS[p.estado] || p.estado,
          (p.responsable_nombre || p.responsable || '—').length > 18
            ? `${(p.responsable_nombre || p.responsable || '').substring(0, 16)}…`
            : (p.responsable_nombre || p.responsable || '—'),
          formatDate(p.fecha_inicio),
          formatDate(p.fecha_fin_planificada),
          formatCurrency(p.presupuesto_aprobado),
          fmtPct(p.progreso),
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: C.primaryDeep,
          textColor: C.white,
          fontSize: 7.2,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 2.2,
        },
        bodyStyles: { fontSize: 6.8, cellPadding: 2, lineColor: C.border, lineWidth: 0.08, textColor: C.ink },
        alternateRowStyles: { fillColor: C.light },
        columnStyles: {
          0: { cellWidth: 8, halign: 'right', textColor: C.muted },
          1: { cellWidth: 20, fontStyle: 'bold', textColor: C.primaryDeep },
          2: { cellWidth: 38 },
          3: { cellWidth: 18 },
          4: { cellWidth: 20 },
          5: { cellWidth: 24 },
          6: { cellWidth: 16 },
          7: { cellWidth: 16 },
          8: { cellWidth: 18, halign: 'right' },
          9: { cellWidth: 14, halign: 'right', fontStyle: 'bold' },
        },
        didParseCell: (dataItem: any) => {
          if (dataItem.section === 'body' && dataItem.column.index === 4) {
            const p = proyectos[dataItem.row.index]
            if (p) {
              const rgb = ESTADO_RGB[p.estado]
              if (rgb) dataItem.cell.styles.textColor = rgb
            }
          }
          if (dataItem.section === 'body' && dataItem.column.index === 9) {
            const p = proyectos[dataItem.row.index]
            if (p) dataItem.cell.styles.textColor = progressRgb(Math.round(p.progreso || 0))
          }
        },
        margin: { left: margin, right: margin },
      })
    } else {
      drawText(doc, 'No hay proyectos para mostrar.', margin, y + 5, 10, C.muted, 'italic', 'left')
    }

    /* ═════ CIERRE ═════ */
    doc.addPage()
    drawFill(doc, 0, 0, pageW, 8, C.primary)
    drawFill(doc, 0, 8, pageW, 1, C.accent)

    const pieY = pageH / 2 - 28
    drawText(doc, 'Universidad Nacional de Loja', margin, pieY, 15, C.ink, 'bold', 'left')
    drawText(doc, 'Coordinación de Vinculación con la Sociedad', margin, pieY + 8, 11, C.slate, 'normal', 'left')
    drawLine(doc, margin, pieY + 14, margin + 48, pieY + 14, C.primary, 1)

    drawText(doc, 'Este reporte fue generado automáticamente por el Sistema de', margin, pieY + 26, 9, C.muted, 'normal', 'left')
    drawText(doc, 'Gestión de Proyectos de Vinculación con la Sociedad.', margin, pieY + 33, 9, C.muted, 'normal', 'left')
    drawText(doc, 'Los indicadores reflejan el estado del sistema al momento de la exportación.', margin, pieY + 42, 8.5, C.subtle, 'normal', 'left')

    drawRoundFill(doc, margin, pieY + 52, contentW, 22, 2.5, C.light)
    drawText(doc, 'Contacto institucional', margin + 6, pieY + 60, 8, C.muted, 'bold', 'left')
    drawText(doc, 'vinculacion.sociedad@unl.edu.ec  ·  www.unl.edu.ec', margin + 6, pieY + 68, 8.5, C.slate, 'normal', 'left')

    drawFill(doc, 0, pageH - 12, pageW, 12, C.primaryDeep)
    drawText(doc, `© ${format(new Date(), 'yyyy')} UNL · Documento de uso interno`, pageW / 2, pageH - 5, 8, C.white, 'normal', 'center')

    /* ═════ HEADERS / FOOTERS (págs 2+) ═════ */
    const totalPages = doc.getNumberOfPages()
    for (let i = 2; i <= totalPages; i++) {
      doc.setPage(i)
      // header bar
      drawFill(doc, 0, 0, pageW, 16, C.primaryDeep)
      drawFill(doc, 0, 16, pageW, 1.2, C.primary)
      drawText(doc, 'UNL · Vinculación con la Sociedad', margin, 10.5, 8, C.white, 'bold', 'left')
      drawText(doc, 'Reporte ejecutivo', pageW / 2, 10.5, 8, [167, 243, 208], 'normal', 'center')
      drawText(doc, `${i} / ${totalPages}`, pageW - margin, 10.5, 8, C.white, 'bold', 'right')

      // footer
      drawLine(doc, margin, pageH - 11, pageW - margin, pageH - 11, C.border, 0.25)
      drawText(doc, `Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, pageH - 6, 7, C.muted, 'normal', 'left')
      drawText(doc, 'Confidencial · Uso institucional', pageW - margin, pageH - 6, 7, C.subtle, 'normal', 'right')
    }

    const nombreArchivo = `Reporte_Vinculacion_${fechaISO}.pdf`
    doc.save(nombreArchivo)
    toast.dismiss(loadingToast)
    toast.success(`PDF descargado: ${nombreArchivo}`)
  } catch (error) {
    console.error('Error al generar PDF:', error)
    toast.dismiss(loadingToast)
    toast.error('Error al generar el PDF')
  }
}
