import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileSearch, CheckCircle, Handshake, Bell } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ROL_LABELS } from '@/lib/constants'
import { Bienvenida, PanelIndicadores, type Indicador } from '@/components/panel/Indicadores'
import { Bloque, ListaAlertas, Vacio } from '@/components/panel/Bloques'
import { proyectosApi } from '@/api/proyectos'
import { conveniosApi } from '@/api/convenios'
import { alertasApi } from '@/api/seguimiento'
import type { Proyecto } from '@/types/proyectos'
import type { Alerta } from '@/types/seguimiento'

export default function CoordinadorDashboard() {
  const user = useAuthStore((state) => state.user)
  const nombre = user ? `${user.user_first_name} ${user.user_last_name}`.trim() || user.user_username : 'Coordinador'

  const [enRevision, setEnRevision] = useState<Proyecto[] | null>(null)
  const [totalRevision, setTotalRevision] = useState<number | null>(null)
  const [aprobados, setAprobados] = useState<number | null>(null)
  const [vigentes, setVigentes] = useState<number | null>(null)
  const [alertas, setAlertas] = useState<Alerta[] | null>(null)
  const [totalAlertas, setTotalAlertas] = useState<number | null>(null)

  useEffect(() => {
    proyectosApi.list({ estado: 'EN_REVISION', page_size: '6', ordering: '-creado_en' })
      .then((r) => { setEnRevision(r.data.results); setTotalRevision(r.data.count) })
      .catch(() => setEnRevision([]))
    proyectosApi.list({ estado: 'APROBADO', page_size: '1' }).then((r) => setAprobados(r.data.count)).catch(() => {})
    conveniosApi.list({ estado: 'VIGENTE', page_size: '1' }).then((r) => setVigentes(r.data.count)).catch(() => {})
    alertasApi.list({ estado: 'PENDIENTE', page_size: '6', ordering: '-creado_en' })
      .then((r) => { setAlertas(r.data.results); setTotalAlertas(r.data.count) })
      .catch(() => setAlertas([]))
  }, [])

  const indicadores: Indicador[] = [
    { etiqueta: 'Proyectos en revisión', valor: totalRevision, icono: FileSearch, ruta: '/coordinador/proyectos', atencion: true },
    { etiqueta: 'Proyectos aprobados', valor: aprobados, icono: CheckCircle, ruta: '/coordinador/proyectos' },
    { etiqueta: 'Convenios vigentes', valor: vigentes, icono: Handshake, ruta: '/coordinador/convenios' },
    { etiqueta: 'Alertas pendientes', valor: totalAlertas, icono: Bell, ruta: '/coordinador/alertas', atencion: true },
  ]

  return (
    <div className="space-y-6">
      <Bienvenida
        titulo="Panel de coordinación"
        nombre={nombre}
        rol={ROL_LABELS[user?.rol || 'COORDINADOR']}
        mensaje="Proyectos y convenios de tu carrera."
      />
      <PanelIndicadores items={indicadores} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Bloque titulo="Proyectos por revisar" enlace="/coordinador/proyectos" textoEnlace="Ver proyectos">
          {enRevision && enRevision.length > 0 ? (
            <ul className="divide-y divide-line">
              {enRevision.map((p) => (
                <li key={p.id}>
                  <Link to={`/coordinador/proyectos/${p.id}`} className="flex items-baseline gap-3 px-5 py-3 transition-colors hover:bg-bg-soft">
                    <span className="w-24 flex-shrink-0 truncate text-xs font-medium text-ink-muted">{p.codigo}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-texto">{p.titulo}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Vacio cargando={enRevision === null} texto="No hay proyectos esperando revisión." />}
        </Bloque>
        <Bloque titulo="Alertas pendientes" enlace="/coordinador/alertas" textoEnlace="Ver alertas">
          {alertas && alertas.length > 0
            ? <ListaAlertas alertas={alertas} />
            : <Vacio cargando={alertas === null} texto="No hay alertas pendientes." />}
        </Bloque>
      </div>
    </div>
  )
}
