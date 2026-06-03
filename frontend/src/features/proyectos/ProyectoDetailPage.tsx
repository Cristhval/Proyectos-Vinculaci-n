import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Send, Info, ListTodo, Users, Clock, CheckCircle, XCircle, Play, Pause, StopCircle, Ban } from 'lucide-react'
import toast from 'react-hot-toast'
import { proyectosApi, actividadesApi, participantesApi } from '@/api/proyectos'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { ConfirmModal } from '@/components/ui'
import { ESTADO_PROYECTO_LABELS, ESTADO_PROYECTO_COLORS, TIPO_PROYECTO_LABELS, TIPO_PROYECTO_COLORS, PRIORIDAD_LABELS, PRIORIDAD_COLORS } from '@/lib/constants'
import { formatDate, formatPercent } from '@/lib/formatters'
import type { Proyecto, Actividad, ParticipanteProyecto } from '@/types/proyectos'

type Tab = 'info' | 'actividades' | 'participantes' | 'historial'
type WorkflowAction = 'aprobar' | 'rechazar' | 'iniciar' | 'suspender' | 'finalizar' | 'reanudar' | 'cerrar' | 'cancelar' | null

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
  const { isAdmin, isCoordinadorOrAbove, isDocenteOrAbove } = usePermissions()

  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [participantes, setParticipantes] = useState<ParticipanteProyecto[]>([])
  const [tab, setTab] = useState<Tab>('info')
  const [loading, setLoading] = useState(true)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [workflowAction, setWorkflowAction] = useState<WorkflowAction>(null)

  const rol = user?.rol || 'ESTUDIANTE'
  const basePath = `/${rol.toLowerCase()}/proyectos`

  const canEdit = proyecto && (isAdmin() || (isDocenteOrAbove() && proyecto.responsable === user?.id))
  const canSubmit = proyecto && proyecto.estado === 'BORRADOR' && canEdit
  const canApprove = proyecto && proyecto.estado === 'EN_REVISION' && isCoordinadorOrAbove()
  const canStart = proyecto && proyecto.estado === 'APROBADO' && isCoordinadorOrAbove()
  const canSuspend = proyecto && proyecto.estado === 'EN_EJECUCION' && isCoordinadorOrAbove()
  const canFinalize = proyecto && proyecto.estado === 'EN_EJECUCION' && isCoordinadorOrAbove()
  const canResume = proyecto && proyecto.estado === 'EN_SUSPENSION' && isCoordinadorOrAbove()
  const canClose = proyecto && proyecto.estado === 'FINALIZADO' && isAdmin()
  const canCancel = proyecto && !['CANCELADO', 'CERRADO'].includes(proyecto.estado) && isAdmin()

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

  const handleWorkflowAction = async () => {
    if (!id || !workflowAction) return
    try {
      const proyectoId = Number(id)
      let nuevoEstado = ''
      let mensaje = ''

      switch (workflowAction) {
        case 'aprobar':
          await proyectosApi.aprobar(proyectoId)
          nuevoEstado = 'APROBADO'
          mensaje = 'Proyecto aprobado'
          break
        case 'rechazar':
          await proyectosApi.rechazar(proyectoId)
          nuevoEstado = 'BORRADOR'
          mensaje = 'Proyecto rechazado, devuelto a borrador'
          break
        case 'iniciar':
          await proyectosApi.iniciarEjecucion(proyectoId)
          nuevoEstado = 'EN_EJECUCION'
          mensaje = 'Proyecto en ejecución'
          break
        case 'suspender':
          await proyectosApi.suspender(proyectoId)
          nuevoEstado = 'EN_SUSPENSION'
          mensaje = 'Proyecto suspendido'
          break
        case 'finalizar':
          await proyectosApi.finalizar(proyectoId)
          nuevoEstado = 'FINALIZADO'
          mensaje = 'Proyecto finalizado'
          break
        case 'reanudar':
          await proyectosApi.reanudar(proyectoId)
          nuevoEstado = 'APROBADO'
          mensaje = 'Proyecto reanudado'
          break
        case 'cerrar':
          await proyectosApi.cerrar(proyectoId)
          nuevoEstado = 'CERRADO'
          mensaje = 'Proyecto cerrado'
          break
        case 'cancelar':
          await proyectosApi.cancelar(proyectoId)
          nuevoEstado = 'CANCELADO'
          mensaje = 'Proyecto cancelado'
          break
      }

      toast.success(mensaje)
      setProyecto((prev) => prev ? { ...prev, estado: nuevoEstado } : prev)
    } catch {
      toast.error('Error al realizar la acción')
    } finally {
      setWorkflowAction(null)
    }
  }

  const getWorkflowModalContent = () => {
    switch (workflowAction) {
      case 'aprobar':
        return { titulo: '¿Aprobar proyecto?', mensaje: 'El proyecto será aprobado y pasará a estado de ejecución.' }
      case 'rechazar':
        return { titulo: '¿Rechazar proyecto?', mensaje: 'El proyecto será devuelto a borrador para correcciones.' }
      case 'iniciar':
        return { titulo: '¿Iniciar ejecución?', mensaje: 'El proyecto comenzará su fase de ejecución.' }
      case 'suspender':
        return { titulo: '¿Suspender proyecto?', mensaje: 'El proyecto será suspendido temporalmente.' }
      case 'finalizar':
        return { titulo: '¿Finalizar proyecto?', mensaje: 'El proyecto será marcado como finalizado.' }
      case 'reanudar':
        return { titulo: '¿Reanudar proyecto?', mensaje: 'El proyecto volverá a estado aprobado para continuar.' }
      case 'cerrar':
        return { titulo: '¿Cerrar proyecto?', mensaje: 'El proyecto será cerrado definitivamente.' }
      case 'cancelar':
        return { titulo: '¿Cancelar proyecto?', mensaje: 'Esta acción cancelará el proyecto. No se puede deshacer.' }
      default:
        return { titulo: '', mensaje: '' }
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
              <span className={`inline-flex items-center justify-center min-w-[100px] px-3 py-1 text-[11px] font-semibold rounded-md ${ESTADO_PROYECTO_COLORS[proyecto.estado] || 'bg-gray-200 text-gray-700'}`}>
                {ESTADO_PROYECTO_LABELS[proyecto.estado] || proyecto.estado}
              </span>
              <span className={`inline-flex items-center justify-center min-w-[100px] px-3 py-1 text-[11px] font-semibold rounded-md ${TIPO_PROYECTO_COLORS[proyecto.tipo] || 'bg-gray-200 text-gray-700'}`}>
                {TIPO_PROYECTO_LABELS[proyecto.tipo] || proyecto.tipo}
              </span>
              <span className={`inline-flex items-center justify-center min-w-[80px] px-3 py-1 text-[11px] font-semibold rounded-md ${PRIORIDAD_COLORS[proyecto.prioridad] || 'bg-gray-200 text-gray-700'}`}>
                {PRIORIDAD_LABELS[proyecto.prioridad] || proyecto.prioridad}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
            {canApprove && (
              <>
                <button
                  onClick={() => setWorkflowAction('aprobar')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#15803D] text-white hover:bg-[#166534] transition-colors"
                >
                  <CheckCircle size={14} />
                  Aprobar
                </button>
                <button
                  onClick={() => setWorkflowAction('rechazar')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors"
                >
                  <XCircle size={14} />
                  Rechazar
                </button>
              </>
            )}
            {canStart && (
              <button
                onClick={() => setWorkflowAction('iniciar')}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#6D28D9] text-white hover:bg-[#5B21B6] transition-colors"
              >
                <Play size={14} />
                Iniciar ejecución
              </button>
            )}
            {canSuspend && (
              <button
                onClick={() => setWorkflowAction('suspender')}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#B45309] text-white hover:bg-[#92400E] transition-colors"
              >
                <Pause size={14} />
                Suspender
              </button>
            )}
            {canResume && (
              <button
                onClick={() => setWorkflowAction('reanudar')}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#15803D] text-white hover:bg-[#166534] transition-colors"
              >
                <Play size={14} />
                Reanudar
              </button>
            )}
            {canFinalize && (
              <button
                onClick={() => setWorkflowAction('finalizar')}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#065F46] text-white hover:bg-[#064E3B] transition-colors"
              >
                <StopCircle size={14} />
                Finalizar
              </button>
            )}
            {canClose && (
              <button
                onClick={() => setWorkflowAction('cerrar')}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#475569] text-white hover:bg-[#334155] transition-colors"
              >
                <CheckCircle size={14} />
                Cerrar
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => setWorkflowAction('cancelar')}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#B91C1C] text-white hover:bg-[#991B1B] transition-colors"
              >
                <Ban size={14} />
                Cancelar
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

      <ConfirmModal
        isOpen={workflowAction !== null}
        titulo={getWorkflowModalContent().titulo}
        mensaje={getWorkflowModalContent().mensaje}
        onConfirm={handleWorkflowAction}
        onCancel={() => setWorkflowAction(null)}
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
