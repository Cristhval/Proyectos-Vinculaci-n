export type NivelFormato = 'PREGRADO' | 'POSGRADO'

export type TipoFormato = 'GUIA' | 'FORMULACION' | 'AVANCE' | 'FINAL'

export interface Formato {
  id: number
  nombre: string
  nivel: NivelFormato
  tipo: TipoFormato
  descripcion: string
  archivo: string
  tamano_kb: number | null
  activo: boolean
  fecha_actualizacion: string
}
