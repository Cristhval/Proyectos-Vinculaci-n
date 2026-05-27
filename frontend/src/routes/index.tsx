import { Routes, Route, Navigate } from 'react-router-dom'
import AuthLayout from '@/layouts/AuthLayout'
import DashboardLayout from '@/layouts/DashboardLayout'
import ProtectedRoute from './ProtectedRoute'

import LoginPage from '@/features/auth/LoginPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import ProyectosListPage from '@/features/proyectos/ProyectosListPage'
import ConveniosListPage from '@/features/convenios/ConveniosListPage'
import SeguimientoPage from '@/features/seguimiento/SeguimientoPage'
import ReportesPage from '@/features/reportes/ReportesPage'
import AuditoriaPage from '@/features/auditoria/AuditoriaPage'
import UsuariosListPage from '@/features/usuarios/UsuariosListPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/proyectos" element={<ProyectosListPage />} />
          <Route path="/convenios" element={<ConveniosListPage />} />
          <Route path="/seguimiento" element={<SeguimientoPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/auditoria" element={<AuditoriaPage />} />
          <Route path="/usuarios" element={<UsuariosListPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
