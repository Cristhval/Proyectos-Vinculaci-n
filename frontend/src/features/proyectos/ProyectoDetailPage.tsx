import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Send, Info, ListTodo, Users, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { proyectosApi, actividadesApi, participantesApi } from '@/api/proyectos'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { ConfirmModal } from '@/components/ui'
import { ESTADO_PROYECTO_LABELS, ESTADO_PROYECTO_COLORS, TIPO_PROYECTO_LABELS, PRIORIDAD_LABELS, PRIORIDAD_COLORS } from '@/lib/constants'
import { formatDate, formatPercent } from '@/lib/formatters'
import type { Proyecto, Actividad, ParticipanteProyecto } from '@/types/proyectos'

type Tab = 'info' | 'actividades' | 'participantes' | 'historial'

const TABS: { key: Tab; label: string; icon: typeof Info }[] = [
  { key: 'info', label: 'Información general', icon: Info },
  { key: 'actividades', label: 'Actividades', icon: ListTodo },
  { key: 'participantes', label: 'Participantes', icon: Users },
  { key: 'historial', label: 'Historial', icon: Clock },
]

export default function ProyectoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { isAdmin, isDocenteOrAbove } = usePermissions()

  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [participantes, setParticipantes] = useState<ParticipanteProyecto[]>([])
  const [tab, setTab] = useState<Tab>('info')
  const [loading, setLoading] = useState(true)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  const rol = user?.rol || 'ESTUDIANTE'
  const basePath = `/${rol.toLowerCase()}/proyectos`

  const canEdit = proyecto && (isAdmin() || (isDocenteOrAbove() && proyecto.responsable === user?.id))
  const canSubmit = proyecto && proyecto.estado === 'BORRADOR' && canEdit

  useEffect(() => {
    if (!id) return
    setLoading(true)
    proyectosApi.get(Number(id)).then(({ data }) => {
      setProyecto(data)
      setLoading(false)
    }).catch(() => {
      toast.error('Error al cargar el proyecto')
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!id || tab !== 'actividades') return
    actividadesApi.list({ proyecto: id }).then(({ data }) => setActividades(data.results))
  }, [id, tab])

  useEffect(() => {
    if (!id || tab !== 'participantes') return
    participantesApi.list({ proyecto: id }).then(({ data }) => setParticipantes(data.results))
  }, [id, tab])

  const handleEnviarRevision = async () => {
    if (!id) return
    try {
      await proyectosApi.enviarRevision(Number(id))
      toast.success('Proyecto enviado a revisión')
      setProyecto((prev) => prev ? { ...prev, estado: 'EN_REVISION' } : prev)
    } catch {
      toast.error('Error al enviar')
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-sm text-ink-muted">Cargando...</div>
  }

  if (!proyecto) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-ink-muted">Proyecto no encontrado</p>
        <button onClick={() => navigate(basePath)} className="mt-4 text-sm text-accent hover:underline">Volver a proyectos</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => navigate(basePath)} className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
          <ArrowLeft size={14} />
          Volver a proyectos
        </button>
      </div>

      {/* Header */}
      <div className="bg-white border border-line p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-mono text-ink-muted">{proyecto.codigo}</p>
            <h1 className="text-2xl font-bold text-ink tracking-tight">{proyecto.titulo}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-1 text-[11px] font-semibold ${ESTADO_PROYECTO_COLORS[proyecto.estado] || ''}`} style={{ borderRadius: '4px' }}>
                {ESTADO_PROYECTO_LABELS[proyecto.estado] || proyecto.estado}
              </span>
              <span className="px-2 py-1 text-[11px] font-semibold bg-[#F3F4F6] text-[#6B7280]" style={{ borderRadius: '4px' }}>
                {TIPO_PROYECTO_LABELS[proyecto.tipo] || proyecto.tipo}
              </span>
              <span className={`px-2 py-1 text-[11px] font-semibold ${PRIORIDAD_COLORS[proyecto.prioridad] || ''}`} style={{ borderRadius: '4px' }}>
                {PRIORIDAD_LABELS[proyecto.prioridad] || proyecto.prioridad}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => navigate(`${basePath}/${proyecto.id}/editar`)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-300 text-ink hover:bg-gray-50 transition-colors"
              >
                <Edit size={14} />
                Editar
              </button>
            )}
            {canSubmit && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <Send size={14} />
                Enviar a revisión
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-line">
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'info' && (
        <div className="bg-white border border-line p-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <Field label="Código" value={proyecto.codigo} />
            <Field label="Tipo" value={TIPO_PROYECTO_LABELS[proyecto.tipo] || proyecto.tipo} />
            <Field label="Estado" value={ESTADO_PROYECTO_LABELS[proyecto.estado] || proyecto.estado} />
            <Field label="Prioridad" value={PRIORIDAD_LABELS[proyecto.prioridad] || proyecto.prioridad} />
            <Field label="Carrera" value={proyecto.carrera_nombre || '-'} />
            <Field label="Línea de intervención" value={proyecto.linea_intervencion || '-'} />
            <Field label="Responsable" value={proyecto.responsable_nombre || '-'} />
            <Field label="Fecha inicio" value={formatDate(proyecto.fecha_inicio)} />
            <Field label="Fecha fin planificada" value={formatDate(proyecto.fecha_fin_planificada)} />
            <Field label="Fecha fin real" value={formatDate(proyecto.fecha_fin_real)} />
            <Field label="Presupuesto" value={proyecto.presupuesto_aprobado ? `$${proyecto.presupuesto_aprobado}` : '-'} />
            <Field label="Dirección ejecución" value={proyecto.direccion_ejecucion || '-'} />
            <div className="col-span-2">
              <Field label="Resumen" value={proyecto.resumen || '-'} />
            </div>
            {proyecto.problema && (
              <div className="col-span-2">
                <Field label="Problema" value={proyecto.problema} />
              </div>
            )}
            {proyecto.justificacion && (
              <div className="col-span-2">
                <Field label="Justificación" value={proyecto.justificacion} />
              </div>
            )}
            {proyecto.objetivo_general && (
              <div className="col-span-2">
                <Field label="Objetivo general" value={proyecto.objetivo_general} />
              </div>
            )}
            {proyecto.resultados_esperados && (
              <div className="col-span-2">
                <Field label="Resultados esperados" value={proyecto.resultados_esperados} />
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'actividades' && (
        <div className="bg-white border border-[#E5E7EB] overflow-hidden" style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] border-b-2 border-[#E5E7EB]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Progreso</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Inicio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Fin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {actividades.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-muted">No hay actividades registradas</td>
                </tr>
              ) : actividades.map((a, i) => (
                <tr key={a.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'} hover:bg-[#F0FDF4] transition-colors duration-150`}>
                  <td className="px-4 py-3.5 font-medium text-[#374151]">{a.nombre}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-1 text-[11px] font-semibold bg-[#F3F4F6] text-[#6B7280]" style={{ borderRadius: '4px' }}>{a.estado}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden max-w-[80px]">
                        <div className="h-full bg-[#16A34A] rounded-full" style={{ width: `${parseFloat(a.porcentaje_ejecucion) || 0}%` }} />
                      </div>
                      <span className="text-xs text-[#374151]">{formatPercent(a.porcentaje_ejecucion)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[#374151] text-xs">{formatDate(a.fecha_inicio)}</td>
                  <td className="px-4 py-3.5 text-[#374151] text-xs">{formatDate(a.fecha_fin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'participantes' && (
        <div className="bg-white border border-[#E5E7EB] overflow-hidden" style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] border-b-2 border-[#E5E7EB]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Horas comprometidas</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Horas cumplidas</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {participantes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-muted">No hay participantes registrados</td>
                </tr>
              ) : participantes.map((p, i) => (
                <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'} hover:bg-[#F0FDF4] transition-colors duration-150`}>
                  <td className="px-4 py-3.5 font-medium text-[#374151]">{p.usuario}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-1 text-[11px] font-semibold bg-[#F3F4F6] text-[#6B7280]" style={{ borderRadius: '4px' }}>{p.rol}</span>
                  </td>
                  <td className="px-4 py-3.5 text-[#374151]">{p.horas_comprometidas}h</td>
                  <td className="px-4 py-3.5 text-[#374151]">{p.horas_cumplidas}h</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-1 text-[11px] font-semibold bg-[#F3F4F6] text-[#6B7280]" style={{ borderRadius: '4px' }}>{p.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'historial' && (
        <div className="bg-white border border-line p-6">
          <div className="text-center py-8 text-sm text-ink-muted">
            El historial de cambios se mostrará aquí cuando esté disponible.
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showSubmitModal}
        titulo="¿Enviar a revisión?"
        mensaje="Está seguro de enviar el proyecto a revisión!"
        onConfirm={async () => {
          await handleEnviarRevision()
          setShowSubmitModal(false)
        }}
        onCancel={() => setShowSubmitModal(false)}
      />
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-black font-semibold">{value}</p>
    </div>
  )
}
