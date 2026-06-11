import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Send, Info, ListTodo, Users, Clock,
  CheckCircle, XCircle, Play, Pause, StopCircle, Ban,
  Plus, Trash2, FolderKanban, Search, Pencil, UserPlus,
  ListPlus, ChevronRight, FileText, Calendar, Target,
  Hash, Building2
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { proyectosApi, actividadesApi, participantesApi, auditoriaApi } from '@/api/proyectos'
import { usuariosApi } from '@/api/usuarios'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { ConfirmModal } from '@/components/ui'
import {
  ESTADO_PROYECTO_LABELS,
  TIPO_PROYECTO_LABELS,
  PRIORIDAD_LABELS,
} from '@/lib/constants'
import { formatDate, formatPercent, formatCurrency } from '@/lib/formatters'
import { API_BASE } from '@/config/api'
import type {
  Proyecto, Actividad, ParticipanteProyecto,
  EstadoProyecto, RolParticipante, EstadoParticipante
} from '@/types/proyectos'
import type { Usuario } from '@/types/usuarios'
import type { AuditoriaRegistro } from '@/api/proyectos'
import InformesSection from '@/features/seguimiento/InformesSection'

type Tab = 'info' | 'actividades' | 'participantes' | 'informes' | 'historial'
type WorkflowAction = 'aprobar' | 'rechazar' | 'iniciar' | 'suspender' | 'finalizar' | 'reanudar' | 'cerrar' | 'cancelar' | null

const TABS: { key: Tab; label: string; icon: typeof Info }[] = [
  { key: 'info', label: 'Información', icon: Info },
  { key: 'actividades', label: 'Actividades', icon: ListTodo },
  { key: 'participantes', label: 'Participantes', icon: Users },
  { key: 'informes', label: 'Informes', icon: FileText },
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

const PARTICIPANTE_AVATAR_COLORS: Record<string, string> = {
  LIDER: 'bg-[#DCFCE7] text-[#15803D]',
  DOCENTE: 'bg-[#DCFCE7] text-[#15803D]',
  ESTUDIANTE: 'bg-[#F3F4F6] text-[#6B7280]',
  APOYO: 'bg-[#DBEAFE] text-[#1D4ED8]',
  EXTERNO: 'bg-[#DBEAFE] text-[#1D4ED8]',
}

const ESTADO_ACTIVIDAD_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-[#F3F4F6] text-[#6B7280]',
  EN_PROCESO: 'bg-[#DBEAFE] text-[#1D4ED8]',
  COMPLETADA: 'bg-[#DCFCE7] text-[#15803D]',
  ATRASADA: 'bg-[#FEE2E2] text-[#B91C1C]',
  CANCELADA: 'bg-[#E5E7EB] text-[#374151]',
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

const COVER_IMAGES: Record<string, string> = {
  VINCULACION: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1600&q=80',
  INVESTIGACION: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1600&q=80',
  EXTENSION: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80',
  MIXTO: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
}

const PRIORIDAD_BADGE_HERO: Record<string, { bg: string; text: string }> = {
  BAJA: { bg: 'rgba(255,255,255,0.15)', text: 'rgba(255,255,255,0.8)' },
  MEDIA: { bg: 'rgba(255,255,255,0.2)', text: '#FFFFFF' },
  ALTA: { bg: 'rgba(234,179,8,0.3)', text: '#FEF08A' },
  CRITICA: { bg: 'rgba(234,179,8,0.3)', text: '#FEF08A' },
}

function formatFechaBanner(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return `${d.getDate().toString().padStart(2, '0')} de ${meses[d.getMonth()]}, ${d.getFullYear()}`
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
    if (!id || !actNombre.trim() || !actFechaInicio || !actFechaFin) {
      toast.error('Completa los campos obligatorios')
      return
    }
    if (actFechaFin < actFechaInicio) {
      toast.error('La fecha fin debe ser posterior a la fecha de inicio')
      return
    }
    const nums = actividades.map(a => {
      const match = a.codigo.match(/ACT-(\d+)/)
      return match ? parseInt(match[1] || '0', 10) : 0
    })
    const max = Math.max(0, ...nums)
    const codigo = `ACT-${String(max + 1).padStart(3, '0')}`
    setAddingActividad(true)
    try {
      await actividadesApi.create({
        proyecto: Number(id),
        codigo,
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
    if (!editActividad || !actNombre.trim() || !actFechaInicio || !actFechaFin) {
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

  const diasRestantes = (fechaFin: string | null) => {
    if (!fechaFin) return null
    const fin = new Date(fechaFin)
    const hoy = new Date()
    const diff = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const progresoGeneral = actividades.length > 0
    ? Math.round(actividades.reduce((acc, a) => acc + (parseFloat(a.porcentaje_ejecucion) || 0), 0) / actividades.length)
    : 0
  const actividadesCompletadas = actividades.filter(a => a.estado === 'COMPLETADA').length

  const coverImage = (() => {
    if (!proyecto?.imagen_portada) {
      return proyecto?.tipo ? COVER_IMAGES[proyecto.tipo] || COVER_IMAGES.MIXTO : COVER_IMAGES.MIXTO
    }
    if (proyecto.imagen_portada.startsWith('http')) {
      return proyecto.imagen_portada
    }
    const separator = proyecto.imagen_portada.startsWith('/') ? '' : '/'
    return `${window.location.origin}${separator}${proyecto.imagen_portada}`
  })()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-[3px] border-[#E5E7EB] border-t-[#16A34A] rounded-full animate-spin" />
      </div>
    )
  }

  if (!proyecto) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[#6B7280]">Proyecto no encontrado</p>
        <button onClick={() => navigate(basePath)} className="mt-4 text-sm text-[#16A34A] hover:underline">Volver a proyectos</button>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* ════════════════════════════════════════
          SECCIÓN 1 — BREADCRUMB Y BOTONES
          ════════════════════════════════════════ */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-sm text-[#6B7280]">
          <ArrowLeft size={16} />
          <button onClick={() => navigate(basePath)} className="hover:text-[#0A0A0A] transition-colors">Volver a Proyectos</button>
          <span className="text-[#E5E7EB]">/</span>
          <span className="text-[#6B7280]">Detalle de Proyecto</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Botones de flujo según estado */}
          {canSubmit && (
            <button onClick={() => setShowSubmitModal(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#0A0A0A] text-white hover:bg-gray-800 transition-colors" style={{ borderRadius: 0 }}>
              <Send size={14} /> Enviar a revisión
            </button>
          )}
          {canApprove && (
            <>
              <button onClick={() => setWorkflowAction('aprobar')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors" style={{ borderRadius: 0 }}>
                <CheckCircle size={14} /> Aprobar
              </button>
              <button onClick={() => setWorkflowAction('rechazar')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors" style={{ borderRadius: 0 }}>
                <XCircle size={14} /> Rechazar
              </button>
            </>
          )}
          {canStart && (
            <button onClick={() => setWorkflowAction('iniciar')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors" style={{ borderRadius: 0 }}>
              <Play size={14} /> Iniciar ejecución
            </button>
          )}
          {canSuspend && (
            <button onClick={() => setWorkflowAction('suspender')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#EAB308] text-[#0A0A0A] hover:bg-[#CA8A04] transition-colors" style={{ borderRadius: 0 }}>
              <Pause size={14} /> Suspender
            </button>
          )}
          {canResume && (
            <button onClick={() => setWorkflowAction('reanudar')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors" style={{ borderRadius: 0 }}>
              <Play size={14} /> Reanudar
            </button>
          )}
          {canFinalize && (
            <button onClick={() => setWorkflowAction('finalizar')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#6B7280] text-white hover:bg-[#4B5563] transition-colors" style={{ borderRadius: 0 }}>
              <StopCircle size={14} /> Finalizar proyecto
            </button>
          )}
          {canClose && (
            <button onClick={() => setWorkflowAction('cerrar')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#374151] text-white hover:bg-[#1F2937] transition-colors" style={{ borderRadius: 0 }}>
              <CheckCircle size={14} /> Cerrar proyecto
            </button>
          )}
          {canCancel && (
            <button onClick={() => setWorkflowAction('cancelar')} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors" style={{ borderRadius: 0 }}>
              <Ban size={14} /> Cancelar
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => navigate(`${basePath}/${proyecto.id}/editar`)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors"
              style={{ borderRadius: 0 }}
            >
              <Pencil size={14} /> Editar proyecto
            </button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════
          SECCIÓN 2 — HERO / BANNER
          ════════════════════════════════════════ */}
      <div className="relative w-full h-[280px] overflow-hidden" style={{ borderRadius: '8px 8px 0 0' }}>
        <img
          src={coverImage}
          alt="Portada del proyecto"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }}
        />
        {/* Contenido sobre el banner */}
        <div className="absolute bottom-0 left-0 right-0 p-6 px-7">
          {/* Línea de badges */}
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            {/* Badge estado con pulse */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-white" style={{ borderRadius: '20px', background: '#16A34A' }}>
              {ESTADO_PROYECTO_PULSE[proyecto.estado] && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-white" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
              )}
              {ESTADO_PROYECTO_LABELS[proyecto.estado] || proyecto.estado}
            </span>
            {/* Badge tipo */}
            <span className="inline-flex items-center px-3 py-1 text-[11px] font-semibold text-white" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.2)' }}>
              {TIPO_PROYECTO_LABELS[proyecto.tipo] || proyecto.tipo}
            </span>
            {/* Badge prioridad */}
            {(() => {
              const pb = PRIORIDAD_BADGE_HERO[proyecto.prioridad] || PRIORIDAD_BADGE_HERO.MEDIA
              return (
                <span className="inline-flex items-center px-3 py-1 text-[11px] font-semibold" style={{ borderRadius: '20px', background: pb!.bg, color: pb!.text }}>
                  {PRIORIDAD_LABELS[proyecto.prioridad] || proyecto.prioridad}
                </span>
              )
            })()}
          </div>
          {/* Título */}
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight" style={{ margin: '10px 0 12px' }}>
            {proyecto.titulo}
          </h1>
          {/* Línea de metadatos */}
          <div className="flex items-center gap-3 flex-wrap text-[12px]" style={{ color: 'rgba(255,255,255,0.8)' }}>
            <span className="inline-flex items-center gap-1">
              <Hash size={12} /> {proyecto.codigo}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
            <span className="inline-flex items-center gap-1">
              <Users size={12} /> {proyecto.responsable_nombre || 'Sin responsable'}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
            <span className="inline-flex items-center gap-1">
              <Building2 size={12} /> {proyecto.carrera_nombre || 'Sin carrera'}
            </span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          SECCIÓN 3 — BARRA DE MÉTRICAS
          ════════════════════════════════════════ */}
      <div className="bg-white flex overflow-hidden" style={{ borderRadius: '0 0 8px 8px', border: '0.5px solid #E5E7EB', borderTop: 'none', padding: '16px 28px' }}>
        {/* Métrica 1 */}
        <div className="flex-1" style={{ borderRight: '0.5px solid #E5E7EB', padding: '0 24px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: '4px' }}>Fecha de inicio</p>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#0A0A0A' }}>{formatFechaBanner(proyecto.fecha_inicio)}</p>
        </div>
        {/* Métrica 2 */}
        <div className="flex-1" style={{ borderRight: '0.5px solid #E5E7EB', padding: '0 24px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: '4px' }}>Fecha fin planificada</p>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#0A0A0A' }}>{formatFechaBanner(proyecto.fecha_fin_planificada)}</p>
        </div>
        {/* Métrica 3 */}
        <div className="flex-1" style={{ borderRight: '0.5px solid #E5E7EB', padding: '0 24px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: '4px' }}>Presupuesto asignado</p>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#16A34A' }}>
            {proyecto.presupuesto_aprobado ? formatCurrency(proyecto.presupuesto_aprobado) : '-'}
          </p>
        </div>
        {/* Métrica 4 */}
        <div className="flex-1" style={{ padding: '0 24px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: '4px' }}>Progreso general</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-[6px] bg-[#E5E7EB] rounded-full overflow-hidden" style={{ maxWidth: 120 }}>
              <div className="h-full bg-[#16A34A] rounded-full transition-all" style={{ width: `${progresoGeneral}%` }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#16A34A' }}>{progresoGeneral}%</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          SECCIÓN 4 — CONTENIDO PRINCIPAL
          ════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5" style={{ marginTop: '20px' }}>
        {/* ─── COLUMNA IZQUIERDA ─── */}
        <div className="space-y-0">
          {/* Descripción del proyecto */}
          <div className="bg-white mb-4" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '20px 24px' }}>
            <div className="flex items-center gap-2.5 mb-3.5">
              <FileText size={18} style={{ color: '#16A34A' }} />
              <h2 style={{ fontSize: '15px', fontWeight: 500, color: '#0A0A0A' }}>Descripción del proyecto</h2>
            </div>
            <div style={{ fontSize: '13px', lineHeight: '1.7', color: '#6B7280' }}>
              {[proyecto.resumen, proyecto.descripcion, proyecto.problema, proyecto.justificacion, proyecto.resultados_esperados]
                .filter(Boolean)
                .join('\n\n') || 'Sin descripción'}
            </div>
          </div>

          {/* Objetivo general */}
          {proyecto.objetivo_general && (
            <div className="bg-white mb-4" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '20px 24px' }}>
              <div className="flex items-center gap-2.5 mb-3.5">
                <Target size={18} style={{ color: '#16A34A' }} />
                <h2 style={{ fontSize: '15px', fontWeight: 500, color: '#0A0A0A' }}>Objetivo general</h2>
              </div>
              <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#6B7280' }}>{proyecto.objetivo_general}</p>
            </div>
          )}

          {/* Cronograma de actividades */}
          <div className="bg-white mb-4" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '20px 24px' }}>
            <div className="flex items-center gap-2.5 mb-3.5">
              <Calendar size={18} style={{ color: '#16A34A' }} />
              <h2 style={{ fontSize: '15px', fontWeight: 500, color: '#0A0A0A' }}>Cronograma de actividades</h2>
            </div>
            {actividades.length === 0 && (
              <div className="text-center py-6">
                <p style={{ fontSize: '13px', color: '#6B7280' }}>No hay actividades registradas</p>
              </div>
            )}
            <div className="relative space-y-0">
              {/* Línea vertical */}
              <div className="absolute left-[15px] top-1 bottom-1 w-[2px] bg-[#16A34A]" />
              {actividades.slice(0, 5).map((a) => {
                const porcentaje = parseFloat(a.porcentaje_ejecucion) || 0
                return (
                  <div key={a.id} className="relative flex items-start gap-4 py-2.5">
                    {/* Círculo de estado */}
                    <div className="relative z-10 flex-shrink-0 flex items-center justify-center" style={{ width: 32, height: 32 }}>
                      {a.estado === 'COMPLETADA' ? (
                        <div className="w-full h-full flex items-center justify-center bg-[#16A34A] text-white" style={{ borderRadius: '50%' }}>
                          <CheckCircle size={14} />
                        </div>
                      ) : a.estado === 'EN_PROCESO' ? (
                        <div className="w-full h-full flex items-center justify-center bg-[#16A34A] text-white animate-pulse" style={{ borderRadius: '50%' }}>
                          <div className="w-2.5 h-2.5 bg-white rounded-full" />
                        </div>
                      ) : a.estado === 'ATRASADA' ? (
                        <div className="w-full h-full flex items-center justify-center bg-[#DC2626] text-white animate-pulse" style={{ borderRadius: '50%' }}>
                          <div className="w-2.5 h-2.5 bg-white rounded-full" />
                        </div>
                      ) : a.estado === 'CANCELADA' ? (
                        <div className="w-full h-full flex items-center justify-center bg-[#9CA3AF] text-white" style={{ borderRadius: '50%' }}>
                          <div className="w-2.5 h-2.5 bg-white rounded-full" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#E5E7EB] text-white" style={{ borderRadius: '50%' }}>
                          <div className="w-2.5 h-2.5 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0A' }}>{a.nombre}</p>
                        <span style={{ fontSize: '11px', color: '#6B7280', flexShrink: 0 }}>{a.fecha_fin ? formatDate(a.fecha_fin) : ''}</span>
                      </div>
                      {a.descripcion && <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }} className="line-clamp-2">{a.descripcion}</p>}
                      {a.estado === 'EN_PROCESO' && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-[4px] bg-[#E5E7EB] rounded-full overflow-hidden" style={{ maxWidth: 160 }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${porcentaje}%`, background: porcentaje > 80 ? '#16A34A' : porcentaje > 40 ? '#EAB308' : '#16A34A' }} />
                          </div>
                          <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>{formatPercent(a.porcentaje_ejecucion)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {actividades.length > 5 && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setTab('actividades')}
                    style={{ fontSize: '12px', color: '#16A34A', fontWeight: 500 }}
                    className="hover:text-[#15803D] transition-colors"
                  >
                    Ver todas las actividades ({actividades.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── COLUMNA DERECHA ─── */}
        <div className="space-y-0">
          {/* Integrantes */}
          <div className="bg-white mb-4" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '20px 24px' }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Integrantes</span>
              <button onClick={() => setTab('participantes')} style={{ fontSize: '11px', color: '#16A34A', fontWeight: 500 }} className="hover:text-[#15803D] transition-colors">Ver todos →</button>
            </div>
            <div className="space-y-2.5">
              {participantes.slice(0, 4).map((p) => {
                const initials = (p.usuario_nombre || '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                const avatarCls = PARTICIPANTE_AVATAR_COLORS[p.rol] || PARTICIPANTE_AVATAR_COLORS.ESTUDIANTE
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className={`w-[34px] h-[34px] flex items-center justify-center text-[11px] font-bold rounded-full flex-shrink-0 ${avatarCls}`}>
                      {initials || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0A' }} className="truncate">{p.usuario_nombre || '-'}</p>
                      <p style={{ fontSize: '11px', color: '#6B7280' }}>{ROL_LABELS[p.rol] || p.rol}</p>
                    </div>
                  </div>
                )
              })}
              {participantes.length === 0 && (
                <p style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center', padding: '8px 0' }}>No hay participantes registrados</p>
              )}
            </div>
            {canManageParticipants && (
              <button
                onClick={() => setShowAddParticipante(true)}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 text-sm font-medium text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
                style={{ border: '0.5px solid #E5E7EB', borderRadius: 0, padding: '8px 0' }}
              >
                <Plus size={14} /> Agregar integrante
              </button>
            )}
          </div>

          {/* Información clave */}
          <div className="bg-white" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '20px 24px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '14px' }}>Información clave</span>
            <div className="space-y-0">
              <InfoRow label="Responsable" value={proyecto.responsable_nombre || '-'} />
              <InfoRow label="Carrera" value={proyecto.carrera_nombre || '-'} />
              <InfoRow label="Coordinador académico" value={proyecto.coordinador_academico ? (typeof proyecto.coordinador_academico === 'object' ? (proyecto.coordinador_academico as unknown as { user: { first_name: string; last_name: string } }).user.first_name + ' ' + (proyecto.coordinador_academico as unknown as { user: { first_name: string; last_name: string } }).user.last_name : '-') : '-'} />
              <InfoRow label="Total participantes" value={String(participantes.length)} />
              <InfoRow label="Actividades completadas" value={`${actividadesCompletadas}/${actividades.length}`} />
              {(() => {
                const d = diasRestantes(proyecto.fecha_fin_planificada)
                if (d === null) return null
                let color = '#16A34A'
                if (d <= 0) color = '#DC2626'
                else if (d <= 30) color = '#EAB308'
                return (
                  <InfoRow
                    label="Días restantes"
                    value={d < 0 ? `${Math.abs(d)} días vencidos` : `${d} días restantes`}
                    valueStyle={{ color, fontWeight: 700 }}
                  />
                )
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          SECCIÓN 5 — TABS
          ════════════════════════════════════════ */}
      <div className="bg-white border-b border-[#E5E7EB]" style={{ marginTop: '24px' }}>
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'border-b-[2px] border-[#16A34A] text-[#0A0A0A] font-medium'
                  : 'border-b-[2px] border-transparent text-[#6B7280] hover:text-[#0A0A0A]'
              }`}
              style={{ fontWeight: tab === t.key ? 500 : 400 }}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════
          TAB: INFORMACIÓN
          ════════════════════════════════════════ */}
      {tab === 'info' && (
        <div className="bg-white" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '20px 24px' }}>
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
            <Field label="Presupuesto" value={proyecto.presupuesto_aprobado ? formatCurrency(proyecto.presupuesto_aprobado) : '-'} />
            <Field label="Dirección ejecución" value={proyecto.direccion_ejecucion || '-'} />
            <div className="col-span-2"><Field label="Resumen" value={proyecto.resumen || '-'} /></div>
            {proyecto.problema && <div className="col-span-2"><Field label="Problema" value={proyecto.problema} /></div>}
            {proyecto.justificacion && <div className="col-span-2"><Field label="Justificación" value={proyecto.justificacion} /></div>}
            {proyecto.objetivo_general && <div className="col-span-2"><Field label="Objetivo general" value={proyecto.objetivo_general} /></div>}
            {proyecto.resultados_esperados && <div className="col-span-2"><Field label="Resultados esperados" value={proyecto.resultados_esperados} /></div>}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB: ACTIVIDADES
          ════════════════════════════════════════ */}
      {tab === 'actividades' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0A' }}>Actividades del proyecto <span style={{ fontWeight: 400, color: '#6B7280' }}>({actividades.length} actividades)</span></h2>
            {canManageParticipants && (
              <button onClick={() => setShowAddActividad(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors" style={{ borderRadius: 0 }}>
                <Plus size={14} /> Agregar actividad
              </button>
            )}
          </div>

          {loadingTab ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-[3px] border-[#E5E7EB] border-t-[#16A34A] rounded-full animate-spin" />
            </div>
          ) : actividades.length === 0 ? (
            <div className="bg-white text-center" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '48px 24px' }}>
              <FolderKanban size={40} className="mx-auto text-[#E5E7EB] mb-3" />
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0A' }}>No hay actividades registradas</p>
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Agrega las actividades que se ejecutarán en este proyecto</p>
              {canManageParticipants && (
                <button onClick={() => setShowAddActividad(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors" style={{ borderRadius: 0 }}>
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
                  <div key={a.id} className="bg-white flex items-start gap-4" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '16px 20px' }}>
                    <button
                      type="button"
                      onClick={() => navigate(`${basePath}/${a.proyecto}/actividades/${a.id}`)}
                      className="flex-1 min-w-0 space-y-2 text-left hover:opacity-90 transition-opacity"
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#6B7280' }}>{a.codigo}</span>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-md ${ESTADO_ACTIVIDAD_COLORS[a.estado] || 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                          {ESTADO_ACTIVIDAD_PULSE[a.estado] && (
                            <span className="relative flex h-2 w-2">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${a.estado === 'EN_PROCESO' ? 'bg-[#2563EB]' : a.estado === 'ATRASADA' ? 'bg-[#DC2626]' : 'bg-[#9CA3AF]'}`}></span>
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${a.estado === 'EN_PROCESO' ? 'bg-[#2563EB]' : a.estado === 'ATRASADA' ? 'bg-[#DC2626]' : 'bg-[#9CA3AF]'}`}></span>
                            </span>
                          )}
                          {ESTADO_ACTIVIDAD_LABELS[a.estado] || a.estado}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0A' }}>{a.nombre}</h3>
                      {a.descripcion && <p style={{ fontSize: '12px', color: '#6B7280' }} className="line-clamp-2">{a.descripcion}</p>}
                      <div className="flex items-center gap-4 text-xs" style={{ color: '#6B7280' }}>
                        {a.fecha_inicio && a.fecha_fin && (
                          <span>{formatDate(a.fecha_inicio)} → {formatDate(a.fecha_fin)}</span>
                        )}
                        {responsableDocente && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center text-[9px] font-semibold">
                              {(responsableDocente.user_first_name?.[0] || '')}{(responsableDocente.user_last_name?.[0] || '')}
                            </div>
                            <span>{responsableDocente.user_first_name} {responsableDocente.user_last_name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-[6px] bg-[#E5E7EB] rounded-full overflow-hidden" style={{ maxWidth: 200 }}>
                          <div className="h-full bg-[#16A34A] rounded-full transition-all" style={{ width: `${porcentaje}%` }} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>{formatPercent(a.porcentaje_ejecucion)}</span>
                      </div>
                    </button>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => navigate(`${basePath}/${a.proyecto}/actividades/${a.id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#16A34A] hover:bg-[#F0FDF4] transition-colors"
                        style={{ borderRadius: 0 }}
                      >
                        Ver detalle <ChevronRight size={12} />
                      </button>
                      {canManageParticipants && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditActividad(a)}
                            title="Editar actividad"
                            className="p-1.5 text-[#16A34A] hover:bg-[#F0FDF4] transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          {isAdmin() && (
                            <button
                              onClick={() => setDeleteActividad(a)}
                              title="Eliminar actividad"
                              className="p-1.5 text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB: PARTICIPANTES
          ════════════════════════════════════════ */}
      {tab === 'participantes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0A' }}>Participantes del proyecto <span style={{ fontWeight: 400, color: '#6B7280' }}>({participantes.length} participantes)</span></h2>
            {canManageParticipants && (
              <button onClick={() => setShowAddParticipante(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors" style={{ borderRadius: 0 }}>
                <Plus size={14} /> Agregar participante
              </button>
            )}
          </div>

          {loadingTab ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-[3px] border-[#E5E7EB] border-t-[#16A34A] rounded-full animate-spin" />
            </div>
          ) : participantes.length === 0 ? (
            <div className="bg-white text-center" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '48px 24px' }}>
              <Users size={40} className="mx-auto text-[#E5E7EB] mb-3" />
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0A' }}>No hay participantes registrados</p>
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Agrega docentes y estudiantes que participarán en este proyecto</p>
              {canManageParticipants && (
                <button onClick={() => setShowAddParticipante(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors" style={{ borderRadius: 0 }}>
                  <Plus size={14} /> Agregar participante
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white overflow-hidden" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px' }}>
              <table className="w-full text-sm">
                <thead className="bg-[#F9FAFB]" style={{ borderBottom: '0.5px solid #E5E7EB' }}>
                  <tr>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#0A0A0A] uppercase tracking-wider">Nombre</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#0A0A0A] uppercase tracking-wider">Rol en proyecto</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#0A0A0A] uppercase tracking-wider">Horas</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#0A0A0A] uppercase tracking-wider">Estado</th>
                    {canManageParticipants && <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#0A0A0A] uppercase tracking-wider">Acciones</th>}
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
                            <div className="w-8 h-8 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {initials || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-[#374151]">{p.usuario_nombre || '-'}</p>
                              {p.usuario_codigo && <p className="text-xs text-[#6B7280] font-mono">{p.usuario_codigo}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-md ${ROL_COLORS[p.rol] || 'bg-[#F3F4F6] text-[#6B7280]'}`}>
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
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-md ${p.estado === 'ACTIVO' ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                            {p.estado === 'ACTIVO' && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]"></span>
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
                                className="p-1.5 text-[#16A34A] hover:bg-[#F0FDF4] transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteParticipante(p)}
                                title="Eliminar participante"
                                className="p-1.5 text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
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

      {/* ════════════════════════════════════════
          TAB: INFORMES
          ════════════════════════════════════════ */}
      {tab === 'informes' && (
        <div className="bg-white" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '20px 24px' }}>
          <InformesSection
            proyectoId={Number(id)}
            responsableId={responsableId}
          />
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB: HISTORIAL
          ════════════════════════════════════════ */}
      {tab === 'historial' && (
        <div className="bg-white" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '20px 24px' }}>
          {loadingTab ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-[3px] border-[#E5E7EB] border-t-[#16A34A] rounded-full animate-spin" />
            </div>
          ) : historial.length === 0 ? (
            <div className="text-center py-12">
              <Clock size={40} className="mx-auto text-[#E5E7EB] mb-3" />
              <p style={{ fontSize: '14px', color: '#6B7280' }}>Sin historial de cambios</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-[#E5E7EB]" />
              <div className="space-y-6">
                {historial.map((h) => (
                  <div key={h.id} className="relative pl-10">
                    <div className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-[2px] border-white ${ACCION_COLORS[h.accion] || 'bg-[#9CA3AF]'}`} />
                    <div className="space-y-0.5">
                      <p style={{ fontSize: '12px', color: '#6B7280' }}>{formatFechaCorta(h.creado_en)}</p>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#0A0A0A' }}>{ACCION_LABELS[h.accion] || h.accion} — {h.entidad}</p>
                      <p style={{ fontSize: '12px', color: '#6B7280' }}>por {h.usuario_nombre}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          MODALES (mantenidos intactos)
          ════════════════════════════════════════ */}
      <ConfirmModal
        isOpen={showSubmitModal}
        titulo="¿Enviar este proyecto a revisión?"
        mensaje="Ya no podrás editarlo hasta que sea revisado."
        onConfirm={async () => { await handleEnviarRevision(); setShowSubmitModal(false) }}
        onCancel={() => setShowSubmitModal(false)}
      />

      <Modal
        open={workflowAction === 'rechazar'}
        onClose={() => { setWorkflowAction(null); setRechazarMotivo('') }}
        title="Rechazar proyecto"
        subtitle="El proyecto volverá a estado Borrador para correcciones."
        icon={<XCircle size={20} className="text-[#DC2626]" />}
        footer={
          <>
            <button onClick={() => { setWorkflowAction(null); setRechazarMotivo('') }} className="px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors" style={{ borderRadius: 0 }}>
              Cancelar
            </button>
            <button onClick={handleRechazar} disabled={rechazarMotivo.trim().length < 10} className="px-4 py-2 text-sm font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors" style={{ borderRadius: 0 }}>
              Rechazar proyecto
            </button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">Motivo del rechazo *</label>
          <textarea
            value={rechazarMotivo}
            onChange={(e) => setRechazarMotivo(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626] transition-colors resize-none"
            style={{ borderRadius: 0 }}
            placeholder="Describe las observaciones o correcciones necesarias..."
          />
          {rechazarMotivo.length > 0 && rechazarMotivo.length < 10 && (
            <p className="text-xs text-[#DC2626] mt-1.5">Mínimo 10 caracteres ({rechazarMotivo.length}/10)</p>
          )}
        </div>
      </Modal>

      <ConfirmModal
        isOpen={workflowAction !== null && workflowAction !== 'rechazar'}
        titulo={getWorkflowModalContent().titulo}
        mensaje={getWorkflowModalContent().mensaje}
        onConfirm={handleWorkflowAction}
        onCancel={() => setWorkflowAction(null)}
      />

      {/* Modal: Agregar participante */}
      <Modal
        open={showAddParticipante}
        onClose={() => { setShowAddParticipante(false); setSelectedUser(null); setSearchUser(''); setSearchResults([]) }}
        title="Agregar participante"
        subtitle="Busca un usuario y asígnale un rol en el proyecto."
        icon={<UserPlus size={20} className="text-[#16A34A]" />}
        size="lg"
        footer={
          <>
            <button onClick={() => { setShowAddParticipante(false); setSelectedUser(null); setSearchUser(''); setSearchResults([]) }} className="px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors" style={{ borderRadius: 0 }}>
              Cancelar
            </button>
            <button onClick={handleAddParticipante} disabled={!selectedUser || addingParticipant} className="px-4 py-2 text-sm font-medium text-white bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors" style={{ borderRadius: 0 }}>
              {addingParticipant ? 'Agregando...' : 'Agregar participante'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-[#374151] mb-2">Buscar usuario *</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={selectedUser ? `${selectedUser.user_first_name} ${selectedUser.user_last_name}` : searchUser}
                  onChange={(e) => { setSelectedUser(null); setSearchUser(e.target.value) }}
                  className="w-full pl-10 pr-10 py-2.5 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors"
                  style={{ borderRadius: 0 }}
                  placeholder="Nombre o código institucional..."
                />
                {selectedUser && (
                  <button onClick={() => { setSelectedUser(null); setSearchUser('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
                    <XCircle size={16} />
                  </button>
                )}
              </div>
              {searchResults.length > 0 && !selectedUser && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-[#E5E7EB] shadow-lg max-h-48 overflow-y-auto" style={{ borderRadius: 0 }}>
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setSearchUser(''); setSearchResults([]) }}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#F9FAFB] border-b border-[#F3F4F6] last:border-0 flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {(u.user_first_name?.[0] || '')}{(u.user_last_name?.[0] || '')}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[#0A0A0A] truncate">{u.user_first_name} {u.user_last_name}</p>
                        <p className="text-xs text-[#6B7280]">{u.codigo}</p>
                      </div>
                      <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${u.rol === 'ADMIN' ? 'bg-[#FEE2E2] text-[#B91C1C]' : u.rol === 'COORDINADOR' ? 'bg-[#EDE9FE] text-[#5B21B6]' : u.rol === 'DOCENTE' ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#DBEAFE] text-[#1D4ED8]'}`}>
                        {u.rol}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {searchUser.length >= 2 && searchResults.length === 0 && !selectedUser && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-[#E5E7EB] shadow-lg p-4 text-center" style={{ borderRadius: 0 }}>
                  <Users size={24} className="mx-auto text-[#E5E7EB] mb-2" />
                  <p className="text-sm text-[#6B7280]">No se encontraron usuarios</p>
                </div>
              )}
            </div>
            {selectedUser && (
              <div className="flex items-center gap-3 p-3 bg-[#F0FDF4] border border-[#DCFCE7]" style={{ borderRadius: 0 }}>
                <div className="w-10 h-10 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {(selectedUser.user_first_name?.[0] || '')}{(selectedUser.user_last_name?.[0] || '')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#0A0A0A] truncate">{selectedUser.user_first_name} {selectedUser.user_last_name}</p>
                  <p className="text-xs text-[#6B7280]">{selectedUser.codigo} · {selectedUser.rol}</p>
                </div>
                <button onClick={() => { setSelectedUser(null); setSearchUser('') }} className="text-[#16A34A] hover:text-[#15803D] transition-colors">
                  <XCircle size={18} />
                </button>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">Rol en el proyecto *</label>
              <select value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value as RolParticipante)} className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors" style={{ borderRadius: 0 }}>
                <option value="">Selecciona un rol...</option>
                <option value="LIDER">Líder</option>
                <option value="DOCENTE">Docente</option>
                <option value="ESTUDIANTE">Estudiante</option>
                <option value="APOYO">Apoyo</option>
                <option value="EXTERNO">Externo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">Horas comprometidas</label>
              <input type="number" value={nuevasHoras} onChange={(e) => setNuevasHoras(e.target.value)} min="0" className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors" style={{ borderRadius: 0 }} placeholder="Ej: 40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">Observaciones</label>
              <textarea value={nuevasObs} onChange={(e) => setNuevasObs(e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors resize-none" style={{ borderRadius: 0 }} placeholder="Observaciones adicionales..." />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={editParticipante !== null}
        onClose={() => setEditParticipante(null)}
        title="Editar participante"
        subtitle="Modifica el rol, horas o estado del participante."
        icon={<Pencil size={20} className="text-[#16A34A]" />}
        size="lg"
        footer={
          <>
            <button onClick={() => setEditParticipante(null)} className="px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors" style={{ borderRadius: 0 }}>
              Cancelar
            </button>
            <button onClick={handleEditParticipante} disabled={savingParticipante} className="px-4 py-2 text-sm font-medium text-white bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors" style={{ borderRadius: 0 }}>
              {savingParticipante ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </>
        }
      >
        {editParticipante && (
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">Usuario</label>
                <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] border border-[#E5E7EB]" style={{ borderRadius: 0 }}>
                  <div className="w-10 h-10 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {(editParticipante.usuario_nombre || '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0A0A0A] truncate">{editParticipante.usuario_nombre}</p>
                    {editParticipante.usuario_codigo && <p className="text-xs text-[#6B7280] font-mono">{editParticipante.usuario_codigo}</p>}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">Rol en el proyecto *</label>
                <select value={editRol} onChange={(e) => setEditRol(e.target.value as RolParticipante)} className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors" style={{ borderRadius: 0 }}>
                  <option value="LIDER">Líder</option>
                  <option value="DOCENTE">Docente</option>
                  <option value="ESTUDIANTE">Estudiante</option>
                  <option value="APOYO">Apoyo</option>
                  <option value="EXTERNO">Externo</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">Horas comprometidas</label>
                <input type="number" value={editHoras} onChange={(e) => setEditHoras(e.target.value)} min="0" className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors" style={{ borderRadius: 0 }} placeholder="Ej: 40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">Estado</label>
                <select value={editEstado} onChange={(e) => setEditEstado(e.target.value as EstadoParticipante)} className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors" style={{ borderRadius: 0 }}>
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">Observaciones</label>
                <textarea value={editObs} onChange={(e) => setEditObs(e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors resize-none" style={{ borderRadius: 0 }} placeholder="Observaciones adicionales..." />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteParticipante !== null}
        titulo="¿Eliminar participante?"
        mensaje={`¿Estás seguro de eliminar a ${deleteParticipante?.usuario_nombre || ''} del proyecto? Se perderán todos los datos asociados a este participante.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        confirmColor="emerald"
        onConfirm={handleDeleteParticipante}
        onCancel={() => setDeleteParticipante(null)}
      />

      <Modal
        open={showAddActividad || editActividad !== null}
        onClose={closeActividadModal}
        title={editActividad ? 'Editar actividad' : 'Nueva actividad'}
        subtitle={editActividad ? 'Modifica los datos de la actividad.' : 'Define una nueva actividad para el proyecto.'}
        icon={<ListPlus size={20} className="text-[#16A34A]" />}
        size="xl"
        footer={
          <>
            <button onClick={closeActividadModal} className="px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors" style={{ borderRadius: 0 }}>
              Cancelar
            </button>
            <button
              onClick={editActividad ? handleEditActividad : handleAddActividad}
              disabled={addingActividad || savingActividad}
              className="px-4 py-2 text-sm font-medium text-white bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ borderRadius: 0 }}
            >
              {(addingActividad || savingActividad) ? 'Guardando...' : (editActividad ? 'Guardar cambios' : 'Crear actividad')}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">Nombre *</label>
              <input value={actNombre} onChange={(e) => setActNombre(e.target.value)} className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors" style={{ borderRadius: 0 }} placeholder="Nombre de la actividad" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">Descripción</label>
              <textarea value={actDesc} onChange={(e) => setActDesc(e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors resize-none" style={{ borderRadius: 0 }} placeholder="Descripción de la actividad..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">Objetivo relacionado</label>
              <select value={actObjetivo} onChange={(e) => setActObjetivo(e.target.value)} className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors" style={{ borderRadius: 0 }}>
                <option value="">{objetivosList.length === 0 ? 'No hay objetivos registrados' : 'Seleccionar objetivo...'}</option>
                {objetivosList.map((o) => (
                  <option key={o.id} value={o.id}>{o.descripcion}</option>
                ))}
              </select>
              {objetivosList.length === 0 && (
                <p className="text-xs text-[#9CA3AF] mt-1">Puedes crear la actividad sin objetivo relacionado.</p>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">Responsable</label>
              <select value={actResponsable} onChange={(e) => setActResponsable(e.target.value)} className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors" style={{ borderRadius: 0 }}>
                <option value="">Seleccionar responsable...</option>
                {docentesList.map((d) => (
                  <option key={d.id} value={d.id}>{d.user_first_name} {d.user_last_name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">Fecha inicio *</label>
                <input type="date" value={actFechaInicio} onChange={(e) => setActFechaInicio(e.target.value)} className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors" style={{ borderRadius: 0 }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">Fecha fin *</label>
                <input type="date" value={actFechaFin} onChange={(e) => setActFechaFin(e.target.value)} className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors" style={{ borderRadius: 0 }} />
              </div>
            </div>
            <label className="flex items-start gap-3 p-3 bg-[#F9FAFB] border border-[#E5E7EB] cursor-pointer hover:bg-[#F3F4F6] transition-colors" style={{ borderRadius: 0 }}>
              <input type="checkbox" checked={actRequiereEvidencia} onChange={(e) => setActRequiereEvidencia(e.target.checked)} className="h-4 w-4 accent-[#16A34A] mt-0.5" />
              <div>
                <span className="text-sm font-medium text-[#0A0A0A] block">¿Requiere evidencia?</span>
                <span className="text-xs text-[#6B7280]">Si se activa, los participantes deberán subir evidencias al reportar avances.</span>
              </div>
            </label>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">Observaciones</label>
              <textarea value={actObs} onChange={(e) => setActObs(e.target.value)} rows={2} className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors resize-none" style={{ borderRadius: 0 }} placeholder="Observaciones adicionales..." />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteActividad !== null}
        titulo="¿Eliminar esta actividad?"
        mensaje="Esta acción eliminará también todos los avances y evidencias asociados a esta actividad. Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        confirmColor="emerald"
        onConfirm={handleDeleteActividad}
        onCancel={() => setDeleteActividad(null)}
      />
    </div>
  )
}

/* ─── Componentes auxiliares ─── */

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>{label}</p>
      <p style={{ fontSize: '14px', color: '#0A0A0A', fontWeight: 600 }}>{value}</p>
    </div>
  )
}

function InfoRow({ label, value, valueStyle }: { label: string; value: string; valueStyle?: React.CSSProperties }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '0.5px solid #E5E7EB' }}>
      <span style={{ fontSize: '13px', color: '#6B7280' }}>{label}</span>
      <span style={{ fontSize: '13px', color: '#0A0A0A', fontWeight: 500, ...valueStyle }}>{value}</span>
    </div>
  )
}

const ESTADO_PROYECTO_PULSE: Record<string, boolean> = {
  BORRADOR: false,
  EN_REVISION: true,
  APROBADO: false,
  EN_EJECUCION: true,
  EN_SUSPENSION: true,
  FINALIZADO: false,
  CERRADO: false,
  CANCELADO: false,
}
