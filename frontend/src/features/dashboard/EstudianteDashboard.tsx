import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { ROL_LABELS } from '@/lib/constants'
import { Bienvenida, PanelIndicadores, type Indicador } from '@/components/panel/Indicadores'
import { Users, ListTodo, FileCheck, CalendarClock } from 'lucide-react'
import { reportesApi } from '@/api/reportes'
import { evidenciasApi } from '@/api/seguimiento'

export default function EstudianteDashboard() {
  const user = useAuthStore((state) => state.user)
  const nombre = user ? `${user.user_first_name} ${user.user_last_name}`.trim() || user.user_username : 'Estudiante'

  const [proyectosParticipa, setProyectosParticipa] = useState<number | null>(null)
  const [actividadesAsignadas, setActividadesAsignadas] = useState<number | null>(null)
  const [evidenciasEnviadas, setEvidenciasEnviadas] = useState<number | null>(null)
  const [proximasEntregas, setProximasEntregas] = useState<number | null>(null)

  useEffect(() => {
    Promise.allSettled([
      reportesApi.dashboard().then(r => {
        const resumen = r.data.data.resumen
        setProyectosParticipa(resumen.proyectos_activos)
        const pendientes = r.data.data.actividades_por_estado
          .filter(a => a.estado === 'PENDIENTE' || a.estado === 'EN_PROCESO')
          .reduce((acc, a) => acc + a.total, 0)
        setActividadesAsignadas(pendientes)
        setProximasEntregas(resumen.actividades_atrasadas)
      }),
      evidenciasApi.list({ page_size: '1' }).then(r => setEvidenciasEnviadas(r.data.count)),
    ])
  }, [])

  const indicadores: Indicador[] = [
    { etiqueta: 'Proyectos en los que participo', valor: proyectosParticipa, icono: Users, ruta: '/estudiante/proyectos' },
    { etiqueta: 'Actividades asignadas', valor: actividadesAsignadas, icono: ListTodo, ruta: '/estudiante/proyectos' },
    { etiqueta: 'Evidencias enviadas', valor: evidenciasEnviadas, icono: FileCheck, ruta: '/estudiante/proyectos' },
    { etiqueta: 'Próximas entregas', valor: proximasEntregas, icono: CalendarClock, ruta: '/estudiante/alertas', atencion: true },
  ]

  return (
    <div className="space-y-8">
      <Bienvenida
        titulo="Panel del Estudiante"
        descripcion="Consulta tus proyectos y actividades de vinculación."
        nombre={nombre}
        rol={ROL_LABELS[user?.rol || 'ESTUDIANTE']}
        mensaje="Revisa tus proyectos asignados, envía evidencias y cumple con las entregas pendientes."
      />
      <PanelIndicadores items={indicadores} />
    </div>
  )
}
