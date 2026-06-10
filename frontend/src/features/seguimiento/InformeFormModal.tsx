import { useEffect, useState } from 'react'
import { FileText, Save, Send, AlertCircle, Calendar } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { informesApi } from '@/api/seguimiento'
import { TIPO_INFORME_LABELS } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'
import type { Informe, TipoInforme, EstadoInforme } from '@/types/seguimiento'

interface InformeFormModalProps {
  open: boolean
  onClose: () => void
  proyectoId: number
  informe?: Informe | null
  onSaved: () => void
}

type ModoGuardado = 'borrador' | 'revision'

const TIPOS_INFORME: TipoInforme[] = ['INICIAL', 'PARCIAL', 'FINAL', 'TECNICO', 'FINANCIERO']

export default function InformeFormModal({ open, onClose, proyectoId, informe, onSaved }: InformeFormModalProps) {
  const user = useAuthStore((s) => s.user)
  const isEdit = Boolean(informe)

  const [tipo, setTipo] = useState<TipoInforme>('PARCIAL')
  const [titulo, setTitulo] = useState('')
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFin, setPeriodoFin] = useState('')
  const [resumen, setResumen] = useState('')
  const [contenido, setContenido] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [savingDraft, setSavingDraft] = useState(false)
  const [sending, setSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (informe) {
      setTipo(informe.tipo)
      setTitulo(informe.titulo || '')
      setPeriodoInicio(informe.periodo_inicio || '')
      setPeriodoFin(informe.periodo_fin || '')
      setResumen(informe.resumen || '')
      setContenido(informe.contenido || '')
      setObservaciones(informe.observaciones || '')
    } else {
      setTipo('PARCIAL')
      setTitulo('')
      setPeriodoInicio('')
      setPeriodoFin('')
      setResumen('')
      setContenido('')
      setObservaciones('')
    }
    setErrorMsg(null)
  }, [open, informe])

  const validate = (): string | null => {
    if (!titulo.trim()) return 'El título es obligatorio'
    if (!periodoInicio || !periodoFin) return 'Las fechas del período son obligatorias'
    if (periodoFin < periodoInicio) return 'La fecha fin del período debe ser posterior a la fecha de inicio'
    if (resumen.trim().length < 100) return `El resumen ejecutivo debe tener al menos 100 caracteres (actual: ${resumen.trim().length})`
    if (!contenido.trim()) return 'El contenido completo es obligatorio'
    return null
  }

  const buildPayload = (modo: ModoGuardado) => ({
    proyecto: proyectoId,
    tipo,
    numero: '',
    titulo: titulo.trim(),
    periodo_inicio: periodoInicio,
    periodo_fin: periodoFin,
    resumen: resumen.trim(),
    contenido: contenido.trim(),
    observaciones: observaciones.trim(),
    estado: (modo === 'revision' ? 'EN_REVISION' : 'PENDIENTE') as EstadoInforme,
    elaborado_por: user?.id ?? null,
  })

  const handleSave = async (modo: ModoGuardado) => {
    setErrorMsg(null)
    const error = validate()
    if (error) {
      setErrorMsg(error)
      return
    }

    const setter = modo === 'borrador' ? setSavingDraft : setSending
    setter(true)
    try {
      const payload = buildPayload(modo)
      if (isEdit && informe) {
        await informesApi.update(informe.id, payload)
      } else {
        await informesApi.create(payload)
      }
      toast.success(modo === 'borrador' ? 'Informe guardado' : 'Informe enviado a revisión')
      onSaved()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; message?: string } } }
      const msg = e?.response?.data?.detail || e?.response?.data?.message || 'Error al guardar el informe'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setter(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar informe' : 'Nuevo informe'}
      subtitle={isEdit ? 'Modifica la información del informe.' : 'Genera un nuevo informe de seguimiento para este proyecto.'}
      icon={<FileText size={20} className="text-emerald-600" />}
      size="2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-ink bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            style={{ borderRadius: '4px' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleSave('borrador')}
            disabled={savingDraft || sending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-white border border-emerald-600 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ borderRadius: '4px' }}
          >
            <Save size={14} /> {savingDraft ? 'Guardando...' : 'Guardar borrador'}
          </button>
          <button
            type="button"
            onClick={() => handleSave('revision')}
            disabled={savingDraft || sending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ borderRadius: '4px' }}
          >
            <Send size={14} /> {sending ? 'Enviando...' : 'Enviar a revisión'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Tipo <span className="text-rose-500">*</span>
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoInforme)}
              className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
              style={{ borderRadius: '4px' }}
            >
              {TIPOS_INFORME.map((t) => (
                <option key={t} value={t}>{TIPO_INFORME_LABELS[t]}</option>
              ))}
            </select>
            <p className="text-[11px] text-ink-muted mt-1.5">
              El número se asigna automáticamente según el tipo
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Título <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
              style={{ borderRadius: '4px' }}
              placeholder="Ej: Informe parcial del primer trimestre"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              <Calendar size={12} className="inline mr-1" />
              Fecha inicio período <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={periodoInicio}
              onChange={(e) => setPeriodoInicio(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
              style={{ borderRadius: '4px' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              <Calendar size={12} className="inline mr-1" />
              Fecha fin período <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={periodoFin}
              onChange={(e) => setPeriodoFin(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
              style={{ borderRadius: '4px' }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Resumen ejecutivo <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors resize-none"
            style={{ borderRadius: '4px' }}
            placeholder="Resumen breve del informe (mínimo 100 caracteres)..."
          />
          {resumen.length > 0 && resumen.trim().length < 100 && (
            <p className="text-[11px] text-rose-500 mt-1">
              Mínimo 100 caracteres ({resumen.trim().length}/100)
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Contenido completo <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            rows={8}
            className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors resize-y font-mono"
            style={{ borderRadius: '4px' }}
            placeholder="Desarrollo completo del informe. Puedes usar saltos de línea para separar secciones..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Observaciones
          </label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors resize-none"
            style={{ borderRadius: '4px' }}
            placeholder="Observaciones adicionales (opcional)..."
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
