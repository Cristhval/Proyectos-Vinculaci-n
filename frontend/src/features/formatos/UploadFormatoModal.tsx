import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatosApi } from '@/api/formatos'
import type { NivelFormato, TipoFormato } from '@/types/formatos'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: (nivelSubido: NivelFormato) => void
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose()
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full mx-4 animate-modal-in">{children}</div>
    </div>,
    document.body
  )
}

export default function UploadFormatoModal({ open, onClose, onSuccess }: Props) {
  const [uploading, setUploading] = useState(false)
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoFormato>('GUIA')
  const [nivel, setNivel] = useState<NivelFormato>('PREGRADO')
  const [descripcion, setDescripcion] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setNombre('')
    setTipo('GUIA')
    setNivel('PREGRADO')
    setDescripcion('')
    setArchivo(null)
    setDragActive(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleUpload = async () => {
    if (!nombre.trim() || !archivo) {
      toast.error('Completa los campos obligatorios')
      return
    }
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    if (!allowed.includes(archivo.type)) {
      toast.error('Formato no válido. Solo PDF, DOCX o XLSX')
      return
    }
    if (archivo.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe superar 10MB')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('nombre', nombre.trim())
      fd.append('nivel', nivel)
      fd.append('tipo', tipo)
      fd.append('descripcion', descripcion.trim())
      fd.append('archivo', archivo)
      fd.append('activo', 'true')
      await formatosApi.create(fd)
      toast.success('Formato subido correctamente')
      const nivelSubido = nivel
      resetForm()
      onSuccess(nivelSubido)
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail || err?.response?.data?.message || 'Error al subir formato'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  if (!open) return null

  return (
    <ModalOverlay onClose={handleClose}>
      <div
        className="bg-white w-full max-w-md mx-auto shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 shrink-0">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">
            Subir formato institucional
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 overflow-y-auto">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Nombre del documento <span className="text-red-500">*</span>
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Formato para Formular Proyectos..."
              className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Nivel <span className="text-red-500">*</span>
              </label>
              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value as NivelFormato)}
                className="w-full px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="PREGRADO">Pregrado</option>
                <option value="POSGRADO">Posgrado</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoFormato)}
                className="w-full px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="GUIA">Guía metodológica</option>
                <option value="FORMULACION">Formato de Formulación</option>
                <option value="AVANCE">Informe de Avance</option>
                <option value="FINAL">Informe Final</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Archivo <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragActive(false)
                const file = e.dataTransfer.files?.[0] || null
                if (file) setArchivo(file)
              }}
              className={`cursor-pointer text-center transition-all border-2 border-dashed rounded-md ${
                dragActive
                  ? 'border-emerald-600 bg-emerald-50'
                  : archivo
                    ? 'border-emerald-400 bg-emerald-50/50'
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400'
              }`}
              style={{ padding: '18px' }}
            >
              <Upload size={20} className="mx-auto text-gray-400 mb-1.5" />
              <p className="text-xs text-gray-600 font-medium truncate px-2">
                {archivo ? archivo.name : 'Haz clic o arrastra tu archivo aquí'}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">PDF, DOCX o XLSX · Máx. 10MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.xlsx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                if (file) setArchivo(file)
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-gray-200 shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Subiendo...' : 'Subir formato'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}
