import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { showSuccess, showError } from '@/components/ui/Toast'
import {
  ESTADO_PROYECTO_LABELS,
  TIPO_PROYECTO_LABELS,
} from '@/lib/constants'
import type { ReporteProyecto, ReporteConvenio, DashboardKPIs } from '@/types/reportes'

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy')
  } catch {
    return dateStr
  }
}

const formatCurrency = (value: string): string => {
  const num = parseFloat(value)
  if (isNaN(num)) return value
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num)
}

export async function exportarExcel(
  kpis: DashboardKPIs | null,
  proyectos: ReporteProyecto[],
  convenios: ReporteConvenio[],
): Promise<void> {
  const loadingToast = showSuccess('Exportando Excel...', 'Generando archivo')

  try {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    const fecha = format(new Date(), 'yyyy-MM-dd')

    const resumenData = [
      ['RESUMEN DE INDICADORES'],
      [],
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
      'Código': p.codigo,
      'Título': p.titulo,
      'Tipo': TIPO_PROYECTO_LABELS[p.tipo] || p.tipo,
      'Estado': ESTADO_PROYECTO_LABELS[p.estado] || p.estado,
      'Carrera': p.carrera || '—',
      'Responsable': p.responsable_nombre || p.responsable || '—',
      'Fecha Inicio': formatDate(p.fecha_inicio),
      'Fecha Fin': formatDate(p.fecha_fin_planificada),
      'Presupuesto': formatCurrency(p.presupuesto_aprobado),
      '% Avance': p.progreso,
      'Participantes': p.participantes_count ?? 0,
    }))
    const wsProyectos = XLSX.utils.json_to_sheet(proyectosData)
    wsProyectos['!cols'] = [
      { wch: 12 }, { wch: 40 }, { wch: 14 }, { wch: 16 },
      { wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 12 },
      { wch: 14 }, { wch: 10 }, { wch: 12 },
    ]
    XLSX.utils.book_append_sheet(wb, wsProyectos, 'Proyectos')

    const conveniosData = convenios.map((c) => ({
      'Código': c.codigo,
      'Entidad': c.entidad_contraparte,
      'Tipo': c.tipo,
      'Estado': c.estado,
      'Institución': c.institucion || '—',
      'Fecha Inicio': formatDate(c.fecha_inicio),
      'Fecha Fin': formatDate(c.fecha_fin),
    }))
    const wsConvenios = XLSX.utils.json_to_sheet(conveniosData)
    wsConvenios['!cols'] = [
      { wch: 12 }, { wch: 35 }, { wch: 14 }, { wch: 14 },
      { wch: 25 }, { wch: 12 }, { wch: 12 },
    ]
    XLSX.utils.book_append_sheet(wb, wsConvenios, 'Convenios')

    XLSX.writeFile(wb, `Reporte_Vinculacion_${fecha}.xlsx`)

    if (loadingToast) toast.dismiss(String(loadingToast))
    showSuccess('Archivo descargado', `Reporte_Vinculacion_${fecha}.xlsx`)
  } catch (error) {
    if (loadingToast) toast.dismiss(String(loadingToast))
    showError('Error al exportar', 'No se pudo generar el archivo Excel')
  }
}

export async function exportarPDF(
  kpis: DashboardKPIs | null,
  proyectos: ReporteProyecto[],
): Promise<void> {
  const loadingToast = showSuccess('Generando PDF...', 'Esto puede tomar un momento')

  try {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ])
    const doc = new jsPDF('landscape', 'mm', 'a4')
    const fecha = format(new Date(), 'yyyy-MM-dd')
    const fechaGeneracion = format(new Date(), 'dd/MM/yyyy HH:mm')

    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, 297, 35, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('REPORTE DE VINCULACIÓN', 14, 18)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generado: ${fechaGeneracion}`, 14, 28)

    doc.setTextColor(15, 23, 42)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumen de Indicadores', 14, 50)

    const kpiData = [
      ['Proyectos Activos', String(kpis?.resumen.proyectos_activos ?? 0)],
      ['Proyectos Finalizados', String(kpis?.resumen.proyectos_finalizados ?? 0)],
      ['Convenios Activos', String(kpis?.resumen.convenios_activos ?? 0)],
      ['Convenios por Vencer', String(kpis?.resumen.convenios_por_vencer ?? 0)],
      ['Alertas Pendientes', String(kpis?.resumen.alertas_pendientes ?? 0)],
      ['Actividades Atrasadas', String(kpis?.resumen.actividades_atrasadas ?? 0)],
    ]

    autoTable(doc, {
      startY: 55,
      head: [['Indicador', 'Valor']],
      body: kpiData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { cellWidth: 80 } },
    })

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Listado de Proyectos', 14, finalY)

    const tableData = proyectos.map((p) => [
      p.codigo,
      p.titulo.length > 40 ? p.titulo.substring(0, 38) + '...' : p.titulo,
      TIPO_PROYECTO_LABELS[p.tipo] || p.tipo,
      ESTADO_PROYECTO_LABELS[p.estado] || p.estado,
      p.carrera || '—',
      p.responsable_nombre || p.responsable || '—',
      formatDate(p.fecha_inicio),
      `${p.progreso}%`,
    ])

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Código', 'Título', 'Tipo', 'Estado', 'Carrera', 'Responsable', 'F. Inicio', 'Avance']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 60 },
        2: { cellWidth: 22 },
        3: { cellWidth: 25 },
        4: { cellWidth: 35 },
        5: { cellWidth: 35 },
        6: { cellWidth: 22 },
        7: { cellWidth: 15 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 7) {
          const text = data.cell.text[0] || '0'
          const value = parseInt(text)
          if (value >= 70) data.cell.styles.textColor = [22, 163, 74]
          else if (value >= 30) data.cell.styles.textColor = [234, 179, 8]
          else data.cell.styles.textColor = [220, 38, 38]
        }
      },
    })

    doc.save(`Reporte_Vinculacion_${fecha}.pdf`)

    if (loadingToast) toast.dismiss(String(loadingToast))
    showSuccess('PDF descargado', `Reporte_Vinculacion_${fecha}.pdf`)
  } catch (error) {
    if (loadingToast) toast.dismiss(String(loadingToast))
    showError('Error al exportar', 'No se pudo generar el PDF')
  }
}
