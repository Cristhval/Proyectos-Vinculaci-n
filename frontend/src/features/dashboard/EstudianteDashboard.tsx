import { useEffect, useState } from 'react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { FolderKanban, ListTodo, FileCheck, CalendarClock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ROL_LABELS } from '@/lib/constants'
import { Bienvenida, PanelIndicadores, type Indicador } from '@/components/panel/Indicadores'
import { Bloque, ListaAlertas, ListaFechas, Vacio } from '@/components/panel/Bloques'
import { actividadesApi, proyectosApi } from '@/api/proyectos'
import { alertasApi, evidenciasApi } from '@/api/seguimiento'
import type { Actividad } from '@/types/proyectos'
import type { Alerta } from '@/types/seguimiento'

const ABIERTAS = ['PENDIENTE', 'EN_PROCESO', 'ATRASADA']
const DIAS_PROXIMAS = 14

export default function EstudianteDashboard() {
  const user = useAuthStore((state) => state.user)
  const nombre = user ? `${user.user_first_name} ${user.user_last_name}`.trim() || user.user_username : 'Estudiante'

  const [proyectos, setProyectos] = useState<number | null>(null)
  const [actividades, setActividades] = useState<Actividad[] | null>(null)
  const [evidencias, setEvidencias] = useState<number | null>(null)
  const [avisos, setAvisos] = useState<Alerta[] | null>(null)

  useEffect(() => {
    proyectosApi.list({ page_size: '1' }).then((r) => setProyectos(r.data.count)).catch(() => {})
    evidenciasApi.list({ page_size: '1' }).then((r) => setEvidencias(r.data.count)).catch(() => {})
    if (user?.id) {
      actividadesApi.list({ responsable: String(user.id), page_size: '200', ordering: 'fecha_fin' })
        .then((r) => setActividades(r.data.results))
        .catch(() => setActividades([]))
    } else {
      setActividades([])
    }
    alertasApi.list({ estado: 'PENDIENTE', page_size: '6', ordering: '-creado_en' })
      .then((r) => setAvisos(r.data.results))
      .catch(() => setAvisos([]))
  }, [user?.id])

  const abiertas = actividades?.filter((a) => ABIERTAS.includes(a.estado)) ?? null
  const proximas = abiertas?.filter((a) => a.fecha_fin && differenceInCalendarDays(parseISO(a.fecha_fin), new Date()) <= DIAS_PROXIMAS) ?? null

  const indicadores: Indicador[] = [
    { etiqueta: 'Proyectos en los que participo', valor: proyectos, icono: FolderKanban, ruta: '/estudiante/proyectos' },
    { etiqueta: 'Actividades asignadas', valor: abiertas ? abiertas.length : null, icono: ListTodo, ruta: '/estudiante/proyectos' },
    { etiqueta: 'Evidencias enviadas', valor: evidencias, icono: FileCheck },
    { etiqueta: `Entregas en ${DIAS_PROXIMAS} días`, valor: proximas ? proximas.length : null, icono: CalendarClock, atencion: true },
  ]

  return (
    <div className="space-y-6">
      <Bienvenida
        titulo="Panel del estudiante"
        nombre={nombre}
        rol={ROL_LABELS[user?.rol || 'ESTUDIANTE']}
        mensaje="Tus proyectos, actividades asignadas y próximas entregas."
      />
      <PanelIndicadores items={indicadores} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Bloque titulo="Próximas entregas" enlace="/estudiante/proyectos" textoEnlace="Ver proyectos">
          {proximas && proximas.length > 0
            ? <ListaFechas actividades={proximas.slice(0, 6)} rutaBase="/estudiante/proyectos" />
            : <Vacio cargando={proximas === null} texto={`No tienes entregas en los próximos ${DIAS_PROXIMAS} días.`} />}
        </Bloque>
        <Bloque titulo="Avisos" enlace="/estudiante/alertas" textoEnlace="Ver alertas">
          {avisos && avisos.length > 0
            ? <ListaAlertas alertas={avisos} />
            : <Vacio cargando={avisos === null} texto="No tienes avisos pendientes." />}
        </Bloque>
      </div>
    </div>
  )
}
