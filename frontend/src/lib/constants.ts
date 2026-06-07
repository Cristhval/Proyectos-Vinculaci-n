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
  DOCENTE:     { bg: 'bg-orange-50',  text: 'text-orange-700',   ring: 'ring-orange-200/70', iconBg: 'bg-orange-100 text-orange-700' },
  ESTUDIANTE:  { bg: 'bg-sky-50',     text: 'text-sky-700',      ring: 'ring-sky-200/70',    iconBg: 'bg-sky-100 text-sky-700' },
  DIRECTIVO:   { bg: 'bg-amber-50',   text: 'text-amber-700',    ring: 'ring-amber-200/70',  iconBg: 'bg-amber-100 text-amber-700' },
}

/* Avatar gradientes (sofisticados, no planos) */
export const ROL_AVATAR_STYLES: Record<string, string> = {
  ADMIN:       'bg-gradient-to-br from-slate-800 to-black text-white',
  COORDINADOR: 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-950',
  DOCENTE:     'bg-gradient-to-br from-orange-500 to-orange-700 text-white',
  ESTUDIANTE:  'bg-gradient-to-br from-sky-500 to-sky-700 text-white',
  DIRECTIVO:   'bg-gradient-to-br from-amber-500 to-amber-700 text-white',
}
