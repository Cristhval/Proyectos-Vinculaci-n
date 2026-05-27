export type RolUsuario = 'ADMIN' | 'COORDINADOR' | 'DOCENTE' | 'ESTUDIANTE' | 'DIRECTIVO'

export interface Carrera {
  id: number
  codigo: string
  nombre: string
  facultad: string
  descripcion: string
  activa: boolean
  creado_en: string
  actualizado_en: string
}

export interface Usuario {
  id: number
  user: {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
  }
  codigo: string
  documento_identidad: string | null
  carrera: Carrera | null
  rol: RolUsuario
  telefono: string
  direccion: string
  fecha_nacimiento: string | null
  biografia: string
  activo: boolean
  creado_en: string
  actualizado_en: string
}
