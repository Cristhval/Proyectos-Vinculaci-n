import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Bell, Info, AlertTriangle, AlertOctagon, CheckCheck,
  Check, X, Filter, Inbox, Eye, Calendar,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { alertasApi } from '@/api/seguimiento'
import { useAuthStore } from '@/store/authStore'
import {
  PRIORIDAD_ALERTA_LABELS, PRIORIDAD_ALERTA_STYLES,
  ESTADO_ALERTA_LABELS, ESTADO_ALERTA_BADGE,
} from '@/lib/constants'
import { formatDateTime } from '@/lib/formatters'
import type { Alerta, PrioridadAlerta, EstadoAlerta } from '@/types/seguimiento'
import type { PaginatedResponse } from '@/types/common'

const PRIORIDADES: PrioridadAlerta[] = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE']
const ESTADOS: EstadoAlerta[] = ['PENDIENTE', 'LEIDA', 'ATENDIDA', 'CANCELADA']

export default function AlertasPage() {
  const user = useAuthStore((s) => s.user)

  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPrioridad, setFilterPrioridad] = useState<PrioridadAlerta | ''>('')
  const [filterEstado, setFilterEstado] = useState<EstadoAlerta | ''>('')
  const [filterFecha, setFilterFecha] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [viewAlerta, setViewAlerta] = useState<Alerta | null>(null)
  const [acting, setActing] = useState<number | null>(null)

  const loadAlertas = useCallback(() => {
    if (!user?.id) return
    setLoading(true)
    alertasApi.byUsuario(user.id)
      .then(({ data }: { data: PaginatedResponse<Alerta> }) => setAlertas(data.results))
      .catch(() => toast.error('Error al cargar las alertas'))
      .finally(() => setLoading(false))
  }, [user?.id])

  useEffect(() => {
    loadAlertas()
  }, [loadAlertas])

  const filtered = useMemo(() => {
    return alertas.filter((a) => {
      if (filterPrioridad && a.prioridad !== filterPrioridad) return false
      if (filterEstado && a.estado !== filterEstado) return false
      if (filterFecha) {
        const fechaAlerta = (a.creado_en || '').slice(0, 10)
        if (fechaAlerta !== filterFecha) return false
      }
      return true
    })
  }, [alertas, filterPrioridad, filterEstado, filterFecha])

  const counters = useMemo(() => {
    return {
      total: alertas.length,
      pendientes: alertas.filter((a) => a.estado === 'PENDIENTE').length,
      leidas: alertas.filter((a) => a.estado === 'LEIDA').length,
      atendidas: alertas.filter((a) => a.estado === 'ATENDIDA').length,
    }
  }, [alertas])

  const handleMarcarLeida = async (a: Alerta) => {
    if (a.estado !== 'PENDIENTE') return
    setActing(a.id)
    try {
      await alertasApi.leer(a.id)
      toast.success('Alerta marcada como leída')
      loadAlertas()
    } catch {
      toast.error('No se pudo marcar la alerta')
    } finally {
      setActing(null)
    }
  }

  const handleAtender = async (a: Alerta) => {
    if (a.estado === 'ATENDIDA' || a.estado === 'CANCELADA') return
    setActing(a.id)
    try {
      await alertasApi.atender(a.id)
      toast.success('Alerta atendida')
      loadAlertas()
    } catch {
      toast.error('No se pudo atender la alerta')
    } finally {
      setActing(null)
    }
  }

  const clearFilters = () => {
    setFilterPrioridad('')
    setFilterEstado('')
    setFilterFecha('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink tracking-tight">Alertas</h1>
          <p className="text-sm text-ink-muted">Notificaciones y alertas del sistema asignadas a ti</p>
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-ink bg-white border border-[#0A0A0A] hover:bg-gray-50 transition-colors"
          style={{ borderRadius: '4px' }}
        >
          <Filter size={14} /> {showFilters ? 'Ocultar filtros' : 'Filtros'}
        </button>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CounterCard label="Total" value={counters.total} bg="bg-white" text="text-ink" border="border-[#E5E7EB]" />
        <CounterCard
          label="Pendientes"
          value={counters.pendientes}
          bg="bg-[#FEF3C7]"
          text="text-[#92400E]"
          border="border-[#FDE68A]"
          pulse={counters.pendientes > 0}
        />
        <CounterCard label="Leídas" value={counters.leidas} bg="bg-white" text="text-ink" border="border-[#E5E7EB]" />
        <CounterCard label="Atendidas" value={counters.atendidas} bg="bg-[#DCFCE7]" text="text-[#15803D]" border="border-[#BBF7D0]" />
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white border border-line p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">Prioridad</label>
              <select
                value={filterPrioridad}
                onChange={(e) => setFilterPrioridad(e.target.value as PrioridadAlerta | '')}
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                style={{ borderRadius: '4px' }}
              >
                <option value="">Todas las prioridades</option>
                {PRIORIDADES.map((p) => (
                  <option key={p} value={p}>{PRIORIDAD_ALERTA_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">Estado</label>
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value as EstadoAlerta | '')}
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                style={{ borderRadius: '4px' }}
              >
                <option value="">Todos los estados</option>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>{ESTADO_ALERTA_LABELS[e]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">Fecha</label>
              <input
                type="date"
                value={filterFecha}
                onChange={(e) => setFilterFecha(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                style={{ borderRadius: '4px' }}
              />
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 text-sm font-medium text-ink bg-white border border-[#E5E7EB] hover:bg-bg-soft transition-colors"
              style={{ borderRadius: '4px' }}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* Lista de alertas */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-line p-12 text-center">
          <Inbox size={40} className="mx-auto text-ink-light mb-3 opacity-40" />
          <p className="text-sm font-medium text-ink">No hay alertas</p>
          <p className="text-xs text-ink-muted mt-1">
            {alertas.length === 0
              ? 'No tienes alertas asignadas en este momento'
              : 'No hay alertas que coincidan con los filtros aplicados'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((a) => (
            <AlertaCard
              key={a.id}
              alerta={a}
              acting={acting === a.id}
              onView={() => setViewAlerta(a)}
              onMarcarLeida={() => handleMarcarLeida(a)}
              onAtender={() => handleAtender(a)}
            />
          ))}
        </div>
      )}

      {/* Modal: Ver alerta */}
      {viewAlerta && (
        <AlertaDetalleModal
          alerta={viewAlerta}
          onClose={() => setViewAlerta(null)}
          onMarcarLeida={() => { handleMarcarLeida(viewAlerta); setViewAlerta(null) }}
          onAtender={() => { handleAtender(viewAlerta); setViewAlerta(null) }}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CONTADOR CARD
   ═══════════════════════════════════════════════════════════════ */
interface CounterCardProps {
  label: string
  value: number
  bg: string
  text: string
  border: string
  pulse?: boolean
}

function CounterCard({ label, value, bg, text, border, pulse }: CounterCardProps) {
  return (
    <div className={`${bg} ${border} border p-4 flex items-center justify-between`} style={{ borderRadius: '4px' }}>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
        <p className={`text-2xl font-bold ${text} mt-1`}>{value}</p>
      </div>
      {pulse && (
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
        </span>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TARJETA DE ALERTA
   ═══════════════════════════════════════════════════════════════ */
interface AlertaCardProps {
  alerta: Alerta
  acting: boolean
  onView: () => void
  onMarcarLeida: () => void
  onAtender: () => void
}

function AlertaCard({ alerta, acting, onView, onMarcarLeida, onAtender }: AlertaCardProps) {
  const prioStyle = PRIORIDAD_ALERTA_STYLES[alerta.prioridad] ?? PRIORIDAD_ALERTA_STYLES.BAJA!
  const estadoStyle = ESTADO_ALERTA_BADGE[alerta.estado] ?? ESTADO_ALERTA_BADGE.PENDIENTE!
  const estadoLabel = ESTADO_ALERTA_LABELS[alerta.estado] || alerta.estado

  const PrioridadIcon = alerta.prioridad === 'URGENTE'
    ? AlertOctagon
    : alerta.prioridad === 'ALTA'
      ? AlertTriangle
      : alerta.prioridad === 'MEDIA'
        ? AlertTriangle
        : Info

  const canMarcarLeida = alerta.estado === 'PENDIENTE'
  const canAtender = alerta.estado === 'PENDIENTE' || alerta.estado === 'LEIDA'

  return (
    <div
      className={`bg-white border border-[#E5E7EB] p-4 flex items-start gap-3 ${!alerta.leida && alerta.estado === 'PENDIENTE' ? 'border-l-4 border-l-amber-400' : ''}`}
      style={{ borderRadius: '4px' }}
    >
      <div className={`w-10 h-10 rounded-lg ${prioStyle.bg} ${prioStyle.ring} ring-1 flex items-center justify-center flex-shrink-0`}>
        <PrioridadIcon size={18} className={prioStyle.icon} />
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded ${prioStyle.bg} ${prioStyle.text}`}>
              {PRIORIDAD_ALERTA_LABELS[alerta.prioridad] || alerta.prioridad}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 min-w-[80px] justify-center ${estadoStyle.bg} ${estadoStyle.text}`}
              style={{ borderRadius: '20px', padding: '1px 6px', fontSize: '10px', fontWeight: 600 }}
            >
              <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
                {estadoStyle.pulse && (
                  <span className={`absolute inset-0 rounded-full opacity-75 ${estadoStyle.pulseColor ?? estadoStyle.dot} status-pulse`} />
                )}
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${estadoStyle.dot}`} />
              </span>
              {estadoLabel}
            </span>
          </div>
          <p className="text-[10px] text-ink-muted inline-flex items-center gap-1">
            <Calendar size={10} />
            {formatDateTime(alerta.creado_en)}
          </p>
        </div>

        <p className="text-sm font-semibold text-ink leading-tight">{alerta.mensaje}</p>
        {alerta.detalle && (
          <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">{alerta.detalle}</p>
        )}

        {(alerta.proyecto_codigo || alerta.convenio_codigo) && (
          <p className="text-[10px] text-ink-muted">
            {alerta.proyecto_codigo && <>Proyecto: <span className="font-mono text-ink">{alerta.proyecto_codigo}</span></>}
            {alerta.proyecto_codigo && alerta.convenio_codigo && ' · '}
            {alerta.convenio_codigo && <>Convenio: <span className="font-mono text-ink">{alerta.convenio_codigo}</span></>}
          </p>
        )}

        <div className="pt-2 flex items-center justify-end gap-2 flex-wrap">
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-ink bg-white border border-[#E5E7EB] hover:bg-bg-soft transition-colors"
            style={{ borderRadius: '4px' }}
          >
            <Eye size={12} /> Ver
          </button>
          {canMarcarLeida && (
            <button
              type="button"
              onClick={onMarcarLeida}
              disabled={acting}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-ink bg-white border border-[#E5E7EB] hover:bg-bg-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ borderRadius: '4px' }}
            >
              <Check size={12} /> Marcar leída
            </button>
          )}
          {canAtender && (
            <button
              type="button"
              onClick={onAtender}
              disabled={acting}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ borderRadius: '4px' }}
            >
              <CheckCheck size={12} /> Atender
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MODAL DETALLE DE ALERTA
   ═══════════════════════════════════════════════════════════════ */
interface AlertaDetalleModalProps {
  alerta: Alerta
  onClose: () => void
  onMarcarLeida: () => void
  onAtender: () => void
}

function AlertaDetalleModal({ alerta, onClose, onMarcarLeida, onAtender }: AlertaDetalleModalProps) {
  const prioStyle = PRIORIDAD_ALERTA_STYLES[alerta.prioridad] ?? PRIORIDAD_ALERTA_STYLES.BAJA!
  const estadoStyle = ESTADO_ALERTA_BADGE[alerta.estado] ?? ESTADO_ALERTA_BADGE.PENDIENTE!
  const canMarcarLeida = alerta.estado === 'PENDIENTE'
  const canAtender = alerta.estado === 'PENDIENTE' || alerta.estado === 'LEIDA'

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="bg-white flex flex-col"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '85vh',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          margin: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl ${prioStyle.bg} ${prioStyle.ring} ring-1 flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <Bell size={18} className={prioStyle.icon} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Detalle de alerta</h2>
              <p className="text-sm text-gray-500 mt-0.5">{formatDateTime(alerta.creado_en)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded ${prioStyle.bg} ${prioStyle.text}`}>
              Prioridad: {PRIORIDAD_ALERTA_LABELS[alerta.prioridad] || alerta.prioridad}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 min-w-[80px] justify-center ${estadoStyle.bg} ${estadoStyle.text}`}
              style={{ borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: 600 }}
            >
              <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
                {estadoStyle.pulse && (
                  <span className={`absolute inset-0 rounded-full opacity-75 ${estadoStyle.pulseColor ?? estadoStyle.dot} status-pulse`} />
                )}
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${estadoStyle.dot}`} />
              </span>
              {ESTADO_ALERTA_LABELS[alerta.estado] || alerta.estado}
            </span>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Mensaje</p>
            <p className="text-sm font-semibold text-ink mt-1 leading-relaxed">{alerta.mensaje}</p>
          </div>

          {alerta.detalle && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Detalle</p>
              <p className="text-sm text-ink mt-1 leading-relaxed whitespace-pre-line">{alerta.detalle}</p>
            </div>
          )}

          {(alerta.proyecto_codigo || alerta.convenio_codigo) && (
            <div className="bg-bg-soft/50 border border-[#E5E7EB] p-3" style={{ borderRadius: '4px' }}>
              {alerta.proyecto_codigo && (
                <p className="text-xs text-ink">
                  <span className="text-ink-muted">Proyecto:</span> <span className="font-mono font-semibold">{alerta.proyecto_codigo}</span>
                </p>
              )}
              {alerta.convenio_codigo && (
                <p className="text-xs text-ink mt-1">
                  <span className="text-ink-muted">Convenio:</span> <span className="font-mono font-semibold">{alerta.convenio_codigo}</span>
                </p>
              )}
            </div>
          )}

          {alerta.fecha_vencimiento && (
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <Calendar size={12} />
              <span>Vence: {formatDateTime(alerta.fecha_vencimiento)}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2 flex-shrink-0 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-ink bg-white border border-[#0A0A0A] hover:bg-gray-50 transition-colors"
            style={{ borderRadius: '4px' }}
          >
            Cerrar
          </button>
          {canMarcarLeida && (
            <button
              type="button"
              onClick={onMarcarLeida}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-ink bg-white border border-[#E5E7EB] hover:bg-bg-soft transition-colors"
              style={{ borderRadius: '4px' }}
            >
              <Check size={14} /> Marcar leída
            </button>
          )}
          {canAtender && (
            <button
              type="button"
              onClick={onAtender}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#16A34A] hover:bg-[#15803D] transition-colors"
              style={{ borderRadius: '4px' }}
            >
              <CheckCheck size={14} /> Atender
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
