import client from './client'
import { API } from '@/config/api'
import type { ApiResponse } from '@/types/common'
import type {
  Dispositivo,
  EditarDispositivoDatos,
  RegistrarDispositivoDatos,
  RespuestaConToken,
} from '@/types/iot'

export const dispositivosApi = {
  /** Dispositivos del proyecto (incluye los dados de baja salvo que se filtre por `activo`). */
  listar: (proyectoId: number, params?: { activo?: 'true' | 'false' }) =>
    client.get<ApiResponse<Dispositivo[]>>(API.IOT.DISPOSITIVOS_PROYECTO(proyectoId), { params }),

  obtener: (id: number) =>
    client.get<ApiResponse<Dispositivo>>(API.IOT.DISPOSITIVO(id)),

  /** Devuelve el token en texto plano una sola vez. */
  registrar: (proyectoId: number, datos: RegistrarDispositivoDatos) =>
    client.post<ApiResponse<RespuestaConToken>>(API.IOT.DISPOSITIVOS_PROYECTO(proyectoId), datos),

  /** Solo nombre y descripción. */
  editar: (id: number, datos: EditarDispositivoDatos) =>
    client.patch<ApiResponse<Dispositivo>>(API.IOT.DISPOSITIVO(id), datos),

  darDeBaja: (id: number) =>
    client.post<ApiResponse<Dispositivo>>(API.IOT.BAJA(id), {}),

  /** Invalida el token anterior y devuelve el nuevo una sola vez. */
  regenerarToken: (id: number) =>
    client.post<ApiResponse<RespuestaConToken>>(API.IOT.REGENERAR_TOKEN(id), {}),
}

/** Mensaje del backend tal cual (`{success, message}`), o uno genérico si no llegó respuesta. */
export function mensajeDeError(err: unknown, porDefecto = 'No se pudo completar la operación.'): string {
  const data = (err as { response?: { data?: { message?: string; detail?: string } } })?.response?.data
  return data?.message || data?.detail || porDefecto
}
