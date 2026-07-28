import { useEffect, useState } from 'react'
import {
  TrendingUp, AlertCircle, FileText, Timer,
  ChevronDown, Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { avancesApi } from '@/api/seguimiento'
import type { Avance } from '@/types/seguimiento'
import Modal from '@/components/ui/Modal'

interface RegistrarAvanceModalProps {
  open: boolean
  onClose: () => void
  actividadId: number
  ultimoPorcentaje: number
  actividadNombre?: string
  avance?: Avance | null
  onSaved: () => void
}

export default function RegistrarAvanceModal({ open, onClose, actividadId, ultimoPorcentaje, actividadNombre, avance, onSaved }: RegistrarAvanceModalProps) {
  const isEdit = Boolean(avance)
  // Primer avance automático: 50%; segundo avance automático: 100%.
  const calcularPorcentajeAutomatico = (ultimo: number) => {
    if (ultimo >= 100) return 100
    if (ultimo >= 50) return 100
    return 50
  }
  const [porcentaje, setPorcentaje] = useState<number>(0)
  const [descripcion, setDescripcion] = useState('')
  const [horas, setHoras] = useState<number>(0)
  const [dificultades, setDificultades] = useState('')
  const [acciones, setAcciones] = useState('')
  const [toggleDificultades, setToggleDificultades] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (avance) {
      setPorcentaje(parseFloat(avance.porcentaje_avance) || 0)
      setDescripcion(avance.descripcion || '')
      setHoras(parseFloat(avance.horas_invertidas) || 0)
      setDificultades(avance.dificultades || '')
      setAcciones(avance.acciones_correctivas || '')
      setToggleDificultades(Boolean((avance.dificultades || '').trim() || (avance.acciones_correctivas || '').trim()))
    } else {
      setPorcentaje(calcularPorcentajeAutomatico(ultimoPorcentaje))
      setDescripcion('')
      setHoras(0)
      setDificultades('')
      setAcciones('')
      setToggleDificultades(false)
    }
    setErrorMsg(null)
  }, [open, avance, ultimoPorcentaje])

  const handleSubmit = async () => {
    setErrorMsg(null)

    if (descripcion.trim().length < 20) {
      setErrorMsg('La descripción debe tener al menos 20 caracteres')
      return
    }
    if (!isEdit && ultimoPorcentaje >= 100) {
      setErrorMsg('La actividad ya está completada al 100%')
      return
    }
    if (toggleDificultades && dificultades.trim().length === 0) {
      setErrorMsg('Activa el toggle solo si vas a describir las dificultades')
      return
    }
    if (dificultades.trim().length > 0 && acciones.trim().length === 0) {
      setErrorMsg('Si registras dificultades, las acciones correctivas son obligatorias')
      return
    }
    if (horas > 0 && horas < 0.5) {
      setErrorMsg('Las horas invertidas deben ser al menos 0.5')
      return
    }

    const payload: Record<string, unknown> = {
      actividad: actividadId,
      porcentaje_avance: isEdit && avance ? parseFloat(avance.porcentaje_avance) || 0 : calcularPorcentajeAutomatico(ultimoPorcentaje),
      descripcion: descripcion.trim(),
    }
    if (horas > 0) {
      payload.horas_invertidas = horas
    } else {
      payload.horas_invertidas = 0
    }
    if (dificultades.trim()) {
      payload.dificultades = dificultades.trim()
    }
    if (acciones.trim()) {
      payload.acciones_correctivas = acciones.trim()
    }
    if (!isEdit) {
      payload.estado = 'PENDIENTE'
    }

    setSaving(true)
    try {
      if (isEdit && avance) {
        await avancesApi.update(avance.id, payload)
        toast.success('Avance actualizado correctamente')
      } else {
        await avancesApi.create(payload)
        toast.success('Avance registrado correctamente')
      }
      onSaved()
    } catch (err: unknown) {
      console.error('[RegistrarAvance] Error al registrar:', err)
      const e = err as { response?: { status?: number; data?: { detail?: string; message?: string; [k: string]: unknown } } }
      console.error('[RegistrarAvance] Status:', e?.response?.status)
      console.error('[RegistrarAvance] Data del error:', JSON.stringify(e?.response?.data, null, 2))
      const data = e?.response?.data
      let msg = 'Error al registrar avance'
      if (data?.detail) msg = String(data.detail)
      else if (data?.message) msg = String(data.message)
      else if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0]
        if (firstKey) {
          const val = (data as Record<string, unknown>)[firstKey]
          if (Array.isArray(val)) msg = `${firstKey}: ${val[0]}`
          else if (typeof val === 'string') msg = `${firstKey}: ${val}`
        }
      }
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar avance' : 'Registrar avance'}
      subtitle={isEdit ? 'Modifica los datos del avance registrado.' : (actividadNombre || 'Documenta el progreso realizado en esta actividad.')}
      icon={
        <div className="w-8 h-8 rounded-full bg-[#DCFCE7] flex items-center justify-center">
          <TrendingUp size={18} className="text-[#16A34A]" />
        </div>
      }
      iconClassName="!bg-transparent !w-auto !h-auto"
      size="xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium text-ink bg-white border border-[#0A0A0A] hover:bg-gray-50 disabled:opacity-40 transition-colors"
            style={{ borderRadius: '0px' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 h-9 px-4 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ borderRadius: '0px' }}
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check size={14} strokeWidth={2.5} />
                {isEdit ? 'Guardar cambios' : 'Registrar avance'}
              </>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-5" style={{ borderRadius: '6px' }}>
          <label className="block text-sm font-semibold text-ink mb-2">
            Porcentaje de avance
          </label>
          {!isEdit ? (
            <div className="space-y-2">
              <div className="px-3 py-2 bg-emerald-50 text-[#15803D] text-[11px] leading-relaxed rounded" style={{ borderRadius: '4px' }}>
                {ultimoPorcentaje >= 100 ? (
                  <>La actividad ya está completada al <span className="font-bold">100%</span>. No puedes registrar más avances.</>
                ) : ultimoPorcentaje >= 50 ? (
                  <>Tu último avance fue del <span className="font-bold">{ultimoPorcentaje}%</span>. Al registrar este avance, la actividad se completará al <span className="font-bold">100%</span>.</>
                ) : ultimoPorcentaje > 0 ? (
                  <>Tu último avance fue del <span className="font-bold">{ultimoPorcentaje}%</span>. Al registrar este avance, el progreso subirá automáticamente a <span className="font-bold">50%</span>.</>
                ) : (
                  <>Al registrar este avance, la actividad avanzará automáticamente al <span className="font-bold">50%</span>.</>
                )}
              </div>
              {ultimoPorcentaje > 0 && ultimoPorcentaje < 100 && (
                <p className="text-[11px] text-ink-muted">
                  Último avance registrado: <span className="font-semibold text-ink">{ultimoPorcentaje}%</span>
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span
                className="text-[#16A34A] tabular-nums"
                style={{ fontSize: '36px', fontWeight: 700, lineHeight: 1 }}
              >
                {porcentaje}
              </span>
              <span className="text-[#16A34A]" style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1 }}>%</span>
              <span className="ml-2 text-[11px] text-ink-muted">(porcentaje registrado en este avance)</span>
            </div>
          )}
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-ink mb-2">
            <FileText size={14} className="text-ink-muted" />
            Descripción del avance <span className="text-red-500">*</span>
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value.slice(0, 500))}
            rows={4}
            maxLength={500}
            className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors resize-none"
            style={{ borderRadius: '4px' }}
            placeholder="Describe las actividades realizadas, logros obtenidos, evidencias generadas..."
          />
          <div className="flex items-center justify-between mt-1.5">
            {descripcion.length > 0 && descripcion.trim().length < 20 ? (
              <p className="text-[11px] text-red-500">
                Mínimo 20 caracteres ({descripcion.trim().length}/20)
              </p>
            ) : (
              <span />
            )}
            <p className="text-[11px] text-ink-muted tabular-nums ml-auto">
              {descripcion.length} / 500 caracteres
            </p>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-ink mb-2">
            <Timer size={14} className="text-ink-muted" />
            Horas invertidas
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setHoras((h) => Math.max(0, Number((h - 0.5).toFixed(1))))}
              className="h-10 w-10 inline-flex items-center justify-center border border-[#E5E7EB] bg-white text-ink hover:bg-[#F9FAFB] transition-colors text-lg font-semibold"
              style={{ borderRadius: '0px' }}
            >
              −
            </button>
            <div className="relative flex-1">
              <input
                type="number"
                min={0}
                step={0.5}
                value={horas}
                onChange={(e) => setHoras(Math.max(0, Number(e.target.value) || 0))}
                className="w-full h-10 px-3 pr-12 text-sm text-center font-semibold text-ink border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors tabular-nums"
                style={{ borderRadius: '0px' }}
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-muted pointer-events-none">
                hrs
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHoras((h) => Number((h + 0.5).toFixed(1)))}
              className="h-10 w-10 inline-flex items-center justify-center border border-[#E5E7EB] bg-white text-ink hover:bg-[#F9FAFB] transition-colors text-lg font-semibold"
              style={{ borderRadius: '0px' }}
            >
              +
            </button>
          </div>
        </div>

        <div className="border border-[#E5E7EB]" style={{ borderRadius: '6px' }}>
          <button
            type="button"
            onClick={() => setToggleDificultades(!toggleDificultades)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F9FAFB] transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className={toggleDificultades ? 'text-amber-600' : 'text-ink-muted'} />
              <span className="text-sm font-semibold text-ink">¿Encontraste dificultades?</span>
              {toggleDificultades && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-700">
                  Activo
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                onClick={(e) => { e.stopPropagation(); setToggleDificultades(!toggleDificultades) }}
                className={`relative inline-flex h-5 w-9 items-center cursor-pointer transition-colors ${toggleDificultades ? 'bg-[#16A34A]' : 'bg-[#D1D5DB]'}`}
                style={{ borderRadius: '999px' }}
              >
                <span
                  className="inline-block h-4 w-4 transform bg-white shadow transition-transform"
                  style={{
                    borderRadius: '999px',
                    transform: toggleDificultades ? 'translateX(18px)' : 'translateX(2px)',
                  }}
                />
              </span>
              <ChevronDown
                size={16}
                className={`text-ink-muted transition-transform ${toggleDificultades ? 'rotate-180' : ''}`}
              />
            </div>
          </button>
          {toggleDificultades && (
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#E5E7EB] bg-white">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Describe las dificultades
                </label>
                <textarea
                  value={dificultades}
                  onChange={(e) => setDificultades(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors resize-none"
                  style={{ borderRadius: '0px' }}
                  placeholder="¿Qué obstáculos o problemas encontraste?"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Acciones correctivas <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={acciones}
                  onChange={(e) => setAcciones(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors resize-none"
                  style={{ borderRadius: '0px' }}
                  placeholder="¿Qué acciones tomaste o tomarás para resolver las dificultades?"
                />
                {dificultades.trim().length > 0 && acciones.trim().length === 0 && (
                  <p className="text-[11px] text-red-500 mt-1">
                    Las acciones correctivas son obligatorias al registrar dificultades
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700" style={{ borderRadius: '4px' }}>
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">{errorMsg}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
