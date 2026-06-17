import { useEffect, useMemo, useState } from 'react'
import { FileText, Download, Upload, FolderOpen, Trash2, FileSpreadsheet, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatosApi } from '@/api/formatos'
import { useAuthStore } from '@/store/authStore'
import { ConfirmModal } from '@/components/ui'
import UploadFormatoModal from './UploadFormatoModal'
import type { FormatoInstitucional, NivelFormato, TipoFormato } from '@/types/formatos'

const TIPO_LABELS: Record<TipoFormato, string> = {
  GUIA: 'Guía metodológica',
  FORMULACION: 'Formulación de proyectos',
  AVANCE: 'Informe de avance',
  FINAL: 'Informe final',
}

const TIPO_ORDEN: TipoFormato[] = ['GUIA', 'FORMULACION', 'AVANCE', 'FINAL']

function fileIconAndColor(filename?: string | null) {
  if (!filename) return { Icon: FileText, color: '#6B7280' }
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return { Icon: FileText, color: '#DC2626' }
  if (ext === 'docx' || ext === 'doc') return { Icon: FileText, color: '#2563EB' }
  if (ext === 'xlsx' || ext === 'xls') return { Icon: FileSpreadsheet, color: '#16A34A' }
  return { Icon: FileText, color: '#6B7280' }
}

function formatBytes(kbStr: string) {
  const kb = parseFloat(kbStr)
  if (Number.isNaN(kb)) return ''
  if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`
  return `${kb.toFixed(2)} KB`
}

export default function FormatosPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.rol === 'ADMIN'

  const [formatos, setFormatos] = useState<FormatoInstitucional[]>([])
  const [loading, setLoading] = useState(true)
  const [nivelTab, setNivelTab] = useState<NivelFormato>('PREGRADO')

  const [showUpload, setShowUpload] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fetchFormatos = async () => {
    setLoading(true)
    try {
      const { data } = await formatosApi.list({ page_size: '100' })
      const results = Array.isArray((data as any).results)
        ? (data as any).results
        : Array.isArray(data)
          ? data
          : []
      setFormatos(results)
    } catch (err: any) {
      console.error('Error cargando formatos:', err)
      toast.error('Error al cargar formatos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFormatos()
  }, [])

  const formatosFiltrados = useMemo(
    () => formatos.filter((f) => f.nivel === nivelTab && f.activo),
    [formatos, nivelTab]
  )

  const grouped = useMemo(() => {
    const map: Record<TipoFormato, FormatoInstitucional[]> = {
      GUIA: [],
      FORMULACION: [],
      AVANCE: [],
      FINAL: [],
    }
    formatosFiltrados.forEach((f) => {
      if (map[f.tipo]) map[f.tipo].push(f)
    })
    return map
  }, [formatosFiltrados])

  const countByNivel = (n: NivelFormato) => formatos.filter((f) => f.nivel === n && f.activo).length

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await formatosApi.delete(deleteId)
      toast.success('Formato eliminado')
      setDeleteId(null)
      await fetchFormatos()
    } catch {
      toast.error('Error al eliminar formato')
    }
  }

  const handleDownload = (f: FormatoInstitucional) => {
    const url = f.archivo_url || f.archivo
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = f.nombre
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const hayFormatos = formatosFiltrados.length > 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink tracking-tight">Formatos Institucionales</h1>
          <p className="mt-1 text-sm text-gray-500">
            Documentos oficiales para la formulación y seguimiento de proyectos de vinculación, según
            la normativa de la UNL
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0"
          >
            <Upload size={16} />
            Subir formato
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex">
          {(['PREGRADO', 'POSGRADO'] as NivelFormato[]).map((n) => (
            <button
              key={n}
              onClick={() => setNivelTab(n)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                nivelTab === n
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {n === 'PREGRADO' ? 'Pregrado' : 'Posgrado'}
              <span
                className={`ml-2 inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  nivelTab === n ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {countByNivel(n)}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={fetchFormatos}
          disabled={loading}
          className="mr-2 p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-[3px] border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : !hayFormatos ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen size={48} className="text-gray-300 mb-4" />
          <p className="text-sm text-gray-500 font-medium">No hay formatos disponibles todavía</p>
          <p className="text-xs text-gray-400 mt-1">
            Los documentos oficiales de la UNL aparecerán aquí una vez que el administrador los suba.
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowUpload(true)}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <Upload size={16} />
              Subir formato
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {TIPO_ORDEN.map((tipoKey) => {
            const items = grouped[tipoKey]
            if (items.length === 0) return null
            return (
              <div key={tipoKey}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {TIPO_LABELS[tipoKey]}
                </h3>
                <div className="space-y-3">
                  {items.map((f) => {
                    const { Icon, color } = fileIconAndColor(f.archivo)
                    return (
                      <div
                        key={f.id}
                        className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex items-center justify-between transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className="w-10 h-10 flex items-center justify-center rounded-lg shrink-0"
                            style={{ backgroundColor: `${color}15` }}
                          >
                            <Icon size={20} style={{ color }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{f.nombre}</p>
                            {f.tamano_kb ? (
                              <p className="text-xs text-gray-500 mt-0.5">{formatBytes(f.tamano_kb)}</p>
                            ) : (
                              <p className="text-xs text-gray-400 mt-0.5 italic">Sin tamaño registrado</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <button
                            onClick={() => handleDownload(f)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
                          >
                            <Download size={14} />
                            Descargar
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setDeleteId(f.id)}
                              className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-white hover:bg-red-600 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Upload */}
      <UploadFormatoModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={(nivelSubido) => {
          setShowUpload(false)
          setNivelTab(nivelSubido)
          fetchFormatos()
        }}
      />

      {/* Modal Delete (sistema ConfirmModal) */}
      <ConfirmModal
        isOpen={deleteId !== null}
        titulo="¿Eliminar formato?"
        mensaje="Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmColor="emerald"
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
      />
    </div>
  )
}
