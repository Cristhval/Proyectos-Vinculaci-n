import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Edit, Send, Info, ListTodo, Users, Clock,
  CheckCircle, XCircle, Play, Pause, StopCircle, Ban,
  Plus, Trash2, FolderKanban, Search, Pencil
} from 'lucide-react'
import toast from 'react-hot-toast'
import { proyectosApi, actividadesApi, participantesApi, auditoriaApi } from '@/api/proyectos'
import { usuariosApi } from '@/api/usuarios'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { ConfirmModal } from '@/components/ui'
import {
  ESTADO_PROYECTO_LABELS, ESTADO_PROYECTO_COLORS,
  TIPO_PROYECTO_LABELS, TIPO_PROYECTO_COLORS,
  PRIORIDAD_LABELS, PRIORIDAD_COLORS
} from '@/lib/constants'
import { formatDate, formatPercent } from '@/lib/formatters'
import type {
  Proyecto, Actividad, ParticipanteProyecto,
  EstadoProyecto, RolParticipante, EstadoParticipante
} from '@/types/proyectos'
import type { Usuario } from '@/types/usuarios'
import type { AuditoriaRegistro } from '@/api/proyectos'

type Tab = 'info' | 'actividades' | 'participantes' | 'historial'
type WorkflowAction = 'aprobar' | 'rechazar' | 'iniciar' | 'suspender' | 'finalizar' | 'reanudar' | 'cerrar' | 'cancelar' | null

const TABS: { key: Tab; label: string; icon: typeof Info }[] = [
  { key: 'info', label: 'Información general', icon: Info },
  { key: 'actividades', label: 'Actividades', icon: ListTodo },
  { key: 'participantes', label: 'Participantes', icon: Users },
  { key: 'historial', label: 'Historial', icon: Clock },
]

const ROL_COLORS: Record<string, string> = {
  LIDER: 'bg-[#0A0A0A] text-white',
  DOCENTE: 'bg-[#16A34A] text-white',
  ESTUDIANTE: 'bg-[#2563EB] text-white',
  APOYO: 'bg-[#6B7280] text-white',
  EXTERNO: 'bg-[#B45309] text-white',
}

const ROL_LABELS: Record<string, string> = {
  LIDER: 'Líder',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
  APOYO: 'Apoyo',
  EXTERNO: 'Externo',
}

const ESTADO_ACTIVIDAD_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-gray-200 text-gray-700',
  EN_PROCESO: 'bg-blue-100 text-blue-700',
  COMPLETADA: 'bg-emerald-100 text-emerald-700',
  ATRASADA: 'bg-red-100 text-red-700',
  CANCELADA: 'bg-gray-400 text-white',
}

const ESTADO_ACTIVIDAD_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  COMPLETADA: 'Completada',
  ATRASADA: 'Atrasada',
  CANCELADA: 'Cancelada',
}

const ESTADO_ACTIVIDAD_PULSE: Record<string, boolean> = {
  PENDIENTE: false,
  EN_PROCESO: true,
  COMPLETADA: false,
  ATRASADA: true,
  CANCELADA: false,
}

const ACCION_COLORS: Record<string, string> = {
  CREAR: 'bg-emerald-500',
  ACTUALIZAR: 'bg-amber-500',
  ELIMINAR: 'bg-red-500',
  APROBAR: 'bg-emerald-500',
  RECHAZAR: 'bg-red-500',
  INICIAR_SESION: 'bg-blue-500',
}

const ACCION_LABELS: Record<string, string> = {
  CREAR: 'Creación',
  ACTUALIZAR: 'Modificación',
  ELIMINAR: 'Eliminación',
  APROBAR: 'Aprobación',
  RECHAZAR: 'Rechazo',
  INICIAR_SESION: 'Inicio de sesión',
}

export default function ProyectoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { isAdmin, isCoordinadorOrAbove } = usePermissions()

  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [participantes, setParticipantes] = useState<ParticipanteProyecto[]>([])
  const [historial, setHistorial] = useState<AuditoriaRegistro[]>([])
  const [tab, setTab] = useState<Tab>('info')
  const [loading, setLoading] = useState(true)
  const [loadingTab, setLoadingTab] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [workflowAction, setWorkflowAction] = useState<WorkflowAction>(null)
  const [rechazarMotivo, setRechazarMotivo] = useState('')

  const [showAddParticipante, setShowAddParticipante] = useState(false)
  const [editParticipante, setEditParticipante] = useState<ParticipanteProyecto | null>(null)
  const [deleteParticipante, setDeleteParticipante] = useState<ParticipanteProyecto | null>(null)
  const [searchUser, setSearchUser] = useState('')
  const [searchResults, setSearchResults] = useState<Usuario[]>([])
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null)
  const [nuevoRol, setNuevoRol] = useState<RolParticipante>('ESTUDIANTE')
  const [nuevasHoras, setNuevasHoras] = useState('')
  const [nuevasObs, setNuevasObs] = useState('')
  const [addingParticipant, setAddingParticipant] = useState(false)
  const [editRol, setEditRol] = useState<RolParticipante>('ESTUDIANTE')
  const [editHoras, setEditHoras] = useState('')
  const [editObs, setEditObs] = useState('')
  const [editEstado, setEditEstado] = useState<EstadoParticipante>('ACTIVO')
  const [savingParticipante, setSavingParticipante] = useState(false)

  const [showAddActividad, setShowAddActividad] = useState(false)
  const [editActividad, setEditActividad] = useState<Actividad | null>(null)
  const [deleteActividad, setDeleteActividad] = useState<Actividad | null>(null)
  const [actCodigo, setActCodigo] = useState('')
  const [actNombre, setActNombre] = useState('')
  const [actDesc, setActDesc] = useState('')
  const [actObjetivo, setActObjetivo] = useState('')
  const [actResponsable, setActResponsable] = useState('')
  const [actFechaInicio, setActFechaInicio] = useState('')
  const [actFechaFin, setActFechaFin] = useState('')
  const [actRequiereEvidencia, setActRequiereEvidencia] = useState(false)
  const [actObs, setActObs] = useState('')
  const [addingActividad, setAddingActividad] = useState(false)
  const [savingActividad, setSavingActividad] = useState(false)

  const [docentesList, setDocentesList] = useState<Usuario[]>([])
  const [objetivosList, setObjetivosList] = useState<{ id: number; descripcion: string }[]>([])

  const rol = user?.rol || 'ESTUDIANTE'
  const basePath = `/${rol.toLowerCase()}/proyectos`

  const responsableId = proyecto?.responsable != null
    ? (typeof proyecto.responsable === 'object' ? (proyecto.responsable as unknown as { id: number }).id : proyecto.responsable)
    : null
  const isResponsable = rol === 'DOCENTE' && responsableId === user?.id
  const canEdit = proyecto && (isAdmin() || (isResponsable && proyecto.estado === 'BORRADOR'))
  const canSubmit = proyecto && proyecto.estado === 'BORRADOR' && (isAdmin() || isResponsable)
  const canManageParticipants = proyecto && (isAdmin() || isCoordinadorOrAbove() || isResponsable)
  const canApprove = proyecto && proyecto.estado === 'EN_REVISION' && isCoordinadorOrAbove()
  const canStart = proyecto && proyecto.estado === 'APROBADO' && (isAdmin() || isResponsable)
  const canSuspend = proyecto && proyecto.estado === 'EN_EJECUCION' && isCoordinadorOrAbove()
  const canFinalize = proyecto && proyecto.estado === 'EN_EJECUCION' && (isAdmin() || isResponsable)
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

  const loadActividades = useCallback(() => {
    if (!id) return
    setLoadingTab(true)
    actividadesApi.list({ proyecto: id })
      .then(({ data }) => setActividades(data.results))
      .catch(() => toast.error('Error al cargar actividades'))
      .finally(() => setLoadingTab(false))
  }, [id])

  const loadParticipantes = useCallback(() => {
    if (!id) return
    setLoadingTab(true)
    participantesApi.list({ proyecto: id })
      .then(({ data }) => setParticipantes(data.results))
      .catch(() => toast.error('Error al cargar participantes'))
      .finally(() => setLoadingTab(false))
  }, [id])

  const loadHistorial = useCallback(() => {
    if (!id) return
    setLoadingTab(true)
    auditoriaApi.list({ entidad: 'proyecto', entidad_id: id })
      .then(({ data }) => setHistorial(data.results))
      .catch(() => toast.error('Error al cargar historial'))
      .finally(() => setLoadingTab(false))
  }, [id])

  useEffect(() => {
    if (tab === 'actividades') loadActividades()
    if (tab === 'participantes') loadParticipantes()
    if (tab === 'historial') loadHistorial()
  }, [tab, loadActividades, loadParticipantes, loadHistorial])

  useEffect(() => {
    usuariosApi.list({ rol: 'DOCENTE', page_size: '100' }).then(({ data }) => setDocentesList(data.results)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!id) return
    import('@/api/proyectos').then(({ objetivosApi }) => {
      objetivosApi.list({ proyecto: id, page_size: '100' }).then(({ data }) => setObjetivosList(data.results)).catch(() => {})
    })
  }, [id])

  const handleSearchUser = useCallback(async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return }
    try {
      const { data } = await usuariosApi.list({ search: query, page_size: '10' })
      setSearchResults(data.results)
    } catch { setSearchResults([]) }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => handleSearchUser(searchUser), 300)
    return () => clearTimeout(timer)
  }, [searchUser, handleSearchUser])

  const handleAddParticipante = async () => {
    if (!id || !selectedUser) return
    if (participantes.some((p) => p.usuario === selectedUser.id)) {
      toast.error('Este usuario ya es participante del proyecto')
      return
    }
    setAddingParticipant(true)
    try {
      await participantesApi.create({
        proyecto: Number(id),
        usuario: selectedUser.id,
        rol: nuevoRol,
        horas_comprometidas: nuevasHoras || '0',
        observaciones: nuevasObs,
      })
      toast.success('Participante agregado correctamente')
      setShowAddParticipante(false)
      setSelectedUser(null)
      setSearchUser('')
      setNuevoRol('ESTUDIANTE')
      setNuevasHoras('')
      setNuevasObs('')
      loadParticipantes()
    } catch {
      toast.error('No se pudo agregar el participante')
    } finally {
      setAddingParticipant(false)
    }
  }

  const handleDeleteParticipante = async () => {
    if (!deleteParticipante) return
    try {
      await participantesApi.delete(deleteParticipante.id)
      toast.success('Participante eliminado correctamente')
      setDeleteParticipante(null)
      loadParticipantes()
    } catch {
      toast.error('No se pudo eliminar el participante')
    }
  }

  const openEditParticipante = (p: ParticipanteProyecto) => {
    setEditParticipante(p)
    setEditRol(p.rol)
    setEditHoras(p.horas_comprometidas || '')
    setEditObs(p.observaciones || '')
    setEditEstado(p.estado || 'ACTIVO')
  }

  const handleEditParticipante = async () => {
    if (!editParticipante) return
    setSavingParticipante(true)
    try {
      await participantesApi.update(editParticipante.id, {
        rol: editRol,
        horas_comprometidas: editHoras || '0',
        observaciones: editObs,
        estado: editEstado,
      })
      toast.success('Participante actualizado correctamente')
      setEditParticipante(null)
      loadParticipantes()
    } catch {
      toast.error('No se pudo actualizar el participante')
    } finally {
      setSavingParticipante(false)
    }
  }

  const handleAddActividad = async () => {
    if (!id || !actCodigo.trim() || !actNombre.trim() || !actFechaInicio || !actFechaFin) {
      toast.error('Completa los campos obligatorios')
      return
    }
    if (actFechaFin < actFechaInicio) {
      toast.error('La fecha fin debe ser posterior a la fecha de inicio')
      return
    }
    setAddingActividad(true)
    try {
      await actividadesApi.create({
        proyecto: Number(id),
        codigo: actCodigo.trim(),
        nombre: actNombre.trim(),
        descripcion: actDesc.trim(),
        objetivo: actObjetivo ? Number(actObjetivo) : null,
        responsable: actResponsable ? Number(actResponsable) : null,
        fecha_inicio: actFechaInicio,
        fecha_fin: actFechaFin,
        requiere_evidencia: actRequiereEvidencia,
        observaciones: actObs.trim(),
      })
      toast.success('Actividad creada correctamente')
      closeActividadModal()
      loadActividades()
    } catch {
      toast.error('No se pudo crear la actividad')
    } finally {
      setAddingActividad(false)
    }
  }

  const openEditActividad = (a: Actividad) => {
    setEditActividad(a)
    setActCodigo(a.codigo)
    setActNombre(a.nombre)
    setActDesc(a.descripcion || '')
    setActObjetivo(a.objetivo ? String(a.objetivo) : '')
    setActResponsable(a.responsable ? String(a.responsable) : '')
    setActFechaInicio(a.fecha_inicio || '')
    setActFechaFin(a.fecha_fin || '')
    setActRequiereEvidencia(a.requiere_evidencia)
    setActObs(a.observaciones || '')
  }

  const handleEditActividad = async () => {
    if (!editActividad || !actCodigo.trim() || !actNombre.trim() || !actFechaInicio || !actFechaFin) {
      toast.error('Completa los campos obligatorios')
      return
    }
    if (actFechaFin < actFechaInicio) {
      toast.error('La fecha fin debe ser posterior a la fecha de inicio')
      return
    }
    setSavingActividad(true)
    try {
      await actividadesApi.update(editActividad.id, {
        codigo: actCodigo.trim(),
        nombre: actNombre.trim(),
        descripcion: actDesc.trim(),
        objetivo: actObjetivo ? Number(actObjetivo) : null,
        responsable: actResponsable ? Number(actResponsable) : null,
        fecha_inicio: actFechaInicio,
        fecha_fin: actFechaFin,
        requiere_evidencia: actRequiereEvidencia,
        observaciones: actObs.trim(),
      })
      toast.success('Actividad actualizada correctamente')
      closeActividadModal()
      loadActividades()
    } catch {
      toast.error('No se pudo actualizar la actividad')
    } finally {
      setSavingActividad(false)
    }
  }

  const handleDeleteActividad = async () => {
    if (!deleteActividad) return
    try {
      await actividadesApi.delete(deleteActividad.id)
      toast.success('Actividad eliminada correctamente')
      setDeleteActividad(null)
      loadActividades()
    } catch {
      toast.error('No se pudo eliminar la actividad')
    }
  }

  const closeActividadModal = () => {
    setShowAddActividad(false)
    setEditActividad(null)
    setActCodigo('')
    setActNombre('')
    setActDesc('')
    setActObjetivo('')
    setActResponsable('')
    setActFechaInicio('')
    setActFechaFin('')
    setActRequiereEvidencia(false)
    setActObs('')
  }

  const handleEnviarRevision = async () => {
    if (!id) return
    try {
      await proyectosApi.enviarRevision(Number(id))
      toast.success('Proyecto enviado a revisión')
      setProyecto((prev) => prev ? { ...prev, estado: 'EN_REVISION' } : prev)
    } catch { toast.error('Error al enviar') }
  }

  const handleRechazar = async () => {
    if (!id || rechazarMotivo.trim().length < 10) return
    try {
      await proyectosApi.rechazar(Number(id), { motivo: rechazarMotivo.trim() })
      toast.success('Proyecto rechazado, devuelto a borrador')
      setProyecto((prev) => prev ? { ...prev, estado: 'BORRADOR' } : prev)
    } catch { toast.error('Error al rechazar el proyecto') }
    finally { setWorkflowAction(null); setRechazarMotivo('') }
  }

  const handleWorkflowAction = async () => {
    if (!id || !workflowAction || workflowAction === 'rechazar') return
    try {
      const proyectoId = Number(id)
      let nuevoEstado: EstadoProyecto = 'BORRADOR'
      let mensaje = ''
      switch (workflowAction) {
        case 'aprobar': await proyectosApi.aprobar(proyectoId); nuevoEstado = 'APROBADO'; mensaje = 'Proyecto aprobado'; break
        case 'iniciar': await proyectosApi.iniciarEjecucion(proyectoId); nuevoEstado = 'EN_EJECUCION'; mensaje = 'Proyecto en ejecución'; break
        case 'suspender': await proyectosApi.suspender(proyectoId); nuevoEstado = 'EN_SUSPENSION'; mensaje = 'Proyecto suspendido'; break
        case 'finalizar': await proyectosApi.finalizar(proyectoId); nuevoEstado = 'FINALIZADO'; mensaje = 'Proyecto finalizado'; break
        case 'reanudar': await proyectosApi.reanudar(proyectoId); nuevoEstado = 'APROBADO'; mensaje = 'Proyecto reanudado'; break
        case 'cerrar': await proyectosApi.cerrar(proyectoId); nuevoEstado = 'CERRADO'; mensaje = 'Proyecto cerrado'; break
        case 'cancelar': await proyectosApi.cancelar(proyectoId); nuevoEstado = 'CANCELADO'; mensaje = 'Proyecto cancelado'; break
      }
      toast.success(mensaje)
      setProyecto((prev) => prev ? { ...prev, estado: nuevoEstado } : prev)
    } catch { toast.error('Error al realizar la acción') }
    finally { setWorkflowAction(null) }
  }

  const getWorkflowModalContent = () => {
    switch (workflowAction) {
      case 'aprobar': return { titulo: '¿Aprobar este proyecto?', mensaje: 'El proyecto será aprobado y pasará a estado de ejecución.' }
      case 'rechazar': return { titulo: '¿Rechazar proyecto?', mensaje: 'El proyecto será devuelto a borrador para correcciones.' }
      case 'iniciar': return { titulo: '¿Iniciar la ejecución del proyecto?', mensaje: 'Asegúrate de tener todos los participantes y actividades registrados.' }
      case 'suspender': return { titulo: '¿Suspender proyecto?', mensaje: 'El proyecto será suspendido temporalmente. Se requiere un motivo.' }
      case 'finalizar': return { titulo: '¿Finalizar el proyecto?', mensaje: 'Confirma que todas las actividades han sido completadas.' }
      case 'reanudar': return { titulo: '¿Reanudar proyecto?', mensaje: 'El proyecto volverá a estado en ejecución para continuar.' }
      case 'cerrar': return { titulo: '¿Cerrar proyecto?', mensaje: 'El proyecto será cerrado definitivamente. Esta acción no se puede deshacer.' }
      case 'cancelar': return { titulo: '¿Cancelar proyecto?', mensaje: 'Esta acción cancelará el proyecto. No se puede deshacer.' }
      default: return { titulo: '', mensaje: '' }
    }
  }

  const formatFechaCorta = (dateStr: string) => {
    const d = new Date(dateStr)
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    const dia = d.getDate()
    const mes = meses[d.getMonth()]
    const anio = d.getFullYear()
    const hora = d.getHours().toString().padStart(2, '0')
    const min = d.getMinutes().toString().padStart(2, '0')
    return `${dia} ${mes} ${anio}, ${hora}:${min}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-[3px] border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
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
              <span className={`inline-flex items-center justify-center min-w-[70px] px-2 py-0.5 text-[9px] font-semibold rounded-md text-center whitespace-nowrap ${ESTADO_PROYECTO_COLORS[proyecto.estado] || 'bg-[#CCCCFF] text-gray-800'}`}>
                {ESTADO_PROYECTO_LABELS[proyecto.estado] || proyecto.estado}
              </span>
              <span className={`text-xs font-medium ${TIPO_PROYECTO_COLORS[proyecto.tipo] || 'text-gray-700'}`}>
                {TIPO_PROYECTO_LABELS[proyecto.tipo] || proyecto.tipo}
              </span>
              <span className={`inline-flex items-center justify-center min-w-[80px] px-4 py-1.5 text-[11px] font-semibold rounded-full ${PRIORIDAD_COLORS[proyecto.prioridad] || 'border border-gray-400 text-gray-600'}`}>
                {PRIORIDAD_LABELS[proyecto.prioridad] || proyecto.prioridad}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canEdit && (
              <button onClick={() => navigate(`${basePath}/${proyecto.id}/editar`)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-300 text-ink hover:bg-gray-50 transition-colors">
                <Edit size={14} /> Editar
              </button>
            )}
            {canSubmit && (
              <button onClick={() => setShowSubmitModal(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#0A0A0A] text-white hover:bg-gray-800 transition-colors">
                <Send size={14} /> Enviar a revisión
              </button>
            )}
            {canApprove && (
              <>
                <button onClick={() => setWorkflowAction('aprobar')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors">
                  <CheckCircle size={14} /> Aprobar
                </button>
                <button onClick={() => setWorkflowAction('rechazar')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors">
                  <XCircle size={14} /> Rechazar
                </button>
              </>
            )}
            {canStart && (
              <button onClick={() => setWorkflowAction('iniciar')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors">
                <Play size={14} /> Iniciar ejecución
              </button>
            )}
            {canSuspend && (
              <button onClick={() => setWorkflowAction('suspender')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#EAB308] text-white hover:bg-[#CA8A04] transition-colors">
                <Pause size={14} /> Suspender
              </button>
            )}
            {canResume && (
              <button onClick={() => setWorkflowAction('reanudar')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors">
                <Play size={14} /> Reanudar
              </button>
            )}
            {canFinalize && (
              <button onClick={() => setWorkflowAction('finalizar')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#0A0A0A] text-white hover:bg-gray-800 transition-colors">
                <StopCircle size={14} /> Finalizar proyecto
              </button>
            )}
            {canClose && (
              <button onClick={() => setWorkflowAction('cerrar')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#6B7280] text-white hover:bg-[#4B5563] transition-colors">
                <CheckCircle size={14} /> Cerrar proyecto
              </button>
            )}
            {canCancel && (
              <button onClick={() => setWorkflowAction('cancelar')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors">
                <Ban size={14} /> Cancelar
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
                tab === t.key ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Info */}
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
            <div className="col-span-2"><Field label="Resumen" value={proyecto.resumen || '-'} /></div>
            {proyecto.problema && <div className="col-span-2"><Field label="Problema" value={proyecto.problema} /></div>}
            {proyecto.justificacion && <div className="col-span-2"><Field label="Justificación" value={proyecto.justificacion} /></div>}
            {proyecto.objetivo_general && <div className="col-span-2"><Field label="Objetivo general" value={proyecto.objetivo_general} /></div>}
            {proyecto.resultados_esperados && <div className="col-span-2"><Field label="Resultados esperados" value={proyecto.resultados_esperados} /></div>}
          </div>
        </div>
      )}

      {/* Tab: Actividades */}
      {tab === 'actividades' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Actividades del proyecto <span className="text-ink-muted font-normal">({actividades.length} actividades)</span></h2>
            {canManageParticipants && (
              <button onClick={() => setShowAddActividad(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                <Plus size={14} /> Agregar actividad
              </button>
            )}
          </div>

          {loadingTab ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-[3px] border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : actividades.length === 0 ? (
            <div className="bg-white border border-line p-12 text-center">
              <FolderKanban size={40} className="mx-auto text-ink-light mb-3 opacity-40" />
              <p className="text-sm font-medium text-ink">No hay actividades registradas</p>
              <p className="text-xs text-ink-muted mt-1">Agrega las actividades que se ejecutarán en este proyecto</p>
              {canManageParticipants && (
                <button onClick={() => setShowAddActividad(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                  <Plus size={14} /> Agregar actividad
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {actividades.map((a) => {
                const responsableDocente = docentesList.find((d) => d.id === a.responsable)
                const porcentaje = parseFloat(a.porcentaje_ejecucion) || 0
                return (
                  <div key={a.id} className="bg-white border border-[#E5E7EB] p-4 flex items-start gap-4" style={{ borderRadius: '4px' }}>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-ink-muted">{a.codigo}</span>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-md ${ESTADO_ACTIVIDAD_COLORS[a.estado] || 'bg-gray-200 text-gray-700'}`}>
                          {ESTADO_ACTIVIDAD_PULSE[a.estado] && (
                            <span className="relative flex h-2 w-2">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${a.estado === 'EN_PROCESO' ? 'bg-blue-400' : a.estado === 'ATRASADA' ? 'bg-red-400' : 'bg-gray-400'}`}></span>
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${a.estado === 'EN_PROCESO' ? 'bg-blue-500' : a.estado === 'ATRASADA' ? 'bg-red-500' : 'bg-gray-500'}`}></span>
                            </span>
                          )}
                          {ESTADO_ACTIVIDAD_LABELS[a.estado] || a.estado}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-ink">{a.nombre}</h3>
                      {a.descripcion && <p className="text-xs text-ink-muted line-clamp-2">{a.descripcion}</p>}
                      <div className="flex items-center gap-4 text-xs text-ink-muted">
                        {a.fecha_inicio && a.fecha_fin && (
                          <span>{formatDate(a.fecha_inicio)} → {formatDate(a.fecha_fin)}</span>
                        )}
                        {responsableDocente && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-semibold">
                              {(responsableDocente.user_first_name?.[0] || '')}{(responsableDocente.user_last_name?.[0] || '')}
                            </div>
                            <span>{responsableDocente.user_first_name} {responsableDocente.user_last_name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden max-w-[200px]">
                          <div className="h-full bg-[#16A34A] rounded-full transition-all" style={{ width: `${porcentaje}%` }} />
                        </div>
                        <span className="text-xs text-[#374151] font-medium">{formatPercent(a.porcentaje_ejecucion)}</span>
                      </div>
                    </div>
                    {canManageParticipants && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditActividad(a)}
                          title="Editar actividad"
                          className="p-1.5 text-[#16A34A] hover:bg-emerald-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        {isAdmin() && (
                          <button
                            onClick={() => setDeleteActividad(a)}
                            title="Eliminar actividad"
                            className="p-1.5 text-[#DC2626] hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Participantes */}
      {tab === 'participantes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Participantes del proyecto <span className="text-ink-muted font-normal">({participantes.length} participantes)</span></h2>
            {canManageParticipants && (
              <button onClick={() => setShowAddParticipante(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                <Plus size={14} /> Agregar participante
              </button>
            )}
          </div>

          {loadingTab ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-[3px] border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : participantes.length === 0 ? (
            <div className="bg-white border border-line p-12 text-center">
              <Users size={40} className="mx-auto text-ink-light mb-3 opacity-40" />
              <p className="text-sm font-medium text-ink">No hay participantes registrados</p>
              <p className="text-xs text-ink-muted mt-1">Agrega docentes y estudiantes que participarán en este proyecto</p>
              {canManageParticipants && (
                <button onClick={() => setShowAddParticipante(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                  <Plus size={14} /> Agregar participante
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white border border-[#E5E7EB] overflow-hidden" style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <table className="w-full text-sm">
                <thead className="bg-[#F9FAFB] border-b-2 border-[#E5E7EB]">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Rol en proyecto</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Horas</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Estado</th>
                    {canManageParticipants && <th className="text-right px-4 py-3 text-xs font-semibold text-[#111827] uppercase tracking-wider">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {participantes.map((p, i) => {
                    const initials = (p.usuario_nombre || '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                    const horasComp = parseFloat(p.horas_comprometidas) || 0
                    const horasCumpl = parseFloat(p.horas_cumplidas) || 0
                    const horasPercent = horasComp > 0 ? Math.min((horasCumpl / horasComp) * 100, 100) : 0
                    return (
                      <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'} hover:bg-[#F0FDF4] transition-colors duration-150`}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {initials || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-[#374151]">{p.usuario_nombre || '-'}</p>
                              {p.usuario_codigo && <p className="text-xs text-ink-muted font-mono">{p.usuario_codigo}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-md ${ROL_COLORS[p.rol] || 'bg-gray-200 text-gray-700'}`}>
                            {p.rol === 'LIDER' && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                              </span>
                            )}
                            {ROL_LABELS[p.rol] || p.rol}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <span className="text-[#374151] text-xs font-medium">{p.horas_comprometidas || '0'}h / {p.horas_cumplidas || '0'}h</span>
                            <div className="w-20 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                              <div className="h-full bg-[#16A34A] rounded-full transition-all" style={{ width: `${horasPercent}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-md ${p.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                            {p.estado === 'ACTIVO' && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                            )}
                            {p.estado === 'ACTIVO' ? 'Activo' : p.estado === 'INACTIVO' ? 'Inactivo' : p.estado}
                          </span>
                        </td>
                        {canManageParticipants && (
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditParticipante(p)}
                                title="Editar participante"
                                className="p-1.5 text-[#16A34A] hover:bg-emerald-50 transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteParticipante(p)}
                                title="Eliminar participante"
                                className="p-1.5 text-[#DC2626] hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Historial */}
      {tab === 'historial' && (
        <div className="bg-white border border-line p-6">
          {loadingTab ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-[3px] border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : historial.length === 0 ? (
            <div className="text-center py-12">
              <Clock size={40} className="mx-auto text-ink-light mb-3 opacity-40" />
              <p className="text-sm text-ink-muted">Sin historial de cambios</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-6">
                {historial.map((h) => (
                  <div key={h.id} className="relative pl-10">
                    <div className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 border-white ${ACCION_COLORS[h.accion] || 'bg-gray-400'}`} />
                    <div className="space-y-0.5">
                      <p className="text-xs text-ink-muted">{formatFechaCorta(h.creado_en)}</p>
                      <p className="text-sm font-medium text-ink">{ACCION_LABELS[h.accion] || h.accion} — {h.entidad}</p>
                      <p className="text-xs text-ink-muted">por {h.usuario_nombre}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Submit for review */}
      <ConfirmModal
        isOpen={showSubmitModal}
        titulo="¿Enviar este proyecto a revisión?"
        mensaje="Ya no podrás editarlo hasta que sea revisado."
        onConfirm={async () => { await handleEnviarRevision(); setShowSubmitModal(false) }}
        onCancel={() => setShowSubmitModal(false)}
      />

      {/* Modal: Rechazar con motivo */}
      {workflowAction === 'rechazar' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-ink">Rechazar proyecto</h3>
            <p className="text-sm text-ink-muted">El proyecto volverá a estado Borrador. El responsable podrá corregirlo y reenviarlo.</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Motivo del rechazo *</label>
              <textarea value={rechazarMotivo} onChange={(e) => setRechazarMotivo(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Describe las observaciones o correcciones necesarias..." />
              {rechazarMotivo.length > 0 && rechazarMotivo.length < 10 && <p className="text-xs text-red-500 mt-1">Mínimo 10 caracteres</p>}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setWorkflowAction(null); setRechazarMotivo('') }} className="px-4 py-2 text-sm font-medium border border-gray-300 text-ink hover:bg-gray-50">Cancelar</button>
              <button onClick={handleRechazar} disabled={rechazarMotivo.trim().length < 10} className="px-4 py-2 text-sm font-medium bg-[#DC2626] text-white hover:bg-[#B91C1C] disabled:opacity-40 disabled:cursor-not-allowed">Rechazar proyecto</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Other workflow actions */}
      <ConfirmModal
        isOpen={workflowAction !== null && workflowAction !== 'rechazar'}
        titulo={getWorkflowModalContent().titulo}
        mensaje={getWorkflowModalContent().mensaje}
        onConfirm={handleWorkflowAction}
        onCancel={() => setWorkflowAction(null)}
      />

      {/* Modal: Agregar participante */}
      {showAddParticipante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 w-full max-w-md space-y-4" style={{ borderRadius: '8px' }}>
            <h3 className="text-lg font-semibold text-ink">Agregar participante</h3>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Buscar usuario *</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={selectedUser ? `${selectedUser.user_first_name} ${selectedUser.user_last_name}` : searchUser}
                    onChange={(e) => { setSelectedUser(null); setSearchUser(e.target.value) }}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="Buscar por nombre o código institucional..."
                  />
                  {selectedUser && (
                    <button onClick={() => { setSelectedUser(null); setSearchUser('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <XCircle size={14} />
                    </button>
                  )}
                </div>
                {searchResults.length > 0 && !selectedUser && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-40 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { setSelectedUser(u); setSearchUser(''); setSearchResults([]) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-center gap-3"
                      >
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                          {(u.user_first_name?.[0] || '')}{(u.user_last_name?.[0] || '')}
                        </div>
                        <div>
                          <span className="font-medium text-ink">{u.user_first_name} {u.user_last_name}</span>
                          <span className="ml-2 text-xs text-ink-muted">{u.codigo}</span>
                          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${u.rol === 'ADMIN' ? 'bg-red-100 text-red-700' : u.rol === 'COORDINADOR' ? 'bg-purple-100 text-purple-700' : u.rol === 'DOCENTE' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {u.rol}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchUser.length >= 2 && searchResults.length === 0 && !selectedUser && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 shadow-lg p-3 text-center text-xs text-ink-muted">
                    No se encontraron usuarios
                  </div>
                )}
                {!selectedUser && <p className="text-xs text-red-500 mt-1 hidden">Selecciona un usuario</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Rol en el proyecto *</label>
                <select value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value as RolParticipante)} className="w-full px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-accent">
                  <option value="">Selecciona un rol...</option>
                  <option value="LIDER">Líder</option>
                  <option value="DOCENTE">Docente</option>
                  <option value="ESTUDIANTE">Estudiante</option>
                  <option value="APOYO">Apoyo</option>
                  <option value="EXTERNO">Externo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Horas comprometidas</label>
                <input type="number" value={nuevasHoras} onChange={(e) => setNuevasHoras(e.target.value)} min="0" className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Ej: 40" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Observaciones</label>
                <textarea value={nuevasObs} onChange={(e) => setNuevasObs(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Observaciones adicionales..." />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={handleAddParticipante} disabled={!selectedUser || addingParticipant} className="w-full px-4 py-2.5 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {addingParticipant ? 'Agregando...' : 'Agregar participante'}
              </button>
              <button onClick={() => { setShowAddParticipante(false); setSelectedUser(null); setSearchUser(''); setSearchResults([]) }} className="w-full px-4 py-2.5 text-sm font-medium border border-gray-300 text-ink hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar participante */}
      {editParticipante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 w-full max-w-md space-y-4" style={{ borderRadius: '8px' }}>
            <h3 className="text-lg font-semibold text-ink">Editar participante</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Usuario</label>
                <div className="flex items-center gap-3 px-3 py-2 border border-gray-200 bg-gray-50">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                    {(editParticipante.usuario_nombre || '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{editParticipante.usuario_nombre}</p>
                    {editParticipante.usuario_codigo && <p className="text-xs text-ink-muted font-mono">{editParticipante.usuario_codigo}</p>}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Rol en el proyecto *</label>
                <select value={editRol} onChange={(e) => setEditRol(e.target.value as RolParticipante)} className="w-full px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-accent">
                  <option value="LIDER">Líder</option>
                  <option value="DOCENTE">Docente</option>
                  <option value="ESTUDIANTE">Estudiante</option>
                  <option value="APOYO">Apoyo</option>
                  <option value="EXTERNO">Externo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Horas comprometidas</label>
                <input type="number" value={editHoras} onChange={(e) => setEditHoras(e.target.value)} min="0" className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Ej: 40" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Estado</label>
                <select value={editEstado} onChange={(e) => setEditEstado(e.target.value as EstadoParticipante)} className="w-full px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-accent">
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Observaciones</label>
                <textarea value={editObs} onChange={(e) => setEditObs(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Observaciones adicionales..." />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={handleEditParticipante} disabled={savingParticipante} className="w-full px-4 py-2.5 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {savingParticipante ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button onClick={() => setEditParticipante(null)} className="w-full px-4 py-2.5 text-sm font-medium border border-gray-300 text-ink hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Eliminar participante */}
      {deleteParticipante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 w-full max-w-md space-y-4" style={{ borderRadius: '8px' }}>
            <h3 className="text-lg font-semibold text-ink">¿Eliminar participante?</h3>
            <p className="text-sm text-ink-muted">¿Estás seguro de eliminar a <strong>{deleteParticipante.usuario_nombre}</strong> del proyecto? Esta acción no se puede deshacer.</p>
            <div className="flex flex-col gap-2">
              <button onClick={handleDeleteParticipante} className="w-full px-4 py-2.5 text-sm font-medium bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors">
                Sí, eliminar
              </button>
              <button onClick={() => setDeleteParticipante(null)} className="w-full px-4 py-2.5 text-sm font-medium border border-gray-300 text-ink hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agregar/Editar actividad */}
      {(showAddActividad || editActividad) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto" style={{ borderRadius: '8px' }}>
            <h3 className="text-lg font-semibold text-ink">{editActividad ? 'Editar actividad' : 'Nueva actividad'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Código *</label>
                <input value={actCodigo} onChange={(e) => setActCodigo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Ej: ACT-001" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre *</label>
                <input value={actNombre} onChange={(e) => setActNombre(e.target.value)} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Nombre de la actividad" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Descripción</label>
              <textarea value={actDesc} onChange={(e) => setActDesc(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Descripción..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Objetivo relacionado</label>
              <select value={actObjetivo} onChange={(e) => setActObjetivo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-accent">
                <option value="">Seleccionar objetivo...</option>
                {objetivosList.map((o) => (
                  <option key={o.id} value={o.id}>{o.descripcion}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Responsable</label>
              <select value={actResponsable} onChange={(e) => setActResponsable(e.target.value)} className="w-full px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-accent">
                <option value="">Seleccionar responsable...</option>
                {docentesList.map((d) => (
                  <option key={d.id} value={d.id}>{d.user_first_name} {d.user_last_name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha inicio *</label>
                <input type="date" value={actFechaInicio} onChange={(e) => setActFechaInicio(e.target.value)} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha fin *</label>
                <input type="date" value={actFechaFin} onChange={(e) => setActFechaFin(e.target.value)} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={actRequiereEvidencia} onChange={(e) => setActRequiereEvidencia(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
              <span className="text-sm text-ink">¿Esta actividad requiere registro de evidencias?</span>
            </label>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Observaciones</label>
              <textarea value={actObs} onChange={(e) => setActObs(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Observaciones..." />
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={editActividad ? handleEditActividad : handleAddActividad}
                disabled={addingActividad || savingActividad}
                className="w-full px-4 py-2.5 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {(addingActividad || savingActividad) ? 'Guardando...' : (editActividad ? 'Guardar cambios' : 'Crear actividad')}
              </button>
              <button onClick={closeActividadModal} className="w-full px-4 py-2.5 text-sm font-medium border border-gray-300 text-ink hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Eliminar actividad */}
      {deleteActividad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 w-full max-w-md space-y-4" style={{ borderRadius: '8px' }}>
            <h3 className="text-lg font-semibold text-ink">¿Eliminar esta actividad?</h3>
            <p className="text-sm text-ink-muted">Esta acción eliminará también todos los avances y evidencias asociados.</p>
            <div className="flex flex-col gap-2">
              <button onClick={handleDeleteActividad} className="w-full px-4 py-2.5 text-sm font-medium bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors">
                Sí, eliminar
              </button>
              <button onClick={() => setDeleteActividad(null)} className="w-full px-4 py-2.5 text-sm font-medium border border-gray-300 text-ink hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
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
