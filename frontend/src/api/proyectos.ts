import client from './client'
import { API } from '@/config/api'
import type { Proyecto, Objetivo, Indicador, Actividad, ParticipanteProyecto, Presupuesto, Beneficiario, AlineacionEstrategica, FirmaResponsabilidad, Anexo, MarcoLogicoFila } from '@/types/proyectos'
import type { PaginatedResponse } from '@/types/common'

export const proyectosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Proyecto>>(API.PROYECTOS.LIST, { params }),

  get: (id: number) =>
    client.get<Proyecto>(API.PROYECTOS.DETAIL(id)),

  create: (data: Partial<Proyecto>) =>
    client.post(API.PROYECTOS.LIST, data),

  createWithFormData: (formData: FormData) =>
    client.post(API.PROYECTOS.LIST, formData),

  update: (id: number, data: Partial<Proyecto>) =>
    client.patch(API.PROYECTOS.DETAIL(id), data),

  updateWithFormData: (id: number, formData: FormData) =>
    client.patch(API.PROYECTOS.DETAIL(id), formData),

  delete: (id: number) =>
    client.delete(API.PROYECTOS.DETAIL(id)),

  enviarRevision: (id: number) =>
    client.post(API.PROYECTOS.ENVIAR_REVISION(id), {}),

  aprobar: (id: number) =>
    client.post(API.PROYECTOS.APROBAR(id), {}),

  rechazar: (id: number, data?: { motivo?: string }) =>
    client.post(API.PROYECTOS.RECHAZAR(id), data),

  iniciarEjecucion: (id: number) =>
    client.post(API.PROYECTOS.INICIAR_EJECUCION(id), {}),

  suspender: (id: number) =>
    client.post(API.PROYECTOS.SUSPENDER(id), {}),

  reanudar: (id: number) =>
    client.post(API.PROYECTOS.REANUDAR(id), {}),

  finalizar: (id: number) =>
    client.post(API.PROYECTOS.FINALIZAR(id), {}),

  cerrar: (id: number) =>
    client.post(API.PROYECTOS.CERRAR(id), {}),

  cancelar: (id: number) =>
    client.post(API.PROYECTOS.CANCELAR(id), {}),
}

export const objetivosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Objetivo>>(API.PROYECTOS.OBJETIVOS, { params }),
  create: (data: Partial<Objetivo>) => client.post(API.PROYECTOS.OBJETIVOS, data),
  update: (id: number, data: Partial<Objetivo>) => client.patch(`/objetivos/${id}/`, data),
  delete: (id: number) => client.delete(`/objetivos/${id}/`),
}

export const indicadoresApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Indicador>>(API.PROYECTOS.INDICADORES, { params }),
  create: (data: Partial<Indicador>) => client.post(API.PROYECTOS.INDICADORES, data),
  update: (id: number, data: Partial<Indicador>) => client.patch(`/indicadores/${id}/`, data),
  delete: (id: number) => client.delete(`/indicadores/${id}/`),
  medir: (id: number, valor: number) => client.post(`/indicadores/${id}/medir/`, { valor }),
}

export const actividadesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Actividad>>(API.PROYECTOS.ACTIVIDADES, { params }),
  create: (data: Partial<Actividad>) => client.post(API.PROYECTOS.ACTIVIDADES, data),
  update: (id: number, data: Partial<Actividad>) => client.patch(`/actividades/${id}/`, data),
  delete: (id: number) => client.delete(`/actividades/${id}/`),
}

export const participantesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<ParticipanteProyecto>>(API.PROYECTOS.PARTICIPANTES, { params }),
  create: (data: Partial<ParticipanteProyecto>) => client.post(API.PROYECTOS.PARTICIPANTES, data),
  update: (id: number, data: Partial<ParticipanteProyecto>) => client.patch(`/participantes/${id}/`, data),
  delete: (id: number) => client.delete(`/participantes/${id}/`),
}

export const presupuestosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Presupuesto>>(API.PROYECTOS.PRESUPUESTOS, { params }),
  create: (data: Partial<Presupuesto>) => client.post(API.PROYECTOS.PRESUPUESTOS, data),
  update: (id: number, data: Partial<Presupuesto>) => client.patch(`/presupuestos/${id}/`, data),
}

export const beneficiariosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Beneficiario>>(API.PROYECTOS.BENEFICIARIOS, { params }),
  create: (data: Partial<Beneficiario>) => client.post(API.PROYECTOS.BENEFICIARIOS, data),
  update: (id: number, data: Partial<Beneficiario>) => client.patch(`/beneficiarios/${id}/`, data),
  delete: (id: number) => client.delete(`/beneficiarios/${id}/`),
}

export const alineacionesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<AlineacionEstrategica>>(API.PROYECTOS.ALINEACIONES, { params }),
  create: (data: Partial<AlineacionEstrategica>) => client.post(API.PROYECTOS.ALINEACIONES, data),
  update: (id: number, data: Partial<AlineacionEstrategica>) => client.patch(`/alineaciones/${id}/`, data),
  delete: (id: number) => client.delete(`/alineaciones/${id}/`),
}

export const firmasApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<FirmaResponsabilidad>>(API.PROYECTOS.FIRMAS, { params }),
  create: (data: Partial<FirmaResponsabilidad>) => client.post(API.PROYECTOS.FIRMAS, data),
  delete: (id: number) => client.delete(`/firmas/${id}/`),
}

export const anexosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Anexo>>(API.PROYECTOS.ANEXOS, { params }),
  create: (formData: FormData) => client.post(API.PROYECTOS.ANEXOS, formData),
  delete: (id: number) => client.delete(`/anexos/${id}/`),
}

export interface AuditoriaRegistro {
  id: number
  usuario: number | null
  usuario_nombre: string
  accion: string
  entidad: string
  entidad_id: number
  detalle: Record<string, unknown>
  ip_address: string | null
  creado_en: string
}

export const marcoLogicoApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<MarcoLogicoFila>>(API.PROYECTOS.MARCO_LOGICO, { params }),
  create: (data: Partial<MarcoLogicoFila>) => client.post(API.PROYECTOS.MARCO_LOGICO, data),
  update: (id: number, data: Partial<MarcoLogicoFila>) => client.patch(`/marco-logico/${id}/`, data),
}

export const auditoriaApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<AuditoriaRegistro>>(API.AUDITORIA.LIST, { params }),
}
