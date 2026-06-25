import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  ESTADO_PROYECTO_LABELS,
  TIPO_PROYECTO_LABELS,
} from '@/lib/constants'
import type { ReporteProyecto, ReporteConvenio, DashboardKPIs } from '@/types/reportes'

type JsPDFWithAutoTable = jsPDF & { autoTable: typeof autoTable; lastAutoTable: { finalY: number } }

const C = {
  primary: [30, 58, 138] as [number, number, number],
  primaryDeep: [23, 37, 84] as [number, number, number],
  ink: [15, 23, 42] as [number, number, number],
  slate: [71, 85, 105] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  subtle: [148, 163, 184] as [number, number, number],
  light: [248, 250, 252] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
} as const

const ESTADO_BADGE: Record<string, { fg: [number, number, number] }> = {
  BORRADOR: { fg: [71, 85, 105] },
  EN_REVISION: { fg: [29, 78, 216] },
  APROBADO: { fg: [6, 95, 70] },
  EN_EJECUCION: { fg: [20, 83, 45] },
  EN_SUSPENSION: { fg: [146, 64, 14] },
  FINALIZADO: { fg: [15, 23, 42] },
  CERRADO: { fg: [71, 85, 105] },
  CANCELADO: { fg: [159, 18, 57] },
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '\u2014'
  try { return format(new Date(dateStr), 'dd/MM/yyyy') } catch { return dateStr }
}

const formatCurrency = (value: string): string => {
  const num = parseFloat(value)
  if (isNaN(num)) return value
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(num)
}

const fmtPct = (n: number): string => `${Math.round(n || 0)}%`

const drawFill = (doc: JsPDFWithAutoTable, x: number, y: number, w: number, h: number, color: [number, number, number]) => {
  doc.setFillColor(color[0], color[1], color[2])
  doc.rect(x, y, w, h, 'F')
}

const drawText = (
  doc: JsPDFWithAutoTable,
  text: string, x: number, y: number,
  size = 10, color: [number, number, number] = C.ink,
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
  color: [number, number, number] = C.border, w = 0.3,
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
      'C\u00f3digo': p.codigo, 'T\u00edtulo': p.titulo,
      'Tipo': TIPO_PROYECTO_LABELS[p.tipo] || p.tipo,
      'Estado': ESTADO_PROYECTO_LABELS[p.estado] || p.estado,
      'Carrera': p.carrera || '\u2014',
      'Responsable': p.responsable_nombre || p.responsable || '\u2014',
      'Fecha Inicio': formatDate(p.fecha_inicio),
      'Fecha Fin': formatDate(p.fecha_fin_planificada),
      'Presupuesto': formatCurrency(p.presupuesto_aprobado),
      '% Avance': p.progreso, 'Participantes': p.participantes_count ?? 0,
    }))
    const wsProyectos = XLSX.utils.json_to_sheet(proyectosData)
    wsProyectos['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 14 }, { wch: 16 }, { wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsProyectos, 'Proyectos')

    const conveniosData = convenios.map((c) => ({
      'C\u00f3digo': c.codigo, 'Entidad': c.entidad_contraparte,
      'Tipo': c.tipo, 'Estado': c.estado,
      'Instituci\u00f3n': c.institucion || '\u2014',
      'Fecha Inicio': formatDate(c.fecha_inicio), 'Fecha Fin': formatDate(c.fecha_fin),
    }))
    const wsConvenios = XLSX.utils.json_to_sheet(conveniosData)
    wsConvenios['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 14 }, { wch: 14 }, { wch: 25 }, { wch: 12 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsConvenios, 'Convenios')

    XLSX.writeFile(wb, `Reporte_Vinculacion_${fecha}.xlsx`)
    toast.dismiss(loadingToast)
    toast.success(`Excel descargado: Reporte_Vinculacion_${fecha}.xlsx`)
  } catch (error) {
    toast.dismiss(loadingToast)
    toast.error('Error al exportar Excel')
  }
}

/* ═══════════════════════════════════════════════════════════
   Exportar PDF — Admin / Coordinador
   ═══════════════════════════════════════════════════════════ */
export async function exportarPDF(
  kpis: DashboardKPIs | null,
  proyectos: ReporteProyecto[],
  _convenios: ReporteConvenio[] = [],
): Promise<void> {
  const loadingToast = toast.loading('Generando PDF...')
  try {
    const doc = buildDoc()
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 14
    const fechaISO = format(new Date(), 'yyyy-MM-dd')

    const totalProyectos = proyectos.length
    const enEjecucion = proyectos.filter((p) => p.estado === 'EN_EJECUCION').length
    const enRevision = proyectos.filter((p) => p.estado === 'EN_REVISION').length
    const finalizados = proyectos.filter((p) => p.estado === 'FINALIZADO').length

    /* ═════ PORTADA ═════ */
    drawFill(doc, 0, 0, pageW, 8, C.primary)
    drawText(doc, 'UNIVERSIDAD NACIONAL DE LOJA', pageW / 2, 55, 15, C.ink, 'bold', 'center')
    drawText(doc, 'Coordinaci\u00f3n de Vinculaci\u00f3n con la Sociedad', pageW / 2, 66, 11, C.slate, 'normal', 'center')
    drawLine(doc, pageW / 2 - 40, 75, pageW / 2 + 40, 75, C.primary, 0.8)
    drawText(doc, 'REPORTE DE GESTI\u00d3N Y SEGUIMIENTO', pageW / 2, 100, 16, C.ink, 'bold', 'center')
    drawText(doc, 'DE PROYECTOS DE VINCULACI\u00d3N', pageW / 2, 112, 13, C.slate, 'normal', 'center')
    drawText(doc, 'Per\u00edodo: Proyectos registrados en el sistema', pageW / 2, 130, 10, C.muted, 'italic', 'center')
    drawText(doc, `Loja, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}`, pageW / 2, 160, 11, C.slate, 'italic', 'center')
    drawFill(doc, 0, pageH - 8, pageW, 8, C.primary)

    /* ═════ P\u00c1GINA 2: RESUMEN EJECUTIVO ═════ */
    doc.addPage()
    let y = 30
    drawText(doc, '1. RESUMEN EJECUTIVO', margin, y, 13, C.primary, 'bold', 'left')
    drawLine(doc, margin, y + 3, pageW - margin, y + 3, C.primary, 0.5)
    y += 8

    autoTable(doc, {
      startY: y,
      head: [['Indicador', 'Valor']],
      body: [
        ['Total de proyectos', String(totalProyectos)],
        ['Proyectos en ejecuci\u00f3n', String(enEjecucion)],
        ['Proyectos en revisi\u00f3n', String(enRevision)],
        ['Proyectos finalizados', String(finalizados)],
        ['Convenios vigentes', String(kpis?.resumen.convenios_activos ?? 0)],
        ['Convenios por vencer', String(kpis?.resumen.convenios_por_vencer ?? 0)],
        ['Alertas pendientes', String(kpis?.resumen.alertas_pendientes ?? 0)],
        ['Actividades atrasadas', String(kpis?.resumen.actividades_atrasadas ?? 0)],
      ],
      headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 9, halign: 'left' },
      bodyStyles: { fontSize: 9, cellPadding: 3.5, lineColor: C.border, lineWidth: 0.1 },
      alternateRowStyles: { fillColor: C.light },
      columnStyles: { 0: { cellWidth: 110, fontStyle: 'bold', textColor: C.ink }, 1: { cellWidth: 56, halign: 'right', textColor: C.primary, fontStyle: 'bold' } },
      margin: { left: margin, right: margin }, theme: 'grid',
    })
    y = doc.lastAutoTable.finalY + 4
    drawText(doc, `Datos al ${format(new Date(), "dd/MM/yyyy, HH:mm")}`, margin, y, 7, C.subtle, 'italic', 'left')

    /* ═════ P\u00c1GINA 3: DISTRIBUCI\u00d3N DE PROYECTOS ═════ */
    doc.addPage()
    y = 30
    drawText(doc, '2. DISTRIBUCI\u00d3N DE PROYECTOS', margin, y, 13, C.primary, 'bold', 'left')
    drawLine(doc, margin, y + 3, pageW - margin, y + 3, C.primary, 0.5)
    y += 8

    const estadoOrder = ['BORRADOR', 'EN_REVISION', 'APROBADO', 'EN_EJECUCION', 'EN_SUSPENSION', 'FINALIZADO', 'CERRADO', 'CANCELADO']
    const estadoRows = estadoOrder.map((estado) => {
      const count = proyectos.filter((p) => p.estado === estado).length
      return [ESTADO_PROYECTO_LABELS[estado] || estado, String(count), totalProyectos > 0 ? fmtPct((count / totalProyectos) * 100) : '0%']
    })
    estadoRows.push(['TOTAL', String(totalProyectos), '100%'])

    autoTable(doc, {
      startY: y, head: [['Estado', 'Cantidad', '%']], body: estadoRows,
      headStyles: { fillColor: C.primary, textColor: C.white, fontSize: 9, fontStyle: 'bold', halign: 'left' },
      bodyStyles: { fontSize: 9, cellPadding: 3.5, lineColor: C.border, lineWidth: 0.1 },
      alternateRowStyles: { fillColor: C.light },
      didParseCell: (dataItem: any) => {
        if (dataItem.section === 'body' && dataItem.row.index < estadoOrder.length && dataItem.column.index === 0) {
          const estado = estadoOrder[dataItem.row.index]
          const b = estado && ESTADO_BADGE[estado]
          if (b) dataItem.cell.styles.textColor = b.fg
        }
        if (dataItem.section === 'body' && dataItem.row.index === estadoOrder.length) {
          dataItem.cell.styles.fontStyle = 'bold'
          dataItem.cell.styles.fillColor = [219, 234, 254]
          dataItem.cell.styles.textColor = C.primaryDeep
        }
      },
      columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 50, halign: 'center', fontStyle: 'bold' }, 2: { cellWidth: 46, halign: 'center' } },
      margin: { left: margin, right: margin }, theme: 'grid',
    })
    y = doc.lastAutoTable.finalY + 10

    // Distribuci\u00f3n por tipo
    drawText(doc, 'Distribuci\u00f3n por tipo de proyecto', margin, y, 10, C.ink, 'bold', 'left')
    y += 5
    const tipoOrder = ['VINCULACION', 'INVESTIGACION', 'EXTENSION', 'MIXTO']
    autoTable(doc, {
      startY: y, head: [['Tipo', 'Cantidad', '%']],
      body: tipoOrder.map((t) => {
        const count = proyectos.filter((p) => p.tipo === t).length
        return [TIPO_PROYECTO_LABELS[t] || t, String(count), totalProyectos > 0 ? fmtPct((count / totalProyectos) * 100) : '0%']
      }),
      headStyles: { fillColor: C.primary, textColor: C.white, fontSize: 9, fontStyle: 'bold', halign: 'left' },
      bodyStyles: { fontSize: 9, cellPadding: 3.5, lineColor: C.border, lineWidth: 0.1 },
      alternateRowStyles: { fillColor: C.light },
      columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' }, 1: { cellWidth: 50, halign: 'center' }, 2: { cellWidth: 46, halign: 'center' } },
      margin: { left: margin, right: margin }, theme: 'grid',
    })

    /* ═════ P\u00c1GINA 4: DETALLE DE PROYECTOS ═════ */
    doc.addPage()
    y = 30
    drawText(doc, '3. LISTADO DETALLADO DE PROYECTOS', margin, y, 13, C.primary, 'bold', 'left')
    drawLine(doc, margin, y + 3, pageW - margin, y + 3, C.primary, 0.5)
    y += 8

    if (proyectos.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['N\u00b0', 'C\u00f3digo', 'T\u00edtulo', 'Tipo', 'Estado', 'Responsable', 'Carrera', 'Inicio', 'Fin', 'Presup.', 'Avance']],
        body: proyectos.map((p, i) => [
          String(i + 1), p.codigo,
          (p.titulo || '').length > 28 ? (p.titulo || '').substring(0, 26) + '\u2026' : (p.titulo || ''),
          TIPO_PROYECTO_LABELS[p.tipo] || p.tipo,
          ESTADO_PROYECTO_LABELS[p.estado] || p.estado,
          p.responsable_nombre || p.responsable || '\u2014',
          (p.carrera || '\u2014').length > 16 ? (p.carrera || '').substring(0, 14) + '\u2026' : (p.carrera || '\u2014'),
          formatDate(p.fecha_inicio), formatDate(p.fecha_fin_planificada),
          formatCurrency(p.presupuesto_aprobado), fmtPct(p.progreso),
        ]),
        theme: 'striped',
        headStyles: { fillColor: C.primary, textColor: C.white, fontSize: 7.5, fontStyle: 'bold', halign: 'left' },
        bodyStyles: { fontSize: 7, cellPadding: 2.2, lineColor: C.border, lineWidth: 0.1 },
        alternateRowStyles: { fillColor: C.light },
        columnStyles: {
          0: { cellWidth: 8, halign: 'right' }, 1: { cellWidth: 22, fontStyle: 'bold', textColor: C.primaryDeep },
          2: { cellWidth: 35 }, 3: { cellWidth: 18 }, 4: { cellWidth: 20 },
          5: { cellWidth: 22 }, 6: { cellWidth: 22 }, 7: { cellWidth: 16 },
          8: { cellWidth: 16 }, 9: { cellWidth: 18, halign: 'right' },
          10: { cellWidth: 14, halign: 'right', fontStyle: 'bold' },
        },
        didParseCell: (dataItem: any) => {
          if (dataItem.section === 'body' && dataItem.column.index === 10) {
            const p = proyectos[dataItem.row.index]
            if (p) {
              const val = Math.round(p.progreso || 0)
              if (val >= 70) dataItem.cell.styles.textColor = [22, 163, 74]
              else if (val >= 30) dataItem.cell.styles.textColor = [202, 138, 4]
              else dataItem.cell.styles.textColor = [190, 18, 60]
            }
          }
        },
        margin: { left: margin, right: margin },
      })
    } else {
      drawText(doc, 'No hay proyectos para mostrar.', margin, y + 5, 10, C.muted, 'italic', 'left')
    }

    /* ═════ PIE DE INFORME ═════ */
    doc.addPage()
    const pieY = pageH / 2 - 10
    drawFill(doc, 0, 0, pageW, 8, C.primary)
    drawText(doc, 'Universidad Nacional de Loja', margin, pieY, 14, C.ink, 'bold', 'left')
    drawText(doc, 'Coordinaci\u00f3n de Vinculaci\u00f3n con la Sociedad', margin, pieY + 7, 10, C.slate, 'normal', 'left')
    drawText(doc, 'Este reporte fue generado autom\u00e1ticamente por el Sistema de', margin, pieY + 18, 9, C.muted, 'normal', 'left')
    drawText(doc, 'Gesti\u00f3n de Proyectos de Vinculaci\u00f3n con la Sociedad', margin, pieY + 26, 9, C.muted, 'normal', 'left')
    drawText(doc, 'de la Universidad Nacional de Loja.', margin, pieY + 34, 9, C.muted, 'normal', 'left')
    drawText(doc, 'Para consultas: vinculacion.sociedad@unl.edu.ec', margin, pieY + 46, 8.5, C.subtle, 'italic', 'left')
    drawFill(doc, 0, pageH - 8, pageW, 8, C.primary)

    /* ═════ HEADERS / FOOTERS ═════ */
    const totalPages = doc.getNumberOfPages()
    for (let i = 2; i <= totalPages; i++) {
      doc.setPage(i)
      drawFill(doc, 0, 0, pageW, 18, C.primaryDeep)
      drawText(doc, 'UNL \u00b7 Vinculaci\u00f3n con la Sociedad', margin, 11, 8, C.white, 'bold', 'left')
      drawText(doc, `P\u00e1gina ${i} de ${totalPages}`, pageW - margin, 11, 8, C.white, 'bold', 'right')
      drawLine(doc, margin, pageH - 12, pageW - margin, pageH - 12, C.border, 0.2)
      drawText(doc, `Generado el ${format(new Date(), 'dd/MM/yyyy')}`, margin, pageH - 7, 7, C.muted, 'normal', 'left')
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