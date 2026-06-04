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
