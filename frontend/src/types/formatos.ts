export type NivelFormato = 'PREGRADO' | 'POSGRADO'
export type TipoFormato = 'GUIA' | 'FORMULACION' | 'AVANCE' | 'FINAL'

export interface FormatoInstitucional {
  id: number
  nombre: string
  nivel: NivelFormato
  nivel_display: string
  tipo: TipoFormato
  tipo_display: string
  descripcion: string
  archivo: string
  archivo_url: string | null
  tamano_kb: string
  activo: boolean
  creado_en: string
  actualizado_en: string
}
