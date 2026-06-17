import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Check, Building2, Plus, Search,
  Hash, ClipboardCheck, Calendar, FileSignature, User,
  Link2, FolderKanban, AlertTriangle, CheckCircle2, Sparkles, RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { conveniosApi, institucionesApi, proyectoConveniosApi } from '@/api/convenios'
import { proyectosApi } from '@/api/proyectos'
import { usuariosApi } from '@/api/usuarios'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { TIPO_CONVENIO_LABELS, TIPO_CONVENIO_COLORS } from '@/lib/constants'
import type { Institucion, TipoConvenio } from '@/types/convenios'
import type { Proyecto } from '@/types/proyectos'
import type { Usuario } from '@/types/usuarios'

const STEPS = [
  { num: 1, label: 'Información general' },
  { num: 2, label: 'Vigencia y responsables' },
  { num: 3, label: 'Revisión y confirmación' },
]

interface FormState {
  codigo: string
  institucion: string
  entidad_contraparte: string
  tipo: TipoConvenio
  objeto: string
  descripcion: string
  fecha_firma: string
  fecha_inicio: string
  fecha_fin: string
  responsable: string
  observaciones: string
  proyectos: number[]
}

const EMPTY_FORM: FormState = {
  codigo: '',
  institucion: '',
  entidad_contraparte: '',
  tipo: 'MARCO',
  objeto: '',
  descripcion: '',
  fecha_firma: '',
  fecha_inicio: '',
  fecha_fin: '',
  responsable: '',
  observaciones: '',
  proyectos: [],
}

export default function ConvenioFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { isAdmin, isCoordinadorOrAbove } = usePermissions()
  const isEdit = Boolean(id)

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(isEdit)
  const [confirm, setConfirm] = useState(false)
  const [modalAction, setModalAction] = useState<'save' | 'submit' | null>(null)

  const [instituciones, setInstituciones] = useState<Institucion[]>([])
  const [coordinadores, setCoordinadores] = useState<Usuario[]>([])
  const [proyectosDisponibles, setProyectosDisponibles] = useState<Proyecto[]>([])
  const [loadingProyectos, setLoadingProyectos] = useState(false)

  const [previewCodigo, setPreviewCodigo] = useState<string>('')
  const [loadingPreview, setLoadingPreview] = useState(false)

  const [showNewInstitucion, setShowNewInstitucion] = useState(false)
  const [newInstSaving, setNewInstSaving] = useState(false)
  const [newInstForm, setNewInstForm] = useState({ nombre: '', sigla: '', email: '', telefono: '' })
  const [newInstErrors, setNewInstErrors] = useState<Record<string, string>>({})

  const rol = user?.rol || 'ESTUDIANTE'
  const basePath = `/${rol.toLowerCase()}/convenios`

  const canSubmitForm = isAdmin() || isCoordinadorOrAbove()

  /* ───── Carga inicial ───── */
  useEffect(() => {
    institucionesApi.list({ activa: 'true', page_size: '200' })
      .then(({ data }) => setInstituciones(data.results))
      .catch(() => toast.error('Error al cargar instituciones'))

    usuariosApi.list({ rol: 'COORDINADOR', page_size: '200' })
      .then(({ data }) => setCoordinadores(data.results))
      .catch(() => toast.error('Error al cargar coordinadores'))
  }, [])

  /* ───── Preview del siguiente código (solo al crear) ───── */
  const cargarPreviewCodigo = useCallback(() => {
    if (isEdit) return
    setLoadingPreview(true)
    conveniosApi.siguienteCodigo()
      .then(({ data }) => {
        if (data?.data?.codigo) setPreviewCodigo(data.data.codigo)
      })
      .catch(() => {/* silencioso */})
      .finally(() => setLoadingPreview(false))
  }, [isEdit])

  useEffect(() => {
    cargarPreviewCodigo()
  }, [cargarPreviewCodigo])

  useEffect(() => {
    if (step !== 3) return
    setLoadingProyectos(true)
    Promise.all([
      proyectosApi.list({ estado: 'APROBADO', page_size: '100' }),
      proyectosApi.list({ estado: 'EN_EJECUCION', page_size: '100' }),
    ])
      .then(([a, b]) => {
        const seen = new Set<number>()
        const merged: Proyecto[] = []
        ;[...a.data.results, ...b.data.results].forEach((p) => {
          if (!seen.has(p.id)) { seen.add(p.id); merged.push(p) }
        })
        setProyectosDisponibles(merged)
      })
      .catch(() => toast.error('Error al cargar proyectos'))
      .finally(() => setLoadingProyectos(false))
  }, [step])

  /* ───── Carga de convenio a editar ───── */
  useEffect(() => {
    if (!isEdit || !id) return
    setLoadingData(true)
    conveniosApi.get(Number(id))
      .then(({ data }) => {
        if (!canSubmitForm) {
          toast.error('No tienes permiso para editar convenios')
          navigate(basePath)
          return
        }
        if (data.estado === 'CANCELADO') {
          toast.error('No se pueden editar convenios cancelados')
          navigate(basePath)
          return
        }
        setForm({
          codigo: data.codigo || '',
          institucion: data.institucion ? String(data.institucion.id) : '',
          entidad_contraparte: data.entidad_contraparte || '',
          tipo: data.tipo || 'MARCO',
          objeto: data.objeto || '',
          descripcion: data.descripcion || '',
          fecha_firma: data.fecha_firma || '',
          fecha_inicio: data.fecha_inicio || '',
          fecha_fin: data.fecha_fin || '',
          responsable: '',
          observaciones: data.observaciones || '',
          proyectos: [],
        })

        if (data.id && !isNaN(data.id)) {
          proyectoConveniosApi.list({ convenio: String(data.id), page_size: '100' })
            .then(({ data: pcData }) => {
              setForm((prev) => ({ ...prev, proyectos: pcData.results.map((pc) => pc.proyecto) }))
            })
            .catch(() => {})
        }
      })
      .catch(() => {
        toast.error('Error al cargar el convenio')
        navigate(basePath)
      })
      .finally(() => setLoadingData(false))
  }, [id, isEdit, canSubmitForm, basePath, navigate])

  const update = (field: keyof FormState, value: string | number[]) => {
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
      if (isEdit && !form.codigo.trim()) e.codigo = 'Requerido'
      else if (form.codigo.length > 40) e.codigo = 'Máximo 40 caracteres'
      if (!form.institucion) e.institucion = 'Selecciona una institución'
      if (!form.entidad_contraparte.trim()) e.entidad_contraparte = 'Requerido'
      else if (form.entidad_contraparte.length > 255) e.entidad_contraparte = 'Máximo 255 caracteres'
      if (!form.objeto.trim()) e.objeto = 'Requerido'
    }

    if (s === 2) {
      if (!form.fecha_firma) e.fecha_firma = 'Requerido'
      if (!form.fecha_inicio) e.fecha_inicio = 'Requerido'
      if (!form.fecha_fin) e.fecha_fin = 'Requerido'
      if (form.fecha_inicio && form.fecha_fin && form.fecha_fin <= form.fecha_inicio) {
        e.fecha_fin = 'La fecha de vencimiento debe ser posterior a la fecha de inicio'
      }
      if (!form.responsable) e.responsable = 'Selecciona un responsable'
    }

    if (s === 3) {
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
    if (validateStep(step)) setStep((s) => Math.min(3, s + 1))
  }

  const handlePrev = () => setStep((s) => Math.max(1, s - 1))

  const buildPayload = () => {
    const payload: Record<string, unknown> = {
      institucion_id: form.institucion ? Number(form.institucion) : null,
      entidad_contraparte: form.entidad_contraparte.trim(),
      tipo: form.tipo,
      objeto: form.objeto.trim(),
      descripcion: form.descripcion.trim(),
      fecha_firma: form.fecha_firma || null,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin: form.fecha_fin || null,
      responsable_id: form.responsable ? Number(form.responsable) : null,
      observaciones: form.observaciones.trim(),
    }
    if (isEdit && form.codigo.trim()) {
      payload.codigo = form.codigo.trim()
    }
    return payload
  }

  const vincularProyectos = async (convenioId: number) => {
    if (!convenioId || isNaN(convenioId)) return
    const yaVinculados = await proyectoConveniosApi.list({ convenio: String(convenioId), page_size: '100' })
      .then(({ data }) => new Set(data.results.map((pc) => pc.proyecto)))
      .catch(() => new Set<number>())

    for (const proyectoId of form.proyectos) {
      if (yaVinculados.has(proyectoId)) continue
      try {
        await proyectoConveniosApi.create({ proyecto: proyectoId, convenio: convenioId, vigente: true })
      } catch {
        /* continuar con los demás */
      }
    }
  }

  const handleGuardar = (yEnviarRevision: boolean) => {
    if (!validateStep(3)) return
    setModalAction(yEnviarRevision ? 'submit' : 'save')
  }

  const executeAction = async () => {
    const yEnviarRevision = modalAction === 'submit'
    setSaving(true)
    try {
      const payload = buildPayload()
      let convenioId: number
      if (isEdit && id) {
        await conveniosApi.update(Number(id), payload)
        convenioId = Number(id)
      } else {
        const { data } = await conveniosApi.create({ ...payload, estado: 'BORRADOR' })
        convenioId = (data as unknown as { id: number }).id
      }

      if (form.proyectos.length > 0) {
        await vincularProyectos(convenioId)
      }

      if (yEnviarRevision) {
        try {
          await conveniosApi.enviarRevision(convenioId)
          toast.success('Convenio enviado a revisión')
        } catch {
          toast.error('Convenio guardado, pero no se pudo enviar a revisión')
        }
      } else {
        toast.success('Convenio guardado')
      }

      navigate(`${basePath}/${convenioId}`)
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
      setModalAction(null)
    }
  }

  const inputCls = (field: keyof FormState) =>
    `w-full px-3 py-2 border text-sm rounded-btn transition-all focus:outline-none focus:ring-2 ${
      errors[field]
        ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-400'
        : 'border-line focus:ring-emerald-500/20 focus:border-emerald-400'
    }`

  const handleCreateInstitucion = async () => {
    const errs: Record<string, string> = {}
    if (!newInstForm.nombre.trim()) errs.nombre = 'Requerido'
    if (newInstForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newInstForm.email)) {
      errs.email = 'Formato inválido'
    }
    setNewInstErrors(errs)
    if (Object.keys(errs).length > 0) return

    setNewInstSaving(true)
    try {
      const { data } = await institucionesApi.create({
        nombre: newInstForm.nombre.trim(),
        sigla: newInstForm.sigla.trim(),
        email: newInstForm.email.trim(),
        telefono: newInstForm.telefono.trim(),
        activa: true,
      })
      const nueva = data as unknown as Institucion
      setInstituciones((prev) => [...prev, nueva])
      update('institucion', String(nueva.id))
      setShowNewInstitucion(false)
      setNewInstForm({ nombre: '', sigla: '', email: '', telefono: '' })
      toast.success('Institución creada y seleccionada')
    } catch {
      toast.error('No se pudo crear la institución')
    } finally {
      setNewInstSaving(false)
    }
  }

  if (!canSubmitForm) {
    return (
      <div className="bg-white border border-line rounded-card p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-bg-soft mx-auto flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-ink-light" />
        </div>
        <p className="text-base font-semibold text-ink">Acceso restringido</p>
        <p className="text-sm text-ink-muted mt-1 max-w-sm mx-auto">
          Solo los administradores y coordinadores pueden crear o editar convenios.
        </p>
        <button
          onClick={() => navigate(basePath)}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-btn border border-line bg-white text-ink hover:bg-bg-soft transition-colors"
        >
          <ArrowLeft size={14} /> Volver a convenios
        </button>
      </div>
    )
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-xs text-ink-muted">Cargando convenio...</p>
        </div>
      </div>
    )
  }

  const institucionSeleccionada = instituciones.find((i) => String(i.id) === form.institucion)
  const responsableSeleccionado = coordinadores.find((c) => String(c.id) === form.responsable)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate(basePath)}
          className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
        >
          <ArrowLeft size={14} />
          Volver a convenios
        </button>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold text-ink tracking-tight">
          {isEdit ? 'Editar convenio' : 'Nuevo convenio'}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {isEdit ? 'Modifica los datos del convenio seleccionado.' : 'Registra un nuevo convenio de vinculación con la sociedad.'}
        </p>
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
                      : 'border-line text-ink-muted'
                }`}
              >
                {step > s.num ? <Check size={14} /> : s.num}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === s.num ? 'text-ink' : 'text-ink-muted'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${step > s.num ? 'bg-emerald-600' : 'bg-line'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white border border-line rounded-card shadow-xs p-6 space-y-5">
        {step === 1 && (
          <>
            <div className="flex items-center gap-2">
              <Hash size={16} className="text-emerald-600" />
              <h2 className="text-lg font-semibold text-ink">Información general</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-ink-muted mb-1.5 flex items-center gap-1.5">
                  <Hash size={11} /> Código del convenio
                </label>
                {isEdit ? (
                  <>
                    <div className="flex items-center gap-2 h-[38px] px-3 border border-line rounded-btn bg-bg-soft">
                      <span className="font-mono text-sm font-semibold text-ink">{form.codigo || '—'}</span>
                    </div>
                    <p className="text-[11px] text-ink-light mt-1">El código no se puede modificar una vez creado.</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 h-[38px] px-3 border border-line rounded-btn bg-gradient-to-r from-emerald-50/60 to-white">
                        <Sparkles size={12} className="text-emerald-600" />
                        <span className="font-mono text-sm font-semibold text-ink">
                          {loadingPreview ? (
                            <span className="inline-block w-24 h-3 bg-bg-soft rounded animate-pulse" />
                          ) : (
                            previewCodigo || 'CONV-AAAA-NNN'
                          )}
                        </span>
                        <span className="ml-auto inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/60 tracking-wider">
                          Auto
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={cargarPreviewCodigo}
                        disabled={loadingPreview}
                        className="h-[38px] w-[38px] inline-flex items-center justify-center rounded-btn border border-line bg-white text-ink-muted hover:bg-bg-soft hover:text-ink transition-colors"
                        title="Actualizar preview"
                      >
                        <RefreshCw size={14} className={loadingPreview ? 'animate-spin' : ''} />
                      </button>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-1 inline-flex items-center gap-1">
                      <Sparkles size={10} strokeWidth={2.5} />
                      Se generará automáticamente al guardar con el formato <span className="font-mono font-semibold">CONV-AAAA-NNN</span>.
                    </p>
                  </>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">Tipo *</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(TIPO_CONVENIO_LABELS) as TipoConvenio[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update('tipo', t)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                        form.tipo === t
                          ? TIPO_CONVENIO_COLORS[t] + ' border-transparent'
                          : 'bg-white text-ink-muted border-line hover:border-line-strong'
                      }`}
                    >
                      {TIPO_CONVENIO_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Institución *</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light pointer-events-none" />
                  <select
                    value={form.institucion}
                    onChange={(e) => update('institucion', e.target.value)}
                    className={`${inputCls('institucion')} pl-9 appearance-none bg-white`}
                  >
                    <option value="">Seleccionar institución...</option>
                    {instituciones.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nombre}{i.sigla ? ` (${i.sigla})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewInstitucion(true)}
                  className="inline-flex items-center gap-1.5 h-[38px] px-3 text-sm font-medium rounded-btn border border-line bg-white text-ink hover:bg-bg-soft transition-colors shrink-0"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  Nueva institución
                </button>
              </div>
              {errors.institucion && <p className="text-xs text-rose-500 mt-1">{errors.institucion}</p>}
              {institucionSeleccionada && (
                <p className="text-[11px] text-emerald-600 mt-1.5 inline-flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  {institucionSeleccionada.activa ? 'Institución activa' : 'Institución inactiva'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Entidad contraparte *</label>
              <input
                value={form.entidad_contraparte}
                onChange={(e) => update('entidad_contraparte', e.target.value)}
                className={inputCls('entidad_contraparte')}
                placeholder="Nombre específico del área o departamento firmante"
                maxLength={255}
              />
              {errors.entidad_contraparte && <p className="text-xs text-rose-500 mt-1">{errors.entidad_contraparte}</p>}
              <p className="text-[11px] text-ink-light mt-1">{form.entidad_contraparte.length}/255 caracteres</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Objeto *</label>
              <textarea
                value={form.objeto}
                onChange={(e) => update('objeto', e.target.value)}
                rows={3}
                className={`${inputCls('objeto')} resize-none`}
                placeholder="Describe el propósito del convenio..."
              />
              {errors.objeto && <p className="text-xs text-rose-500 mt-1">{errors.objeto}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => update('descripcion', e.target.value)}
                rows={3}
                className={`${inputCls('descripcion')} resize-none`}
                placeholder="Información adicional relevante..."
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-emerald-600" />
              <h2 className="text-lg font-semibold text-ink">Vigencia y responsables</h2>
            </div>

            <div>
              <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider -mb-1">Fechas</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <FileSignature size={12} /> Fecha de suscripción *
                  </span>
                </label>
                <input
                  type="date"
                  value={form.fecha_firma}
                  onChange={(e) => update('fecha_firma', e.target.value)}
                  className={inputCls('fecha_firma')}
                />
                {errors.fecha_firma && <p className="text-xs text-rose-500 mt-1">{errors.fecha_firma}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={12} /> Fecha de inicio *
                  </span>
                </label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => update('fecha_inicio', e.target.value)}
                  className={inputCls('fecha_inicio')}
                />
                {errors.fecha_inicio && <p className="text-xs text-rose-500 mt-1">{errors.fecha_inicio}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={12} /> Fecha de vencimiento *
                  </span>
                </label>
                <input
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => update('fecha_fin', e.target.value)}
                  min={form.fecha_inicio || undefined}
                  className={inputCls('fecha_fin')}
                />
                {errors.fecha_fin && <p className="text-xs text-rose-500 mt-1">{errors.fecha_fin}</p>}
              </div>
            </div>

            <div className="-mt-1">
              <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Responsabilidad UNL</h3>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <User size={12} /> Responsable UNL *
                </span>
              </label>
              <select
                value={form.responsable}
                onChange={(e) => update('responsable', e.target.value)}
                className={inputCls('responsable')}
              >
                <option value="">Seleccionar coordinador...</option>
                {coordinadores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.user_first_name} {c.user_last_name}
                  </option>
                ))}
              </select>
              {errors.responsable && <p className="text-xs text-rose-500 mt-1">{errors.responsable}</p>}
              {responsableSeleccionado && (
                <p className="text-[11px] text-ink-muted mt-1.5 inline-flex items-center gap-1">
                  <User size={11} />
                  {responsableSeleccionado.user_email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Observaciones</label>
              <textarea
                value={form.observaciones}
                onChange={(e) => update('observaciones', e.target.value)}
                rows={3}
                className={`${inputCls('observaciones')} resize-none`}
                placeholder="Notas internas, condiciones especiales, etc."
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex items-center gap-2">
              <ClipboardCheck size={16} className="text-emerald-600" />
              <h2 className="text-lg font-semibold text-ink">Revisión y confirmación</h2>
            </div>

            <div className="p-5 bg-bg-soft border-l-4 border-l-emerald-600 space-y-4">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <FileSignature size={14} /> Resumen del convenio
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <SummaryField label="Código">
                  {isEdit ? (
                    <span className="font-mono text-xs">{form.codigo || '—'}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles size={11} className="text-emerald-600" />
                      <span className="font-mono text-xs font-semibold text-emerald-700">
                        {previewCodigo || 'Se generará al guardar'}
                      </span>
                    </span>
                  )}
                </SummaryField>
                <SummaryField label="Tipo">
                  <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md ${TIPO_CONVENIO_COLORS[form.tipo] || 'bg-bg-muted'}`}>
                    {TIPO_CONVENIO_LABELS[form.tipo]}
                  </span>
                </SummaryField>
                <SummaryField label="Institución">
                  {institucionSeleccionada ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 size={12} className="text-emerald-600" />
                      {institucionSeleccionada.nombre}
                      {institucionSeleccionada.sigla && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-line text-ink-muted">
                          {institucionSeleccionada.sigla}
                        </span>
                      )}
                    </span>
                  ) : '—'}
                </SummaryField>
                <SummaryField label="Entidad contraparte">
                  {form.entidad_contraparte || '—'}
                </SummaryField>
                <SummaryField label="Responsable UNL">
                  {responsableSeleccionado
                    ? `${responsableSeleccionado.user_first_name} ${responsableSeleccionado.user_last_name}`
                    : '—'}
                </SummaryField>
                <SummaryField label="Objeto" className="col-span-2">
                  <span className="line-clamp-3">{form.objeto || '—'}</span>
                </SummaryField>
                <SummaryField label="Suscripción">{form.fecha_firma || '—'}</SummaryField>
                <SummaryField label="Inicio">{form.fecha_inicio || '—'}</SummaryField>
                <SummaryField label="Vencimiento">{form.fecha_fin || '—'}</SummaryField>
              </div>
            </div>

            {/* Proyectos a vincular */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                    <Link2 size={14} /> Proyectos a vincular
                  </h3>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Opcional. Selecciona los proyectos que se asociarán a este convenio.
                  </p>
                </div>
                {form.proyectos.length > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 text-2xs font-bold rounded-full bg-emerald-100 text-emerald-700">
                    {form.proyectos.length} seleccionado{form.proyectos.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>

              <ProyectoMultiSelect
                proyectos={proyectosDisponibles}
                selected={form.proyectos}
                onChange={(ids) => update('proyectos', ids)}
                loading={loadingProyectos}
              />
            </div>

            <label className="flex items-start gap-3 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirm}
                onChange={(e) => setConfirm(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-emerald-600"
              />
              <span className="text-sm text-ink">Confirmo que los datos ingresados son correctos *</span>
            </label>
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={step === 1}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-btn border border-line bg-white text-ink hover:bg-bg-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft size={14} />
          Anterior
        </button>
        <div className="flex items-center gap-3">
          {step < 3 ? (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-btn bg-ink text-white hover:bg-ink/90 btn-glow transition-colors"
            >
              Siguiente
              <ArrowRight size={14} />
            </button>
          ) : (
            <>
              <button
                onClick={() => handleGuardar(false)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
              >
                Guardar convenio
              </button>
              <button
                onClick={() => handleGuardar(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-btn bg-ink text-white hover:bg-ink/90 disabled:opacity-40 transition-colors"
              >
                Guardar y enviar a revisión
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal: Nueva institución (inline) */}
      <Modal
        open={showNewInstitucion}
        onClose={() => { setShowNewInstitucion(false); setNewInstErrors({}) }}
        title="Nueva institución"
        subtitle="Crea una nueva institución para asociar al convenio."
        icon={<Building2 size={20} className="text-emerald-600" />}
        size="md"
        footer={
          <>
            <button
              onClick={() => { setShowNewInstitucion(false); setNewInstErrors({}) }}
              className="px-4 py-2 text-sm font-medium rounded-btn text-ink bg-white border border-line hover:bg-bg-soft transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateInstitucion}
              disabled={newInstSaving}
              className="px-4 py-2 text-sm font-semibold rounded-btn text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 transition-colors"
            >
              {newInstSaving ? 'Creando...' : 'Crear y seleccionar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Nombre *</label>
            <input
              value={newInstForm.nombre}
              onChange={(e) => {
                setNewInstForm({ ...newInstForm, nombre: e.target.value })
                setNewInstErrors((p) => { const n = { ...p }; delete n.nombre; return n })
              }}
              className={inputCls('nombre' as keyof FormState)}
              placeholder="Ej: Universidad Nacional de Loja"
              maxLength={255}
            />
            {newInstErrors.nombre && <p className="text-xs text-rose-500 mt-1">{newInstErrors.nombre}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Sigla</label>
            <input
              value={newInstForm.sigla}
              onChange={(e) => setNewInstForm({ ...newInstForm, sigla: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-line text-sm rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
              placeholder="Ej: UNL"
              maxLength={50}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Email</label>
              <input
                type="email"
                value={newInstForm.email}
                onChange={(e) => {
                  setNewInstForm({ ...newInstForm, email: e.target.value })
                  setNewInstErrors((p) => { const n = { ...p }; delete n.email; return n })
                }}
                className={inputCls('email' as keyof FormState)}
                placeholder="contacto@ejemplo.com"
              />
              {newInstErrors.email && <p className="text-xs text-rose-500 mt-1">{newInstErrors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Teléfono</label>
              <input
                value={newInstForm.telefono}
                onChange={(e) => setNewInstForm({ ...newInstForm, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-line text-sm rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                placeholder="+593 ..."
                maxLength={20}
              />
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200/70 rounded-lg">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700">
              La institución se creará como activa y quedará seleccionada automáticamente.
            </p>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={modalAction !== null}
        titulo={modalAction === 'submit' ? '¿Enviar a revisión?' : '¿Guardar convenio?'}
        mensaje={modalAction === 'submit'
          ? 'El convenio se guardará y enviará a revisión. ¿Estás seguro?'
          : '¿Estás seguro de guardar el convenio?'}
        onConfirm={executeAction}
        onCancel={() => setModalAction(null)}
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTES
   ═══════════════════════════════════════════════════════════════ */

function SummaryField({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-0.5">{label}</p>
      <p className="text-[13px] text-ink font-medium">{children}</p>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MULTI-SELECT DE PROYECTOS
   ───────────────────────────────────────────── */
function ProyectoMultiSelect({
  proyectos, selected, onChange, loading,
}: {
  proyectos: Proyecto[]
  selected: number[]
  onChange: (ids: number[]) => void
  loading: boolean
}) {
  const [query, setQuery] = useState('')
  const [showOnlySelected, setShowOnlySelected] = useState(false)

  const filtered = proyectos.filter((p) => {
    if (showOnlySelected && !selected.includes(p.id)) return false
    if (query) {
      const q = query.toLowerCase()
      const matches = p.codigo.toLowerCase().includes(q) || p.titulo.toLowerCase().includes(q)
      if (!matches) return false
    }
    return true
  })

  const toggle = (id: number) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  return (
    <div className="border border-line rounded-card overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line bg-bg-soft/40">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código o título..."
            className="w-full h-8 pl-8 pr-3 border border-line rounded-btn bg-white text-xs text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowOnlySelected(!showOnlySelected)}
          className={`inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-btn border transition-colors ${
            showOnlySelected
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-ink-muted border-line hover:bg-bg-soft'
          }`}
        >
          {showOnlySelected ? 'Mostrar todos' : 'Solo seleccionados'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-[3px] border-line border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <FolderKanban size={28} className="text-ink-light mb-2 opacity-40" />
          <p className="text-xs font-medium text-ink">
            {query ? 'No se encontraron proyectos' : 'No hay proyectos disponibles'}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            Solo aparecen proyectos en estado Aprobado o En ejecución.
          </p>
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto divide-y divide-line/60">
          {filtered.map((p) => {
            const isSelected = selected.includes(p.id)
            return (
              <label
                key={p.id}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  isSelected ? 'bg-emerald-50/50' : 'hover:bg-bg-soft/40'
                }`}
              >
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(p.id)}
                    className="h-4 w-4 accent-emerald-600 cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-medium bg-bg-soft text-ink-muted rounded border border-line">
                      <Hash size={9} className="text-ink-light" />
                      {p.codigo}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                        <Check size={10} strokeWidth={2.5} /> Seleccionado
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] font-medium text-ink truncate mt-0.5" title={p.titulo}>
                    {p.titulo}
                  </p>
                  {p.responsable_nombre && (
                    <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                      Responsable: {p.responsable_nombre}
                    </p>
                  )}
                </div>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
