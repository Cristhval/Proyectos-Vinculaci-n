import authClient from './authClient'
import { API } from '@/config/api'
import type { ApiResult } from '@/types/auth'
import type { SolicitudAcceso } from '@/types/solicitudes'
import type { PaginatedResponse } from '@/types/common'
import { conCache, invalidaAlTerminar } from '@/lib/cachePeticiones'

export const solicitudesApi = {
  // El layout y el panel de administración piden el contador y la lista a la vez
  // (y en cada foco o cambio de ruta): se deduplican y se reutilizan unos segundos.
  pendientes: () => conCache('solicitudes:pendientes', () =>
    authClient.get<ApiResult<PaginatedResponse<SolicitudAcceso>>>(`${API.AUTH.SOLICITUDES}?estado=PENDIENTE`)),
  contador: () => conCache('solicitudes:contador', () =>
    authClient.get<ApiResult<{ pendientes: number }>>(API.AUTH.SOLICITUDES_CONTADOR)),
  aprobar: (id: number, rol: string) =>
    invalidaAlTerminar(authClient.post<ApiResult<SolicitudAcceso>>(API.AUTH.SOLICITUD_APROBAR(id), { rol }), 'solicitudes:'),
  rechazar: (id: number, motivo: string) =>
    invalidaAlTerminar(authClient.post<ApiResult<SolicitudAcceso>>(API.AUTH.SOLICITUD_RECHAZAR(id), { motivo }), 'solicitudes:'),
}
