import { useEffect, useState } from 'react'
import {
  FileText, Save, Send, AlertCircle, Calendar,
  AlignLeft, BookOpen, Hash, Info, FileCheck, FileBadge,
  FileCode, FilePieChart, FilePlus,
} from 'lucide-react'
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

const TIPO_META: Record<TipoInforme, { description: string; Icon: typeof FileText; bg: string; text: string }> = {
  INICIAL: {
    description: 'Diagnóstico y planificación al inicio del proyecto',
    Icon: FilePlus,
    bg: 'bg-[#DBEAFE]',
    text: 'text-[#1D4ED8]',
  },
  PARCIAL: {
    description: 'Avance y resultados a la mitad del período',
    Icon: FileCheck,
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#92400E]',
  },
  FINAL: {
    description: 'Cierre y resultados consolidados del proyecto',
    Icon: FileBadge,
    bg: 'bg-[#DCFCE7]',
    text: 'text-[#15803D]',
  },
  TECNICO: {
    description: 'Detalle metodológico o técnico especializado',
    Icon: FileCode,
    bg: 'bg-[#EDE9FE]',
    text: 'text-[#5B21B6]',
  },
  FINANCIERO: {
    description: 'Ejecución presupuestaria y rendición de cuentas',
    Icon: FilePieChart,
    bg: 'bg-[#FCE7F3]',
    text: 'text-[#9D174D]',
  },
}

const RESUMEN_MIN = 100

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
    if (resumen.trim().length < RESUMEN_MIN) return `El resumen ejecutivo debe tener al menos ${RESUMEN_MIN} caracteres (actual: ${resumen.trim().length})`
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
      toast.success(modo === 'borrador' ? 'Informe guardado como borrador' : 'Informe enviado a revisión')
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

  const resumenLen = resumen.trim().length
  const resumenProgress = Math.min((resumenLen / RESUMEN_MIN) * 100, 100)
  const resumenOk = resumenLen >= RESUMEN_MIN

  const fieldClass = 'w-full px-3.5 py-2.5 text-sm text-ink bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-colors placeholder:text-ink-light'
  const labelClass = 'block text-[12.5px] font-semibold text-ink mb-1.5'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar informe' : 'Nuevo informe'}
      subtitle={isEdit ? 'Modifica la información del informe. Los cambios se guardarán sobre la versión actual.' : 'Genera un nuevo informe de seguimiento para este proyecto.'}
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
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleSave('borrador')}
            disabled={savingDraft || sending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-white border border-emerald-600 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ borderRadius: 0 }}
          >
            <Save size={14} /> {savingDraft ? 'Guardando...' : 'Guardar borrador'}
          </button>
          <button
            type="button"
            onClick={() => handleSave('revision')}
            disabled={savingDraft || sending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ borderRadius: 0 }}
          >
            <Send size={14} /> {sending ? 'Enviando...' : 'Enviar a revisión'}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {/* SECCIÓN 1: Identificación */}
        <section>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#F3F4F6]">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-ink">Identificación</h3>
            <span className="text-[10px] text-ink-muted font-normal">— define el tipo y nombre del informe</span>
          </div>

          <div className="mb-4">
            <label className={labelClass}>
              Tipo de informe <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {TIPOS_INFORME.map((t) => {
                const meta = TIPO_META[t]
                const active = tipo === t
                const Icon = meta.Icon
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`group flex flex-col items-start gap-1.5 p-3 text-left border transition-all ${active ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500' : 'border-[#E5E7EB] hover:border-[#CBD5E1] hover:bg-[#F9FAFB]'}`}
                    style={{ borderRadius: '4px' }}
                  >
                    <div className={`w-7 h-7 flex items-center justify-center ${meta.bg} ${meta.text}`} style={{ borderRadius: '4px' }}>
                      <Icon size={13} />
                    </div>
                    <div className="min-w-0 w-full">
                      <p className={`text-[12px] font-bold ${active ? 'text-emerald-700' : 'text-ink'}`}>
                        {TIPO_INFORME_LABELS[t]}
                      </p>
                      <p className="text-[10px] text-ink-muted leading-tight mt-0.5 line-clamp-2">
                        {meta.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-ink-muted">
              <Info size={11} />
              <span>El código del informe (ej. <span className="font-mono font-semibold text-ink">PAR-001</span>) se asigna automáticamente al guardar.</span>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="informe-titulo">
              Título del informe <span className="text-rose-500">*</span>
            </label>
            <input
              id="informe-titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className={fieldClass}
              style={{ borderRadius: '4px' }}
              placeholder="Ej: Informe parcial del primer trimestre — Avance de actividades"
              maxLength={255}
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[11px] text-ink-muted">
                Usa un título descriptivo que permita identificar el informe fácilmente.
              </p>
              <p className="text-[11px] text-ink-muted tabular-nums">{titulo.length} / 255</p>
            </div>
          </div>
        </section>

        {/* SECCIÓN 2: Período */}
        <section>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#F3F4F6]">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-ink">Período reportado</h3>
            <span className="text-[10px] text-ink-muted font-normal">— rango de fechas que cubre el informe</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="periodo-inicio">
                <Calendar size={12} className="inline mr-1 text-ink-muted" />
                Fecha de inicio <span className="text-rose-500">*</span>
              </label>
              <input
                id="periodo-inicio"
                type="date"
                value={periodoInicio}
                onChange={(e) => setPeriodoInicio(e.target.value)}
                className={fieldClass}
                style={{ borderRadius: '4px' }}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="periodo-fin">
                <Calendar size={12} className="inline mr-1 text-ink-muted" />
                Fecha de fin <span className="text-rose-500">*</span>
              </label>
              <input
                id="periodo-fin"
                type="date"
                value={periodoFin}
                onChange={(e) => setPeriodoFin(e.target.value)}
                min={periodoInicio || undefined}
                className={fieldClass}
                style={{ borderRadius: '4px' }}
              />
            </div>
          </div>
        </section>

        {/* SECCIÓN 3: Resumen ejecutivo */}
        <section>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#F3F4F6]">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-ink">Resumen ejecutivo</h3>
            <span className="text-[10px] text-ink-muted font-normal">— vista rápida para revisores</span>
          </div>

          <div>
            <textarea
              value={resumen}
              onChange={(e) => setResumen(e.target.value.slice(0, 1000))}
              rows={3}
              className={fieldClass}
              style={{ borderRadius: '4px' }}
              placeholder="Síntesis clara y directa: qué se hizo, qué se logró, qué sigue. Este resumen es lo primero que leerá el revisor..."
              maxLength={1000}
            />
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1 bg-[#F3F4F6] overflow-hidden" style={{ borderRadius: '999px' }}>
                <div
                  className={`h-full transition-all ${resumenOk ? 'bg-emerald-500' : resumenLen > 0 ? 'bg-amber-500' : 'bg-[#E5E7EB]'}`}
                  style={{ width: `${resumenProgress}%`, borderRadius: '999px' }}
                />
              </div>
              <p className={`text-[11px] tabular-nums ${resumenOk ? 'text-emerald-600 font-semibold' : resumenLen > 0 ? 'text-amber-600' : 'text-ink-muted'}`}>
                {resumenLen} / {RESUMEN_MIN} mín.
              </p>
            </div>
          </div>
        </section>

        {/* SECCIÓN 4: Contenido completo */}
        <section>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#F3F4F6]">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-ink">Contenido completo</h3>
            <span className="text-[10px] text-ink-muted font-normal">— desarrollo del informe</span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <BookOpen size={12} className="text-ink-muted" />
              <span className="text-[12.5px] font-semibold text-ink">Cuerpo del informe</span>
              <span className="text-rose-500 text-xs">*</span>
            </div>
            <textarea
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              rows={9}
              className={`${fieldClass} font-sans leading-relaxed resize-y`}
              style={{ borderRadius: '4px' }}
              placeholder={'1. INTRODUCCIÓN\n  Contexto y objetivos del período...\n\n2. ACTIVIDADES REALIZADAS\n  Detalle de avances, logros, evidencias...\n\n3. RESULTADOS\n  Métricas, indicadores, productos...\n\n4. CONCLUSIONES Y PRÓXIMOS PASOS\n  Observaciones, recomendaciones...'}
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[11px] text-ink-muted inline-flex items-center gap-1">
                <AlignLeft size={11} />
                Texto plano. Separa secciones con líneas en blanco.
              </p>
              <p className="text-[11px] text-ink-muted tabular-nums">{contenido.length} caracteres</p>
            </div>
          </div>
        </section>

        {/* SECCIÓN 5: Observaciones (opcional) */}
        <section>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#F3F4F6]">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-ink">Observaciones</h3>
            <span className="text-[10px] text-ink-muted font-normal">— opcional, notas para el revisor</span>
          </div>

          <div>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value.slice(0, 500))}
              rows={2}
              className={fieldClass}
              style={{ borderRadius: '4px' }}
              placeholder="Notas adicionales, alertas, riesgos identificados, solicitudes especiales..."
              maxLength={500}
            />
            <div className="flex items-center justify-end mt-1">
              <p className="text-[11px] text-ink-muted tabular-nums">{observaciones.length} / 500</p>
            </div>
          </div>
        </section>

        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 text-rose-700" style={{ borderRadius: '4px' }}>
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <p className="text-[12.5px] leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Footer hint con metadata */}
        {user && (
          <div className="flex items-center gap-2 pt-3 border-t border-[#F3F4F6] text-[11px] text-ink-muted">
            <Hash size={11} />
            <span>Proyecto ID: <span className="font-mono font-semibold text-ink">#{proyectoId}</span></span>
            <span className="text-[#E5E7EB]">·</span>
            <span>Autor: <span className="font-semibold text-ink">{user.user_first_name} {user.user_last_name}</span></span>
          </div>
        )}
      </div>
    </Modal>
  )
}
