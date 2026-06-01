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
import ConveniosListPage from '@/features/convenios/ConveniosListPage'
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

          {/* Shared modules (any authenticated role) */}
          <Route path="/proyectos" element={<ProyectosListPage />} />
          <Route path="/convenios" element={<ConveniosListPage />} />
          <Route path="/seguimiento" element={<SeguimientoPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
        </Route>
      </Route>

      {/* Admin only */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
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
