import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { ROL_LABELS } from '@/lib/constants'
import { Bienvenida, PanelIndicadores, type Indicador } from '@/components/panel/Indicadores'
import { FileSearch, CheckCircle, Handshake, Bell } from 'lucide-react'
import { proyectosApi } from '@/api/proyectos'
import { conveniosApi } from '@/api/convenios'
import { reportesApi } from '@/api/reportes'

export default function CoordinadorDashboard() {
  const user = useAuthStore((state) => state.user)
  const nombre = user ? `${user.user_first_name} ${user.user_last_name}`.trim() || user.user_username : 'Coordinador'

  const [enRevision, setEnRevision] = useState<number | null>(null)
  const [aprobados, setAprobados] = useState<number | null>(null)
  const [vigentes, setVigentes] = useState<number | null>(null)
  const [alertasActivas, setAlertasActivas] = useState<number | null>(null)

  useEffect(() => {
    Promise.allSettled([
      proyectosApi.list({ estado: 'EN_REVISION', page_size: '1' }).then(r => setEnRevision(r.data.count)),
      proyectosApi.list({ estado: 'APROBADO', page_size: '1' }).then(r => setAprobados(r.data.count)),
      conveniosApi.list({ estado: 'VIGENTE', page_size: '1' }).then(r => setVigentes(r.data.count)),
      reportesApi.dashboard().then(r => setAlertasActivas(r.data.data.resumen.alertas_pendientes)),
    ])
  }, [])

  const indicadores: Indicador[] = [
    { etiqueta: 'Proyectos en revisión', valor: enRevision, icono: FileSearch, ruta: '/coordinador/proyectos' },
    { etiqueta: 'Proyectos aprobados', valor: aprobados, icono: CheckCircle, ruta: '/coordinador/proyectos' },
    { etiqueta: 'Convenios vigentes', valor: vigentes, icono: Handshake, ruta: '/coordinador/convenios' },
    { etiqueta: 'Alertas activas', valor: alertasActivas, icono: Bell, ruta: '/coordinador/alertas' },
  ]

  return (
    <div className="space-y-8">
      <Bienvenida
        titulo="Panel de Coordinación"
        descripcion="Gestión de proyectos y convenios de tu carrera."
        nombre={nombre}
        rol={ROL_LABELS[user?.rol || 'COORDINADOR']}
        mensaje="Coordina proyectos, revisa avances y gestiona convenios institucionales."
      />
      <PanelIndicadores items={indicadores} />
    </div>
  )
}
