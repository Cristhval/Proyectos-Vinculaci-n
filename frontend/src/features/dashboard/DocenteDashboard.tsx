import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, GraduationCap, ListTodo, FileSearch } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ROL_LABELS } from '@/lib/constants'
import { Bienvenida, PanelIndicadores, type Indicador } from '@/components/panel/Indicadores'
import { Bloque, ListaFechas, Vacio } from '@/components/panel/Bloques'
import { actividadesApi, participantesApi, proyectosApi } from '@/api/proyectos'
import { evidenciasApi } from '@/api/seguimiento'
import type { Actividad, Proyecto } from '@/types/proyectos'

const ABIERTAS = ['PENDIENTE', 'EN_PROCESO', 'ATRASADA']

export default function DocenteDashboard() {
  const user = useAuthStore((state) => state.user)
  const nombre = user ? `${user.user_first_name} ${user.user_last_name}`.trim() || user.user_username : 'Docente'

  const [proyectos, setProyectos] = useState<Proyecto[] | null>(null)
  const [totalProyectos, setTotalProyectos] = useState<number | null>(null)
  const [estudiantes, setEstudiantes] = useState<number | null>(null)
  const [actividades, setActividades] = useState<Actividad[] | null>(null)
  const [evidenciasPorRevisar, setEvidenciasPorRevisar] = useState<number | null>(null)

  useEffect(() => {
    evidenciasApi.list({ verificada: 'false', page_size: '1' }).then((r) => setEvidenciasPorRevisar(r.data.count)).catch(() => {})

    // Las actividades no dependen de la respuesta de proyectos (se filtran después en memoria):
    // se piden a la vez en lugar de esperar a proyectos y participantes.
    const actividadesPedidas = actividadesApi.list({ page_size: '200', ordering: 'fecha_fin' }).catch(() => null)

    proyectosApi.list({ page_size: '50' }).then(async (r) => {
      const mios = r.data.results
      setProyectos(mios)
      setTotalProyectos(r.data.count)
      const ids = new Set(mios.map((p) => p.id))

      // Estudiantes distintos entre los proyectos asignados.
      const estudiantesListos = Promise.allSettled(
        mios.slice(0, 15).map((p) => participantesApi.list({ proyecto: String(p.id), rol: 'ESTUDIANTE', page_size: '200' })),
      ).then((listas) => {
        const unicos = new Set<number>()
        listas.forEach((l) => { if (l.status === 'fulfilled') l.value.data.results.forEach((x) => unicos.add(x.usuario)) })
        setEstudiantes(unicos.size)
      })

      const act = await actividadesPedidas
      setActividades((act?.data.results ?? []).filter((a) => ids.has(a.proyecto)))
      await estudiantesListos
    }).catch(() => { setProyectos([]); setActividades([]) })
  }, [])

  const abiertas = actividades?.filter((a) => ABIERTAS.includes(a.estado)) ?? null
  const fechas = abiertas?.filter((a) => a.fecha_fin).slice(0, 6) ?? null

  const indicadores: Indicador[] = [
    { etiqueta: 'Proyectos asignados', valor: totalProyectos, icono: FolderKanban, ruta: '/docente/proyectos' },
    { etiqueta: 'Estudiantes vinculados', valor: estudiantes, icono: GraduationCap },
    { etiqueta: 'Actividades abiertas', valor: abiertas ? abiertas.length : null, icono: ListTodo, ruta: '/docente/proyectos' },
    { etiqueta: 'Evidencias por revisar', valor: evidenciasPorRevisar, icono: FileSearch, atencion: true },
  ]

  return (
    <div className="space-y-6">
      <Bienvenida
        titulo="Panel del docente"
        nombre={nombre}
        rol={ROL_LABELS[user?.rol || 'DOCENTE']}
        mensaje="Tus proyectos, sus actividades y lo que está pendiente de revisión."
      />
      <PanelIndicadores items={indicadores} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Bloque titulo="Fechas importantes" enlace="/docente/proyectos" textoEnlace="Ver proyectos">
          {fechas && fechas.length > 0
            ? <ListaFechas actividades={fechas} rutaBase="/docente/proyectos" />
            : <Vacio cargando={fechas === null} texto="No hay actividades con fecha próxima." />}
        </Bloque>
        <Bloque titulo="Mis proyectos" enlace="/docente/proyectos">
          {proyectos && proyectos.length > 0 ? (
            <ul className="divide-y divide-line">
              {proyectos.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link to={`/docente/proyectos/${p.id}`} className="flex items-baseline gap-3 px-5 py-3 transition-colors hover:bg-bg-soft">
                    <span className="w-24 flex-shrink-0 truncate text-xs font-medium text-ink-muted">{p.codigo}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-texto">{p.titulo}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Vacio cargando={proyectos === null} texto="Aún no tienes proyectos asignados." />}
        </Bloque>
      </div>
    </div>
  )
}
