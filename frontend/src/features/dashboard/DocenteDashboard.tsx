import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { ROL_LABELS } from '@/lib/constants'
import { Bienvenida, PanelIndicadores, type Indicador } from '@/components/panel/Indicadores'
import { FolderKanban, ClipboardCheck, Upload, Clock } from 'lucide-react'
import { reportesApi } from '@/api/reportes'
import { avancesApi } from '@/api/seguimiento'

export default function DocenteDashboard() {
  const user = useAuthStore((state) => state.user)
  const nombre = user ? `${user.user_first_name} ${user.user_last_name}`.trim() || user.user_username : 'Docente'

  const [proyectosActivos, setProyectosActivos] = useState<number | null>(null)
  const [actividadesPendientes, setActividadesPendientes] = useState<number | null>(null)
  const [avancesRegistrados, setAvancesRegistrados] = useState<number | null>(null)
  const [proximosVencimientos, setProximosVencimientos] = useState<number | null>(null)

  useEffect(() => {
    Promise.allSettled([
      reportesApi.dashboard().then(r => {
        const resumen = r.data.data.resumen
        setProyectosActivos(resumen.proyectos_activos)
        setActividadesPendientes(
          r.data.data.actividades_por_estado
            .filter(a => a.estado === 'PENDIENTE' || a.estado === 'EN_PROCESO')
            .reduce((acc, a) => acc + a.total, 0)
        )
        setProximosVencimientos(resumen.actividades_atrasadas)
      }),
      avancesApi.list({ page_size: '1' }).then(r => setAvancesRegistrados(r.data.count)),
    ])
  }, [])

  const indicadores: Indicador[] = [
    { etiqueta: 'Mis proyectos activos', valor: proyectosActivos, icono: FolderKanban, ruta: '/docente/proyectos' },
    { etiqueta: 'Actividades pendientes', valor: actividadesPendientes, icono: ClipboardCheck, ruta: '/docente/proyectos' },
    { etiqueta: 'Avances registrados', valor: avancesRegistrados, icono: Upload, ruta: '/docente/proyectos' },
    { etiqueta: 'Próximos vencimientos', valor: proximosVencimientos, icono: Clock, ruta: '/docente/alertas' },
  ]

  return (
    <div className="space-y-8">
      <Bienvenida
        titulo="Panel del Docente"
        descripcion="Administra tus proyectos y actividades de vinculación."
        nombre={nombre}
        rol={ROL_LABELS[user?.rol || 'DOCENTE']}
        mensaje="Gestiona tus proyectos, registra avances y cumple con las actividades asignadas."
      />
      <PanelIndicadores items={indicadores} />
    </div>
  )
}
