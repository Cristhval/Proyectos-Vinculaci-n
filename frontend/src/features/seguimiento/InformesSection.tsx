import { useEffect, useState, useCallback } from 'react'
import {
  FileText, Plus, Pencil, Download, Eye, Clock,
  Calendar, Inbox, Trash2, FileCheck, FileBadge,
  FileCode, FilePieChart, AlertCircle, Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import Tooltip from '@/components/ui/Tooltip'
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
import GenerarInformeIAModal from './GenerarInformeIAModal'

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
  const [showIA, setShowIA] = useState(false)
  const [editInforme, setEditInforme] = useState<Informe | null>(null)
  const [viewInforme, setViewInforme] = useState<Informe | null>(null)
  const [deleteInforme, setDeleteInforme] = useState<Informe | null>(null)

  const isDocenteResponsable = user?.rol === 'DOCENTE' && responsableId === user?.id
  const canCreate = isAdmin() || isDocenteResponsable
  const canEdit = (informe: Informe) => isAdmin() || informe.elaborado_por === user?.id
  const canDelete = (informe: Informe) => isAdmin() || isDocenteResponsable || informe.elaborado_por === user?.id

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

  const tipoIconBg: Record<string, string> = {
    INICIAL: 'bg-[#DBEAFE] text-[#1D4ED8]',
    PARCIAL: 'bg-[#FEF3C7] text-[#92400E]',
    FINAL: 'bg-[#DCFCE7] text-[#15803D]',
    TECNICO: 'bg-[#EDE9FE] text-[#5B21B6]',
    FINANCIERO: 'bg-[#FCE7F3] text-[#9D174D]',
  }

  const tipoIconMap: Record<string, typeof FileText> = {
    INICIAL: FileText,
    PARCIAL: FileCheck,
    FINAL: FileBadge,
    TECNICO: FileCode,
    FINANCIERO: FilePieChart,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-7 h-7 bg-rose-50 text-rose-600 flex-shrink-0" style={{ borderRadius: '4px' }}>
            <FileText size={13} strokeWidth={2.25} />
          </span>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
            Informes del proyecto <span style={{ fontWeight: 400, color: '#6B7280' }}>({informes.length} informes)</span>
          </h2>
        </div>
        {canCreate && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowIA(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#0F172A] hover:bg-[#1E3A8A] transition-colors"
              style={{ borderRadius: 0 }}
            >
              <Sparkles size={14} /> Generar con IA
            </button>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-500/40 transition-all"
              style={{ borderRadius: 0 }}
            >
              <Plus size={14} /> Nuevo informe
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-[3px] border-[#E5E7EB] border-t-[#16A34A] rounded-full animate-spin" />
        </div>
      ) : informes.length === 0 ? (
        <div className="bg-white text-left" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px', padding: '48px 24px' }}>
          <Inbox size={40} className="text-[#E5E7EB] mb-3" />
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0A' }}>No hay informes registrados</p>
          <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
            Genera el primer informe de seguimiento de este proyecto
          </p>
        </div>
      ) : (
        <div className="bg-white overflow-hidden" style={{ border: '0.5px solid #E5E7EB', borderRadius: '8px' }}>
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB]" style={{ borderBottom: '0.5px solid #E5E7EB' }}>
              <tr>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#0A0A0A] uppercase tracking-wider">N.°</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#0A0A0A] uppercase tracking-wider">Título</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#0A0A0A] uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#0A0A0A] uppercase tracking-wider">Período</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#0A0A0A] uppercase tracking-wider">Autor</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#0A0A0A] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {informes.map((inf, i) => {
                const tipoBadge = TIPO_INFORME_BADGE[inf.tipo] || 'bg-[#E5E7EB] text-[#374151]'
                const tipoLabel = TIPO_INFORME_LABELS[inf.tipo] || inf.tipo
                const estadoStyle = ESTADO_INFORME_BADGE[inf.estado] ?? ESTADO_INFORME_BADGE.PENDIENTE!
                const estadoLabel = ESTADO_INFORME_LABELS[inf.estado] || inf.estado
                const TipoIconComp = tipoIconMap[inf.tipo] || FileText
                const inicialesAutor = (inf.elaborado_por_nombre || '?')
                  .split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

                return (
                  <tr key={inf.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'} hover:bg-[#F0FDF4] transition-colors duration-150`}>
                    {/* N° */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono text-[#6B7280]">{inf.numero}</span>
                    </td>

                    {/* Título */}
                    <td className="px-4 py-3.5 min-w-[240px]">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tipoIconBg[inf.tipo] || 'bg-[#E5E7EB] text-[#374151]'}`}>
                          <TipoIconComp size={16} />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded ${tipoBadge}`}>
                              {tipoLabel}
                            </span>
                            {inf.generado_con_ia && (
                              <Tooltip content="Generado con IA y revisado por el responsable.">
                                <span
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold"
                                  style={{
                                    background: '#EFF6FF',
                                    color: '#1E3A8A',
                                    border: '1px solid #BFDBFE',
                                    borderRadius: 2,
                                  }}
                                >
                                  <Sparkles size={9} /> IA
                                </span>
                              </Tooltip>
                            )}
                          </div>
                          <p className="font-medium text-[#374151] text-[13px] leading-tight truncate">{inf.titulo}</p>
                          {inf.resumen && (
                            <p className="text-[11px] text-[#6B7280] line-clamp-1">{inf.resumen}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 min-w-[80px] justify-center ${estadoStyle.bg} ${estadoStyle.text}`}
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
                    </td>

                    {/* Período */}
                    <td className="px-4 py-3.5">
                      {inf.periodo_inicio && inf.periodo_fin ? (
                        <div className="flex items-center gap-1.5 text-[#6B7280] text-xs">
                          <Calendar size={12} />
                          <span className="tabular-nums">{formatDate(inf.periodo_inicio)} → {formatDate(inf.periodo_fin)}</span>
                        </div>
                      ) : (
                        <span className="text-[#9CA3AF] text-xs">—</span>
                      )}
                    </td>

                    {/* Autor */}
                    <td className="px-4 py-3.5">
                      {inf.elaborado_por_nombre ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                            {inicialesAutor}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[#374151] truncate">{inf.elaborado_por_nombre}</p>
                            {inf.fecha_emision && (
                              <p className="text-[10px] text-[#6B7280] flex items-center gap-1">
                                <Clock size={10} />
                                {formatDate(inf.fecha_emision)}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#9CA3AF] text-xs">—</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3.5 text-left">
                      <div className="flex items-center justify-start gap-1">
                        {inf.archivo && (
                          <a
                            href={inf.archivo}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            title="Descargar PDF"
                            className="p-1.5 text-[#16A34A] hover:bg-emerald-600 hover:text-white transition-colors"
                          >
                            <Download size={14} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setViewInforme(inf)}
                          title="Ver detalles"
                          className="p-1.5 text-[#0F172A] hover:bg-[#0F172A] hover:text-white transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        {canEdit(inf) && (
                          <button
                            type="button"
                            onClick={() => setEditInforme(inf)}
                            title="Editar informe"
                            className="p-1.5 text-[#16A34A] hover:bg-emerald-600 hover:text-white transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {canDelete(inf) && (
                          <button
                            type="button"
                            onClick={() => setDeleteInforme(inf)}
                            title="Eliminar informe"
                            className="p-1.5 text-[#DC2626] hover:bg-red-600 hover:text-white transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <InformeFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        proyectoId={proyectoId}
        onSaved={() => { setShowForm(false); loadInformes() }}
      />

      <GenerarInformeIAModal
        open={showIA}
        onClose={() => setShowIA(false)}
        proyectoId={proyectoId}
        onSaved={() => { setShowIA(false); loadInformes() }}
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
