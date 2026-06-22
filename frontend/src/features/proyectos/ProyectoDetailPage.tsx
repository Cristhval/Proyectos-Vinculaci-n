import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Send, Info, ListTodo, Users, Clock,
  CheckCircle, XCircle, Play, Pause, StopCircle, Ban,
  Plus, Trash2, FolderKanban, Search, Pencil, UserPlus,
  ListPlus, ChevronRight, FileText, Calendar, Target,
  Hash, Building2, Download, Compass, UserCheck, Paperclip, Lightbulb,
  Layers, IdCard,
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { proyectosApi, actividadesApi, participantesApi, auditoriaApi, beneficiariosApi, alineacionesApi, firmasApi, anexosApi, objetivosApi } from '@/api/proyectos'
import { usuariosApi } from '@/api/usuarios'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { ConfirmModal, EstadoBadge } from '@/components/ui'
import {
  ESTADO_PROYECTO_LABELS,
  ESTADO_PROYECTO_COLORS,
  TIPO_PROYECTO_LABELS,
  PRIORIDAD_LABELS,
} from '@/lib/constants'
import { formatDate, formatPercent, formatCurrency } from '@/lib/formatters'
import type {
  Proyecto, Actividad, ParticipanteProyecto,
  EstadoProyecto, RolParticipante, EstadoParticipante,
  Beneficiario, AlineacionEstrategica, FirmaResponsabilidad, Anexo,
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

const FIRMA_TIPO_COLORS: Record<string, string> = {
  RESPONSABLE: 'bg-emerald-100 text-emerald-800',
  COORDINADOR: 'bg-amber-100 text-amber-800',
  APROBADOR: 'bg-blue-100 text-blue-800',
}

const FIRMA_TIPO_LABELS: Record<string, string> = {
  RESPONSABLE: 'Responsable',
  COORDINADOR: 'Coordinador',
  APROBADOR: 'Aprobador',
}

const ANEXO_TIPO_LABELS: Record<string, string> = {
  CONVENIO: 'Convenio',
  RESOLUCION: 'Resolución',
  CARTA: 'Carta de compromiso',
  AVANCE: 'Informe de avance',
  OTRO: 'Otro',
}

function SubseccionInfo({ icono, eyebrow, titulo, children }: { icono?: React.ReactNode; eyebrow?: string; titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-line" style={{ borderRadius: '4px' }}>
      <div className="px-6 pt-5 pb-4 border-b border-line flex items-center gap-3">
        {icono && (
          <span className="inline-flex items-center justify-center w-8 h-8 bg-rose-50 text-rose-600 flex-shrink-0" style={{ borderRadius: '4px' }}>
            {icono}
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.12em] leading-none">{eyebrow}</p>
          )}
          <h2 className="text-[15px] font-semibold text-ink leading-tight mt-1 tracking-[-0.01em]">{titulo}</h2>
        </div>
      </div>
      <div className="px-6 py-5">
        {children}
      </div>
    </div>
  )
}

function DataField({ label, value, mono, full }: { label: string; value: React.ReactNode; mono?: boolean; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-[10.5px] font-semibold text-ink-muted uppercase tracking-[0.06em]">{label}</p>
      <p className={`text-[13.5px] text-ink mt-1 ${mono ? 'font-mono' : 'font-medium'}`}>{value || '—'}</p>
    </div>
  )
}

const PARTICIPANTE_AVATAR_COLORS: Record<string, string> = {
  LIDER: 'bg-[#DCFCE7] text-[#15803D]',
  DOCENTE: 'bg-[#DCFCE7] text-[#15803D]',
  ESTUDIANTE: 'bg-[#F3F4F6] text-[#6B7280]',
  APOYO: 'bg-[#DBEAFE] text-[#1D4ED8]',
  EXTERNO: 'bg-[#DBEAFE] text-[#1D4ED8]',
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

const PRIORIDAD_INFO_BADGE: Record<string, string> = {
  BAJA:    'bg-bg-muted text-ink-muted',
  MEDIA:   'bg-[#DBEAFE] text-[#1E40AF]',
  ALTA:    'bg-amber-100 text-amber-800',
  CRITICA: 'bg-rose-100 text-rose-800',
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
  const [alineaciones, setAlineaciones] = useState<AlineacionEstrategica[]>([])
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([])
  const [firmas, setFirmas] = useState<FirmaResponsabilidad[]>([])
  const [anexos, setAnexos] = useState<Anexo[]>([])
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
  const [actResponsableSearch, setActResponsableSearch] = useState('')
  const [actResponsableSearchOpen, setActResponsableSearchOpen] = useState(false)
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
  const canApprove = proyecto && proyecto.estado === 'EN_REVISION' && (rol === 'COORDINADOR' || rol === 'ADMIN')
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

  const loadAlineaciones = useCallback(() => {
    if (!id) return
    alineacionesApi.list({ proyecto: id, page_size: '100' })
      .then(({ data }) => setAlineaciones(data.results))
      .catch(() => { /* silencioso */ })
  }, [id])

  const loadBeneficiarios = useCallback(() => {
    if (!id) return
    beneficiariosApi.list({ proyecto: id, page_size: '100' })
      .then(({ data }) => setBeneficiarios(data.results))
      .catch(() => { /* silencioso */ })
  }, [id])

  const loadFirmas = useCallback(() => {
    if (!id) return
    firmasApi.list({ proyecto: id, page_size: '100' })
      .then(({ data }) => setFirmas(data.results))
      .catch(() => { /* silencioso */ })
  }, [id])

  const loadAnexos = useCallback(() => {
    if (!id) return
    anexosApi.list({ proyecto: id, page_size: '100' })
      .then(({ data }) => setAnexos(data.results))
      .catch(() => { /* silencioso */ })
  }, [id])

  useEffect(() => {
    if (tab === 'actividades') loadActividades()
    if (tab === 'participantes') loadParticipantes()
    if (tab === 'historial') loadHistorial()
    if (tab === 'info') {
      loadAlineaciones()
      loadBeneficiarios()
      loadFirmas()
      loadAnexos()
    }
  }, [tab, loadActividades, loadParticipantes, loadHistorial, loadAlineaciones, loadBeneficiarios, loadFirmas, loadAnexos])

  useEffect(() => {
    if (id) loadActividades()
  }, [id, loadActividades])

  useEffect(() => {
    if (id) loadParticipantes()
  }, [id, loadParticipantes])

  useEffect(() => {
    usuariosApi.list({ rol: 'DOCENTE', page_size: '100' }).then(({ data }) => setDocentesList(data.results)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!id) return
    objetivosApi.list({ proyecto: id, page_size: '100' }).then(({ data }) => setObjetivosList(data.results)).catch(() => {})
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
    if (!id || !actNombre.trim() || !actDesc.trim() || !actFechaInicio || !actFechaFin) {
      toast.error('Completa los campos obligatorios (nombre, descripción, fechas)')
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
      const payload = {
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
      }
      await actividadesApi.create(payload)
      toast.success('Actividad creada correctamente')
      closeActividadModal()
      loadActividades()
    } catch (err) {
      const data = (err as { response?: { data?: Record<string, string[]> | string } })?.response?.data
      let msg = 'No se pudo crear la actividad'
      if (typeof data === 'string') {
        msg = data
      } else if (data && typeof data === 'object') {
        const fieldLabels: Record<string, string> = {
          proyecto: 'Proyecto', codigo: 'Código', nombre: 'Nombre',
          descripcion: 'Descripción', objetivo: 'Objetivo',
          responsable: 'Responsable', fecha_inicio: 'Fecha inicio',
          fecha_fin: 'Fecha fin', observaciones: 'Observaciones',
        }
        const parts: string[] = []
        for (const [key, val] of Object.entries(data)) {
          const label = fieldLabels[key] || key
          const text = Array.isArray(val) ? val.join(', ') : String(val)
          parts.push(`${label}: ${text}`)
        }
        if (parts.length > 0) msg = parts.join(' | ')
      }
      console.error('[Actividad create] error:', err)
      toast.error(msg)
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
    const respPart = participantes.find((p) => p.usuario === a.responsable)
    setActResponsableSearch(respPart?.usuario_nombre || '')
    setActResponsableSearchOpen(false)
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
    setActResponsableSearch('')
    setActResponsableSearchOpen(false)
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
    ? Math.round(
        actividades.reduce((acc, a) => {
          const p = parseFloat(a.porcentaje_ejecucion) || 0
          if (p > 0) return acc + p
          if (a.estado === 'COMPLETADA') return acc + 100
          return acc
        }, 0) / actividades.length
      )
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
        <button onClick={() => navigate(basePath)} className="mt-4 text-sm text-accent hover:underline">Volver a proyectos</button>
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
          <button onClick={() => navigate(basePath)} className="text-accent hover:text-accent-hover transition-colors">Volver a Proyectos</button>
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
      <div className="relative w-full h-[320px] overflow-hidden" style={{ borderRadius: '8px 8px 0 0' }}>
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
          {/* Mini barra de progreso en el hero */}
          {actividades.length > 0 && (
            <div className="mt-3 flex items-center gap-2" style={{ maxWidth: 280 }}>
              <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progresoGeneral}%`, background: '#16A34A' }} />
              </div>
              <span className="text-[11px] font-bold" style={{ color: '#16A34A' }}>{progresoGeneral}%</span>
            </div>
          )}
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 min-w-0" style={{ marginTop: '20px' }}>
        {/* ─── COLUMNA IZQUIERDA ─── */}
        <div className="space-y-0 min-w-0">
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
            <div className="flex items-center gap-3 mb-3.5">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-50 text-emerald-600 flex-shrink-0" style={{ borderRadius: '4px' }}>
                <Calendar size={16} strokeWidth={2.25} />
              </span>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>Cronograma de actividades</h2>
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
        <div className="space-y-0 min-w-0">
          {/* Integrantes */}
          <div className="bg-white mb-4" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '20px 24px' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-7 h-7 bg-emerald-50 text-emerald-600 flex-shrink-0" style={{ borderRadius: '4px' }}>
                  <Users size={13} strokeWidth={2.25} />
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Integrantes</span>
              </div>
              <button onClick={() => { setTab('participantes'); setTimeout(() => { document.getElementById('tabs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 50) }} style={{ fontSize: '11px', color: '#16A34A', fontWeight: 500 }} className="hover:text-[#15803D] transition-colors">Ver todos →</button>
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
            <div className="flex items-center gap-2.5 mb-3.5">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-emerald-50 text-emerald-600 flex-shrink-0" style={{ borderRadius: '4px' }}>
                <Info size={13} strokeWidth={2.25} />
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Información clave</span>
            </div>
            <div className="space-y-0">
              <InfoRow label="Responsable" value={proyecto.responsable_nombre || '-'} />
              <InfoRow label="Carrera" value={proyecto.carrera_nombre || '-'} />
              <InfoRow label="Coordinador académico" value={proyecto.coordinador_academico_nombre || '-'} />
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
      <div id="tabs-section" className="bg-white border-b border-[#E5E7EB]" style={{ marginTop: '24px' }}>
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
        <div className="space-y-5">
          {/* ── CARD 1 · Identidad y ejecución ── */}
          <div className="bg-white border border-line" style={{ borderRadius: '4px' }}>
            <div className="px-6 pt-5 pb-4 border-b border-line flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-rose-50 text-rose-600 flex-shrink-0" style={{ borderRadius: '4px' }}>
                  <IdCard size={16} strokeWidth={2.25} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.12em] leading-none">Identificación del proyecto</p>
                  <h2 className="text-[18px] font-semibold text-ink mt-1 tracking-[-0.01em]">Datos generales y ejecución</h2>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`inline-flex items-center px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wider ${ESTADO_PROYECTO_COLORS[proyecto.estado] || 'bg-bg-muted text-ink'}`} style={{ borderRadius: '3px' }}>
                  {ESTADO_PROYECTO_LABELS[proyecto.estado] || proyecto.estado}
                </span>
                <span className={`inline-flex items-center px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wider ${PRIORIDAD_INFO_BADGE[proyecto.prioridad] || 'bg-bg-muted text-ink-muted'}`} style={{ borderRadius: '3px' }}>
                  {PRIORIDAD_LABELS[proyecto.prioridad] || proyecto.prioridad}
                </span>
                <span className="inline-flex items-center px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wider bg-bg-muted text-ink-muted" style={{ borderRadius: '3px' }}>
                  {TIPO_PROYECTO_LABELS[proyecto.tipo] || proyecto.tipo}
                </span>
              </div>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.12em] mb-3">Identificación</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                  <DataField label="Código" value={proyecto.codigo} mono />
                  <DataField label="Carrera" value={proyecto.carrera_nombre} />
                  <DataField label="Línea de intervención" value={proyecto.linea_intervencion} />
                </div>
              </div>
              <div className="border-t border-line" />
              <div>
                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.12em] mb-3">Equipo y planificación</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                  <DataField label="Responsable" value={proyecto.responsable_nombre} />
                  <DataField label="Coordinador académico" value={proyecto.coordinador_academico_nombre} />
                  <DataField label="Fecha de inicio" value={formatDate(proyecto.fecha_inicio)} />
                  <DataField label="Fecha fin planificada" value={formatDate(proyecto.fecha_fin_planificada)} />
                  <DataField label="Fecha fin real" value={formatDate(proyecto.fecha_fin_real)} />
                  <DataField label="Presupuesto aprobado" value={proyecto.presupuesto_aprobado ? formatCurrency(proyecto.presupuesto_aprobado) : null} mono />
                </div>
              </div>
              {proyecto.direccion_ejecucion && (
                <>
                  <div className="border-t border-line" />
                  <div>
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.12em] mb-3">Localización</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                      <DataField label="Dirección de ejecución" value={proyecto.direccion_ejecucion} full />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── CARD 2 · Narrativa del proyecto ── */}
          <SubseccionInfo
            icono={<FileText size={15} strokeWidth={2.25} />}
            eyebrow="Descripción"
            titulo="Narrativa del proyecto"
          >
            <div className="divide-y divide-line -my-2.5">
              <div className="py-2.5 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-x-6 gap-y-1.5">
                <p className="text-[10.5px] font-bold text-ink-muted uppercase tracking-[0.08em] pt-0.5">Resumen</p>
                <p className="text-[13.5px] text-ink leading-[1.7] whitespace-pre-line">{proyecto.resumen || '—'}</p>
              </div>
              {proyecto.problema && (
                <div className="py-2.5 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-x-6 gap-y-1.5">
                  <p className="text-[10.5px] font-bold text-ink-muted uppercase tracking-[0.08em] pt-0.5">Problema</p>
                  <p className="text-[13.5px] text-ink leading-[1.7] whitespace-pre-line">{proyecto.problema}</p>
                </div>
              )}
              {proyecto.justificacion && (
                <div className="py-2.5 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-x-6 gap-y-1.5">
                  <p className="text-[10.5px] font-bold text-ink-muted uppercase tracking-[0.08em] pt-0.5">Justificación</p>
                  <p className="text-[13.5px] text-ink leading-[1.7] whitespace-pre-line">{proyecto.justificacion}</p>
                </div>
              )}
              {proyecto.objetivo_general && (
                <div className="py-2.5 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-x-6 gap-y-1.5">
                  <p className="text-[10.5px] font-bold text-ink-muted uppercase tracking-[0.08em] pt-0.5">Objetivo general</p>
                  <p className="text-[13.5px] text-ink leading-[1.7] whitespace-pre-line">{proyecto.objetivo_general}</p>
                </div>
              )}
              {proyecto.resultados_esperados && (
                <div className="py-2.5 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-x-6 gap-y-1.5">
                  <p className="text-[10.5px] font-bold text-ink-muted uppercase tracking-[0.08em] pt-0.5">Resultados esperados</p>
                  <p className="text-[13.5px] text-ink leading-[1.7] whitespace-pre-line">{proyecto.resultados_esperados}</p>
                </div>
              )}
            </div>
          </SubseccionInfo>

          <SubseccionInfo
            icono={<Compass size={15} strokeWidth={2.25} />}
            eyebrow="Alineación"
            titulo="Alineación estratégica"
          >
            {alineaciones.length === 0 ? (
              <p className="text-[13px] text-ink-muted">Sin alineaciones estratégicas registradas</p>
            ) : (
              <div className="space-y-3">
                {alineaciones.map((a) => (
                  <div key={a.id} className="border border-line" style={{ borderRadius: '4px' }}>
                    <div className="px-4 py-2.5 border-b border-line bg-bg-soft">
                      <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.12em]">Alineación</p>
                      <p className="text-[13.5px] font-semibold text-ink mt-0.5">{a.eje || 'Sin eje definido'}</p>
                    </div>
                    <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5">
                      <DataField label="Plan / Programa" value={[a.plan, a.programa].filter(Boolean).join(' · ')} full />
                      <DataField label="Objetivo estratégico" value={a.objetivo_estrategico} full />
                      {a.descripcion && <DataField label="Descripción" value={a.descripcion} full />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SubseccionInfo>

          <SubseccionInfo
            icono={<Layers size={15} strokeWidth={2.25} />}
            eyebrow="Marco lógico"
            titulo="Cadena de resultados"
          >
            {(!proyecto.marco_logico || proyecto.marco_logico.length === 0) ? (
              <p className="text-[13px] text-ink-muted">Sin marco lógico registrado</p>
            ) : (
              <div className="relative pl-7">
                <div className="absolute left-[10px] top-2 bottom-2 w-px bg-line" />
                {(['FIN', 'PROPOSITO', 'COMPONENTES', 'ACTIVIDADES'] as const).map((nivel) => {
                  const fila = proyecto.marco_logico?.find((m) => m.nivel === nivel)
                  const nivelConfig: Record<typeof nivel, { label: string; bar: string; bg: string; text: string }> = {
                    FIN:         { label: 'Fin',          bar: 'bg-[#2563EB]', bg: 'bg-[#DBEAFE]', text: 'text-[#1E40AF]' },
                    PROPOSITO:   { label: 'Propósito',    bar: 'bg-[#059669]', bg: 'bg-emerald-50', text: 'text-emerald-700' },
                    COMPONENTES: { label: 'Componentes',  bar: 'bg-[#D97706]', bg: 'bg-amber-50',   text: 'text-amber-700'   },
                    ACTIVIDADES: { label: 'Actividades',  bar: 'bg-[#7C3AED]', bg: 'bg-violet-50',  text: 'text-violet-700'  },
                  }
                  const cfg = nivelConfig[nivel]
                  return (
                    <div key={nivel} className="relative pb-5 last:pb-0">
                      <span className={`absolute -left-7 top-1.5 w-3 h-3 ${cfg.bar} ring-4 ring-white`} style={{ borderRadius: '50%' }} />
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${cfg.bg} ${cfg.text}`} style={{ borderRadius: '2px' }}>
                          {cfg.label}
                        </span>
                      </div>
                      {fila ? (
                        <div className="bg-bg-soft border border-line px-4 py-3.5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3" style={{ borderRadius: '4px' }}>
                          <DataField label="Resumen narrativo" value={fila.resumen_narrativo} full />
                          <DataField label="Indicadores" value={fila.indicadores} />
                          <DataField label="Medios de verificación" value={fila.medios_verificacion} />
                          <DataField label="Supuestos" value={fila.supuestos} full />
                        </div>
                      ) : (
                        <p className="text-[12.5px] text-ink-muted italic">Sin datos para este nivel</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </SubseccionInfo>

          <SubseccionInfo
            icono={<Users size={15} strokeWidth={2.25} />}
            eyebrow="Población objetivo"
            titulo="Beneficiarios"
          >
            {beneficiarios.length === 0 ? (
              <p className="text-[13px] text-ink-muted">Sin beneficiarios registrados</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {(() => {
                    const total = beneficiarios.reduce((acc, b) => acc + (b.cantidad_estimada || 0), 0)
                    const directos = beneficiarios.filter((b) => b.tipo === 'DIRECTO').reduce((acc, b) => acc + (b.cantidad_estimada || 0), 0)
                    const indirectos = beneficiarios.filter((b) => b.tipo === 'INDIRECTO').reduce((acc, b) => acc + (b.cantidad_estimada || 0), 0)
                    return [
                      { label: 'Total', value: total, accent: 'text-ink' },
                      { label: 'Directos', value: directos, accent: 'text-emerald-600' },
                      { label: 'Indirectos', value: indirectos, accent: 'text-[#2563EB]' },
                    ].map((k) => (
                      <div key={k.label} className="bg-bg-soft border border-line px-4 py-3" style={{ borderRadius: '4px' }}>
                        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.08em]">{k.label}</p>
                        <p className={`text-[22px] font-semibold tabular-nums mt-1 tracking-[-0.01em] ${k.accent}`}>{k.value.toLocaleString('es-EC')}</p>
                      </div>
                    ))
                  })()}
                </div>
                <div className="border border-line overflow-hidden" style={{ borderRadius: '4px' }}>
                  <table className="w-full text-sm">
                    <thead className="bg-bg-soft border-b border-line">
                      <tr>
                        <th className="text-left px-3 py-2 text-[10.5px] font-bold text-ink-muted uppercase tracking-[0.08em]">Tipo</th>
                        <th className="text-left px-3 py-2 text-[10.5px] font-bold text-ink-muted uppercase tracking-[0.08em]">Nombre / descripción</th>
                        <th className="text-right px-3 py-2 text-[10.5px] font-bold text-ink-muted uppercase tracking-[0.08em]">Cantidad</th>
                        <th className="text-left px-3 py-2 text-[10.5px] font-bold text-ink-muted uppercase tracking-[0.08em]">Ubicación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {beneficiarios.map((b) => (
                        <tr key={b.id} className="hover:bg-bg-soft/50">
                          <td className="px-3 py-2.5 align-top">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${b.tipo === 'DIRECTO' ? 'bg-emerald-100 text-emerald-800' : 'bg-[#DBEAFE] text-[#1E40AF]'}`}
                              style={{ borderRadius: '2px' }}
                            >
                              {b.tipo === 'DIRECTO' ? 'Directo' : 'Indirecto'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 align-top">
                            <p className="text-[13px] font-semibold text-ink">{b.nombre || '—'}</p>
                            {b.descripcion && <p className="text-[11.5px] text-ink-muted mt-0.5 line-clamp-2">{b.descripcion}</p>}
                          </td>
                          <td className="px-3 py-2.5 align-top text-[13px] font-semibold text-ink text-right tabular-nums">{b.cantidad_estimada?.toLocaleString('es-EC') || '0'}</td>
                          <td className="px-3 py-2.5 align-top text-[12px] text-ink-muted">{b.ubicacion || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </SubseccionInfo>

          <SubseccionInfo
            icono={<Lightbulb size={15} strokeWidth={2.25} />}
            eyebrow="Metodología"
            titulo="Estrategias de ejecución"
          >
            {(proyecto as { estrategias_ejecucion?: string }).estrategias_ejecucion ? (
              <p className="text-[13.5px] text-ink leading-[1.75] whitespace-pre-line">
                {(proyecto as { estrategias_ejecucion?: string }).estrategias_ejecucion}
              </p>
            ) : (
              <p className="text-[13px] text-ink-muted">Sin estrategias de ejecución registradas</p>
            )}
          </SubseccionInfo>

          <SubseccionInfo
            icono={<UserCheck size={15} strokeWidth={2.25} />}
            eyebrow="Validación"
            titulo="Firmas de responsabilidad"
          >
            {firmas.length === 0 ? (
              <p className="text-[13px] text-ink-muted">Sin firmas registradas</p>
            ) : (
              <div className="border border-line overflow-hidden" style={{ borderRadius: '4px' }}>
                <table className="w-full text-sm">
                  <thead className="bg-bg-soft border-b border-line">
                    <tr>
                      <th className="text-left px-3 py-2 text-[10.5px] font-bold text-ink-muted uppercase tracking-[0.08em]">Tipo de firma</th>
                      <th className="text-left px-3 py-2 text-[10.5px] font-bold text-ink-muted uppercase tracking-[0.08em]">Usuario</th>
                      <th className="text-left px-3 py-2 text-[10.5px] font-bold text-ink-muted uppercase tracking-[0.08em]">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {firmas.map((f) => (
                      <tr key={f.id} className="hover:bg-bg-soft/50">
                        <td className="px-3 py-2.5 align-top">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${FIRMA_TIPO_COLORS[f.tipo] || 'bg-gray-100 text-gray-800'}`}
                            style={{ borderRadius: '2px' }}
                          >
                            {FIRMA_TIPO_LABELS[f.tipo] || f.tipo}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 align-top text-[13px] font-semibold text-ink">
                          {f.usuario_nombre || `Usuario #${f.usuario}`}
                        </td>
                        <td className="px-3 py-2.5 align-top text-[12px] text-ink-muted tabular-nums">{formatDate(f.fecha_firma)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SubseccionInfo>

          <SubseccionInfo
            icono={<Paperclip size={15} strokeWidth={2.25} />}
            eyebrow="Documentos adjuntos"
            titulo={`Anexos${anexos.length ? ` · ${anexos.length}` : ''}`}
          >
            {anexos.length === 0 ? (
              <p className="text-[13px] text-ink-muted">Sin anexos adjuntos</p>
            ) : (
              <ul className="border border-line divide-y divide-line" style={{ borderRadius: '4px' }}>
                {anexos.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 flex items-center justify-center bg-bg-muted flex-shrink-0" style={{ borderRadius: '4px' }}>
                      <FileText size={16} className="text-ink-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-ink truncate">{a.nombre}</p>
                      <p className="text-[11.5px] text-ink-muted mt-0.5">
                        {ANEXO_TIPO_LABELS[a.tipo] || a.tipo}
                        {a.subido_por_nombre ? ` · subido por ${a.subido_por_nombre}` : ''}
                      </p>
                    </div>
                    <a
                      href={a.archivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-semibold bg-ink text-white hover:bg-ink/90 transition-colors"
                      style={{ borderRadius: '3px' }}
                    >
                      <Download size={12} strokeWidth={2.5} />
                      Descargar
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </SubseccionInfo>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB: ACTIVIDADES
          ════════════════════════════════════════ */}
      {tab === 'actividades' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-rose-50 text-rose-600 flex-shrink-0" style={{ borderRadius: '4px' }}>
                <ListTodo size={13} strokeWidth={2.25} />
              </span>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Actividades del proyecto <span style={{ fontWeight: 400, color: '#6B7280' }}>({actividades.length} actividades)</span></h2>
            </div>
            {canManageParticipants && (
              <button onClick={() => setShowAddActividad(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-500/40 transition-all" style={{ borderRadius: 0 }}>
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
            </div>
          ) : (
            <div className="space-y-0">
              {actividades.map((a, idx) => {
                const responsablePart = participantes.find((p) => p.usuario === a.responsable)
                const responsableDocente = responsablePart
                  ? { user_first_name: responsablePart.usuario_nombre?.split(' ')[0] || '', user_last_name: responsablePart.usuario_nombre?.split(' ').slice(1).join(' ') || '' }
                  : docentesList.find((d) => d.id === a.responsable)
                const porcentaje = parseFloat(a.porcentaje_ejecucion) || 0
                const isLast = idx === actividades.length - 1
                const progressColor = porcentaje < 30 ? '#DC2626' : porcentaje <= 70 ? '#EAB308' : '#16A34A'
                const stateColors: Record<string, { bg: string; icon: React.ReactNode }> = {
                  COMPLETADA: { bg: '#16A34A', icon: <CheckCircle size={18} className="text-white" /> },
                  EN_PROCESO: { bg: '#16A34A', icon: <div className="w-2.5 h-2.5 bg-white rounded-full" /> },
                  PENDIENTE: { bg: '#E5E7EB', icon: <div className="w-2.5 h-2.5 bg-white rounded-full" /> },
                  ATRASADA: { bg: '#DC2626', icon: <div className="w-2.5 h-2.5 bg-white rounded-full" /> },
                  CANCELADA: { bg: '#9CA3AF', icon: <div className="w-2.5 h-2.5 bg-white rounded-full" /> },
                }
                const sc = stateColors[a.estado] || stateColors.PENDIENTE!
                return (
                  <div key={a.id} className="relative flex items-stretch">
                    {/* ZONA 1: Estado + conector */}
                    <div className="flex flex-col items-center" style={{ width: 60, flexShrink: 0 }}>
                      <div
                        className="w-10 h-10 flex items-center justify-center flex-shrink-0 mt-3"
                        style={{ borderRadius: '50%', background: sc.bg }}
                      >
                        {sc.icon}
                      </div>
                      {!isLast && (
                        <div className="flex-1 w-0.5 bg-[#E5E7EB] mt-1 mb-1" style={{ minHeight: 16 }} />
                      )}
                    </div>

                    {/* ZONA 2, 3, 4: Tarjeta de contenido */}
                    <div
                      className="flex-1 min-w-0 bg-white hover:bg-[#F0FDF4] transition-colors duration-150 flex items-start gap-4 mb-3"
                      style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '16px 20px' }}
                    >
                      {/* ZONA 2: Contenido */}
                      <button
                        type="button"
                        onClick={() => navigate(`${basePath}/${a.proyecto}/actividades/${a.id}`)}
                        className="flex-1 min-w-0 space-y-1.5 text-left"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-medium bg-[#F3F4F6] text-[#6B7280] rounded border border-[#E5E7EB]">
                            {a.codigo}
                          </span>
                          <h3 className="text-[14px] font-semibold text-[#0A0A0A]">{a.nombre}</h3>
                        </div>
                        {a.descripcion && (
                          <p className="text-[12px] text-[#6B7280] line-clamp-2">{a.descripcion}</p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-[#6B7280] flex-wrap">
                          {responsableDocente && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center text-[9px] font-semibold">
                                {(responsableDocente.user_first_name?.[0] || '')}{(responsableDocente.user_last_name?.[0] || '')}
                              </div>
                              <span>{responsableDocente.user_first_name} {responsableDocente.user_last_name}</span>
                            </div>
                          )}
                          {a.fecha_inicio && a.fecha_fin && (
                            <span>{formatDate(a.fecha_inicio)} → {formatDate(a.fecha_fin)}</span>
                          )}
                        </div>
                      </button>

                      {/* ZONA 3: Progreso */}
                      <div className="flex flex-col items-end justify-center gap-1" style={{ width: 150, flexShrink: 0 }}>
                        <div className="w-full h-[6px] bg-[#E5E7EB] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${porcentaje}%`, background: progressColor }} />
                        </div>
                        <span className="text-[11px] font-bold tabular-nums" style={{ color: progressColor }}>
                          {porcentaje}% completado
                        </span>
                      </div>

                      {/* ZONA 4: Acciones */}
                      <div className="flex flex-col items-center gap-1.5" style={{ width: 80, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => navigate(`${basePath}/${a.proyecto}/actividades/${a.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#16A34A] hover:bg-[#F0FDF4] transition-colors"
                          style={{ borderRadius: 0 }}
                        >
                          Ver <ChevronRight size={12} />
                        </button>
                        {canManageParticipants && (
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => openEditActividad(a)}
                              title="Editar actividad"
                              className="p-1.5 text-[#16A34A] hover:bg-emerald-600 hover:text-white transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            {isAdmin() && (
                              <button
                                onClick={() => setDeleteActividad(a)}
                                title="Eliminar actividad"
                                className="p-1.5 text-[#DC2626] hover:bg-red-600 hover:text-white transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
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
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-rose-50 text-rose-600 flex-shrink-0" style={{ borderRadius: '4px' }}>
                <Users size={13} strokeWidth={2.25} />
              </span>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Participantes del proyecto <span style={{ fontWeight: 400, color: '#6B7280' }}>({participantes.length} participantes)</span></h2>
            </div>
            {canManageParticipants && (
              <button onClick={() => setShowAddParticipante(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-500/40 transition-all" style={{ borderRadius: 0 }}>
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
                          <EstadoBadge estado={p.estado} />
                        </td>
                        {canManageParticipants && (
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditParticipante(p)}
                                title="Editar participante"
                                className="p-1.5 text-[#16A34A] hover:bg-emerald-600 hover:text-white transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteParticipante(p)}
                                title="Eliminar participante"
                                className="p-1.5 text-[#DC2626] hover:bg-red-600 hover:text-white transition-colors"
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
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-line">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-rose-50 text-rose-600 flex-shrink-0" style={{ borderRadius: '4px' }}>
              <Clock size={15} strokeWidth={2.25} />
            </span>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>Historial de cambios</h2>
          </div>
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
        subtitle="El proyecto volverá a estado Borrador y el responsable será notificado"
        icon={
          <div className="w-8 h-8 rounded-full bg-[#FEE2E2] flex items-center justify-center">
            <XCircle size={18} className="text-[#DC2626]" />
          </div>
        }
        headerClassName="!bg-[#FEF2F2]"
        iconClassName="!bg-[#FEE2E2] !rounded-full !w-8 !h-8"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => { setWorkflowAction(null); setRechazarMotivo('') }}
              className="px-5 py-2.5 text-sm font-medium text-[#0A0A0A] bg-white border border-[#0A0A0A] hover:bg-[#F9FAFB] transition-colors"
              style={{ borderRadius: 0 }}
            >
              Cancelar
            </button>
            <button
              onClick={handleRechazar}
              disabled={rechazarMotivo.trim().length < 10}
              className="px-5 py-2.5 text-sm font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
              style={{ borderRadius: 0 }}
            >
              Rechazar proyecto
            </button>
          </div>
        }
      >
        <div>
          <label className="block text-[13px] font-medium text-[#374151] mb-2">
            Motivo del rechazo <span className="text-[#DC2626]">*</span>
          </label>
          <textarea
            value={rechazarMotivo}
            onChange={(e) => setRechazarMotivo(e.target.value)}
            rows={5}
            className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] transition-colors resize-none"
            style={{ borderRadius: 0, minHeight: 100 }}
            placeholder="Describe las observaciones o correcciones necesarias para que el responsable pueda mejorar el proyecto..."
          />
          <div className="flex items-center justify-between mt-1.5">
            <span />
            <p className={`text-[11px] tabular-nums ${rechazarMotivo.trim().length < 10 ? 'text-[#DC2626]' : 'text-[#6B7280]'}`}>
              {rechazarMotivo.trim().length} / mín. 10 caracteres
            </p>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  placeholder="Buscar por nombre o cédula..."
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
                        <p className="text-xs text-[#6B7280]">Cédula: {u.documento_identidad || '—'} | {ROL_LABELS[u.rol] || u.rol}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">Nombre <span className="text-red-500">*</span></label>
              <input value={actNombre} onChange={(e) => setActNombre(e.target.value)} className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors" style={{ borderRadius: 0 }} placeholder="Nombre de la actividad" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">Descripción <span className="text-red-500">*</span></label>
              <textarea value={actDesc} onChange={(e) => setActDesc(e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors resize-none" style={{ borderRadius: 0 }} placeholder="Descripción de la actividad..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">Objetivo relacionado</label>
              <select value={actObjetivo} onChange={(e) => setActObjetivo(e.target.value)} className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors" style={{ borderRadius: 0 }}>
                <option value="">{objetivosList.length === 0 ? 'Sin objetivos registrados' : 'Seleccionar objetivo...'}</option>
                {objetivosList.map((o) => (
                  <option key={o.id} value={o.id}>{o.descripcion}</option>
                ))}
              </select>
              {objetivosList.length === 0 && (
                <p className="text-xs text-[#9CA3AF] mt-1">Los objetivos se definen en el Paso 3 (Diagnóstico) al crear o editar el proyecto. Si no hay objetivos aún, puedes crear la actividad sin asociar ninguno.</p>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">Responsable</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                <input
                  type="text"
                  value={actResponsableSearch}
                  onChange={(e) => setActResponsableSearch(e.target.value)}
                  onFocus={() => setActResponsableSearchOpen(true)}
                  placeholder="Buscar participante por nombre o código..."
                  className="w-full pl-9 pr-3 py-2.5 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors"
                  style={{ borderRadius: 0 }}
                />
                {actResponsableSearchOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[#E5E7EB] shadow-lg max-h-48 overflow-y-auto" style={{ borderRadius: 0 }}>
                    {participantes
                      .filter((p) => {
                        const q = actResponsableSearch.toLowerCase().trim()
                        if (!q) return true
                        return (
                          (p.usuario_nombre || '').toLowerCase().includes(q) ||
                          (p.usuario_codigo || '').toLowerCase().includes(q)
                        )
                      })
                      .slice(0, 20)
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { setActResponsable(String(p.usuario)); setActResponsableSearch(p.usuario_nombre || ''); setActResponsableSearchOpen(false) }}
                          className={`w-full text-left px-3 py-2 text-sm border-b border-[#F3F4F6] last:border-0 transition-colors ${actResponsable === String(p.usuario) ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-[#F9FAFB]'}`}
                        >
                          <p className="font-medium">{p.usuario_nombre || '-'}</p>
                          <p className="text-xs text-[#6B7280]">{p.usuario_codigo} · {ROL_LABELS[p.rol] || p.rol}</p>
                        </button>
                      ))}
                    {participantes.filter((p) => {
                      const q = actResponsableSearch.toLowerCase().trim()
                      if (!q) return true
                      return (p.usuario_nombre || '').toLowerCase().includes(q) || (p.usuario_codigo || '').toLowerCase().includes(q)
                    }).length === 0 && (
                      <div className="p-3 text-xs text-[#6B7280] text-center">
                        {participantes.length === 0
                          ? 'Aún no hay participantes en el proyecto. Agrega integrantes desde la tarjeta "Integrantes".'
                          : 'Sin resultados'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">Fecha inicio <span className="text-red-500">*</span></label>
                <input type="date" value={actFechaInicio} onChange={(e) => setActFechaInicio(e.target.value)} className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-colors" style={{ borderRadius: 0 }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">Fecha fin <span className="text-red-500">*</span></label>
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

function InfoRow({ label, value, valueStyle }: { label: string; value: string; valueStyle?: React.CSSProperties }) {
  return (
    <div className="py-3" style={{ borderBottom: '0.5px solid #E5E7EB' }}>
      <p
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#9CA3AF',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '4px',
        }}
      >
        {label}
      </p>
      <p
        className="break-words"
        style={{
          fontSize: '13.5px',
          color: '#0A0A0A',
          fontWeight: 500,
          lineHeight: 1.5,
          ...valueStyle,
        }}
      >
        {value}
      </p>
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
