import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Check, Image as ImageIcon, X,
  Info, ExternalLink, Plus, Trash2, Upload, FileText, Users, Target,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { proyectosApi, beneficiariosApi, alineacionesApi, anexosApi } from '@/api/proyectos'
import { carrerasApi, usuariosApi } from '@/api/usuarios'
import { useAuthStore } from '@/store/authStore'
import { ConfirmModal } from '@/components/ui'
import type { TipoProyecto, PrioridadProyecto, Beneficiario, AlineacionEstrategica } from '@/types/proyectos'
import type { Carrera, Usuario } from '@/types/usuarios'

const STEPS = [
  { num: 1, label: 'Información general' },
  { num: 2, label: 'Alineación estratégica' },
  { num: 3, label: 'Diagnóstico' },
  { num: 4, label: 'Planificación' },
  { num: 5, label: 'Responsables' },
  { num: 6, label: 'Anexos y confirmación' },
]

const TOTAL_STEPS = STEPS.length

const ALINEACION_VACIA = {
  eje: '',
  objetivo_estrategico: '',
  programa: '',
  plan: '',
  descripcion: '',
}

const BENEFICIARIO_VACIO = {
  tipo: 'DIRECTO' as 'DIRECTO' | 'INDIRECTO',
  nombre: '',
  cantidad_estimada: '',
  ubicacion: '',
  observaciones: '',
}

const ANEXO_MAX_COUNT = 5
const ANEXO_MAX_SIZE = 10 * 1024 * 1024
const ANEXO_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg', 'image/png', 'image/webp',
]

interface BeneficiarioItem extends Omit<Beneficiario, 'id' | 'proyecto' | 'cantidad_estimada' | 'creado_en' | 'actualizado_en' | 'descripcion'> {
  id?: number
  _key: string
  cantidad_estimada: string
}

interface AlineacionItem extends Omit<AlineacionEstrategica, 'id' | 'proyecto' | 'creado_en' | 'actualizado_en'> {
  id?: number
  _key: string
}

interface AnexoFile {
  _key: string
  file: File
  name: string
  size: number
}

interface FormState {
  titulo: string
  tipo: TipoProyecto
  prioridad: PrioridadProyecto
  carrera: string
  linea_intervencion: string
  resumen: string
  descripcion: string
  instituciones_participantes: string
  problema: string
  justificacion: string
  objetivo_general: string
  resultados_esperados: string
  beneficiarios: BeneficiarioItem[]
  alineaciones: AlineacionItem[]
  fecha_inicio: string
  fecha_fin_planificada: string
  presupuesto_aprobado: string
  observaciones: string
  estrategias_ejecucion: string
  responsable: string
  coordinador_academico: string
  anexos: AnexoFile[]
  confirm: boolean
}

const EMPTY_FORM: FormState = {
  titulo: '',
  tipo: 'VINCULACION',
  prioridad: 'MEDIA',
  carrera: '',
  linea_intervencion: '',
  resumen: '',
  descripcion: '',
  instituciones_participantes: '',
  problema: '',
  justificacion: '',
  objetivo_general: '',
  resultados_esperados: '',
  beneficiarios: [],
  alineaciones: [],
  fecha_inicio: '',
  fecha_fin_planificada: '',
  presupuesto_aprobado: '',
  observaciones: '',
  estrategias_ejecucion: '',
  responsable: '',
  coordinador_academico: '',
  anexos: [],
  confirm: false,
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export default function ProyectoFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isEdit = Boolean(id)

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [confirmAck, setConfirmAck] = useState(false)

  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [docentes, setDocentes] = useState<Usuario[]>([])
  const [coordinadores, setCoordinadores] = useState<Usuario[]>([])
  const [modalAction, setModalAction] = useState<'draft' | 'submit' | null>(null)
  const [loadingData, setLoadingData] = useState(isEdit)
  const [proyectoEstado, setProyectoEstado] = useState<string>('')

  const [imagenPortada, setImagenPortada] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [imagenError, setImagenError] = useState('')
  const [clearImagen, setClearImagen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const anexoInputRef = useRef<HTMLInputElement>(null)
  const [anexoError, setAnexoError] = useState('')

  const [beneficiarioEditIdx, setBeneficiarioEditIdx] = useState<number | null>(null)
  const [beneficiarioDraft, setBeneficiarioDraft] = useState(BENEFICIARIO_VACIO)
  const [beneficiarioDraftError, setBeneficiarioDraftError] = useState('')

  const [alineacionEditIdx, setAlineacionEditIdx] = useState<number | null>(null)
  const [alineacionDraft, setAlineacionDraft] = useState(ALINEACION_VACIA)
  const [alineacionDraftError, setAlineacionDraftError] = useState('')

  const basePath = `/${(user?.rol || 'estudiante').toLowerCase()}/proyectos`
  const formatosPath = `/${(user?.rol || 'estudiante').toLowerCase()}/formatos`

  useEffect(() => {
    carrerasApi.list({ page_size: '100' }).then(({ data }) => setCarreras(data.results))
    usuariosApi.list({ rol: 'DOCENTE', page_size: '100' }).then(({ data }) => setDocentes(data.results))
    usuariosApi.list({ rol: 'COORDINADOR', page_size: '100' }).then(({ data }) => setCoordinadores(data.results))
  }, [])

  const extractId = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object' && value !== null && 'id' in value) {
      return String((value as { id: unknown }).id)
    }
    return String(value)
  }

  useEffect(() => {
    if (!isEdit || !id) return
    setLoadingData(true)
    proyectosApi.get(Number(id)).then(({ data }) => {
      if (user?.rol !== 'ADMIN' && data.estado !== 'BORRADOR') {
        toast.error('Solo se pueden editar proyectos en estado Borrador')
        navigate(basePath)
        return
      }
      const p = data as unknown as {
        titulo: string; tipo: TipoProyecto; prioridad: PrioridadProyecto
        carrera: number | null | { id: number }
        linea_intervencion: string; resumen: string; descripcion: string
        problema: string; justificacion: string; objetivo_general: string
        resultados_esperados: string
        fecha_inicio: string | null; fecha_fin_planificada: string | null
        presupuesto_aprobado: string; observaciones: string
        estrategias_ejecucion: string
        responsable: number | null | { id: number }
        coordinador_academico: number | null | { id: number }
        imagen_portada: string | null; estado: string
        beneficiarios?: Beneficiario[]
        alineaciones?: AlineacionEstrategica[]
      }
      setProyectoEstado(p.estado || '')

      const institucionesTexto = (() => {
        const m = (p.descripcion || '').match(/\[Instituciones participantes\]\s*([\s\S]*?)(?:\n\n|$)/)
        return m ? m[1]!.trim() : ''
      })()
      const descripcionSinInstituciones = (p.descripcion || '').replace(
        /\[Instituciones participantes\][\s\S]*?(?=\n\n|$)/,
        '',
      ).trim()

      setForm({
        titulo: p.titulo || '',
        tipo: p.tipo || 'VINCULACION',
        prioridad: p.prioridad || 'MEDIA',
        carrera: extractId(p.carrera),
        linea_intervencion: p.linea_intervencion || '',
        resumen: p.resumen || '',
        descripcion: descripcionSinInstituciones,
        instituciones_participantes: institucionesTexto,
        problema: p.problema || '',
        justificacion: p.justificacion || '',
        objetivo_general: p.objetivo_general || '',
        resultados_esperados: p.resultados_esperados || '',
        beneficiarios: (p.beneficiarios || []).map((b) => ({
          id: b.id,
          _key: uid(),
          tipo: b.tipo,
          nombre: b.nombre,
          cantidad_estimada: String(b.cantidad_estimada || ''),
          ubicacion: b.ubicacion,
          observaciones: b.observaciones,
        })),
        alineaciones: (p.alineaciones || []).map((a) => ({
          id: a.id,
          _key: uid(),
          eje: a.eje,
          objetivo_estrategico: a.objetivo_estrategico,
          programa: a.programa,
          plan: a.plan,
          descripcion: a.descripcion,
        })),
        fecha_inicio: p.fecha_inicio || '',
        fecha_fin_planificada: p.fecha_fin_planificada || '',
        presupuesto_aprobado: p.presupuesto_aprobado || '',
        observaciones: p.observaciones || '',
        estrategias_ejecucion: (p as { estrategias_ejecucion?: string }).estrategias_ejecucion || '',
        responsable: extractId(p.responsable),
        coordinador_academico: extractId(p.coordinador_academico),
        anexos: [],
        confirm: false,
      })
      if (p.imagen_portada) {
        setImagenPreview(p.imagen_portada)
        setClearImagen(false)
      } else {
        setImagenPreview(null)
        setClearImagen(false)
      }
    }).catch(() => {
      toast.error('Error al cargar el proyecto')
      navigate(basePath)
    }).finally(() => setLoadingData(false))
  }, [id, isEdit])

  const update = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value as never }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {}

    if (s === 1) {
      if (!form.titulo.trim()) e.titulo = 'Requerido'
      if (!form.carrera) e.carrera = 'Selecciona una carrera'
      if (!form.resumen.trim()) e.resumen = 'Requerido'
    }

    if (s === 2) {
      if (form.alineaciones.length === 0) {
        e.alineaciones = 'Agrega al menos una alineación estratégica'
      } else {
        const idxInvalido = form.alineaciones.findIndex(
          (a) => !a.eje.trim() || !a.objetivo_estrategico.trim(),
        )
        if (idxInvalido !== -1) {
          e[`alineaciones.${idxInvalido}`] = 'Completa eje y objetivo estratégico'
        }
      }
    }

    if (s === 3) {
      if (!form.problema.trim()) e.problema = 'Requerido'
      if (!form.justificacion.trim()) e.justificacion = 'Requerido'
      if (!form.objetivo_general.trim()) e.objetivo_general = 'Requerido'
      if (form.beneficiarios.length === 0) {
        e.beneficiarios = 'Agrega al menos un beneficiario'
      } else {
        const sinDirecto = !form.beneficiarios.some((b) => b.tipo === 'DIRECTO')
        if (sinDirecto) e.beneficiarios = 'Debe existir al menos un beneficiario directo'
        const idxInvalido = form.beneficiarios.findIndex((b) => !b.nombre.trim())
        if (idxInvalido !== -1) e[`beneficiarios.${idxInvalido}.nombre`] = 'Requerido'
      }
    }

    if (s === 4) {
      if (!form.fecha_inicio) e.fecha_inicio = 'Requerido'
      if (!form.fecha_fin_planificada) e.fecha_fin_planificada = 'Requerido'
      if (form.fecha_inicio && form.fecha_fin_planificada && form.fecha_fin_planificada < form.fecha_inicio) {
        e.fecha_fin_planificada = 'Debe ser posterior a la fecha de inicio'
      }
      if (!form.estrategias_ejecucion.trim()) e.estrategias_ejecucion = 'Requerido'
    }

    if (s === 5) {
      if (!form.responsable) e.responsable = 'Requerido'
    }

    if (s === 6) {
      if (!confirmAck) {
        e.confirm = 'Debes confirmar antes de continuar'
        toast.error('Debes confirmar que los datos son correctos')
      }
    }

    setErrors(e)
    if (Object.keys(e).length > 0) {
      toast.error('Completa los campos obligatorios antes de continuar')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(TOTAL_STEPS, s + 1))
  }
  const handlePrev = () => setStep((s) => Math.max(1, s - 1))
  const goToStep = (s: number) => {
    if (s < step) { setStep(s); return }
    let valid = true
    for (let i = step; i < s; i++) {
      if (!validateStep(i)) { valid = false; break }
    }
    if (valid) setStep(s)
  }

  const buildPayload = () => {
    const { carrera, responsable, coordinador_academico, presupuesto_aprobado,
      instituciones_participantes, descripcion, ...rest } = form
    void instituciones_participantes
    const formData = new FormData()

    const descripcionFinal = instituciones_participantes.trim()
      ? `${(descripcion || '').trim()}\n\n[Instituciones participantes]\n${instituciones_participantes.trim()}`.trim()
      : (descripcion || '')

    const payload: Record<string, string | number | boolean | null> = {
      titulo: form.titulo.trim(),
      tipo: form.tipo,
      prioridad: form.prioridad,
      linea_intervencion: form.linea_intervencion.trim(),
      resumen: form.resumen.trim(),
      descripcion: descripcionFinal,
      problema: form.problema.trim(),
      justificacion: form.justificacion.trim(),
      objetivo_general: form.objetivo_general.trim(),
      resultados_esperados: form.resultados_esperados.trim(),
      fecha_inicio: form.fecha_inicio || '',
      fecha_fin_planificada: form.fecha_fin_planificada || '',
      estrategias_ejecucion: form.estrategias_ejecucion.trim(),
      observaciones: form.observaciones.trim(),
      presupuesto_aprobado: presupuesto_aprobado ? presupuesto_aprobado : '0',
    }
    if (carrera) payload.carrera_id = Number(carrera)
    if (responsable) payload.responsable_id = Number(responsable)
    if (coordinador_academico) payload.coordinador_academico_id = Number(coordinador_academico)
    if (clearImagen) payload.clear_imagen_portada = true

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value))
      }
    })

    if (imagenPortada) {
      formData.append('imagen_portada', imagenPortada)
    }

    void rest
    return formData
  }

  const guardarHijos = async (proyectoId: number) => {
    const errores: string[] = []

    const alineacionesCreadas = await Promise.all(
      form.alineaciones.map(async (a) => {
        try {
          await alineacionesApi.create({
            proyecto: proyectoId,
            eje: a.eje.trim(),
            objetivo_estrategico: a.objetivo_estrategico.trim(),
            programa: a.programa.trim(),
            plan: a.plan.trim(),
            descripcion: a.descripcion.trim(),
          })
        } catch {
          errores.push(`alineación "${a.eje || 'sin eje'}"`)
        }
      }),
    )
    void alineacionesCreadas

    await Promise.all(
      form.beneficiarios.map(async (b) => {
        try {
          await beneficiariosApi.create({
            proyecto: proyectoId,
            tipo: b.tipo,
            nombre: b.nombre.trim(),
            cantidad_estimada: b.cantidad_estimada ? Number(b.cantidad_estimada) : 0,
            ubicacion: b.ubicacion.trim(),
            observaciones: b.observaciones.trim(),
          })
        } catch {
          errores.push(`beneficiario "${b.nombre || 'sin nombre'}"`)
        }
      }),
    )

    await Promise.all(
      form.anexos.map(async (a, idx) => {
        try {
          const fd = new FormData()
          fd.append('proyecto', String(proyectoId))
          fd.append('nombre', a.name)
          fd.append('archivo', a.file)
          fd.append('tipo', 'OTRO')
          fd.append('descripcion', '')
          fd.append('orden', String(idx))
          await anexosApi.create(fd)
        } catch {
          errores.push(`anexo "${a.name}"`)
        }
      }),
    )

    if (errores.length > 0) {
      toast.error(`Proyecto guardado, pero hubo errores en: ${errores.join(', ')}`)
    }
  }

  const eliminarHijosPrevios = async (proyectoId: number) => {
    try {
      const { data: al } = await alineacionesApi.list({ proyecto: String(proyectoId), page_size: '100' })
      await Promise.all(al.results.map((a) => alineacionesApi.delete(a.id).catch(() => null)))
    } catch { /* silencioso */ }
    try {
      const { data: be } = await beneficiariosApi.list({ proyecto: String(proyectoId), page_size: '100' })
      await Promise.all(be.results.map((b) => beneficiariosApi.delete(b.id).catch(() => null)))
    } catch { /* silencioso */ }
    try {
      const { data: ax } = await anexosApi.list({ proyecto: String(proyectoId), page_size: '100' })
      await Promise.all(ax.results.map((a) => anexosApi.delete(a.id).catch(() => null)))
    } catch { /* silencioso */ }
  }

  const handleSaveDraft = () => {
    if (!validateStep(TOTAL_STEPS)) return
    setModalAction('draft')
  }

  const handleSaveAndSubmit = () => {
    if (!validateStep(TOTAL_STEPS)) return
    if (isEdit && proyectoEstado && proyectoEstado !== 'BORRADOR') {
      toast.error('Solo se pueden enviar a revisión los proyectos en estado Borrador')
      return
    }
    setModalAction('submit')
  }

  const executeAction = async () => {
    setSaving(true)
    try {
      const formData = buildPayload()
      let proyectoId: number

      if (isEdit && id) {
        await proyectosApi.updateWithFormData(Number(id), formData)
        proyectoId = Number(id)
        await eliminarHijosPrevios(proyectoId)
        await guardarHijos(proyectoId)
        toast.success('Proyecto actualizado')
      } else {
        formData.append('estado', 'BORRADOR')
        const { data } = await proyectosApi.createWithFormData(formData)
        proyectoId = (data as unknown as { id: number }).id
        await guardarHijos(proyectoId)
        toast.success('Proyecto guardado como borrador')
      }

      if (modalAction === 'submit') {
        try {
          await proyectosApi.enviarRevision(proyectoId)
          toast.success('Proyecto enviado a revisión')
        } catch {
          toast.error('Proyecto guardado, pero no se pudo enviar a revisión')
        }
      }

      navigate(basePath)
    } catch (err) {
      const e = err as { response?: { data?: unknown }; message?: string }
      console.error('Error en executeAction:', e?.response?.data)
      const data = e?.response?.data
      const msg = (data as { message?: string; detail?: string })?.message
        || (data as { detail?: string })?.detail
        || e?.message
      if (msg) {
        toast.error(msg)
      } else if (data && typeof data === 'object') {
        const firstError = Object.values(data).flat()[0]
        toast.error(firstError ? String(firstError) : 'Error al guardar')
      } else {
        toast.error('Error al guardar')
      }
    } finally {
      setSaving(false)
      setModalAction(null)
    }
  }

  const abrirEditorBeneficiario = (idx: number | null) => {
    if (idx === null) {
      setBeneficiarioDraft({ ...BENEFICIARIO_VACIO })
    } else {
      const b = form.beneficiarios[idx]!
      setBeneficiarioDraft({
        tipo: b.tipo,
        nombre: b.nombre,
        cantidad_estimada: b.cantidad_estimada,
        ubicacion: b.ubicacion,
        observaciones: b.observaciones,
      })
    }
    setBeneficiarioDraftError('')
    setBeneficiarioEditIdx(idx)
  }

  const guardarBeneficiario = () => {
    if (!beneficiarioDraft.nombre.trim()) {
      setBeneficiarioDraftError('Ingresa el nombre o descripción del grupo')
      return
    }
    setForm((prev) => {
      const lista = [...prev.beneficiarios]
      if (beneficiarioEditIdx === null) {
        lista.push({ ...beneficiarioDraft, _key: uid() })
      } else {
        lista[beneficiarioEditIdx] = { ...lista[beneficiarioEditIdx]!, ...beneficiarioDraft }
      }
      return { ...prev, beneficiarios: lista }
    })
    setBeneficiarioEditIdx(null)
    setBeneficiarioDraft({ ...BENEFICIARIO_VACIO })
    setBeneficiarioDraftError('')
    if (errors.beneficiarios) {
      setErrors((prev) => { const { beneficiarios: _b, ...rest } = prev; return rest })
    }
  }

  const eliminarBeneficiario = (idx: number) => {
    setForm((prev) => ({ ...prev, beneficiarios: prev.beneficiarios.filter((_, i) => i !== idx) }))
  }

  const abrirEditorAlineacion = (idx: number | null) => {
    if (idx === null) {
      setAlineacionDraft({ ...ALINEACION_VACIA })
    } else {
      const a = form.alineaciones[idx]!
      setAlineacionDraft({
        eje: a.eje,
        objetivo_estrategico: a.objetivo_estrategico,
        programa: a.programa,
        plan: a.plan,
        descripcion: a.descripcion,
      })
    }
    setAlineacionDraftError('')
    setAlineacionEditIdx(idx)
  }

  const guardarAlineacion = () => {
    if (!alineacionDraft.eje.trim() || !alineacionDraft.objetivo_estrategico.trim()) {
      setAlineacionDraftError('Completa eje y objetivo estratégico')
      return
    }
    setForm((prev) => {
      const lista = [...prev.alineaciones]
      if (alineacionEditIdx === null) {
        lista.push({ ...alineacionDraft, _key: uid() })
      } else {
        lista[alineacionEditIdx] = { ...lista[alineacionEditIdx]!, ...alineacionDraft }
      }
      return { ...prev, alineaciones: lista }
    })
    setAlineacionEditIdx(null)
    setAlineacionDraft({ ...ALINEACION_VACIA })
    setAlineacionDraftError('')
    if (errors.alineaciones) {
      setErrors((prev) => { const { alineaciones: _a, ...rest } = prev; return rest })
    }
  }

  const eliminarAlineacion = (idx: number) => {
    setForm((prev) => ({ ...prev, alineaciones: prev.alineaciones.filter((_, i) => i !== idx) }))
  }

  const seleccionarAnexos = (files: FileList | null) => {
    if (!files || files.length === 0) return
    setAnexoError('')
    const nuevos: AnexoFile[] = []
    const restantes = ANEXO_MAX_COUNT - form.anexos.length
    if (restantes <= 0) {
      setAnexoError(`Máximo ${ANEXO_MAX_COUNT} archivos`)
      return
    }
    const aceptados = Array.from(files).slice(0, restantes)
    for (const f of aceptados) {
      if (!ANEXO_MIMES.includes(f.type)) {
        setAnexoError(`"${f.name}" no es un formato permitido`)
        continue
      }
      if (f.size > ANEXO_MAX_SIZE) {
        setAnexoError(`"${f.name}" supera los 10MB`)
        continue
      }
      nuevos.push({ _key: uid(), file: f, name: f.name, size: f.size })
    }
    if (nuevos.length > 0) {
      setForm((prev) => ({ ...prev, anexos: [...prev.anexos, ...nuevos] }))
    }
  }

  const eliminarAnexo = (key: string) => {
    setForm((prev) => ({ ...prev, anexos: prev.anexos.filter((a) => a._key !== key) }))
  }

  const formatBytes = (n: number) => {
    if (n < 1024) return `${n} B`
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
    return `${(n / 1024 / 1024).toFixed(2)} MB`
  }

  const inputCls = (field: keyof FormState) =>
    `w-full px-3 py-2 border text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-offset-0 transition-all ${
      errors[field]
        ? 'border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
    }`

  const selectCls = (field?: keyof FormState) =>
    `w-full px-3 py-2 border text-sm bg-white rounded-none focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
      field && errors[field] ? 'border-red-500' : 'border-gray-300'
    }`

  const textareaCls = (field: keyof FormState) =>
    `w-full px-3 py-2 border text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-offset-0 transition-all resize-none ${
      errors[field]
        ? 'border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
    }`

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-[3px] border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate(basePath)}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} />
          Volver a proyectos
        </button>
        <h1 className="mt-3 text-3xl font-bold text-ink tracking-tight">
          {isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}
        </h1>
        <p className="mt-1 text-sm text-ink-muted max-w-2xl">
          Registra el proyecto siguiendo la metodología de marco lógico establecida por la
          Coordinación de Vinculación con la Sociedad de la UNL.
        </p>
      </div>

      <div
        className="flex items-start gap-3 p-4 border-l-4"
        style={{ background: '#EFF6FF', borderLeftColor: '#2563EB' }}
      >
        <div
          className="w-8 h-8 flex items-center justify-center flex-shrink-0"
          style={{ background: '#DBEAFE' }}
        >
          <Info size={16} style={{ color: '#2563EB' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ink leading-relaxed">
            Este formulario sigue la <strong>metodología de marco lógico</strong> establecida
            por la Coordinación de Vinculación con la Sociedad de la UNL. Puedes descargar
            la guía metodológica oficial en la sección Formatos.
          </p>
          <button
            type="button"
            onClick={() => navigate(formatosPath)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color: '#2563EB' }}
          >
            Ver Formatos
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => goToStep(s.num)}
              className="flex items-center gap-2 group"
              title={`Ir al paso ${s.num}`}
            >
              <div
                className={`w-8 h-8 flex items-center justify-center text-xs font-semibold border-2 transition-colors rounded-none ${
                  step > s.num
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : step === s.num
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-gray-300 text-ink-muted group-hover:border-emerald-400'
                }`}
              >
                {step > s.num ? <Check size={14} /> : s.num}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === s.num ? 'text-ink' : 'text-ink-muted'}`}>
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${step > s.num ? 'bg-emerald-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white border border-line p-6 space-y-5">
        {step === 1 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-ink">Datos informativos del proyecto</h2>
              <p className="text-xs text-ink-muted mt-1">Información general que identifica al proyecto en el sistema.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo *</label>
                <select value={form.tipo} onChange={(e) => update('tipo', e.target.value)} className={selectCls()}>
                  <option value="VINCULACION">Vinculación</option>
                  <option value="INVESTIGACION">Investigación</option>
                  <option value="EXTENSION">Extensión</option>
                  <option value="MIXTO">Mixto</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Prioridad *</label>
                <select value={form.prioridad} onChange={(e) => update('prioridad', e.target.value)} className={selectCls()}>
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                  <option value="CRITICA">Crítica</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Título *</label>
              <input
                value={form.titulo}
                onChange={(e) => update('titulo', e.target.value)}
                className={inputCls('titulo')}
                placeholder="Título del proyecto"
              />
              {errors.titulo && <p className="text-xs text-red-500 mt-1">{errors.titulo}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Carrera *</label>
              <select
                value={form.carrera}
                onChange={(e) => update('carrera', e.target.value)}
                className={selectCls('carrera')}
              >
                <option value="">Seleccionar...</option>
                {carreras.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              {errors.carrera && <p className="text-xs text-red-500 mt-1">{errors.carrera}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Línea de intervención</label>
              <input
                value={form.linea_intervencion}
                onChange={(e) => update('linea_intervencion', e.target.value)}
                className={inputCls('linea_intervencion')}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Resumen *</label>
              <textarea
                value={form.resumen}
                onChange={(e) => update('resumen', e.target.value)}
                rows={3}
                className={textareaCls('resumen')}
                placeholder="Resumen ejecutivo del proyecto"
              />
              {errors.resumen && <p className="text-xs text-red-500 mt-1">{errors.resumen}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => update('descripcion', e.target.value)}
                rows={4}
                className={textareaCls('descripcion')}
                placeholder="Descripción detallada del proyecto"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Imagen representativa (opcional)</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  if (!file) return
                  setImagenError('')
                  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                    setImagenError('Solo se permiten imágenes JPG, PNG o WebP')
                    if (fileInputRef.current) fileInputRef.current.value = ''
                    return
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    setImagenError('La imagen no debe superar 5MB')
                    if (fileInputRef.current) fileInputRef.current.value = ''
                    return
                  }
                  setImagenPortada(file)
                  setImagenPreview(URL.createObjectURL(file))
                  setClearImagen(false)
                }}
              />
              {!imagenPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                  onDrop={(e) => {
                    e.preventDefault(); e.stopPropagation()
                    const file = e.dataTransfer.files?.[0] || null
                    if (!file) return
                    setImagenError('')
                    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                      setImagenError('Solo se permiten imágenes JPG, PNG o WebP')
                      return
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      setImagenError('La imagen no debe superar 5MB')
                      return
                    }
                    setImagenPortada(file)
                    setImagenPreview(URL.createObjectURL(file))
                    setClearImagen(false)
                  }}
                  className="cursor-pointer text-center transition-colors"
                  style={{ border: '2px dashed #D1D5DB', background: '#F9FAFB', borderRadius: 0, padding: '32px' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#16A34A'; (e.currentTarget as HTMLDivElement).style.background = '#F0FDF4' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#D1D5DB'; (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB' }}
                >
                  <ImageIcon size={32} className="mx-auto text-gray-400 mb-2" />
                  <p style={{ fontSize: '14px', color: '#6B7280' }}>Haz clic o arrastra tu imagen aquí</p>
                  <p style={{ fontSize: '12px', color: '#9CA3AF' }}>JPG, PNG o WebP · Máximo 5MB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <img src={imagenPreview} alt="Preview" className="w-full object-cover" style={{ height: '160px', borderRadius: 0 }} />
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors">
                      <ImageIcon size={14} /> Cambiar imagen
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImagenPortada(null)
                        setImagenPreview(null)
                        setImagenError('')
                        setClearImagen(isEdit)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                    >
                      <X size={14} /> Quitar imagen
                    </button>
                  </div>
                  {imagenPortada && <p style={{ fontSize: '12px', color: '#6B7280' }}>{imagenPortada.name}</p>}
                </div>
              )}
              {imagenError && <p className="text-xs text-red-500 mt-1">{imagenError}</p>}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-ink">Alineación estratégica</h2>
              <p className="text-xs text-ink-muted mt-1">Marco lógico: alineación estratégica</p>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Alineaciones del proyecto</h3>
              <button
                type="button"
                onClick={() => abrirEditorAlineacion(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                style={{ borderRadius: 0 }}
              >
                <Plus size={14} /> Agregar alineación
              </button>
            </div>

            {errors.alineaciones && (
              <p className="text-xs text-red-500">{errors.alineaciones}</p>
            )}

            {form.alineaciones.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-line bg-bg-soft" style={{ borderRadius: 0 }}>
                <Target size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-ink-muted">Aún no has agregado alineaciones estratégicas</p>
                <p className="text-xs text-ink-muted mt-1">Registra al menos una alineación con eje y objetivo estratégico.</p>
              </div>
            ) : (
              <div className="border border-line overflow-hidden" style={{ borderRadius: 0 }}>
                <table className="w-full text-sm">
                  <thead className="bg-bg-soft">
                    <tr>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-ink-muted uppercase">Eje</th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-ink-muted uppercase">Objetivo estratégico</th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-ink-muted uppercase">Plan / Programa</th>
                      <th className="text-right px-3 py-2 text-[11px] font-semibold text-ink-muted uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {form.alineaciones.map((a, i) => {
                      const errorKey = `alineaciones.${i}`
                      const hasError = errors[errorKey]
                      return (
                        <tr key={a._key} className={hasError ? 'bg-red-50/50' : ''}>
                          <td className="px-3 py-2.5 align-top">
                            <p className="text-sm font-medium text-ink">{a.eje}</p>
                          </td>
                          <td className="px-3 py-2.5 align-top">
                            <p className="text-xs text-ink-muted line-clamp-2">{a.objetivo_estrategico}</p>
                          </td>
                          <td className="px-3 py-2.5 align-top">
                            <p className="text-xs text-ink-muted">
                              {[a.plan, a.programa].filter(Boolean).join(' · ') || '—'}
                            </p>
                          </td>
                          <td className="px-3 py-2.5 align-top text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => abrirEditorAlineacion(i)}
                                className="px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                                style={{ borderRadius: 0 }}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => eliminarAlineacion(i)}
                                className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                style={{ borderRadius: 0 }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-4 border-t border-line">
              <h3 className="text-sm font-semibold text-ink">Instituciones participantes</h3>
              <p className="text-xs text-ink-muted mt-1 mb-3">Texto libre: lista las instituciones externas que participan en este proyecto.</p>
              <textarea
                value={form.instituciones_participantes}
                onChange={(e) => update('instituciones_participantes', e.target.value)}
                rows={3}
                className={textareaCls('instituciones_participantes')}
                placeholder={'Ejemplo:\n• GAD Municipal de Loja\n• Fundación Naturaleza y Cultura\n• Ministerio de Salud'}
              />
            </div>

            {alineacionEditIdx !== null && (
              <div className="border border-emerald-300 bg-emerald-50/30 p-5 space-y-3" style={{ borderRadius: 0 }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-ink">
                    {alineacionEditIdx === null ? 'Nueva alineación' : `Editar alineación #${alineacionEditIdx + 1}`}
                  </h4>
                  <button type="button" onClick={() => { setAlineacionEditIdx(null); setAlineacionDraftError('') }} className="text-ink-muted hover:text-ink">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Eje estratégico *</label>
                    <input
                      value={alineacionDraft.eje}
                      onChange={(e) => setAlineacionDraft({ ...alineacionDraft, eje: e.target.value })}
                      className={inputCls('titulo')}
                      placeholder="Ej: Desarrollo social y comunitario"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Objetivo estratégico institucional *</label>
                    <textarea
                      value={alineacionDraft.objetivo_estrategico}
                      onChange={(e) => setAlineacionDraft({ ...alineacionDraft, objetivo_estrategico: e.target.value })}
                      rows={2}
                      className={textareaCls('titulo')}
                      placeholder="Objetivo institucional con el que se alinea el proyecto"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Programa</label>
                    <input
                      value={alineacionDraft.programa}
                      onChange={(e) => setAlineacionDraft({ ...alineacionDraft, programa: e.target.value })}
                      className={inputCls('titulo')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Plan</label>
                    <input
                      value={alineacionDraft.plan}
                      onChange={(e) => setAlineacionDraft({ ...alineacionDraft, plan: e.target.value })}
                      className={inputCls('titulo')}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Descripción de la alineación</label>
                    <textarea
                      value={alineacionDraft.descripcion}
                      onChange={(e) => setAlineacionDraft({ ...alineacionDraft, descripcion: e.target.value })}
                      rows={2}
                      className={textareaCls('titulo')}
                    />
                  </div>
                </div>
                {alineacionDraftError && <p className="text-xs text-red-500">{alineacionDraftError}</p>}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setAlineacionEditIdx(null); setAlineacionDraftError('') }}
                    className="px-3 py-1.5 text-xs font-medium border border-line bg-white text-ink hover:bg-bg-soft transition-colors"
                    style={{ borderRadius: 0 }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={guardarAlineacion}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    style={{ borderRadius: 0 }}
                  >
                    Guardar alineación
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-ink">Diagnóstico y beneficiarios</h2>
              <p className="text-xs text-ink-muted mt-1">Marco lógico: diagnóstico y justificación</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Problema *</label>
              <textarea
                value={form.problema}
                onChange={(e) => update('problema', e.target.value)}
                rows={3}
                className={textareaCls('problema')}
                placeholder="Descripción del problema a resolver"
              />
              {errors.problema && <p className="text-xs text-red-500 mt-1">{errors.problema}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Justificación *</label>
              <textarea
                value={form.justificacion}
                onChange={(e) => update('justificacion', e.target.value)}
                rows={3}
                className={textareaCls('justificacion')}
                placeholder="Razones que sustentan la ejecución del proyecto"
              />
              {errors.justificacion && <p className="text-xs text-red-500 mt-1">{errors.justificacion}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Objetivo general *</label>
              <textarea
                value={form.objetivo_general}
                onChange={(e) => update('objetivo_general', e.target.value)}
                rows={3}
                className={textareaCls('objetivo_general')}
                placeholder="Objetivo general del proyecto"
              />
              {errors.objetivo_general && <p className="text-xs text-red-500 mt-1">{errors.objetivo_general}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Resultados esperados</label>
              <textarea
                value={form.resultados_esperados}
                onChange={(e) => update('resultados_esperados', e.target.value)}
                rows={3}
                className={textareaCls('resultados_esperados')}
              />
            </div>

            <div className="pt-4 border-t border-t-line space-y-3" style={{ borderTop: '1px solid #E2E8F0' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">Beneficiarios del proyecto</h3>
                <button
                  type="button"
                  onClick={() => abrirEditorBeneficiario(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  style={{ borderRadius: 0 }}
                >
                  <Plus size={14} /> Agregar beneficiario
                </button>
              </div>

              {errors.beneficiarios && <p className="text-xs text-red-500">{errors.beneficiarios}</p>}

              {form.beneficiarios.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-line bg-bg-soft" style={{ borderRadius: 0 }}>
                  <Users size={28} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-ink-muted">Aún no has agregado beneficiarios</p>
                  <p className="text-xs text-ink-muted mt-1">Agrega al menos un beneficiario directo.</p>
                </div>
              ) : (
                <div className="border border-line overflow-hidden" style={{ borderRadius: 0 }}>
                  <table className="w-full text-sm">
                    <thead className="bg-bg-soft">
                      <tr>
                        <th className="text-left px-3 py-2 text-[11px] font-semibold text-ink-muted uppercase">Tipo</th>
                        <th className="text-left px-3 py-2 text-[11px] font-semibold text-ink-muted uppercase">Nombre / Grupo</th>
                        <th className="text-left px-3 py-2 text-[11px] font-semibold text-ink-muted uppercase">Cantidad</th>
                        <th className="text-left px-3 py-2 text-[11px] font-semibold text-ink-muted uppercase">Ubicación</th>
                        <th className="text-right px-3 py-2 text-[11px] font-semibold text-ink-muted uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {form.beneficiarios.map((b, i) => {
                        const errorKey = `beneficiarios.${i}.nombre`
                        const hasError = errors[errorKey]
                        return (
                          <tr key={b._key} className={hasError ? 'bg-red-50/50' : ''}>
                            <td className="px-3 py-2.5 align-top">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold ${
                                  b.tipo === 'DIRECTO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}
                                style={{ borderRadius: 0 }}
                              >
                                {b.tipo === 'DIRECTO' ? 'Directo' : 'Indirecto'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              <p className="text-sm font-medium text-ink">{b.nombre}</p>
                              {b.observaciones && <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">{b.observaciones}</p>}
                            </td>
                            <td className="px-3 py-2.5 align-top text-sm tabular-nums">{b.cantidad_estimada || '—'}</td>
                            <td className="px-3 py-2.5 align-top text-xs text-ink-muted">{b.ubicacion || '—'}</td>
                            <td className="px-3 py-2.5 align-top text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => abrirEditorBeneficiario(i)}
                                  className="px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                                  style={{ borderRadius: 0 }}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => eliminarBeneficiario(i)}
                                  className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                  style={{ borderRadius: 0 }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {beneficiarioEditIdx !== null && (
                <div className="border border-emerald-300 bg-emerald-50/30 p-5 space-y-3" style={{ borderRadius: 0 }}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-ink">
                      {beneficiarioEditIdx === null ? 'Nuevo beneficiario' : `Editar beneficiario #${beneficiarioEditIdx + 1}`}
                    </h4>
                    <button type="button" onClick={() => { setBeneficiarioEditIdx(null); setBeneficiarioDraftError('') }} className="text-ink-muted hover:text-ink">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tipo *</label>
                      <select
                        value={beneficiarioDraft.tipo}
                        onChange={(e) => setBeneficiarioDraft({ ...beneficiarioDraft, tipo: e.target.value as 'DIRECTO' | 'INDIRECTO' })}
                        className={selectCls()}
                      >
                        <option value="DIRECTO">Directo</option>
                        <option value="INDIRECTO">Indirecto</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad estimada</label>
                      <input
                        type="number"
                        min="0"
                        value={beneficiarioDraft.cantidad_estimada}
                        onChange={(e) => setBeneficiarioDraft({ ...beneficiarioDraft, cantidad_estimada: e.target.value })}
                        className={inputCls('titulo')}
                        placeholder="0"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nombre / Descripción del grupo *</label>
                      <input
                        value={beneficiarioDraft.nombre}
                        onChange={(e) => setBeneficiarioDraft({ ...beneficiarioDraft, nombre: e.target.value })}
                        className={inputCls('titulo')}
                        placeholder="Ej: Familias de la parroquia El Valle"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ubicación</label>
                      <input
                        value={beneficiarioDraft.ubicacion}
                        onChange={(e) => setBeneficiarioDraft({ ...beneficiarioDraft, ubicacion: e.target.value })}
                        className={inputCls('titulo')}
                        placeholder="Ej: Parroquia El Valle, Loja"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
                      <textarea
                        value={beneficiarioDraft.observaciones}
                        onChange={(e) => setBeneficiarioDraft({ ...beneficiarioDraft, observaciones: e.target.value })}
                        rows={2}
                        className={textareaCls('titulo')}
                      />
                    </div>
                  </div>
                  {beneficiarioDraftError && <p className="text-xs text-red-500">{beneficiarioDraftError}</p>}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { setBeneficiarioEditIdx(null); setBeneficiarioDraftError('') }}
                      className="px-3 py-1.5 text-xs font-medium border border-line bg-white text-ink hover:bg-bg-soft transition-colors"
                      style={{ borderRadius: 0 }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={guardarBeneficiario}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      style={{ borderRadius: 0 }}
                    >
                      Guardar beneficiario
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-ink">Planificación y presupuesto</h2>
              <p className="text-xs text-ink-muted mt-1">Marco lógico: planificación y recursos</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha de inicio *</label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => update('fecha_inicio', e.target.value)}
                  className={inputCls('fecha_inicio')}
                />
                {errors.fecha_inicio && <p className="text-xs text-red-500 mt-1">{errors.fecha_inicio}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha fin planificada *</label>
                <input
                  type="date"
                  value={form.fecha_fin_planificada}
                  onChange={(e) => update('fecha_fin_planificada', e.target.value)}
                  className={inputCls('fecha_fin_planificada')}
                />
                {errors.fecha_fin_planificada && <p className="text-xs text-red-500 mt-1">{errors.fecha_fin_planificada}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Estrategias de ejecución *</label>
              <textarea
                value={form.estrategias_ejecucion}
                onChange={(e) => update('estrategias_ejecucion', e.target.value)}
                rows={4}
                className={textareaCls('estrategias_ejecucion')}
                placeholder="Describe cómo se ejecutará el proyecto: metodología, fases, recursos necesarios"
              />
              {errors.estrategias_ejecucion && <p className="text-xs text-red-500 mt-1">{errors.estrategias_ejecucion}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Presupuesto aprobado (USD)</label>
              <input
                type="number"
                step="0.01"
                value={form.presupuesto_aprobado}
                onChange={(e) => update('presupuesto_aprobado', e.target.value)}
                className={inputCls('presupuesto_aprobado')}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Observaciones</label>
              <textarea
                value={form.observaciones}
                onChange={(e) => update('observaciones', e.target.value)}
                rows={3}
                className={textareaCls('observaciones')}
              />
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-ink">Responsables y firmas</h2>
              <p className="text-xs text-ink-muted mt-1">Responsables y firmas de responsabilidad</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Responsable *</label>
                <select
                  value={form.responsable}
                  onChange={(e) => update('responsable', e.target.value)}
                  className={selectCls('responsable')}
                >
                  <option value="">Seleccionar...</option>
                  {docentes.map((d) => (
                    <option key={d.id} value={d.id}>{d.user_first_name} {d.user_last_name}</option>
                  ))}
                </select>
                {errors.responsable && <p className="text-xs text-red-500 mt-1">{errors.responsable}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Coordinador académico</label>
                <select
                  value={form.coordinador_academico}
                  onChange={(e) => update('coordinador_academico', e.target.value)}
                  className={selectCls()}
                >
                  <option value="">Seleccionar...</option>
                  {coordinadores.map((c) => (
                    <option key={c.id} value={c.id}>{c.user_first_name} {c.user_last_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-line bg-bg-soft p-4 flex items-start gap-3" style={{ borderRadius: 0 }}>
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 bg-white border border-line" style={{ borderRadius: 0 }}>
                <FileText size={14} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-ink">Firma de responsabilidad</h4>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Las firmas de responsabilidad (Responsable, Coordinador y Aprobador) se
                  registran automáticamente al asignar los responsables del proyecto.
                  Podrán visualizarse en el detalle del proyecto una vez creado.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                  {form.responsable && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-800 font-semibold" style={{ borderRadius: 0 }}>
                      <Check size={10} /> Firma de Responsable
                    </span>
                  )}
                  {form.coordinador_academico && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-800 font-semibold" style={{ borderRadius: 0 }}>
                      <Check size={10} /> Firma de Coordinador
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-bg-muted text-ink-muted font-semibold" style={{ borderRadius: 0 }}>
                    Firma de Aprobador (asignada al aprobar)
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-line bg-bg-soft p-4 flex items-start gap-3" style={{ borderRadius: 0 }}>
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 bg-white border border-line" style={{ borderRadius: 0 }}>
                <Users size={14} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-ink">Listado de participantes</h4>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Podrás agregar docentes y estudiantes participantes desde el detalle del
                  proyecto una vez creado. También podrás asignarles horas comprometidas y rol.
                </p>
              </div>
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-ink">Anexos y confirmación</h2>
              <p className="text-xs text-ink-muted mt-1">Documentos de respaldo y confirmación final</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-ink mb-2">Anexos del proyecto</h3>
              <input
                type="file"
                ref={anexoInputRef}
                accept=".pdf,.docx,.xlsx,image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  seleccionarAnexos(e.target.files)
                  if (anexoInputRef.current) anexoInputRef.current.value = ''
                }}
              />
              <div
                onClick={() => anexoInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  seleccionarAnexos(e.dataTransfer.files)
                }}
                className="cursor-pointer text-center transition-colors"
                style={{ border: '2px dashed #D1D5DB', background: '#F9FAFB', borderRadius: 0, padding: '24px' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#16A34A'; (e.currentTarget as HTMLDivElement).style.background = '#F0FDF4' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#D1D5DB'; (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB' }}
              >
                <Upload size={28} className="mx-auto text-gray-400 mb-2" />
                <p style={{ fontSize: '14px', color: '#374151' }}>Arrastra documentos o haz clic para seleccionar</p>
                <p style={{ fontSize: '12px', color: '#6B7280' }}>PDF, DOCX, XLSX o imágenes · Máx. {ANEXO_MAX_COUNT} archivos · 10MB c/u</p>
              </div>
              {anexoError && <p className="text-xs text-red-500 mt-2">{anexoError}</p>}

              {form.anexos.length > 0 && (
                <ul className="mt-3 border border-line divide-y divide-line" style={{ borderRadius: 0 }}>
                  {form.anexos.map((a) => (
                    <li key={a._key} className="flex items-center gap-3 px-3 py-2.5">
                      <FileText size={16} className="text-emerald-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{a.name}</p>
                        <p className="text-xs text-ink-muted">{formatBytes(a.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarAnexo(a._key)}
                        className="p-1.5 text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                        style={{ borderRadius: 0 }}
                        title="Quitar"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-4 border-t border-line space-y-3" style={{ borderTop: '1px solid #E2E8F0' }}>
              <h3 className="text-sm font-semibold text-ink">Resumen del proyecto</h3>
              <div className="border-l-4 p-5 space-y-3" style={{ borderLeftColor: '#16A34A', background: '#F0FDF4' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div><span className="text-ink-muted text-xs">Tipo:</span> <span className="text-black font-semibold">{form.tipo}</span></div>
                  <div><span className="text-ink-muted text-xs">Prioridad:</span> <span className="text-black font-semibold">{form.prioridad}</span></div>
                  <div className="md:col-span-2"><span className="text-ink-muted text-xs">Título:</span> <span className="text-black font-semibold">{form.titulo || '—'}</span></div>
                  <div><span className="text-ink-muted text-xs">Inicio:</span> <span className="text-black font-semibold">{form.fecha_inicio || '—'}</span></div>
                  <div><span className="text-ink-muted text-xs">Fecha fin:</span> <span className="text-black font-semibold">{form.fecha_fin_planificada || '—'}</span></div>
                  <div><span className="text-ink-muted text-xs">Presupuesto:</span> <span className="text-black font-semibold">{form.presupuesto_aprobado ? `$${form.presupuesto_aprobado}` : '—'}</span></div>
                  <div><span className="text-ink-muted text-xs">Responsable:</span> <span className="text-black font-semibold">{docentes.find((d) => String(d.id) === form.responsable)?.user_first_name || '—'} {docentes.find((d) => String(d.id) === form.responsable)?.user_last_name || ''}</span></div>
                  <div><span className="text-ink-muted text-xs">Coordinador:</span> <span className="text-black font-semibold">{coordinadores.find((c) => String(c.id) === form.coordinador_academico)?.user_first_name || '—'} {coordinadores.find((c) => String(c.id) === form.coordinador_academico)?.user_last_name || ''}</span></div>
                  <div><span className="text-ink-muted text-xs">Alineaciones:</span> <span className="text-black font-semibold">{form.alineaciones.length}</span></div>
                  <div><span className="text-ink-muted text-xs">Beneficiarios:</span> <span className="text-black font-semibold">{form.beneficiarios.length} ({form.beneficiarios.filter((b) => b.tipo === 'DIRECTO').length} directos)</span></div>
                  <div><span className="text-ink-muted text-xs">Anexos:</span> <span className="text-black font-semibold">{form.anexos.length}</span></div>
                </div>
                {form.instituciones_participantes.trim() && (
                  <div className="pt-2 mt-2 border-t border-emerald-200">
                    <p className="text-ink-muted text-xs">Instituciones participantes:</p>
                    <p className="text-sm text-black whitespace-pre-line">{form.instituciones_participantes}</p>
                  </div>
                )}
              </div>
            </div>

            <label className="flex items-start gap-3 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmAck}
                onChange={(e) => {
                  setConfirmAck(e.target.checked)
                  if (e.target.checked && errors.confirm) {
                    setErrors((prev) => { const { confirm: _c, ...rest } = prev; return rest })
                  }
                }}
                className="mt-0.5 h-4 w-4 accent-emerald-600 rounded-none"
              />
              <span className="text-sm text-ink">
                Confirmo que los datos son correctos y se ajustan a la normativa institucional de la UNL <span className="text-red-500">*</span>
              </span>
            </label>
            {errors.confirm && <p className="text-xs text-red-500 -mt-2">{errors.confirm}</p>}
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={step === 1}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-gray-300 text-ink hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-none"
          style={{ borderRadius: 0 }}
        >
          <ArrowLeft size={14} />
          Anterior
        </button>
        <div className="flex items-center gap-3">
          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-ink text-white hover:bg-ink/90 transition-colors"
              style={{ borderRadius: 0 }}
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
                style={{ borderRadius: 0 }}
              >
                {saving ? 'Guardando...' : 'Guardar como borrador'}
              </button>
              <button
                onClick={handleSaveAndSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                style={{ borderRadius: 0 }}
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
          ? 'Está seguro de enviar el proyecto a revisión'
          : 'Está seguro de guardar el proyecto como borrador'}
        onConfirm={executeAction}
        onCancel={() => setModalAction(null)}
      />
    </div>
  )
}
