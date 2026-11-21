import { useEffect, useState } from 'react'
import { FolderKanban, Handshake, Users, UserPlus } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ROL_LABELS } from '@/lib/constants'
import { Bienvenida, PanelIndicadores, type Indicador } from '@/components/panel/Indicadores'
import { Bloque, ListaActividadReciente, ListaAlertas, Vacio } from '@/components/panel/Bloques'
import { proyectosApi } from '@/api/proyectos'
import { conveniosApi } from '@/api/convenios'
import { usuariosApi } from '@/api/usuarios'
import { solicitudesApi } from '@/api/solicitudes'
import { auditoriaApi } from '@/api/auditoria'
import { alertasApi } from '@/api/seguimiento'
import type { Auditoria } from '@/types/auditoria'
import type { Alerta } from '@/types/seguimiento'

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user)
  const nombre = user ? `${user.user_first_name} ${user.user_last_name}`.trim() || user.user_username : 'Administrador'

  const [totalProyectos, setTotalProyectos] = useState<number | null>(null)
  const [totalConvenios, setTotalConvenios] = useState<number | null>(null)
  const [totalUsuarios, setTotalUsuarios] = useState<number | null>(null)
  const [solicitudes, setSolicitudes] = useState<number | null>(null)
  const [actividad, setActividad] = useState<Auditoria[] | null>(null)
  const [alertas, setAlertas] = useState<Alerta[] | null>(null)

  useEffect(() => {
    Promise.allSettled([
      proyectosApi.list({ page_size: '1' }).then((r) => setTotalProyectos(r.data.count)),
      conveniosApi.list({ page_size: '1' }).then((r) => setTotalConvenios(r.data.count)),
      usuariosApi.list({ page_size: '1' }).then((r) => setTotalUsuarios(r.data.count)),
      solicitudesApi.contador().then((r) => setSolicitudes(r.data.data.pendientes)),
    ])
    auditoriaApi.list({ page_size: '6', ordering: '-creado_en' })
      .then((r) => setActividad(r.data.results))
      .catch(() => setActividad([]))
    alertasApi.list({ estado: 'PENDIENTE', page_size: '6', ordering: '-creado_en' })
      .then((r) => setAlertas(r.data.results))
      .catch(() => setAlertas([]))
  }, [])

  const indicadores: Indicador[] = [
    { etiqueta: 'Proyectos', valor: totalProyectos, icono: FolderKanban, ruta: '/admin/proyectos' },
    { etiqueta: 'Convenios', valor: totalConvenios, icono: Handshake, ruta: '/admin/convenios' },
    { etiqueta: 'Usuarios registrados', valor: totalUsuarios, icono: Users, ruta: '/admin/usuarios' },
    { etiqueta: 'Solicitudes de acceso', valor: solicitudes, icono: UserPlus, ruta: '/admin/usuarios', atencion: true },
  ]

  return (
    <div className="space-y-6">
      <Bienvenida
        titulo="Panel de administración"
        nombre={nombre}
        rol={ROL_LABELS[user?.rol || 'ADMIN']}
        mensaje="Resumen general del sistema de vinculación."
      />
      <PanelIndicadores items={indicadores} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Bloque titulo="Actividad reciente" enlace="/admin/auditoria" textoEnlace="Ver auditoría">
          {actividad && actividad.length > 0
            ? <ListaActividadReciente registros={actividad} />
            : <Vacio cargando={actividad === null} texto="Todavía no hay acciones registradas." />}
        </Bloque>
        <Bloque titulo="Alertas pendientes" enlace="/admin/alertas" textoEnlace="Ver alertas">
          {alertas && alertas.length > 0
            ? <ListaAlertas alertas={alertas} />
            : <Vacio cargando={alertas === null} texto="No hay alertas pendientes." />}
        </Bloque>
      </div>
    </div>
  )
}
