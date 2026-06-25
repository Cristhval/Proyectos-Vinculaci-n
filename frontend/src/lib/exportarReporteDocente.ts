import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ESTADO_PROYECTO_LABELS,
  TIPO_PROYECTO_LABELS,
  ESTADO_ACTIVIDAD_LABELS,
} from '@/lib/constants'
import type { ReporteDocentePayload } from '@/types/reporteDocente'
import type { Usuario } from '@/types/usuarios'

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

const fmtCurrency = (n: number): string =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)

const fmtPct = (n: number): string => `${Math.round(n || 0)}%`

const fmtDate = (s: string | null): string => {
  if (!s) return '\u2014'
  try { return format(new Date(s), 'dd/MM/yyyy') } catch { return s }
}

const drawFill = (doc: JsPDFWithAutoTable, x: number, y: number, w: number, h: number, color: [number, number, number]) => {
  doc.setFillColor(color[0], color[1], color[2])
  doc.rect(x, y, w, h, 'F')
}

const drawText = (
  doc: JsPDFWithAutoTable,
  text: string,
  x: number,
  y: number,
  size = 10,
  color: [number, number, number] = C.ink,
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
  color: [number, number, number] = C.border,
  w = 0.3,
) => {
  doc.setDrawColor(color[0], color[1], color[2])
  doc.setLineWidth(w)
  doc.line(x1, y1, x2, y2)
}

const addChartImage = (doc: JsPDFWithAutoTable, imgData: string | undefined, x: number, y: number, maxW: number): number => {
  if (!imgData) return y
  try {
    const props = doc.getImageProperties(imgData)
    let h = (maxW / props.width) * props.height
    // Limitar altura maxima para evitar corte entre paginas
    const pageH = doc.internal.pageSize.getHeight()
    const maxH = pageH - 40
    if (h > maxH) h = maxH
    // Si no cabe en la pagina actual, agregar nueva pagina
    if (y + h > pageH - 20) {
      doc.addPage()
      y = 30
    }
    doc.addImage(imgData, 'PNG', x, y, maxW, h)
    return y + h + 6
  } catch {
    return y
  }
}

function buildDoc(): JsPDFWithAutoTable {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as unknown as JsPDFWithAutoTable
  doc.autoTable = autoTable
  return doc
}

const ROL_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  COORDINADOR: 'Coordinador',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
  DIRECTIVO: 'Directivo',
}

const ROL_PARTICIPANTE_LABELS: Record<string, string> = {
  LIDER: 'L\u00edder',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
  APOYO: 'Apoyo',
  EXTERNO: 'Externo',
}

export async function exportarReporteDocentePDF(
  data: ReporteDocentePayload,
  user: Usuario | null,
  captures: Record<string, string> = {},
): Promise<void> {
  const loadingToast = toast.loading('Generando PDF...')
  try {
    const doc = buildDoc()
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 14
    const contentW = pageW - 28
    const fechaCompleta = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })
    const nombre = user
      ? `${user.user_first_name || ''} ${user.user_last_name || ''}`.trim() || user.user_username
      : 'Docente'

    const kpis = data.kpis
    const proyectos = data.proyectos

    /* ═════ PORTADA ═════ */
    drawFill(doc, 0, 0, pageW, 8, C.primary)
    drawText(doc, 'UNIVERSIDAD NACIONAL DE LOJA', pageW / 2, 55, 15, C.ink, 'bold', 'center')
    drawText(doc, 'Coordinaci\u00f3n de Vinculaci\u00f3n con la Sociedad', pageW / 2, 66, 11, C.slate, 'normal', 'center')
    drawLine(doc, pageW / 2 - 40, 75, pageW / 2 + 40, 75, C.primary, 0.8)
    drawText(doc, 'REPORTE PERSONAL DE PROYECTOS', pageW / 2, 100, 17, C.ink, 'bold', 'center')
    drawText(doc, `Responsable: ${nombre}`, pageW / 2, 122, 11, C.slate, 'normal', 'center')
    const rolLabel = ROL_LABELS[user?.rol || 'DOCENTE'] || 'Docente'
    if (user?.carrera?.nombre) drawText(doc, user.carrera.nombre, pageW / 2, 130, 10, C.muted, 'normal', 'center')
    drawText(doc, `Cargo: ${rolLabel}`, pageW / 2, 138, 10, C.muted, 'normal', 'center')
    drawText(doc, `Loja, ${fechaCompleta}`, pageW / 2, 165, 11, C.slate, 'italic', 'center')
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
        ['Mis proyectos totales', String(kpis.total_proyectos)],
        ['Proyectos en ejecuci\u00f3n', String(kpis.proyectos_en_ejecucion)],
        ['Proyectos finalizados', String(kpis.proyectos_finalizados)],
        ['Avance promedio', fmtPct(kpis.avance_promedio)],
        ['Actividades completadas', `${kpis.actividades_completadas} de ${kpis.total_actividades}`],
        ['Actividades atrasadas', String(kpis.actividades_atrasadas)],
        ['Participantes en mis proyectos', String(kpis.total_participantes)],
        ['Objetivos cumplidos', `${kpis.objetivos_cumplidos} de ${kpis.total_objetivos}`],
        ['Presupuesto aprobado', fmtCurrency(kpis.presupuesto_aprobado)],
        ['Presupuesto ejecutado', fmtCurrency(kpis.presupuesto_ejecutado)],
        ['Saldo disponible', fmtCurrency(kpis.presupuesto_saldo)],
      ],
      headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 9, halign: 'left' },
      bodyStyles: { fontSize: 9, cellPadding: 3, lineColor: C.border, lineWidth: 0.1 },
      alternateRowStyles: { fillColor: C.light },
      columnStyles: {
        0: { cellWidth: 110, fontStyle: 'bold', textColor: C.ink },
        1: { cellWidth: 56, halign: 'right', textColor: C.primary, fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
      theme: 'grid',
    })
    y = doc.lastAutoTable.finalY + 6
    drawText(doc, `Datos obtenidos al ${format(new Date(), "dd/MM/yyyy, HH:mm")}`, margin, y, 7, C.subtle, 'italic', 'left')

    /* ═════ P\u00c1GINA 3: GR\u00c1FICAS ═════ */
    doc.addPage()
    y = 30
    drawText(doc, '2. GR\u00c1FICAS DEL PORTAFOLIO', margin, y, 13, C.primary, 'bold', 'left')
    drawLine(doc, margin, y + 3, pageW - margin, y + 3, C.primary, 0.5)
    y += 8

    // Gr\u00e1fica de avance (si existe captura)
    if (captures.avance) {
      drawText(doc, 'Avance por proyecto', margin, y, 10, C.ink, 'bold', 'left')
      y += 5
      y = addChartImage(doc, captures.avance, margin, y, contentW)
    }

    // Gr\u00e1fica de estados (si existe captura)
    if (captures.estados) {
      if (y > pageH - 100) { doc.addPage(); y = 30 }
      drawText(doc, 'Proyectos por estado', margin, y, 10, C.ink, 'bold', 'left')
      y += 5
      y = addChartImage(doc, captures.estados, margin, y, contentW)
    }

    // Gr\u00e1fica de presupuesto (si existe captura)
    if (captures.presupuesto) {
      if (y > pageH - 100) { doc.addPage(); y = 30 }
      drawText(doc, 'Distribuci\u00f3n presupuestaria', margin, y, 10, C.ink, 'bold', 'left')
      y += 5
      y = addChartImage(doc, captures.presupuesto, margin, y, contentW)
    }

    // Gr\u00e1fica de participantes (si existe captura)
    if (captures.equipo) {
      if (y > pageH - 100) { doc.addPage(); y = 30 }
      drawText(doc, 'Participantes por rol', margin, y, 10, C.ink, 'bold', 'left')
      y += 5
      y = addChartImage(doc, captures.equipo, margin, y, contentW)
    }

    // Gr\u00e1fica de actividades (si existe captura)
    if (captures.actividades) {
      if (y > pageH - 100) { doc.addPage(); y = 30 }
      drawText(doc, 'Actividades por estado', margin, y, 10, C.ink, 'bold', 'left')
      y += 5
      y = addChartImage(doc, captures.actividades, margin, y, contentW)
    }

    /* ═════ P\u00c1GINA: ACTIVIDADES Y PARTICIPANTES ═════ */
    doc.addPage()
    y = 30
    drawText(doc, '3. ACTIVIDADES Y PARTICIPANTES', margin, y, 13, C.primary, 'bold', 'left')
    drawLine(doc, margin, y + 3, pageW - margin, y + 3, C.primary, 0.5)
    y += 8

    // Actividades por estado
    if (data.actividades_por_estado.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Estado de actividad', 'Cantidad', '%']],
        body: data.actividades_por_estado.map((a) => [
          ESTADO_ACTIVIDAD_LABELS[a.estado] || a.estado,
          String(a.total),
          fmtPct(kpis.total_actividades > 0 ? (a.total / kpis.total_actividades) * 100 : 0),
        ]),
        headStyles: { fillColor: C.primary, textColor: C.white, fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9, cellPadding: 3, lineColor: C.border, lineWidth: 0.1 },
        alternateRowStyles: { fillColor: C.light },
        columnStyles: { 0: { cellWidth: 'auto', fontStyle: 'bold' }, 1: { cellWidth: 30, halign: 'right' }, 2: { cellWidth: 30, halign: 'right' } },
        margin: { left: margin, right: margin },
        theme: 'grid',
      })
      y = doc.lastAutoTable.finalY + 8
    }

    // Participantes por rol
    if (data.participantes_por_rol.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Rol del participante', 'Cantidad', '%']],
        body: data.participantes_por_rol.map((p) => [
          ROL_PARTICIPANTE_LABELS[p.rol] || p.rol,
          String(p.total),
          fmtPct(kpis.total_participantes > 0 ? (p.total / kpis.total_participantes) * 100 : 0),
        ]),
        headStyles: { fillColor: C.primary, textColor: C.white, fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9, cellPadding: 3, lineColor: C.border, lineWidth: 0.1 },
        alternateRowStyles: { fillColor: C.light },
        columnStyles: { 0: { cellWidth: 'auto', fontStyle: 'bold' }, 1: { cellWidth: 30, halign: 'right' }, 2: { cellWidth: 30, halign: 'right' } },
        margin: { left: margin, right: margin },
        theme: 'grid',
      })
      y = doc.lastAutoTable.finalY + 8
    }

    // Avances por estado
    if (data.avances_por_estado && data.avances_por_estado.length > 0) {
      if (y > pageH - 50) { doc.addPage(); y = 30 }
      autoTable(doc, {
        startY: y,
        head: [['Estado de avance', 'Cantidad']],
        body: data.avances_por_estado.map((a) => [a.estado, String(a.total)]),
        headStyles: { fillColor: C.primary, textColor: C.white, fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9, cellPadding: 3, lineColor: C.border, lineWidth: 0.1 },
        alternateRowStyles: { fillColor: C.light },
        columnStyles: { 0: { cellWidth: 'auto', fontStyle: 'bold' }, 1: { cellWidth: 30, halign: 'right' } },
        margin: { left: margin, right: margin },
        theme: 'grid',
      })
    }

    /* ═════ P\u00c1GINA: DETALLE DE PROYECTOS ═════ */
    doc.addPage()
    y = 30
    drawText(doc, '4. DETALLE DE MIS PROYECTOS', margin, y, 13, C.primary, 'bold', 'left')
    drawLine(doc, margin, y + 3, pageW - margin, y + 3, C.primary, 0.5)
    y += 8

    if (proyectos.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['C\u00f3digo', 'T\u00edtulo', 'Estado', 'Tipo', 'Carrera', 'Inicio', 'Fin', 'Presup.', 'Avance']],
        body: proyectos.map((p) => [
          p.codigo,
          (p.titulo || '').length > 28 ? (p.titulo || '').substring(0, 26) + '\u2026' : (p.titulo || ''),
          ESTADO_PROYECTO_LABELS[p.estado] || p.estado,
          TIPO_PROYECTO_LABELS[p.tipo] || p.tipo,
          p.carrera || '\u2014',
          fmtDate(p.fecha_inicio),
          fmtDate(p.fecha_fin_planificada),
          fmtCurrency(Number(p.presupuesto_aprobado || 0)),
          fmtPct(p.progreso),
        ]),
        theme: 'striped',
        headStyles: { fillColor: C.primary, textColor: C.white, fontSize: 7.5, fontStyle: 'bold', halign: 'left' },
        bodyStyles: { fontSize: 7, cellPadding: 2.2, lineColor: C.border, lineWidth: 0.1 },
        alternateRowStyles: { fillColor: C.light },
        columnStyles: {
          0: { cellWidth: 18, fontStyle: 'bold', textColor: C.primaryDeep },
          1: { cellWidth: 36 },
          2: { cellWidth: 20 },
          3: { cellWidth: 18 },
          4: { cellWidth: 24 },
          5: { cellWidth: 16 },
          6: { cellWidth: 16 },
          7: { cellWidth: 18, halign: 'right' },
          8: { cellWidth: 14, halign: 'right', fontStyle: 'bold' },
        },
        didParseCell: (dataItem: any) => {
          if (dataItem.section === 'body' && dataItem.column.index === 8) {
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
    }

    /* ═════ P\u00c1GINA: CARGA MENSUAL ═══════ */
    if (data.carga_mensual && data.carga_mensual.length > 0) {
      doc.addPage()
      y = 30
      drawText(doc, '5. CARGA MENSUAL DE ACTIVIDADES', margin, y, 13, C.primary, 'bold', 'left')
      drawLine(doc, margin, y + 3, pageW - margin, y + 3, C.primary, 0.5)
      y += 8

      autoTable(doc, {
        startY: y,
        head: [['Mes', 'Planificadas', 'Ejecutadas', '% Ejecuci\u00f3n']],
        body: data.carga_mensual.map((c) => [
          c.mes ? format(new Date(c.mes), 'MMMM yyyy', { locale: es }) : '\u2014',
          String(c.planificadas),
          String(c.ejecutadas),
          fmtPct(c.planificadas > 0 ? (c.ejecutadas / c.planificadas) * 100 : 0),
        ]),
        theme: 'grid',
        headStyles: { fillColor: C.primary, textColor: C.white, fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9, cellPadding: 3, lineColor: C.border, lineWidth: 0.1 },
        alternateRowStyles: { fillColor: C.light },
        columnStyles: {
          0: { cellWidth: 'auto', fontStyle: 'bold' },
          1: { cellWidth: 35, halign: 'right' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: C.primary },
        },
        margin: { left: margin, right: margin },
      })
      y = doc.lastAutoTable.finalY + 8
    }

    /* ═════ PIE DE INFORME ═════ */
    if (y > pageH - 60) { doc.addPage(); y = 30 }
    const pieY = pageH / 2
    drawText(doc, 'Universidad Nacional de Loja', margin, pieY, 14, C.ink, 'bold', 'left')
    drawText(doc, 'Coordinaci\u00f3n de Vinculaci\u00f3n con la Sociedad', margin, pieY + 7, 10, C.slate, 'normal', 'left')
    drawText(doc, 'Este reporte fue generado autom\u00e1ticamente por el Sistema de', margin, pieY + 18, 9, C.muted, 'normal', 'left')
    drawText(doc, 'Gesti\u00f3n de Proyectos de Vinculaci\u00f3n con la Sociedad.', margin, pieY + 26, 9, C.muted, 'normal', 'left')
    drawText(doc, 'Para consultas: vinculacion.sociedad@unl.edu.ec', margin, pieY + 38, 8.5, C.subtle, 'italic', 'left')

    /* ═════ HEADERS Y FOOTERS ═════ */
    const totalPages = doc.getNumberOfPages()
    for (let i = 2; i <= totalPages; i++) {
      doc.setPage(i)
      // Header
      drawFill(doc, 0, 0, pageW, 18, C.primaryDeep)
      drawText(doc, 'UNL \u00b7 Vinculaci\u00f3n con la Sociedad', margin, 11, 8, C.white, 'bold', 'left')
      drawText(doc, `P\u00e1gina ${i} de ${totalPages}`, pageW - margin, 11, 8, C.white, 'bold', 'right')
      // Footer
      drawLine(doc, margin, pageH - 12, pageW - margin, pageH - 12, C.border, 0.2)
      drawText(doc, `Docente: ${nombre} \u00b7 Generado el ${format(new Date(), 'dd/MM/yyyy')}`, margin, pageH - 7, 7, C.muted, 'normal', 'left')
    }

    const nombreArchivo = `Reporte_Docente_${nombre.replace(/\s/g, '')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
    doc.save(nombreArchivo)
    toast.dismiss(loadingToast)
    toast.success(`PDF descargado: ${nombreArchivo}`)
  } catch (err) {
    console.error('Error al generar PDF docente:', err)
    toast.dismiss(loadingToast)
    toast.error('Error al exportar el PDF del docente')
  }
}