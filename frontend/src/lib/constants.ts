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
  BORRADOR: 'bg-yellow-500 text-white',
  EN_REVISION: 'bg-amber-500 text-white',
  APROBADO: 'bg-green-600 text-white',
  EN_EJECUCION: 'bg-blue-600 text-white',
  EN_SUSPENSION: 'bg-orange-500 text-white',
  FINALIZADO: 'bg-emerald-700 text-white',
  CERRADO: 'bg-gray-500 text-white',
  CANCELADO: 'bg-red-600 text-white',
}

export const TIPO_PROYECTO_COLORS: Record<string, string> = {
  VINCULACION: 'bg-indigo-100 text-indigo-800',
  INVESTIGACION: 'bg-purple-100 text-purple-800',
  EXTENSION: 'bg-teal-100 text-teal-800',
  MIXTO: 'bg-sky-100 text-sky-800',
}

export const ESTADO_COLORS: Record<string, string> = {
  BORRADOR: 'bg-yellow-500 text-white',
  EN_REVISION: 'bg-amber-500 text-white',
  APROBADO: 'bg-green-600 text-white',
  EN_EJECUCION: 'bg-blue-600 text-white',
  VIGENTE: 'bg-green-600 text-white',
  EN_SUSPENSION: 'bg-orange-500 text-white',
  SUSPENDIDO: 'bg-orange-500 text-white',
  FINALIZADO: 'bg-emerald-700 text-white',
  CERRADO: 'bg-gray-500 text-white',
  CANCELADO: 'bg-red-600 text-white',
  VENCIDO: 'bg-red-600 text-white',
}

export const PRIORIDAD_COLORS: Record<string, string> = {
  BAJA: 'bg-green-500 text-white',
  MEDIA: 'bg-blue-500 text-white',
  ALTA: 'bg-amber-500 text-white',
  CRITICA: 'bg-red-600 text-white',
}
