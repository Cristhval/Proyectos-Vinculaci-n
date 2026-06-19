export type TipoAccion = 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR' | 'APROBAR' | 'RECHAZAR' | 'INICIAR_SESION'

export interface Auditoria {
  id: number
  usuario: number | null
  usuario_nombre?: string
  usuario_rol?: string | null
  accion: TipoAccion
  entidad: string
  entidad_id: number | null
  detalle: Record<string, unknown>
  ip_address: string | null
  creado_en: string
  actualizado_en: string
}
