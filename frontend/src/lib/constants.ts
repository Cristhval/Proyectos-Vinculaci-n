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
  BORRADOR: 'bg-[#F3F4F6] text-[#6B7280]',
  EN_REVISION: 'bg-[#DBEAFE] text-[#1D4ED8]',
  APROBADO: 'bg-[#DCFCE7] text-[#15803D]',
  EN_EJECUCION: 'bg-[#EDE9FE] text-[#6D28D9]',
  EN_SUSPENSION: 'bg-[#FEF3C7] text-[#B45309]',
  FINALIZADO: 'bg-[#D1FAE5] text-[#065F46]',
  CERRADO: 'bg-[#E2E8F0] text-[#475569]',
  CANCELADO: 'bg-[#FEE2E2] text-[#B91C1C]',
}

export const ESTADO_COLORS: Record<string, string> = {
  BORRADOR: 'bg-[#F3F4F6] text-[#6B7280]',
  EN_REVISION: 'bg-[#DBEAFE] text-[#1D4ED8]',
  APROBADO: 'bg-[#DCFCE7] text-[#15803D]',
  EN_EJECUCION: 'bg-[#EDE9FE] text-[#6D28D9]',
  VIGENTE: 'bg-[#DCFCE7] text-[#15803D]',
  EN_SUSPENSION: 'bg-[#FEF3C7] text-[#B45309]',
  SUSPENDIDO: 'bg-[#FEF3C7] text-[#B45309]',
  FINALIZADO: 'bg-[#D1FAE5] text-[#065F46]',
  CERRADO: 'bg-[#E2E8F0] text-[#475569]',
  CANCELADO: 'bg-[#FEE2E2] text-[#B91C1C]',
  VENCIDO: 'bg-[#FEE2E2] text-[#B91C1C]',
}

export const PRIORIDAD_COLORS: Record<string, string> = {
  BAJA: 'bg-gray-100 text-gray-500',
  MEDIA: 'bg-blue-50 text-blue-600',
  ALTA: 'bg-amber-50 text-amber-600',
  CRITICA: 'bg-red-50 text-red-600',
}
