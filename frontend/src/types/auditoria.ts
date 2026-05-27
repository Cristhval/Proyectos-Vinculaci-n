export type TipoAccion = 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR' | 'APROBAR' | 'RECHAZAR' | 'INICIAR_SESION'

export interface Auditoria {
  id: number
  usuario: number | null
  usuario_nombre?: string
  accion: TipoAccion
  entidad: string
  entidad_id: number | null
  detalle: Record<string, unknown>
  ip_address: string | null
  creado_en: string
  actualizado_en: string
}
