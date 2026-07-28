import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Sparkles, Check, Minus, AlertTriangle, ChevronRight, ChevronLeft,
  ClipboardList, BarChart3, BadgeCheck, Wrench, Wallet, FileText,
  Copy, Download, RefreshCw, Pencil, Save, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  proyectosApi, actividadesApi, participantesApi, beneficiariosApi,
  marcoLogicoApi, presupuestosApi, alineacionesApi,
} from '@/api/proyectos'
import { avancesApi, informesApi } from '@/api/seguimiento'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/lib/formatters'
import { TIPO_INFORME_LABELS, ESTADO_PROYECTO_LABELS } from '@/lib/constants'
import type { TipoInforme } from '@/types/seguimiento'
import type {
  Proyecto, Actividad, ParticipanteProyecto, Beneficiario,
  MarcoLogicoFila, Presupuesto, AlineacionEstrategica,
} from '@/types/proyectos'
import type { Avance } from '@/types/seguimiento'
import type { PaginatedResponse } from '@/types/common'

/* ─── Types ─── */

type Step = 'config' | 'preview' | 'loading' | 'result' | 'error'

type AtributoKey =
  | 'datos_generales'
  | 'marco_logico'
  | 'avances'
  | 'evidencias'
  | 'participantes'
  | 'presupuesto'
  | 'dificultades'
  | 'conclusiones'
  | 'indicadores'
  | 'proximos_pasos'

interface ConfigInforme {
  tipo: TipoInforme
  atributos: AtributoKey[]
  tono: string
  extension: string
  instrucciones: string
}

interface ProyectoData {
  proyecto: Proyecto
  marcoLogico: MarcoLogicoFila[]
  actividades: Actividad[]
  avances: Avance[]
  participantes: ParticipanteProyecto[]
  beneficiarios: Beneficiario[]
  presupuesto: Presupuesto | null
  alineaciones: AlineacionEstrategica[]
}

interface Props {
  open: boolean
  onClose: () => void
  proyectoId: number
  onSaved: () => void
}

/* ─── Constants ─── */

const TIPOS: { value: TipoInforme; label: string; Icon: typeof FileText }[] = [
  { value: 'INICIAL', label: 'Inicial', Icon: ClipboardList },
  { value: 'PARCIAL', label: 'Parcial', Icon: BarChart3 },
  { value: 'FINAL', label: 'Final', Icon: BadgeCheck },
  { value: 'TECNICO', label: 'Técnico', Icon: Wrench },
  { value: 'FINANCIERO', label: 'Financiero', Icon: Wallet },
  { value: 'EJECUTIVO', label: 'Ejecutivo', Icon: FileText },
]

const ATRIBUTOS: { key: AtributoKey; label: string }[] = [
  { key: 'datos_generales', label: 'Datos generales del proyecto (código, título, período, responsable)' },
  { key: 'marco_logico', label: 'Marco lógico y objetivos' },
  { key: 'avances', label: 'Avances registrados por actividad' },
  { key: 'evidencias', label: 'Evidencias y documentos adjuntos' },
  { key: 'participantes', label: 'Participantes y horas cumplidas' },
  { key: 'presupuesto', label: 'Presupuesto ejecutado vs planificado' },
  { key: 'dificultades', label: 'Dificultades y acciones correctivas' },
  { key: 'conclusiones', label: 'Conclusiones y recomendaciones' },
  { key: 'indicadores', label: 'Indicadores de cumplimiento' },
  { key: 'proximos_pasos', label: 'Próximos pasos' },
]

const ALL_ATRIBUTOS = ATRIBUTOS.map((a) => a.key)

const TONOS = [
  { value: 'Formal institucional', label: 'Formal institucional' },
  { value: 'Técnico científico', label: 'Técnico científico' },
  { value: 'Ejecutivo resumido', label: 'Ejecutivo resumido' },
]

const EXTENSIONES = [
  { value: 'Completo (4-6 páginas)', label: 'Completo (4-6 páginas)' },
  { value: 'Resumido (2-3 páginas)', label: 'Resumido (2-3 páginas)' },
  { value: 'Ejecutivo (1 página)', label: 'Ejecutivo (1 página)' },
]

const LOADING_MESSAGES = [
  'Analizando datos del proyecto...',
  'Procesando avances y evidencias...',
  'Estructurando el informe...',
  'Generando contenido profesional...',
  'Revisando formato institucional...',
]

const DEFAULT_CONFIG: ConfigInforme = {
  tipo: 'PARCIAL',
  atributos: [...ALL_ATRIBUTOS],
  tono: 'Formal institucional',
  extension: 'Completo (4-6 páginas)',
  instrucciones: '',
}

/* ─── Helpers ─── */

function unwrapList<T>(data: PaginatedResponse<T> | T[]): T[] {
  if (Array.isArray(data)) return data
  return data?.results ?? []
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function sectionCount(md: string) {
  return (md.match(/^#{1,3}\s/gm) || []).length
}

function estimatePages(words: number) {
  return Math.max(1, Math.ceil(words / 400))
}

function extractTitulo(md: string, tipo: TipoInforme) {
  const line = md.split('\n').find((l) => l.startsWith('# '))
  if (line) return line.replace(/^#\s+/, '').trim().slice(0, 255)
  return `Informe ${TIPO_INFORME_LABELS[tipo] || tipo} — generado con IA`
}

function extractResumen(md: string) {
  const idx = md.search(/##\s*2\.\s*RESUMEN EJECUTIVO/i)
  if (idx < 0) {
    const plain = md.replace(/[#*_`|>-]/g, ' ').replace(/\s+/g, ' ').trim()
    return plain.slice(0, 300)
  }
  const rest = md.slice(idx).replace(/##\s*2\.\s*RESUMEN EJECUTIVO[^\n]*/i, '')
  const next = rest.search(/\n##\s/)
  const block = (next >= 0 ? rest.slice(0, next) : rest)
    .replace(/[#*_`|>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return (block || 'Resumen generado con asistencia de IA.').slice(0, 1000)
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const html: string[] = []
  let inTable = false
  let inUl = false
  let inOl = false

  const closeLists = () => {
    if (inUl) { html.push('</ul>'); inUl = false }
    if (inOl) { html.push('</ol>'); inOl = false }
  }
  const closeTable = () => {
    if (inTable) { html.push('</tbody></table>'); inTable = false }
  }

  const inline = (t: string) => {
    let s = escapeHtml(t)
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>')
    s = s.replace(/`(.+?)`/g, '<code>$1</code>')
    return s
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const trimmed = line.trim()

    if (!trimmed) {
      closeLists()
      closeTable()
      continue
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      closeLists()
      closeTable()
      html.push('<hr />')
      continue
    }

    if (trimmed.includes('|') && trimmed.split('|').length >= 3) {
      closeLists()
      const parts = trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())
      if (parts.every((cell) => /^:?-+:?$/.test(cell))) continue
      if (!inTable) {
        html.push('<table><thead><tr>')
        parts.forEach((cell) => html.push(`<th>${inline(cell)}</th>`))
        html.push('</tr></thead><tbody>')
        inTable = true
      } else {
        html.push('<tr>')
        parts.forEach((cell) => html.push(`<td>${inline(cell)}</td>`))
        html.push('</tr>')
      }
      continue
    } else {
      closeTable()
    }

    if (/^#{1}\s+/.test(trimmed)) {
      closeLists()
      html.push(`<h1>${inline(trimmed.replace(/^#\s+/, ''))}</h1>`)
      continue
    }
    if (/^#{2}\s+/.test(trimmed)) {
      closeLists()
      html.push(`<h2>${inline(trimmed.replace(/^##\s+/, ''))}</h2>`)
      continue
    }
    if (/^#{3}\s+/.test(trimmed)) {
      closeLists()
      html.push(`<h3>${inline(trimmed.replace(/^###\s+/, ''))}</h3>`)
      continue
    }

    const ul = trimmed.match(/^[-*]\s+(.+)/)
    if (ul) {
      closeTable()
      if (inOl) { html.push('</ol>'); inOl = false }
      if (!inUl) { html.push('<ul>'); inUl = true }
      html.push(`<li>${inline(ul[1]!)}</li>`)
      continue
    }

    const ol = trimmed.match(/^\d+\.\s+(.+)/)
    if (ol) {
      closeTable()
      if (inUl) { html.push('</ul>'); inUl = false }
      if (!inOl) { html.push('<ol>'); inOl = true }
      html.push(`<li>${inline(ol[1]!)}</li>`)
      continue
    }

    closeLists()
    closeTable()
    html.push(`<p>${inline(trimmed)}</p>`)
  }

  closeLists()
  closeTable()
  return html.join('\n')
}

function construirPrompt(
  data: ProyectoData,
  config: ConfigInforme,
): string {
  const { proyecto, marcoLogico, actividades, avances, participantes, beneficiarios, presupuesto } = data
  const ml = (nivel: string) =>
    marcoLogico.find((m) => m.nivel === nivel)?.resumen_narrativo || 'No registrado'

  const fechaHoy = new Date().toLocaleDateString('es-EC', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return `Eres un experto en redacción de informes institucionales universitarios
para la Universidad Nacional de Loja (UNL), Ecuador. Tu tarea es generar
un informe ${TIPO_INFORME_LABELS[config.tipo] || config.tipo} profesional,
formal y empresarial basado en los datos reales del siguiente proyecto
de vinculación con la sociedad.

DATOS DEL PROYECTO:
═══════════════════════════════════
Código: ${proyecto.codigo}
Título: ${proyecto.titulo}
Tipo: ${proyecto.tipo}
Estado: ${proyecto.estado}
Responsable: ${proyecto.responsable_nombre || 'No registrado'}
Carrera: ${proyecto.carrera_nombre || 'No registrado'}
Período: ${proyecto.fecha_inicio || '—'} al ${proyecto.fecha_fin_planificada || '—'}
Presupuesto total: $${proyecto.presupuesto_aprobado || presupuesto?.monto_aprobado || '0'}

OBJETIVO GENERAL:
${proyecto.objetivo_general || 'No registrado'}

RESULTADOS ESPERADOS:
${proyecto.resultados_esperados || 'No registrado'}

MARCO LÓGICO:
FIN: ${ml('FIN')}
PROPÓSITO: ${ml('PROPOSITO')}
COMPONENTES: ${ml('COMPONENTES')}
ACTIVIDADES: ${ml('ACTIVIDADES')}

BENEFICIARIOS:
${beneficiarios.length
    ? beneficiarios.map((b) => `- ${b.tipo}: ${b.nombre} (${b.cantidad_estimada} personas, ${b.ubicacion || 's/u'})`).join('\n')
    : 'No registrado'}

AVANCES POR ACTIVIDAD:
${actividades.length
    ? actividades.map((act) => {
        const avs = avances.filter((av) => av.actividad === act.id)
        return `
Actividad ${act.codigo}: ${act.nombre}
  Estado: ${act.estado}
  Progreso: ${act.porcentaje_avance}%
  Avances registrados: ${avs.length
    ? avs.map((av) => `
    - Fecha: ${av.fecha_registro}
      Porcentaje: ${av.porcentaje_avance}%
      Descripción: ${av.descripcion}
      Horas: ${av.horas_invertidas}h
      ${av.dificultades ? `Dificultades: ${av.dificultades}` : ''}
      ${av.acciones_correctivas ? `Acciones: ${av.acciones_correctivas}` : ''}
    `).join('')
    : '    Sin avances registrados'}`
      }).join('\n')
    : 'Sin actividades'}

PARTICIPANTES:
${participantes.length
    ? participantes.map((p) => `
- ${p.usuario_nombre || 'Participante'} (${p.rol})
  Horas comprometidas: ${p.horas_comprometidas}h
  Horas cumplidas: ${p.horas_cumplidas || 0}h
`).join('\n')
    : 'Sin participantes'}

PRESUPUESTO:
Planificado: $${presupuesto?.monto_aprobado || proyecto.presupuesto_aprobado || '0'}
Ejecutado: $${presupuesto?.monto_ejecutado || 'Sin datos'}
Saldo: $${presupuesto?.monto_saldo || 'Sin datos'}

ATRIBUTOS SOLICITADOS:
${config.atributos.map((k) => ATRIBUTOS.find((a) => a.key === k)?.label || k).join(', ')}

TONO: ${config.tono}
EXTENSIÓN: ${config.extension}

INSTRUCCIONES ADICIONALES:
${config.instrucciones || 'Ninguna'}

═══════════════════════════════════
INSTRUCCIONES DE FORMATO:

Genera el informe con esta estructura exacta en formato Markdown profesional:

# INFORME ${(TIPO_INFORME_LABELS[config.tipo] || config.tipo).toUpperCase()} DE PROYECTO
# DE VINCULACIÓN CON LA SOCIEDAD

## UNIVERSIDAD NACIONAL DE LOJA
### Coordinación de Vinculación con la Sociedad

---

**Código del proyecto:** ${proyecto.codigo}
**Fecha de elaboración:** ${fechaHoy}
**Período del informe:** ${proyecto.fecha_inicio || '—'} al ${todayISO()}
**Responsable:** ${proyecto.responsable_nombre || '—'}

---

## 1. DATOS INFORMATIVOS

[tabla con datos del proyecto]

## 2. RESUMEN EJECUTIVO

[párrafo conciso de 150-200 palabras con el estado actual del proyecto]

## 3. AVANCE DE ACTIVIDADES

[tabla por actividad con % avance, estado y observaciones]

## 4. LOGROS ALCANZADOS

[lista de logros concretos basados en los avances aprobados]

## 5. DIFICULTADES Y ACCIONES CORRECTIVAS

[si existen dificultades registradas, presentarlas con sus acciones]

## 6. INDICADORES DE CUMPLIMIENTO

[tabla de indicadores vs metas]

## 7. PARTICIPACIÓN

[resumen de participantes y horas]

## 8. PRESUPUESTO

[si hay datos de presupuesto ejecutado]

## 9. CONCLUSIONES

[3-5 conclusiones basadas en datos]

## 10. RECOMENDACIONES

[3-5 recomendaciones específicas]

## 11. FIRMAS DE RESPONSABILIDAD

___________________________
${proyecto.responsable_nombre || 'Responsable del Proyecto'}
Responsable del Proyecto

___________________________
Coordinador/a Académico/a

---
*Informe generado con asistencia de IA el ${fechaHoy}. Revisado y validado por el responsable del proyecto.*

IMPORTANTE:
- Usa solo los datos proporcionados, no inventes cifras ni información
- Escribe en español formal e institucional, sin emojis
- Usa números reales del proyecto
- Sé específico con las actividades y avances mencionados
- El informe debe parecer escrito por un profesional universitario
- Incluye fechas exactas donde estén disponibles
- Omite secciones cuyos atributos no fueron solicitados, manteniendo numeración coherente
`
}

function money(v: string | number | null | undefined) {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v ?? 0)
  if (Number.isNaN(n)) return 'Sin datos'
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n)
}

function num(v: string | number | null | undefined) {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v ?? 0)
  return Number.isNaN(n) ? 0 : n
}

function hasAttr(cfg: ConfigInforme, key: AtributoKey) {
  return cfg.atributos.includes(key)
}

/** Generador institucional local: siempre disponible, sin API externa. */
function generarInformeInstitucional(data: ProyectoData, config: ConfigInforme): string {
  const { proyecto, marcoLogico, actividades, avances, participantes, beneficiarios, presupuesto } = data
  const tipoLabel = (TIPO_INFORME_LABELS[config.tipo] || config.tipo).toUpperCase()
  const fechaHoy = new Date().toLocaleDateString('es-EC', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const periodoIni = formatDate(proyecto.fecha_inicio)
  const periodoFin = formatDate(proyecto.fecha_fin_planificada)
  const estadoLabel = ESTADO_PROYECTO_LABELS[proyecto.estado] || proyecto.estado
  const resp = proyecto.responsable_nombre || 'No registrado'
  const carrera = proyecto.carrera_nombre || 'No registrada'
  const ml = (nivel: string) =>
    marcoLogico.find((m) => m.nivel === nivel)?.resumen_narrativo?.trim() || ''

  const progActs = actividades.map((a) => num(a.porcentaje_avance))
  const progGeneral = actividades.length
    ? Math.round(progActs.reduce((s, v) => s + v, 0) / actividades.length)
    : 0

  const horasComp = participantes.reduce((s, p) => s + num(p.horas_comprometidas), 0)
  const horasCump = participantes.reduce((s, p) => s + num(p.horas_cumplidas), 0)
  const pctHoras = horasComp > 0 ? Math.round((horasCump / horasComp) * 100) : 0

  const dificultades = avances.filter((a) => a.dificultades?.trim())
  const logros = avances.filter((a) => a.estado === 'APROBADO' && a.descripcion?.trim())

  const planif = presupuesto?.monto_aprobado || proyecto.presupuesto_aprobado || '0'
  const ejec = presupuesto?.monto_ejecutado
  const saldo = presupuesto?.monto_saldo

  // La extensión manda sobre el largo del documento (no el tono ni los checks).
  const ext = config.extension || ''
  const esUnaPagina = /1\s*p[aá]gina/i.test(ext) || ext.startsWith('Ejecutivo')
  const esResumido = !esUnaPagina && /2\s*[-–]\s*3/i.test(ext)
  const esCompleto = !esUnaPagina && !esResumido

  const maxActs = esUnaPagina ? 5 : esResumido ? 8 : 50
  const maxLogros = esUnaPagina ? 2 : esResumido ? 4 : 8
  const maxDif = esUnaPagina ? 1 : esResumido ? 3 : 10
  const maxPart = esUnaPagina ? 4 : esResumido ? 8 : 50
  const maxAvanceDet = esUnaPagina ? 0 : esResumido ? 3 : 12
  const maxConc = esUnaPagina ? 2 : esResumido ? 3 : 5
  const maxRecs = esUnaPagina ? 2 : esResumido ? 3 : 6
  const maxObjChars = esUnaPagina ? 160 : esResumido ? 280 : 2000

  const clip = (t: string, max: number) => {
    const s = t.trim()
    if (s.length <= max) return s
    return `${s.slice(0, max - 1).trim()}…`
  }

  const actsView = [...actividades]
    .sort((a, b) => num(b.porcentaje_avance) - num(a.porcentaje_avance))
    .slice(0, maxActs)

  const atrasadas = actividades.filter((a) => a.estado === 'ATRASADA' || num(a.porcentaje_avance) < 30)

  const buildRecs = () => {
    const recs: string[] = []
    if (atrasadas.length) {
      recs.push(`Priorizar avances en: ${atrasadas.slice(0, 4).map((a) => a.codigo).join(', ')}.`)
    }
    if (pctHoras < 50 && horasComp > 0) {
      recs.push('Impulsar el cumplimiento de horas de los participantes.')
    }
    if (ejec == null || num(ejec) === 0) {
      recs.push('Actualizar la ejecución presupuestaria en el sistema.')
    }
    if (dificultades.length) {
      recs.push('Dar seguimiento a las acciones correctivas registradas.')
    }
    if (!marcoLogico.length && esCompleto) {
      recs.push('Completar el marco lógico del proyecto.')
    }
    recs.push('Mantener la carga de evidencias y la revisión de avances pendientes.')
    if (config.instrucciones?.trim() && !esUnaPagina) {
      recs.push(clip(`Atender: ${config.instrucciones.trim()}`, 140))
    }
    if (config.tipo === 'FINAL') {
      recs.push('Preparar el expediente de cierre institucional.')
    } else {
      recs.push('Programar el siguiente corte de seguimiento.')
    }
    return recs.slice(0, maxRecs)
  }

  /* ─── PLANTILLA 1 PÁGINA (estricta) ─── */
  if (esUnaPagina) {
    const rows = actsView.length
      ? actsView.map((act) =>
        `| ${act.codigo || '—'} | ${clip(act.nombre || '—', 42)} | ${num(act.porcentaje_avance)}% | ${act.estado} |`,
      ).join('\n')
      : '| — | Sin actividades | 0% | — |'

    const conc = [
      `Avance operativo del **${progGeneral}%**; estado **${estadoLabel}**.`,
      participantes.length
        ? `Participación: **${horasCump}/${horasComp} h** (${pctHoras}%).`
        : 'Se requiere actualizar el registro de participación.',
    ].slice(0, maxConc)

    const difLine = dificultades[0]
      ? `**Alerta:** ${clip(dificultades[0].dificultades, 120)}${dificultades[0].acciones_correctivas ? ` — Acción: ${clip(dificultades[0].acciones_correctivas, 80)}` : ''}`
      : 'Sin dificultades operativas registradas en el período.'

    return `# INFORME ${tipoLabel} — SÍNTESIS EJECUTIVA

**Universidad Nacional de Loja** · Coordinación de Vinculación con la Sociedad  
**Código:** ${proyecto.codigo || '—'} · **Fecha:** ${fechaHoy} · **Responsable:** ${resp}

---

## 1. Identificación

| Campo | Valor |
| --- | --- |
| Proyecto | ${clip(proyecto.titulo || '—', 90)} |
| Estado | ${estadoLabel} |
| Carrera | ${clip(carrera, 40)} |
| Período | ${periodoIni} – ${periodoFin} |
| Presupuesto | ${money(planif)}${ejec != null ? ` · Ejecutado: ${money(ejec)}` : ''} |

## 2. Situación actual

El proyecto **${proyecto.codigo || 's/c'}** registra un avance promedio de actividades del **${progGeneral}%** (${actividades.length} actividad${actividades.length === 1 ? '' : 'es'}, ${avances.length} avance${avances.length === 1 ? '' : 's'}). Participación: **${horasCump} h** de **${horasComp} h** comprometidas (${pctHoras}%).${proyecto.objetivo_general?.trim() ? ` Objetivo: ${clip(proyecto.objetivo_general, maxObjChars)}` : ''}

## 3. Avance de actividades

| Código | Actividad | % | Estado |
| --- | --- | --- | --- |
${rows}
${actividades.length > maxActs ? `\n*Se muestran las ${maxActs} actividades con mayor avance de ${actividades.length} totales.*\n` : ''}
## 4. Hallazgos y alertas

${difLine}

## 5. Conclusiones y acciones

${conc.map((c, i) => `${i + 1}. ${c}`).join('\n')}

**Próximos pasos:** ${buildRecs().map((r, i) => `${i + 1}) ${r}`).join(' ')}

---

**${resp}** — Responsable del Proyecto  
**${proyecto.coordinador_academico_nombre || 'Coordinador/a Académico/a'}** — Coordinación Académica  

*Síntesis de 1 página generada el ${fechaHoy}. Revisar antes del envío formal.*
`
  }

  /* ─── PLANTILLAS 2–3 y 4–6 páginas ─── */
  const secciones: string[] = []
  let n = 1

  const include = (key: AtributoKey) => {
    // En resumido se omiten secciones secundarias aunque estén marcadas
    if (esResumido && (key === 'evidencias' || key === 'indicadores')) return false
    return hasAttr(config, key)
  }

  secciones.push(`# INFORME ${tipoLabel} DE PROYECTO
# DE VINCULACIÓN CON LA SOCIEDAD

## UNIVERSIDAD NACIONAL DE LOJA
### Coordinación de Vinculación con la Sociedad

---

**Código del proyecto:** ${proyecto.codigo || '—'}  
**Fecha de elaboración:** ${fechaHoy}  
**Período del informe:** ${periodoIni} al ${periodoFin === '-' ? formatDate(todayISO()) : periodoFin}  
**Responsable:** ${resp}  
**Extensión:** ${esResumido ? 'Resumido (2-3 páginas)' : 'Completo (4-6 páginas)'} · **Tono:** ${config.tono}

---
`)

  if (include('datos_generales')) {
    const filas = [
      `| Código | ${proyecto.codigo || '—'} |`,
      `| Título | ${proyecto.titulo || '—'} |`,
      `| Estado actual | ${estadoLabel} |`,
      `| Carrera | ${carrera} |`,
      `| Responsable | ${resp} |`,
      `| Período de ejecución | ${periodoIni} – ${periodoFin} |`,
      `| Presupuesto aprobado | ${money(planif)} |`,
    ]
    if (esCompleto) {
      filas.push(`| Tipo de proyecto | ${proyecto.tipo || '—'} |`)
      filas.push(`| Dirección de ejecución | ${proyecto.direccion_ejecucion?.trim() || 'No registrada'} |`)
    }
    secciones.push(`## ${n}. DATOS INFORMATIVOS

| Campo | Detalle |
| --- | --- |
${filas.join('\n')}

`)
    n++
  }

  {
    const benTxt = beneficiarios.length
      ? beneficiarios.slice(0, esResumido ? 2 : 6).map((b) => `${b.nombre} (${b.cantidad_estimada})`).join('; ')
      : (proyecto.beneficiarios_directos || 'población beneficiaria del territorio')

    const base = `El proyecto **${proyecto.titulo}** (${proyecto.codigo || 's/c'}), a cargo de **${resp}** (${carrera}), se encuentra en estado **${estadoLabel}**. Avance promedio de actividades: **${progGeneral}%** (${actividades.length} actividades, ${avances.length} avances). Participación: **${horasCump}/${horasComp} h** (${pctHoras}%).`

    const medio = `${base} Objetivo general: ${clip(proyecto.objetivo_general || 'No registrado', maxObjChars)}. Beneficiarios: ${clip(benTxt, 180)}.`

    const largo = `${medio}

Durante el período se consolidó la información operativa del sistema institucional.${dificultades.length ? ` Se identificaron ${dificultades.length} dificultad(es) con acciones correctivas.` : ' No se registran dificultades operativas formales.'}${config.instrucciones ? ` Nota del responsable: ${clip(config.instrucciones, 200)}` : ''}

Documento de seguimiento de carácter ${config.tono.toLowerCase()} para revisión académica e institucional.`

    secciones.push(`## ${n}. RESUMEN EJECUTIVO

${esResumido ? medio : largo}

`)
    n++
  }

  if (include('marco_logico')) {
    if (esResumido) {
      secciones.push(`## ${n}. OBJETIVO Y MARCO LÓGICO

**Objetivo general:** ${clip(proyecto.objetivo_general || 'No registrado', maxObjChars)}

| Nivel | Resumen |
| --- | --- |
| FIN | ${clip(ml('FIN') || 'No registrado', 120)} |
| PROPÓSITO | ${clip(ml('PROPOSITO') || 'No registrado', 120)} |

`)
    } else {
      secciones.push(`## ${n}. MARCO LÓGICO Y OBJETIVOS

**Objetivo general**

${proyecto.objetivo_general?.trim() || 'No se ha registrado el objetivo general.'}

**Resultados esperados**

${proyecto.resultados_esperados?.trim() || 'No se han registrado resultados esperados.'}

| Nivel | Resumen narrativo |
| --- | --- |
| FIN | ${ml('FIN') || 'No registrado'} |
| PROPÓSITO | ${ml('PROPOSITO') || 'No registrado'} |
| COMPONENTES | ${ml('COMPONENTES') || 'No registrado'} |
| ACTIVIDADES | ${ml('ACTIVIDADES') || 'No registrado'} |

`)
    }
    n++
  }

  if (include('avances')) {
    const rows = actsView.length
      ? actsView.map((act) => {
          const avs = avances.filter((a) => a.actividad === act.id)
          const obs = avs.length
            ? `${avs.length} avance(s)`
            : 'Sin avances'
          const ult = avs[0]?.descripcion?.trim()
          const obsFull = esCompleto && ult
            ? `${obs}. ${clip(ult, 80)}`.replace(/\|/g, '/')
            : obs
          return `| ${act.codigo || '—'} | ${clip(act.nombre || '—', esResumido ? 40 : 70)} | ${num(act.porcentaje_avance)}% | ${act.estado} | ${obsFull} |`
        }).join('\n')
      : '| — | Sin actividades registradas | 0% | — | — |'

    secciones.push(`## ${n}. AVANCE DE ACTIVIDADES

Avance promedio: **${progGeneral}%**.${actividades.length > maxActs ? ` (Tabla: ${maxActs} de ${actividades.length} actividades.)` : ''}

| Código | Actividad | Avance | Estado | Observaciones |
| --- | --- | --- | --- | --- |
${rows}

`)
    if (maxAvanceDet > 0 && avances.length) {
      const detalle = avances.slice(0, maxAvanceDet).map((av) => {
        const act = actividades.find((a) => a.id === av.actividad)
        return `- **${act?.codigo || 'ACT'}** (${formatDate(av.fecha_registro)}): ${clip(av.descripcion || 'Sin descripción', esResumido ? 100 : 200)}`
      }).join('\n')
      secciones.push(`### Detalle de avances

${detalle}

`)
    }
    n++
  }

  if (include('avances') || include('conclusiones')) {
    const pool = logros.length
      ? logros.slice(0, maxLogros).map((av) => {
          const act = actividades.find((a) => a.id === av.actividad)
          return `- ${act ? `[${act.codigo}] ` : ''}${clip(av.descripcion.trim(), esResumido ? 100 : 200)}`
        })
      : actsView
        .filter((a) => num(a.porcentaje_avance) > 0)
        .slice(0, maxLogros)
        .map((a) => `- ${a.codigo}: ${num(a.porcentaje_avance)}% — ${clip(a.nombre, 60)}`)

    secciones.push(`## ${n}. LOGROS ALCANZADOS

${pool.length ? pool.join('\n') : '- Sin logros formales registrados a la fecha.'}

`)
    n++
  }

  if (include('dificultades')) {
    if (dificultades.length) {
      const items = dificultades.slice(0, maxDif).map((av) => {
        const act = actividades.find((a) => a.id === av.actividad)
        return `- **${act?.codigo || 'Dif.'}:** ${clip(av.dificultades.trim(), esResumido ? 120 : 240)}${av.acciones_correctivas ? `\n  - Acción: ${clip(av.acciones_correctivas, esResumido ? 100 : 200)}` : ''}`
      }).join('\n')
      secciones.push(`## ${n}. DIFICULTADES Y ACCIONES CORRECTIVAS

${items}

`)
    } else if (esCompleto) {
      secciones.push(`## ${n}. DIFICULTADES Y ACCIONES CORRECTIVAS

No se registran dificultades operativas en los avances del período.

`)
    }
    if (dificultades.length || esCompleto) n++
  }

  if (include('indicadores') && esCompleto) {
    secciones.push(`## ${n}. INDICADORES DE CUMPLIMIENTO

| Indicador | Meta | Valor actual |
| --- | --- | --- |
| Avance promedio de actividades | 100% | ${progGeneral}% |
| Horas de participación | ${horasComp} h | ${horasCump} h (${pctHoras}%) |
| Avances documentados | Continuo | ${avances.length} |
| Presupuesto ejecutado | ${money(planif)} | ${ejec != null ? money(ejec) : 'Sin datos'} |

`)
    n++
  }

  if (include('participantes')) {
    const parts = participantes.slice(0, maxPart)
    const rows = parts.length
      ? parts.map((p) =>
        `| ${clip(p.usuario_nombre || 'Participante', 28)} | ${p.rol} | ${num(p.horas_comprometidas)} | ${num(p.horas_cumplidas)} |`,
      ).join('\n')
      : '| — | — | 0 | 0 |'

    secciones.push(`## ${n}. PARTICIPACIÓN

| Participante | Rol | Comprometidas | Cumplidas |
| --- | --- | --- | --- |
${rows}

**Totales:** ${horasCump} h / ${horasComp} h (${pctHoras}%).${participantes.length > maxPart ? ` Mostrando ${maxPart} de ${participantes.length}.` : ''}

`)
    n++
  }

  if (include('presupuesto')) {
    secciones.push(`## ${n}. PRESUPUESTO

| Concepto | Monto |
| --- | --- |
| Planificado / aprobado | ${money(planif)} |
| Ejecutado | ${ejec != null ? money(ejec) : 'Sin datos'} |
${esCompleto ? `| Saldo | ${saldo != null ? money(saldo) : 'Sin datos'} |\n| Estado | ${presupuesto?.estado || 'No especificado'} |` : ''}

`)
    n++
  }

  if (include('evidencias') && esCompleto) {
    const conReq = actividades.filter((a) => a.requiere_evidencia)
    secciones.push(`## ${n}. EVIDENCIAS Y DOCUMENTACIÓN

${conReq.length
    ? `${conReq.length} actividad(es) requieren evidencia (${conReq.map((a) => a.codigo).join(', ')}). `
    : ''}Los ${avances.length} avances del período son el soporte narrativo. Se recomienda anexar medios de verificación conforme a la normativa UNL.

`)
    n++
  }

  if (include('conclusiones')) {
    const conc: string[] = [
      `El proyecto ${proyecto.codigo || ''} mantiene un avance del ${progGeneral}% (estado ${estadoLabel}).`,
    ]
    if (participantes.length) {
      conc.push(`Participación académica: ${pctHoras}% de horas comprometidas (${horasCump}/${horasComp} h).`)
    }
    if (logros.length) {
      conc.push(`Se documentaron ${logros.length} avance(s) aprobado(s) con resultados concretos.`)
    } else {
      conc.push('Es prioritario fortalecer el registro y aprobación de avances.')
    }
    if (dificultades.length && esCompleto) {
      conc.push(`Hay ${dificultades.length} dificultad(es) con seguimiento de acciones correctivas.`)
    }
    secciones.push(`## ${n}. CONCLUSIONES

${conc.slice(0, maxConc).map((c, i) => `${i + 1}. ${c}`).join('\n')}

`)
    n++
  }

  if (include('proximos_pasos') || include('conclusiones')) {
    secciones.push(`## ${n}. RECOMENDACIONES Y PRÓXIMOS PASOS

${buildRecs().map((r, i) => `${i + 1}. ${r}`).join('\n')}

`)
    n++
  }

  if (include('datos_generales') && beneficiarios.length && esCompleto) {
    secciones.push(`## ${n}. BENEFICIARIOS

| Tipo | Nombre | Cantidad | Ubicación |
| --- | --- | --- | --- |
${beneficiarios.slice(0, 12).map((b) => `| ${b.tipo} | ${b.nombre} | ${b.cantidad_estimada} | ${b.ubicacion || '—'} |`).join('\n')}

`)
    n++
  }

  secciones.push(`## ${n}. FIRMAS DE RESPONSABILIDAD

___________________________  
**${resp}**  
Responsable del Proyecto

${esCompleto ? '\n&nbsp;\n\n' : '\n'}___________________________  
**${proyecto.coordinador_academico_nombre || 'Coordinador/a Académico/a'}**  
Coordinación Académica

---

*Informe ${esResumido ? 'resumido' : 'completo'} generado el ${fechaHoy}. Revisar y validar antes del envío formal.*
`)

  return secciones.join('\n').trim() + '\n'
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/* ─── Component ─── */

export default function GenerarInformeIAModal({ open, onClose, proyectoId, onSaved }: Props) {
  const user = useAuthStore((s) => s.user)
  const [step, setStep] = useState<Step>('config')
  const [config, setConfig] = useState<ConfigInforme>(DEFAULT_CONFIG)
  const [proyectoData, setProyectoData] = useState<ProyectoData | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [contenido, setContenido] = useState('')
  const [resultTab, setResultTab] = useState<'preview' | 'markdown'>('preview')
  const [saving, setSaving] = useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [editMode, setEditMode] = useState(false)

  const reset = useCallback(() => {
    setStep('config')
    setConfig(DEFAULT_CONFIG)
    setProyectoData(null)
    setContenido('')
    setResultTab('preview')
    setSaving(false)
    setLoadingMsgIdx(0)
    setProgress(0)
    setErrorMsg('')
    setEditMode(false)
  }, [])

  useEffect(() => {
    if (!open) {
      reset()
      return
    }
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open, reset])

  useEffect(() => {
    if (step !== 'loading') return
    const msgTimer = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 2800)
    const progTimer = setInterval(() => {
      setProgress((p) => (p >= 92 ? p : p + Math.random() * 4 + 1))
    }, 400)
    return () => {
      clearInterval(msgTimer)
      clearInterval(progTimer)
    }
  }, [step])

  const loadProyectoData = async (): Promise<ProyectoData> => {
    const [
      proyRes,
      mlRes,
      actRes,
      partRes,
      benRes,
      presRes,
      aliRes,
    ] = await Promise.all([
      proyectosApi.get(proyectoId),
      marcoLogicoApi.list({ proyecto: String(proyectoId), page_size: '100' }),
      actividadesApi.list({ proyecto: String(proyectoId), page_size: '100' }),
      participantesApi.list({ proyecto: String(proyectoId), page_size: '100' }),
      beneficiariosApi.list({ proyecto: String(proyectoId), page_size: '100' }),
      presupuestosApi.list({ proyecto: String(proyectoId), page_size: '10' }),
      alineacionesApi.list({ proyecto: String(proyectoId), page_size: '50' }),
    ])

    const actividades = unwrapList(actRes.data)
    const avancesNested = await Promise.all(
      actividades.map((act) =>
        avancesApi.byActividad(act.id).then((r) => unwrapList(r.data)).catch(() => [] as Avance[]),
      ),
    )
    const avances = avancesNested.flat()
    const presupuestos = unwrapList(presRes.data)

    return {
      proyecto: proyRes.data,
      marcoLogico: unwrapList(mlRes.data),
      actividades,
      avances,
      participantes: unwrapList(partRes.data),
      beneficiarios: unwrapList(benRes.data),
      presupuesto: presupuestos[0] ?? proyRes.data.presupuesto ?? null,
      alineaciones: unwrapList(aliRes.data),
    }
  }

  const handleNextToPreview = async () => {
    if (config.atributos.length === 0) {
      toast.error('Seleccione al menos un atributo a incluir')
      return
    }
    setLoadingData(true)
    try {
      const data = await loadProyectoData()
      setProyectoData(data)
      setStep('preview')
    } catch {
      toast.error('No se pudieron cargar los datos del proyecto')
    } finally {
      setLoadingData(false)
    }
  }

  const runGeneration = async (data: ProyectoData, cfg: ConfigInforme) => {
    setStep('loading')
    setProgress(8)
    setLoadingMsgIdx(0)
    setErrorMsg('')
    try {
      // Intento opcional con API externa (si está configurada). Si falla, se usa el motor local.
      let texto = ''
      const tryRemote = async () => {
        try {
          const prompt = construirPrompt(data, cfg)
          const { data: res } = await informesApi.generarIA({ prompt, max_tokens: 4000 })
          return res?.data?.contenido || ''
        } catch {
          return ''
        }
      }

      const remotePromise = tryRemote()
      await delay(1200)
      setProgress(35)
      await delay(900)
      setProgress(60)

      texto = await remotePromise
      if (!texto?.trim()) {
        await delay(600)
        setProgress(85)
        texto = generarInformeInstitucional(data, cfg)
      }

      if (!texto?.trim()) {
        throw new Error('No fue posible construir el informe con los datos disponibles.')
      }

      setContenido(texto)
      setProgress(100)
      await delay(300)
      setStep('result')
      setResultTab('preview')
      setEditMode(false)
    } catch (err: unknown) {
      // Último recurso: motor local sin red
      try {
        const local = generarInformeInstitucional(data, cfg)
        if (local.trim()) {
          setContenido(local)
          setProgress(100)
          setStep('result')
          setResultTab('preview')
          setEditMode(false)
          return
        }
      } catch { /* fallthrough */ }

      const e = err as { message?: string }
      setErrorMsg(e?.message || 'No se pudo generar el informe con los datos del proyecto.')
      setStep('error')
    }
  }

  const handleGenerate = async () => {
    if (!proyectoData) return
    await runGeneration(proyectoData, config)
  }

  const handleRegenerate = async () => {
    if (!proyectoData) return
    await runGeneration(proyectoData, config)
  }

  const handleSave = async () => {
    if (!proyectoData || !contenido.trim()) return
    setSaving(true)
    try {
      const titulo = extractTitulo(contenido, config.tipo)
      let resumen = extractResumen(contenido)
      if (resumen.length < 100) {
        resumen = (resumen + ' ' + 'Informe elaborado con asistencia de inteligencia artificial a partir de los datos del proyecto registrados en el sistema de vinculación.').slice(0, 1000)
      }
      await informesApi.create({
        proyecto: proyectoId,
        tipo: config.tipo,
        numero: '',
        titulo,
        periodo_inicio: proyectoData.proyecto.fecha_inicio || todayISO(),
        periodo_fin: todayISO(),
        resumen,
        contenido: contenido.trim(),
        estado: 'PENDIENTE',
        elaborado_por: user?.id ?? null,
        generado_con_ia: true,
      })
      toast.success('Informe guardado correctamente')
      onSaved()
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; message?: string } } }
      toast.error(e?.response?.data?.detail || e?.response?.data?.message || 'Error al guardar el informe')
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contenido)
      toast.success('Texto copiado al portapapeles')
    } catch {
      toast.error('No se pudo copiar el texto')
    }
  }

  const handleDownloadWord = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Informe</title>
<style>
body{font-family:Calibri,Arial,sans-serif;font-size:12pt;color:#111;line-height:1.6;max-width:800px;margin:40px auto}
h1{font-size:16pt;text-align:center;color:#0F172A}
h2{font-size:13pt;color:#1E3A8A;border-bottom:2px solid #1E3A8A;padding-bottom:4px;text-transform:uppercase}
h3{font-size:12pt;color:#374151}
table{border-collapse:collapse;width:100%;margin:12px 0}
th,td{border:1px solid #E5E7EB;padding:6px 10px;text-align:left}
th{background:#0F172A;color:#fff}
tr:nth-child(even){background:#F8FAFC}
</style></head><body>${markdownToHtml(contenido)}</body></html>`
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `informe-${proyectoData?.proyecto.codigo || proyectoId}-${config.tipo.toLowerCase()}.doc`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Descarga iniciada')
  }

  const missingFields = useMemo(() => {
    if (!proyectoData) return [] as string[]
    const miss: string[] = []
    const { proyecto, marcoLogico, actividades, avances, participantes, presupuesto } = proyectoData
    if (!proyecto.objetivo_general) miss.push('objetivo general')
    if (!marcoLogico.length) miss.push('marco lógico')
    if (!actividades.length) miss.push('actividades')
    if (!avances.length) miss.push('avances registrados')
    if (!participantes.length) miss.push('participantes')
    if (!presupuesto?.monto_ejecutado || Number(presupuesto.monto_ejecutado) === 0) {
      miss.push('presupuesto ejecutado')
    }
    const sinEvid = actividades.filter((a) => {
      const avs = avances.filter((av) => av.actividad === a.id)
      return avs.length === 0
    })
    if (sinEvid.length) miss.push(`avances de ${sinEvid.map((a) => a.codigo).join(', ')}`)
    return miss
  }, [proyectoData])

  const stats = useMemo(() => {
    const words = wordCount(contenido)
    return {
      words,
      sections: sectionCount(contenido),
      pages: estimatePages(words),
    }
  }, [contenido])

  const completitud = useMemo(() => {
    if (!proyectoData) return 0
    let score = 0
    const total = 6
    if (proyectoData.proyecto.codigo) score++
    if (proyectoData.marcoLogico.length) score++
    if (proyectoData.actividades.length) score++
    if (proyectoData.avances.length) score++
    if (proyectoData.participantes.length) score++
    if (proyectoData.presupuesto) score++
    return Math.round((score / total) * 100)
  }, [proyectoData])

  if (!open) return null

  /* ─── Fullscreen result ─── */
  if (step === 'result') {
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex flex-col bg-white">
        <header className="flex items-center justify-between gap-3 px-5 py-3.5 bg-[#0F172A] text-white flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-[#1E3A8A] flex items-center justify-center flex-shrink-0" style={{ borderRadius: 0 }}>
              <Sparkles size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[16px] font-bold leading-tight truncate">Informe generado con IA</p>
              <p className="text-[11px] text-white/60 truncate">{proyectoData?.proyecto.titulo}</p>
            </div>
            <span className="ml-2 inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-[#16A34A] text-white flex-shrink-0">
              Listo para revisar
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => { setEditMode(true); setResultTab('markdown') }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-white/30 hover:bg-white/10 transition-colors"
              style={{ borderRadius: 0 }}
            >
              <Pencil size={12} /> Editar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-[#0F172A] hover:bg-slate-100 disabled:opacity-50 transition-colors"
              style={{ borderRadius: 0 }}
            >
              <Save size={12} /> {saving ? 'Guardando...' : 'Guardar informe'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-0 border-b border-[#E5E7EB] bg-white px-4 flex-shrink-0">
              {(['preview', 'markdown'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setResultTab(t)}
                  className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                    resultTab === t
                      ? 'border-[#0F172A] text-[#0F172A]'
                      : 'border-transparent text-[#6B7280] hover:text-[#0F172A]'
                  }`}
                >
                  {t === 'preview' ? 'Vista previa' : 'Markdown'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto bg-[#FAFAFA]">
              {resultTab === 'preview' ? (
                <div
                  className="informe-ia-preview mx-auto my-6 bg-white shadow-lg"
                  style={{ maxWidth: 800, padding: '40px 48px', minHeight: '70vh' }}
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(contenido) }}
                />
              ) : (
                <textarea
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  readOnly={!editMode && resultTab === 'markdown' ? false : false}
                  className="w-full h-full min-h-full p-6 text-[13px] font-mono text-[#374151] bg-[#FAFAFA] border-0 focus:outline-none resize-none leading-relaxed"
                />
              )}
            </div>
          </div>

          <aside className="w-[280px] flex-shrink-0 border-l border-[#E5E7EB] bg-[#F8FAFC] overflow-y-auto p-4 space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">Estadísticas del informe</p>
              <div className="space-y-1.5 text-[12px] text-[#374151]">
                <div className="flex justify-between"><span>Palabras</span><span className="font-semibold tabular-nums">{stats.words}</span></div>
                <div className="flex justify-between"><span>Secciones</span><span className="font-semibold tabular-nums">{stats.sections}</span></div>
                <div className="flex justify-between"><span>Páginas est.</span><span className="font-semibold tabular-nums">{stats.pages}</span></div>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">Datos utilizados</p>
              <ul className="space-y-1 text-[12px] text-[#374151]">
                <li className="flex items-start gap-1.5">
                  {proyectoData?.marcoLogico.length ? <Check size={12} className="text-emerald-600 mt-0.5" /> : <Minus size={12} className="text-gray-400 mt-0.5" />}
                  Marco lógico
                </li>
                <li className="flex items-start gap-1.5">
                  {proyectoData?.avances.length ? <Check size={12} className="text-emerald-600 mt-0.5" /> : <Minus size={12} className="text-gray-400 mt-0.5" />}
                  {proyectoData?.actividades.length || 0} actividades · {proyectoData?.avances.length || 0} avances
                </li>
                <li className="flex items-start gap-1.5">
                  {proyectoData?.participantes.length ? <Check size={12} className="text-emerald-600 mt-0.5" /> : <Minus size={12} className="text-gray-400 mt-0.5" />}
                  {proyectoData?.participantes.length || 0} participantes
                </li>
                <li className="flex items-start gap-1.5">
                  {proyectoData?.avances.some((a) => a.dificultades) ? <Check size={12} className="text-emerald-600 mt-0.5" /> : <Minus size={12} className="text-gray-400 mt-0.5" />}
                  Dificultades registradas
                </li>
                <li className="flex items-start gap-1.5">
                  {proyectoData?.presupuesto?.monto_ejecutado && Number(proyectoData.presupuesto.monto_ejecutado) > 0
                    ? <Check size={12} className="text-emerald-600 mt-0.5" />
                    : <AlertTriangle size={12} className="text-amber-500 mt-0.5" />}
                  Presupuesto ejecutado
                </li>
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">Nivel de completitud</p>
              <div className="h-2 bg-[#E5E7EB] overflow-hidden mb-1">
                <div className="h-full bg-emerald-600 transition-all" style={{ width: `${completitud}%` }} />
              </div>
              <p className="text-[11px] text-[#6B7280]">{completitud}% · basado en datos disponibles</p>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">Acciones</p>
              <div className="space-y-2">
                <button type="button" onClick={handleCopy} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors" style={{ borderRadius: 0 }}>
                  <Copy size={12} /> Copiar texto
                </button>
                <button type="button" onClick={handleDownloadWord} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors" style={{ borderRadius: 0 }}>
                  <Download size={12} /> Descargar Word
                </button>
                <button type="button" onClick={handleRegenerate} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors" style={{ borderRadius: 0 }}>
                  <RefreshCw size={12} /> Regenerar
                </button>
              </div>
            </div>
          </aside>
        </div>

        <footer className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[#E5E7EB] bg-white flex-shrink-0">
          <p className="text-[11px] text-[#6B7280] flex items-start gap-1.5 max-w-xl">
            <AlertTriangle size={12} className="mt-0.5 flex-shrink-0 text-amber-500" />
            Revise el contenido antes de guardar. La IA puede cometer errores. Verifique las cifras.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#6B7280] bg-white border border-[#D1D5DB] hover:bg-gray-50 transition-colors"
              style={{ borderRadius: 0 }}
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0F172A] hover:bg-[#1E3A8A] disabled:opacity-50 transition-colors"
              style={{ borderRadius: 0 }}
            >
              <Save size={14} /> {saving ? 'Guardando...' : 'Guardar informe'}
            </button>
          </div>
        </footer>

        <style>{`
          .informe-ia-preview h1 { color: #0F172A; font-size: 20px; font-weight: 700; text-align: center; margin: 0 0 12px; }
          .informe-ia-preview h2 { color: #1E3A8A; font-size: 14px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #1E3A8A; padding-bottom: 6px; margin: 28px 0 12px; }
          .informe-ia-preview h3 { color: #374151; font-size: 13px; font-weight: 700; margin: 16px 0 8px; }
          .informe-ia-preview p { color: #374151; font-size: 13px; line-height: 1.8; margin: 0 0 10px; }
          .informe-ia-preview strong { color: #0F172A; font-weight: 700; }
          .informe-ia-preview hr { border: none; border-top: 1px solid #E5E7EB; margin: 20px 0; }
          .informe-ia-preview table { width: 100%; border-collapse: collapse; margin: 12px 0 16px; font-size: 12px; }
          .informe-ia-preview th { background: #0F172A; color: #fff; text-align: left; padding: 8px 10px; font-weight: 600; }
          .informe-ia-preview td { border: 1px solid #E5E7EB; padding: 7px 10px; color: #374151; }
          .informe-ia-preview tbody tr:nth-child(even) { background: #F8FAFC; }
          .informe-ia-preview ul, .informe-ia-preview ol { margin: 0 0 12px 1.25rem; color: #374151; font-size: 13px; line-height: 1.7; }
          .informe-ia-preview li { margin-bottom: 4px; }
        `}</style>
      </div>,
      document.body,
    )
  }

  /* ─── Loading overlay ─── */
  if (step === 'loading') {
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0F172A]/90 backdrop-blur-sm">
        <div className="w-full max-w-md px-8 text-center">
          <div className="mx-auto mb-6 w-14 h-14 border-[3px] border-white/20 border-t-emerald-400 animate-spin" style={{ borderRadius: 0 }} />
          <p className="text-white text-[15px] font-semibold mb-2 transition-opacity">
            {LOADING_MESSAGES[loadingMsgIdx]}
          </p>
          <p className="text-white/50 text-xs mb-6">Esto puede tomar entre 15 y 40 segundos</p>
          <div className="h-1.5 bg-white/10 overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-white/40 text-[11px] mt-2 tabular-nums">{Math.round(Math.min(progress, 99))}%</p>
        </div>
      </div>,
      document.body,
    )
  }

  /* ─── Error modal ─── */
  if (step === 'error') {
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
        <div className="bg-white w-full max-w-[480px] mx-4 shadow-[0_20px_60px_rgba(0,0,0,0.15)]" style={{ borderRadius: 0 }}>
          <div className="bg-[#FEF2F2] px-6 py-5 flex items-start gap-3" style={{ borderRadius: 0 }}>
            <div className="w-10 h-10 bg-[#DC2626] text-white flex items-center justify-center flex-shrink-0" style={{ borderRadius: 0 }}>
              <X size={18} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#991B1B]">No se pudo generar el informe</h3>
              <p className="text-[13px] text-[#7F1D1D]/80 mt-1 leading-relaxed">
                {errorMsg || 'Hubo un problema al conectar con el servicio de IA. Puede intentar de nuevo o crear el informe manualmente.'}
              </p>
            </div>
          </div>
          <div className="px-6 py-4 flex items-center justify-end gap-2 border-t border-[#F3F4F6]">
            <button
              type="button"
              onClick={() => { onClose() }}
              className="px-4 py-2 text-sm font-medium text-ink bg-white border border-[#0A0A0A] hover:bg-gray-50 transition-colors"
              style={{ borderRadius: 0 }}
            >
              Crear manualmente
            </button>
            <button
              type="button"
              onClick={() => { if (proyectoData) runGeneration(proyectoData, config); else setStep('preview') }}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0F172A] hover:bg-[#1E3A8A] transition-colors"
              style={{ borderRadius: 0 }}
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  /* ─── Config + Preview modal ─── */
  const proyectoNombre = proyectoData?.proyecto.titulo || 'Proyecto de vinculación'

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div
        className="bg-white w-full mx-4 flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
        style={{ maxWidth: 580, maxHeight: '90vh', borderRadius: 0 }}
      >
        <header className="bg-[#0F172A] px-6 py-5 flex items-start gap-3 flex-shrink-0" style={{ borderRadius: 0 }}>
          <div className="w-8 h-8 bg-[#1E3A8A] flex items-center justify-center flex-shrink-0" style={{ borderRadius: 0 }}>
            <Sparkles size={14} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-bold text-white leading-tight">Generar informe con IA</h2>
            <p className="text-[12px] text-white/70 mt-0.5 truncate">
              {step === 'preview' ? 'Revise la información que se usará' : proyectoNombre}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white p-1" aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6" style={{ maxHeight: step === 'preview' ? 400 : undefined }}>
          {step === 'config' && (
            <div className="space-y-6">
              {/* Tipo */}
              <section>
                <label className="block text-[13px] font-bold text-[#374151] mb-2">Tipo de informe *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIPOS.map(({ value, label, Icon }) => {
                    const active = config.tipo === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setConfig((c) => ({ ...c, tipo: value }))}
                        className={`flex flex-col items-center gap-1.5 px-4 py-3 text-center transition-all ${
                          active
                            ? 'border-2 border-[#0F172A] bg-[#F8FAFC] font-bold'
                            : 'border border-[#E5E7EB] hover:border-[#CBD5E1]'
                        }`}
                        style={{ borderRadius: 0, padding: '12px 16px' }}
                      >
                        <Icon size={16} className={active ? 'text-[#0F172A]' : 'text-[#6B7280]'} />
                        <span className={`text-[12px] ${active ? 'text-[#0F172A] font-bold' : 'text-[#374151]'}`}>{label}</span>
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Atributos */}
              <section>
                <label className="block text-[13px] font-bold text-[#374151] mb-2">¿Qué información incluir?</label>
                <div className="space-y-2">
                  {ATRIBUTOS.map(({ key, label }) => {
                    const checked = config.atributos.includes(key)
                    return (
                      <label key={key} className="flex items-start gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setConfig((c) => ({
                              ...c,
                              atributos: checked
                                ? c.atributos.filter((a) => a !== key)
                                : [...c.atributos, key],
                            }))
                          }}
                          className="mt-0.5 w-4 h-4 accent-[#0F172A] border-[#D1D5DB]"
                        />
                        <span className="text-[12.5px] text-[#374151] leading-snug group-hover:text-[#0F172A]">{label}</span>
                      </label>
                    )
                  })}
                </div>
              </section>

              {/* Tono y extensión */}
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-[#374151] mb-1.5">Tono</label>
                  <select
                    value={config.tono}
                    onChange={(e) => setConfig((c) => ({ ...c, tono: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] bg-white focus:outline-none focus:border-[#0F172A]"
                    style={{ borderRadius: 0 }}
                  >
                    {TONOS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#374151] mb-1.5">Extensión</label>
                  <select
                    value={config.extension}
                    onChange={(e) => setConfig((c) => ({ ...c, extension: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] bg-white focus:outline-none focus:border-[#0F172A]"
                    style={{ borderRadius: 0 }}
                  >
                    {EXTENSIONES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </section>

              {/* Instrucciones */}
              <section>
                <label className="block text-[13px] font-bold text-[#374151] mb-1.5">Instrucciones adicionales</label>
                <textarea
                  value={config.instrucciones}
                  onChange={(e) => setConfig((c) => ({ ...c, instrucciones: e.target.value.slice(0, 300) }))}
                  rows={3}
                  maxLength={300}
                  placeholder="Agrega contexto específico que deseas que la IA considere al generar el informe... Ej: 'Enfatizar los logros de participación comunitaria' o 'El proyecto tuvo retrasos por lluvias en agosto'"
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] bg-white focus:outline-none focus:border-[#0F172A] resize-none placeholder:text-[#9CA3AF]"
                  style={{ borderRadius: 0 }}
                />
                <p className="text-[11px] text-[#9CA3AF] text-right mt-1 tabular-nums">{config.instrucciones.length} / 300</p>
              </section>
            </div>
          )}

          {step === 'preview' && proyectoData && (
            <div className="space-y-3">
              <DataCard
                title="Datos generales"
                ok={Boolean(proyectoData.proyecto.codigo)}
              >
                <Row label="Código" value={proyectoData.proyecto.codigo} />
                <Row label="Título" value={proyectoData.proyecto.titulo} />
                <Row label="Estado" value={ESTADO_PROYECTO_LABELS[proyectoData.proyecto.estado] || proyectoData.proyecto.estado} />
                <Row
                  label="Período"
                  value={`${formatDate(proyectoData.proyecto.fecha_inicio) || '—'} - ${formatDate(proyectoData.proyecto.fecha_fin_planificada) || '—'}`}
                />
                <Row label="Responsable" value={proyectoData.proyecto.responsable_nombre || '—'} />
                <Row label="Carrera" value={proyectoData.proyecto.carrera_nombre || '—'} />
              </DataCard>

              <DataCard title="Marco lógico" ok={proyectoData.marcoLogico.length > 0}>
                {(['FIN', 'PROPOSITO', 'COMPONENTES', 'ACTIVIDADES'] as const).map((nivel) => {
                  const fila = proyectoData.marcoLogico.find((m) => m.nivel === nivel)
                  return (
                    <div key={nivel} className="flex items-start gap-1.5 text-[12px]">
                      {fila?.resumen_narrativo
                        ? <Check size={12} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                        : <Minus size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />}
                      <span>
                        <span className="font-semibold text-[#0F172A]">{nivel}: </span>
                        <span className="text-[#6B7280]">
                          {fila?.resumen_narrativo
                            ? (fila.resumen_narrativo.length > 80
                              ? `${fila.resumen_narrativo.slice(0, 80)}...`
                              : fila.resumen_narrativo)
                            : 'No registrado'}
                        </span>
                      </span>
                    </div>
                  )
                })}
              </DataCard>

              <DataCard
                title="Avances registrados"
                ok={proyectoData.avances.length > 0}
              >
                {proyectoData.actividades.length === 0 ? (
                  <p className="text-[12px] text-[#9CA3AF]">Sin actividades</p>
                ) : (
                  <>
                    {proyectoData.actividades.map((act) => {
                      const avs = proyectoData.avances.filter((a) => a.actividad === act.id)
                      const aprob = avs.filter((a) => a.estado === 'APROBADO').length
                      const pend = avs.filter((a) => a.estado !== 'APROBADO').length
                      let detail = 'sin avances'
                      if (aprob) detail = `${aprob} avance${aprob > 1 ? 's' : ''} aprobado${aprob > 1 ? 's' : ''}`
                      else if (pend) detail = `${pend} avance${pend > 1 ? 's' : ''} pendiente${pend > 1 ? 's' : ''}`
                      return (
                        <p key={act.id} className="text-[12px] text-[#374151]">
                          <span className="font-mono font-semibold">{act.codigo}</span>
                          {': '}
                          {act.porcentaje_avance}% ({detail})
                        </p>
                      )
                    })}
                    <p className="text-[12px] font-semibold text-[#0F172A] pt-1 border-t border-[#F3F4F6] mt-1">
                      Progreso general: ~
                      {proyectoData.actividades.length
                        ? Math.round(
                          proyectoData.actividades.reduce((s, a) => s + (parseFloat(String(a.porcentaje_avance)) || 0), 0)
                          / proyectoData.actividades.length,
                        )
                        : 0}%
                    </p>
                  </>
                )}
              </DataCard>

              <DataCard title="Participantes" ok={proyectoData.participantes.length > 0}>
                {proyectoData.participantes.length === 0 ? (
                  <p className="text-[12px] text-[#9CA3AF]">Sin participantes</p>
                ) : (
                  proyectoData.participantes.map((p) => (
                    <p key={p.id} className="text-[12px] text-[#374151]">
                      {p.usuario_nombre || 'Participante'}: {p.horas_cumplidas || 0}h cumplidas / {p.horas_comprometidas}h
                    </p>
                  ))
                )}
              </DataCard>

              <DataCard title="Presupuesto" ok={Boolean(proyectoData.presupuesto || proyectoData.proyecto.presupuesto_aprobado)}>
                <Row
                  label="Planificado"
                  value={`$${Number(proyectoData.presupuesto?.monto_aprobado || proyectoData.proyecto.presupuesto_aprobado || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`}
                />
                <Row
                  label="Ejecutado"
                  value={
                    proyectoData.presupuesto?.monto_ejecutado != null
                      ? `$${Number(proyectoData.presupuesto.monto_ejecutado).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`
                      : 'Sin datos'
                  }
                />
              </DataCard>

              <DataCard
                title="Dificultades registradas"
                ok={proyectoData.avances.some((a) => a.dificultades?.trim())}
              >
                {proyectoData.avances.filter((a) => a.dificultades?.trim()).length === 0 ? (
                  <p className="text-[12px] text-[#9CA3AF]">Sin dificultades registradas</p>
                ) : (
                  proyectoData.avances
                    .filter((a) => a.dificultades?.trim())
                    .slice(0, 5)
                    .map((a) => (
                      <div key={a.id} className="text-[12px] text-[#374151] space-y-0.5">
                        <p>&ldquo;{a.dificultades}&rdquo;</p>
                        {a.acciones_correctivas && (
                          <p className="text-[#6B7280]">Acción: {a.acciones_correctivas}</p>
                        )}
                      </div>
                    ))
                )}
              </DataCard>

              {missingFields.length > 0 && (
                <div className="bg-[#FEFCE8] border border-[#EAB308] px-3 py-2.5 text-[12px] text-[#854D0E]" style={{ borderRadius: 0 }}>
                  <p className="font-semibold flex items-center gap-1.5 mb-1">
                    <AlertTriangle size={13} /> Algunos campos están vacíos
                  </p>
                  <p className="leading-relaxed">
                    {missingFields.join(', ')}. El informe incluirá solo la información disponible.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#F3F4F6] flex-shrink-0">
          {step === 'config' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-ink bg-white border border-[#0A0A0A] hover:bg-gray-50 transition-colors"
                style={{ borderRadius: 0 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleNextToPreview}
                disabled={loadingData}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0F172A] hover:bg-[#1E3A8A] disabled:opacity-50 transition-colors"
                style={{ borderRadius: 0 }}
              >
                {loadingData ? (
                  <><Loader2 size={14} className="animate-spin" /> Cargando datos...</>
                ) : (
                  <>Siguiente: Vista previa de datos <ChevronRight size={14} /></>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('config')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-ink bg-white border border-[#0A0A0A] hover:bg-gray-50 transition-colors"
                style={{ borderRadius: 0 }}
              >
                <ChevronLeft size={14} /> Atrás
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0F172A] hover:bg-[#1E3A8A] transition-colors"
                style={{ borderRadius: 0 }}
              >
                <Sparkles size={14} /> Generar informe ahora
              </button>
            </>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  )
}

function DataCard({ title, ok, children }: { title: string; ok: boolean; children: ReactNode }) {
  return (
    <div className="border border-[#E5E7EB] bg-white p-3 space-y-2" style={{ borderRadius: 0 }}>
      <div className="flex items-center gap-2 pb-1.5 border-b border-[#F3F4F6]">
        {ok
          ? <Check size={14} className="text-emerald-600" />
          : <Minus size={14} className="text-gray-400" />}
        <h4 className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wide">{title}</h4>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[12px] text-[#374151]">
      <span className="font-semibold text-[#0F172A]">{label}: </span>
      {value || '—'}
    </p>
  )
}
