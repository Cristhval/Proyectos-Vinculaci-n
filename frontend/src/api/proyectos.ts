import client from './client'
import type { Proyecto, Objetivo, Indicador, Actividad, ParticipanteProyecto, Presupuesto, Beneficiario, AlineacionEstrategica, FirmaResponsabilidad } from '@/types/proyectos'
import type { PaginatedResponse } from '@/types/common'

export const proyectosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Proyecto>>('/proyectos/', { params }),

  get: (id: number) =>
    client.get<Proyecto>(`/proyectos/${id}/`),

  create: (data: Partial<Proyecto>) =>
    client.post('/proyectos/', data),

  update: (id: number, data: Partial<Proyecto>) =>
    client.patch(`/proyectos/${id}/`, data),

  delete: (id: number) =>
    client.delete(`/proyectos/${id}/`),

  // Workflow actions
  enviarRevision: (id: number) =>
    client.post(`/proyectos/${id}/enviar-revision/`),

  aprobar: (id: number) =>
    client.post(`/proyectos/${id}/aprobar/`),

  rechazar: (id: number) =>
    client.post(`/proyectos/${id}/rechazar/`),

  iniciarEjecucion: (id: number) =>
    client.post(`/proyectos/${id}/iniciar-ejecucion/`),

  suspender: (id: number) =>
    client.post(`/proyectos/${id}/suspender/`),

  reanudar: (id: number) =>
    client.post(`/proyectos/${id}/reanudar/`),

  finalizar: (id: number) =>
    client.post(`/proyectos/${id}/finalizar/`),

  cerrar: (id: number) =>
    client.post(`/proyectos/${id}/cerrar/`),

  cancelar: (id: number) =>
    client.post(`/proyectos/${id}/cancelar/`),
}

export const objetivosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Objetivo>>('/objetivos/', { params }),
  create: (data: Partial<Objetivo>) => client.post('/objetivos/', data),
  update: (id: number, data: Partial<Objetivo>) => client.patch(`/objetivos/${id}/`, data),
  delete: (id: number) => client.delete(`/objetivos/${id}/`),
}

export const indicadoresApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Indicador>>('/indicadores/', { params }),
  create: (data: Partial<Indicador>) => client.post('/indicadores/', data),
  update: (id: number, data: Partial<Indicador>) => client.patch(`/indicadores/${id}/`, data),
  delete: (id: number) => client.delete(`/indicadores/${id}/`),
  medir: (id: number, valor: number) => client.post(`/indicadores/${id}/medir/`, { valor }),
}

export const actividadesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Actividad>>('/actividades/', { params }),
  create: (data: Partial<Actividad>) => client.post('/actividades/', data),
  update: (id: number, data: Partial<Actividad>) => client.patch(`/actividades/${id}/`, data),
  delete: (id: number) => client.delete(`/actividades/${id}/`),
}

export const participantesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<ParticipanteProyecto>>('/participantes/', { params }),
  create: (data: Partial<ParticipanteProyecto>) => client.post('/participantes/', data),
  update: (id: number, data: Partial<ParticipanteProyecto>) => client.patch(`/participantes/${id}/`, data),
  delete: (id: number) => client.delete(`/participantes/${id}/`),
}

export const presupuestosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Presupuesto>>('/presupuestos/', { params }),
  create: (data: Partial<Presupuesto>) => client.post('/presupuestos/', data),
  update: (id: number, data: Partial<Presupuesto>) => client.patch(`/presupuestos/${id}/`, data),
}

export const beneficiariosApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<Beneficiario>>('/beneficiarios/', { params }),
  create: (data: Partial<Beneficiario>) => client.post('/beneficiarios/', data),
  update: (id: number, data: Partial<Beneficiario>) => client.patch(`/beneficiarios/${id}/`, data),
  delete: (id: number) => client.delete(`/beneficiarios/${id}/`),
}

export const alineacionesApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<AlineacionEstrategica>>('/alineaciones/', { params }),
  create: (data: Partial<AlineacionEstrategica>) => client.post('/alineaciones/', data),
  update: (id: number, data: Partial<AlineacionEstrategica>) => client.patch(`/alineaciones/${id}/`, data),
  delete: (id: number) => client.delete(`/alineaciones/${id}/`),
}

export const firmasApi = {
  list: (params?: Record<string, string>) =>
    client.get<PaginatedResponse<FirmaResponsabilidad>>('/firmas/', { params }),
  create: (data: Partial<FirmaResponsabilidad>) => client.post('/firmas/', data),
  delete: (id: number) => client.delete(`/firmas/${id}/`),
}
