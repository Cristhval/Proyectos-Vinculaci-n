import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Clock, Calendar, TrendingUp,
  CheckCircle, XCircle, Pencil, Inbox, AlertTriangle, Lock,
  MessageSquareWarning,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { actividadesApi, proyectosApi } from '@/api/proyectos'
import { usuariosApi } from '@/api/usuarios'
import { avancesApi } from '@/api/seguimiento'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { ESTADO_AVANCE_LABELS, ESTADO_AVANCE_BADGE, ESTADO_ACTIVIDAD_BADGE } from '@/lib/constants'
import { formatDate, formatPercent } from '@/lib/formatters'
import type { Proyecto, Actividad } from '@/types/proyectos'
import type { Avance, EstadoAvance } from '@/types/seguimiento'
import type { Usuario } from '@/types/usuarios'
import type { PaginatedResponse } from '@/types/common'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import EvidenciasSection, { type EvidenciasSectionHandle } from './EvidenciasSection'
import RegistrarAvanceModal from './RegistrarAvanceModal'

export default function ActividadDetailPage() {
  const { id, actividadId } = useParams<{ id: string; actividadId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { isAdmin } = usePermissions()

  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [actividad, setActividad] = useState<Actividad | null>(null)
  const [avances, setAvances] = useState<Avance[]>([])
  const [responsable, setResponsable] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingAvances, setLoadingAvances] = useState(false)

  const [showRegistrar, setShowRegistrar] = useState(false)
  const [editAvance, setEditAvance] = useState<Avance | null>(null)
  const [aprobarTarget, setAprobarTarget] = useState<Avance | null>(null)
  const [rechazarTarget, setRechazarTarget] = useState<Avance | null>(null)
  const [rechazarMotivo, setRechazarMotivo] = useState('')
  const [rechazando, setRechazando] = useState(false)

  const evidenciasRef = useRef<EvidenciasSectionHandle>(null)

  const rol = user?.rol || 'ESTUDIANTE'
  const basePath = `/${rol.toLowerCase()}/proyectos`

  const proyectoIdNum = id ? Number(id) : 0
  const actividadIdNum = actividadId ? Number(actividadId) : 0

  const responsableProyectoId = proyecto?.responsable != null
    ? (typeof proyecto.responsable === 'object' ? (proyecto.responsable as unknown as { id: number }).id : proyecto.responsable)
    : null
  const isDocenteResponsable = rol === 'DOCENTE' && responsableProyectoId === user?.id

  const isResponsableActividad = useMemo(() => {
    if (!user || !actividad) return false
    if (isAdmin()) return true
    if (isDocenteResponsable) return true
    // Estudiante (u otros roles no administrativos): es responsable solo si le asignaron la actividad
    // o si la actividad aún no tiene responsable (compatibilidad con actividades antiguas).
    return actividad.responsable == null || actividad.responsable === user.id
  }, [user, actividad, isAdmin, isDocenteResponsable])

  const canAddEvidencia = useMemo(() => {
    if (!user) return false
    if (isAdmin()) return true
    if (isDocenteResponsable) return true
    if (rol === 'ESTUDIANTE') return isResponsableActividad
    return false
  }, [user, isAdmin, isDocenteResponsable, rol, isResponsableActividad])

  const canApproveAvance = useMemo(() => {
    if (!user) return false
    return isAdmin() || isDocenteResponsable
  }, [user, isAdmin, isDocenteResponsable])

  useEffect(() => {
    if (!proyectoIdNum || !actividadIdNum) return
    setLoading(true)
    Promise.all([
      proyectosApi.get(proyectoIdNum).then((r) => r.data).catch(() => null),
      actividadesApi.list({ proyecto: String(proyectoIdNum), page_size: '200' }).then((r) => r.data.results as Actividad[]).catch(() => []),
    ]).then(([proy, acts]) => {
      if (!proy) {
        toast.error('Proyecto no encontrado')
        navigate(basePath)
        return
      }
      setProyecto(proy)
      const act = acts.find((a) => a.id === actividadIdNum)
      if (!act) {
        toast.error('Actividad no encontrada')
        navigate(`${basePath}/${proyectoIdNum}`)
        return
      }
      setActividad(act)
      setLoading(false)
    }).catch(() => {
      toast.error('Error al cargar la información')
      setLoading(false)
    })
  }, [proyectoIdNum, actividadIdNum, basePath, navigate])

  useEffect(() => {
    if (actividad?.responsable) {
      usuariosApi.list({ page_size: '200' })
        .then(({ data }) => {
          const found = data.results.find((u) => u.id === actividad.responsable)
          setResponsable(found || null)
        })
        .catch(() => {})
    }
  }, [actividad?.responsable])

  const loadAvances = useCallback(() => {
    if (!actividadIdNum) return
    setLoadingAvances(true)
    avancesApi.list({ actividad: String(actividadIdNum), page_size: '200' })
      .then(({ data }: { data: PaginatedResponse<Avance> }) => setAvances(data.results))
      .catch(() => toast.error('Error al cargar los avances'))
      .finally(() => setLoadingAvances(false))
  }, [actividadIdNum])

  useEffect(() => {
    if (actividad) loadAvances()
  }, [actividad, loadAvances])

  const ultimoAprobadoPorcentaje = useMemo(() => {
    const aprobados = avances.filter((a) => a.estado === 'APROBADO')
    if (aprobados.length === 0) return 0
    const max = Math.max(...aprobados.map((a) => parseFloat(a.porcentaje_avance) || 0))
    return max
  }, [avances])

  // Último porcentaje registrado por el estudiante, incluyendo avances pendientes,
  // para poder sugerir 50% en el primer avance y 100% en el segundo.
  const ultimoPorcentajeRegistrado = useMemo(() => {
    const validos = avances.filter((a) => a.estado !== 'RECHAZADO')
    if (validos.length === 0) return 0
    const max = Math.max(...validos.map((a) => parseFloat(a.porcentaje_avance) || 0))
    return max
  }, [avances])

  const avanceCompletoRegistrado = ultimoPorcentajeRegistrado >= 100

  const canRegistrarAvance = useMemo(() => {
    if (!user) return false
    if (avanceCompletoRegistrado) return false
    if (isAdmin()) return true
    if (isDocenteResponsable) return true
    if (rol === 'ESTUDIANTE') return isResponsableActividad
    return false
  }, [user, avanceCompletoRegistrado, isAdmin, isDocenteResponsable, rol, isResponsableActividad])

  const porcentajeEjecucion = useMemo(() => {
    if (!actividad) return 0
    return parseFloat(actividad.porcentaje_ejecucion) || ultimoAprobadoPorcentaje
  }, [actividad, ultimoAprobadoPorcentaje])

  const formatFechaHora = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    const dia = d.getDate()
    const mes = meses[d.getMonth()]
    const anio = d.getFullYear()
    const hora = d.getHours().toString().padStart(2, '0')
    const min = d.getMinutes().toString().padStart(2, '0')
    return `${dia} ${mes} ${anio}, ${hora}:${min}`
  }

  const getDiasRestantes = () => {
    if (!actividad?.fecha_fin) return null
    const fin = new Date(actividad.fecha_fin).getTime()
    const now = Date.now()
    const diff = Math.ceil((fin - now) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { label: `Vencida hace ${Math.abs(diff)} día${Math.abs(diff) === 1 ? '' : 's'}`, clase: 'text-rose-600 bg-rose-50 ring-rose-200/70' }
    if (diff === 0) return { label: 'Vence hoy', clase: 'text-amber-700 bg-amber-50 ring-amber-200/70' }
    return { label: `${diff} día${diff === 1 ? '' : 's'} restante${diff === 1 ? '' : 's'}`, clase: 'text-emerald-700 bg-emerald-50 ring-emerald-200/70' }
  }

  const handleConfirmAprobar = async () => {
    if (!aprobarTarget) return
    try {
      await avancesApi.aprobar(aprobarTarget.id)
      toast.success('Avance aprobado correctamente')
      setAprobarTarget(null)
      loadAvances()
      // Recargar actividad para reflejar el nuevo porcentaje_avance y progreso general
      actividadesApi.list({ proyecto: String(proyectoIdNum), page_size: '200' })
        .then(({ data }) => {
          const updated = data.results.find((a) => a.id === actividadIdNum)
          if (updated) setActividad(updated)
        })
        .catch(() => {})
      // Recargar proyecto para mantener el progreso general sincronizado
      proyectosApi.get(proyectoIdNum)
        .then(({ data }) => setProyecto(data))
        .catch(() => {})
    } catch {
      toast.error('Error al aprobar el avance')
    }
  }

  const handleConfirmRechazar = async () => {
    if (!rechazarTarget) return
    if (rechazarMotivo.trim().length < 10) {
      toast.error('El motivo debe tener al menos 10 caracteres')
      return
    }
    setRechazando(true)
    try {
      await avancesApi.rechazar(rechazarTarget.id, { motivo: rechazarMotivo.trim() })
      toast.success('Avance rechazado')
      setRechazarTarget(null)
      setRechazarMotivo('')
      loadAvances()
      // Recargar actividad para reflejar el posible recálculo de porcentaje
      actividadesApi.list({ proyecto: String(proyectoIdNum), page_size: '200' })
        .then(({ data }) => {
          const updated = data.results.find((a) => a.id === actividadIdNum)
          if (updated) setActividad(updated)
        })
        .catch(() => {})
      // Recargar proyecto para mantener el progreso general sincronizado
      proyectosApi.get(proyectoIdNum)
        .then(({ data }) => setProyecto(data))
        .catch(() => {})
    } catch {
      toast.error('Error al rechazar el avance')
    } finally {
      setRechazando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-xs text-ink-muted">Cargando actividad...</p>
        </div>
      </div>
    )
  }

  if (!actividad || !proyecto) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-ink-muted">Actividad no encontrada</p>
        <button onClick={() => navigate(`${basePath}/${proyectoIdNum}`)} className="mt-4 text-sm text-ink hover:opacity-70 transition-opacity">
          Volver al proyecto
        </button>
      </div>
    )
  }

  const diasInfo = getDiasRestantes()
  const inicialesResponsable = responsable
    ? `${(responsable.user_first_name || 'U')[0]}${(responsable.user_last_name || '')[0]}`.toUpperCase()
    : null

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate(`${basePath}/${proyectoIdNum}`)}
          className="inline-flex items-center gap-1.5 text-sm text-ink hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={14} />
          Volver a actividades
        </button>
      </div>

      {/* HEADER */}
      <div className="bg-white border border-line p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-mono text-ink-muted">{actividad.codigo}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">{actividad.nombre}</h1>
            {actividad.descripcion && (
              <p className="text-sm text-ink-muted max-w-3xl">{actividad.descripcion}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <ActividadBadge estado={actividad.estado} />
              {diasInfo && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded ring-1 ${diasInfo.clase}`}>
                  <Clock size={10} strokeWidth={2.5} />
                  {diasInfo.label}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Progreso de ejecución</span>
              <span className="text-sm font-bold text-ink">{formatPercent(porcentajeEjecucion)} completado</span>
            </div>
            <div className="w-full h-3 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className="h-full bg-ink rounded-full transition-all duration-500"
                style={{ width: `${Math.min(porcentajeEjecucion, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {inicialesResponsable || '?'}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Responsable</p>
                <p className="text-[13px] font-medium text-ink truncate">
                  {responsable ? `${responsable.user_first_name} ${responsable.user_last_name}` : 'Sin asignar'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                <Calendar size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Fecha inicio</p>
                <p className="text-[13px] font-medium text-ink">{formatDate(actividad.fecha_inicio)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Calendar size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Fecha fin</p>
                <p className="text-[13px] font-medium text-ink">{formatDate(actividad.fecha_fin)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ALERTA: actividad asignada a otro estudiante */}
      {rol === 'ESTUDIANTE' && !isResponsableActividad && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle size={18} className="text-[#1E3A8A]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1E3A8A]">
                Actividad asignada a otro estudiante
              </p>
              <p className="text-xs text-[#172554] mt-1">
                Esta actividad fue asignada a {responsable ? `${responsable.user_first_name} ${responsable.user_last_name}` : 'otro participante'}. Puedes consultar la información, pero no registrar avances ni evidencias.
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase rounded bg-blue-100 text-[#1E3A8A] ring-1 ring-[#1E3A8A]/30">
                <Lock size={10} /> Solo lectura
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN EVIDENCIAS DE LA ACTIVIDAD */}
      <div className="bg-white border border-line p-6">
        <EvidenciasSection
          ref={evidenciasRef}
          actividadId={actividadIdNum}
          hideAddButton
        />
      </div>

      {/* SECCIÓN AVANCES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-semibold text-ink inline-flex items-center gap-2">
            <TrendingUp size={14} />
            Avances registrados
            <span className="text-ink-muted font-normal">({avances.length} avances)</span>
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {canRegistrarAvance && (
              <button
                onClick={() => setShowRegistrar(true)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-500/40 transition-all"
                style={{ borderRadius: 0 }}
              >
                <Plus size={14} /> Registrar avance
              </button>
            )}
            {canAddEvidencia && (
              <button
                type="button"
                onClick={() => evidenciasRef.current?.openAddModal()}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-500/40 transition-all"
                style={{ borderRadius: 0 }}
              >
                <Plus size={14} /> Agregar evidencia
              </button>
            )}
          </div>
        </div>

        {loadingAvances ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
              <p className="text-xs text-ink-muted">Cargando avances...</p>
            </div>
          </div>
        ) : avances.length === 0 ? (
          <div className="bg-white border border-line p-12 text-center">
            <Inbox size={40} className="mx-auto text-ink-light mb-3 opacity-40" />
            <p className="text-sm font-medium text-ink">No hay avances registrados</p>
            <p className="text-xs text-ink-muted mt-1">Registra el primer avance de esta actividad</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {avances.map((av) => {
              const showAprobarRechazar = canApproveAvance && av.estado === 'PENDIENTE'
              const showEdit = canRegistrarAvance && av.registrado_por === user?.id && av.estado === 'PENDIENTE'
              return (
                <AvanceCard
                  key={av.id}
                  avance={av}
                  formatFechaHora={formatFechaHora}
                  showActions={showAprobarRechazar || showEdit}
                  showAprobarRechazar={showAprobarRechazar}
                  showEdit={showEdit}
                  onAprobar={() => setAprobarTarget(av)}
                  onRechazar={() => { setRechazarTarget(av); setRechazarMotivo('') }}
                  onEdit={() => setEditAvance(av)}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL: Registrar avance */}
      <RegistrarAvanceModal
        open={showRegistrar}
        onClose={() => setShowRegistrar(false)}
        actividadId={actividadIdNum}
        ultimoPorcentaje={ultimoPorcentajeRegistrado}
        actividadNombre={actividad?.nombre}
        onSaved={() => { setShowRegistrar(false); loadAvances() }}
      />

      {/* MODAL: Editar avance */}
      <RegistrarAvanceModal
        open={editAvance !== null}
        onClose={() => setEditAvance(null)}
        actividadId={actividadIdNum}
        ultimoPorcentaje={editAvance ? Math.max(0, (parseFloat(editAvance.porcentaje_avance) || 0) - 1) : 0}
        avance={editAvance}
        actividadNombre={actividad?.nombre}
        onSaved={() => { setEditAvance(null); loadAvances() }}
      />

      {/* MODAL: Confirmar aprobación */}
      <ConfirmModal
        isOpen={aprobarTarget !== null}
        titulo="¿Aprobar este avance?"
        mensaje={`El porcentaje de la actividad se actualizará a ${aprobarTarget ? parseFloat(aprobarTarget.porcentaje_avance) : 0}%. Al aprobar este avance, el porcentaje de ejecución de la actividad será actualizado y se registrará como completado.`}
        confirmLabel="Aprobar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmAprobar}
        onCancel={() => setAprobarTarget(null)}
      />

      {/* MODAL: Rechazar con motivo */}
      <Modal
        open={rechazarTarget !== null}
        onClose={() => { setRechazarTarget(null); setRechazarMotivo('') }}
        title="Rechazar avance"
        subtitle="El avance será marcado como rechazado y el autor deberá registrar uno nuevo."
        icon={<XCircle size={20} className="text-rose-600" />}
        size="md"
        footer={
          <>
            <button
              onClick={() => { setRechazarTarget(null); setRechazarMotivo('') }}
              className="px-4 py-2 text-sm font-medium text-ink bg-white border border-[#0A0A0A] hover:bg-gray-50 transition-colors"
              style={{ borderRadius: '0px' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmRechazar}
              disabled={rechazando || rechazarMotivo.trim().length < 10}
              className="px-4 py-2 text-sm font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ borderRadius: '0px' }}
            >
              {rechazando ? 'Rechazando...' : 'Rechazar'}
            </button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Motivo del rechazo <span className="text-red-500">*</span>
          </label>
          <textarea
            value={rechazarMotivo}
            onChange={(e) => setRechazarMotivo(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-colors resize-none"
            style={{ borderRadius: '4px' }}
            placeholder="Describe las observaciones o correcciones necesarias..."
          />
          {rechazarMotivo.length > 0 && rechazarMotivo.trim().length < 10 && (
            <p className="text-[11px] text-red-500 mt-1.5">Mínimo 10 caracteres ({rechazarMotivo.trim().length}/10)</p>
          )}
        </div>
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENTE: TARJETA DE AVANCE
   ═══════════════════════════════════════════════════════════════ */
interface AvanceCardProps {
  avance: Avance
  formatFechaHora: (s: string) => string
  showActions: boolean
  showAprobarRechazar: boolean
  showEdit: boolean
  onAprobar: () => void
  onRechazar: () => void
  onEdit: () => void
}

function AvanceCard({ avance, formatFechaHora, showAprobarRechazar, showEdit, onAprobar, onRechazar, onEdit }: AvanceCardProps) {
  const porcentaje = parseFloat(avance.porcentaje_avance) || 0
  const inicialesAutor = (avance.registrado_por_nombre || '?')
    .split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="bg-white border border-[#E5E7EB] p-4" style={{ borderRadius: '4px' }}>
      <div className="flex items-start justify-between gap-3 flex-wrap pb-3 border-b border-[#F3F4F6]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {inicialesAutor || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink truncate">{avance.registrado_por_nombre || 'Usuario'}</p>
            <p className="text-[11px] text-ink-muted">{formatFechaHora(avance.fecha_registro || avance.creado_en)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AvanceEstadoBadge estado={avance.estado} />
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70">
            <TrendingUp size={10} strokeWidth={2.5} />
            {porcentaje}%
          </span>
        </div>
      </div>

      <div className="pt-3 space-y-3">
        <p className="text-[13px] text-ink leading-relaxed whitespace-pre-line">{avance.descripcion}</p>

        {avance.estado === 'RECHAZADO' && (avance.motivo_rechazo || '').trim() && (
          <div className="bg-rose-50 border border-rose-200 rounded p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-rose-700">
              <MessageSquareWarning size={14} strokeWidth={2.5} />
              <p className="text-[11px] font-bold uppercase tracking-wider">Retroalimentación del docente</p>
            </div>
            <p className="text-[13px] text-rose-800 leading-relaxed whitespace-pre-line">{avance.motivo_rechazo}</p>
          </div>
        )}

        {avance.horas_invertidas && parseFloat(avance.horas_invertidas) > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Clock size={12} className="text-ink-muted" />
            <span>{avance.horas_invertidas} horas</span>
          </div>
        )}

        {avance.dificultades && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Dificultades</p>
            <p className="text-[13px] text-ink leading-relaxed whitespace-pre-line">{avance.dificultades}</p>
          </div>
        )}

        {avance.acciones_correctivas && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Acciones correctivas</p>
            <p className="text-[13px] text-ink leading-relaxed whitespace-pre-line">{avance.acciones_correctivas}</p>
          </div>
        )}
      </div>

      {(showAprobarRechazar || showEdit) && (
        <div className="pt-3 mt-3 border-t border-[#F3F4F6] flex items-center justify-end gap-2 flex-wrap">
          {showEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink bg-white border border-[#0A0A0A] hover:bg-gray-50 transition-colors"
              style={{ borderRadius: '0px' }}
            >
              <Pencil size={12} /> Editar
            </button>
          )}
          {showAprobarRechazar && (
            <>
              <button
                onClick={onRechazar}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] transition-colors"
                style={{ borderRadius: '0px' }}
              >
                <XCircle size={12} /> Rechazar
              </button>
              <button
                onClick={onAprobar}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#16A34A] hover:bg-[#15803D] transition-colors"
                style={{ borderRadius: '0px' }}
              >
                <CheckCircle size={12} /> Aprobar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   BADGES
   ═══════════════════════════════════════════════════════════════ */
function ActividadBadge({ estado }: { estado: string }) {
  const style = ESTADO_ACTIVIDAD_BADGE[estado] ?? ESTADO_ACTIVIDAD_BADGE.PENDIENTE!
  const label = {
    PENDIENTE: 'Pendiente',
    EN_PROCESO: 'En proceso',
    COMPLETADA: 'Completada',
    ATRASADA: 'Atrasada',
    CANCELADA: 'Cancelada',
  }[estado] || estado
  return (
    <span
      className={`inline-flex items-center gap-0.5 min-w-[90px] justify-center ${style.bg} ${style.text}`}
      style={{ borderRadius: '20px', padding: '1px 6px', fontSize: '10px', fontWeight: 600 }}
    >
      <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
        {style.pulse && (
          <span className={`absolute inset-0 rounded-full opacity-75 ${style.pulseColor ?? style.dot} status-pulse`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${style.dot}`} />
      </span>
      {label}
    </span>
  )
}

function AvanceEstadoBadge({ estado }: { estado: EstadoAvance }) {
  const style = ESTADO_AVANCE_BADGE[estado] ?? ESTADO_AVANCE_BADGE.PENDIENTE!
  const label = ESTADO_AVANCE_LABELS[estado] || estado
  return (
    <span
      className={`inline-flex items-center gap-0.5 min-w-[80px] justify-center ${style.bg} ${style.text}`}
      style={{ borderRadius: '20px', padding: '1px 6px', fontSize: '10px', fontWeight: 600 }}
    >
      <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
        {style.pulse && (
          <span className={`absolute inset-0 rounded-full opacity-75 ${style.pulseColor ?? style.dot} status-pulse`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${style.dot}`} />
      </span>
      {label}
    </span>
  )
}


