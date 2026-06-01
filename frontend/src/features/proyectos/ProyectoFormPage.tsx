import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { proyectosApi } from '@/api/proyectos'
import { carrerasApi, usuariosApi } from '@/api/usuarios'
import { useAuthStore } from '@/store/authStore'
import { ConfirmModal } from '@/components/ui'
import type { TipoProyecto, PrioridadProyecto } from '@/types/proyectos'
import type { Carrera, Usuario } from '@/types/usuarios'

const STEPS = [
  { num: 1, label: 'Información General' },
  { num: 2, label: 'Planteamiento' },
  { num: 3, label: 'Fechas y Presupuesto' },
  { num: 4, label: 'Responsables' },
]

interface FormState {
  codigo: string
  titulo: string
  tipo: TipoProyecto
  prioridad: PrioridadProyecto
  carrera: string
  linea_intervencion: string
  resumen: string
  descripcion: string
  problema: string
  justificacion: string
  objetivo_general: string
  resultados_esperados: string
  direccion_ejecucion: string
  fecha_inicio: string
  fecha_fin_planificada: string
  presupuesto_aprobado: string
  observaciones: string
  responsable: string
  coordinador_academico: string
}

const EMPTY_FORM: FormState = {
  codigo: '',
  titulo: '',
  tipo: 'VINCULACION',
  prioridad: 'MEDIA',
  carrera: '',
  linea_intervencion: '',
  resumen: '',
  descripcion: '',
  problema: '',
  justificacion: '',
  objetivo_general: '',
  resultados_esperados: '',
  direccion_ejecucion: '',
  fecha_inicio: '',
  fecha_fin_planificada: '',
  presupuesto_aprobado: '',
  observaciones: '',
  responsable: '',
  coordinador_academico: '',
}

export default function ProyectoFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isEdit = Boolean(id)

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [docentes, setDocentes] = useState<Usuario[]>([])
  const [coordinadores, setCoordinadores] = useState<Usuario[]>([])
  const [modalAction, setModalAction] = useState<'draft' | 'submit' | null>(null)

  const basePath = `/${(user?.rol || 'estudiante').toLowerCase()}/proyectos`

  useEffect(() => {
    carrerasApi.list({ page_size: '100' }).then(({ data }) => setCarreras(data.results))
    usuariosApi.list({ rol: 'DOCENTE', page_size: '100' }).then(({ data }) => setDocentes(data.results))
    usuariosApi.list({ rol: 'COORDINADOR', page_size: '100' }).then(({ data }) => setCoordinadores(data.results))
  }, [])

  useEffect(() => {
    if (!isEdit || !id) return
    proyectosApi.get(Number(id)).then(({ data }) => {
      const p = data as unknown as FormState & { carrera: number | null; responsable: number | null; coordinador_academico: number | null }
      setForm({
        codigo: p.codigo || '',
        titulo: p.titulo || '',
        tipo: p.tipo || 'VINCULACION',
        prioridad: p.prioridad || 'MEDIA',
        carrera: p.carrera ? String(p.carrera) : '',
        linea_intervencion: p.linea_intervencion || '',
        resumen: p.resumen || '',
        descripcion: p.descripcion || '',
        problema: p.problema || '',
        justificacion: p.justificacion || '',
        objetivo_general: p.objetivo_general || '',
        resultados_esperados: p.resultados_esperados || '',
        direccion_ejecucion: p.direccion_ejecucion || '',
        fecha_inicio: p.fecha_inicio || '',
        fecha_fin_planificada: p.fecha_fin_planificada || '',
        presupuesto_aprobado: p.presupuesto_aprobado || '',
        observaciones: p.observaciones || '',
        responsable: p.responsable ? String(p.responsable) : '',
        coordinador_academico: p.coordinador_academico ? String(p.coordinador_academico) : '',
      })
    })
  }, [id, isEdit])

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const validateStep = (s: number): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {}

    if (s === 1) {
      if (!form.codigo.trim()) e.codigo = 'Requerido'
      if (!form.titulo.trim()) e.titulo = 'Requerido'
      if (!form.resumen.trim()) e.resumen = 'Requerido'
    }
    if (s === 2) {
      if (!form.problema.trim()) e.problema = 'Requerido'
      if (!form.justificacion.trim()) e.justificacion = 'Requerido'
      if (!form.objetivo_general.trim()) e.objetivo_general = 'Requerido'
    }
    if (s === 3) {
      if (!form.fecha_inicio) e.fecha_inicio = 'Requerido'
      if (!form.fecha_fin_planificada) e.fecha_fin_planificada = 'Requerido'
    }
    if (s === 4) {
      if (!form.responsable) e.responsable = 'Requerido'
      if (!confirm) {
        toast.error('Confirma que los datos son correctos')
        return false
      }
    }

    setErrors(e)
    if (Object.keys(e).length > 0) {
      toast.error('Completa los campos obligatorios')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(4, s + 1))
  }

  const handlePrev = () => setStep((s) => Math.max(1, s - 1))

  const buildPayload = () => {
    const { carrera, responsable, coordinador_academico, presupuesto_aprobado, ...rest } = form
    return {
      ...rest,
      carrera_id: carrera ? Number(carrera) : null,
      responsable_id: responsable ? Number(responsable) : null,
      coordinador_academico_id: coordinador_academico ? Number(coordinador_academico) : null,
      presupuesto_aprobado: presupuesto_aprobado ? presupuesto_aprobado : '0',
    }
  }

  const handleSaveDraft = () => {
    if (!validateStep(4)) return
    setModalAction('draft')
  }

  const handleSaveAndSubmit = () => {
    if (!validateStep(4)) return
    setModalAction('submit')
  }

  const executeAction = async () => {
    setSaving(true)
    try {
      if (modalAction === 'draft') {
        if (isEdit && id) {
          await proyectosApi.update(Number(id), buildPayload())
          toast.success('Proyecto actualizado')
        } else {
          await proyectosApi.create({ ...buildPayload(), estado: 'BORRADOR' })
          toast.success('Proyecto guardado como borrador')
        }
      } else {
        let proyectoId: number
        if (isEdit && id) {
          await proyectosApi.update(Number(id), buildPayload())
          proyectoId = Number(id)
        } else {
          const { data } = await proyectosApi.create({ ...buildPayload(), estado: 'BORRADOR' })
          proyectoId = (data as unknown as { id: number }).id
        }
        await proyectosApi.enviarRevision(proyectoId)
        toast.success('Proyecto enviado a revisión')
      }
      navigate(basePath)
    } catch {
      toast.error(modalAction === 'draft' ? 'Error al guardar' : 'Error al enviar')
    } finally {
      setSaving(false)
      setModalAction(null)
    }
  }

  const inputCls = (field: keyof FormState) =>
    `w-full px-3 py-2 border text-sm focus:outline-none focus:ring-1 focus:ring-offset-0 transition-all ${
      errors[field]
        ? 'border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:ring-accent focus:border-accent'
    }`

  const selectCls = 'w-full px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-accent'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate(basePath)} className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
          <ArrowLeft size={14} />
          Volver a proyectos
        </button>
        <h1 className="mt-3 text-2xl font-bold text-ink tracking-tight">
          {isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}
        </h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                  step > s.num
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : step === s.num
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-gray-300 text-ink-muted'
                }`}
              >
                {step > s.num ? <Check size={14} /> : s.num}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === s.num ? 'text-ink' : 'text-ink-muted'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${step > s.num ? 'bg-emerald-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white border border-line p-6 space-y-5">
        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-ink">Información General</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Código *</label>
                <input value={form.codigo} onChange={(e) => update('codigo', e.target.value)} className={inputCls('codigo')} placeholder="PRY-001" />
                {errors.codigo && <p className="text-xs text-red-500 mt-1">{errors.codigo}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo *</label>
                <select value={form.tipo} onChange={(e) => update('tipo', e.target.value)} className={selectCls}>
                  <option value="VINCULACION">Vinculación</option>
                  <option value="INVESTIGACION">Investigación</option>
                  <option value="EXTENSION">Extensión</option>
                  <option value="MIXTO">Mixto</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Título *</label>
              <input value={form.titulo} onChange={(e) => update('titulo', e.target.value)} className={inputCls('titulo')} placeholder="Título del proyecto" />
              {errors.titulo && <p className="text-xs text-red-500 mt-1">{errors.titulo}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Prioridad *</label>
                <select value={form.prioridad} onChange={(e) => update('prioridad', e.target.value)} className={selectCls}>
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                  <option value="CRITICA">Crítica</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Carrera *</label>
                <select value={form.carrera} onChange={(e) => update('carrera', e.target.value)} className={selectCls}>
                  <option value="">Seleccionar...</option>
                  {carreras.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Línea de intervención</label>
              <input value={form.linea_intervencion} onChange={(e) => update('linea_intervencion', e.target.value)} className={inputCls('linea_intervencion')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Resumen *</label>
              <textarea value={form.resumen} onChange={(e) => update('resumen', e.target.value)} rows={3} className={inputCls('resumen')} placeholder="Resumen ejecutivo del proyecto" />
              {errors.resumen && <p className="text-xs text-red-500 mt-1">{errors.resumen}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Descripción</label>
              <textarea value={form.descripcion} onChange={(e) => update('descripcion', e.target.value)} rows={4} className={inputCls('descripcion')} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-ink">Planteamiento</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Problema *</label>
              <textarea value={form.problema} onChange={(e) => update('problema', e.target.value)} rows={3} className={inputCls('problema')} placeholder="Descripción del problema a resolver" />
              {errors.problema && <p className="text-xs text-red-500 mt-1">{errors.problema}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Justificación *</label>
              <textarea value={form.justificacion} onChange={(e) => update('justificacion', e.target.value)} rows={3} className={inputCls('justificacion')} />
              {errors.justificacion && <p className="text-xs text-red-500 mt-1">{errors.justificacion}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Objetivo general *</label>
              <textarea value={form.objetivo_general} onChange={(e) => update('objetivo_general', e.target.value)} rows={3} className={inputCls('objetivo_general')} />
              {errors.objetivo_general && <p className="text-xs text-red-500 mt-1">{errors.objetivo_general}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Resultados esperados</label>
              <textarea value={form.resultados_esperados} onChange={(e) => update('resultados_esperados', e.target.value)} rows={3} className={inputCls('resultados_esperados')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Dirección de ejecución</label>
              <input value={form.direccion_ejecucion} onChange={(e) => update('direccion_ejecucion', e.target.value)} className={inputCls('direccion_ejecucion')} />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold text-ink">Fechas y Presupuesto</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha de inicio *</label>
                <input type="date" value={form.fecha_inicio} onChange={(e) => update('fecha_inicio', e.target.value)} className={inputCls('fecha_inicio')} />
                {errors.fecha_inicio && <p className="text-xs text-red-500 mt-1">{errors.fecha_inicio}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha fin planificada *</label>
                <input type="date" value={form.fecha_fin_planificada} onChange={(e) => update('fecha_fin_planificada', e.target.value)} className={inputCls('fecha_fin_planificada')} />
                {errors.fecha_fin_planificada && <p className="text-xs text-red-500 mt-1">{errors.fecha_fin_planificada}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Presupuesto aprobado (USD)</label>
              <input type="number" step="0.01" value={form.presupuesto_aprobado} onChange={(e) => update('presupuesto_aprobado', e.target.value)} className={inputCls('presupuesto_aprobado')} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Observaciones</label>
              <textarea value={form.observaciones} onChange={(e) => update('observaciones', e.target.value)} rows={3} className={inputCls('observaciones')} />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-lg font-semibold text-ink">Responsables y Confirmación</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Responsable *</label>
                <select value={form.responsable} onChange={(e) => update('responsable', e.target.value)} className={selectCls}>
                  <option value="">Seleccionar...</option>
                  {docentes.map((d) => (
                    <option key={d.id} value={d.id}>{d.user_first_name} {d.user_last_name}</option>
                  ))}
                </select>
                {errors.responsable && <p className="text-xs text-red-500 mt-1">{errors.responsable}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Coordinador académico</label>
                <select value={form.coordinador_academico} onChange={(e) => update('coordinador_academico', e.target.value)} className={selectCls}>
                  <option value="">Seleccionar...</option>
                  {coordinadores.map((c) => (
                    <option key={c.id} value={c.id}>{c.user_first_name} {c.user_last_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 p-6 bg-gray-50 border-l-4 border-l-emerald-600 space-y-3">
              <h3 className="text-sm font-semibold text-ink mb-3">Resumen del proyecto</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div><span className="text-gray-500 text-xs">Código:</span> <span className="text-black font-semibold">{form.codigo || '-'}</span></div>
                <div><span className="text-gray-500 text-xs">Tipo:</span> <span className="text-black font-semibold">{form.tipo}</span></div>
                <div><span className="text-gray-500 text-xs">Prioridad:</span> <span className="text-black font-semibold">{form.prioridad}</span></div>
                <div><span className="text-gray-500 text-xs">Inicio:</span> <span className="text-black font-semibold">{form.fecha_inicio || '-'}</span></div>
                <div className="col-span-2"><span className="text-gray-500 text-xs">Título:</span> <span className="text-black font-semibold">{form.titulo || '-'}</span></div>
                <div><span className="text-gray-500 text-xs">Fecha fin:</span> <span className="text-black font-semibold">{form.fecha_fin_planificada || '-'}</span></div>
                <div><span className="text-gray-500 text-xs">Presupuesto:</span> <span className="text-black font-semibold">{form.presupuesto_aprobado ? `$${form.presupuesto_aprobado}` : '-'}</span></div>
              </div>
            </div>

            <label className="flex items-start gap-3 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={confirm}
                onChange={(e) => setConfirm(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-emerald-600"
              />
              <span className="text-sm text-ink">Confirmo que los datos son correctos *</span>
            </label>
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={step === 1}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-gray-300 text-ink hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft size={14} />
          Anterior
        </button>
        <div className="flex items-center gap-3">
          {step < 4 ? (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-ink text-white hover:bg-ink/90 transition-colors"
            >
              Siguiente
              <ArrowRight size={14} />
            </button>
          ) : (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-emerald-600 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar como borrador'}
              </button>
              <button
                onClick={handleSaveAndSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
              >
                {saving ? 'Enviando...' : 'Guardar y enviar a revisión'}
              </button>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={modalAction !== null}
        titulo={modalAction === 'submit' ? '¿Enviar a revisión?' : '¿Guardar borrador?'}
        mensaje={modalAction === 'submit'
          ? 'Está seguro de enviar el proyecto a revisión!'
          : 'Está seguro de guardar el proyecto como borrador!'}
        onConfirm={executeAction}
        onCancel={() => setModalAction(null)}
      />
    </div>
  )
}
