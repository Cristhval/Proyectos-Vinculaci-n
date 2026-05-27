export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROYECTOS: '/proyectos',
  PROYECTO_DETAIL: '/proyectos/:id',
  PROYECTO_CREATE: '/proyectos/nuevo',
  PROYECTO_EDIT: '/proyectos/:id/editar',
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
  [ROUTES.DASHBOARD]: [{ label: 'Dashboard' }],
  [ROUTES.PROYECTOS]: [{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Proyectos' }],
  [ROUTES.PROYECTO_CREATE]: [{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Proyectos', path: ROUTES.PROYECTOS }, { label: 'Nuevo' }],
  [ROUTES.CONVENIOS]: [{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Convenios' }],
  [ROUTES.CONVENIO_CREATE]: [{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Convenios', path: ROUTES.CONVENIOS }, { label: 'Nuevo' }],
  [ROUTES.SEGUIMIENTO]: [{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Seguimiento' }],
  [ROUTES.REPORTES]: [{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Reportes' }],
  [ROUTES.USUARIOS]: [{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Usuarios' }],
  [ROUTES.AUDITORIA]: [{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Auditoria' }],
}
