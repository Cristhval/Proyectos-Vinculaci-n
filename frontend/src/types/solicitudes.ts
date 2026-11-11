import type { RolUsuario } from './usuarios'

export interface SolicitudAcceso {
  id: number
  nombres: string
  email: string
  documento_identidad: string
  rol_solicitado: RolUsuario
  motivo: string
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'
  creada: string
}
