import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { ROL_LABELS } from '@/lib/constants'
import { Bienvenida, PanelIndicadores, type Indicador } from '@/components/panel/Indicadores'
import { FolderKanban, Handshake, Users, AlertTriangle } from 'lucide-react'
import { proyectosApi } from '@/api/proyectos'
import { conveniosApi } from '@/api/convenios'
import { usuariosApi } from '@/api/usuarios'
import { reportesApi } from '@/api/reportes'

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user)
  const nombre = user ? `${user.user_first_name} ${user.user_last_name}`.trim() || user.user_username : 'Administrador'

  const [totalProyectos, setTotalProyectos] = useState<number | null>(null)
  const [totalConvenios, setTotalConvenios] = useState<number | null>(null)
  const [totalUsuarios, setTotalUsuarios] = useState<number | null>(null)
  const [alertasPendientes, setAlertasPendientes] = useState<number | null>(null)

  useEffect(() => {
    Promise.allSettled([
      proyectosApi.list({ page_size: '1' }).then(r => setTotalProyectos(r.data.count)),
      conveniosApi.list({ page_size: '1' }).then(r => setTotalConvenios(r.data.count)),
      usuariosApi.list({ page_size: '1' }).then(r => setTotalUsuarios(r.data.count)),
      reportesApi.dashboard().then(r => setAlertasPendientes(r.data.data.resumen.alertas_pendientes)),
    ])
  }, [])

  const indicadores: Indicador[] = [
    { etiqueta: 'Total de proyectos', valor: totalProyectos, icono: FolderKanban, ruta: '/admin/proyectos' },
    { etiqueta: 'Total de convenios', valor: totalConvenios, icono: Handshake, ruta: '/admin/convenios' },
    { etiqueta: 'Usuarios registrados', valor: totalUsuarios, icono: Users, ruta: '/admin/usuarios' },
    { etiqueta: 'Alertas pendientes', valor: alertasPendientes, icono: AlertTriangle, ruta: '/admin/alertas' },
  ]

  return (
    <div className="space-y-8">
      <Bienvenida
        titulo="Panel de Administración"
        descripcion="Vista general del sistema de vinculación."
        nombre={nombre}
        rol={ROL_LABELS[user?.rol || 'ADMIN']}
        mensaje="Tienes acceso completo a todos los módulos del sistema."
      />
      <PanelIndicadores items={indicadores} />
    </div>
  )
}
