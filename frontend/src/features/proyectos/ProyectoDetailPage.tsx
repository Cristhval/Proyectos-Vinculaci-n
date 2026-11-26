import { useEffect, useState, useCallback } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Send, Info, ListTodo, Users, Clock,
  CheckCircle, XCircle, Play, Pause, StopCircle, Ban,
  Plus, Trash2, FolderKanban, Search, Pencil, UserPlus,
  ListPlus, ChevronRight, FileText, Calendar,
  Lock, Cpu,
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { proyectosApi, actividadesApi, participantesApi, auditoriaApi, beneficiariosApi, alineacionesApi, firmasApi, anexosApi } from '@/api/proyectos'
import { usuariosApi } from '@/api/usuarios'
import { revisionesApi } from '@/api/seguimiento'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { Button, ConfirmModal, EstadoBadge, OperationStatusModal } from '@/components/ui'
import type { TonoConfirmacion } from '@/components/ui/ConfirmModal'
import { useOperacion } from '@/hooks/useOperacion'
import { TONOS_ESTADO, TONO_ESTADO_ACTIVIDAD, TONO_ROL_PARTICIPANTE, claseInsignia, estiloDe } from '@/lib/estados'
import { formatDate } from '@/lib/formatters'
import type {
  Proyecto, Actividad, ParticipanteProyecto,
  RolParticipante, EstadoParticipante, EstadoActividad,
  Beneficiario, AlineacionEstrategica, FirmaResponsabilidad, Anexo,
} from '@/types/proyectos'
import type { Usuario } from '@/types/usuarios'
import type { AuditoriaRegistro } from '@/api/proyectos'
import InformesSection from '@/features/seguimiento/InformesSection'
import DispositivosTab from '@/features/proyectos/dispositivos/DispositivosTab'
import type { ImagenGaleria } from '@/components/ui/GaleriaImagenes'
import FichaEncabezado from './detalle/FichaEncabezado'
import FichaInformacion from './detalle/FichaInformacion'
import FichaDatosClave from './detalle/FichaDatosClave'
import IndiceFicha, { useSeccionActiva } from './detalle/IndiceFicha'
import { SECCIONES_FICHA } from './detalle/constantes'

const IDS_SECCIONES = SECCIONES_FICHA.map((sec) => sec.id)

type Tab = 'info' | 'actividades' | 'participantes' | 'informes' | 'dispositivos' | 'historial'
type WorkflowAction = 'aprobar' | 'rechazar' | 'iniciar' | 'suspender' | 'finalizar' | 'reanudar' | 'cerrar' | 'cancelar' | null

const TABS: { key: Tab; label: string; icon: typeof Info }[] = [
  { key: 'info', label: 'Información', icon: Info },
  { key: 'actividades', label: 'Actividades', icon: ListTodo },
  { key: 'participantes', label: 'Participantes', icon: Users },
  { key: 'informes', label: 'Informes', icon: FileText },
  { key: 'dispositivos', label: 'Dispositivos', icon: Cpu },
  { key: 'historial', label: 'Historial', icon: Clock },
]

const ROL_LABELS: Record<string, string> = {
  LIDER: 'Líder',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
  APOYO: 'Apoyo',
  EXTERNO: 'Externo',
}

const PARTICIPANTE_AVATAR_COLORS: Record<string, string> = {
  LIDER: 'bg-ink text-white',
  DOCENTE: 'bg-[#DBEAFE] text-[#1D4ED8]',
  ESTUDIANTE: 'bg-[#F1F5F9] text-[#475569]',
  APOYO: 'bg-[#FEF3C7] text-[#B45309]',
  EXTERNO: 'bg-[#EDE9FE] text-[#5B21B6]',
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
  const [alineaciones, setAlineaciones] = useState<AlineacionEstrategica[]>([])
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([])
  const [firmas, setFirmas] = useState<FirmaResponsabilidad[]>([])
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [tab, setTab] = useState<Tab>('info')
  const [loading, setLoading] = useState(true)
  const [loadingTab, setLoadingTab] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  // Envío a revisión, cambios de estado y análisis técnico: estado real en OperationStatusModal.
  const operacion = useOperacion()
  // Índice de la ficha: sección visible mientras se recorre la pestaña Información.
  const seccionActiva = useSeccionActiva(IDS_SECCIONES, tab === 'info' && Boolean(proyecto))
  const [workflowAction, setWorkflowAction] = useState<WorkflowAction>(null)
  const [rechazarMotivo, setRechazarMotivo] = useState('')

  const [analisisOpen, setAnalisisOpen] = useState(false)
  const [factibilidad, setFactibilidad] = useState('')
  const [impacto, setImpacto] = useState('')
  const [pertinencia, setPertinencia] = useState('')
  const [observacionesTecnicas, setObservacionesTecnicas] = useState('')
  const [guardandoAnalisis, setGuardandoAnalisis] = useState(false)
  const [analisisGuardado, setAnalisisGuardado] = useState(false)

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

  const rol = user?.rol || 'ESTUDIANTE'
  const basePath = `/${rol.toLowerCase()}/proyectos`

  const responsableId = proyecto?.responsable != null
    ? (typeof proyecto.responsable === 'object' ? (proyecto.responsable as unknown as { id: number }).id : proyecto.responsable)
    : null
  const esResponsable = responsableId != null && responsableId === user?.id
  const isResponsableDocente = rol === 'DOCENTE' && esResponsable
  const canEdit = proyecto && (isAdmin() || (isResponsableDocente && proyecto.estado === 'BORRADOR'))
  const canSubmit = proyecto && proyecto.estado === 'BORRADOR' && (isAdmin() || isResponsableDocente)
  // Módulo 2: el backend valida igual (responsable, coordinador o admin).
  const canManageDevices = !!proyecto && (isCoordinadorOrAbove() || esResponsable)
  const canManageParticipants = proyecto && (isAdmin() || isCoordinadorOrAbove() || isResponsableDocente)
  const canApprove = proyecto && proyecto.estado === 'EN_REVISION' && (rol === 'COORDINADOR' || rol === 'ADMIN')
  const canStart = proyecto && proyecto.estado === 'APROBADO' && (isAdmin() || isResponsableDocente)
  const canSuspend = proyecto && proyecto.estado === 'EN_EJECUCION' && isCoordinadorOrAbove()
  const canFinalize = proyecto && proyecto.estado === 'EN_EJECUCION' && (isAdmin() || isResponsableDocente)
  const canResume = proyecto && proyecto.estado === 'EN_SUSPENSION' && isCoordinadorOrAbove()
  const canClose = proyecto && proyecto.estado === 'FINALIZADO' && isAdmin()
  const canCancel = proyecto && !['CANCELADO', 'CERRADO'].includes(proyecto.estado) && isAdmin()

  const loadRevisiones = useCallback(() => {
    if (!id || !user) return
    revisionesApi.list({ proyecto: id, revisor: String(user.id), page_size: '100' })
      .then(({ data }) => {
        const observada = data.results.find((r) => r.decision === 'OBSERVADO')
        if (observada) {
          setFactibilidad(observada.comentario || '')
          setObservacionesTecnicas(observada.observaciones || '')
          // Impacto y pertinencia se almacenan serializados en observaciones cuando existen
          try {
            const extra = JSON.parse(observada.observaciones || '{}')
            if (extra.impacto) {
              setImpacto(extra.impacto)
              setPertinencia(extra.pertinencia || '')
              setObservacionesTecnicas(extra.observaciones || '')
            }
          } catch {
            // Si no es JSON, dejar impacto/pertinencia vacíos y observaciones tal cual
          }
          setAnalisisGuardado(true)
        }
      })
      .catch(() => { /* silencioso */ })
  }, [id, user])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    // Las revisiones solo dependen del id y del usuario: se piden en paralelo con el proyecto.
    loadRevisiones()
    proyectosApi.get(Number(id)).then(({ data }) => {
      setProyecto(data)
      setLoading(false)
    }).catch(() => {
      toast.error('Error al cargar el proyecto')
      setLoading(false)
    })
  }, [id, loadRevisiones])

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
    auditoriaApi.list({ entidad: 'Proyecto', entidad_id: id })
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
    if (tab === 'historial') {
      loadHistorial()
      loadRevisiones()
    }
    if (tab === 'info') {
      loadAlineaciones()
      loadBeneficiarios()
      loadFirmas()
      loadAnexos()
    }
  }, [tab, loadActividades, loadParticipantes, loadHistorial, loadAlineaciones, loadBeneficiarios, loadFirmas, loadAnexos, loadRevisiones])

  useEffect(() => {
    if (id) loadActividades()
  }, [id, loadActividades])

  useEffect(() => {
    if (id) loadParticipantes()
  }, [id, loadParticipantes])

  useEffect(() => {
    usuariosApi.list({ rol: 'DOCENTE', page_size: '100' }).then(({ data }) => setDocentesList(data.results)).catch(() => {})
  }, [])

  const handleSearchUser = useCallback(async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return }
    try {
      const { data } = await usuariosApi.list({ search: query, page_size: '10' })
      setSearchResults(data.results)
    } catch { setSearchResults([]) }
  }, [])

  const searchUserDebounced = useDebounce(searchUser, 300)
  useEffect(() => {
    handleSearchUser(searchUserDebounced)
  }, [searchUserDebounced, handleSearchUser])

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
      toast.error('Completa los campos obligatorios (nombre, descripción y fechas)')
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
    setActResponsable('')
    setActResponsableSearch('')
    setActResponsableSearchOpen(false)
    setActFechaInicio('')
    setActFechaFin('')
    setActRequiereEvidencia(false)
    setActObs('')
  }

  /** Vuelve a pedir el proyecto tras un cambio de estado ([Aceptar] del modal de éxito). */
  const refrescarProyecto = useCallback(() => {
    if (!id) return
    proyectosApi.get(Number(id)).then(({ data }) => setProyecto(data)).catch(() => { /* se conserva el actual */ })
  }, [id])

  const handleEnviarRevision = () => {
    if (!id) return
    setShowSubmitModal(false)
    void operacion.ejecutar(() => proyectosApi.enviarRevision(Number(id)), {
      procesando: { titulo: 'Enviando proyecto a revisión…', descripcion: 'El proyecto pasará al proceso de revisión.' },
      exito: { titulo: 'Proyecto enviado a revisión', descripcion: 'El coordinador recibirá el proyecto para revisarlo.' },
      alAceptar: refrescarProyecto,
    })
  }

  const handleRechazar = () => {
    if (!id || rechazarMotivo.trim().length < 10) return
    const motivo = rechazarMotivo.trim()
    setWorkflowAction(null)
    void operacion.ejecutar(() => proyectosApi.rechazar(Number(id), { motivo }), {
      procesando: { titulo: 'Rechazando proyecto…', descripcion: 'El proyecto volverá a borrador y se notificará al responsable.' },
      exito: { titulo: 'Proyecto devuelto a borrador', descripcion: 'El responsable fue notificado con el motivo del rechazo.' },
      alAceptar: () => { setRechazarMotivo(''); refrescarProyecto() },
      // Si falla, se conserva el motivo escrito para no tener que redactarlo de nuevo.
    })
  }

  const handleGuardarAnalisis = async () => {
    if (!id || !user) return
    if (!factibilidad.trim() || !impacto.trim() || !pertinencia) {
      toast.error('Completa los campos obligatorios del análisis técnico')
      return
    }
    setGuardandoAnalisis(true)
    const observacionesPayload = JSON.stringify({
      impacto: impacto.trim(),
      pertinencia,
      observaciones: observacionesTecnicas.trim(),
    })
    await operacion.ejecutar(
      () => revisionesApi.create({
        proyecto: Number(id),
        decision: 'OBSERVADO',
        comentario: factibilidad.trim(),
        observaciones: observacionesPayload,
      }),
      {
        procesando: { titulo: 'Guardando análisis técnico…' },
        exito: { titulo: 'Análisis técnico guardado correctamente' },
        alAceptar: () => { setAnalisisGuardado(true); loadRevisiones() },
      },
    )
    setGuardandoAnalisis(false)
  }

  const handleWorkflowAction = () => {
    if (!id || !workflowAction || workflowAction === 'rechazar') return
    const proyectoId = Number(id)
    const accion = workflowAction
    const contenido = getWorkflowModalContent()
    setWorkflowAction(null)
    const tareas: Record<Exclude<typeof accion, 'rechazar'>, () => Promise<unknown>> = {
      aprobar: () => proyectosApi.aprobar(proyectoId),
      iniciar: () => proyectosApi.iniciarEjecucion(proyectoId),
      suspender: () => proyectosApi.suspender(proyectoId),
      finalizar: () => proyectosApi.finalizar(proyectoId),
      reanudar: () => proyectosApi.reanudar(proyectoId),
      cerrar: () => proyectosApi.cerrar(proyectoId),
      cancelar: () => proyectosApi.cancelar(proyectoId),
    }
    void operacion.ejecutar(tareas[accion], {
      procesando: { titulo: contenido.procesando },
      exito: { titulo: contenido.exito },
      alAceptar: refrescarProyecto,
    })
  }

  /** Textos y tono de cada cambio de estado: confirmación, "procesando" y éxito. */
  const getWorkflowModalContent = (): { titulo: string; mensaje: string; accion: string; tono: TonoConfirmacion; procesando: string; exito: string } => {
    switch (workflowAction) {
      case 'aprobar': return { titulo: '¿Aprobar este proyecto?', mensaje: 'El proyecto será aprobado y quedará listo para iniciar su ejecución.', accion: 'Aprobar proyecto', tono: 'primario', procesando: 'Aprobando proyecto…', exito: 'Proyecto aprobado correctamente' }
      case 'rechazar': return { titulo: '¿Rechazar proyecto?', mensaje: 'El proyecto será devuelto a borrador para correcciones.', accion: 'Rechazar proyecto', tono: 'acento', procesando: 'Rechazando proyecto…', exito: 'Proyecto devuelto a borrador' }
      case 'iniciar': return { titulo: '¿Iniciar la ejecución del proyecto?', mensaje: 'Asegúrate de tener todos los participantes y actividades registrados.', accion: 'Iniciar ejecución', tono: 'primario', procesando: 'Iniciando ejecución…', exito: 'El proyecto está en ejecución' }
      case 'suspender': return { titulo: '¿Suspender proyecto?', mensaje: 'El proyecto será suspendido temporalmente.', accion: 'Suspender', tono: 'acento', procesando: 'Suspendiendo proyecto…', exito: 'Proyecto suspendido' }
      case 'finalizar': return { titulo: '¿Finalizar el proyecto?', mensaje: 'Confirma que todas las actividades han sido completadas.', accion: 'Finalizar proyecto', tono: 'primario', procesando: 'Finalizando proyecto…', exito: 'Proyecto finalizado correctamente' }
      case 'reanudar': return { titulo: '¿Reanudar proyecto?', mensaje: 'El proyecto volverá a estado en ejecución para continuar.', accion: 'Reanudar', tono: 'primario', procesando: 'Reanudando proyecto…', exito: 'Proyecto reanudado' }
      case 'cerrar': return { titulo: '¿Cerrar proyecto?', mensaje: 'El proyecto será cerrado definitivamente. Esta acción no se puede deshacer.', accion: 'Cerrar proyecto', tono: 'acento', procesando: 'Cerrando proyecto…', exito: 'Proyecto cerrado' }
      case 'cancelar': return { titulo: '¿Cancelar proyecto?', mensaje: 'Esta acción cancelará el proyecto. No se puede deshacer.', accion: 'Cancelar proyecto', tono: 'acento', procesando: 'Cancelando proyecto…', exito: 'Proyecto cancelado' }
      default: return { titulo: '', mensaje: '', accion: 'Confirmar', tono: 'primario', procesando: '', exito: '' }
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

  // Galería: portada y fotos de anexos, guardadas en la base y servidas con URL firmada.
  const galeria: ImagenGaleria[] = (proyecto?.imagenes ?? []).map((img) => ({
    id: img.id,
    url: img.url,
    miniatura: img.miniatura,
    nombre: img.nombre,
    ancho: img.ancho,
    alto: img.alto,
    etiqueta: img.es_portada ? 'Portada' : undefined,
  }))
  const documentos = anexos.filter((a) => !a.es_imagen)


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-[3px] border-line border-t-ink rounded-full animate-spin" />
      </div>
    )
  }

  if (!proyecto) {
    return (
      <div className="text-left py-8 px-6">
        <p className="text-sm text-[#6B7280]">Proyecto no encontrado</p>
        <button onClick={() => navigate(basePath)} className="mt-4 text-sm text-ink hover:opacity-70 transition-opacity">Volver a proyectos</button>
      </div>
    )
  }

  return (
    <div>
      {/* ════════════════════════════════════════
          SECCIÓN 1 — BREADCRUMB Y BOTONES
          ════════════════════════════════════════ */}
      {/* Móvil: el enlace de regreso arriba y las acciones debajo; escritorio: en una fila. */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 whitespace-nowrap text-sm text-[#6B7280]">
          <ArrowLeft size={16} />
          <button onClick={() => navigate(basePath)} className="text-ink hover:opacity-70 transition-opacity">Volver a Proyectos</button>
          <span className="text-[#E5E7EB]">/</span>
          <span className="text-[#6B7280]">Detalle de Proyecto</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Acciones con el componente Button del sistema:
              principal en naranja, institucionales en azul marino, de atención con contorno naranja. */}
          {canSubmit && (
            <Button icon={<Send size={14} />} onClick={() => setShowSubmitModal(true)}>Enviar a revisión</Button>
          )}
          {canApprove && (
            <>
              <Button variant="institucional" icon={<CheckCircle size={14} />} onClick={() => setWorkflowAction('aprobar')}>Aprobar</Button>
              <Button variant="acento" icon={<XCircle size={14} />} onClick={() => setWorkflowAction('rechazar')}>Rechazar</Button>
            </>
          )}
          {canStart && (
            <Button variant="institucional" icon={<Play size={14} />} onClick={() => setWorkflowAction('iniciar')}>Iniciar ejecución</Button>
          )}
          {canSuspend && (
            <Button variant="acento" icon={<Pause size={14} />} onClick={() => setWorkflowAction('suspender')}>Suspender</Button>
          )}
          {canResume && (
            <Button variant="institucional" icon={<Play size={14} />} onClick={() => setWorkflowAction('reanudar')}>Reanudar</Button>
          )}
          {canFinalize && (
            <Button variant="outline" icon={<StopCircle size={14} />} onClick={() => setWorkflowAction('finalizar')}>Finalizar proyecto</Button>
          )}
          {canClose && (
            <Button variant="outline" icon={<CheckCircle size={14} />} onClick={() => setWorkflowAction('cerrar')}>Cerrar proyecto</Button>
          )}
          {canCancel && (
            <Button variant="acento" icon={<Ban size={14} />} onClick={() => setWorkflowAction('cancelar')}>Cancelar</Button>
          )}
          {canEdit && (
            <Button variant="outline" icon={<Pencil size={14} />} onClick={() => navigate(`${basePath}/${proyecto.id}/editar`)}>Editar proyecto</Button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════
          SECCIÓN 1b — ANÁLISIS TÉCNICO DE PERTINENCIA
          ════════════════════════════════════════ */}
      {(rol === 'COORDINADOR' || rol === 'ADMIN') && proyecto.estado === 'EN_REVISION' && (
        <div className="mb-5 border border-line bg-white overflow-hidden">
          <button
            onClick={() => setAnalisisOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-5 py-3 text-left bg-bg-soft hover:bg-bg-muted transition-colors"
          >
            <span className="text-sm font-semibold text-ink">
              📋 Análisis técnico de pertinencia
            </span>
            <span className="text-xs text-ink-muted">
              {analisisOpen ? 'Ocultar' : 'Mostrar'} formulario
            </span>
          </button>
          {analisisOpen && (
            <div className="p-5 space-y-4">
              {analisisGuardado && (
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-emerald-600">Análisis ya registrado</p>
                  <button
                    onClick={() => setAnalisisGuardado(false)}
                    className="text-xs font-medium text-ink underline hover:text-ink-muted"
                  >
                    Editar
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Factibilidad técnica <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    value={factibilidad}
                    onChange={(e) => setFactibilidad(e.target.value)}
                    disabled={analisisGuardado}
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-line bg-white text-ink focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-colors resize-none disabled:bg-bg-muted"
                    placeholder="Evalúa la viabilidad técnica del proyecto según los recursos disponibles y la capacidad del equipo..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Impacto esperado <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    value={impacto}
                    onChange={(e) => setImpacto(e.target.value)}
                    disabled={analisisGuardado}
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-line bg-white text-ink focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-colors resize-none disabled:bg-bg-muted"
                    placeholder="Describe el impacto social, académico y científico esperado del proyecto..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Pertinencia institucional <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={pertinencia}
                    onChange={(e) => setPertinencia(e.target.value)}
                    disabled={analisisGuardado}
                    className="w-full px-3 py-2.5 text-sm border border-line bg-white text-ink focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-colors disabled:bg-bg-muted"
                  >
                    <option value="">Selecciona una opción...</option>
                    <option value="Alta pertinencia">Alta pertinencia</option>
                    <option value="Pertinencia media">Pertinencia media</option>
                    <option value="Baja pertinencia">Baja pertinencia</option>
                    <option value="No pertinente">No pertinente</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Observaciones técnicas
                  </label>
                  <textarea
                    value={observacionesTecnicas}
                    onChange={(e) => setObservacionesTecnicas(e.target.value)}
                    disabled={analisisGuardado}
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-line bg-white text-ink focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-colors resize-none disabled:bg-bg-muted"
                    placeholder="Observaciones adicionales para el responsable..."
                  />
                </div>
              </div>
              {!analisisGuardado && (
                <div className="flex justify-end">
                  <button
                    onClick={handleGuardarAnalisis}
                    disabled={guardandoAnalisis}
                    className="rounded-btn inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-ink text-white hover:bg-ink-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {guardandoAnalisis ? 'Guardando...' : 'Guardar análisis'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          FICHA — ENCABEZADO INSTITUCIONAL
          ════════════════════════════════════════ */}
      <FichaEncabezado proyecto={proyecto} avance={progresoGeneral} />

      {/* ════════════════════════════════════════
          PESTAÑAS (misma lógica que antes)
          ════════════════════════════════════════ */}
      <div id="tabs-section" className="mt-6 scroll-mt-4 border-b border-line">
        <div role="tablist" aria-label="Secciones del proyecto" className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const activa = tab === t.key
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={activa}
                onClick={() => setTab(t.key)}
                className={`flex flex-shrink-0 items-center gap-2 border-b-2 px-3.5 py-3 text-[13.5px] transition-colors ${
                  activa ? 'border-naranja font-semibold text-ink' : 'border-transparent font-medium text-ink-muted hover:text-ink'
                }`}
              >
                <t.icon size={15} aria-hidden="true" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════
          DOS COLUMNAS: contenido de la pestaña y datos clave
          ════════════════════════════════════════ */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
      {/* ════════════════════════════════════════
          TAB: INFORMACIÓN — ficha por secciones
          ════════════════════════════════════════ */}
      {tab === 'info' && (
        <>
          <div className="mb-4 lg:hidden">
            <IndiceFicha variante="barra" actual={seccionActiva} />
          </div>
          <FichaInformacion
            proyecto={proyecto}
            alineaciones={alineaciones}
            beneficiarios={beneficiarios}
            firmas={firmas}
            actividades={actividades}
            galeria={galeria}
            documentos={documentos}
            onVerActividades={() => setTab('actividades')}
          />
        </>
      )}

          {/* ════════════════════════════════════════
              TAB: ACTIVIDADES
              ════════════════════════════════════════ */}
          {tab === 'actividades' && (
            <div className="space-y-5">
              {/* Header */}
              {canManageParticipants && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowAddActividad(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-ink text-white hover:bg-ink-2 active:bg-ink-deep transition-colors rounded-btn shadow-sm hover:shadow"
                  >
                    <Plus size={16} strokeWidth={2.5} /> Agregar actividad
                  </button>
                </div>
              )}

              {/* Resumen por estado */}
              {actividades.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-2">
                  {[
                    { key: 'PENDIENTE', label: 'Pendientes' },
                    { key: 'EN_PROCESO', label: 'En proceso' },
                    { key: 'COMPLETADA', label: 'Completadas' },
                    { key: 'ATRASADA', label: 'Atrasadas' },
                    { key: 'CANCELADA', label: 'Canceladas' },
                  ].map((e) => {
                    // Colores de la paleta única de estados (lib/estados.ts).
                    const t = estiloDe(TONO_ESTADO_ACTIVIDAD, e.key)
                    return { ...e, color: t.texto, bg: t.fondo, border: t.borde, dot: t.hex }
                  }).map((est) => {
                    const count = actividades.filter((a) => a.estado === est.key).length
                    return (
                      <div
                        key={est.key}
                        className={`relative overflow-hidden ${est.bg} border ${est.border} rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wide">{est.label}</p>
                            <p className={`text-[28px] font-bold leading-none mt-2 ${est.color}`}>{count}</p>
                          </div>
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                            style={{ backgroundColor: est.dot }}
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: est.dot, opacity: 0.25 }} />
                      </div>
                    )
                  })}
                </div>
              )}

              {loadingTab ? (
                <div className="flex items-center justify-center py-14">
                  <div className="w-9 h-9 border-[3px] border-line border-t-ink rounded-full animate-spin" />
                </div>
              ) : actividades.length === 0 ? (
                <div className="bg-white text-left rounded-xl border border-line py-14 px-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-bg-soft rounded-full mb-4">
                    <FolderKanban size={32} className="text-line-strong" />
                  </div>
                  <p className="text-[15px] font-semibold text-ink">No hay actividades registradas</p>
                  <p className="text-[13px] text-ink-muted mt-1 max-w-md">Agrega las actividades que se ejecutarán en este proyecto para comenzar a hacer seguimiento.</p>
                  {canManageParticipants && (
                    <button
                      onClick={() => setShowAddActividad(true)}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink bg-bg-muted hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      <Plus size={16} /> Agregar primera actividad
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-3">
                  {actividades.map((a) => {
                    const responsablePart = participantes.find((p) => p.usuario === a.responsable)
                    const responsableDocente = responsablePart
                      ? { user_first_name: responsablePart.usuario_nombre?.split(' ')[0] || '', user_last_name: responsablePart.usuario_nombre?.split(' ').slice(1).join(' ') || '' }
                      : docentesList.find((d) => d.id === a.responsable)
                    const porcentaje = parseFloat(a.porcentaje_ejecucion) || 0
                    const progressColor = porcentaje > 70 ? TONOS_ESTADO.exito.hex : porcentaje >= 30 ? TONOS_ESTADO.revision.hex : TONOS_ESTADO.peligro.hex

                    const estadoBadge: Record<EstadoActividad, { label: string; color: string }> = {
                      PENDIENTE: { label: 'Pendiente', color: `${claseInsignia(TONO_ESTADO_ACTIVIDAD, 'PENDIENTE')} ${TONOS_ESTADO.neutro.borde}` },
                      EN_PROCESO: { label: 'En proceso', color: `${claseInsignia(TONO_ESTADO_ACTIVIDAD, 'EN_PROCESO')} ${TONOS_ESTADO.info.borde}` },
                      COMPLETADA: { label: 'Completada', color: `${claseInsignia(TONO_ESTADO_ACTIVIDAD, 'COMPLETADA')} ${TONOS_ESTADO.exito.borde}` },
                      ATRASADA: { label: 'Atrasada', color: `${claseInsignia(TONO_ESTADO_ACTIVIDAD, 'ATRASADA')} ${TONOS_ESTADO.peligro.borde}` },
                      CANCELADA: { label: 'Cancelada', color: `${claseInsignia(TONO_ESTADO_ACTIVIDAD, 'CANCELADA')} ${TONOS_ESTADO.neutro.borde}` },
                    }
                    const badge = estadoBadge[a.estado] ?? estadoBadge.PENDIENTE

                    const isResponsableActividad = rol === 'ESTUDIANTE'
                      ? a.responsable == null || a.responsable === user?.id
                      : true
                    const actividadBloqueada = rol === 'ESTUDIANTE' && !isResponsableActividad

                    return (
                      <div
                        key={a.id}
                        className={`group bg-white rounded-xl border transition-all duration-200 ${actividadBloqueada ? 'border-line bg-indigo-50/40' : 'border-line hover:shadow-md'}`}
                      >
                        <div className="p-4 sm:p-5">
                          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                            {/* Contenido principal */}
                            <button
                              type="button"
                              onClick={() => navigate(`${basePath}/${a.proyecto}/actividades/${a.id}`)}
                              className="flex-1 min-w-0 text-left space-y-2"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-medium bg-bg-muted text-ink-texto rounded border border-line">
                                  {a.codigo}
                                </span>
                                <h3 className="text-[14px] sm:text-[15px] font-semibold text-ink">
                                  {a.nombre}
                                </h3>
                                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded border ${badge.color}`}>
                                  {badge.label}
                                </span>
                                {rol === 'ESTUDIANTE' && (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded border ${actividadBloqueada ? 'bg-indigo-50 text-ink border-transparent' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                                    title={actividadBloqueada ? 'Esta actividad está asignada a otro estudiante' : 'Esta actividad está asignada a ti'}
                                  >
                                    {actividadBloqueada ? (
                                      <><Lock size={10} /> Asignada a {responsableDocente ? `${responsableDocente.user_first_name} ${responsableDocente.user_last_name}` : 'otro'}</>
                                    ) : (
                                      <>Asignada a ti</>
                                    )}
                                  </span>
                                )}
                              </div>

                              {a.descripcion && (
                                <p className="text-[13px] text-ink-muted leading-relaxed line-clamp-2">{a.descripcion}</p>
                              )}

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-ink-muted">
                                {responsableDocente && (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-6 h-6 rounded-full bg-bg-muted text-ink-muted flex items-center justify-center text-[10px] font-semibold">
                                      {(responsableDocente.user_first_name?.[0] || '')}{(responsableDocente.user_last_name?.[0] || '')}
                                    </div>
                                    <span className="text-ink-texto">{responsableDocente.user_first_name} {responsableDocente.user_last_name}</span>
                                  </div>
                                )}
                                {a.fecha_inicio && a.fecha_fin && (
                                  <div className="flex items-center gap-1.5">
                                    <Calendar size={13} className="text-ink-light" />
                                    <span>{formatDate(a.fecha_inicio)} — {formatDate(a.fecha_fin)}</span>
                                  </div>
                                )}
                              </div>
                            </button>

                            {/* Progreso + Acciones */}
                            <div className="flex flex-row items-center gap-4 lg:flex-col lg:items-end lg:gap-3 lg:w-44 flex-shrink-0">
                              {/* Círculo de progreso */}
                              <div className="relative w-12 h-12 flex-shrink-0">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                                  <circle cx="24" cy="24" r="20" fill="none" stroke="#E5E7EB" strokeWidth="5" />
                                  <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    fill="none"
                                    stroke={progressColor}
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 20}
                                    strokeDashoffset={2 * Math.PI * 20 - (porcentaje / 100) * 2 * Math.PI * 20}
                                    className="transition-all duration-500"
                                  />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: progressColor }}>
                                  {porcentaje}%
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                {canManageParticipants && (
                                  <>
                                    <button
                                      onClick={() => openEditActividad(a)}
                                      title="Editar actividad"
                                      className="p-2 text-ink-muted hover:text-ink hover:bg-bg-muted rounded-lg transition-colors"
                                    >
                                      <Pencil size={15} />
                                    </button>
                                    {isAdmin() && (
                                      <button
                                        onClick={() => setDeleteActividad(a)}
                                        title="Eliminar actividad"
                                        className="p-2 text-ink-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    )}
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => navigate(`${basePath}/${a.proyecto}/actividades/${a.id}`)}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                    actividadBloqueada
                                      ? 'text-ink bg-indigo-50 hover:bg-indigo-100'
                                      : 'text-ink bg-bg-muted hover:bg-indigo-100'
                                  }`}
                                  title={actividadBloqueada ? 'Solo lectura: no puedes registrar avances en esta actividad' : 'Ver actividad'}
                                >
                                  {actividadBloqueada ? (
                                    <><Lock size={12} /> Ver <span className="hidden sm:inline">(solo lectura)</span></>
                                  ) : (
                                    <>Ver <ChevronRight size={12} /></>
                                  )}
                                </button>
                              </div>
                            </div>
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
                  <span className="inline-flex items-center justify-center w-7 h-7 bg-bg-muted text-ink-muted flex-shrink-0" style={{ borderRadius: '4px' }}>
                    <Users size={13} strokeWidth={2.25} />
                  </span>
                  <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Participantes del proyecto <span style={{ fontWeight: 400, color: '#6B7280' }}>({participantes.length} participantes)</span></h2>
                </div>
                {canManageParticipants && (
                  <button onClick={() => setShowAddParticipante(true)} className="rounded-btn inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-ink text-white hover:bg-ink-2 hover:shadow-md hover:shadow-ink/20 transition-all">
                    <Plus size={14} /> Agregar participante
                  </button>
                )}
              </div>

              {loadingTab ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-[3px] border-line border-t-ink rounded-full animate-spin" />
                </div>
              ) : participantes.length === 0 ? (
                <div className="bg-white text-left" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '48px 24px' }}>
                  <Users size={40} className="text-line mb-3" />
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0A' }}>No hay participantes registrados</p>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Agrega docentes y estudiantes que participarán en este proyecto</p>
                </div>
              ) : (
                <div className="bg-white overflow-hidden" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px' }}>
                  <table className="w-full text-sm">
                    <thead className="bg-bg-soft" style={{ borderBottom: '0.5px solid #E5E7EB' }}>
                      <tr>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-ink uppercase tracking-wider">Nombre</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-ink uppercase tracking-wider">Rol en proyecto</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-ink uppercase tracking-wider">Horas</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-ink uppercase tracking-wider">Estado</th>
                        {canManageParticipants && <th className="text-left px-4 py-3 text-[11px] font-semibold text-ink uppercase tracking-wider">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {participantes.map((p, i) => {
                        const initials = (p.usuario_nombre || '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                        const horasComp = parseFloat(p.horas_comprometidas) || 0
                        const horasCumpl = parseFloat(p.horas_cumplidas) || 0
                        const horasPercent = horasComp > 0 ? Math.min((horasCumpl / horasComp) * 100, 100) : 0
                        return (
                          <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-bg-soft'} hover:bg-bg-soft transition-colors duration-150`}>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${PARTICIPANTE_AVATAR_COLORS[p.rol] || PARTICIPANTE_AVATAR_COLORS.ESTUDIANTE}`}>
                                  {initials || '?'}
                                </div>
                                <div>
                                  <p className="font-medium text-ink-texto">{p.usuario_nombre || '-'}</p>
                                  {p.usuario_codigo && <p className="text-xs text-ink-muted font-mono">{p.usuario_codigo}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-md ${claseInsignia(TONO_ROL_PARTICIPANTE, p.rol)}`}>
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
                                <span className="text-ink-texto text-xs font-medium">{p.horas_cumplidas || '0'}h / {p.horas_comprometidas || '0'}h</span>
                                <div className="w-20 h-1.5 bg-line rounded-full overflow-hidden">
                                  <div className="h-full bg-ink rounded-full transition-all" style={{ width: `${horasPercent}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <EstadoBadge estado={p.estado} />
                            </td>
                            {canManageParticipants && (
                              <td className="px-4 py-3.5 text-left">
                                <div className="flex items-center justify-start gap-1">
                                  <button
                                    onClick={() => openEditParticipante(p)}
                                    title="Editar participante"
                                    className="p-1.5 text-ink-muted hover:bg-ink hover:text-white transition-colors"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteParticipante(p)}
                                    title="Eliminar participante"
                                    className="p-1.5 text-status-error hover:bg-red-600 hover:text-white transition-colors"
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
              TAB: DISPOSITIVOS (Módulo 2, IoT)
              ════════════════════════════════════════ */}
          {tab === 'dispositivos' && proyecto && (
            <DispositivosTab
              proyectoId={proyecto.id}
              monitoreoActivo={!!proyecto.monitoreo_activo}
              puedeGestionar={canManageDevices}
            />
          )}

          {/* ════════════════════════════════════════
              TAB: HISTORIAL
              ════════════════════════════════════════ */}
          {tab === 'historial' && (
            <div className="bg-white" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '20px 24px' }}>
              <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-line">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-600 flex-shrink-0" style={{ borderRadius: '4px' }}>
                  <Clock size={15} strokeWidth={2.25} />
                </span>
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>Historial de cambios</h2>
              </div>
              {loadingTab ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-[3px] border-line border-t-ink rounded-full animate-spin" />
                </div>
              ) : historial.length === 0 ? (
                <div className="text-left py-12 px-6">
                  <Clock size={40} className="text-[#E5E7EB] mb-3" />
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

        </div>

        {/* ─── Columna lateral: índice de la ficha (escritorio) y datos clave ─── */}
        <aside className="min-w-0 space-y-8 self-start lg:sticky lg:top-0" aria-label="Datos clave del proyecto">
          {tab === 'info' && (
            <div className="hidden lg:block">
              <IndiceFicha variante="lateral" actual={seccionActiva} />
            </div>
          )}
          <FichaDatosClave
            proyecto={proyecto}
            participantes={participantes}
            actividadesCompletadas={actividadesCompletadas}
            actividadesTotal={actividades.length}
            diasRestantes={diasRestantes(proyecto.fecha_fin_planificada)}
            puedeAgregarIntegrante={Boolean(canManageParticipants)}
            onAgregarIntegrante={() => setShowAddParticipante(true)}
            onVerParticipantes={() => {
              setTab('participantes')
              setTimeout(() => document.getElementById('tabs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
            }}
          />
        </aside>
      </div>

      {/* ════════════════════════════════════════
          MODALES (mantenidos intactos)
          ════════════════════════════════════════ */}
      <OperationStatusModal operacion={operacion} />

      <ConfirmModal
        isOpen={showSubmitModal}
        titulo="¿Enviar proyecto a revisión?"
        mensaje="Una vez enviado, el proyecto pasará al proceso de revisión. Comprueba que la información esté completa."
        confirmLabel="Enviar a revisión"
        onConfirm={handleEnviarRevision}
        onCancel={() => setShowSubmitModal(false)}
      />

      <ConfirmModal
        isOpen={workflowAction === 'rechazar'}
        titulo="¿Rechazar proyecto?"
        mensaje="El proyecto volverá a estado Borrador y el responsable será notificado."
        confirmLabel="Rechazar proyecto"
        cancelLabel="Cancelar"
        confirmDisabled={rechazarMotivo.trim().length < 10}
        width={460}
        tono="acento"
        onConfirm={handleRechazar}
        onCancel={() => { setWorkflowAction(null); setRechazarMotivo('') }}
      >
        <div>
          <label className="block text-[12.5px] font-semibold text-[#1A1A2E] mb-1.5 text-left">
            Motivo del rechazo <span className="text-rose-600">*</span>
          </label>
          <textarea
            value={rechazarMotivo}
            onChange={(e) => setRechazarMotivo(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 text-sm text-[#1A1A2E] bg-bg-soft border border-line focus:outline-none focus:border-ink focus:bg-white focus:ring-2 focus:ring-ink/10 transition-colors resize-none"
            style={{ borderRadius: '4px' }}
            placeholder="Describe las observaciones o correcciones necesarias..."
          />
          <div className="flex items-center justify-end mt-1.5">
            <p className={`text-[11px] tabular-nums ${rechazarMotivo.trim().length < 10 ? 'text-rose-600 font-semibold' : 'text-[#9CA3AF]'}`}>
              {rechazarMotivo.trim().length} / mín. 10 caracteres
            </p>
          </div>
        </div>
      </ConfirmModal>

      <ConfirmModal
        isOpen={workflowAction !== null && workflowAction !== 'rechazar'}
        titulo={getWorkflowModalContent().titulo}
        mensaje={getWorkflowModalContent().mensaje}
        confirmLabel={getWorkflowModalContent().accion}
        tono={getWorkflowModalContent().tono}
        cancelLabel={workflowAction === 'cancelar' ? 'Volver' : 'Cancelar'}
        onConfirm={handleWorkflowAction}
        onCancel={() => setWorkflowAction(null)}
      />

      {/* Modal: Agregar participante */}
      <Modal
        open={showAddParticipante}
        onClose={() => { setShowAddParticipante(false); setSelectedUser(null); setSearchUser(''); setSearchResults([]) }}
        title="Agregar participante"
        subtitle="Busca un usuario y asígnale un rol en el proyecto."
        icon={<UserPlus size={20} className="text-[#0F172A]" />}
        size="lg"
        footer={
          <>
            <button onClick={() => { setShowAddParticipante(false); setSelectedUser(null); setSearchUser(''); setSearchResults([]) }} className="rounded-btn px-4 py-2 text-sm font-medium text-ink-texto bg-white border border-line hover:bg-bg-soft transition-colors">
              Cancelar
            </button>
            <button onClick={handleAddParticipante} disabled={!selectedUser || addingParticipant} className="rounded-btn px-4 py-2 text-sm font-medium text-white bg-ink hover:bg-ink-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {addingParticipant ? 'Agregando...' : 'Agregar participante'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-ink-texto mb-2">Buscar usuario *</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={selectedUser ? `${selectedUser.user_first_name} ${selectedUser.user_last_name}` : searchUser}
                  onChange={(e) => { setSelectedUser(null); setSearchUser(e.target.value) }}
                  className="rounded-btn w-full pl-10 pr-10 py-2.5 border border-line text-sm focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink transition-colors"
                  placeholder="Buscar por nombre o cédula..."
                />
                {selectedUser && (
                  <button onClick={() => { setSelectedUser(null); setSearchUser('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
                    <XCircle size={16} />
                  </button>
                )}
              </div>
              {searchResults.length > 0 && !selectedUser && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-line shadow-lg max-h-48 overflow-y-auto" style={{ borderRadius: 0 }}>
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setSearchUser(''); setSearchResults([]) }}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-bg-soft border-b border-[#F3F4F6] last:border-0 flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {(u.user_first_name?.[0] || '')}{(u.user_last_name?.[0] || '')}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[#0A0A0A] truncate">{u.user_first_name} {u.user_last_name}</p>
                        <p className="text-xs text-[#6B7280]">Cédula: {u.documento_identidad || '—'} | {ROL_LABELS[u.rol] || u.rol}</p>
                      </div>
                      <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${u.rol === 'ADMIN' ? 'bg-[#FEE2E2] text-[#B91C1C]' : u.rol === 'COORDINADOR' ? 'bg-[#EDE9FE] text-[#5B21B6]' : u.rol === 'DOCENTE' ? 'bg-slate-100 text-slate-600' : 'bg-[#DBEAFE] text-[#1D4ED8]'}`}>
                        {u.rol}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {searchUser.length >= 2 && searchResults.length === 0 && !selectedUser && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-line shadow-lg p-4 text-left" style={{ borderRadius: 0 }}>
                  <p className="text-sm text-[#6B7280]">No se encontraron usuarios</p>
                </div>
              )}
            </div>
            {selectedUser && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200" style={{ borderRadius: 0 }}>
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {(selectedUser.user_first_name?.[0] || '')}{(selectedUser.user_last_name?.[0] || '')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#0A0A0A] truncate">{selectedUser.user_first_name} {selectedUser.user_last_name}</p>
                  <p className="text-xs text-[#6B7280]">{selectedUser.codigo} · {selectedUser.rol}</p>
                </div>
                <button onClick={() => { setSelectedUser(null); setSearchUser('') }} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <XCircle size={18} />
                </button>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-texto mb-2">Rol en el proyecto *</label>
              <select value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value as RolParticipante)} className="rounded-btn w-full px-3 py-2.5 border border-line text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink transition-colors">
                <option value="">Selecciona un rol...</option>
                <option value="LIDER">Líder</option>
                <option value="DOCENTE">Docente</option>
                <option value="ESTUDIANTE">Estudiante</option>
                <option value="APOYO">Apoyo</option>
                <option value="EXTERNO">Externo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-texto mb-2">Horas comprometidas</label>
              <input type="number" value={nuevasHoras} onChange={(e) => setNuevasHoras(e.target.value)} min="0" className="rounded-btn w-full px-3 py-2.5 border border-line text-sm focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink transition-colors" placeholder="Ej: 40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-texto mb-2">Observaciones</label>
              <textarea value={nuevasObs} onChange={(e) => setNuevasObs(e.target.value)} rows={3} className="rounded-btn w-full px-3 py-2.5 border border-line text-sm focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink transition-colors resize-none" placeholder="Observaciones adicionales..." />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={editParticipante !== null}
        onClose={() => setEditParticipante(null)}
        title="Editar participante"
        subtitle="Modifica el rol, horas o estado del participante."
        icon={<Pencil size={20} className="text-[#0F172A]" />}
        size="lg"
        footer={
          <>
            <button onClick={() => setEditParticipante(null)} className="rounded-btn px-4 py-2 text-sm font-medium text-ink-texto bg-white border border-line hover:bg-bg-soft transition-colors">
              Cancelar
            </button>
            <button onClick={handleEditParticipante} disabled={savingParticipante} className="rounded-btn px-4 py-2 text-sm font-medium text-white bg-ink hover:bg-ink-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {savingParticipante ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </>
        }
      >
        {editParticipante && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-texto mb-2">Usuario</label>
                <div className="flex items-center gap-3 p-3 bg-bg-soft border border-line" style={{ borderRadius: 0 }}>
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {(editParticipante.usuario_nombre || '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0A0A0A] truncate">{editParticipante.usuario_nombre}</p>
                    {editParticipante.usuario_codigo && <p className="text-xs text-[#6B7280] font-mono">{editParticipante.usuario_codigo}</p>}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-texto mb-2">Rol en el proyecto *</label>
                <select value={editRol} onChange={(e) => setEditRol(e.target.value as RolParticipante)} className="rounded-btn w-full px-3 py-2.5 border border-line text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink transition-colors">
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
                <label className="block text-sm font-medium text-ink-texto mb-2">Horas comprometidas</label>
                <input type="number" value={editHoras} onChange={(e) => setEditHoras(e.target.value)} min="0" className="rounded-btn w-full px-3 py-2.5 border border-line text-sm focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink transition-colors" placeholder="Ej: 40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-texto mb-2">Estado</label>
                <select value={editEstado} onChange={(e) => setEditEstado(e.target.value as EstadoParticipante)} className="rounded-btn w-full px-3 py-2.5 border border-line text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink transition-colors">
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-texto mb-2">Observaciones</label>
                <textarea value={editObs} onChange={(e) => setEditObs(e.target.value)} rows={3} className="rounded-btn w-full px-3 py-2.5 border border-line text-sm focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink transition-colors resize-none" placeholder="Observaciones adicionales..." />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteParticipante !== null}
        titulo="¿Eliminar participante?"
        mensaje={`¿Estás seguro de eliminar a ${deleteParticipante?.usuario_nombre || ''} del proyecto? Se perderán todos los datos asociados a este participante.`}
        confirmLabel="Eliminar participante"
        cancelLabel="Cancelar"
        tono="peligro"
        onConfirm={handleDeleteParticipante}
        onCancel={() => setDeleteParticipante(null)}
      />

      <Modal
        open={showAddActividad || editActividad !== null}
        onClose={closeActividadModal}
        title={editActividad ? 'Editar actividad' : 'Nueva actividad'}
        subtitle={editActividad ? 'Modifica los datos de la actividad.' : 'Define una nueva actividad para el proyecto.'}
        icon={<ListPlus size={20} className="text-[#0F172A]" />}
        size="xl"
        footer={
          <>
            <button onClick={closeActividadModal} className="rounded-btn px-4 py-2 text-sm font-medium text-ink-texto bg-white border border-line hover:bg-bg-soft transition-colors">
              Cancelar
            </button>
            <button
              onClick={editActividad ? handleEditActividad : handleAddActividad}
              disabled={addingActividad || savingActividad}
              className="rounded-btn px-4 py-2 text-sm font-medium text-white bg-ink hover:bg-ink-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {(addingActividad || savingActividad) ? 'Guardando...' : (editActividad ? 'Guardar cambios' : 'Crear actividad')}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-texto mb-2">Nombre <span className="text-red-500">*</span></label>
              <input value={actNombre} onChange={(e) => setActNombre(e.target.value)} className="rounded-btn w-full px-3 py-2.5 border border-line text-sm focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink transition-colors" placeholder="Nombre de la actividad" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-texto mb-2">Descripción <span className="text-red-500">*</span></label>
              <textarea
                value={actDesc}
                onChange={(e) => setActDesc(e.target.value)}
                rows={3}
                className="rounded-btn w-full px-3 py-2.5 border border-line text-sm focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink transition-colors resize-none"
                placeholder="Ej: Taller de 4 horas sobre elaboración de presupuesto personal, control de gastos y cultura de ahorro, dirigido a 30 estudiantes de la carrera de Economía."
              />
              <p className="text-[11px] text-[#9CA3AF] mt-1.5">Describe brevemente qué se hará, a quién va dirigido y resultados esperados.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-texto mb-2">Responsable</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                <input
                  type="text"
                  value={actResponsableSearch}
                  onChange={(e) => setActResponsableSearch(e.target.value)}
                  onFocus={() => setActResponsableSearchOpen(true)}
                  placeholder="Buscar participante por nombre o código..."
                  className="rounded-btn w-full pl-9 pr-3 py-2.5 border border-line text-sm focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink transition-colors"
                />
                {actResponsableSearchOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-line shadow-lg max-h-48 overflow-y-auto" style={{ borderRadius: 0 }}>
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
                          className={`w-full text-left px-3 py-2 text-sm border-b border-[#F3F4F6] last:border-0 transition-colors ${actResponsable === String(p.usuario) ? 'bg-slate-100 text-slate-800' : 'hover:bg-bg-soft'}`}
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
                      <div className="p-3 text-xs text-[#6B7280] text-left">
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
                <label className="block text-sm font-medium text-ink-texto mb-2">Fecha inicio <span className="text-red-500">*</span></label>
                <input type="date" value={actFechaInicio} onChange={(e) => setActFechaInicio(e.target.value)} className="rounded-btn w-full px-3 py-2.5 border border-line text-sm focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-texto mb-2">Fecha fin <span className="text-red-500">*</span></label>
                <input type="date" value={actFechaFin} onChange={(e) => setActFechaFin(e.target.value)} className="rounded-btn w-full px-3 py-2.5 border border-line text-sm focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink transition-colors" />
              </div>
            </div>
            <label className="flex items-start gap-3 p-3 bg-bg-soft border border-line cursor-pointer hover:bg-[#F3F4F6] transition-colors" style={{ borderRadius: 0 }}>
              <input type="checkbox" checked={actRequiereEvidencia} onChange={(e) => setActRequiereEvidencia(e.target.checked)} className="h-4 w-4 accent-[#0F172A] mt-0.5" />
              <div>
                <span className="text-sm font-medium text-[#0A0A0A] block">¿Requiere evidencia?</span>
                <span className="text-xs text-[#6B7280]">Si se activa, los participantes deberán subir evidencias al reportar avances.</span>
              </div>
            </label>
            <div>
              <label className="block text-sm font-medium text-ink-texto mb-2">Observaciones</label>
              <textarea value={actObs} onChange={(e) => setActObs(e.target.value)} rows={2} className="rounded-btn w-full px-3 py-2.5 border border-line text-sm focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink transition-colors resize-none" placeholder="Observaciones adicionales..." />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteActividad !== null}
        titulo="¿Eliminar esta actividad?"
        mensaje="Esta acción eliminará también todos los avances y evidencias asociados a esta actividad. Esta acción no se puede deshacer."
        confirmLabel="Eliminar actividad"
        cancelLabel="Cancelar"
        tono="peligro"
        onConfirm={handleDeleteActividad}
        onCancel={() => setDeleteActividad(null)}
      />
    </div>
  )
}
