export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/registro',
  UNAUTHORIZED: '/no-autorizado',

  // Legacy dashboard (redirects to role-specific)
  DASHBOARD: '/dashboard',

  // Role-specific dashboards
  ADMIN_DASHBOARD: '/admin/dashboard',
  COORDINADOR_DASHBOARD: '/coordinador/dashboard',
  DOCENTE_DASHBOARD: '/docente/dashboard',
  ESTUDIANTE_DASHBOARD: '/estudiante/dashboard',

  // Role-specific proyectos
  ADMIN_PROYECTOS: '/admin/proyectos',
  COORDINADOR_PROYECTOS: '/coordinador/proyectos',
  DOCENTE_PROYECTOS: '/docente/proyectos',
  ESTUDIANTE_PROYECTOS: '/estudiante/proyectos',

  // Shared modules
  CONVENIOS: '/convenios',
  CONVENIO_DETAIL: '/convenios/:id',
  CONVENIO_CREATE: '/convenios/nuevo',
  CONVENIO_EDIT: '/convenios/:id/editar',
  SEGUIMIENTO: '/seguimiento',
  REPORTES: '/reportes',
  USUARIOS: '/usuarios',
  USUARIO_DETAIL: '/usuarios/:id',
  AUDITORIA: '/auditoria',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]

export interface BreadcrumbItem {
  label: string
  path?: string
}

export const BREADCRUMBS: Record<string, BreadcrumbItem[]> = {
  [ROUTES.ADMIN_DASHBOARD]: [{ label: 'Panel de administración' }],
  [ROUTES.COORDINADOR_DASHBOARD]: [{ label: 'Panel de coordinación' }],
  [ROUTES.DOCENTE_DASHBOARD]: [{ label: 'Panel del docente' }],
  [ROUTES.ESTUDIANTE_DASHBOARD]: [{ label: 'Panel del estudiante' }],
  [ROUTES.ADMIN_PROYECTOS]: [{ label: 'Proyectos' }],
  [ROUTES.COORDINADOR_PROYECTOS]: [{ label: 'Proyectos' }],
  [ROUTES.DOCENTE_PROYECTOS]: [{ label: 'Proyectos' }],
  [ROUTES.ESTUDIANTE_PROYECTOS]: [{ label: 'Proyectos' }],
  [ROUTES.CONVENIOS]: [{ label: 'Convenios' }],
  [ROUTES.CONVENIO_CREATE]: [{ label: 'Convenios', path: ROUTES.CONVENIOS }, { label: 'Nuevo' }],
  [ROUTES.SEGUIMIENTO]: [{ label: 'Seguimiento' }],
  [ROUTES.REPORTES]: [{ label: 'Reportes' }],
  [ROUTES.USUARIOS]: [{ label: 'Usuarios' }],
  '/admin/usuarios': [{ label: 'Administración', path: ROUTES.ADMIN_DASHBOARD }, { label: 'Usuarios' }],
  [ROUTES.AUDITORIA]: [{ label: 'Auditoría' }],
}
