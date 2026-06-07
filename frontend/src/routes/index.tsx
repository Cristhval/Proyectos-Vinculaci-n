import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

import LandingPage from '@/features/landing/LandingPage'
import LoginPage from '@/features/auth/LoginPage'
import RegisterPage from '@/features/auth/RegisterPage'
import UnauthorizedPage from '@/features/auth/UnauthorizedPage'

import DashboardRedirect from '@/features/dashboard/DashboardRedirect'
import AdminDashboard from '@/features/dashboard/AdminDashboard'
import CoordinadorDashboard from '@/features/dashboard/CoordinadorDashboard'
import DocenteDashboard from '@/features/dashboard/DocenteDashboard'
import EstudianteDashboard from '@/features/dashboard/EstudianteDashboard'

import ProyectosListPage from '@/features/proyectos/ProyectosListPage'
import ProyectoFormPage from '@/features/proyectos/ProyectoFormPage'
import ProyectoDetailPage from '@/features/proyectos/ProyectoDetailPage'
import ConveniosListPage from '@/features/convenios/ConveniosListPage'
import ConvenioFormPage from '@/features/convenios/ConvenioFormPage'
import ConvenioDetailPage from '@/features/convenios/ConvenioDetailPage'
import InstitucionesListPage from '@/features/instituciones/InstitucionesListPage'
import SeguimientoPage from '@/features/seguimiento/SeguimientoPage'
import ReportesPage from '@/features/reportes/ReportesPage'
import UsuariosListPage from '@/features/usuarios/UsuariosListPage'
import AuditoriaPage from '@/features/auditoria/AuditoriaPage'

import DashboardLayout from '@/layouts/DashboardLayout'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/no-autorizado" element={<UnauthorizedPage />} />

      {/* Protected routes with DashboardLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Legacy /dashboard → redirect by role */}
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Legacy shared modules (any authenticated role) */}
          <Route path="/convenios" element={<ConveniosListPage />} />
          <Route path="/seguimiento" element={<SeguimientoPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
        </Route>
      </Route>

      {/* Proyectos - accessible by all authenticated roles with role-based paths */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE', 'DIRECTIVO']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/:rol/proyectos" element={<ProyectosListPage />} />
          <Route path="/:rol/proyectos/nuevo" element={<ProyectoFormPage />} />
          <Route path="/:rol/proyectos/:id" element={<ProyectoDetailPage />} />
          <Route path="/:rol/proyectos/:id/editar" element={<ProyectoFormPage />} />
        </Route>
      </Route>

      {/* Convenios - accessible by all authenticated roles with role-based paths */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE', 'DIRECTIVO']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/convenios" element={<ConveniosListPage />} />
          <Route path="/coordinador/convenios" element={<ConveniosListPage />} />
          <Route path="/docente/convenios" element={<ConveniosListPage />} />
          <Route path="/estudiante/convenios" element={<ConveniosListPage />} />

          {/* Detalle / crear / editar convenio */}
          <Route path="/admin/convenios/nuevo" element={<ConvenioFormPage />} />
          <Route path="/coordinador/convenios/nuevo" element={<ConvenioFormPage />} />
          <Route path="/admin/convenios/:id" element={<ConvenioDetailPage />} />
          <Route path="/coordinador/convenios/:id" element={<ConvenioDetailPage />} />
          <Route path="/docente/convenios/:id" element={<ConvenioDetailPage />} />
          <Route path="/estudiante/convenios/:id" element={<ConvenioDetailPage />} />
          <Route path="/admin/convenios/:id/editar" element={<ConvenioFormPage />} />
          <Route path="/coordinador/convenios/:id/editar" element={<ConvenioFormPage />} />
        </Route>
      </Route>

      {/* Admin only */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/usuarios" element={<UsuariosListPage />} />
          <Route path="/admin/instituciones" element={<InstitucionesListPage />} />
          <Route path="/usuarios" element={<UsuariosListPage />} />
          <Route path="/auditoria" element={<AuditoriaPage />} />
        </Route>
      </Route>

      {/* Coordinador and above */}
      <Route element={<ProtectedRoute allowedRoles={['COORDINADOR', 'ADMIN']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/coordinador/dashboard" element={<CoordinadorDashboard />} />
        </Route>
      </Route>

      {/* Docente and above */}
      <Route element={<ProtectedRoute allowedRoles={['DOCENTE', 'ADMIN']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/docente/dashboard" element={<DocenteDashboard />} />
        </Route>
      </Route>

      {/* Estudiante and above (all authenticated roles) */}
      <Route element={<ProtectedRoute allowedRoles={['ESTUDIANTE', 'DOCENTE', 'COORDINADOR', 'ADMIN', 'DIRECTIVO']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/estudiante/dashboard" element={<EstudianteDashboard />} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
