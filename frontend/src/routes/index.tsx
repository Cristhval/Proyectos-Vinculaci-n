import { lazy, Suspense, type ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { useAuthStore } from '@/store/authStore'

// La landing va en el bundle inicial: es la primera pantalla de casi todas las visitas y
// cargarla diferida añadiría un viaje de red en serie antes del primer pintado.
import LandingPage from '@/features/landing/LandingPage'

// Pantallas de acceso: diferidas (incluyen el formulario de registro y reCAPTCHA).
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage'))
const RegistroSocialPage = lazy(() => import('@/features/auth/RegistroSocialPage'))
const UnauthorizedPage = lazy(() => import('@/features/auth/UnauthorizedPage'))
const AuthCallbackPage = lazy(() => import('@/features/auth/AuthCallbackPage'))
const RecuperarPage = lazy(() => import('@/features/auth/RecuperarPage'))
const RestablecerPage = lazy(() => import('@/features/auth/RestablecerPage'))

import DashboardRedirect from '@/features/dashboard/DashboardRedirect'

const AdminDashboard = lazy(() => import('@/features/dashboard/AdminDashboard'))
const PerfilPage = lazy(() => import('@/features/perfil/PerfilPage'))
const CoordinadorDashboard = lazy(() => import('@/features/dashboard/CoordinadorDashboard'))
const DocenteDashboard = lazy(() => import('@/features/dashboard/DocenteDashboard'))
const EstudianteDashboard = lazy(() => import('@/features/dashboard/EstudianteDashboard'))

const ProyectosListPage = lazy(() => import('@/features/proyectos/ProyectosListPage'))
const ProyectoFormPage = lazy(() => import('@/features/proyectos/ProyectoFormPage'))
const ProyectoDetailPage = lazy(() => import('@/features/proyectos/ProyectoDetailPage'))
const ActividadDetailPage = lazy(() => import('@/features/seguimiento/ActividadDetailPage'))
const ConveniosListPage = lazy(() => import('@/features/convenios/ConveniosListPage'))
const ConvenioFormPage = lazy(() => import('@/features/convenios/ConvenioFormPage'))
const ConvenioDetailPage = lazy(() => import('@/features/convenios/ConvenioDetailPage'))
const InstitucionesListPage = lazy(() => import('@/features/instituciones/InstitucionesListPage'))

const AlertasPage = lazy(() => import('@/features/seguimiento/AlertasPage'))
const ReportesPage = lazy(() => import('@/features/reportes/ReportesPage'))
const CoordinadorReportesPage = lazy(() => import('@/features/reportes/CoordinadorReportesPage'))
const DocenteReportesPage = lazy(() => import('@/features/reportes/DocenteReportesPage'))
const UsuariosListPage = lazy(() => import('@/features/usuarios/UsuariosListPage'))
const AuditoriaPage = lazy(() => import('@/features/auditoria/AuditoriaPage'))
const FormatosPage = lazy(() => import('@/features/formatos/FormatosPage'))

// El panel (encabezado, menú, notificaciones) no se descarga en la landing ni en el login.
const DashboardLayout = lazy(() => import('@/layouts/DashboardLayout'))
import { Spinner } from '@/components/ui'

/** Mientras llega el chunk de una pantalla completa (acceso o el panel). */
function PantallaCargando() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Cargando">
      <Spinner size="lg" />
    </div>
  )
}

function PageSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

function ProyectoCreateGuard({ children }: { children: ReactNode }) {
  const rol = useAuthStore.getState().user?.rol
  if (rol !== 'ADMIN' && rol !== 'DOCENTE') {
    return <Navigate to="/no-autorizado" replace />
  }
  return <>{children}</>
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PantallaCargando />}>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/registro/social" element={<RegistroSocialPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/recuperar" element={<RecuperarPage />} />
      <Route path="/restablecer" element={<RestablecerPage />} />
      <Route path="/no-autorizado" element={<UnauthorizedPage />} />

      {/* Protected routes with DashboardLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Legacy /dashboard → redirect by role */}
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Legacy shared modules (any authenticated role except ESTUDIANTE) */}
          <Route path="/convenios" element={<PageSuspense><ConveniosListPage /></PageSuspense>} />
          <Route path="/reportes" element={<PageSuspense><ReportesPage /></PageSuspense>} />
        </Route>
      </Route>

      {/* Proyectos - accessible by all authenticated roles with role-based paths */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE', 'DIRECTIVO']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/perfil" element={<PageSuspense><PerfilPage /></PageSuspense>} />
          <Route path="/:rol/proyectos" element={<PageSuspense><ProyectosListPage /></PageSuspense>} />
          <Route path="/:rol/proyectos/nuevo" element={<ProyectoCreateGuard><PageSuspense><ProyectoFormPage /></PageSuspense></ProyectoCreateGuard>} />
          <Route path="/:rol/proyectos/:id" element={<PageSuspense><ProyectoDetailPage /></PageSuspense>} />
          <Route path="/:rol/proyectos/:id/editar" element={<PageSuspense><ProyectoFormPage /></PageSuspense>} />
          <Route path="/:rol/proyectos/:id/actividades/:actividadId" element={<PageSuspense><ActividadDetailPage /></PageSuspense>} />

          {/* Alertas - accessible by role */}
          <Route path="/admin/alertas" element={<PageSuspense><AlertasPage /></PageSuspense>} />
          <Route path="/coordinador/alertas" element={<PageSuspense><AlertasPage /></PageSuspense>} />
          <Route path="/docente/alertas" element={<PageSuspense><AlertasPage /></PageSuspense>} />
          <Route path="/estudiante/alertas" element={<PageSuspense><AlertasPage /></PageSuspense>} />

          {/* Formatos - accessible by all roles */}
          <Route path="/admin/formatos" element={<PageSuspense><FormatosPage /></PageSuspense>} />
          <Route path="/coordinador/formatos" element={<PageSuspense><FormatosPage /></PageSuspense>} />
          <Route path="/docente/formatos" element={<PageSuspense><FormatosPage /></PageSuspense>} />
          <Route path="/estudiante/formatos" element={<PageSuspense><FormatosPage /></PageSuspense>} />
        </Route>
      </Route>

      {/* Convenios - accessible by all authenticated roles with role-based paths */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE', 'DIRECTIVO']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/convenios" element={<PageSuspense><ConveniosListPage /></PageSuspense>} />
          <Route path="/coordinador/convenios" element={<PageSuspense><ConveniosListPage /></PageSuspense>} />
          <Route path="/docente/convenios" element={<PageSuspense><ConveniosListPage /></PageSuspense>} />
          <Route path="/estudiante/convenios" element={<PageSuspense><ConveniosListPage /></PageSuspense>} />

          {/* Detalle / crear / editar convenio */}
          <Route path="/admin/convenios/nuevo" element={<PageSuspense><ConvenioFormPage /></PageSuspense>} />
          <Route path="/coordinador/convenios/nuevo" element={<PageSuspense><ConvenioFormPage /></PageSuspense>} />
          <Route path="/admin/convenios/:id" element={<PageSuspense><ConvenioDetailPage /></PageSuspense>} />
          <Route path="/coordinador/convenios/:id" element={<PageSuspense><ConvenioDetailPage /></PageSuspense>} />
          <Route path="/docente/convenios/:id" element={<PageSuspense><ConvenioDetailPage /></PageSuspense>} />
          <Route path="/estudiante/convenios/:id" element={<PageSuspense><ConvenioDetailPage /></PageSuspense>} />
          <Route path="/admin/convenios/:id/editar" element={<PageSuspense><ConvenioFormPage /></PageSuspense>} />
          <Route path="/coordinador/convenios/:id/editar" element={<PageSuspense><ConvenioFormPage /></PageSuspense>} />
        </Route>
      </Route>

      {/* Admin only */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<PageSuspense><AdminDashboard /></PageSuspense>} />
          <Route path="/admin/usuarios" element={<PageSuspense><UsuariosListPage /></PageSuspense>} />
          <Route path="/admin/instituciones" element={<PageSuspense><InstitucionesListPage /></PageSuspense>} />
          <Route path="/admin/reportes" element={<PageSuspense><ReportesPage /></PageSuspense>} />
          <Route path="/usuarios" element={<PageSuspense><UsuariosListPage /></PageSuspense>} />
          <Route path="/admin/auditoria" element={<PageSuspense><AuditoriaPage /></PageSuspense>} />
        </Route>
      </Route>

      {/* Coordinador and above */}
      <Route element={<ProtectedRoute allowedRoles={['COORDINADOR', 'DIRECTIVO', 'ADMIN']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/coordinador/dashboard" element={<PageSuspense><CoordinadorDashboard /></PageSuspense>} />
          <Route path="/coordinador/reportes" element={<PageSuspense><CoordinadorReportesPage /></PageSuspense>} />
        </Route>
      </Route>

      {/* Docente and above */}
      <Route element={<ProtectedRoute allowedRoles={['DOCENTE', 'ADMIN']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/docente/dashboard" element={<PageSuspense><DocenteDashboard /></PageSuspense>} />
          <Route path="/docente/reportes" element={<PageSuspense><DocenteReportesPage /></PageSuspense>} />
        </Route>
      </Route>

      {/* Estudiante and above (all authenticated roles) */}
      <Route element={<ProtectedRoute allowedRoles={['ESTUDIANTE', 'DOCENTE', 'COORDINADOR', 'ADMIN', 'DIRECTIVO']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/estudiante/dashboard" element={<PageSuspense><EstudianteDashboard /></PageSuspense>} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )
}
