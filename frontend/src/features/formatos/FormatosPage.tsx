import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { usePermissions } from '@/hooks/usePermissions'
import toast from 'react-hot-toast'
import {
  FileText,
  Download,
  FolderOpen,
  Trash2,
  Upload,
  X,
  FileSpreadsheet,
  FileType,
} from 'lucide-react'
import { formatosApi } from '@/api/formatos'
import type { Formato, NivelFormato, TipoFormato } from '@/types/formatos'
import ConfirmModal from '@/components/ui/ConfirmModal'
import Spinner from '@/components/ui/Spinner'

const TIPO_LABELS: Record<TipoFormato, string> = {
  GUIA: 'Guía metodológica',
  FORMULACION: 'Formato de formulación',
  AVANCE: 'Informe de avance',
  FINAL: 'Informe final',
}

const TIPOS_ORDEN: TipoFormato[] = ['GUIA', 'FORMULACION', 'AVANCE', 'FINAL']

function getFileExtension(url: string | null | undefined): string {
  if (!url) return ''
  try {
    const pathname = new URL(url).pathname
    const parts = pathname.split('.')
    return parts[parts.length - 1]?.toLowerCase() || ''
  } catch {
    const parts = url.split('.')
    return parts[parts.length - 1]?.toLowerCase() || ''
  }
}

function getIconAndColor(ext: string) {
  if (ext === 'pdf') return { Icon: FileText, color: '#DC2626' }
  if (ext === 'docx' || ext === 'doc') return { Icon: FileType, color: '#2563EB' }
  if (ext === 'xlsx' || ext === 'xls') return { Icon: FileSpreadsheet, color: '#16A34A' }
  return { Icon: FileText, color: '#6B7280' }
}

function formatSize(kb: number | null): string {
  if (!kb) return ''
  if (kb < 1024) return `${kb} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

interface UploadModalProps {
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  nombre: string
  setNombre: (v: string) => void
  nivelForm: NivelFormato
  setNivelForm: (v: NivelFormato) => void
  tipoForm: TipoFormato
  setTipoForm: (v: TipoFormato) => void
  descripcion: string
  setDescripcion: (v: string) => void
  archivo: File | null
  setArchivo: (f: File | null) => void
  dragActive: boolean
  submitting: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onDrag: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

function UploadModalPortal({
  onClose,
  onSubmit,
  nombre,
  setNombre,
  nivelForm,
  setNivelForm,
  tipoForm,
  setTipoForm,
  descripcion,
  setDescripcion,
  archivo,
  setArchivo,
  dragActive,
  submitting,
  fileInputRef,
  onDrag,
  onDrop,
}: UploadModalProps) {
  const [visible, setVisible] = useState(false)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    setVisible(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimate(true))
    })
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleClose = () => {
    setAnimate(false)
    setTimeout(() => {
      setVisible(false)
      onClose()
    }, 250)
  }

  if (!visible) return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 99999,
        background: `rgba(0, 0, 0, ${animate ? '0.5' : '0'})`,
        backdropFilter: animate ? 'blur(6px)' : 'blur(0px)',
        WebkitBackdropFilter: animate ? 'blur(6px)' : 'blur(0px)',
        transition: 'all 250ms ease',
      }}
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-lg mx-4"
        style={{
          borderRadius: 0,
          padding: '28px',
          position: 'relative',
          transform: animate ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(12px)',
          opacity: animate ? 1 : 0,
          transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-ink">
            Subir formato institucional
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nombre del documento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Formato para Formular Proyectos de Vinculación con la Sociedad"
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
              style={{ borderRadius: 0 }}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nivel <span className="text-red-500">*</span>
              </label>
              <select
                value={nivelForm}
                onChange={(e) => setNivelForm(e.target.value as NivelFormato)}
                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                style={{ borderRadius: 0 }}
                required
              >
                <option value="PREGRADO">Pregrado</option>
                <option value="POSGRADO">Posgrado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                value={tipoForm}
                onChange={(e) => setTipoForm(e.target.value as TipoFormato)}
                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                style={{ borderRadius: 0 }}
                required
              >
                <option value="GUIA">Guía metodológica</option>
                <option value="FORMULACION">Formato de Formulación</option>
                <option value="AVANCE">Informe de Avance</option>
                <option value="FINAL">Informe Final</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-emerald-600 resize-none"
              style={{ borderRadius: 0 }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Archivo <span className="text-red-500">*</span>
            </label>
            <div
              onDragEnter={onDrag}
              onDragLeave={onDrag}
              onDragOver={onDrag}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed cursor-pointer text-center transition-colors"
              style={{
                borderColor: dragActive ? '#16A34A' : '#D1D5DB',
                borderRadius: 0,
                padding: '24px',
              }}
            >
              <Upload size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-xs text-gray-600">
                {archivo ? (
                  <>
                    <span className="font-medium text-gray-900">{archivo.name}</span>{' '}
                    ({formatSize(Math.round(archivo.size / 1024))})
                  </>
                ) : (
                  'Arrastra un archivo aquí o haz clic para seleccionar'
                )}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                PDF, DOCX, XLSX · Máx. 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => {
                  if (e.target.files?.[0]) setArchivo(e.target.files[0])
                }}
                className="hidden"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium border border-gray-900 text-gray-900 hover:bg-gray-50 transition-colors"
              style={{ borderRadius: 0 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
              style={{ borderRadius: 0 }}
            >
              {submitting ? 'Subiendo...' : 'Subir formato'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default function FormatosPage() {
  const { isAdmin } = usePermissions()
  const [activeTab, setActiveTab] = useState<NivelFormato>('PREGRADO')
  const [formatos, setFormatos] = useState<Formato[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [nombre, setNombre] = useState('')
  const [nivelForm, setNivelForm] = useState<NivelFormato>('PREGRADO')
  const [tipoForm, setTipoForm] = useState<TipoFormato>('GUIA')
  const [descripcion, setDescripcion] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFormatos = useCallback(async (nivel?: NivelFormato) => {
    setLoading(true)
    try {
      const res = await formatosApi.list({ nivel: nivel ?? activeTab })
      const data = (res.data as any).results ?? (res.data as any)
      setFormatos(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Error al cargar los formatos')
      setFormatos([])
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchFormatos()
  }, [fetchFormatos])

  const grouped = useMemo(() => {
    const map: Record<TipoFormato, Formato[]> = {
      GUIA: [],
      FORMULACION: [],
      AVANCE: [],
      FINAL: [],
    }
    for (const f of formatos) {
      if (map[f.tipo]) map[f.tipo].push(f)
    }
    return map
  }, [formatos])

  const handleDownload = useCallback((f: Formato) => {
    if (!f.archivo) {
      toast.error('El archivo no está disponible')
      return
    }
    const urlDescarga = f.archivo.startsWith('http')
      ? f.archivo
      : `${window.location.origin}${f.archivo}`
    const link = document.createElement('a')
    link.href = urlDescarga
    link.download = f.nombre
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Descargando archivo...')
  }, [])

  const handleDelete = useCallback(async () => {
    if (!deleteId) return
    try {
      await formatosApi.delete(deleteId)
      toast.success('Formato eliminado')
      fetchFormatos()
    } catch {
      toast.error('Error al eliminar el formato')
    } finally {
      setDeleteId(null)
    }
  }, [deleteId, fetchFormatos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      toast.error('El nombre del documento es obligatorio')
      return
    }
    if (!archivo) {
      toast.error('Debes seleccionar un archivo')
      return
    }
    const ext = getFileExtension(archivo.name)
    const allowed = ['pdf', 'docx', 'xlsx']
    if (!allowed.includes(ext)) {
      toast.error('Formato de archivo no permitido. Usa PDF, DOCX o XLSX')
      return
    }
    if (archivo.size > 10 * 1024 * 1024) {
      toast.error('El archivo supera el límite de 10MB')
      return
    }
    setSubmitting(true)
    const fd = new FormData()
    fd.append('nombre', nombre.trim())
    fd.append('nivel', nivelForm)
    fd.append('tipo', tipoForm)
    fd.append('descripcion', descripcion)
    fd.append('activo', 'true')
    fd.append('archivo', archivo)
    try {
      await formatosApi.create(fd)
      toast.success('Formato subido correctamente')
      setModalOpen(false)
      resetForm()
      setActiveTab(nivelForm)
      await fetchFormatos(nivelForm)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || 'Error al subir el formato'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setNombre('')
    setNivelForm('PREGRADO')
    setTipoForm('GUIA')
    setDescripcion('')
    setArchivo(null)
  }

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) setArchivo(e.dataTransfer.files[0])
  }

  const hasAny = formatos.length > 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            Formatos Institucionales
          </h1>
          <p className="mt-1 text-sm text-ink-muted max-w-2xl">
            Documentos oficiales para la formulación y seguimiento de proyectos de
            vinculación, según la normativa de la UNL
          </p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors shrink-0"
            style={{ borderRadius: 0 }}
          >
            <Upload size={16} />
            + Subir formato
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['PREGRADO', 'POSGRADO'] as NivelFormato[]).map((n) => (
          <button
            key={n}
            onClick={() => setActiveTab(n)}
            className="px-6 py-3 text-sm transition-colors relative"
            style={{
              color: activeTab === n ? '#111827' : '#6B7280',
              fontWeight: activeTab === n ? 500 : 400,
            }}
          >
            {n === 'PREGRADO' ? 'Pregrado' : 'Posgrado'}
            {activeTab === n && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: '#16A34A' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : !hasAny ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen size={48} className="text-gray-300 mb-4" />
          <p className="text-sm text-gray-500">
            No hay formatos disponibles para este nivel todavía
          </p>
          {isAdmin() && (
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
              style={{ borderRadius: 0 }}
            >
              <Upload size={16} />
              + Subir formato
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {TIPOS_ORDEN.map((tipo) => {
            const lista = grouped[tipo]
            return (
              <div key={tipo}>
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '12px',
                  }}
                >
                  {TIPO_LABELS[tipo]}:
                </h3>
                {lista.length > 0 &&
                  lista.map((f) => {
                    const ext = getFileExtension(f.archivo)
                    const { Icon, color } = getIconAndColor(ext)
                    return (
                      <div
                        key={f.id}
                        className="bg-white flex items-center justify-between"
                        style={{
                          border: '0.5px solid #E5E7EB',
                          borderRadius: '8px',
                          padding: '16px 20px',
                          marginBottom: '12px',
                        }}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="flex-shrink-0">
                            <Icon size={28} style={{ color }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {f.nombre}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatSize(f.tamano_kb)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleDownload(f)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                            style={{ borderRadius: 0 }}
                          >
                            <Download size={12} />
                            Descargar
                          </button>
                          {isAdmin() && (
                            <button
                              onClick={() => setDeleteId(f.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
                              style={{ borderRadius: 0 }}
                              title="Eliminar"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            )
          })}
        </div>
      )}

      {/* Upload Modal */}
      {modalOpen && (
        <UploadModalPortal
          onClose={() => {
            setModalOpen(false)
            resetForm()
          }}
          onSubmit={handleSubmit}
          nombre={nombre}
          setNombre={setNombre}
          nivelForm={nivelForm}
          setNivelForm={setNivelForm}
          tipoForm={tipoForm}
          setTipoForm={setTipoForm}
          descripcion={descripcion}
          setDescripcion={setDescripcion}
          archivo={archivo}
          setArchivo={setArchivo}
        dragActive={dragActive}
        submitting={submitting}
          fileInputRef={fileInputRef}
          onDrag={onDrag}
          onDrop={onDrop}
        />
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteId !== null}
        titulo="¿Eliminar formato?"
        mensaje="Se eliminará el formato del sistema. Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
