export const ESTADO_PROYECTO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En revisión',
  APROBADO: 'Aprobado',
  EN_EJECUCION: 'En ejecución',
  EN_SUSPENSION: 'En suspensión',
  FINALIZADO: 'Finalizado',
  CERRADO: 'Cerrado',
  CANCELADO: 'Cancelado',
}

export const ESTADO_CONVENIO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En revisión',
  VIGENTE: 'Vigente',
  VENCIDO: 'Vencido',
  SUSPENDIDO: 'Suspendido',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
}

export const TIPO_CONVENIO_LABELS: Record<string, string> = {
  MARCO: 'Marco',
  ESPECIFICO: 'Específico',
  COOPERACION: 'Cooperación',
  OTRO: 'Otro',
}

export const ROL_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  COORDINADOR: 'Coordinador',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
  DIRECTIVO: 'Directivo',
}

export const TIPO_PROYECTO_LABELS: Record<string, string> = {
  VINCULACION: 'Vinculación',
  INVESTIGACION: 'Investigación',
  EXTENSION: 'Extensión',
  MIXTO: 'Mixto',
}

export const PRIORIDAD_LABELS: Record<string, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
}

export const ESTADO_PROYECTO_COLORS: Record<string, string> = {
  BORRADOR: 'bg-[#CCCCFF] text-gray-800',
  EN_REVISION: 'bg-amber-500 text-white',
  APROBADO: 'bg-[#00A550] text-white',
  EN_EJECUCION: 'bg-[#011F5B] text-white',
  EN_SUSPENSION: 'bg-orange-500 text-white',
  FINALIZADO: 'bg-[#000000] text-white',
  CERRADO: 'bg-stone-500 text-white',
  CANCELADO: 'bg-red-500 text-white',
}

export const TIPO_PROYECTO_COLORS: Record<string, string> = {
  VINCULACION: 'text-gray-700',
  INVESTIGACION: 'text-gray-700',
  EXTENSION: 'text-gray-700',
  MIXTO: 'text-gray-700',
}

export const ESTADO_COLORS: Record<string, string> = {
  BORRADOR: 'bg-[#CCCCFF] text-gray-800',
  EN_REVISION: 'bg-amber-500 text-white',
  APROBADO: 'bg-[#00A550] text-white',
  EN_EJECUCION: 'bg-[#011F5B] text-white',
  VIGENTE: 'bg-emerald-500 text-white',
  EN_SUSPENSION: 'bg-orange-500 text-white',
  SUSPENDIDO: 'bg-orange-500 text-white',
  FINALIZADO: 'bg-[#000000] text-white',
  CERRADO: 'bg-stone-500 text-white',
  CANCELADO: 'bg-red-500 text-white',
  VENCIDO: 'bg-red-500 text-white',
}

/* ─────────────────────────────────────────────
   ESTADO CONVENIO BADGE — para ConveniosListPage
   (con pulse animado en estados activos)
   ───────────────────────────────────────────── */
export const ESTADO_CONVENIO_BADGE: Record<string, { bg: string; text: string; dot: string; pulse: boolean; pulseColor?: string }> = {
  BORRADOR:    { bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]', dot: 'bg-[#9CA3AF]', pulse: false },
  EN_REVISION: { bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', dot: 'bg-[#2563EB]', pulse: true,  pulseColor: 'bg-[#2563EB]' },
  VIGENTE:     { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', dot: 'bg-[#16A34A]', pulse: true,  pulseColor: 'bg-[#16A34A]' },
  SUSPENDIDO:  { bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]', dot: 'bg-[#EAB308]', pulse: true,  pulseColor: 'bg-[#EAB308]' },
  FINALIZADO:  { bg: 'bg-[#E5E7EB]', text: 'text-[#374151]', dot: 'bg-[#6B7280]', pulse: false },
  VENCIDO:     { bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]', dot: 'bg-[#DC2626]', pulse: false },
  CANCELADO:   { bg: 'bg-[#7F1D1D]', text: 'text-white',     dot: 'bg-[#991B1B]', pulse: false },
}

/* TIPO de convenio — colores planos para badges (sin pulse) */
export const TIPO_CONVENIO_COLORS: Record<string, string> = {
  MARCO:       'bg-[#DBEAFE] text-[#1E3A8A]',
  ESPECIFICO:  'bg-[#DCFCE7] text-[#15803D]',
  COOPERACION: 'bg-[#FEF3C7] text-[#92400E]',
  OTRO:        'bg-[#E5E7EB] text-[#374151]',
}

export const PRIORIDAD_COLORS: Record<string, string> = {
  BAJA: 'bg-emerald-500 text-white',
  MEDIA: 'bg-blue-500 text-white',
  ALTA: 'bg-amber-500 text-white',
  CRITICA: 'bg-red-500 text-white',
}

/* ─────────────────────────────────────────────
   ROL BADGE STYLES — paleta elegante, alineada al sistema
   emerald (no colores planos saturados).
   Cada rol: bg suave + texto fuerte + ring 1px + ícono.
   ───────────────────────────────────────────── */
export const ROL_BADGE_STYLES: Record<string, { bg: string; text: string; ring: string; iconBg: string }> = {
  ADMIN:       { bg: 'bg-slate-900',  text: 'text-white',        ring: 'ring-slate-700/40',  iconBg: 'bg-slate-800 text-slate-100' },
  COORDINADOR: { bg: 'bg-yellow-400', text: 'text-yellow-950',   ring: 'ring-yellow-500/50', iconBg: 'bg-yellow-500 text-yellow-950' },
  DOCENTE:     { bg: 'bg-emerald-400', text: 'text-emerald-950',   ring: 'ring-emerald-500/50', iconBg: 'bg-emerald-500 text-emerald-950' },
  ESTUDIANTE:  { bg: 'bg-sky-400',    text: 'text-sky-950',      ring: 'ring-sky-500/50',    iconBg: 'bg-sky-500 text-sky-950' },
  DIRECTIVO:   { bg: 'bg-amber-400',  text: 'text-amber-950',    ring: 'ring-amber-500/50',  iconBg: 'bg-amber-500 text-amber-950' },
}

/* Avatar gradientes (sofisticados, no planos) */
export const ROL_AVATAR_STYLES: Record<string, string> = {
  ADMIN:       'bg-gradient-to-br from-slate-800 to-black text-white',
  COORDINADOR: 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-950',
  DOCENTE:     'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white',
  ESTUDIANTE:  'bg-gradient-to-br from-sky-500 to-sky-700 text-white',
  DIRECTIVO:   'bg-gradient-to-br from-amber-500 to-amber-700 text-white',
}

/* ─────────────────────────────────────────────
   ESTADO AVANCE — para módulo de seguimiento
   ───────────────────────────────────────────── */
export const ESTADO_AVANCE_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_REVISION: 'En revisión',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
}

export const ESTADO_AVANCE_BADGE: Record<string, { bg: string; text: string; dot: string; pulse: boolean; pulseColor?: string }> = {
  PENDIENTE:  { bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]', dot: 'bg-[#9CA3AF]', pulse: false },
  EN_REVISION:{ bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', dot: 'bg-[#2563EB]', pulse: true,  pulseColor: 'bg-[#2563EB]' },
  APROBADO:   { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', dot: 'bg-[#16A34A]', pulse: false },
  RECHAZADO:  { bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]', dot: 'bg-[#DC2626]', pulse: false },
}

/* ESTADO ACTIVIDAD — para badges en header Detalle */
export const ESTADO_ACTIVIDAD_BADGE: Record<string, { bg: string; text: string; dot: string; pulse: boolean; pulseColor?: string }> = {
  PENDIENTE:  { bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]', dot: 'bg-[#9CA3AF]', pulse: false },
  EN_PROCESO: { bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', dot: 'bg-[#2563EB]', pulse: true,  pulseColor: 'bg-[#2563EB]' },
  COMPLETADA: { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', dot: 'bg-[#16A34A]', pulse: false },
  ATRASADA:   { bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]', dot: 'bg-[#DC2626]', pulse: true,  pulseColor: 'bg-[#DC2626]' },
  CANCELADA:  { bg: 'bg-[#E5E7EB]', text: 'text-[#374151]', dot: 'bg-[#6B7280]', pulse: false },
}

/* ─────────────────────────────────────────────
   TIPO EVIDENCIA — badges galería de evidencias
   ───────────────────────────────────────────── */
export const TIPO_EVIDENCIA_LABELS: Record<string, string> = {
  FOTOGRAFIA: 'Foto',
  DOCUMENTO: 'Documento',
  VIDEO: 'Video',
  ENLACE: 'Enlace',
  OTRO: 'Otro',
}

export const TIPO_EVIDENCIA_BADGE: Record<string, string> = {
  FOTOGRAFIA: 'bg-[#DBEAFE] text-[#1E3A8A]',
  DOCUMENTO:  'bg-[#E5E7EB] text-[#374151]',
  VIDEO:      'bg-[#FEE2E2] text-[#B91C1C]',
  ENLACE:     'bg-[#FEF3C7] text-[#92400E]',
  OTRO:       'bg-[#E5E7EB] text-[#374151]',
}

/* ─────────────────────────────────────────────
   TIPO INFORME — labels y badges de color
   ───────────────────────────────────────────── */
export const TIPO_INFORME_LABELS: Record<string, string> = {
  INICIAL: 'Inicial',
  PARCIAL: 'Parcial',
  FINAL: 'Final',
  TECNICO: 'Técnico',
  FINANCIERO: 'Financiero',
}

export const TIPO_INFORME_BADGE: Record<string, string> = {
  INICIAL:     'bg-[#DBEAFE] text-[#1E3A8A]',
  PARCIAL:     'bg-[#FEF3C7] text-[#92400E]',
  FINAL:       'bg-[#DCFCE7] text-[#15803D]',
  TECNICO:     'bg-[#EDE9FE] text-[#5B21B6]',
  FINANCIERO:  'bg-[#FCE7F3] text-[#9D174D]',
}

/* ─────────────────────────────────────────────
   ESTADO INFORME — para badges con pulse
   ───────────────────────────────────────────── */
export const ESTADO_INFORME_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En revisión',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
}

export const ESTADO_INFORME_BADGE: Record<string, { bg: string; text: string; dot: string; pulse: boolean; pulseColor?: string }> = {
  BORRADOR:    { bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]', dot: 'bg-[#9CA3AF]', pulse: false },
  EN_REVISION: { bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', dot: 'bg-[#2563EB]', pulse: true,  pulseColor: 'bg-[#2563EB]' },
  APROBADO:    { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', dot: 'bg-[#16A34A]', pulse: false },
  RECHAZADO:   { bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]', dot: 'bg-[#DC2626]', pulse: false },
}

/* ─────────────────────────────────────────────
   PRIORIDAD ALERTA — para íconos y estilos
   ───────────────────────────────────────────── */
export const PRIORIDAD_ALERTA_LABELS: Record<string, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
}

export const PRIORIDAD_ALERTA_STYLES: Record<string, { bg: string; text: string; ring: string; icon: string }> = {
  BAJA:     { bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', ring: 'ring-[#93C5FD]/50', icon: 'text-[#2563EB]' },
  MEDIA:    { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', ring: 'ring-[#FCD34D]/50', icon: 'text-[#D97706]' },
  ALTA:     { bg: 'bg-[#FED7AA]', text: 'text-[#9A3412]', ring: 'ring-[#FB923C]/50', icon: 'text-[#EA580C]' },
  URGENTE:  { bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]', ring: 'ring-[#FCA5A5]/50', icon: 'text-[#DC2626]' },
}

/* ─────────────────────────────────────────────
   ESTADO ALERTA — badges
   ───────────────────────────────────────────── */
export const ESTADO_ALERTA_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  LEIDA: 'Leída',
  ATENDIDA: 'Atendida',
  CANCELADA: 'Cancelada',
}

export const ESTADO_ALERTA_BADGE: Record<string, { bg: string; text: string; dot: string; pulse: boolean; pulseColor?: string }> = {
  PENDIENTE:  { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', dot: 'bg-[#EAB308]', pulse: true,  pulseColor: 'bg-[#EAB308]' },
  LEIDA:      { bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]', dot: 'bg-[#9CA3AF]', pulse: false },
  ATENDIDA:   { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', dot: 'bg-[#16A34A]', pulse: false },
  CANCELADA:  { bg: 'bg-[#374151]', text: 'text-white',     dot: 'bg-[#4B5563]', pulse: false },
}
