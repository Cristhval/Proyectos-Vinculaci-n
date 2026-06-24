import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Check, Image as ImageIcon, X,
  Info, ExternalLink, Plus, Trash2, Upload, FileText, Users, Target,
  CalendarDays, CheckCircle2, ShieldCheck, UserCircle,
  ChevronDown, ChevronUp, Wallet, Paperclip, ClipboardList,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { proyectosApi, beneficiariosApi, alineacionesApi, anexosApi, marcoLogicoApi, firmasApi } from '@/api/proyectos'
import { carrerasApi, usuariosApi } from '@/api/usuarios'
import { useAuthStore } from '@/store/authStore'
import { ConfirmModal } from '@/components/ui'
import { TIPO_PROYECTO_LABELS, PRIORIDAD_LABELS } from '@/lib/constants'
import type { TipoProyecto, PrioridadProyecto, Beneficiario, AlineacionEstrategica, MarcoLogicoFila } from '@/types/proyectos'
import type { Carrera, Usuario } from '@/types/usuarios'

const STEPS = [
  { num: 1, label: 'General' },
  { num: 2, label: 'Alineación' },
  { num: 3, label: 'Diagnóstico' },
  { num: 4, label: 'Marco lógico' },
  { num: 5, label: 'Planificación' },
  { num: 6, label: 'Responsables' },
  { num: 7, label: 'Confirmación' },
]

const TOTAL_STEPS = STEPS.length

const ALINEACION_VACIA = {
  eje: '',
  objetivo_estrategico: '',
  programa: '',
  plan: '',
  descripcion: '',
  linea_investigacion: '',
  programa_vinculacion: '',
  eje_plan_igualdad: '',
  ods: '',
  plan_nacional_desarrollo: '',
  agenda_zonal: '',
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

interface MarcoLogicoItem extends Omit<MarcoLogicoFila, 'id' | 'proyecto' | 'creado_en' | 'actualizado_en'> {
  id?: number
  _key: string
}

interface FormState {
  titulo: string
  tipo: TipoProyecto
  prioridad: PrioridadProyecto
  carreras: string[]
  linea_intervencion: string
  resumen: string
  descripcion: string
  instituciones_participantes: string
  problema: string
  justificacion: string
  objetivo_general: string
  resultados_esperados: string
  viabilidad: string
  beneficiarios: BeneficiarioItem[]
  alineaciones: AlineacionItem[]
  marco_logico: MarcoLogicoItem[]
  fecha_inicio: string
  fecha_fin_planificada: string
  presupuesto_aprobado: string
  monto_unl_valorado: string
  monto_unl_economico: string
  monto_externo_valorado: string
  monto_externo_economico: string
  observaciones: string
  estrategias_ejecucion: string
  seguimiento_evaluacion: string
  responsable: string
  coordinador_academico: string
  responsable_cedula: string
  responsable_celular: string
  responsable_cargo: string
  anexos: AnexoFile[]
  confirm: boolean
  periodo_academico: string
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

function SummaryCard({ icon, title, defaultOpen, children }: { icon: React.ReactNode; title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? true)
  return (
    <div className="border border-line bg-white overflow-hidden" style={{ borderRadius: '6px' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-soft/40 transition-colors"
      >
        <span className="text-sm font-semibold text-ink flex items-center gap-2.5">
          <span className="w-7 h-7 flex items-center justify-center bg-emerald-50 text-emerald-600" style={{ borderRadius: '4px' }}>
            {icon}
          </span>
          {title}
        </span>
        {open ? <ChevronUp size={16} className="text-ink-muted" /> : <ChevronDown size={16} className="text-ink-muted" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-line pt-3">{children}</div>}
    </div>
  )
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.06em]">{label}</p>
      <p className="text-[13px] text-ink font-semibold mt-0.5">{value || '—'}</p>
    </div>
  )
}

const EMPTY_FORM: FormState = {
  titulo: '',
  tipo: 'VINCULACION',
  prioridad: 'MEDIA',
  carreras: [],
  linea_intervencion: '',
  resumen: '',
  descripcion: '',
  instituciones_participantes: '',
  problema: '',
  justificacion: '',
  objetivo_general: '',
  resultados_esperados: '',
  viabilidad: '',
  beneficiarios: [],
  alineaciones: [],
  marco_logico: [
    { _key: uid(), nivel: 'FIN', resumen_narrativo: '', indicadores: '', medios_verificacion: '', supuestos: '' },
    { _key: uid(), nivel: 'PROPOSITO', resumen_narrativo: '', indicadores: '', medios_verificacion: '', supuestos: '' },
    { _key: uid(), nivel: 'COMPONENTES', resumen_narrativo: '', indicadores: '', medios_verificacion: '', supuestos: '' },
    { _key: uid(), nivel: 'ACTIVIDADES', resumen_narrativo: '', indicadores: '', medios_verificacion: '', supuestos: '' },
  ],
  fecha_inicio: '',
  fecha_fin_planificada: '',
  presupuesto_aprobado: '',
  monto_unl_valorado: '',
  monto_unl_economico: '',
  monto_externo_valorado: '',
  monto_externo_economico: '',
  observaciones: '',
  estrategias_ejecucion: '',
  seguimiento_evaluacion: '',
  responsable: '',
  coordinador_academico: '',
  responsable_cedula: '',
  responsable_celular: '',
  responsable_cargo: '',
  anexos: [],
  confirm: false,
  periodo_academico: '',
}

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

  const [instBusqueda, setInstBusqueda] = useState('')
  const [instBusquedaLoading, setInstBusquedaLoading] = useState(false)
  const [instResultados, setInstResultados] = useState<{ id: number; nombre: string; sigla: string }[]>([])
  const [instLibre, setInstLibre] = useState('')
  const [institucionesCatalogo, setInstitucionesCatalogo] = useState<{ id: number; nombre: string; sigla: string }[]>([])

  useEffect(() => {
    import('@/api/convenios').then(({ institucionesApi }) => {
      institucionesApi.list({ page_size: '500' }).then(({ data }) => {
        setInstitucionesCatalogo(data.results.map((i: { id: number; nombre: string; sigla: string }) => ({ id: i.id, nombre: i.nombre, sigla: i.sigla })))
      }).catch(() => {})
    })
  }, [])

  useEffect(() => {
    if (instBusqueda.length < 2) { setInstResultados([]); return }
    setInstBusquedaLoading(true)
    const timer = setTimeout(() => {
      const q = instBusqueda.toLowerCase()
      setInstResultados(
        institucionesCatalogo
          .filter((i) => i.nombre.toLowerCase().includes(q) || (i.sigla || '').toLowerCase().includes(q))
          .slice(0, 8)
      )
      setInstBusquedaLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [instBusqueda, institucionesCatalogo])

  const [beneficiarioEditIdx, setBeneficiarioEditIdx] = useState<number | null>(null)
  const [beneficiarioEditorOpen, setBeneficiarioEditorOpen] = useState(false)
  const [beneficiarioDraft, setBeneficiarioDraft] = useState(BENEFICIARIO_VACIO)
  const [beneficiarioDraftError, setBeneficiarioDraftError] = useState('')

  const [alineacionEditIdx, setAlineacionEditIdx] = useState<number | null>(null)
  const [alineacionEditorOpen, setAlineacionEditorOpen] = useState(false)
  const [alineacionDraft, setAlineacionDraft] = useState(ALINEACION_VACIA)
  const [alineacionDraftError, setAlineacionDraftError] = useState('')

  const [accordionOpen, setAccordionOpen] = useState<Record<string, boolean>>({
    FIN: true,
    PROPOSITO: false,
    COMPONENTES: false,
    ACTIVIDADES: false,
  })

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
    const cargar = async () => {
      try {
        const { data: p } = await proyectosApi.get(Number(id))
        if (user?.rol !== 'ADMIN' && p.estado !== 'BORRADOR') {
          toast.error('Solo se pueden editar proyectos en estado Borrador')
          navigate(basePath)
          return
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

        let marcoLogicoInicial: MarcoLogicoItem[] = [
          { _key: uid(), nivel: 'FIN', resumen_narrativo: '', indicadores: '', medios_verificacion: '', supuestos: '' },
          { _key: uid(), nivel: 'PROPOSITO', resumen_narrativo: '', indicadores: '', medios_verificacion: '', supuestos: '' },
          { _key: uid(), nivel: 'COMPONENTES', resumen_narrativo: '', indicadores: '', medios_verificacion: '', supuestos: '' },
          { _key: uid(), nivel: 'ACTIVIDADES', resumen_narrativo: '', indicadores: '', medios_verificacion: '', supuestos: '' },
        ]
        try {
          const { data: mlData } = await marcoLogicoApi.list({ proyecto: String(id), page_size: '100' })
          const fetched = mlData.results
          if (fetched.length > 0) {
            marcoLogicoInicial = [
              { _key: uid(), nivel: 'FIN', resumen_narrativo: '', indicadores: '', medios_verificacion: '', supuestos: '' },
              { _key: uid(), nivel: 'PROPOSITO', resumen_narrativo: '', indicadores: '', medios_verificacion: '', supuestos: '' },
              { _key: uid(), nivel: 'COMPONENTES', resumen_narrativo: '', indicadores: '', medios_verificacion: '', supuestos: '' },
              { _key: uid(), nivel: 'ACTIVIDADES', resumen_narrativo: '', indicadores: '', medios_verificacion: '', supuestos: '' },
            ]
            for (const f of fetched) {
              const idx = marcoLogicoInicial.findIndex((m) => m.nivel === f.nivel)
              if (idx !== -1) {
                marcoLogicoInicial[idx] = { id: f.id, _key: marcoLogicoInicial[idx]!._key, nivel: f.nivel, resumen_narrativo: f.resumen_narrativo || '', indicadores: f.indicadores || '', medios_verificacion: f.medios_verificacion || '', supuestos: f.supuestos || '' }
              }
            }
          }
        } catch { /* silencioso */ }

        setForm({
          titulo: p.titulo || '',
          tipo: p.tipo || 'VINCULACION',
          prioridad: p.prioridad || 'MEDIA',
          carreras: ((p as { carreras?: Array<{ id: number } | number> }).carreras || []).map((c) => extractId(c)),
          linea_intervencion: p.linea_intervencion || '',
          resumen: p.resumen || '',
          descripcion: descripcionSinInstituciones,
          instituciones_participantes: institucionesTexto,
          problema: p.problema || '',
          justificacion: p.justificacion || '',
          objetivo_general: p.objetivo_general || '',
          resultados_esperados: p.resultados_esperados || '',
          viabilidad: (p as { viabilidad?: string }).viabilidad || '',
          beneficiarios: ((p as { beneficiarios?: Beneficiario[] }).beneficiarios || []).map((b) => ({
            id: b.id,
            _key: uid(),
            tipo: b.tipo,
            nombre: b.nombre,
            cantidad_estimada: String(b.cantidad_estimada || ''),
            ubicacion: b.ubicacion,
            observaciones: b.observaciones,
          })),
          alineaciones: ((p as { alineaciones?: AlineacionEstrategica[] }).alineaciones || []).map((a) => ({
            id: a.id,
            _key: uid(),
            eje: a.eje,
            objetivo_estrategico: a.objetivo_estrategico,
            programa: a.programa,
            plan: a.plan,
            descripcion: a.descripcion,
            linea_investigacion: a.linea_investigacion || '',
            programa_vinculacion: a.programa_vinculacion || '',
            eje_plan_igualdad: a.eje_plan_igualdad || '',
            ods: a.ods || '',
            plan_nacional_desarrollo: a.plan_nacional_desarrollo || '',
            agenda_zonal: a.agenda_zonal || '',
          })),
          marco_logico: marcoLogicoInicial,
          fecha_inicio: p.fecha_inicio || '',
          fecha_fin_planificada: p.fecha_fin_planificada || '',
          presupuesto_aprobado: p.presupuesto_aprobado || '',
          monto_unl_valorado: p.presupuesto?.monto_unl_valorado ?? '',
          monto_unl_economico: p.presupuesto?.monto_unl_economico ?? '',
          monto_externo_valorado: p.presupuesto?.monto_externo_valorado ?? '',
          monto_externo_economico: p.presupuesto?.monto_externo_economico ?? '',
          observaciones: p.observaciones || '',
          estrategias_ejecucion: (p as { estrategias_ejecucion?: string }).estrategias_ejecucion || '',
          seguimiento_evaluacion: (p as { seguimiento_evaluacion?: string }).seguimiento_evaluacion || '',
          responsable: extractId(p.responsable),
          coordinador_academico: extractId(p.coordinador_academico),
          responsable_cedula: '',
          responsable_celular: '',
          responsable_cargo: '',
          anexos: [],
          confirm: false,
          periodo_academico: '',
        })
        if (p.imagen_portada) {
          setImagenPreview(p.imagen_portada)
          setClearImagen(false)
        } else {
          setImagenPreview(null)
          setClearImagen(false)
        }
      } catch {
        toast.error('Error al cargar el proyecto')
        navigate(basePath)
      } finally {
        setLoadingData(false)
      }
    }
    void cargar()
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
      else if (form.titulo.trim().length < 10) e.titulo = 'Mínimo 10 caracteres'
      else if (form.titulo.length > 255) e.titulo = 'Máximo 255 caracteres'
      else if (/@|#|\$|&|\*/.test(form.titulo)) e.titulo = 'No se permiten caracteres como @, #, $, &, *'
      if (form.carreras.length === 0) e.carreras = 'Selecciona al menos una carrera'
      if (!form.resumen.trim()) e.resumen = 'Requerido'
      else if (form.resumen.trim().length < 50) e.resumen = `Mínimo 50 caracteres (${form.resumen.trim().length} ingresados)`
      if (form.descripcion.trim() && form.descripcion.trim().length < 30) e.descripcion = 'Mínimo 30 caracteres si se completa'
    }

    if (s === 2) {
      if (form.alineaciones.length === 0) {
        e.alineaciones = 'Debes registrar al menos una alineación estratégica para continuar'
      } else {
        const idxInvalido = form.alineaciones.findIndex(
          (a) => !a.eje.trim() || !a.objetivo_estrategico.trim(),
        )
        if (idxInvalido !== -1) {
          e[`alineaciones.${idxInvalido}`] = 'Completa eje y objetivo estratégico'
        }
        const idxConNumeros = form.alineaciones.findIndex(
          (a) => a.eje.trim() && /\d/.test(a.eje),
        )
        if (idxConNumeros !== -1) {
          e[`alineaciones.${idxConNumeros}`] = 'El eje estratégico no debe contener números'
        }
        const idxObjCorto = form.alineaciones.findIndex(
          (a) => a.objetivo_estrategico.trim() && a.objetivo_estrategico.trim().length < 30,
        )
        if (idxObjCorto !== -1) {
          e[`alineaciones.${idxObjCorto}`] = 'El objetivo estratégico debe tener mínimo 30 caracteres'
        }
      }
    }

    if (s === 3) {
      if (!form.problema.trim()) e.problema = 'Requerido'
      else if (form.problema.trim().length < 50) e.problema = `Mínimo 50 caracteres (${form.problema.trim().length} ingresados)`
      if (!form.justificacion.trim()) e.justificacion = 'Requerido'
      else if (form.justificacion.trim().length < 50) e.justificacion = `Mínimo 50 caracteres (${form.justificacion.trim().length} ingresados)`
      if (!form.objetivo_general.trim()) e.objetivo_general = 'Requerido'
      else if (form.objetivo_general.trim().length < 30) e.objetivo_general = `Mínimo 30 caracteres (${form.objetivo_general.trim().length} ingresados)`
      if (form.beneficiarios.length === 0) {
        e.beneficiarios = 'Agrega al menos un beneficiario'
      } else {
        const sinDirecto = !form.beneficiarios.some((b) => b.tipo === 'DIRECTO')
        if (sinDirecto) e.beneficiarios = 'Debe existir al menos un beneficiario directo'
        const idxInvalido = form.beneficiarios.findIndex((b) => !b.nombre.trim())
        if (idxInvalido !== -1) e[`beneficiarios.${idxInvalido}.nombre`] = 'Requerido'
      }
      if (!form.viabilidad.trim()) e.viabilidad = 'Requerido'
    }

    if (s === 4) {
      const niveles = ['FIN', 'PROPOSITO', 'COMPONENTES', 'ACTIVIDADES'] as const
      for (const nivel of niveles) {
        const fila = form.marco_logico.find((m) => m.nivel === nivel)
        if (!fila || !fila.resumen_narrativo.trim()) {
          e[`marco_logico.${nivel}`] = 'El resumen narrativo es obligatorio para este nivel'
        }
      }
    }

    if (s === 5) {
      if (!form.fecha_inicio) e.fecha_inicio = 'Requerido'
      if (!form.fecha_fin_planificada) e.fecha_fin_planificada = 'Requerido'
      if (form.fecha_inicio && form.fecha_fin_planificada && form.fecha_fin_planificada < form.fecha_inicio) {
        e.fecha_fin_planificada = 'Debe ser posterior a la fecha de inicio'
      }
      if (!form.estrategias_ejecucion.trim()) e.estrategias_ejecucion = 'Requerido'
      if (!form.seguimiento_evaluacion.trim()) e.seguimiento_evaluacion = 'Requerido'
      const montos = [form.monto_unl_valorado, form.monto_unl_economico, form.monto_externo_valorado, form.monto_externo_economico]
      for (const m of montos) {
        if (m && Number(m) < 0) {
          e.presupuesto = 'Los montos deben ser números positivos'
          break
        }
      }
    }

    if (s === 6) {
      if (!form.responsable) e.responsable = 'Requerido'
    }

    if (s === 7) {
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
    const { carreras, responsable, coordinador_academico, presupuesto_aprobado,
      instituciones_participantes, descripcion, ...rest } = form
    void instituciones_participantes
    const formData = new FormData()

    const descripcionFinal = instituciones_participantes.trim()
      ? `${(descripcion || '').trim()}\n\n[Instituciones participantes]\n${instituciones_participantes.trim()}`.trim()
      : (descripcion || '')

    const totalPresupuesto =
      Number(form.monto_unl_valorado || 0) +
      Number(form.monto_unl_economico || 0) +
      Number(form.monto_externo_valorado || 0) +
      Number(form.monto_externo_economico || 0)

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
      viabilidad: form.viabilidad.trim(),
      fecha_inicio: form.fecha_inicio || '',
      fecha_fin_planificada: form.fecha_fin_planificada || '',
      estrategias_ejecucion: form.estrategias_ejecucion.trim(),
      seguimiento_evaluacion: form.seguimiento_evaluacion.trim(),
      observaciones: form.observaciones.trim(),
      presupuesto_aprobado: String(totalPresupuesto),
    }
    if (responsable) payload.responsable_id = Number(responsable)
    if (coordinador_academico) payload.coordinador_academico_id = Number(coordinador_academico)
    if (clearImagen) payload.clear_imagen_portada = true

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value))
      }
    })

    if (carreras.length > 0) {
      carreras.forEach((id) => formData.append('carreras_ids', id))
    }

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
            linea_investigacion: a.linea_investigacion.trim(),
            programa_vinculacion: a.programa_vinculacion.trim(),
            eje_plan_igualdad: a.eje_plan_igualdad.trim(),
            ods: a.ods.trim(),
            plan_nacional_desarrollo: a.plan_nacional_desarrollo.trim(),
            agenda_zonal: a.agenda_zonal.trim(),
          })
        } catch {
          errores.push(`alineación "${a.eje || 'sin eje'}"`)
        }
      }),
    )
    void alineacionesCreadas

    let idsMarcoLogico: Record<string, number> = {}
    if (form.marco_logico.some((m) => !m.id)) {
      try {
        const { data: mlData } = await marcoLogicoApi.list({ proyecto: String(proyectoId), page_size: '100' })
        for (const f of mlData.results) {
          idsMarcoLogico[f.nivel] = f.id
        }
      } catch { /* silencioso */ }
    }

    await Promise.all(
      form.marco_logico.map(async (m) => {
        try {
          const idExistente = m.id || idsMarcoLogico[m.nivel]
          if (idExistente) {
            await marcoLogicoApi.update(idExistente, {
              proyecto: proyectoId,
              nivel: m.nivel,
              resumen_narrativo: m.resumen_narrativo.trim(),
              indicadores: m.indicadores.trim(),
              medios_verificacion: m.medios_verificacion.trim(),
              supuestos: m.supuestos.trim(),
            })
          } else {
            await marcoLogicoApi.create({
              proyecto: proyectoId,
              nivel: m.nivel,
              resumen_narrativo: m.resumen_narrativo.trim(),
              indicadores: m.indicadores.trim(),
              medios_verificacion: m.medios_verificacion.trim(),
              supuestos: m.supuestos.trim(),
            })
          }
        } catch {
          errores.push(`marco lógico "${m.nivel}"`)
        }
      }),
    )

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

  const registrarFirmas = async (proyectoId: number) => {
    const tiposACrear: { tipo: 'RESPONSABLE' | 'COORDINADOR'; usuarioId: string | undefined }[] = [
      { tipo: 'RESPONSABLE', usuarioId: form.responsable },
      { tipo: 'COORDINADOR', usuarioId: form.coordinador_academico },
    ]
    try {
      const { data } = await firmasApi.list({ proyecto: String(proyectoId), page_size: '100' })
      const firmasExistentes = new Set(data.results.map((f) => `${f.tipo}-${f.usuario}`))
      await Promise.all(
        tiposACrear
          .filter(({ tipo, usuarioId }) => usuarioId && !firmasExistentes.has(`${tipo}-${usuarioId}`))
          .map(({ tipo, usuarioId }) =>
            firmasApi.create({
              proyecto: proyectoId,
              usuario: Number(usuarioId),
              tipo,
              comentario: 'Registro automático al crear el proyecto',
            }).catch(() => null),
          ),
      )
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

      await registrarFirmas(proyectoId)

      if (form.responsable && (form.responsable_cedula || form.responsable_celular || form.responsable_cargo)) {
        try {
          await usuariosApi.update(Number(form.responsable), {
            ...(form.responsable_cedula ? { documento_identidad: form.responsable_cedula } : {}),
            ...(form.responsable_celular ? { telefono: form.responsable_celular } : {}),
            ...(form.responsable_cargo ? { cargo: form.responsable_cargo } : {}),
          })
        } catch {
          /* silencioso: no bloquear si no tiene permisos para editar usuario */
        }
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
    setBeneficiarioEditorOpen(true)
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
    setBeneficiarioEditorOpen(false)
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
        linea_investigacion: a.linea_investigacion,
        programa_vinculacion: a.programa_vinculacion,
        eje_plan_igualdad: a.eje_plan_igualdad,
        ods: a.ods,
        plan_nacional_desarrollo: a.plan_nacional_desarrollo,
        agenda_zonal: a.agenda_zonal,
      })
    }
    setAlineacionDraftError('')
    setAlineacionEditIdx(idx)
    setAlineacionEditorOpen(true)
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
    setAlineacionEditorOpen(false)
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
    `w-full h-9 px-3 border text-sm rounded-btn bg-white text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${
      errors[field]
        ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
        : 'border-line focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-line-strong'
    }`

  const selectCls = (field?: keyof FormState) =>
    `w-full h-9 px-3 pr-8 border text-sm bg-white text-ink rounded-btn focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer ${
      field && errors[field]
        ? 'border-red-400 focus:border-red-500'
        : 'border-line focus:border-emerald-500 hover:border-line-strong'
    }`

  const textareaCls = (field: keyof FormState) =>
    `w-full px-3 py-2 border text-sm rounded-btn bg-white text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all resize-none ${
      errors[field]
        ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
        : 'border-line focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-line-strong'
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
        <h1 className="mt-3 text-2xl font-bold text-ink tracking-tight leading-tight">
          {isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Paso {step} de {TOTAL_STEPS} — {STEPS[step - 1]?.label}
        </p>
      </div>

      {step === 1 && (
        <div className="flex items-start gap-3 p-4 rounded-card border border-blue-100 bg-blue-50/70">
          <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-xl bg-blue-100">
            <Info size={16} className="text-blue-600" />
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
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 transition-colors"
            >
              Ver Formatos
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}

      <div className="px-2">
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1 last:flex-none justify-center min-w-0">
              <button
                type="button"
                onClick={() => goToStep(s.num)}
                className="flex flex-col items-center gap-1.5 group min-w-0 px-1"
                title={`Ir al paso ${s.num}`}
              >
                <div
                  className={`w-8 h-8 flex items-center justify-center text-xs font-semibold transition-colors flex-shrink-0 ${
                    step > s.num
                      ? 'bg-[#15803D] text-white'
                      : step === s.num
                        ? 'bg-[#16A34A] text-white'
                        : 'bg-[#F3F4F6] text-[#9CA3AF]'
                  }`}
                >
                  {step > s.num ? <Check size={12} /> : s.num}
                </div>
                <span
                  className={`text-[10.5px] font-medium text-center leading-tight whitespace-nowrap ${
                    step === s.num
                      ? 'text-[#16A34A] font-semibold'
                      : step > s.num
                        ? 'text-[#15803D]'
                        : 'text-[#9CA3AF]'
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 self-start mt-4 transition-colors ${step > s.num ? 'bg-[#16A34A]' : 'bg-[#E5E7EB]'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-line shadow-xs p-6 sm:p-7 space-y-5">
        {step === 1 && (
          <>
            <div className="pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FileText size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink tracking-tight">Datos informativos del proyecto</h2>
                  <p className="text-xs text-ink-muted mt-0.5">Información general que identifica al proyecto en el sistema.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Tipo <span className="text-red-500">*</span></label>
                <select value={form.tipo} onChange={(e) => update('tipo', e.target.value)} className={selectCls()}>
                  <option value="VINCULACION">Vinculación</option>
                  <option value="INVESTIGACION">Investigación</option>
                  <option value="EXTENSION">Extensión</option>
                  <option value="MIXTO">Mixto</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Prioridad <span className="text-red-500">*</span></label>
                <select value={form.prioridad} onChange={(e) => update('prioridad', e.target.value)} className={selectCls()}>
                  <option value="BAJA">Baja</option>
                  <option value="MEDIA">Media</option>
                  <option value="ALTA">Alta</option>
                  <option value="CRITICA">Crítica</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Período académico</label>
              <select value={form.periodo_academico} onChange={(e) => update('periodo_academico', e.target.value)} className={selectCls()}>
                <option value="">Seleccionar período...</option>
                <option value="Agosto - Diciembre 2026">Agosto - Diciembre 2026</option>
                <option value="Abril - Agosto 2026">Abril - Agosto 2026</option>
                <option value="Agosto - Diciembre 2025">Agosto - Diciembre 2025</option>
                <option value="Abril - Agosto 2025">Abril - Agosto 2025</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Título <span className="text-red-500">*</span></label>
              <input
                value={form.titulo}
                onChange={(e) => update('titulo', e.target.value)}
                className={inputCls('titulo')}
                placeholder="Título del proyecto"
                maxLength={255}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.titulo ? (
                  <p className="text-xs text-red-500 animate-fade-in">{'\u26A0'} {errors.titulo}</p>
                ) : <span />}
                <p className="text-[11px] text-ink-muted tabular-nums">{form.titulo.length}/255</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Carrera(s) <span className="text-red-500">*</span></label>
              <div className={`border rounded-card p-3 space-y-2 ${errors.carreras ? 'border-red-400 bg-red-50/30' : 'border-line bg-white'}`}>
                {carreras.length === 0 ? (
                  <p className="text-xs text-ink-muted">Cargando carreras...</p>
                ) : (
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${form.carreras.length >= 3 ? 'opacity-50' : ''}`}>
                    {carreras.map((c) => {
                      const checked = form.carreras.includes(String(c.id))
                      const disabled = !checked && form.carreras.length >= 3
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors ${
                            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                          } ${
                            checked
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-white border-line text-ink hover:bg-bg-soft'
                          }`}
                          title={disabled ? 'Límite de 3 carreras alcanzado' : undefined}
                        >
                          <input
                            type="checkbox"
                            className="accent-emerald-600 w-4 h-4"
                            checked={checked}
                            disabled={disabled}
                            onChange={(e) => {
                              const val = String(c.id)
                              if (e.target.checked && form.carreras.length >= 3) {
                                toast('Máximo 3 carreras por proyecto', { icon: '⚠️' })
                                return
                              }
                              setForm((prev) => ({
                                ...prev,
                                carreras: e.target.checked
                                  ? [...prev.carreras, val]
                                  : prev.carreras.filter((id) => id !== val),
                              }))
                              if (errors.carreras) {
                                setErrors((prev) => { const { carreras: _c, ...rest } = prev; return rest })
                              }
                            }}
                          />
                          <span className="font-medium">{c.nombre}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
              <p className={`text-xs mt-1 font-medium ${form.carreras.length >= 3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {form.carreras.length} / 3 carreras seleccionadas
              </p>
              {errors.carreras && <p className="text-xs text-red-500 mt-1 animate-fade-in">{errors.carreras}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Línea de intervención</label>
              <input
                value={form.linea_intervencion}
                onChange={(e) => update('linea_intervencion', e.target.value)}
                className={inputCls('linea_intervencion')}
                placeholder="Ej: Desarrollo social, Alfabetización digital, Salud comunitaria"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Resumen <span className="text-red-500">*</span></label>
              <textarea
                value={form.resumen}
                onChange={(e) => update('resumen', e.target.value)}
                rows={3}
                className={textareaCls('resumen')}
                placeholder="Resumen ejecutivo del proyecto (mínimo 50 caracteres)"
              />
              <div className="flex items-center justify-between mt-1">
                {errors.resumen ? (
                  <p className="text-xs text-red-500 animate-fade-in">{'\u26A0'} {errors.resumen}</p>
                ) : <span />}
                <p className={`text-[11px] tabular-nums ${form.resumen.trim().length < 50 ? 'text-ink-muted' : 'text-emerald-600'}`}>{form.resumen.trim().length} caracteres</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => update('descripcion', e.target.value)}
                rows={4}
                className={textareaCls('descripcion')}
                placeholder="Descripción detallada del proyecto (opcional, mínimo 30 caracteres si se completa)"
              />
              {errors.descripcion && <p className="text-xs text-red-500 mt-1 animate-fade-in">{'\u26A0'} {errors.descripcion}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Imagen representativa (opcional)</label>
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
                  className="group cursor-pointer text-center rounded-card transition-all duration-200 border-2 border-dashed border-line bg-bg-soft hover:border-emerald-400 hover:bg-emerald-50/40 py-10 px-6"
                >
                  <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-2xl bg-white border border-line text-ink-light group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors mb-3">
                    <ImageIcon size={22} />
                  </div>
                  <p className="text-sm font-medium text-ink">Haz clic o arrastra tu imagen aquí</p>
                  <p className="text-xs text-ink-muted mt-1">JPG, PNG o WebP · Máximo 5MB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative overflow-hidden rounded-card border border-line">
                    <img src={imagenPreview} alt="Preview" className="w-full object-cover h-44" />
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors">
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
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                    >
                      <X size={14} /> Quitar imagen
                    </button>
                  </div>
                  {imagenPortada && <p className="text-xs text-ink-muted">{imagenPortada.name}</p>}
                </div>
              )}
              {imagenError && <p className="text-xs text-red-500 mt-1 animate-fade-in">{imagenError}</p>}
            </div>

            <div className="pt-4 border-t border-line space-y-3">
              <p className="text-xs text-ink-muted">Los datos del responsable se mostrarán en el paso de Responsables una vez seleccionado el docente.</p>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Target size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink tracking-tight">Alineación estratégica</h2>
                  <p className="text-xs text-ink-muted mt-0.5">Marco lógico: alineación estratégica</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Alineaciones del proyecto</h3>
              <button
                type="button"
                onClick={() => abrirEditorAlineacion(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 btn-glow transition-all"
              >
                <Plus size={14} strokeWidth={2.5} /> Agregar alineación
              </button>
            </div>

            {errors.alineaciones && (
              <p className="text-xs text-red-500 animate-fade-in">{errors.alineaciones}</p>
            )}

            {form.alineaciones.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-line rounded-card bg-bg-soft">
                <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-2xl bg-white border border-line text-ink-light mb-3">
                  <Target size={22} />
                </div>
                <p className="text-sm font-medium text-ink">Aún no has agregado alineaciones estratégicas</p>
                <p className="text-xs text-ink-muted mt-1">Registra al menos una alineación con eje y objetivo estratégico.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {form.alineaciones.map((a, i) => {
                  const errorKey = `alineaciones.${i}`
                  const hasError = errors[errorKey]
                  return (
                    <div
                      key={a._key}
                      className={`group relative border rounded-card p-4 pr-12 transition-all hover:shadow-sm ${hasError ? 'bg-red-50/50 border-red-300' : 'bg-white border-line hover:border-emerald-200'}`}
                    >
                      <button
                        type="button"
                        onClick={() => eliminarAlineacion(i)}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-ink-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Eliminar alineación"
                      >
                        <X size={15} />
                      </button>
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-ink">{a.eje}</p>
                          <p className="text-xs text-ink-muted line-clamp-2 mt-1">{a.objetivo_estrategico}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {a.programa && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-md bg-bg-soft text-ink-muted border border-line">{a.programa}</span>
                            )}
                            {a.plan && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-md bg-bg-soft text-ink-muted border border-line">{a.plan}</span>
                            )}
                            {a.linea_investigacion && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">{a.linea_investigacion}</span>
                            )}
                            {a.programa_vinculacion && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200">{a.programa_vinculacion}</span>
                            )}
                            {a.eje_plan_igualdad && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-md bg-pink-50 text-pink-700 border border-pink-200">{a.eje_plan_igualdad}</span>
                            )}
                            {a.ods && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-200">{a.ods}</span>
                            )}
                            {a.agenda_zonal && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">{a.agenda_zonal}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="pt-4 border-t border-line space-y-4">
              <h3 className="text-sm font-semibold text-ink">Instituciones participantes</h3>
              <p className="text-xs text-ink-muted">Busca instituciones registradas o agrega una nueva como texto libre.</p>

              {(() => {
                const items = form.instituciones_participantes
                  .split('\n').map((s) => s.trim()).filter(Boolean)
                return (
                  <>
                    {items.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {items.map((nombre, idx) => {
                          const isCatalog = institucionesCatalogo.some((i) => i.nombre === nombre)
                          return (
                            <span
                              key={`${nombre}-${idx}`}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ${isCatalog ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}
                              style={{ borderRadius: 0 }}
                            >
                              {nombre}
                              <button
                                type="button"
                                onClick={() => {
                                  const next = items.filter((_, i) => i !== idx).join('\n')
                                  update('instituciones_participantes', next)
                                }}
                                className="hover:opacity-70"
                                title="Quitar"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          )
                        })}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="relative">
                        <label className="block text-xs font-semibold text-ink-muted mb-1">Buscar institución registrada</label>
                        <div className="relative">
                          <input
                            value={instBusqueda}
                            onChange={(e) => { setInstBusqueda(e.target.value); setInstResultados([]) }}
                            className={inputCls('instituciones_participantes')}
                            placeholder="Escribe para buscar..."
                          />
                        </div>
                        {instBusqueda.length >= 2 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-line shadow-lg max-h-40 overflow-y-auto" style={{ borderRadius: 0 }}>
                            {instBusquedaLoading && (
                              <div className="p-3 text-xs text-ink-muted text-center">Buscando...</div>
                            )}
                            {!instBusquedaLoading && instResultados.length === 0 && (
                              <div className="p-3 text-xs text-ink-muted text-center">Sin resultados</div>
                            )}
                            {!instBusquedaLoading && instResultados.map((inst) => {
                              const yaAgregada = items.includes(inst.nombre)
                              return (
                                <button
                                  key={inst.id}
                                  type="button"
                                  disabled={yaAgregada}
                                  onClick={() => {
                                    const next = [...items, inst.nombre].join('\n')
                                    update('instituciones_participantes', next)
                                    setInstBusqueda('')
                                    setInstResultados([])
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm border-b border-line last:border-0 transition-colors ${yaAgregada ? 'bg-bg-soft text-ink-muted cursor-not-allowed' : 'hover:bg-bg-soft'}`}
                                >
                                  <p className="font-medium text-ink">{inst.nombre}</p>
                                  {inst.sigla && <p className="text-xs text-ink-muted">{inst.sigla}</p>}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink-muted mb-1">Agregar institución libre</label>
                        <div className="flex gap-2">
                          <input
                            value={instLibre}
                            onChange={(e) => setInstLibre(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && instLibre.trim()) {
                                e.preventDefault()
                                const nombre = instLibre.trim()
                                if (!items.includes(nombre)) {
                                  update('instituciones_participantes', [...items, nombre].join('\n'))
                                }
                                setInstLibre('')
                              }
                            }}
                            className={inputCls('instituciones_participantes')}
                            placeholder="Nombre de institución externa..."
                          />
                          <button
                            type="button"
                            disabled={!instLibre.trim()}
                            onClick={() => {
                              const nombre = instLibre.trim()
                              if (nombre && !items.includes(nombre)) {
                                update('instituciones_participantes', [...items, nombre].join('\n'))
                              }
                              setInstLibre('')
                            }}
                            className="inline-flex items-center gap-1.5 px-3 text-xs font-semibold border border-line bg-white text-ink hover:bg-bg-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            style={{ borderRadius: 0 }}
                          >
                            <Plus size={13} /> Agregar
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>

            {alineacionEditorOpen && (
              <div className="border border-emerald-200 rounded-card bg-emerald-50/40 p-5 space-y-3 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {alineacionEditIdx === null ? '+' : '✓'}
                    </span>
                    {alineacionEditIdx === null ? 'Nueva alineación' : `Editar alineación #${alineacionEditIdx + 1}`}
                  </h4>
                  <button type="button" onClick={() => { setAlineacionEditIdx(null); setAlineacionEditorOpen(false); setAlineacionDraftError('') }} className="p-1.5 rounded-lg text-ink-muted hover:bg-white hover:text-ink transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-ink-muted mb-1">Eje estratégico <span className="text-red-500">*</span></label>
                    <input
                      value={alineacionDraft.eje}
                      onChange={(e) => setAlineacionDraft({ ...alineacionDraft, eje: e.target.value })}
                      className={inputCls('titulo')}
                      placeholder="Ej: Desarrollo social y comunitario"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-ink-muted mb-1">Objetivo estratégico institucional <span className="text-red-500">*</span></label>
                    <textarea
                      value={alineacionDraft.objetivo_estrategico}
                      onChange={(e) => setAlineacionDraft({ ...alineacionDraft, objetivo_estrategico: e.target.value })}
                      rows={2}
                      className={textareaCls('titulo')}
                      placeholder="Describe con qué política, plan o programa institucional se alinea este proyecto"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1">Programa (opcional)</label>
                    <input
                      value={alineacionDraft.programa}
                      onChange={(e) => setAlineacionDraft({ ...alineacionDraft, programa: e.target.value })}
                      className={inputCls('titulo')}
                      placeholder="Ej: Programa de Alfabetización Digital UNL"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1">Plan (opcional)</label>
                    <input
                      value={alineacionDraft.plan}
                      onChange={(e) => setAlineacionDraft({ ...alineacionDraft, plan: e.target.value })}
                      className={inputCls('titulo')}
                      placeholder="Ej: Plan Estratégico de Vinculación 2024-2028"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1">Línea de investigación UNL</label>
                    <select
                      value={alineacionDraft.linea_investigacion}
                      onChange={(e) => setAlineacionDraft({ ...alineacionDraft, linea_investigacion: e.target.value })}
                      className={selectCls()}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Educación y pedagogía">Educación y pedagogía</option>
                      <option value="Salud y bienestar">Salud y bienestar</option>
                      <option value="Tecnología e innovación">Tecnología e innovación</option>
                      <option value="Desarrollo sostenible y ambiente">Desarrollo sostenible y ambiente</option>
                      <option value="Gestión social y económica">Gestión social y económica</option>
                      <option value="Arte y cultura">Arte y cultura</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1">Programa de vinculación</label>
                    <select
                      value={alineacionDraft.programa_vinculacion}
                      onChange={(e) => setAlineacionDraft({ ...alineacionDraft, programa_vinculacion: e.target.value })}
                      className={selectCls()}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Servicios comunitarios y sociales">Servicios comunitarios y sociales</option>
                      <option value="Innovación">Innovación</option>
                      <option value="Servicios especializados">Servicios especializados</option>
                      <option value="Educación continua">Educación continua</option>
                      <option value="Prácticas preprofesionales">Prácticas preprofesionales</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-ink-muted mb-1">Eje del Plan de Igualdad</label>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {[
                        { value: 'GENERO', label: 'Género' },
                        { value: 'PUEBLOS', label: 'Pueblos y nacionalidades' },
                        { value: 'DISCAPACIDADES', label: 'Discapacidades' },
                        { value: 'SOCIOECONOMICA', label: 'Condición socioeconómica' },
                        { value: 'NO_APLICA', label: 'No aplica' },
                      ].map((opt) => (
                        <label key={opt.value} className="inline-flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                          <input
                            type="radio"
                            name="eje_plan_igualdad"
                            value={opt.value}
                            checked={alineacionDraft.eje_plan_igualdad === opt.value}
                            onChange={(e) => setAlineacionDraft({ ...alineacionDraft, eje_plan_igualdad: e.target.value })}
                            className="accent-emerald-600"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-ink-muted mb-1">ODS</label>
                    <select
                      value={alineacionDraft.ods}
                      onChange={(e) => setAlineacionDraft({ ...alineacionDraft, ods: e.target.value })}
                      className={selectCls()}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="1. Fin de la pobreza">1. Fin de la pobreza</option>
                      <option value="2. Hambre cero">2. Hambre cero</option>
                      <option value="3. Salud y bienestar">3. Salud y bienestar</option>
                      <option value="4. Educación de calidad">4. Educación de calidad</option>
                      <option value="5. Igualdad de género">5. Igualdad de género</option>
                      <option value="6. Agua limpia y saneamiento">6. Agua limpia y saneamiento</option>
                      <option value="7. Energía asequible y no contaminante">7. Energía asequible y no contaminante</option>
                      <option value="8. Trabajo decente y crecimiento económico">8. Trabajo decente y crecimiento económico</option>
                      <option value="9. Industria, innovación e infraestructura">9. Industria, innovación e infraestructura</option>
                      <option value="10. Reducción de las desigualdades">10. Reducción de las desigualdades</option>
                      <option value="11. Ciudades y comunidades sostenibles">11. Ciudades y comunidades sostenibles</option>
                      <option value="12. Producción y consumo responsables">12. Producción y consumo responsables</option>
                      <option value="13. Acción por el clima">13. Acción por el clima</option>
                      <option value="14. Vida submarina">14. Vida submarina</option>
                      <option value="15. Vida de ecosistemas terrestres">15. Vida de ecosistemas terrestres</option>
                      <option value="16. Paz, justicia e instituciones sólidas">16. Paz, justicia e instituciones sólidas</option>
                      <option value="17. Alianzas para lograr los objetivos">17. Alianzas para lograr los objetivos</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-ink-muted mb-1">Plan Nacional de Desarrollo</label>
                    <textarea
                      value={alineacionDraft.plan_nacional_desarrollo}
                      onChange={(e) => setAlineacionDraft({ ...alineacionDraft, plan_nacional_desarrollo: e.target.value })}
                      rows={2}
                      className={textareaCls('titulo')}
                      placeholder="Identifique con qué objetivo del PND se alinea el proyecto"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-ink-muted mb-1">Agenda Zonal</label>
                    <input
                      value={alineacionDraft.agenda_zonal}
                      onChange={(e) => setAlineacionDraft({ ...alineacionDraft, agenda_zonal: e.target.value })}
                      className={inputCls('titulo')}
                      placeholder="Agenda zonal"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-ink-muted mb-1">Descripción adicional (opcional)</label>
                    <textarea
                      value={alineacionDraft.descripcion}
                      onChange={(e) => setAlineacionDraft({ ...alineacionDraft, descripcion: e.target.value })}
                      rows={2}
                      className={textareaCls('titulo')}
                    />
                  </div>
                </div>
                {alineacionDraftError && <p className="text-xs text-red-500 animate-fade-in">{alineacionDraftError}</p>}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setAlineacionEditIdx(null); setAlineacionEditorOpen(false); setAlineacionDraftError('') }}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-btn border border-line bg-white text-ink hover:bg-bg-soft transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={guardarAlineacion}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 btn-glow transition-all"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div className="pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Users size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink tracking-tight">Diagnóstico y beneficiarios</h2>
                  <p className="text-xs text-ink-muted mt-0.5">Marco lógico: diagnóstico y justificación</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Problema <span className="text-red-500">*</span></label>
              <textarea
                value={form.problema}
                onChange={(e) => update('problema', e.target.value)}
                rows={3}
                className={textareaCls('problema')}
                placeholder="Descripción del problema a resolver"
              />
              {errors.problema && <p className="text-xs text-red-500 mt-1 animate-fade-in">{errors.problema}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Justificación <span className="text-red-500">*</span></label>
              <textarea
                value={form.justificacion}
                onChange={(e) => update('justificacion', e.target.value)}
                rows={3}
                className={textareaCls('justificacion')}
                placeholder="Razones que sustentan la ejecución del proyecto"
              />
              {errors.justificacion && <p className="text-xs text-red-500 mt-1 animate-fade-in">{errors.justificacion}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Objetivo general <span className="text-red-500">*</span></label>
              <textarea
                value={form.objetivo_general}
                onChange={(e) => update('objetivo_general', e.target.value)}
                rows={3}
                className={textareaCls('objetivo_general')}
                placeholder="Objetivo general del proyecto"
              />
              {errors.objetivo_general && <p className="text-xs text-red-500 mt-1 animate-fade-in">{'\u26A0'} {errors.objetivo_general}</p>}
              <p className="text-[11px] text-ink-muted mt-1.5 leading-relaxed">
                {'\uD83D\uDCA1'} Tip: Usa la estructura: &quot;[Verbo en infinitivo] + [qué] + [para quién] + [dónde/cuándo]&quot;.
                Ej: &quot;Capacitar a 50 adultos mayores en el uso de smartphones en el Barrio Sucre durante el semestre Agosto-Diciembre 2026&quot;
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Resultados esperados</label>
              <textarea
                value={form.resultados_esperados}
                onChange={(e) => update('resultados_esperados', e.target.value)}
                rows={3}
                className={textareaCls('resultados_esperados')}
                placeholder="Resultados esperados del proyecto"
              />
              <p className="text-[11px] text-ink-muted mt-1.5 leading-relaxed">
                {'\uD83D\uDCA1'} Tip: Describe los resultados concretos y medibles que se esperan alcanzar al finalizar el proyecto.
              </p>
            </div>

            <div className="pt-4 border-t border-line space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">Beneficiarios del proyecto</h3>
                <button
                  type="button"
                  onClick={() => abrirEditorBeneficiario(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 btn-glow transition-all"
                >
                  <Plus size={14} strokeWidth={2.5} /> Agregar beneficiario
                </button>
              </div>

              {errors.beneficiarios && <p className="text-xs text-red-500 animate-fade-in">{errors.beneficiarios}</p>}

              {form.beneficiarios.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-line rounded-card bg-bg-soft">
                  <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-2xl bg-white border border-line text-ink-light mb-3">
                    <Users size={22} />
                  </div>
                  <p className="text-sm font-medium text-ink">Aún no has agregado beneficiarios</p>
                  <p className="text-xs text-ink-muted mt-1">Agrega al menos un beneficiario directo.</p>
                </div>
              ) : (
                <div className="border border-line rounded-card overflow-hidden shadow-xs">
                  <table className="w-full text-sm">
                    <thead className="bg-bg-soft/70">
                      <tr>
                        <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Tipo</th>
                        <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Nombre / Grupo</th>
                        <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Cantidad</th>
                        <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Ubicación</th>
                        <th className="text-right px-3 py-2.5 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {form.beneficiarios.map((b, i) => {
                        const errorKey = `beneficiarios.${i}.nombre`
                        const hasError = errors[errorKey]
                        return (
                          <tr key={b._key} className={`group transition-colors hover:bg-emerald-50/30 ${hasError ? 'bg-red-50/50' : ''}`}>
                            <td className="px-3 py-2.5 align-top">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                                  b.tipo === 'DIRECTO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {b.tipo === 'DIRECTO' ? 'Directo' : 'Indirecto'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              <p className="text-sm font-medium text-ink">{b.nombre}</p>
                              {b.observaciones && <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">{b.observaciones}</p>}
                            </td>
                            <td className="px-3 py-2.5 align-top text-sm tabular-nums font-medium text-ink">{b.cantidad_estimada || '—'}</td>
                            <td className="px-3 py-2.5 align-top text-xs text-ink-muted">{b.ubicacion || '—'}</td>
                            <td className="px-3 py-2.5 align-top text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => abrirEditorBeneficiario(i)}
                                  className="px-2 py-1 text-xs font-semibold rounded-md text-emerald-700 hover:bg-emerald-50 transition-colors"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => eliminarBeneficiario(i)}
                                  className="p-1 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 size={13} />
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

              {beneficiarioEditorOpen && (
                <div className="border border-emerald-200 rounded-card bg-emerald-50/40 p-5 space-y-3 shadow-sm animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                        {beneficiarioEditIdx === null ? '+' : '✓'}
                      </span>
                      {beneficiarioEditIdx === null ? 'Nuevo beneficiario' : `Editar beneficiario #${beneficiarioEditIdx + 1}`}
                    </h4>
                    <button type="button" onClick={() => { setBeneficiarioEditIdx(null); setBeneficiarioEditorOpen(false); setBeneficiarioDraftError('') }} className="p-1.5 rounded-lg text-ink-muted hover:bg-white hover:text-ink transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink-muted mb-1">Tipo <span className="text-red-500">*</span></label>
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
                      <label className="block text-xs font-semibold text-ink-muted mb-1">Cantidad estimada</label>
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
                      <label className="block text-xs font-semibold text-ink-muted mb-1">Nombre / Descripción del grupo <span className="text-red-500">*</span></label>
                      <input
                        value={beneficiarioDraft.nombre}
                        onChange={(e) => setBeneficiarioDraft({ ...beneficiarioDraft, nombre: e.target.value })}
                        className={inputCls('titulo')}
                        placeholder="Ej: Familias de la parroquia El Valle"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-ink-muted mb-1">Ubicación</label>
                      <input
                        value={beneficiarioDraft.ubicacion}
                        onChange={(e) => setBeneficiarioDraft({ ...beneficiarioDraft, ubicacion: e.target.value })}
                        className={inputCls('titulo')}
                        placeholder="Ej: Parroquia El Valle, Loja"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-ink-muted mb-1">Observaciones</label>
                      <textarea
                        value={beneficiarioDraft.observaciones}
                        onChange={(e) => setBeneficiarioDraft({ ...beneficiarioDraft, observaciones: e.target.value })}
                        rows={2}
                        className={textareaCls('titulo')}
                      />
                    </div>
                  </div>
                  {beneficiarioDraftError && <p className="text-xs text-red-500 animate-fade-in">{beneficiarioDraftError}</p>}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { setBeneficiarioEditIdx(null); setBeneficiarioEditorOpen(false); setBeneficiarioDraftError('') }}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-btn border border-line bg-white text-ink hover:bg-bg-soft transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={guardarBeneficiario}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 btn-glow transition-all"
                    >
                      Guardar beneficiario
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-line">
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Viabilidad del proyecto <span className="text-red-500">*</span></label>
              <textarea
                value={form.viabilidad}
                onChange={(e) => update('viabilidad', e.target.value)}
                rows={4}
                className={textareaCls('viabilidad')}
                placeholder="Describe la viabilidad técnica, social y económica del proyecto"
              />
              {errors.viabilidad && <p className="text-xs text-red-500 mt-1 animate-fade-in">{errors.viabilidad}</p>}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Target size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink tracking-tight">Marco lógico: matriz de planificación</h2>
                  <p className="text-xs text-ink-muted mt-0.5">Organiza el proyecto en 4 niveles de planificación</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-card border border-blue-100 bg-blue-50/70">
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-xl bg-blue-100">
                <Info size={16} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink leading-relaxed">
                  La matriz de marco lógico organiza el proyecto en 4 niveles, desde el impacto general hasta las actividades concretas.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {form.marco_logico.map((fila) => {
                const abierto = accordionOpen[fila.nivel]
                const nivelLabels: Record<string, { titulo: string; subtitulo: string }> = {
                  FIN: { titulo: 'FIN (Objetivo de Desarrollo)', subtitulo: 'Mide el impacto general que tendrá el proyecto' },
                  PROPOSITO: { titulo: 'PROPÓSITO (Objetivo General)', subtitulo: 'Describe el impacto logrado al final del proyecto' },
                  COMPONENTES: { titulo: 'COMPONENTES (Objetivos Específicos)', subtitulo: 'Resultados que se tienen que terminar en el proyecto' },
                  ACTIVIDADES: { titulo: 'ACTIVIDADES (Actividades Principales)', subtitulo: 'Contiene el presupuesto para cada actividad' },
                }
                const info = nivelLabels[fila.nivel]!
                const errorKey = `marco_logico.${fila.nivel}`
                const hasError = errors[errorKey]
                return (
                  <div key={fila._key} className={`border rounded-card bg-white overflow-hidden transition-all ${hasError ? 'border-red-300' : 'border-line'}`}>
                    <button
                      type="button"
                      onClick={() => setAccordionOpen((prev) => ({ ...prev, [fila.nivel]: !prev[fila.nivel] }))}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-bg-soft/40 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-bold text-ink">{info.titulo}</p>
                        <p className="text-xs text-ink-muted mt-0.5">{info.subtitulo}</p>
                      </div>
                      <div className="text-ink-muted">
                        {abierto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </button>
                    {abierto && (
                      <div className="px-4 pb-4 space-y-3 border-t border-line">
                        <div className="pt-3">
                          <label className="block text-xs font-semibold text-ink-muted mb-1">Resumen narrativo <span className="text-red-500">*</span></label>
                          <textarea
                            value={fila.resumen_narrativo}
                            onChange={(e) => {
                              const val = e.target.value
                              setForm((prev) => ({
                                ...prev,
                                marco_logico: prev.marco_logico.map((m) => m.nivel === fila.nivel ? { ...m, resumen_narrativo: val } : m),
                              }))
                            }}
                            rows={3}
                            className={textareaCls('marco_logico')}
                            placeholder="Describe el resumen narrativo para este nivel"
                          />
                          {hasError && <p className="text-xs text-red-500 mt-1 animate-fade-in">{hasError}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ink-muted mb-1">Indicadores</label>
                          <textarea
                            value={fila.indicadores}
                            onChange={(e) => {
                              const val = e.target.value
                              setForm((prev) => ({
                                ...prev,
                                marco_logico: prev.marco_logico.map((m) => m.nivel === fila.nivel ? { ...m, indicadores: val } : m),
                              }))
                            }}
                            rows={2}
                            className={textareaCls('marco_logico')}
                            placeholder="Indicadores de medición"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ink-muted mb-1">Medios de verificación</label>
                          <textarea
                            value={fila.medios_verificacion}
                            onChange={(e) => {
                              const val = e.target.value
                              setForm((prev) => ({
                                ...prev,
                                marco_logico: prev.marco_logico.map((m) => m.nivel === fila.nivel ? { ...m, medios_verificacion: val } : m),
                              }))
                            }}
                            rows={2}
                            className={textareaCls('marco_logico')}
                            placeholder="Medios de verificación"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ink-muted mb-1">Supuestos</label>
                          <textarea
                            value={fila.supuestos}
                            onChange={(e) => {
                              const val = e.target.value
                              setForm((prev) => ({
                                ...prev,
                                marco_logico: prev.marco_logico.map((m) => m.nivel === fila.nivel ? { ...m, supuestos: val } : m),
                              }))
                            }}
                            rows={2}
                            className={textareaCls('marco_logico')}
                            placeholder="Supuestos y factores externos"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <div className="pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CalendarDays size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink tracking-tight">Planificación y presupuesto</h2>
                  <p className="text-xs text-ink-muted mt-0.5">Marco lógico: planificación y recursos</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Fecha de inicio <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => update('fecha_inicio', e.target.value)}
                  className={inputCls('fecha_inicio')}
                />
                {errors.fecha_inicio && <p className="text-xs text-red-500 mt-1 animate-fade-in">{errors.fecha_inicio}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Fecha fin planificada <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={form.fecha_fin_planificada}
                  onChange={(e) => update('fecha_fin_planificada', e.target.value)}
                  className={inputCls('fecha_fin_planificada')}
                />
                {errors.fecha_fin_planificada && <p className="text-xs text-red-500 mt-1 animate-fade-in">{errors.fecha_fin_planificada}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Estrategias de ejecución <span className="text-red-500">*</span></label>
              <textarea
                value={form.estrategias_ejecucion}
                onChange={(e) => update('estrategias_ejecucion', e.target.value)}
                rows={4}
                className={textareaCls('estrategias_ejecucion')}
                placeholder="Describe cómo se ejecutará el proyecto: metodología, fases, recursos necesarios"
              />
              {errors.estrategias_ejecucion && <p className="text-xs text-red-500 mt-1 animate-fade-in">{errors.estrategias_ejecucion}</p>}
            </div>

            <div className="pt-4 border-t border-line space-y-3">
              <h3 className="text-sm font-semibold text-ink">Presupuesto estimado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">Aporte UNL valorado ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.monto_unl_valorado}
                    onChange={(e) => update('monto_unl_valorado', e.target.value)}
                    className={inputCls('monto_unl_valorado')}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">Aporte UNL económico ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.monto_unl_economico}
                    onChange={(e) => update('monto_unl_economico', e.target.value)}
                    className={inputCls('monto_unl_economico')}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">Aporte externo valorado ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.monto_externo_valorado}
                    onChange={(e) => update('monto_externo_valorado', e.target.value)}
                    className={inputCls('monto_externo_valorado')}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1">Aporte externo económico ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.monto_externo_economico}
                    onChange={(e) => update('monto_externo_economico', e.target.value)}
                    className={inputCls('monto_externo_economico')}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <p className="text-sm font-bold text-emerald-600">
                Total del proyecto: ${(
                  Number(form.monto_unl_valorado || 0) +
                  Number(form.monto_unl_economico || 0) +
                  Number(form.monto_externo_valorado || 0) +
                  Number(form.monto_externo_economico || 0)
                ).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Seguimiento y evaluación <span className="text-red-500">*</span></label>
              <textarea
                value={form.seguimiento_evaluacion}
                onChange={(e) => update('seguimiento_evaluacion', e.target.value)}
                rows={4}
                className={textareaCls('seguimiento_evaluacion')}
                placeholder="Describe el proceso de seguimiento y evaluación: periodicidad de monitoreo, quién evalúa, cómo se reportará el avance"
              />
              {errors.seguimiento_evaluacion && <p className="text-xs text-red-500 mt-1 animate-fade-in">{errors.seguimiento_evaluacion}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Observaciones</label>
              <textarea
                value={form.observaciones}
                onChange={(e) => update('observaciones', e.target.value)}
                rows={3}
                className={textareaCls('observaciones')}
                placeholder="Observaciones adicionales (opcional)"
              />
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <div className="pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink tracking-tight">Responsables y firmas</h2>
                  <p className="text-xs text-ink-muted mt-0.5">Responsables y firmas de responsabilidad</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Responsable <span className="text-red-500">*</span></label>
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
                {errors.responsable && <p className="text-xs text-red-500 mt-1 animate-fade-in">{errors.responsable}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Coordinador académico</label>
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

            {(() => {
              const responsable = docentes.find((d) => String(d.id) === form.responsable)
              if (!responsable) return null
              return (
                <div className="rounded-card p-4 flex items-start gap-3" style={{ background: '#F9FAFB', border: '0.5px solid #E5E7EB' }}>
                  <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-xl bg-white text-emerald-600" style={{ border: '0.5px solid #E5E7EB' }}>
                    <UserCircle size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-ink">Datos del responsable</h4>
                    <p className="text-[11px] text-ink-muted mt-0.5">Información obtenida del perfil del docente seleccionado.</p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.06em]">Cédula</p>
                        <p className="text-[13px] text-ink font-semibold mt-0.5">{responsable.documento_identidad || 'No registrado'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.06em]">Correo</p>
                        <p className="text-[13px] text-ink font-semibold mt-0.5 break-all">{responsable.user_email || 'No registrado'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.06em]">Teléfono</p>
                        <p className={`text-[13px] mt-0.5 ${responsable.telefono ? 'text-ink font-semibold' : 'text-ink-light italic font-normal'}`}>
                          {responsable.telefono || 'No registrado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.06em]">Carrera</p>
                        <p className={`text-[13px] mt-0.5 ${responsable.carrera?.nombre ? 'text-ink font-semibold' : 'text-ink-light italic font-normal'}`}>
                          {responsable.carrera?.nombre || 'Sin carrera asignada'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            <div className="rounded-card border border-line bg-bg-soft p-4 flex items-start gap-3">
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-xl bg-white border border-line text-emerald-600">
                <FileText size={15} />
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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                      <Check size={11} strokeWidth={3} /> Firma de Responsable
                    </span>
                  )}
                  {form.coordinador_academico && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                      <Check size={11} strokeWidth={3} /> Firma de Coordinador
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg-muted text-ink-muted font-semibold border border-line">
                    Firma de Aprobador (asignada al aprobar)
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-card border border-line bg-bg-soft p-4 flex items-start gap-3">
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-xl bg-white border border-line text-emerald-600">
                <Users size={15} />
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

        {step === 7 && (
          <>
            <div className="pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink tracking-tight">Resumen del proyecto</h2>
                  <p className="text-xs text-ink-muted mt-0.5">Revisa la información antes de guardar. Una vez enviado a revisión no podrás editarlo.</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 mt-2 text-[10px] font-semibold uppercase tracking-wider bg-bg-muted text-ink-muted border border-line" style={{ borderRadius: '3px' }}>
                Borrador
              </span>
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
                className="group cursor-pointer text-center rounded-card transition-all duration-200 border-2 border-dashed border-line bg-bg-soft hover:border-emerald-400 hover:bg-emerald-50/40 py-9 px-6"
              >
                <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-2xl bg-white border border-line text-ink-light group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors mb-3">
                  <Upload size={22} />
                </div>
                <p className="text-sm font-medium text-ink">Arrastra documentos o haz clic para seleccionar</p>
                <p className="text-xs text-ink-muted mt-1">PDF, DOCX, XLSX o imágenes · Máx. {ANEXO_MAX_COUNT} archivos · 10MB c/u</p>
              </div>
              {anexoError && <p className="text-xs text-red-500 mt-2 animate-fade-in">{anexoError}</p>}

              {form.anexos.length > 0 && (
                <ul className="mt-3 border border-line rounded-card divide-y divide-line shadow-xs overflow-hidden">
                  {form.anexos.map((a) => (
                    <li key={a._key} className="flex items-center gap-3 px-3 py-2.5 hover:bg-bg-soft/50 transition-colors">
                      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 flex-shrink-0">
                        <FileText size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{a.name}</p>
                        <p className="text-xs text-ink-muted">{formatBytes(a.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarAnexo(a._key)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                        title="Quitar"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-4 border-t border-line space-y-3">
              <h3 className="text-sm font-semibold text-ink">Tarjetas de resumen</h3>

              <SummaryCard icon={<ClipboardList size={14} />} title="Datos del proyecto" defaultOpen>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <SummaryField label="Tipo" value={TIPO_PROYECTO_LABELS[form.tipo] || form.tipo} />
                  <SummaryField label="Prioridad" value={PRIORIDAD_LABELS[form.prioridad] || form.prioridad} />
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.06em]">Título</p>
                    <p className="text-[13px] text-ink font-semibold mt-0.5">{form.titulo || '—'}</p>
                  </div>
                  <SummaryField label="Carrera" value={(() => { const firstId = form.carreras[0]; return firstId ? (carreras.find((c) => String(c.id) === firstId)?.nombre || '—') : '—' })()} />
                  {form.periodo_academico && <SummaryField label="Período" value={form.periodo_academico} />}
                  <SummaryField label="Fecha inicio" value={form.fecha_inicio || '—'} />
                  <SummaryField label="Fecha fin" value={form.fecha_fin_planificada || '—'} />
                </div>
              </SummaryCard>

              <SummaryCard icon={<Wallet size={14} />} title="Presupuesto" defaultOpen>
                <p className="text-xl font-bold text-emerald-700 mb-3 tabular-nums">
                  ${(
                    Number(form.monto_unl_valorado || 0) +
                    Number(form.monto_unl_economico || 0) +
                    Number(form.monto_externo_valorado || 0) +
                    Number(form.monto_externo_economico || 0)
                  ).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <SummaryField label="UNL valorado" value={`$${Number(form.monto_unl_valorado || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`} />
                  <SummaryField label="UNL económico" value={`$${Number(form.monto_unl_economico || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`} />
                  <SummaryField label="Externo valorado" value={`$${Number(form.monto_externo_valorado || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`} />
                  <SummaryField label="Externo económico" value={`$${Number(form.monto_externo_economico || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`} />
                </div>
              </SummaryCard>

              <SummaryCard icon={<Target size={14} />} title="Marco lógico" defaultOpen>
                <div className="space-y-2">
                  {form.marco_logico.map((m) => (
                    <div key={m._key} className="flex items-start gap-3 text-sm">
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-bg-soft text-ink-muted border border-line flex-shrink-0" style={{ borderRadius: '2px', minWidth: 80, justifyContent: 'center' }}>
                        {m.nivel}
                      </span>
                      <p className="text-[13px] text-ink leading-relaxed line-clamp-1">{m.resumen_narrativo || '—'}</p>
                    </div>
                  ))}
                </div>
              </SummaryCard>

              <SummaryCard icon={<Users size={14} />} title="Equipo" defaultOpen>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(() => { const d = docentes.find((x) => String(x.id) === form.responsable); return d ? `${(d.user_first_name?.[0] || '')}${(d.user_last_name?.[0] || '')}` : '?' })()}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.06em]">Responsable</p>
                      <p className="text-[13px] text-ink font-semibold mt-0.5">
                        {(() => { const d = docentes.find((x) => String(x.id) === form.responsable); return d ? `${d.user_first_name} ${d.user_last_name}` : 'No asignado' })()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(() => { const c = coordinadores.find((x) => String(x.id) === form.coordinador_academico); return c ? `${(c.user_first_name?.[0] || '')}${(c.user_last_name?.[0] || '')}` : '?' })()}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.06em]">Coordinador</p>
                      <p className="text-[13px] text-ink font-semibold mt-0.5">
                        {(() => { const c = coordinadores.find((x) => String(x.id) === form.coordinador_academico); return c ? `${c.user_first_name} ${c.user_last_name}` : 'No asignado' })()}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.06em]">Beneficiarios</p>
                    <p className="text-[13px] text-ink font-semibold mt-0.5">
                      {form.beneficiarios.length} registrados ({form.beneficiarios.filter((b) => b.tipo === 'DIRECTO').length} directos, {form.beneficiarios.filter((b) => b.tipo === 'INDIRECTO').length} indirectos)
                    </p>
                  </div>
                  {form.instituciones_participantes.trim() && (
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.06em] mb-1.5">Instituciones</p>
                      <div className="flex flex-wrap gap-1.5">
                        {form.instituciones_participantes.split('\n').map((s) => s.trim()).filter(Boolean).map((nombre, idx) => (
                          <span key={idx} className="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200" style={{ borderRadius: 0 }}>
                            {nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SummaryCard>

              <SummaryCard icon={<Paperclip size={14} />} title="Alineación y Anexos" defaultOpen>
                <div className="space-y-3">
                  {form.alineaciones.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.06em] mb-1.5">Alineaciones ({form.alineaciones.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {form.alineaciones.map((a, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-bg-soft text-ink-muted border border-line" style={{ borderRadius: '2px' }}>
                            {a.eje || `Alineación ${i + 1}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {form.anexos.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.06em] mb-1.5">Anexos ({form.anexos.length})</p>
                      <ul className="space-y-1">
                        {form.anexos.map((a) => (
                          <li key={a._key} className="flex items-center gap-2 text-sm">
                            <FileText size={13} className="text-emerald-600 flex-shrink-0" />
                            <span className="text-ink truncate text-[13px]">{a.name}</span>
                            <span className="text-[11px] text-ink-muted flex-shrink-0">{formatBytes(a.size)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {form.alineaciones.length === 0 && form.anexos.length === 0 && (
                    <p className="text-[13px] text-ink-muted">Sin alineaciones ni anexos registrados</p>
                  )}
                </div>
              </SummaryCard>
            </div>

            <label className="flex items-start gap-3 pt-2 cursor-pointer rounded-card p-3 border border-line hover:bg-bg-soft/40 transition-colors">
              <input
                type="checkbox"
                checked={confirmAck}
                onChange={(e) => {
                  setConfirmAck(e.target.checked)
                  if (e.target.checked && errors.confirm) {
                    setErrors((prev) => { const { confirm: _c, ...rest } = prev; return rest })
                  }
                }}
                className="mt-0.5 h-4 w-4 accent-emerald-600 rounded"
              />
              <span className="text-sm text-ink">
                Confirmo que los datos son correctos y se ajustan a la normativa institucional de la UNL <span className="text-red-500">*</span>
              </span>
            </label>
            {errors.confirm && <p className="text-xs text-red-500 -mt-2 animate-fade-in">{errors.confirm}</p>}
          </>
        )}
      </div>

      <div className="flex items-center justify-between pt-5 mt-5 border-t border-line">
        <button
          onClick={handlePrev}
          disabled={step === 1}
          className="inline-flex items-center gap-2 h-10 px-4 text-sm font-semibold rounded-btn border border-line bg-white text-ink hover:bg-bg-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft size={15} />
          Anterior
        </button>
        <div className="flex items-center gap-3">
          {step < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 h-10 px-5 text-sm font-semibold rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 btn-glow transition-all"
            >
              Siguiente
              <ArrowRight size={15} />
            </button>
          ) : (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="inline-flex items-center gap-2 h-10 px-4 text-sm font-semibold rounded-btn border border-emerald-600 text-emerald-700 bg-white hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar como borrador'}
              </button>
              <button
                onClick={handleSaveAndSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 h-10 px-5 text-sm font-semibold rounded-btn bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 btn-glow disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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

