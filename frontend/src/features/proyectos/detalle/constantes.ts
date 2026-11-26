/** Secciones de la pestaña Información, en el orden de las fases del formulario. */
export const SECCIONES_FICHA = [
  { id: 'ficha-informacion', etiqueta: 'Información' },
  { id: 'ficha-alineacion', etiqueta: 'Alineación' },
  { id: 'ficha-diagnostico', etiqueta: 'Diagnóstico' },
  { id: 'ficha-marco-logico', etiqueta: 'Marco lógico' },
  { id: 'ficha-planificacion', etiqueta: 'Planificación' },
  { id: 'ficha-responsables', etiqueta: 'Responsables' },
  { id: 'ficha-documentos', etiqueta: 'Documentos e imágenes' },
] as const

export const ROL_PARTICIPANTE_LABELS: Record<string, string> = {
  LIDER: 'Líder',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
  APOYO: 'Apoyo',
  EXTERNO: 'Externo',
}

export const PARTICIPANTE_AVATAR_COLORS: Record<string, string> = {
  LIDER: 'bg-ink text-white',
  DOCENTE: 'bg-[#DCE6F2] text-ink',
  ESTUDIANTE: 'bg-bg-muted text-ink-muted',
  APOYO: 'bg-naranja-suave text-naranja-hover',
  EXTERNO: 'bg-[#EAF0F8] text-ink-2',
}

export const FIRMA_TIPO_LABELS: Record<string, string> = {
  RESPONSABLE: 'Responsable',
  COORDINADOR: 'Coordinador',
  APROBADOR: 'Aprobador',
}

export const ANEXO_TIPO_LABELS: Record<string, string> = {
  CONVENIO: 'Convenio',
  RESOLUCION: 'Resolución',
  CARTA: 'Carta de compromiso',
  AVANCE: 'Informe de avance',
  OTRO: 'Otro',
}

/** Color del punto de estado en el encabezado azul marino (sobre fondo oscuro). */
export const ESTADO_PUNTO: Record<string, string> = {
  BORRADOR: '#CBD5E1',
  EN_REVISION: '#F5B54A',
  APROBADO: '#5CC99A',
  EN_EJECUCION: '#7DB4FF',
  EN_SUSPENSION: '#E85A3C',
  FINALIZADO: '#FFFFFF',
  CERRADO: '#A8A29E',
  CANCELADO: '#F08A80',
}

export const iniciales = (nombre: string | null | undefined) =>
  (nombre || '').split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'
