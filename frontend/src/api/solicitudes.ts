import authClient from './authClient'
import { API } from '@/config/api'
import type { ApiResult } from '@/types/auth'
import type { SolicitudAcceso } from '@/types/solicitudes'
import type { PaginatedResponse } from '@/types/common'

export const solicitudesApi = {
  pendientes: () => authClient.get<ApiResult<PaginatedResponse<SolicitudAcceso>>>(`${API.AUTH.SOLICITUDES}?estado=PENDIENTE`),
  contador: () => authClient.get<ApiResult<{ pendientes: number }>>(API.AUTH.SOLICITUDES_CONTADOR),
  aprobar: (id: number, rol: string) => authClient.post<ApiResult<SolicitudAcceso>>(API.AUTH.SOLICITUD_APROBAR(id), { rol }),
  rechazar: (id: number, motivo: string) => authClient.post<ApiResult<SolicitudAcceso>>(API.AUTH.SOLICITUD_RECHAZAR(id), { motivo }),
}
