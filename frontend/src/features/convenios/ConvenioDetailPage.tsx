import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Send, CheckCircle, XCircle, Pause, Play, StopCircle,
  Info, ListTodo, Package, FolderKanban, Clock, Building2, Hash,
  FileSignature, Calendar, AlertTriangle, Plus, Trash2, Pencil,
  Download, X, Search, Check, Link2, Unlink,
  FileText, Target,
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
import ConfirmModal from '@/components/ui/ConfirmModal'
import {
  ESTADO_CONVENIO_LABELS, ESTADO_CONVENIO_BADGE,
  TIPO_CONVENIO_LABELS,
  ESTADO_PROYECTO_LABELS, ESTADO_PROYECTO_COLORS,
  TIPO_PRODUCTO_LABELS,
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

function formatFechaBanner(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return `${d.getDate().toString().padStart(2, '0')} de ${meses[d.getMonth()]}, ${d.getFullYear()}`
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
  const [working, setWorking] = useState(false)
  const [workflowAction, setWorkflowAction] = useState<string | null>(null)

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
    } catch {
      toast.error('Error al finalizar el convenio')
    } finally {
      setWorking(false)
    }
  }

  const handleConfirmWorkflow = async () => {
    if (!workflowAction) return
    switch (workflowAction) {
      case 'enviarRevision': await handleEnviarRevision(); break
      case 'aprobar': await handleAprobar(); break
      case 'reactivar': await handleReactivar(); break
      case 'finalizar': await handleFinalizar(); break
    }
    setWorkflowAction(null)
  }

  const getWorkflowModalContent = () => {
    switch (workflowAction) {
      case 'enviarRevision': return { titulo: '¿Enviar a revisión?', mensaje: 'El convenio será enviado a revisión. ¿Estás seguro?' }
      case 'aprobar': return { titulo: '¿Activar convenio?', mensaje: 'El convenio pasará a estado Vigente. ¿Estás seguro?' }
      case 'reactivar': return { titulo: '¿Reactivar convenio?', mensaje: 'El convenio volverá a estado Vigente. ¿Estás seguro?' }
      case 'finalizar': return { titulo: '¿Finalizar convenio?', mensaje: 'El convenio pasará a estado Finalizado. Esta acción no se puede deshacer.' }
      default: return { titulo: '', mensaje: '' }
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

  const diasRestantes = (fechaFin: string | null) => {
    if (!fechaFin) return null
    const fin = new Date(fechaFin)
    const hoy = new Date()
    return Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  }
  const d = diasRestantes(convenio.fecha_fin)

  return (
    <div className="space-y-0">
      {/* BREADCRUMB + BOTONES */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-sm text-[#6B7280]">
          <ArrowLeft size={16} />
          <button onClick={() => navigate(basePath)} className="text-accent hover:text-accent-hover transition-colors">Volver a Convenios</button>
          <span className="text-[#E5E7EB]">/</span>
          <span className="text-[#6B7280]">Detalle de Convenio</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canEditConvenio && (
            <button
              onClick={() => navigate(`${basePath}/${convenio.id}/editar`)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors"
              style={{ borderRadius: 0 }}
            >
              <Pencil size={14} /> Editar
            </button>
          )}
          {estado === 'BORRADOR' && canManage && (
            <button
              onClick={() => setWorkflowAction('enviarRevision')}
              disabled={working}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#0A0A0A] text-white hover:bg-gray-800 transition-colors"
              style={{ borderRadius: 0 }}
            >
              <Send size={14} /> Enviar a revisión
            </button>
          )}
          {estado === 'EN_REVISION' && canManage && (
            <>
              <button
                onClick={() => setWorkflowAction('aprobar')}
                disabled={working}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors"
                style={{ borderRadius: 0 }}
              >
                <CheckCircle size={14} /> Activar convenio
              </button>
              <button
                onClick={() => setRechazarMotivo(' ')}
                disabled={working}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors"
                style={{ borderRadius: 0 }}
              >
                <XCircle size={14} /> Rechazar
              </button>
            </>
          )}
          {estado === 'VIGENTE' && canManage && (
            <button
              onClick={() => setSuspenderMotivo(' ')}
              disabled={working}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#EAB308] text-[#0A0A0A] hover:bg-[#CA8A04] transition-colors"
              style={{ borderRadius: 0 }}
            >
              <Pause size={14} /> Suspender
            </button>
          )}
          {estado === 'SUSPENDIDO' && isAdminUser && (
            <button
              onClick={() => setWorkflowAction('reactivar')}
              disabled={working}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors"
              style={{ borderRadius: 0 }}
            >
              <Play size={14} /> Reactivar
            </button>
          )}
          {(estado === 'VIGENTE' || estado === 'SUSPENDIDO') && isAdminUser && (
            <button
              onClick={() => setWorkflowAction('finalizar')}
              disabled={working}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#6B7280] text-white hover:bg-[#4B5563] transition-colors"
              style={{ borderRadius: 0 }}
            >
              <StopCircle size={14} /> Finalizar
            </button>
          )}
        </div>
      </div>

      {/* HERO BANNER */}
      <div className="relative w-full overflow-hidden" style={{ borderRadius: '8px 8px 0 0', background: 'linear-gradient(135deg, #064E3B 0%, #065F46 40%, #047857 100%)', minHeight: 220 }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
        <div className="relative p-6 px-7 flex flex-col justify-end" style={{ minHeight: 220 }}>
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-white" style={{ borderRadius: '20px', background: '#16A34A' }}>
              {ESTADO_CONVENIO_BADGE[estado]?.pulse && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-white" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
              )}
              {ESTADO_CONVENIO_LABELS[estado] || estado}
            </span>
            <span className="inline-flex items-center px-3 py-1 text-[11px] font-semibold text-white" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.2)' }}>
              {TIPO_CONVENIO_LABELS[convenio.tipo] || convenio.tipo}
            </span>
          </div>
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight" style={{ margin: '10px 0 12px' }}>
            {convenio.objeto || 'Convenio sin objeto definido'}
          </h1>
          <div className="flex items-center gap-3 flex-wrap text-[12px]" style={{ color: 'rgba(255,255,255,0.8)' }}>
            <span className="inline-flex items-center gap-1"><Hash size={12} /> {convenio.codigo}</span>
            {convenio.institucion && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
                <span className="inline-flex items-center gap-1"><Building2 size={12} /> {convenio.institucion.nombre} {convenio.institucion.sigla && `(${convenio.institucion.sigla})`}</span>
              </>
            )}
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
            <span className="inline-flex items-center gap-1"><Calendar size={12} /> {formatFechaBanner(convenio.fecha_inicio)} → {formatFechaBanner(convenio.fecha_fin)}</span>
          </div>
        </div>
      </div>

      {/* METRICS BAR */}
      <div className="bg-white flex overflow-hidden" style={{ borderRadius: '0 0 8px 8px', border: '0.5px solid #E5E7EB', borderTop: 'none', padding: '16px 28px' }}>
        <div className="flex-1" style={{ borderRight: '0.5px solid #E5E7EB', padding: '0 24px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: '4px' }}>Fecha de inicio</p>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#0A0A0A' }}>{formatFechaBanner(convenio.fecha_inicio)}</p>
        </div>
        <div className="flex-1" style={{ borderRight: '0.5px solid #E5E7EB', padding: '0 24px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: '4px' }}>Fecha de vencimiento</p>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#0A0A0A' }}>{formatFechaBanner(convenio.fecha_fin)}</p>
        </div>
        <div className="flex-1" style={{ borderRight: '0.5px solid #E5E7EB', padding: '0 24px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: '4px' }}>Días restantes</p>
          <p style={{ fontSize: '14px', fontWeight: 700, color: d === null ? '#6B7280' : d < 0 ? '#DC2626' : d <= 30 ? '#EAB308' : '#16A34A' }}>
            {d === null ? '-' : d < 0 ? `${Math.abs(d)} días vencidos` : `${d} días restantes`}
          </p>
        </div>
        <div className="flex-1" style={{ padding: '0 24px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: '4px' }}>Estado del convenio</p>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '14px', fontWeight: 500, color: convenio.activo ? '#16A34A' : '#6B7280' }}>
              {convenio.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 min-w-0" style={{ marginTop: '20px' }}>
        {/* LEFT COLUMN */}
        <div className="space-y-0 min-w-0">
          {/* Objeto */}
          {convenio.objeto && (
            <div className="bg-white mb-4" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '20px 24px' }}>
              <div className="flex items-center gap-2.5 mb-3.5">
                <Target size={18} style={{ color: '#16A34A' }} />
                <h2 style={{ fontSize: '15px', fontWeight: 500, color: '#0A0A0A' }}>Objeto del convenio</h2>
              </div>
              <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#6B7280' }}>{convenio.objeto}</p>
            </div>
          )}
          {/* Descripción */}
          {convenio.descripcion && (
            <div className="bg-white mb-4" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '20px 24px' }}>
              <div className="flex items-center gap-2.5 mb-3.5">
                <FileText size={18} style={{ color: '#16A34A' }} />
                <h2 style={{ fontSize: '15px', fontWeight: 500, color: '#0A0A0A' }}>Descripción</h2>
              </div>
              <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#6B7280' }}>{convenio.descripcion}</p>
            </div>
          )}
          {/* Observaciones */}
          {convenio.observaciones && (
            <div className="bg-white mb-4" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '20px 24px' }}>
              <div className="flex items-center gap-2.5 mb-3.5">
                <Info size={18} style={{ color: '#16A34A' }} />
                <h2 style={{ fontSize: '15px', fontWeight: 500, color: '#0A0A0A' }}>Observaciones</h2>
              </div>
              <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#6B7280' }}>{convenio.observaciones}</p>
            </div>
          )}
          {/* Archivo firmado */}
          {convenio.archivo_firmado && (
            <div className="bg-white mb-4" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '20px 24px' }}>
              <div className="flex items-center gap-2.5 mb-3.5">
                <FileSignature size={18} style={{ color: '#16A34A' }} />
                <h2 style={{ fontSize: '15px', fontWeight: 500, color: '#0A0A0A' }}>Archivo firmado</h2>
              </div>
              <a
                href={convenio.archivo_firmado}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-[#E5E7EB] bg-white text-[#0A0A0A] hover:bg-[#F9FAFB] transition-colors"
                style={{ borderRadius: 0 }}
              >
                <Download size={14} /> Descargar archivo
              </a>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-0 min-w-0">
          {/* Información clave */}
          <div className="bg-white min-w-0" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '20px 24px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '14px' }}>Información clave</span>
            <div className="space-y-0">
              <InfoRow label="Código" value={convenio.codigo} />
              <InfoRow label="Tipo" value={TIPO_CONVENIO_LABELS[convenio.tipo] || convenio.tipo} />
              <InfoRow label="Estado" value={ESTADO_CONVENIO_LABELS[convenio.estado] || convenio.estado} />
              <InfoRow label="Entidad contraparte" value={convenio.entidad_contraparte || '-'} />
              <InfoRow label="Fecha de suscripción" value={formatFechaBanner(convenio.fecha_firma)} />
              <InfoRow label="Institución" value={convenio.institucion?.nombre || '-'} />
              <InfoRow label="Convenio activo" value={convenio.activo ? 'Sí' : 'No'} valueStyle={{ color: convenio.activo ? '#16A34A' : '#6B7280', fontWeight: 700 }} />
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-white border-b border-[#E5E7EB]" style={{ marginTop: '24px' }}>
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
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
        icon={<XCircle size={20} className="text-[#DC2626]" />}
        size="md"
        footer={
          <>
            <button
              onClick={() => setRechazarMotivo('')}
              className="px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors"
              style={{ borderRadius: 0 }}
            >
              Cancelar
            </button>
            <button
              onClick={handleRechazar}
              disabled={working || rechazarMotivo.trim().length < 10}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ borderRadius: 0 }}
            >
              {working ? 'Rechazando...' : 'Rechazar convenio'}
            </button>
          </>
        }
      >
        <label className="block text-sm font-medium text-[#374151] mb-2">Motivo del rechazo *</label>
        <textarea
          value={rechazarMotivo}
          onChange={(e) => setRechazarMotivo(e.target.value)}
          rows={4}
          className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626] transition-colors resize-none"
          style={{ borderRadius: 0 }}
          placeholder="Describe las observaciones o correcciones necesarias..."
        />
        {rechazarMotivo.length > 0 && rechazarMotivo.trim().length < 10 && (
          <p className="text-xs text-[#DC2626] mt-1.5">Mínimo 10 caracteres ({rechazarMotivo.trim().length}/10)</p>
        )}
      </Modal>

      {/* MODAL: Suspender (motivo) */}
      <Modal
        open={suspenderMotivo !== '' && estado === 'VIGENTE'}
        onClose={() => setSuspenderMotivo('')}
        title="Suspender convenio"
        subtitle="El convenio entrará en estado Suspendido temporalmente."
        icon={<Pause size={20} className="text-[#EAB308]" />}
        size="md"
        footer={
          <>
            <button
              onClick={() => setSuspenderMotivo('')}
              className="px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors"
              style={{ borderRadius: 0 }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSuspender}
              disabled={working || suspenderMotivo.trim().length < 5}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#EAB308] hover:bg-[#CA8A04] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ borderRadius: 0 }}
            >
              {working ? 'Suspendiendo...' : 'Suspender convenio'}
            </button>
          </>
        }
      >
        <label className="block text-sm font-medium text-[#374151] mb-2">Motivo de la suspensión *</label>
        <textarea
          value={suspenderMotivo}
          onChange={(e) => setSuspenderMotivo(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#EAB308]/20 focus:border-[#EAB308] transition-colors resize-none"
          style={{ borderRadius: 0 }}
          placeholder="Describe el motivo de la suspensión..."
        />
        {suspenderMotivo.length > 0 && suspenderMotivo.trim().length < 5 && (
          <p className="text-xs text-[#EAB308] mt-1.5">Mínimo 5 caracteres ({suspenderMotivo.trim().length}/5)</p>
        )}
      </Modal>

      {/* MODAL: Confirmar acción de workflow */}
      <ConfirmModal
        isOpen={workflowAction !== null}
        titulo={getWorkflowModalContent().titulo}
        mensaje={getWorkflowModalContent().mensaje}
        onConfirm={handleConfirmWorkflow}
        onCancel={() => setWorkflowAction(null)}
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTES COMPARTIDOS
   ═══════════════════════════════════════════════════════════════ */

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

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-[11px] font-semibold text-[#0A0A0A] uppercase tracking-wider whitespace-nowrap ${className}`}>
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
    <div className="bg-white text-center" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '48px 24px' }}>
      <Icon size={40} className="mx-auto text-[#E5E7EB] mb-3" />
      <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0A' }}>{msg}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 1: INFORMACIÓN GENERAL
   ═══════════════════════════════════════════════════════════════ */
function InfoTab({ convenio }: { convenio: Convenio }) {
  const duracionMeses = (() => {
    if (!convenio.fecha_inicio || !convenio.fecha_fin) return null
    const inicio = new Date(convenio.fecha_inicio)
    const fin = new Date(convenio.fecha_fin)
    const diff = fin.getTime() - inicio.getTime()
    const months = Math.round(diff / (1000 * 60 * 60 * 24 * 30.44))
    return months > 0 ? months : null
  })()

  const tipoHumanizado: Record<string, string> = {
    MARCO: 'Marco',
    ESPECIFICO: 'Específico',
    COOPERACION: 'Cooperación',
    OTRO: 'Otro',
  }

  return (
    <div className="space-y-4">
      {/* 1. Información general del convenio */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-rose-50 text-rose-600 flex-shrink-0 rounded">
            <Info size={16} strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.12em]">Información general</p>
            <h3 className="text-sm font-semibold text-ink mt-0.5">Datos del convenio</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Código</p>
            <p className="text-[13px] font-mono text-ink mt-1">{convenio.codigo}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Institución</p>
            <p className="text-[13px] font-medium text-ink mt-1">{convenio.institucion?.nombre || convenio.entidad_contraparte || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Tipo</p>
            <p className="text-[13px] font-medium text-ink mt-1">{TIPO_CONVENIO_LABELS[convenio.tipo] || convenio.tipo}</p>
          </div>
          <div className="col-span-2 md:col-span-3">
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Objeto</p>
            <p className="text-[13px] text-ink mt-1 leading-relaxed">{convenio.objeto || '—'}</p>
          </div>
          {convenio.descripcion && (
            <div className="col-span-2 md:col-span-3">
              <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Descripción</p>
              <p className="text-[13px] text-ink mt-1 leading-relaxed">{convenio.descripcion}</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Vigencia */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-600 flex-shrink-0 rounded">
            <Calendar size={16} strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.12em]">Vigencia</p>
            <h3 className="text-sm font-semibold text-ink mt-0.5">Período de validez</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Fecha suscripción</p>
            <p className="text-[13px] font-medium text-ink mt-1">{formatDate(convenio.fecha_firma) || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Fecha inicio</p>
            <p className="text-[13px] font-medium text-ink mt-1">{formatDate(convenio.fecha_inicio) || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Fecha vencimiento</p>
            <p className="text-[13px] font-medium text-ink mt-1">{formatDate(convenio.fecha_fin) || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Duración</p>
            <p className="text-[13px] font-semibold text-emerald-600 mt-1">
              {duracionMeses !== null ? `${duracionMeses} meses` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Responsable UNL */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-50 text-emerald-600 flex-shrink-0 rounded">
            <Building2 size={16} strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.12em]">Responsable UNL</p>
            <h3 className="text-sm font-semibold text-ink mt-0.5">Encargado del convenio</h3>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold">
            {(convenio.entidad_contraparte || 'U')[0]?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-ink">{convenio.entidad_contraparte || 'Sin responsable asignado'}</p>
            <p className="text-[11px] text-ink-muted">Entidad contraparte</p>
          </div>
        </div>
      </div>

      {/* 4. Proyectos vinculados */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-amber-50 text-amber-600 flex-shrink-0 rounded">
            <FolderKanban size={16} strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.12em]">Proyectos vinculados</p>
            <h3 className="text-sm font-semibold text-ink mt-0.5">Asociaciones activas</h3>
          </div>
        </div>
        <p className="text-[13px] text-ink-muted">
          {convenio.proyectos_vinculados_count && convenio.proyectos_vinculados_count > 0
            ? `${convenio.proyectos_vinculados_count} proyecto(s) vinculado(s). Consulta la pestaña "Proyectos vinculados" para más detalles.`
            : 'Sin proyectos vinculados en este momento'}
        </p>
      </div>

      {/* 5. Resumen */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-violet-50 text-violet-600 flex-shrink-0 rounded">
            <FileText size={16} strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.12em]">Resumen</p>
            <h3 className="text-sm font-semibold text-ink mt-0.5">Estado y tipo</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Tipo de convenio</p>
            <p className="text-[13px] font-medium text-ink mt-1">{tipoHumanizado[convenio.tipo] || convenio.tipo}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Estado</p>
            <p className="text-[13px] font-medium text-ink mt-1">{ESTADO_CONVENIO_LABELS[convenio.estado] || convenio.estado}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Activo</p>
            <p className="text-[13px] font-medium mt-1" style={{ color: convenio.activo ? '#16A34A' : '#6B7280' }}>
              {convenio.activo ? 'Sí' : 'No'}
            </p>
          </div>
        </div>
      </div>
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
        <div className="bg-white overflow-hidden" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F9FAFB]" style={{ borderBottom: '0.5px solid #E5E7EB' }}>
                <tr>
                  <Th>Código</Th>
                  <Th>Descripción</Th>
                  <Th>Responsable</Th>
                  <Th>Fecha límite</Th>
                  <Th>Estado</Th>
                  {canManage && <Th className="text-right">Acciones</Th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
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
                            className="h-8 w-8 inline-flex items-center justify-center rounded-none text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteItem(c)}
                            title="Eliminar compromiso"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-none text-rose-600 hover:bg-rose-50 transition-colors"
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
        compromisos={items}
        onSaved={() => { setShowForm(false); load() }}
      />
      <CompromisoFormModal
        open={editItem !== null}
        compromiso={editItem}
        onClose={() => setEditItem(null)}
        convenioId={convenioId}
        usuarios={usuarios}
        compromisos={items}
        onSaved={() => { setEditItem(null); load() }}
      />
      <ConfirmModal
        isOpen={deleteItem !== null}
        titulo="¿Eliminar compromiso?"
        mensaje="Se eliminará el compromiso y su información asociada. Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        confirmColor="emerald"
        onConfirm={async () => {
          if (!deleteItem) return
          try {
            await compromisosApi.delete(deleteItem.id)
            toast.success('Compromiso eliminado')
            setDeleteItem(null)
            load()
          } catch {
            toast.error('No se pudo eliminar el compromiso')
          }
        }}
        onCancel={() => setDeleteItem(null)}
      >
        {deleteItem && (
          <div className="p-3 bg-bg-soft border border-line rounded-none">
            <p className="text-sm font-mono text-ink-muted">{deleteItem.codigo}</p>
            <p className="text-[13px] text-ink mt-1 line-clamp-2">{deleteItem.descripcion}</p>
          </div>
        )}
      </ConfirmModal>
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
  open, onClose, convenioId, compromiso, usuarios, compromisos, onSaved,
}: {
  open: boolean
  onClose: () => void
  convenioId: number
  compromiso?: Compromiso | null
  usuarios: Usuario[]
  compromisos: Compromiso[]
  onSaved: () => void
}) {
  const isEdit = Boolean(compromiso)
  const [form, setForm] = useState({
    descripcion: '', responsable: '',
    fecha_vencimiento: '', estado: 'PENDIENTE' as EstadoCompromiso, observaciones: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (compromiso) {
        setForm({
          descripcion: compromiso.descripcion || '',
          responsable: compromiso.responsable ? String(compromiso.responsable) : '',
          fecha_vencimiento: compromiso.fecha_vencimiento || '',
          estado: compromiso.estado || 'PENDIENTE',
          observaciones: compromiso.observaciones || '',
        })
      } else {
        setForm({ descripcion: '', responsable: '', fecha_vencimiento: '', estado: 'PENDIENTE', observaciones: '' })
      }
    }
  }, [open, compromiso])

  const generateCodigo = () => {
    const nums = compromisos.map(c => {
      const match = c.codigo.match(/COM-(\d+)/)
      return match ? parseInt(match[1] || '0', 10) : 0
    })
    const max = Math.max(0, ...nums)
    return `COM-${String(max + 1).padStart(3, '0')}`
  }

  const handleSubmit = async () => {
    if (!form.descripcion.trim() || !form.fecha_vencimiento) {
      toast.error('Completa los campos obligatorios')
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        convenio: convenioId,
        codigo: isEdit && compromiso ? compromiso.codigo : generateCodigo(),
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Descripción *</label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-line text-sm rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 resize-none"
            placeholder="Describe el compromiso..."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        <div className="bg-white overflow-hidden" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F9FAFB]" style={{ borderBottom: '0.5px solid #E5E7EB' }}>
                <tr>
                  <Th>Código / Nombre</Th>
                  <Th>Fecha entrega</Th>
                  <Th>Estado</Th>
                  {canManage && <Th className="text-right">Acciones</Th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {items.map((p) => {
                  const tipoLabel = TIPO_PRODUCTO_LABELS[p.tipo] || p.tipo || null
                  const tipoBadgeColor: Record<string, string> = {
                    DOCUMENTO_TECNICO: 'bg-[#DBEAFE] text-[#1D4ED8]',
                    INFORME_RESULTADOS: 'bg-[#DCFCE7] text-[#15803D]',
                    MATERIAL_DIDACTICO: 'bg-[#FEF3C7] text-[#92400E]',
                    SOFTWARE: 'bg-[#EDE9FE] text-[#5B21B6]',
                    CAPACITACION: 'bg-[#FCE7F3] text-[#9D174D]',
                    SERVICIO: 'bg-[#E0F2FE] text-[#0369A1]',
                    OTRO: 'bg-[#E5E7EB] text-[#374151]',
                  }
                  const tipoBadgeCls = tipoBadgeColor[p.tipo] || 'bg-[#E5E7EB] text-[#374151]'

                  const now = new Date()
                  const fechaEsperada = p.fecha_entrega_esperada ? new Date(p.fecha_entrega_esperada) : null
                  let fechaColor = '#0A0A0A'
                  if (fechaEsperada && !p.entregado) {
                    const diffDays = Math.ceil((fechaEsperada.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    if (diffDays < 0) fechaColor = '#DC2626'
                    else if (diffDays <= 7) fechaColor = '#EAB308'
                  }

                  return (
                  <tr key={p.id} className="group hover:bg-emerald-50/40 transition-colors">
                    <td className="px-4 py-3.5 max-w-[320px]">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium bg-bg-soft text-ink-muted rounded border border-line mb-1">
                        {p.codigo}
                      </span>
                      <p className="text-[13px] font-semibold text-ink truncate" title={p.nombre}>{p.nombre}</p>
                      {tipoLabel && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded mt-1 ${tipoBadgeCls}`}>
                          {tipoLabel}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5" style={{ width: 160 }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-0.5">ESPERADA</p>
                      <p className="text-[13px] font-medium tabular-nums" style={{ color: fechaColor }}>
                        {formatDate(p.fecha_entrega_esperada)}
                      </p>
                      {p.fecha_entrega_real && (
                        <>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted mt-1.5 mb-0.5">REAL</p>
                          <p className="text-[13px] font-medium text-ink tabular-nums">{formatDate(p.fecha_entrega_real)}</p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3.5" style={{ width: 120 }}>
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
                    {canManage && (
                      <td className="px-4 py-3.5" style={{ width: 80 }}>
                        <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditItem(p)}
                            title="Editar producto"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-none text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteItem(p)}
                            title="Eliminar producto"
                            className="h-8 w-8 inline-flex items-center justify-center rounded-none text-rose-600 hover:bg-rose-50 transition-colors"
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
        </div>
      )}

      <ProductoFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        convenioId={convenioId}
        productos={items}
        onSaved={() => { setShowForm(false); load() }}
      />
      <ProductoFormModal
        open={editItem !== null}
        producto={editItem}
        onClose={() => setEditItem(null)}
        convenioId={convenioId}
        productos={items}
        onSaved={() => { setEditItem(null); load() }}
      />
      <ConfirmModal
        isOpen={deleteItem !== null}
        titulo="¿Eliminar producto?"
        mensaje="Se eliminará el producto y su información asociada. Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        confirmColor="emerald"
        onConfirm={async () => {
          if (!deleteItem) return
          try {
            await productosApi.delete(deleteItem.id)
            toast.success('Producto eliminado')
            setDeleteItem(null)
            load()
          } catch {
            toast.error('No se pudo eliminar el producto')
          }
        }}
        onCancel={() => setDeleteItem(null)}
      >
        {deleteItem && (
          <div className="p-3 bg-bg-soft border border-line rounded-none">
            <p className="text-sm font-mono text-ink-muted">{deleteItem.codigo}</p>
            <p className="text-[13px] text-ink mt-1 line-clamp-2">{deleteItem.nombre}</p>
          </div>
        )}
      </ConfirmModal>
    </div>
  )
}

function ProductoFormModal({
  open, onClose, convenioId, producto, productos, onSaved,
}: {
  open: boolean
  onClose: () => void
  convenioId: number
  producto?: Producto | null
  productos: Producto[]
  onSaved: () => void
}) {
  const isEdit = Boolean(producto)
  const [form, setForm] = useState({
    nombre: '', descripcion: '', tipo: '',
    fecha_entrega_esperada: '', fecha_entrega_real: '',
    entregado: false, observaciones: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (producto) {
        setForm({
          nombre: producto.nombre || '',
          descripcion: producto.descripcion || '',
          tipo: producto.tipo || '',
          fecha_entrega_esperada: producto.fecha_entrega_esperada || '',
          fecha_entrega_real: producto.fecha_entrega_real || '',
          entregado: producto.entregado,
          observaciones: producto.observaciones || '',
        })
      } else {
        setForm({ nombre: '', descripcion: '', tipo: '', fecha_entrega_esperada: '', fecha_entrega_real: '', entregado: false, observaciones: '' })
      }
    }
  }, [open, producto])

  const generateCodigo = () => {
    const nums = productos.map(p => {
      const match = p.codigo.match(/PRD-(\d+)/)
      return match ? parseInt(match[1] || '0', 10) : 0
    })
    const max = Math.max(0, ...nums)
    return `PRD-${String(max + 1).padStart(3, '0')}`
  }

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.fecha_entrega_esperada) {
      toast.error('Completa los campos obligatorios')
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        convenio: convenioId,
        codigo: isEdit && producto ? producto.codigo : generateCodigo(),
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
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Nombre *</label>
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full px-3 py-2 border border-line text-sm rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            placeholder="Ej: Informe técnico"
          />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="w-full px-3 py-2 border border-line text-sm rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
            >
              <option value="">Seleccionar tipo...</option>
              <option value="DOCUMENTO_TECNICO">Documento técnico</option>
              <option value="INFORME_RESULTADOS">Informe de resultados</option>
              <option value="MATERIAL_DIDACTICO">Material didáctico</option>
              <option value="SOFTWARE">Software / Aplicación</option>
              <option value="CAPACITACION">Capacitación</option>
              <option value="SERVICIO">Servicio prestado</option>
              <option value="OTRO">Otro</option>
            </select>
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
        </div>
        {isEdit && (
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Entrega real</label>
            <input
              type="date"
              value={form.fecha_entrega_real}
              onChange={(e) => setForm({ ...form, fecha_entrega_real: e.target.value })}
              className="w-full px-3 py-2 border border-line text-sm rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            />
          </div>
        )}
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

  useEffect(() => {
    if (convenioId && !isNaN(convenioId)) {
      load()
    }
  }, [load, convenioId])

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
        <div className="bg-white overflow-hidden" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F9FAFB]" style={{ borderBottom: '0.5px solid #E5E7EB' }}>
                <tr>
                  <Th>Proyecto</Th>
                  <Th>Estado</Th>
                  <Th>Responsable</Th>
                  <Th>Vinculado el</Th>
                  <Th>Vigente</Th>
                  {isAdminUser && <Th className="text-right">Acciones</Th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
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
                              className="h-8 w-8 inline-flex items-center justify-center rounded-none text-rose-600 hover:bg-rose-50 transition-colors"
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
      <ConfirmModal
        isOpen={unlinkItem !== null}
        titulo="¿Desvincular proyecto?"
        mensaje="El proyecto dejará de estar asociado a este convenio. Esta acción no se puede deshacer."
        confirmLabel="Sí, desvincular"
        cancelLabel="Cancelar"
        confirmColor="emerald"
        onConfirm={handleUnlink}
        onCancel={() => setUnlinkItem(null)}
      >
        {unlinkItem && (
          <div className="p-3 bg-bg-soft border border-line rounded-none">
            <p className="text-[13px] text-ink">{unlinkItem.titulo}</p>
          </div>
        )}
      </ConfirmModal>
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
      <div className="bg-white text-center" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '48px 24px' }}>
        <Clock size={40} className="mx-auto text-[#E5E7EB] mb-3" />
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0A' }}>Sin historial de cambios</p>
        <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>No se han registrado acciones para este convenio.</p>
      </div>
    )
  }

  return (
    <div className="bg-white" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '20px 24px' }}>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-[#E5E7EB]" />
        <div className="space-y-6">
          {items.map((h) => (
            <div key={h.id} className="relative pl-10">
              <div className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-[2px] border-white ${ACCION_COLORS[h.accion] || 'bg-[#9CA3AF]'}`} />
              <div className="space-y-0.5">
                <p style={{ fontSize: '12px', color: '#6B7280' }}>{formatFechaCorta(h.creado_en)}</p>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#0A0A0A' }}>{ACCION_LABELS[h.accion] || h.accion}</p>
                <p style={{ fontSize: '12px', color: '#6B7280' }}>por {h.usuario_nombre || 'Sistema'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
