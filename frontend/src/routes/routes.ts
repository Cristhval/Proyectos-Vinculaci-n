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

  // Detalle de actividad dentro de proyecto (avances)
  ADMIN_ACTIVIDAD_DETAIL: '/admin/proyectos/:id/actividades/:actividadId',
  COORDINADOR_ACTIVIDAD_DETAIL: '/coordinador/proyectos/:id/actividades/:actividadId',
  DOCENTE_ACTIVIDAD_DETAIL: '/docente/proyectos/:id/actividades/:actividadId',
  ESTUDIANTE_ACTIVIDAD_DETAIL: '/estudiante/proyectos/:id/actividades/:actividadId',

  // Role-specific alertas
  ADMIN_ALERTAS: '/admin/alertas',
  COORDINADOR_ALERTAS: '/coordinador/alertas',
  DOCENTE_ALERTAS: '/docente/alertas',
  ESTUDIANTE_ALERTAS: '/estudiante/alertas',

  // Role-specific convenios
  ADMIN_CONVENIOS: '/admin/convenios',
  COORDINADOR_CONVENIOS: '/coordinador/convenios',
  DOCENTE_CONVENIOS: '/docente/convenios',
  ESTUDIANTE_CONVENIOS: '/estudiante/convenios',

  // Role-specific convenios create / detail / edit
  ADMIN_CONVENIO_CREATE: '/admin/convenios/nuevo',
  COORDINADOR_CONVENIO_CREATE: '/coordinador/convenios/nuevo',
  DOCENTE_CONVENIO_CREATE: '/docente/convenios/nuevo',
  ESTUDIANTE_CONVENIO_CREATE: '/estudiante/convenios/nuevo',
  ADMIN_CONVENIO_DETAIL: '/admin/convenios/:id',
  COORDINADOR_CONVENIO_DETAIL: '/coordinador/convenios/:id',
  DOCENTE_CONVENIO_DETAIL: '/docente/convenios/:id',
  ESTUDIANTE_CONVENIO_DETAIL: '/estudiante/convenios/:id',
  ADMIN_CONVENIO_EDIT: '/admin/convenios/:id/editar',
  COORDINADOR_CONVENIO_EDIT: '/coordinador/convenios/:id/editar',

  // Legacy shared modules
  CONVENIOS: '/convenios',
  CONVENIO_DETAIL: '/convenios/:id',
  CONVENIO_CREATE: '/convenios/nuevo',
  CONVENIO_EDIT: '/convenios/:id/editar',

  // Instituciones (admin)
  ADMIN_INSTITUCIONES: '/admin/instituciones',
  INSTITUCION_DETAIL: '/admin/instituciones/:id',

  // Role-specific reportes
  ADMIN_REPORTES: '/admin/reportes',
  COORDINADOR_REPORTES: '/coordinador/reportes',

  // Shared modules
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
  [ROUTES.ADMIN_ACTIVIDAD_DETAIL]: [{ label: 'Proyectos', path: ROUTES.ADMIN_PROYECTOS }, { label: 'Detalle de actividad' }],
  [ROUTES.COORDINADOR_ACTIVIDAD_DETAIL]: [{ label: 'Proyectos', path: ROUTES.COORDINADOR_PROYECTOS }, { label: 'Detalle de actividad' }],
  [ROUTES.DOCENTE_ACTIVIDAD_DETAIL]: [{ label: 'Proyectos', path: ROUTES.DOCENTE_PROYECTOS }, { label: 'Detalle de actividad' }],
  [ROUTES.ESTUDIANTE_ACTIVIDAD_DETAIL]: [{ label: 'Proyectos', path: ROUTES.ESTUDIANTE_PROYECTOS }, { label: 'Detalle de actividad' }],
  [ROUTES.ADMIN_ALERTAS]: [{ label: 'Alertas' }],
  [ROUTES.COORDINADOR_ALERTAS]: [{ label: 'Alertas' }],
  [ROUTES.DOCENTE_ALERTAS]: [{ label: 'Alertas' }],
  [ROUTES.ESTUDIANTE_ALERTAS]: [{ label: 'Alertas' }],
  [ROUTES.ADMIN_CONVENIOS]: [{ label: 'Convenios' }],
  [ROUTES.COORDINADOR_CONVENIOS]: [{ label: 'Convenios' }],
  [ROUTES.DOCENTE_CONVENIOS]: [{ label: 'Convenios' }],
  [ROUTES.ESTUDIANTE_CONVENIOS]: [{ label: 'Convenios' }],
  [ROUTES.CONVENIOS]: [{ label: 'Convenios' }],
  [ROUTES.CONVENIO_CREATE]: [{ label: 'Convenios', path: ROUTES.CONVENIOS }, { label: 'Nuevo' }],
  [ROUTES.ADMIN_CONVENIO_CREATE]: [{ label: 'Convenios', path: ROUTES.ADMIN_CONVENIOS }, { label: 'Nuevo' }],
  [ROUTES.COORDINADOR_CONVENIO_CREATE]: [{ label: 'Convenios', path: ROUTES.COORDINADOR_CONVENIOS }, { label: 'Nuevo' }],
  [ROUTES.ADMIN_INSTITUCIONES]: [{ label: 'Administración', path: ROUTES.ADMIN_DASHBOARD }, { label: 'Instituciones' }],
  [ROUTES.SEGUIMIENTO]: [{ label: 'Seguimiento' }],
  [ROUTES.REPORTES]: [{ label: 'Reportes' }],
  [ROUTES.ADMIN_REPORTES]: [{ label: 'Reportes y Estadísticas' }],
  [ROUTES.COORDINADOR_REPORTES]: [{ label: 'Reportes y Estadísticas' }],
  [ROUTES.USUARIOS]: [{ label: 'Usuarios' }],
  '/admin/usuarios': [{ label: 'Administración', path: ROUTES.ADMIN_DASHBOARD }, { label: 'Usuarios' }],
  [ROUTES.AUDITORIA]: [{ label: 'Auditoría' }],
}
