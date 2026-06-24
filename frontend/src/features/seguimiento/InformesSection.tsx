import { useEffect, useState, useCallback } from 'react'
import {
  FileText, Plus, Pencil, Download, Eye, Clock,
  Calendar, Inbox, Trash2, FileCheck, FileBadge,
  FileCode, FilePieChart, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { informesApi } from '@/api/seguimiento'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import {
  TIPO_INFORME_LABELS, TIPO_INFORME_BADGE,
  ESTADO_INFORME_LABELS, ESTADO_INFORME_BADGE,
} from '@/lib/constants'
import { formatDate, formatDateTime } from '@/lib/formatters'
import type { Informe } from '@/types/seguimiento'
import type { PaginatedResponse } from '@/types/common'
import InformeFormModal from './InformeFormModal'

interface InformesSectionProps {
  proyectoId: number
  responsableId: number | null
}

export default function InformesSection({ proyectoId, responsableId }: InformesSectionProps) {
  const user = useAuthStore((s) => s.user)
  const { isAdmin } = usePermissions()

  const [informes, setInformes] = useState<Informe[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editInforme, setEditInforme] = useState<Informe | null>(null)
  const [viewInforme, setViewInforme] = useState<Informe | null>(null)
  const [deleteInforme, setDeleteInforme] = useState<Informe | null>(null)

  const isDocenteResponsable = user?.rol === 'DOCENTE' && responsableId === user?.id
  const canCreate = isAdmin() || isDocenteResponsable
  const canEdit = (informe: Informe) => isAdmin() || informe.elaborado_por === user?.id
  const canDelete = isAdmin()

  const loadInformes = useCallback(() => {
    setLoading(true)
    informesApi.byProyecto(proyectoId)
      .then(({ data }: { data: PaginatedResponse<Informe> }) => setInformes(data.results))
      .catch(() => toast.error('Error al cargar los informes'))
      .finally(() => setLoading(false))
  }, [proyectoId])

  useEffect(() => {
    loadInformes()
  }, [loadInformes])

  const handleDelete = async () => {
    if (!deleteInforme) return
    try {
      await informesApi.delete(deleteInforme.id)
      toast.success('Informe eliminado correctamente')
      setDeleteInforme(null)
      loadInformes()
    } catch {
      toast.error('No se pudo eliminar el informe')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold inline-flex items-center gap-2.5" style={{ color: '#0F172A' }}>
          <span className="inline-flex items-center justify-center w-7 h-7 bg-rose-50 text-rose-600 flex-shrink-0" style={{ borderRadius: '4px' }}>
            <FileText size={13} strokeWidth={2.25} />
          </span>
          Informes del proyecto
          <span className="text-ink-muted font-normal">({informes.length} informes)</span>
        </h2>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-500/40 transition-all"
            style={{ borderRadius: 0 }}
          >
            <Plus size={14} /> Nuevo informe
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : informes.length === 0 ? (
        <div className="bg-white border border-line p-12 text-center">
          <Inbox size={40} className="mx-auto text-ink-light mb-3 opacity-40" />
          <p className="text-sm font-medium text-ink">No hay informes registrados</p>
          <p className="text-xs text-ink-muted mt-1">
            Genera el primer informe de seguimiento de este proyecto
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {informes.map((inf) => (
            <InformeCard
              key={inf.id}
              informe={inf}
              canEdit={canEdit(inf)}
              canDelete={canDelete}
              onView={() => setViewInforme(inf)}
              onEdit={() => setEditInforme(inf)}
              onDelete={() => setDeleteInforme(inf)}
            />
          ))}
        </div>
      )}

      <InformeFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        proyectoId={proyectoId}
        onSaved={() => { setShowForm(false); loadInformes() }}
      />

      <InformeFormModal
        open={editInforme !== null}
        onClose={() => setEditInforme(null)}
        proyectoId={proyectoId}
        informe={editInforme}
        onSaved={() => { setEditInforme(null); loadInformes() }}
      />

      <VerInformeModal
        open={viewInforme !== null}
        onClose={() => setViewInforme(null)}
        informe={viewInforme}
      />

      <ConfirmModal
        isOpen={deleteInforme !== null}
        titulo="¿Eliminar informe?"
        mensaje={`El informe ${deleteInforme?.titulo || ''} será eliminado permanentemente. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteInforme(null)}
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TARJETA DE INFORME
   ═══════════════════════════════════════════════════════════════ */
interface InformeCardProps {
  informe: Informe
  canEdit: boolean
  canDelete: boolean
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

function InformeCard({ informe, canEdit, canDelete, onView, onEdit, onDelete }: InformeCardProps) {
  const tipoBadge = TIPO_INFORME_BADGE[informe.tipo] || 'bg-[#E5E7EB] text-[#374151]'
  const tipoLabel = TIPO_INFORME_LABELS[informe.tipo] || informe.tipo
  const estadoStyle = ESTADO_INFORME_BADGE[informe.estado] ?? ESTADO_INFORME_BADGE.PENDIENTE!
  const estadoLabel = ESTADO_INFORME_LABELS[informe.estado] || informe.estado

  const tipoIconBg: Record<string, string> = {
    INICIAL: 'bg-[#DBEAFE] text-[#1D4ED8]',
    PARCIAL: 'bg-[#FEF3C7] text-[#92400E]',
    FINAL: 'bg-[#DCFCE7] text-[#15803D]',
    TECNICO: 'bg-[#EDE9FE] text-[#5B21B6]',
    FINANCIERO: 'bg-[#FCE7F3] text-[#9D174D]',
  }
  const TipoIconComp = informe.tipo === 'INICIAL' ? FileText : informe.tipo === 'PARCIAL' ? FileCheck : informe.tipo === 'FINAL' ? FileBadge : informe.tipo === 'TECNICO' ? FileCode : FilePieChart

  const inicialesAutor = (informe.elaborado_por_nombre || '?')
    .split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="bg-white border border-[#E5E7EB] p-4" style={{ borderRadius: '4px' }}>
      <div className="flex items-start justify-between gap-3 flex-wrap pb-3 border-b border-[#F3F4F6]">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tipoIconBg[informe.tipo] || 'bg-[#E5E7EB] text-[#374151]'}`}>
            <TipoIconComp size={18} />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-ink-muted">{informe.numero}</span>
              <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded ${tipoBadge}`}>
                {tipoLabel}
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
            <h3 className="text-sm font-semibold text-ink leading-tight">{informe.titulo}</h3>
            {informe.resumen && (
              <p className="text-xs text-ink-muted line-clamp-2">{informe.resumen}</p>
            )}
          </div>
        </div>
      </div>

      <div className="pt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {informe.periodo_inicio && informe.periodo_fin && (
          <div className="flex items-center gap-1.5 text-ink-muted">
            <Calendar size={12} />
            <span>{formatDate(informe.periodo_inicio)} → {formatDate(informe.periodo_fin)}</span>
          </div>
        )}
        {informe.elaborado_por_nombre && (
          <div className="flex items-center gap-1.5 text-ink-muted">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
              {inicialesAutor}
            </div>
            <span className="truncate">{informe.elaborado_por_nombre}</span>
          </div>
        )}
        {informe.fecha_emision && (
          <div className="flex items-center gap-1.5 text-ink-muted">
            <Clock size={12} />
            <span>Emitido: {formatDate(informe.fecha_emision)}</span>
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-[#F3F4F6] flex items-center justify-end gap-2 flex-wrap">
        {informe.archivo && (
          <a
            href={informe.archivo}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] hover:border-[#CBD5E1] transition-colors"
            style={{ borderRadius: 0 }}
          >
            <Download size={12} /> Descargar PDF
          </a>
        )}
        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] hover:border-[#CBD5E1] transition-colors"
            style={{ borderRadius: 0 }}
          >
            <Pencil size={12} /> Editar
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center w-8 h-8 text-white bg-[#DC2626] hover:bg-[#B91C1C] transition-colors"
            style={{ borderRadius: 0 }}
            title="Eliminar informe"
          >
            <Trash2 size={12} />
          </button>
        )}
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] transition-colors"
          style={{ borderRadius: 0 }}
        >
          <Eye size={12} /> Ver detalles
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MODAL: VER INFORME
   ═══════════════════════════════════════════════════════════════ */
interface VerInformeModalProps {
  open: boolean
  onClose: () => void
  informe: Informe | null
}

function VerInformeModal({ open, onClose, informe }: VerInformeModalProps) {
  const [detail, setDetail] = useState<Informe | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !informe) {
      setDetail(null)
      return
    }
    setLoading(true)
    informesApi.get(informe.id)
      .then(({ data }) => setDetail(data))
      .catch(() => toast.error('Error al cargar el detalle del informe'))
      .finally(() => setLoading(false))
  }, [open, informe])

  const visible = detail ?? informe
  if (!visible) return null

  const tipoLabel = TIPO_INFORME_LABELS[visible.tipo] || visible.tipo
  const tipoBadge = TIPO_INFORME_BADGE[visible.tipo] || 'bg-[#E5E7EB] text-[#374151]'
  const estadoStyle = ESTADO_INFORME_BADGE[visible.estado] ?? ESTADO_INFORME_BADGE.PENDIENTE!
  const estadoLabel = ESTADO_INFORME_LABELS[visible.estado] || visible.estado

  const inicialesAutor = (visible.elaborado_por_nombre || '?')
    .split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={visible.titulo}
      subtitle={`${visible.numero} · ${tipoLabel}`}
      icon={
        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
          <FileText size={18} className="text-emerald-600" />
        </div>
      }
      size="2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-ink bg-white border border-[#0A0A0A] hover:bg-gray-50 transition-colors"
            style={{ borderRadius: 0 }}
          >
            Cerrar
          </button>
          {visible.archivo && (
            <a
              href={visible.archivo}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#16A34A] hover:bg-[#15803D] transition-colors"
              style={{ borderRadius: 0 }}
            >
              <Download size={14} /> Descargar PDF
            </a>
          )}
        </>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-7 h-7 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Hero: badges + estado */}
          <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded ${tipoBadge}`}>
                {tipoLabel}
              </span>
              <span
                className={`inline-flex items-center gap-1 min-w-[90px] justify-center ${estadoStyle.bg} ${estadoStyle.text}`}
                style={{ borderRadius: '20px', padding: '2px 10px', fontSize: '10px', fontWeight: 600 }}
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
            <p className="text-[10px] font-mono text-ink-muted">ID #{visible.id}</p>
          </div>

          {/* Metadata grid con iconos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visible.periodo_inicio && visible.periodo_fin && (
              <div className="flex items-start gap-2.5 p-3 bg-[#F9FAFB] border border-[#F3F4F6]">
                <div className="w-7 h-7 rounded bg-white border border-[#E5E7EB] flex items-center justify-center flex-shrink-0">
                  <Calendar size={13} className="text-ink-muted" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Período</p>
                  <p className="text-[13px] text-ink font-semibold tabular-nums mt-0.5">
                    {formatDate(visible.periodo_inicio)} → {formatDate(visible.periodo_fin)}
                  </p>
                </div>
              </div>
            )}
            {visible.elaborado_por_nombre && (
              <div className="flex items-start gap-2.5 p-3 bg-[#F9FAFB] border border-[#F3F4F6]">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {inicialesAutor}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Elaborado por</p>
                  <p className="text-[13px] text-ink font-semibold mt-0.5 truncate">{visible.elaborado_por_nombre}</p>
                </div>
              </div>
            )}
            {visible.fecha_emision && (
              <div className="flex items-start gap-2.5 p-3 bg-[#F9FAFB] border border-[#F3F4F6]">
                <div className="w-7 h-7 rounded bg-white border border-[#E5E7EB] flex items-center justify-center flex-shrink-0">
                  <Clock size={13} className="text-ink-muted" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Fecha de emisión</p>
                  <p className="text-[13px] text-ink font-semibold mt-0.5">{formatDateTime(visible.fecha_emision)}</p>
                </div>
              </div>
            )}
            {visible.creado_en && (
              <div className="flex items-start gap-2.5 p-3 bg-[#F9FAFB] border border-[#F3F4F6]">
                <div className="w-7 h-7 rounded bg-white border border-[#E5E7EB] flex items-center justify-center flex-shrink-0">
                  <FileText size={13} className="text-ink-muted" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Creado</p>
                  <p className="text-[13px] text-ink font-semibold mt-0.5">{formatDateTime(visible.creado_en)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Resumen ejecutivo */}
          {visible.resumen && (
            <section>
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#F3F4F6]">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-ink">Resumen ejecutivo</h3>
              </div>
              <div className="pl-4 border-l-2 border-[#E5E7EB] py-3 pr-3">
                <p className="text-[13.5px] text-ink leading-relaxed whitespace-pre-line italic">
                  {visible.resumen}
                </p>
              </div>
            </section>
          )}

          {/* Contenido completo */}
          {visible.contenido && (
            <section>
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#F3F4F6]">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-ink">Contenido completo</h3>
                <span className="text-[10px] text-ink-muted font-normal">
                  · {visible.contenido.length} caracteres
                </span>
              </div>
              <div className="bg-white border border-[#E5E7EB] p-5 max-h-[420px] overflow-y-auto">
                <div className="text-[13.5px] text-ink leading-[1.75] whitespace-pre-wrap break-words">
                  {visible.contenido}
                </div>
              </div>
            </section>
          )}

          {/* Observaciones */}
          {visible.observaciones && (
            <section>
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#F3F4F6]">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-ink">Observaciones</h3>
              </div>
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-ink-muted flex-shrink-0 mt-0.5" />
                <p className="text-[13px] text-ink leading-relaxed whitespace-pre-line">
                  {visible.observaciones}
                </p>
              </div>
            </section>
          )}

          {/* Pie de metadatos */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#F3F4F6] text-[10.5px] text-ink-muted">
            <span>Actualizado: {formatDateTime(visible.actualizado_en)}</span>
            {visible.archivo && (
              <a
                href={visible.archivo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
              >
                <Download size={11} /> Archivo adjunto
              </a>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
