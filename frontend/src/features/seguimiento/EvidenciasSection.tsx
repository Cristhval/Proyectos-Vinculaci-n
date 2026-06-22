import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Image as ImageIcon, FileText, Film, Link2, Paperclip,
  Download, ExternalLink, X, Plus, CheckCircle2, AlertCircle,
  Upload, Trash2, Inbox,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { evidenciasApi } from '@/api/seguimiento'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { TIPO_EVIDENCIA_LABELS, TIPO_EVIDENCIA_BADGE } from '@/lib/constants'
import { formatDateTime } from '@/lib/formatters'
import type { Evidencia, TipoEvidencia } from '@/types/seguimiento'
import type { PaginatedResponse } from '@/types/common'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface EvidenciasSectionProps {
  avanceId?: number
  /** Quien registró el avance: solo él (y ADMIN) puede agregar/eliminar evidencias */
  registradoPorId?: number | null
  /** Si se provee, las evidencias se asocian directamente a la actividad (sin avance) */
  actividadId?: number
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ACCEPT_BY_TIPO: Record<Exclude<TipoEvidencia, 'ENLACE'>, string> = {
  FOTOGRAFIA: 'image/*',
  DOCUMENTO: '.pdf,.doc,.docx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain',
  VIDEO: 'video/*',
  OTRO: '*/*',
}

export default function EvidenciasSection({ avanceId, registradoPorId, actividadId }: EvidenciasSectionProps) {
  const user = useAuthStore((s) => s.user)
  const { isAdmin } = usePermissions()

  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const isAuthor = user?.id != null && registradoPorId != null && registradoPorId === user.id
  const canManage = isAdmin() || isAuthor || (actividadId !== undefined && user?.id != null)

  const loadEvidencias = useCallback(() => {
    if (!avanceId && !actividadId) return
    setLoading(true)
    const promise = avanceId
      ? evidenciasApi.byAvance(avanceId)
      : evidenciasApi.byActividad(actividadId!)
    promise
      .then(({ data }: { data: PaginatedResponse<Evidencia> }) => setEvidencias(data.results))
      .catch(() => toast.error('Error al cargar las evidencias'))
      .finally(() => setLoading(false))
  }, [avanceId, actividadId])

  useEffect(() => {
    loadEvidencias()
  }, [loadEvidencias])

  const handleDelete = async () => {
    if (deletingId == null) return
    try {
      await evidenciasApi.delete(deletingId)
      toast.success('Evidencia eliminada')
      setDeletingId(null)
      loadEvidencias()
    } catch {
      toast.error('No se pudo eliminar la evidencia')
    }
  }

  return (
    <div className="pt-4 mt-4 border-t border-[#F3F4F6] space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="text-[13px] font-semibold text-ink inline-flex items-center gap-2">
          <Paperclip size={13} />
          {avanceId ? 'Evidencias del avance' : 'Evidencias de la actividad'}
          <span className="text-ink-muted font-normal">({evidencias.length})</span>
        </h4>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-500/40 transition-all"
            style={{ borderRadius: 0 }}
          >
            <Plus size={12} /> Agregar evidencia
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : evidencias.length === 0 ? (
        <div className="bg-bg-soft/50 border border-dashed border-[#E5E7EB] rounded p-6 text-center">
          <Inbox size={28} className="mx-auto text-ink-light mb-2 opacity-40" />
          <p className="text-xs font-medium text-ink">Sin evidencias adjuntas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {evidencias.map((ev) => (
            <EvidenciaCard
              key={ev.id}
              evidencia={ev}
              canDelete={canManage}
              onDelete={() => setDeletingId(ev.id)}
            />
          ))}
        </div>
      )}

      <AgregarEvidenciaModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        avanceId={avanceId}
        actividadId={actividadId}
        onSaved={() => { setShowAdd(false); loadEvidencias() }}
      />

      <ConfirmModal
        isOpen={deletingId !== null}
        titulo="¿Eliminar evidencia?"
        mensaje="La evidencia será removida permanentemente del avance. Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TARJETA DE EVIDENCIA
   ═══════════════════════════════════════════════════════════════ */
interface EvidenciaCardProps {
  evidencia: Evidencia
  canDelete: boolean
  onDelete: () => void
}

function EvidenciaCard({ evidencia, canDelete, onDelete }: EvidenciaCardProps) {
  const tipo = evidencia.tipo
  const label = TIPO_EVIDENCIA_LABELS[tipo] || tipo
  const badgeClass = TIPO_EVIDENCIA_BADGE[tipo] || TIPO_EVIDENCIA_BADGE.OTRO
  const archivoNombre = getFileName(evidencia.archivo)
  const tamano = formatSize(evidencia.tamano_archivo)

  return (
    <div className="bg-white border border-[#E5E7EB] p-3 group relative" style={{ borderRadius: '4px' }}>
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          title="Eliminar evidencia"
          className="absolute top-2 right-2 w-7 h-7 inline-flex items-center justify-center bg-white border border-[#E5E7EB] text-[#DC2626] hover:bg-rose-50 hover:border-rose-200 transition-colors opacity-0 group-hover:opacity-100"
          style={{ borderRadius: '4px' }}
        >
          <X size={14} />
        </button>
      )}

      {tipo === 'FOTOGRAFIA' && evidencia.archivo ? (
        <div className="aspect-video w-full overflow-hidden bg-bg-soft mb-2" style={{ borderRadius: '4px' }}>
          <img
            src={evidencia.archivo}
            alt={evidencia.titulo}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-video w-full flex items-center justify-center bg-bg-soft mb-2" style={{ borderRadius: '4px' }}>
          <TipoIcon tipo={tipo} size={36} />
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded ${badgeClass}`}>
            <TipoIcon tipo={tipo} size={9} strokeWidth={2.5} />
            {label}
          </span>
          {evidencia.verificada && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70">
              <CheckCircle2 size={9} strokeWidth={2.5} /> Verificada
            </span>
          )}
        </div>

        <p className="text-[12px] font-semibold text-ink line-clamp-2" title={evidencia.titulo}>
          {evidencia.titulo}
        </p>

        {tipo === 'ENLACE' ? (
          <p className="text-[10px] text-ink-muted truncate" title={evidencia.enlace_externo}>
            {evidencia.enlace_externo}
          </p>
        ) : (
          <p className="text-[10px] text-ink-muted truncate" title={archivoNombre}>
            {archivoNombre}
            {tamano && <span className="ml-1 text-ink-light">· {tamano}</span>}
          </p>
        )}

        <p className="text-[10px] text-ink-light">{formatDateTime(evidencia.fecha_carga)}</p>

        {evidencia.descripcion && (
          <p className="text-[11px] text-ink-muted line-clamp-2" title={evidencia.descripcion}>
            {evidencia.descripcion}
          </p>
        )}

        <div className="flex items-center gap-1.5 pt-1">
          {tipo === 'ENLACE' && evidencia.enlace_externo && (
            <a
              href={evidencia.enlace_externo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-[#16A34A] bg-emerald-50 hover:bg-emerald-100 transition-colors"
              style={{ borderRadius: '4px' }}
            >
              <ExternalLink size={10} /> Abrir
            </a>
          )}
          {tipo !== 'ENLACE' && evidencia.archivo && (
            <a
              href={evidencia.archivo}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-ink bg-bg-soft hover:bg-[#E5E7EB] transition-colors"
              style={{ borderRadius: '4px' }}
            >
              {tipo === 'VIDEO' ? <><Film size={10} /> Ver</> : <><Download size={10} /> Descargar</>}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function TipoIcon({ tipo, size = 14, strokeWidth }: { tipo: TipoEvidencia; size?: number; strokeWidth?: number }) {
  if (tipo === 'FOTOGRAFIA') return <ImageIcon size={size} strokeWidth={strokeWidth} />
  if (tipo === 'DOCUMENTO') return <FileText size={size} strokeWidth={strokeWidth} />
  if (tipo === 'VIDEO') return <Film size={size} strokeWidth={strokeWidth} />
  if (tipo === 'ENLACE') return <Link2 size={size} strokeWidth={strokeWidth} />
  return <Paperclip size={size} strokeWidth={strokeWidth} />
}

function getFileName(url: string | null): string {
  if (!url) return ''
  try {
    const clean = url.split('?')[0] ?? url
    const parts = clean.split('/')
    return parts[parts.length - 1] || clean
  } catch {
    return url
  }
}

function formatSize(bytes: number | null | undefined): string {
  if (bytes == null || isNaN(bytes)) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* ═══════════════════════════════════════════════════════════════
   MODAL: AGREGAR EVIDENCIA
   ═══════════════════════════════════════════════════════════════ */
interface AgregarEvidenciaModalProps {
  open: boolean
  onClose: () => void
  avanceId?: number
  actividadId?: number
  onSaved: () => void
}

function AgregarEvidenciaModal({ open, onClose, avanceId, actividadId, onSaved }: AgregarEvidenciaModalProps) {
  const [tipo, setTipo] = useState<TipoEvidencia>('FOTOGRAFIA')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [enlace, setEnlace] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setTipo('FOTOGRAFIA')
    setTitulo('')
    setDescripcion('')
    setEnlace('')
    setArchivo(null)
    setErrorMsg(null)
  }, [open])

  const validateAndSetFile = (file: File | null) => {
    setErrorMsg(null)
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg(`El archivo no debe superar los 10MB (tamaño actual: ${formatSize(file.size)})`)
      return
    }
    setArchivo(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    validateAndSetFile(f)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0] || null
    validateAndSetFile(f)
  }

  const handleSubmit = async () => {
    setErrorMsg(null)
    if (!titulo.trim()) {
      setErrorMsg('El título es obligatorio')
      return
    }
    if (tipo === 'ENLACE') {
      const url = enlace.trim()
      if (!url) {
        setErrorMsg('La URL es obligatoria')
        return
      }
      try {
        new URL(url)
      } catch {
        setErrorMsg('La URL no tiene un formato válido')
        return
      }
    } else {
      if (!archivo) {
        setErrorMsg('Debes seleccionar un archivo')
        return
      }
    }

    setSaving(true)
    try {
      const fd = new FormData()
      if (avanceId) {
        fd.append('avance', String(avanceId))
      }
      if (actividadId) {
        fd.append('actividad', String(actividadId))
      }
      fd.append('tipo', tipo)
      fd.append('titulo', titulo.trim())
      fd.append('descripcion', descripcion.trim())
      if (tipo === 'ENLACE') {
        fd.append('enlace_externo', enlace.trim())
      } else if (archivo) {
        fd.append('archivo', archivo)
      }
      await evidenciasApi.create(fd)
      toast.success('Evidencia agregada')
      onSaved()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; message?: string } } }
      const msg = e?.response?.data?.detail || e?.response?.data?.message || 'Error al agregar evidencia'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const acceptAttr = tipo === 'ENLACE' ? undefined : ACCEPT_BY_TIPO[tipo]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agregar evidencia"
      subtitle="Adjunta un archivo o enlace que respalde el avance."
      icon={<Paperclip size={20} className="text-emerald-600" />}
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-ink bg-white border border-[#0A0A0A] hover:bg-gray-50 transition-colors"
            style={{ borderRadius: '4px' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ borderRadius: '4px' }}
          >
            {saving ? 'Subiendo...' : 'Agregar evidencia'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Tipo <span className="text-red-500">*</span>
          </label>
          <select
            value={tipo}
            onChange={(e) => { setTipo(e.target.value as TipoEvidencia); setArchivo(null); setErrorMsg(null) }}
            className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
            style={{ borderRadius: '4px' }}
          >
            <option value="FOTOGRAFIA">Fotografía</option>
            <option value="DOCUMENTO">Documento</option>
            <option value="VIDEO">Video</option>
            <option value="ENLACE">Enlace</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
            style={{ borderRadius: '4px' }}
            placeholder="Ej: Foto registro campo"
          />
        </div>

        {tipo === 'ENLACE' ? (
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
              style={{ borderRadius: '4px' }}
              placeholder="https://..."
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Archivo <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-5 border-2 border-dashed cursor-pointer transition-colors ${
                dragging ? 'border-emerald-500 bg-emerald-50' : 'border-[#E5E7EB] bg-bg-soft/50 hover:bg-bg-soft'
              }`}
              style={{ borderRadius: '4px' }}
            >
              {archivo ? (
                <>
                  <FileText size={22} className="text-emerald-600" />
                  <p className="text-[13px] font-medium text-ink truncate max-w-full">{archivo.name}</p>
                  <p className="text-[10px] text-ink-muted">{formatSize(archivo.size)} · clic para cambiar</p>
                </>
              ) : (
                <>
                  <Upload size={22} className="text-ink-muted" />
                  <p className="text-[13px] font-medium text-ink">Arrastra un archivo o haz clic</p>
                  <p className="text-[10px] text-ink-muted">Tamaño máximo 10MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptAttr}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            {archivo && (
              <button
                type="button"
                onClick={() => setArchivo(null)}
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-rose-600 transition-colors"
              >
                <Trash2 size={11} /> Quitar archivo
              </button>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-ink mb-2">Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors resize-none"
            style={{ borderRadius: '4px' }}
            placeholder="Descripción opcional de la evidencia..."
          />
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 text-rose-700" style={{ borderRadius: '4px' }}>
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <p className="text-xs">{errorMsg}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
