import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Send, CheckCircle, XCircle, Pause, Play, StopCircle,
  Info, ListTodo, Package, FolderKanban, Clock, Building2, Hash,
  FileSignature, Calendar, AlertTriangle, Plus, Trash2, Pencil,
  Download, X, Search, Check, Link2, Unlink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  conveniosApi, compromisosApi, productosApi, proyectoConveniosApi,
} from '@/api/convenios'
import { proyectosApi } from '@/api/proyectos'
import { usuariosApi } from '@/api/usuarios'
import { auditoriaApi, type AuditoriaRegistro } from '@/api/proyectos'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import Modal from '@/components/ui/Modal'
import {
  ESTADO_CONVENIO_LABELS, ESTADO_CONVENIO_BADGE,
  TIPO_CONVENIO_LABELS, TIPO_CONVENIO_COLORS,
  ESTADO_PROYECTO_LABELS, ESTADO_PROYECTO_COLORS,
} from '@/lib/constants'
import { formatDate } from '@/lib/formatters'
import type { EstadoCompromiso } from '@/types/convenios'
import type { Convenio, Compromiso, Producto } from '@/types/convenios'
import type { Proyecto } from '@/types/proyectos'
import type { Usuario } from '@/types/usuarios'

type Tab = 'info' | 'compromisos' | 'productos' | 'proyectos' | 'historial'

const TABS: { key: Tab; label: string; icon: typeof Info }[] = [
  { key: 'info', label: 'Información general', icon: Info },
  { key: 'compromisos', label: 'Compromisos', icon: ListTodo },
  { key: 'productos', label: 'Productos', icon: Package },
  { key: 'proyectos', label: 'Proyectos vinculados', icon: FolderKanban },
  { key: 'historial', label: 'Historial', icon: Clock },
]

const ESTADO_COMPROMISO_BADGE: Record<string, { bg: string; text: string; dot: string; pulse: boolean }> = {
  PENDIENTE:  { bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]', dot: 'bg-[#9CA3AF]', pulse: false },
  EN_PROCESO: { bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]', dot: 'bg-[#2563EB]', pulse: true },
  CUMPLIDO:   { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]', dot: 'bg-[#16A34A]', pulse: false },
  INCUMPLIDO: { bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]', dot: 'bg-[#DC2626]', pulse: false },
}

const ESTADO_COMPROMISO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  CUMPLIDO: 'Cumplido',
  INCUMPLIDO: 'Incumplido',
}

const ACCION_LABELS: Record<string, string> = {
  CREAR: 'Creación',
  ACTUALIZAR: 'Modificación',
  ELIMINAR: 'Eliminación',
  APROBAR: 'Aprobación',
  RECHAZAR: 'Rechazo',
  SUSPENDER: 'Suspensión',
  FINALIZAR: 'Finalización',
  CANCELAR: 'Cancelación',
  INICIAR_SESION: 'Inicio de sesión',
}

const ACCION_COLORS: Record<string, string> = {
  CREAR: 'bg-emerald-500',
  ACTUALIZAR: 'bg-amber-500',
  ELIMINAR: 'bg-rose-500',
  APROBAR: 'bg-emerald-500',
  RECHAZAR: 'bg-rose-500',
  SUSPENDER: 'bg-amber-500',
  FINALIZAR: 'bg-slate-500',
  CANCELAR: 'bg-rose-600',
  INICIAR_SESION: 'bg-blue-500',
}

export default function ConvenioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { isAdmin, isCoordinadorOrAbove } = usePermissions()

  const [convenio, setConvenio] = useState<Convenio | null>(null)
  const [tab, setTab] = useState<Tab>('info')
  const [loading, setLoading] = useState(true)
  const [rechazarMotivo, setRechazarMotivo] = useState('')
  const [suspenderMotivo, setSuspenderMotivo] = useState('')
  const [showFinalizar, setShowFinalizar] = useState(false)
  const [working, setWorking] = useState(false)

  const rol = user?.rol || 'ESTUDIANTE'
  const basePath = `/${rol.toLowerCase()}/convenios`

  const isAdminUser = isAdmin()
  const isCoordOrAbove = isCoordinadorOrAbove()
  const canManage = isAdminUser || isCoordOrAbove

  useEffect(() => {
    if (!id) return
    setLoading(true)
    conveniosApi.get(Number(id))
      .then(({ data }) => setConvenio(data))
      .catch(() => {
        toast.error('Error al cargar el convenio')
        navigate(basePath)
      })
      .finally(() => setLoading(false))
  }, [id, basePath, navigate])

  const handleEnviarRevision = async () => {
    if (!id) return
    setWorking(true)
    try {
      await conveniosApi.enviarRevision(Number(id))
      toast.success('Convenio enviado a revisión')
      setConvenio((prev) => prev ? { ...prev, estado: 'EN_REVISION' } : prev)
    } catch {
      toast.error('Error al enviar a revisión')
    } finally {
      setWorking(false)
    }
  }

  const handleAprobar = async () => {
    if (!id) return
    setWorking(true)
    try {
      await conveniosApi.aprobar(Number(id))
      toast.success('Convenio activado')
      setConvenio((prev) => prev ? { ...prev, estado: 'VIGENTE' } : prev)
    } catch {
      toast.error('Error al activar el convenio')
    } finally {
      setWorking(false)
    }
  }

  const handleRechazar = async () => {
    if (!id || rechazarMotivo.trim().length < 10) return
    setWorking(true)
    try {
      await conveniosApi.rechazar(Number(id))
      toast.success('Convenio rechazado, devuelto a borrador')
      setConvenio((prev) => prev ? { ...prev, estado: 'BORRADOR' } : prev)
      setRechazarMotivo('')
    } catch {
      toast.error('Error al rechazar el convenio')
    } finally {
      setWorking(false)
    }
  }

  const handleSuspender = async () => {
    if (!id || suspenderMotivo.trim().length < 5) return
    setWorking(true)
    try {
      await conveniosApi.suspender(Number(id))
      toast.success('Convenio suspendido')
      setConvenio((prev) => prev ? { ...prev, estado: 'SUSPENDIDO' } : prev)
      setSuspenderMotivo('')
    } catch {
      toast.error('Error al suspender el convenio')
    } finally {
      setWorking(false)
    }
  }

  const handleReactivar = async () => {
    if (!id) return
    setWorking(true)
    try {
      await conveniosApi.aprobar(Number(id))
      toast.success('Convenio reactivado')
      setConvenio((prev) => prev ? { ...prev, estado: 'VIGENTE' } : prev)
    } catch {
      toast.error('Error al reactivar el convenio')
    } finally {
      setWorking(false)
    }
  }

  const handleFinalizar = async () => {
    if (!id) return
    setWorking(true)
    try {
      await conveniosApi.finalizar(Number(id))
      toast.success('Convenio finalizado')
      setConvenio((prev) => prev ? { ...prev, estado: 'FINALIZADO' } : prev)
      setShowFinalizar(false)
    } catch {
      toast.error('Error al finalizar el convenio')
    } finally {
      setWorking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-xs text-ink-muted">Cargando convenio...</p>
        </div>
      </div>
    )
  }

  if (!convenio) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-ink-muted">Convenio no encontrado</p>
        <button
          onClick={() => navigate(basePath)}
          className="mt-4 text-sm text-accent hover:underline"
        >
          Volver a convenios
        </button>
      </div>
    )
  }

  const estado = convenio.estado
  const canEditConvenio = canManage && estado !== 'CANCELADO' && estado !== 'FINALIZADO'

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate(basePath)}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} />
          Volver a convenios
        </button>
      </div>

      {/* HEADER */}
      <div className="bg-white border border-line p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <p className="text-xs font-mono text-ink-muted inline-flex items-center gap-1.5">
              <Hash size={11} /> {convenio.codigo}
            </p>
            <h1 className="text-2xl font-bold text-ink tracking-tight">
              {convenio.objeto || 'Convenio sin objeto definido'}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <ConvenioEstadoBadge estado={estado} />
              <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md ${TIPO_CONVENIO_COLORS[convenio.tipo] || 'bg-bg-muted'}`}>
                {TIPO_CONVENIO_LABELS[convenio.tipo] || convenio.tipo}
              </span>
              {convenio.institucion && (
                <span className="inline-flex items-center gap-1 text-[12px] text-ink-muted">
                  <Building2 size={12} className="text-emerald-600" />
                  {convenio.institucion.nombre}
                  {convenio.institucion.sigla && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-soft border border-line text-ink-muted">
                      {convenio.institucion.sigla}
                    </span>
                  )}
                </span>
              )}
            </div>
            <VigenciaIndicator
              fechaInicio={convenio.fecha_inicio}
              fechaFin={convenio.fecha_fin}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {canEditConvenio && (
              <button
                onClick={() => navigate(`${basePath}/${convenio.id}/editar`)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-btn border border-line text-ink hover:bg-bg-soft transition-colors"
              >
                <Pencil size={14} /> Editar
              </button>
            )}

            {estado === 'BORRADOR' && canManage && (
              <button
                onClick={handleEnviarRevision}
                disabled={working}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-btn bg-ink text-white hover:bg-ink/90 disabled:opacity-40 transition-colors"
              >
                <Send size={14} /> Enviar a revisión
              </button>
            )}

            {estado === 'EN_REVISION' && canManage && (
              <>
                <button
                  onClick={handleAprobar}
                  disabled={working}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                >
                  <CheckCircle size={14} /> Activar convenio
                </button>
                <button
                  onClick={() => setRechazarMotivo(' ')}
                  disabled={working}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-btn bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 transition-colors"
                >
                  <XCircle size={14} /> Rechazar
                </button>
              </>
            )}

            {estado === 'VIGENTE' && canManage && (
              <button
                onClick={() => setSuspenderMotivo(' ')}
                disabled={working}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-btn bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 transition-colors"
              >
                <Pause size={14} /> Suspender
              </button>
            )}

            {estado === 'SUSPENDIDO' && isAdminUser && (
              <button
                onClick={handleReactivar}
                disabled={working}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
              >
                <Play size={14} /> Reactivar
              </button>
            )}

            {(estado === 'VIGENTE' || estado === 'SUSPENDIDO') && isAdminUser && (
              <button
                onClick={() => setShowFinalizar(true)}
                disabled={working}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-btn bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                <StopCircle size={14} /> Finalizar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-line">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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

      {/* TAB CONTENT */}
      {tab === 'info' && <InfoTab convenio={convenio} />}
      {tab === 'compromisos' && <CompromisosTab convenioId={convenio.id} canManage={canManage} />}
      {tab === 'productos' && <ProductosTab convenioId={convenio.id} canManage={canManage} />}
      {tab === 'proyectos' && <ProyectosVinculadosTab convenioId={convenio.id} canManage={canManage} isAdminUser={isAdminUser} />}
      {tab === 'historial' && <HistorialTab convenioId={convenio.id} />}

      {/* MODAL: Rechazar (motivo) */}
      <Modal
        open={rechazarMotivo !== '' && estado === 'EN_REVISION'}
        onClose={() => setRechazarMotivo('')}
        title="Rechazar convenio"
        subtitle="El convenio volverá a estado Borrador para correcciones."
        icon={<XCircle size={20} className="text-rose-600" />}
        size="md"
        footer={
          <>
            <button
              onClick={() => setRechazarMotivo('')}
              className="px-4 py-2 text-sm font-medium rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleRechazar}
              disabled={working || rechazarMotivo.trim().length < 10}
              className="px-4 py-2 text-sm font-semibold rounded-btn text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {working ? 'Rechazando...' : 'Rechazar convenio'}
            </button>
          </>
        }
      >
        <label className="block text-xs font-medium text-ink-muted mb-2">Motivo del rechazo *</label>
        <textarea
          value={rechazarMotivo}
          onChange={(e) => setRechazarMotivo(e.target.value)}
          rows={4}
          className="w-full px-3 py-2.5 border border-line rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-colors resize-none"
          placeholder="Describe las observaciones o correcciones necesarias..."
        />
        {rechazarMotivo.length > 0 && rechazarMotivo.trim().length < 10 && (
          <p className="text-xs text-rose-500 mt-1.5">Mínimo 10 caracteres ({rechazarMotivo.trim().length}/10)</p>
        )}
      </Modal>

      {/* MODAL: Suspender (motivo) */}
      <Modal
        open={suspenderMotivo !== '' && estado === 'VIGENTE'}
        onClose={() => setSuspenderMotivo('')}
        title="Suspender convenio"
        subtitle="El convenio entrará en estado Suspendido temporalmente."
        icon={<Pause size={20} className="text-amber-600" />}
        size="md"
        footer={
          <>
            <button
              onClick={() => setSuspenderMotivo('')}
              className="px-4 py-2 text-sm font-medium rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSuspender}
              disabled={working || suspenderMotivo.trim().length < 5}
              className="px-4 py-2 text-sm font-semibold rounded-btn text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {working ? 'Suspendiendo...' : 'Suspender convenio'}
            </button>
          </>
        }
      >
        <label className="block text-xs font-medium text-ink-muted mb-2">Motivo de la suspensión *</label>
        <textarea
          value={suspenderMotivo}
          onChange={(e) => setSuspenderMotivo(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 border border-line rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors resize-none"
          placeholder="Describe el motivo de la suspensión..."
        />
        {suspenderMotivo.length > 0 && suspenderMotivo.trim().length < 5 && (
          <p className="text-xs text-amber-600 mt-1.5">Mínimo 5 caracteres ({suspenderMotivo.trim().length}/5)</p>
        )}
      </Modal>

      {/* MODAL: Finalizar */}
      <Modal
        open={showFinalizar}
        onClose={() => setShowFinalizar(false)}
        title="¿Finalizar este convenio?"
        subtitle="Confirma que el convenio ha cumplido su propósito."
        icon={<StopCircle size={20} className="text-slate-600" />}
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowFinalizar(false)}
              className="px-4 py-2 text-sm font-medium rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleFinalizar}
              disabled={working}
              className="px-4 py-2 text-sm font-semibold rounded-btn text-white bg-slate-600 hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              {working ? 'Finalizando...' : 'Sí, finalizar'}
            </button>
          </>
        }
      >
        <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <AlertTriangle size={16} className="text-slate-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-700">
            Una vez finalizado, el convenio no podrá volver a estado Vigente. Esta acción
            se puede revertir solamente cancelando el convenio.
          </p>
        </div>
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTES COMPARTIDOS
   ═══════════════════════════════════════════════════════════════ */

function ConvenioEstadoBadge({ estado }: { estado: string }) {
  const style = ESTADO_CONVENIO_BADGE[estado] ?? ESTADO_CONVENIO_BADGE.BORRADOR!
  const label = ESTADO_CONVENIO_LABELS[estado] || estado
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

function VigenciaIndicator({ fechaInicio, fechaFin }: { fechaInicio: string | null; fechaFin: string | null }) {
  if (!fechaInicio || !fechaFin) return null
  const inicio = new Date(fechaInicio).getTime()
  const fin = new Date(fechaFin).getTime()
  const now = Date.now()

  if (now < inicio) {
    return (
      <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
        <Calendar size={12} />
        Vigencia: {formatDate(fechaInicio)} → {formatDate(fechaFin)}
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 ring-1 ring-blue-200/70">Por iniciar</span>
      </div>
    )
  }

  const total = fin - inicio
  const elapsed = Math.max(0, Math.min(total, now - inicio))
  const pct = Math.max(0, Math.min(100, (elapsed / total) * 100))
  const diffDays = Math.ceil((fin - now) / (1000 * 60 * 60 * 24))

  let color = 'bg-emerald-500'
  let badgeCls = 'bg-emerald-50 text-emerald-700 ring-emerald-200/70'
  let label = `Vence en ${diffDays} día${diffDays === 1 ? '' : 's'}`
  if (diffDays < 0) {
    color = 'bg-rose-500'
    badgeCls = 'bg-rose-50 text-rose-700 ring-rose-200/70'
    label = `Vencido hace ${Math.abs(diffDays)} día${Math.abs(diffDays) === 1 ? '' : 's'}`
  } else if (diffDays <= 30) {
    color = 'bg-amber-500'
    badgeCls = 'bg-amber-50 text-amber-700 ring-amber-200/70'
    label = `⚠ Vence en ${diffDays} día${diffDays === 1 ? '' : 's'}`
  }

  const blocks = 10
  const filled = Math.round((pct / 100) * blocks)

  return (
    <div className="mt-3 space-y-1.5 max-w-md">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-ink-muted inline-flex items-center gap-1.5">
          <Calendar size={11} /> Vigencia: {formatDate(fechaInicio)} → {formatDate(fechaFin)}
        </span>
        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ring-1 ${badgeCls}`}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: blocks }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 ${i < filled ? color : 'bg-bg-muted'}`}
          />
        ))}
      </div>
      <p className="text-[10px] text-ink-muted">{Math.round(pct)}% del tiempo transcurrido</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-0.5">{label}</p>
      <p className="text-[13.5px] text-ink font-medium">{children}</p>
    </div>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-2.5 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap ${className}`}>
      {children}
    </th>
  )
}

function LoadingBlock({ msg }: { msg: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-xs text-ink-muted">{msg}</p>
      </div>
    </div>
  )
}

function EmptyTab({ icon: Icon, msg, action }: { icon: typeof ListTodo; msg: string; action?: React.ReactNode }) {
  return (
    <div className="bg-white border border-line p-12 text-center">
      <Icon size={40} className="mx-auto text-ink-light mb-3 opacity-40" />
      <p className="text-sm font-medium text-ink">{msg}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 1: INFORMACIÓN GENERAL
   ═══════════════════════════════════════════════════════════════ */
function InfoTab({ convenio }: { convenio: Convenio }) {
  return (
    <div className="bg-white border border-line p-6 space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-ink mb-4 inline-flex items-center gap-2">
          <Info size={14} /> Información general
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
          <Field label="Código">
            <span className="font-mono text-xs">{convenio.codigo}</span>
          </Field>
          <Field label="Tipo">
            <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md ${TIPO_CONVENIO_COLORS[convenio.tipo] || 'bg-bg-muted'}`}>
              {TIPO_CONVENIO_LABELS[convenio.tipo] || convenio.tipo}
            </span>
          </Field>
          <Field label="Estado">
            <ConvenioEstadoBadge estado={convenio.estado} />
          </Field>
          <Field label="Institución contraparte">
            {convenio.institucion ? (
              <span className="inline-flex items-center gap-1.5">
                <Building2 size={12} className="text-emerald-600" />
                {convenio.institucion.nombre}
                {convenio.institucion.sigla && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-soft border border-line text-ink-muted">
                    {convenio.institucion.sigla}
                  </span>
                )}
              </span>
            ) : <span className="text-ink-light">—</span>}
          </Field>
          <Field label="Entidad contraparte">{convenio.entidad_contraparte || '—'}</Field>
          <Field label="Fecha de suscripción">
            <FileSignature size={11} className="inline mr-1 text-ink-light" />
            {formatDate(convenio.fecha_firma)}
          </Field>
          <Field label="Fecha de inicio">{formatDate(convenio.fecha_inicio)}</Field>
          <Field label="Fecha de vencimiento">{formatDate(convenio.fecha_fin)}</Field>
          <Field label="Convenio activo">
            <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ring-1 ${
              convenio.activo
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/70'
                : 'bg-bg-muted text-ink-muted ring-line'
            }`}>
              {convenio.activo ? 'Activo' : 'Inactivo'}
            </span>
          </Field>
        </div>
      </div>

      {convenio.objeto && (
        <div>
          <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5">Objeto</h3>
          <p className="text-[13.5px] text-ink leading-relaxed whitespace-pre-line">{convenio.objeto}</p>
        </div>
      )}

      {convenio.descripcion && (
        <div>
          <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5">Descripción</h3>
          <p className="text-[13.5px] text-ink-muted leading-relaxed whitespace-pre-line">{convenio.descripcion}</p>
        </div>
      )}

      {convenio.observaciones && (
        <div>
          <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5">Observaciones</h3>
          <p className="text-[13.5px] text-ink-muted leading-relaxed whitespace-pre-line">{convenio.observaciones}</p>
        </div>
      )}

      {convenio.archivo_firmado && (
        <div>
          <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5">Archivo firmado</h3>
          <a
            href={convenio.archivo_firmado}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-btn border border-line bg-white text-ink hover:bg-bg-soft transition-colors"
          >
            <Download size={14} /> Descargar archivo
          </a>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 2: COMPROMISOS
   ═══════════════════════════════════════════════════════════════ */
function CompromisosTab({ convenioId, canManage }: { convenioId: number; canManage: boolean }) {
  const [items, setItems] = useState<Compromiso[]>([])
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Compromiso | null>(null)
  const [deleteItem, setDeleteItem] = useState<Compromiso | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await compromisosApi.list({ convenio: String(convenioId), page_size: '100' })
      setItems(data.results)
    } catch {
      toast.error('Error al cargar compromisos')
    } finally {
      setLoading(false)
    }
  }, [convenioId])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    usuariosApi.list({ page_size: '200' })
      .then(({ data }) => setUsuarios(data.results))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink inline-flex items-center gap-2">
            <ListTodo size={14} /> Compromisos del convenio
            <span className="text-ink-muted font-normal">({items.length})</span>
          </h2>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus size={14} /> Agregar compromiso
          </button>
        )}
      </div>

      {loading ? (
        <LoadingBlock msg="Cargando compromisos..." />
      ) : items.length === 0 ? (
        <EmptyTab
          icon={ListTodo}
          msg="No hay compromisos registrados"
          action={canManage ? (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus size={14} /> Agregar compromiso
            </button>
          ) : undefined}
        />
      ) : (
        <div className="bg-white border border-line overflow-hidden" style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-soft/60 border-b border-line">
                <tr>
                  <Th>Código</Th>
                  <Th>Descripción</Th>
                  <Th>Responsable</Th>
                  <Th>Fecha límite</Th>
                  <Th>Estado</Th>
                  {canManage && <Th className="text-right">Acciones</Th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {items.map((c) => (
                  <tr key={c.id} className="group hover:bg-emerald-50/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium bg-bg-soft text-ink-muted rounded border border-line">
                        {c.codigo}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[320px]">
                      <p className="text-[13px] text-ink line-clamp-2" title={c.descripcion}>
                        {c.descripcion}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      {c.responsable_nombre ? (
                        <span className="text-[13px] text-ink">{c.responsable_nombre}</span>
                      ) : (
                        <span className="text-xs text-ink-light">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <FechaLimiteCell fecha={c.fecha_vencimiento} estado={c.estado} />
                    </td>
                    <td className="px-4 py-3.5">
                      <CompromisoEstadoBadge estado={c.estado} />
                    </td>
                    {canManage && (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditItem(c)}
                            title="Editar compromiso"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteItem(c)}
                            title="Eliminar compromiso"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CompromisoFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        convenioId={convenioId}
        usuarios={usuarios}
        onSaved={() => { setShowForm(false); load() }}
      />
      <CompromisoFormModal
        open={editItem !== null}
        compromiso={editItem}
        onClose={() => setEditItem(null)}
        convenioId={convenioId}
        usuarios={usuarios}
        onSaved={() => { setEditItem(null); load() }}
      />
      <DeleteCompromisoModal
        compromiso={deleteItem}
        onClose={() => setDeleteItem(null)}
        onDeleted={() => { setDeleteItem(null); load() }}
      />
    </div>
  )
}

function CompromisoEstadoBadge({ estado }: { estado: string }) {
  const style = ESTADO_COMPROMISO_BADGE[estado] ?? ESTADO_COMPROMISO_BADGE.PENDIENTE!
  const label = ESTADO_COMPROMISO_LABELS[estado] || estado
  return (
    <span
      className={`inline-flex items-center gap-0.5 min-w-[80px] justify-center ${style.bg} ${style.text}`}
      style={{ borderRadius: '20px', padding: '1px 6px', fontSize: '10px', fontWeight: 600 }}
    >
      <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
        {style.pulse && (
          <span className={`absolute inset-0 rounded-full opacity-75 ${style.dot} status-pulse`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${style.dot}`} />
      </span>
      {label}
    </span>
  )
}

function FechaLimiteCell({ fecha, estado }: { fecha: string | null; estado: string }) {
  if (!fecha) return <span className="text-xs text-ink-light">—</span>
  if (estado === 'CUMPLIDO' || estado === 'INCUMPLIDO') {
    return <span className="text-[13px] text-ink-muted tabular-nums">{formatDate(fecha)}</span>
  }
  const now = new Date()
  const fin = new Date(fecha)
  const diffDays = Math.ceil((fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <span className="text-[13px] text-rose-600 font-semibold tabular-nums">{formatDate(fecha)}</span>
        <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-rose-50 text-rose-600 ring-1 ring-rose-200/70">
          Vencido
        </span>
      </div>
    )
  }
  if (diffDays <= 7) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <span className="text-[13px] text-amber-700 font-semibold tabular-nums">{formatDate(fecha)}</span>
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-50 text-amber-700 ring-1 ring-amber-200/70">
          <AlertTriangle size={9} strokeWidth={2.5} />
          {diffDays}d
        </span>
      </div>
    )
  }
  return <span className="text-[13px] text-ink tabular-nums">{formatDate(fecha)}</span>
}

function CompromisoFormModal({
  open, onClose, convenioId, compromiso, usuarios, onSaved,
}: {
  open: boolean
  onClose: () => void
  convenioId: number
  compromiso?: Compromiso | null
  usuarios: Usuario[]
  onSaved: () => void
}) {
  const isEdit = Boolean(compromiso)
  const [form, setForm] = useState({
    codigo: '', descripcion: '', responsable: '',
    fecha_vencimiento: '', estado: 'PENDIENTE' as EstadoCompromiso, observaciones: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (compromiso) {
        setForm({
          codigo: compromiso.codigo || '',
          descripcion: compromiso.descripcion || '',
          responsable: compromiso.responsable ? String(compromiso.responsable) : '',
          fecha_vencimiento: compromiso.fecha_vencimiento || '',
          estado: compromiso.estado || 'PENDIENTE',
          observaciones: compromiso.observaciones || '',
        })
      } else {
        setForm({ codigo: '', descripcion: '', responsable: '', fecha_vencimiento: '', estado: 'PENDIENTE', observaciones: '' })
      }
    }
  }, [open, compromiso])

  const handleSubmit = async () => {
    if (!form.codigo.trim() || !form.descripcion.trim() || !form.fecha_vencimiento) {
      toast.error('Completa los campos obligatorios')
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        convenio: convenioId,
        codigo: form.codigo.trim(),
        descripcion: form.descripcion.trim(),
        responsable: form.responsable ? Number(form.responsable) : null,
        fecha_vencimiento: form.fecha_vencimiento || null,
        estado: form.estado,
        observaciones: form.observaciones.trim(),
      }
      if (isEdit && compromiso) {
        await compromisosApi.update(compromiso.id, payload)
      } else {
        await compromisosApi.create(payload)
      }
      toast.success(isEdit ? 'Compromiso actualizado' : 'Compromiso creado')
      onSaved()
    } catch {
      toast.error('Error al guardar el compromiso')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar compromiso' : 'Nuevo compromiso'}
      subtitle={isEdit ? compromiso?.codigo : 'Agrega un nuevo compromiso al convenio.'}
      icon={<ListTodo size={20} className="text-emerald-600" />}
      size="md"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold rounded-btn text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Código *</label>
            <input
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              className="w-full px-3 py-2 border border-line text-sm rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
              placeholder="Ej: COM-001"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Estado</label>
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoCompromiso })}
              className="w-full px-3 py-2 border border-line text-sm rounded-btn bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROCESO">En proceso</option>
              <option value="CUMPLIDO">Cumplido</option>
              <option value="INCUMPLIDO">Incumplido</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Descripción *</label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-line text-sm rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 resize-none"
            placeholder="Describe el compromiso..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Responsable</label>
            <select
              value={form.responsable}
              onChange={(e) => setForm({ ...form, responsable: e.target.value })}
              className="w-full px-3 py-2 border border-line text-sm rounded-btn bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            >
              <option value="">Sin asignar</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.user_first_name} {u.user_last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Fecha límite *</label>
            <input
              type="date"
              value={form.fecha_vencimiento}
              onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })}
              className="w-full px-3 py-2 border border-line text-sm rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Observaciones</label>
          <textarea
            value={form.observaciones}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-line text-sm rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 resize-none"
          />
        </div>
      </div>
    </Modal>
  )
}

function DeleteCompromisoModal({
  compromiso, onClose, onDeleted,
}: {
  compromiso: Compromiso | null
  onClose: () => void
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const handleDelete = async () => {
    if (!compromiso) return
    setDeleting(true)
    try {
      await compromisosApi.delete(compromiso.id)
      toast.success('Compromiso eliminado')
      onClose()
      onDeleted()
    } catch {
      toast.error('No se pudo eliminar el compromiso')
    } finally {
      setDeleting(false)
    }
  }
  return (
    <Modal
      open={compromiso !== null}
      onClose={onClose}
      title="¿Eliminar compromiso?"
      subtitle="Esta acción no se puede deshacer."
      icon={<AlertTriangle size={20} className="text-rose-600" />}
      size="md"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors">Cancelar</button>
          <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-semibold rounded-btn text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 transition-colors">
            {deleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </>
      }
    >
      {compromiso && (
        <div className="p-3 bg-bg-soft border border-line rounded-lg">
          <p className="text-sm font-mono text-ink-muted">{compromiso.codigo}</p>
          <p className="text-[13px] text-ink mt-1 line-clamp-2">{compromiso.descripcion}</p>
        </div>
      )}
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 3: PRODUCTOS
   ═══════════════════════════════════════════════════════════════ */
function ProductosTab({ convenioId, canManage }: { convenioId: number; canManage: boolean }) {
  const [items, setItems] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Producto | null>(null)
  const [deleteItem, setDeleteItem] = useState<Producto | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await productosApi.list({ convenio: String(convenioId), page_size: '100' })
      setItems(data.results)
    } catch {
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }, [convenioId])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink inline-flex items-center gap-2">
          <Package size={14} /> Productos del convenio
          <span className="text-ink-muted font-normal">({items.length})</span>
        </h2>
        {canManage && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus size={14} /> Agregar producto
          </button>
        )}
      </div>

      {loading ? (
        <LoadingBlock msg="Cargando productos..." />
      ) : items.length === 0 ? (
        <EmptyTab
          icon={Package}
          msg="No hay productos registrados"
          action={canManage ? (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus size={14} /> Agregar producto
            </button>
          ) : undefined}
        />
      ) : (
        <div className="bg-white border border-line overflow-hidden" style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-soft/60 border-b border-line">
                <tr>
                  <Th>Producto</Th>
                  <Th>Tipo</Th>
                  <Th>Entrega esperada</Th>
                  <Th>Entrega real</Th>
                  <Th>Estado</Th>
                  <Th>Archivo</Th>
                  {canManage && <Th className="text-right">Acciones</Th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {items.map((p) => (
                  <tr key={p.id} className="group hover:bg-emerald-50/40 transition-colors">
                    <td className="px-4 py-3.5 max-w-[280px]">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium bg-bg-soft text-ink-muted rounded border border-line mb-1">
                        {p.codigo}
                      </span>
                      <p className="text-[13px] font-medium text-ink truncate" title={p.nombre}>{p.nombre}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {p.tipo ? (
                        <span className="text-[12px] text-ink-muted">{p.tipo}</span>
                      ) : (
                        <span className="text-xs text-ink-light">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[13px] text-ink tabular-nums">{formatDate(p.fecha_entrega_esperada)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[13px] text-ink tabular-nums">{formatDate(p.fecha_entrega_real)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {p.entregado ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70">
                          <Check size={11} strokeWidth={3} /> Entregado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md bg-bg-muted text-ink-muted ring-1 ring-line">
                          <X size={11} strokeWidth={3} /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {p.archivo ? (
                        <a
                          href={p.archivo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] text-emerald-600 hover:text-emerald-700"
                        >
                          <Download size={12} /> Descargar
                        </a>
                      ) : (
                        <span className="text-xs text-ink-light">—</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditItem(p)}
                            title="Editar producto"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteItem(p)}
                            title="Eliminar producto"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProductoFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        convenioId={convenioId}
        onSaved={() => { setShowForm(false); load() }}
      />
      <ProductoFormModal
        open={editItem !== null}
        producto={editItem}
        onClose={() => setEditItem(null)}
        convenioId={convenioId}
        onSaved={() => { setEditItem(null); load() }}
      />
      <DeleteProductoModal
        producto={deleteItem}
        onClose={() => setDeleteItem(null)}
        onDeleted={() => { setDeleteItem(null); load() }}
      />
    </div>
  )
}

function ProductoFormModal({
  open, onClose, convenioId, producto, onSaved,
}: {
  open: boolean
  onClose: () => void
  convenioId: number
  producto?: Producto | null
  onSaved: () => void
}) {
  const isEdit = Boolean(producto)
  const [form, setForm] = useState({
    codigo: '', nombre: '', descripcion: '', tipo: '',
    fecha_entrega_esperada: '', fecha_entrega_real: '',
    entregado: false, observaciones: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (producto) {
        setForm({
          codigo: producto.codigo || '',
          nombre: producto.nombre || '',
          descripcion: producto.descripcion || '',
          tipo: producto.tipo || '',
          fecha_entrega_esperada: producto.fecha_entrega_esperada || '',
          fecha_entrega_real: producto.fecha_entrega_real || '',
          entregado: producto.entregado,
          observaciones: producto.observaciones || '',
        })
      } else {
        setForm({ codigo: '', nombre: '', descripcion: '', tipo: '', fecha_entrega_esperada: '', fecha_entrega_real: '', entregado: false, observaciones: '' })
      }
    }
  }, [open, producto])

  const handleSubmit = async () => {
    if (!form.codigo.trim() || !form.nombre.trim() || !form.fecha_entrega_esperada) {
      toast.error('Completa los campos obligatorios')
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        convenio: convenioId,
        codigo: form.codigo.trim(),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        tipo: form.tipo.trim(),
        fecha_entrega_esperada: form.fecha_entrega_esperada || null,
        fecha_entrega_real: form.fecha_entrega_real || null,
        entregado: form.entregado,
        observaciones: form.observaciones.trim(),
      }
      if (isEdit && producto) {
        await productosApi.update(producto.id, payload)
      } else {
        await productosApi.create(payload)
      }
      toast.success(isEdit ? 'Producto actualizado' : 'Producto creado')
      onSaved()
    } catch {
      toast.error('Error al guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
      subtitle={isEdit ? producto?.nombre : 'Agrega un nuevo producto al convenio.'}
      icon={<Package size={20} className="text-emerald-600" />}
      size="md"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold rounded-btn text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Código *</label>
            <input
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              className="w-full px-3 py-2 border border-line text-sm rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
              placeholder="Ej: PRD-001"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Nombre *</label>
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-line text-sm rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
              placeholder="Ej: Informe técnico"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-line text-sm rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 resize-none"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Tipo</label>
            <input
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="w-full px-3 py-2 border border-line text-sm rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
              placeholder="Documento, software..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Entrega esperada *</label>
            <input
              type="date"
              value={form.fecha_entrega_esperada}
              onChange={(e) => setForm({ ...form, fecha_entrega_esperada: e.target.value })}
              className="w-full px-3 py-2 border border-line text-sm rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Entrega real</label>
            <input
              type="date"
              value={form.fecha_entrega_real}
              onChange={(e) => setForm({ ...form, fecha_entrega_real: e.target.value })}
              className="w-full px-3 py-2 border border-line text-sm rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Observaciones</label>
          <textarea
            value={form.observaciones}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-line text-sm rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 resize-none"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={form.entregado}
            onChange={(e) => setForm({ ...form, entregado: e.target.checked })}
            className="h-4 w-4 accent-emerald-600"
          />
          <span className="text-sm text-ink">Marcar como entregado</span>
        </label>
      </div>
    </Modal>
  )
}

function DeleteProductoModal({
  producto, onClose, onDeleted,
}: {
  producto: Producto | null
  onClose: () => void
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const handleDelete = async () => {
    if (!producto) return
    setDeleting(true)
    try {
      await productosApi.delete(producto.id)
      toast.success('Producto eliminado')
      onClose()
      onDeleted()
    } catch {
      toast.error('No se pudo eliminar el producto')
    } finally {
      setDeleting(false)
    }
  }
  return (
    <Modal
      open={producto !== null}
      onClose={onClose}
      title="¿Eliminar producto?"
      subtitle="Esta acción no se puede deshacer."
      icon={<AlertTriangle size={20} className="text-rose-600" />}
      size="md"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors">Cancelar</button>
          <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-semibold rounded-btn text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 transition-colors">
            {deleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </>
      }
    >
      {producto && (
        <div className="p-3 bg-bg-soft border border-line rounded-lg">
          <p className="text-sm font-mono text-ink-muted">{producto.codigo}</p>
          <p className="text-[13px] text-ink mt-1">{producto.nombre}</p>
        </div>
      )}
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 4: PROYECTOS VINCULADOS
   ═══════════════════════════════════════════════════════════════ */
function ProyectosVinculadosTab({
  convenioId, canManage, isAdminUser,
}: {
  convenioId: number
  canManage: boolean
  isAdminUser: boolean
}) {
  const [vinculados, setVinculados] = useState<{ id: number; proyecto: number; fecha_vinculacion: string; vigente: boolean }[]>([])
  const [proyectos, setProyectos] = useState<Record<number, Proyecto>>({})
  const [loading, setLoading] = useState(true)
  const [showVincular, setShowVincular] = useState(false)
  const [unlinkItem, setUnlinkItem] = useState<{ id: number; titulo: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await proyectoConveniosApi.list({ convenio: String(convenioId), page_size: '100' })
      setVinculados(data.results.map((v) => ({
        id: v.id, proyecto: v.proyecto, fecha_vinculacion: v.fecha_vinculacion, vigente: v.vigente,
      })))
      const unique = Array.from(new Set(data.results.map((r) => r.proyecto)))
      const fetched: Record<number, Proyecto> = {}
      await Promise.all(unique.map(async (id) => {
        try {
          const { data: p } = await proyectosApi.get(id)
          fetched[id] = p
        } catch {
          /* skip */
        }
      }))
      setProyectos(fetched)
    } catch {
      toast.error('Error al cargar proyectos vinculados')
    } finally {
      setLoading(false)
    }
  }, [convenioId])

  useEffect(() => { load() }, [load])

  const handleUnlink = async () => {
    if (!unlinkItem) return
    try {
      await proyectoConveniosApi.delete(unlinkItem.id)
      toast.success('Proyecto desvinculado')
      setUnlinkItem(null)
      load()
    } catch {
      toast.error('No se pudo desvincular el proyecto')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink inline-flex items-center gap-2">
          <FolderKanban size={14} /> Proyectos vinculados
          <span className="text-ink-muted font-normal">({vinculados.length})</span>
        </h2>
        {canManage && (
          <button
            onClick={() => setShowVincular(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus size={14} /> Vincular proyecto
          </button>
        )}
      </div>

      {loading ? (
        <LoadingBlock msg="Cargando proyectos..." />
      ) : vinculados.length === 0 ? (
        <EmptyTab
          icon={FolderKanban}
          msg="No hay proyectos vinculados"
          action={canManage ? (
            <button
              onClick={() => setShowVincular(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus size={14} /> Vincular proyecto
            </button>
          ) : undefined}
        />
      ) : (
        <div className="bg-white border border-line overflow-hidden" style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-soft/60 border-b border-line">
                <tr>
                  <Th>Proyecto</Th>
                  <Th>Estado</Th>
                  <Th>Responsable</Th>
                  <Th>Vinculado el</Th>
                  <Th>Vigente</Th>
                  {isAdminUser && <Th className="text-right">Acciones</Th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {vinculados.map((v) => {
                  const p = proyectos[v.proyecto]
                  return (
                    <tr key={v.id} className="group hover:bg-emerald-50/40 transition-colors">
                      <td className="px-4 py-3.5 max-w-[320px]">
                        {p ? (
                          <>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium bg-bg-soft text-ink-muted rounded border border-line mb-1">
                              <Hash size={9} className="text-ink-light" />
                              {p.codigo}
                            </span>
                            <p className="text-[13px] font-medium text-ink truncate" title={p.titulo}>{p.titulo}</p>
                          </>
                        ) : (
                          <span className="text-xs text-ink-light">Cargando...</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {p ? (
                          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-md whitespace-nowrap ${ESTADO_PROYECTO_COLORS[p.estado] || 'bg-bg-muted text-ink-muted'}`}>
                            {ESTADO_PROYECTO_LABELS[p.estado] || p.estado}
                          </span>
                        ) : <span className="text-xs text-ink-light">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[13px] text-ink">{p?.responsable_nombre || '—'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[13px] text-ink tabular-nums">{formatDate(v.fecha_vinculacion)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {v.vigente ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70">
                            <Check size={10} strokeWidth={3} /> Vigente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md bg-bg-muted text-ink-muted ring-1 ring-line">
                            <X size={10} strokeWidth={3} /> No vigente
                          </span>
                        )}
                      </td>
                      {isAdminUser && (
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => p && setUnlinkItem({ id: v.id, titulo: p.titulo })}
                              title="Desvincular proyecto"
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Unlink size={14} />
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
        </div>
      )}

      <VincularProyectoModal
        open={showVincular}
        onClose={() => setShowVincular(false)}
        convenioId={convenioId}
        yaVinculados={vinculados.map((v) => v.proyecto)}
        onSaved={() => { setShowVincular(false); load() }}
      />
      <Modal
        open={unlinkItem !== null}
        onClose={() => setUnlinkItem(null)}
        title="¿Desvincular proyecto?"
        subtitle="El proyecto dejará de estar asociado a este convenio."
        icon={<Unlink size={20} className="text-rose-600" />}
        size="md"
        footer={
          <>
            <button onClick={() => setUnlinkItem(null)} className="px-4 py-2 text-sm font-medium rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors">Cancelar</button>
            <button onClick={handleUnlink} className="px-4 py-2 text-sm font-semibold rounded-btn text-white bg-rose-600 hover:bg-rose-700 transition-colors">
              Sí, desvincular
            </button>
          </>
        }
      >
        {unlinkItem && (
          <div className="p-3 bg-bg-soft border border-line rounded-lg">
            <p className="text-[13px] text-ink">{unlinkItem.titulo}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

function VincularProyectoModal({
  open, onClose, convenioId, yaVinculados, onSaved,
}: {
  open: boolean
  onClose: () => void
  convenioId: number
  yaVinculados: number[]
  onSaved: () => void
}) {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelected([])
    setQuery('')
    setLoading(true)
    Promise.all([
      proyectosApi.list({ estado: 'APROBADO', page_size: '100' }),
      proyectosApi.list({ estado: 'EN_EJECUCION', page_size: '100' }),
    ])
      .then(([a, b]) => {
        const seen = new Set<number>()
        const merged: Proyecto[] = []
        ;[...a.data.results, ...b.data.results].forEach((p) => {
          if (!seen.has(p.id)) { seen.add(p.id); merged.push(p) }
        })
        setProyectos(merged)
      })
      .catch(() => toast.error('Error al cargar proyectos'))
      .finally(() => setLoading(false))
  }, [open])

  const filtered = proyectos.filter((p) => {
    if (yaVinculados.includes(p.id)) return false
    if (query) {
      const q = query.toLowerCase()
      return p.codigo.toLowerCase().includes(q) || p.titulo.toLowerCase().includes(q)
    }
    return true
  })

  const handleSave = async () => {
    if (selected.length === 0) {
      toast.error('Selecciona al menos un proyecto')
      return
    }
    setSaving(true)
    try {
      for (const proyectoId of selected) {
        await proyectoConveniosApi.create({ convenio: convenioId, proyecto: proyectoId, vigente: true })
      }
      toast.success(`${selected.length === 1 ? 'Proyecto vinculado' : `${selected.length} proyectos vinculados`}`)
      onSaved()
    } catch {
      toast.error('Error al vincular proyectos')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Vincular proyectos"
      subtitle="Selecciona los proyectos que se asociarán al convenio."
      icon={<Link2 size={20} className="text-emerald-600" />}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || selected.length === 0}
            className="px-4 py-2 text-sm font-semibold rounded-btn text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Vinculando...' : `Vincular ${selected.length > 0 ? `(${selected.length})` : ''}`}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código o título..."
            className="w-full h-9 pl-9 pr-3 border border-line rounded-btn bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
          />
        </div>
        <div className="border border-line rounded-btn overflow-hidden max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FolderKanban size={28} className="text-ink-light mb-2 opacity-40" />
              <p className="text-xs text-ink-muted">No hay proyectos disponibles</p>
            </div>
          ) : (
            <div className="divide-y divide-line/60">
              {filtered.map((p) => {
                const isSelected = selected.includes(p.id)
                return (
                  <label
                    key={p.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50/50' : 'hover:bg-bg-soft/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => setSelected(isSelected ? selected.filter((x) => x !== p.id) : [...selected, p.id])}
                      className="mt-0.5 h-4 w-4 accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-medium bg-bg-soft text-ink-muted rounded border border-line">
                          <Hash size={9} className="text-ink-light" />
                          {p.codigo}
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded ${ESTADO_PROYECTO_COLORS[p.estado] || 'bg-bg-muted'}`}>
                          {ESTADO_PROYECTO_LABELS[p.estado]}
                        </span>
                      </div>
                      <p className="text-[13px] font-medium text-ink truncate mt-0.5" title={p.titulo}>{p.titulo}</p>
                      {p.responsable_nombre && (
                        <p className="text-[11px] text-ink-muted mt-0.5 truncate">Responsable: {p.responsable_nombre}</p>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 5: HISTORIAL
   ═══════════════════════════════════════════════════════════════ */
function HistorialTab({ convenioId }: { convenioId: number }) {
  const [items, setItems] = useState<AuditoriaRegistro[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    auditoriaApi.list({ entidad: 'convenio', entidad_id: String(convenioId) })
      .then(({ data }) => setItems(data.results))
      .catch(() => toast.error('Error al cargar el historial'))
      .finally(() => setLoading(false))
  }, [convenioId])

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

  if (loading) return <LoadingBlock msg="Cargando historial..." />

  if (items.length === 0) {
    return (
      <div className="bg-white border border-line p-12 text-center">
        <Clock size={40} className="mx-auto text-ink-light mb-3 opacity-40" />
        <p className="text-sm font-medium text-ink">Sin historial de cambios</p>
        <p className="text-xs text-ink-muted mt-1">No se han registrado acciones para este convenio.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-line p-6">
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-bg-muted" />
        <div className="space-y-6">
          {items.map((h) => (
            <div key={h.id} className="relative pl-10">
              <div className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 border-white ${ACCION_COLORS[h.accion] || 'bg-bg-muted'}`} />
              <div className="space-y-0.5">
                <p className="text-xs text-ink-muted">{formatFechaCorta(h.creado_en)}</p>
                <p className="text-sm font-medium text-ink">
                  {ACCION_LABELS[h.accion] || h.accion}
                </p>
                <p className="text-xs text-ink-muted">por {h.usuario_nombre || 'Sistema'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
