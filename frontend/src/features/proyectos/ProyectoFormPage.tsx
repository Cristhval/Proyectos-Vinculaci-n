import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Pencil, Plus, Trash2, Wand2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { proyectosApi, beneficiariosApi, alineacionesApi, anexosApi, marcoLogicoApi, firmasApi } from '@/api/proyectos'
import { carrerasApi, usuariosApi } from '@/api/usuarios'
import { useAuthStore } from '@/store/authStore'
import { Button, ConfirmModal, Modal } from '@/components/ui'
import { Bloque } from '@/components/panel/Bloques'
import SelectorCarreras from '@/components/carreras/SelectorCarreras'
import { TIPO_PROYECTO_LABELS, PRIORIDAD_LABELS } from '@/lib/constants'
import type { Beneficiario, AlineacionEstrategica } from '@/types/proyectos'
import type { Carrera, Usuario } from '@/types/usuarios'
import {
  ALINEACION_VACIA, BENEFICIARIO_VACIO, EJES_IGUALDAD, FASES, LINEAS_INVESTIGACION, MAX_CARRERAS,
  NIVELES_MARCO, NIVEL_INFO, ODS, PERIODOS, PRIORIDADES, PROGRAMAS_VINCULACION, TIPOS, TOTAL_FASES,
  formularioVacio, marcoLogicoVacio, tieneDatos, totalPresupuesto, uid,
  type AnexoFile, type FormState, type MarcoLogicoItem, type NivelMarco,
} from './formulario/tipos'
import { erroresDeFase } from './formulario/validacion'
import { Campo, Dato, IndicadorFases, Seccion, claseInput, claseSelect, claseTextarea } from './formulario/ui'
import { rellenoDemoHabilitado } from './demo/habilitado'

const ANEXO_MAX_COUNT = 5
const ANEXO_MAX_SIZE = 10 * 1024 * 1024
const ANEXO_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg', 'image/png', 'image/webp',
]
const IMAGEN_MIMES = ['image/jpeg', 'image/png', 'image/webp']

const dinero = (n: number) => `$${n.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const nombreDe = (u?: Usuario) => (u ? `${u.user_first_name} ${u.user_last_name}`.trim() : '')
const ejeIgualdadLabel = (v: string) => EJES_IGUALDAD.find((e) => e.value === v)?.label ?? ''

export default function ProyectoFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const isEdit = Boolean(id)

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(formularioVacio)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [confirmAck, setConfirmAck] = useState(false)

  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [carrerasCargando, setCarrerasCargando] = useState(true)
  const [docentes, setDocentes] = useState<Usuario[]>([])
  const [coordinadores, setCoordinadores] = useState<Usuario[]>([])
  const [modalAction, setModalAction] = useState<'draft' | 'submit' | null>(null)
  const [loadingData, setLoadingData] = useState(isEdit)
  const [proyectoEstado, setProyectoEstado] = useState<string>('')
  const [confirmarRelleno, setConfirmarRelleno] = useState(false)
  const [nivelActivo, setNivelActivo] = useState<NivelMarco>('FIN')

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

  const mostrarRelleno = rellenoDemoHabilitado(user?.rol)

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

  const basePath = `/${(user?.rol || 'estudiante').toLowerCase()}/proyectos`
  const formatosPath = `/${(user?.rol || 'estudiante').toLowerCase()}/formatos`

  useEffect(() => {
    const savedStep = (location.state as { step?: number })?.step
    if (savedStep && savedStep >= 1 && savedStep <= TOTAL_FASES) {
      setStep(savedStep)
    }
  }, [location.state])

  useEffect(() => {
    carrerasApi.list({ page_size: '100' })
      .then(({ data }) => setCarreras(data.results))
      .finally(() => setCarrerasCargando(false))
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

        let marcoLogicoInicial: MarcoLogicoItem[] = marcoLogicoVacio()
        try {
          const { data: mlData } = await marcoLogicoApi.list({ proyecto: String(id), page_size: '100' })
          const fetched = mlData.results
          if (fetched.length > 0) {
            marcoLogicoInicial = marcoLogicoVacio()
            for (const f of fetched) {
              const idx = marcoLogicoInicial.findIndex((m) => m.nivel === f.nivel)
              if (idx !== -1) {
                marcoLogicoInicial[idx] = { id: f.id, _key: marcoLogicoInicial[idx]!._key, nivel: f.nivel, resumen_narrativo: f.resumen_narrativo || '', indicadores: f.indicadores || '', medios_verificacion: f.medios_verificacion || '', supuestos: f.supuestos || '' }
              }
            }
          }
        } catch { /* silencioso */ }

        setForm({
          ...formularioVacio(),
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
            eje: a.eje || '',
            objetivo_estrategico: a.objetivo_estrategico || '',
            programa: a.programa || '',
            plan: a.plan || '',
            descripcion: a.descripcion || '',
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
        })
        setImagenPreview(p.imagen_portada || null)
        setClearImagen(false)
      } catch {
        toast.error('Error al cargar el proyecto')
        navigate(basePath)
      } finally {
        setLoadingData(false)
      }
    }
    void cargar()
  }, [id, isEdit])

  const limpiarError = (campo: string) => {
    setErrors((prev) => {
      if (!(campo in prev)) return prev
      const next = { ...prev }
      delete next[campo]
      return next
    })
  }

  const update = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value as never }))
    limpiarError(field)
  }

  const mostrarErrores = (s: number, e: Record<string, string>) => {
    setErrors(e)
    if (s === 4) {
      const nivel = NIVELES_MARCO.find((n) => e[`marco_logico.${n}`])
      if (nivel) setNivelActivo(nivel)
    }
  }

  const validateStep = (s: number): boolean => {
    const e = erroresDeFase(s, form, confirmAck)
    mostrarErrores(s, e)
    return Object.keys(e).length === 0
  }

  const validateAll = (): boolean => {
    const allErrors: Record<string, string> = {}
    for (let i = 1; i <= TOTAL_FASES; i++) Object.assign(allErrors, erroresDeFase(i, form, confirmAck))
    setErrors(allErrors)
    if (Object.keys(allErrors).length > 0) {
      toast.error(allErrors.confirm ? 'Debes confirmar que los datos son correctos' : 'Completa los campos obligatorios antes de continuar')
      return false
    }
    return true
  }

  const handleNext = async () => {
    if (!validateStep(step)) {
      toast.error(step === 7 && !confirmAck ? 'Debes confirmar que los datos son correctos' : 'Revisa los campos marcados en rojo')
      return
    }
    if (step === TOTAL_FASES) return
    setSaving(true)
    try {
      await persistDraft({ redirectOnCreate: true, incluirAnexos: false, showToast: false })
      if (isEdit) {
        setStep((s) => Math.min(TOTAL_FASES, s + 1))
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }
  const handlePrev = () => setStep((s) => Math.max(1, s - 1))
  const goToStep = (s: number) => {
    if (s < step) { setStep(s); return }
    for (let i = step; i < s; i++) {
      const e = erroresDeFase(i, form, confirmAck)
      if (Object.keys(e).length > 0) {
        mostrarErrores(i, e)
        setStep(i)
        toast.error(`Revisa la fase ${FASES[i - 1]?.label ?? i}: hay campos obligatorios incompletos`)
        return
      }
    }
    setStep(s)
  }

  // --- Rellenar IA (datos de prueba, solo ADMIN con VITE_HABILITAR_RELLENO_DEMO=true) ---

  const rellenar = async () => {
    // Carga diferida: el generador y sus textos solo se descargan si se usa el botón.
    const { generarProyectoDemo } = await import('./demo/GeneradorProyectoDemo')
    const { form: generado, avisos } = generarProyectoDemo({
      carreras, docentes, coordinadores, instituciones: institucionesCatalogo,
    })
    setForm((prev) => ({
      ...generado,
      // Conserva los IDs de filas ya guardadas para que el marco lógico se actualice, no se duplique.
      marco_logico: generado.marco_logico.map((m) => ({ ...m, id: prev.marco_logico.find((p) => p.nivel === m.nivel)?.id })),
    }))
    setErrors({})
    setConfirmAck(false)
    setNivelActivo('FIN')
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.success('Formulario rellenado con datos de prueba. Revisa cada fase antes de guardar.')
    avisos.forEach((a) => toast(a, { icon: '⚠️', duration: 6000 }))
  }

  const pedirRelleno = () => {
    if (tieneDatos(form)) setConfirmarRelleno(true)
    else void rellenar()
  }

  const buildPayload = () => {
    const { carreras, responsable, coordinador_academico, instituciones_participantes, descripcion } = form
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
      viabilidad: form.viabilidad.trim(),
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin_planificada: form.fecha_fin_planificada || null,
      estrategias_ejecucion: form.estrategias_ejecucion.trim(),
      seguimiento_evaluacion: form.seguimiento_evaluacion.trim(),
      observaciones: form.observaciones.trim(),
      presupuesto_aprobado: String(totalPresupuesto(form)),
      monto_unl_valorado: form.monto_unl_valorado || '0',
      monto_unl_economico: form.monto_unl_economico || '0',
      monto_externo_valorado: form.monto_externo_valorado || '0',
      monto_externo_economico: form.monto_externo_economico || '0',
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
      carreras.forEach((cid) => formData.append('carreras_ids', cid))
    }

    if (imagenPortada) {
      formData.append('imagen_portada', imagenPortada)
    }

    return formData
  }

  const guardarHijos = async (proyectoId: number, options: { incluirAnexos?: boolean } = {}) => {
    const { incluirAnexos = true } = options
    const errores: string[] = []

    await Promise.all(
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

    const idsMarcoLogico: Record<string, number> = {}
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
          const datos = {
            proyecto: proyectoId,
            nivel: m.nivel,
            resumen_narrativo: m.resumen_narrativo.trim(),
            indicadores: m.indicadores.trim(),
            medios_verificacion: m.medios_verificacion.trim(),
            supuestos: m.supuestos.trim(),
          }
          if (idExistente) await marcoLogicoApi.update(idExistente, datos)
          else await marcoLogicoApi.create(datos)
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

    if (incluirAnexos) {
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
    }

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
    setModalAction('draft')
  }

  const handleSaveAndSubmit = () => {
    if (!validateAll()) return
    if (isEdit && proyectoEstado && proyectoEstado !== 'BORRADOR') {
      toast.error('Solo se pueden enviar a revisión los proyectos en estado Borrador')
      return
    }
    setModalAction('submit')
  }

  const extractErrorMessage = (err: unknown): string => {
    const e = err as { response?: { data?: unknown }; message?: string }
    const data = e?.response?.data
    const msg = (data as { message?: string; detail?: string })?.message
      || (data as { detail?: string })?.detail
      || e?.message
    if (msg) return msg
    if (data && typeof data === 'object') {
      const firstError = Object.values(data).flat()[0]
      return firstError ? String(firstError) : 'Error al guardar'
    }
    return 'Error al guardar'
  }

  const persistDraft = async (options: { redirectOnCreate?: boolean; incluirAnexos?: boolean; showToast?: boolean } = {}): Promise<number | undefined> => {
    const { redirectOnCreate = false, incluirAnexos = true, showToast = false } = options
    const formData = buildPayload()

    // Al crear un borrador automáticamente, asignamos al usuario actual como
    // responsable temporal para que pueda visualizarlo/cargarlo posteriormente.
    if (!isEdit && !form.responsable && user?.id) {
      formData.append('responsable_id', String(user.id))
    }

    let proyectoId: number | undefined

    if (isEdit && id) {
      await proyectosApi.updateWithFormData(Number(id), formData)
      proyectoId = Number(id)
      await eliminarHijosPrevios(proyectoId)
      await guardarHijos(proyectoId, { incluirAnexos })
    } else {
      formData.append('estado', 'BORRADOR')
      const { data } = await proyectosApi.createWithFormData(formData)
      proyectoId = (data as unknown as { id: number }).id
      await guardarHijos(proyectoId, { incluirAnexos })
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

    if (redirectOnCreate && !isEdit && proyectoId) {
      navigate(`/${user?.rol?.toLowerCase() || 'docente'}/proyectos/${proyectoId}/editar`, {
        state: { step: Math.min(TOTAL_FASES, step + 1) },
      })
      return proyectoId
    }

    if (showToast) {
      toast.success(isEdit ? 'Borrador actualizado' : 'Borrador guardado')
    }

    return proyectoId
  }

  const executeAction = async () => {
    setSaving(true)
    try {
      const proyectoId = await persistDraft({ incluirAnexos: true })
      if (!proyectoId) throw new Error('No se pudo obtener el ID del proyecto')

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
      console.error('Error en executeAction:', (err as { response?: { data?: unknown } })?.response?.data)
      toast.error(extractErrorMessage(err))
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

  const cerrarEditorBeneficiario = () => {
    setBeneficiarioEditIdx(null)
    setBeneficiarioEditorOpen(false)
    setBeneficiarioDraftError('')
  }

  const guardarBeneficiario = () => {
    if (!beneficiarioDraft.nombre.trim()) {
      setBeneficiarioDraftError('Escribe el nombre o la descripción del grupo.')
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
    cerrarEditorBeneficiario()
    setBeneficiarioDraft({ ...BENEFICIARIO_VACIO })
    limpiarError('beneficiarios')
  }

  const eliminarBeneficiario = (idx: number) => {
    setForm((prev) => ({ ...prev, beneficiarios: prev.beneficiarios.filter((_, i) => i !== idx) }))
  }

  const abrirEditorAlineacion = (idx: number | null) => {
    if (idx === null) {
      setAlineacionDraft({ ...ALINEACION_VACIA })
    } else {
      const { _key, id: _id, ...a } = form.alineaciones[idx]!
      setAlineacionDraft({ ...ALINEACION_VACIA, ...a })
    }
    setAlineacionDraftError('')
    setAlineacionEditIdx(idx)
    setAlineacionEditorOpen(true)
  }

  const cerrarEditorAlineacion = () => {
    setAlineacionEditIdx(null)
    setAlineacionEditorOpen(false)
    setAlineacionDraftError('')
  }

  const guardarAlineacion = () => {
    const errores: string[] = []
    if (!alineacionDraft.eje.trim()) errores.push('Completa el eje estratégico')
    else if (/\d/.test(alineacionDraft.eje.trim())) errores.push('El eje estratégico no debe contener números')
    if (!alineacionDraft.objetivo_estrategico.trim()) errores.push('Completa el objetivo estratégico')
    else if (alineacionDraft.objetivo_estrategico.trim().length < 30) errores.push('El objetivo estratégico debe tener mínimo 30 caracteres')
    if (!alineacionDraft.programa.trim()) errores.push('Completa el programa')
    if (!alineacionDraft.plan.trim()) errores.push('Completa el plan')
    if (errores.length > 0) {
      setAlineacionDraftError(`${errores.join('. ')}.`)
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
    cerrarEditorAlineacion()
    setAlineacionDraft({ ...ALINEACION_VACIA })
    limpiarError('alineaciones')
  }

  const eliminarAlineacion = (idx: number) => {
    setForm((prev) => ({ ...prev, alineaciones: prev.alineaciones.filter((_, i) => i !== idx) }))
  }

  const seleccionarImagen = (file: File | null) => {
    if (!file) return
    setImagenError('')
    if (!IMAGEN_MIMES.includes(file.type)) {
      setImagenError('Solo se permiten imágenes JPG, PNG o WebP.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setImagenError('La imagen no debe superar 5 MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setImagenPortada(file)
    setImagenPreview(URL.createObjectURL(file))
    setClearImagen(false)
  }

  const seleccionarAnexos = (files: FileList | null) => {
    if (!files || files.length === 0) return
    setAnexoError('')
    const nuevos: AnexoFile[] = []
    const restantes = ANEXO_MAX_COUNT - form.anexos.length
    if (restantes <= 0) {
      setAnexoError(`Máximo ${ANEXO_MAX_COUNT} archivos.`)
      return
    }
    const aceptados = Array.from(files).slice(0, restantes)
    for (const f of aceptados) {
      if (!ANEXO_MIMES.includes(f.type)) {
        setAnexoError(`"${f.name}" no es un formato permitido.`)
        continue
      }
      if (f.size > ANEXO_MAX_SIZE) {
        setAnexoError(`"${f.name}" supera los 10 MB.`)
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

  const cambiarMarco = (nivel: string, campo: 'resumen_narrativo' | 'indicadores' | 'medios_verificacion' | 'supuestos', valor: string) => {
    setForm((prev) => ({
      ...prev,
      marco_logico: prev.marco_logico.map((m) => (m.nivel === nivel ? { ...m, [campo]: valor } : m)),
    }))
    if (campo === 'resumen_narrativo') limpiarError(`marco_logico.${nivel}`)
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-line border-t-ink" />
      </div>
    )
  }

  const instituciones = form.instituciones_participantes.split('\n').map((s) => s.trim()).filter(Boolean)
  const agregarInstitucion = (nombre: string) => {
    if (nombre && !instituciones.includes(nombre)) update('instituciones_participantes', [...instituciones, nombre].join('\n'))
  }
  const responsableSel = docentes.find((d) => String(d.id) === form.responsable)
  const coordinadorSel = coordinadores.find((c) => String(c.id) === form.coordinador_academico)
  const total = totalPresupuesto(form)
  const filaMarco = form.marco_logico.find((m) => m.nivel === nivelActivo)
  const faseActual = FASES[step - 1]!
  const montos = [
    { campo: 'monto_unl_valorado', etiqueta: 'UNL valorado' },
    { campo: 'monto_unl_economico', etiqueta: 'UNL económico' },
    { campo: 'monto_externo_valorado', etiqueta: 'Externo valorado' },
    { campo: 'monto_externo_economico', etiqueta: 'Externo económico' },
  ] as const

  return (
    <div className="mx-auto max-w-4xl">
      <button
        onClick={() => navigate(basePath)}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} />
        Volver a proyectos
      </button>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-ink">
            {isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Metodología de marco lógico de la Coordinación de Vinculación.{' '}
            <button type="button" onClick={() => navigate(formatosPath)} className="font-medium text-ink underline-offset-2 hover:underline">
              Ver guía en Formatos
            </button>
          </p>
        </div>
        {mostrarRelleno && (
          <Button variant="outline" size="sm" icon={<Wand2 size={14} />} onClick={pedirRelleno} title="Llena las 7 fases con datos de prueba">
            Rellenar IA
          </Button>
        )}
      </div>

      <div className="mt-6">
        <IndicadorFases actual={step} onIr={goToStep} />
      </div>

      <div className="mt-4">
        <Bloque titulo={`${step}. ${faseActual.titulo}`}>
          <div className="space-y-8 px-5 py-6 sm:px-6">
            {step === 1 && (
              <>
                <Seccion titulo="Identificación">
                  <Campo
                    etiqueta="Título" obligatorio ancho htmlFor="titulo" error={errors.titulo}
                    contador={`${form.titulo.length}/255`}
                  >
                    <input id="titulo" value={form.titulo} onChange={(e) => update('titulo', e.target.value)} className={claseInput(errors.titulo)} maxLength={255} />
                  </Campo>
                  <Campo etiqueta="Tipo" obligatorio htmlFor="tipo">
                    <select id="tipo" value={form.tipo} onChange={(e) => update('tipo', e.target.value)} className={claseSelect()}>
                      {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Campo>
                  <Campo etiqueta="Prioridad" obligatorio htmlFor="prioridad">
                    <select id="prioridad" value={form.prioridad} onChange={(e) => update('prioridad', e.target.value)} className={claseSelect()}>
                      {PRIORIDADES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </Campo>
                  <Campo etiqueta="Período académico" htmlFor="periodo">
                    <select id="periodo" value={form.periodo_academico} onChange={(e) => update('periodo_academico', e.target.value)} className={claseSelect()}>
                      <option value="">Sin período</option>
                      {PERIODOS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Campo>
                  <Campo etiqueta="Línea de intervención" htmlFor="linea">
                    <input id="linea" value={form.linea_intervencion} onChange={(e) => update('linea_intervencion', e.target.value)} className={claseInput()} placeholder="Ej.: Salud comunitaria" />
                  </Campo>
                </Seccion>

                <Seccion titulo="Carreras participantes" columnas={false}>
                  <SelectorCarreras
                    id="carreras"
                    carreras={carreras}
                    cargando={carrerasCargando}
                    seleccionadas={form.carreras}
                    maximo={MAX_CARRERAS}
                    error={errors.carreras}
                    onCambiar={(ids) => { setForm((prev) => ({ ...prev, carreras: ids })); limpiarError('carreras') }}
                  />
                </Seccion>

                <Seccion titulo="Resumen y descripción" columnas={false}>
                  <Campo
                    etiqueta="Resumen" obligatorio htmlFor="resumen" error={errors.resumen}
                    ayuda="Mínimo 50 caracteres." contador={`${form.resumen.trim().length} caracteres`}
                  >
                    <textarea id="resumen" value={form.resumen} onChange={(e) => update('resumen', e.target.value)} rows={3} className={claseTextarea(errors.resumen)} />
                  </Campo>
                  <Campo etiqueta="Descripción" htmlFor="descripcion" error={errors.descripcion} ayuda="Opcional. Si la escribes, mínimo 30 caracteres.">
                    <textarea id="descripcion" value={form.descripcion} onChange={(e) => update('descripcion', e.target.value)} rows={3} className={claseTextarea(errors.descripcion)} />
                  </Campo>
                </Seccion>

                <Seccion titulo="Imagen de portada" columnas={false}>
                  <input
                    type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={(e) => seleccionarImagen(e.target.files?.[0] || null)}
                  />
                  {imagenPreview ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <img src={imagenPreview} alt="Portada del proyecto" className="h-28 w-full rounded-btn border border-line object-cover sm:w-48" />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Cambiar</Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => {
                            setImagenPortada(null)
                            setImagenPreview(null)
                            setImagenError('')
                            setClearImagen(isEdit)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                        >
                          Quitar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); seleccionarImagen(e.dataTransfer.files?.[0] || null) }}
                      className="w-full rounded-btn border border-dashed border-line-strong px-4 py-5 text-left text-sm text-ink-muted transition-colors hover:border-ink hover:text-ink"
                    >
                      <span className="font-medium text-ink">Elegir imagen</span> o arrástrala aquí · JPG, PNG o WebP, hasta 5 MB (opcional)
                    </button>
                  )}
                  {imagenError && <p className="text-xs text-red-600">{imagenError}</p>}
                </Seccion>
              </>
            )}

            {step === 2 && (
              <>
                <Seccion
                  titulo="Alineaciones"
                  columnas={false}
                  accion={<Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => abrirEditorAlineacion(null)}>Agregar</Button>}
                >
                  {errors.alineaciones && <p className="text-xs text-red-600">{errors.alineaciones}</p>}
                  {form.alineaciones.length === 0 ? (
                    <p className="text-sm text-ink-muted">Aún no hay alineaciones. Agrega al menos una con su eje y objetivo estratégico.</p>
                  ) : (
                    <ul className="divide-y divide-line border-y border-line">
                      {form.alineaciones.map((a, i) => {
                        const error = errors[`alineaciones.${i}`]
                        const extras = [a.programa, a.plan, a.linea_investigacion, a.programa_vinculacion, ejeIgualdadLabel(a.eje_plan_igualdad), a.ods].filter(Boolean)
                        return (
                          <li key={a._key} className="flex items-start gap-3 py-3">
                            <span className="mt-0.5 w-5 flex-shrink-0 text-sm tabular-nums text-ink-light">{i + 1}.</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-ink">{a.eje}</p>
                              <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">{a.objetivo_estrategico}</p>
                              {extras.length > 0 && <p className="mt-1 text-xs text-ink-light">{extras.join(' · ')}</p>}
                              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                            </div>
                            <div className="flex flex-shrink-0 gap-1">
                              <button type="button" onClick={() => abrirEditorAlineacion(i)} className="rounded p-1.5 text-ink-muted hover:bg-bg-soft hover:text-ink" aria-label={`Editar alineación ${i + 1}`}><Pencil size={15} /></button>
                              <button type="button" onClick={() => eliminarAlineacion(i)} className="rounded p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600" aria-label={`Eliminar alineación ${i + 1}`}><Trash2 size={15} /></button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </Seccion>

                <Seccion titulo="Instituciones participantes">
                  {instituciones.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 md:col-span-2">
                      {instituciones.map((nombre, idx) => (
                        <span key={`${nombre}-${idx}`} className="inline-flex items-center gap-1 rounded-full border border-line bg-bg-soft py-0.5 pl-2.5 pr-1 text-xs text-ink">
                          {nombre}
                          <button
                            type="button"
                            onClick={() => update('instituciones_participantes', instituciones.filter((_, i) => i !== idx).join('\n'))}
                            className="rounded-full p-0.5 text-ink-muted hover:bg-white hover:text-ink"
                            aria-label={`Quitar ${nombre}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <Campo etiqueta="Buscar institución registrada" htmlFor="inst-buscar">
                    <div className="relative">
                      <input
                        id="inst-buscar" value={instBusqueda}
                        onChange={(e) => { setInstBusqueda(e.target.value); setInstResultados([]) }}
                        className={claseInput()} placeholder="Nombre o sigla"
                      />
                      {instBusqueda.length >= 2 && (
                        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-btn border border-line bg-white shadow-lg">
                          {instBusquedaLoading && <p className="p-3 text-xs text-ink-muted">Buscando…</p>}
                          {!instBusquedaLoading && instResultados.length === 0 && <p className="p-3 text-xs text-ink-muted">Sin resultados.</p>}
                          {!instBusquedaLoading && instResultados.map((inst) => {
                            const ya = instituciones.includes(inst.nombre)
                            return (
                              <button
                                key={inst.id} type="button" disabled={ya}
                                onClick={() => { agregarInstitucion(inst.nombre); setInstBusqueda(''); setInstResultados([]) }}
                                className="block w-full border-b border-line px-3 py-2 text-left text-sm last:border-0 hover:bg-bg-soft disabled:cursor-not-allowed disabled:text-ink-light"
                              >
                                <span className="text-ink">{inst.nombre}</span>
                                {inst.sigla && <span className="ml-1.5 text-xs text-ink-muted">{inst.sigla}</span>}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </Campo>
                  <Campo etiqueta="Agregar institución no registrada" htmlFor="inst-libre">
                    <div className="flex gap-2">
                      <input
                        id="inst-libre" value={instLibre}
                        onChange={(e) => setInstLibre(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && instLibre.trim()) { e.preventDefault(); agregarInstitucion(instLibre.trim()); setInstLibre('') }
                        }}
                        className={claseInput()} placeholder="Nombre de la institución"
                      />
                      <Button variant="outline" size="sm" disabled={!instLibre.trim()} onClick={() => { agregarInstitucion(instLibre.trim()); setInstLibre('') }}>
                        Agregar
                      </Button>
                    </div>
                  </Campo>
                </Seccion>
              </>
            )}

            {step === 3 && (
              <>
                <Seccion titulo="Diagnóstico" columnas={false}>
                  <Campo etiqueta="Problema" obligatorio htmlFor="problema" error={errors.problema} ayuda="Mínimo 50 caracteres.">
                    <textarea id="problema" value={form.problema} onChange={(e) => update('problema', e.target.value)} rows={3} className={claseTextarea(errors.problema)} />
                  </Campo>
                  <Campo etiqueta="Justificación" obligatorio htmlFor="justificacion" error={errors.justificacion} ayuda="Mínimo 50 caracteres.">
                    <textarea id="justificacion" value={form.justificacion} onChange={(e) => update('justificacion', e.target.value)} rows={3} className={claseTextarea(errors.justificacion)} />
                  </Campo>
                  <Campo etiqueta="Objetivo general" obligatorio htmlFor="objetivo" error={errors.objetivo_general} ayuda="Mínimo 30 caracteres.">
                    <textarea id="objetivo" value={form.objetivo_general} onChange={(e) => update('objetivo_general', e.target.value)} rows={2} className={claseTextarea(errors.objetivo_general)} />
                  </Campo>
                  <Campo etiqueta="Resultados esperados" htmlFor="resultados">
                    <textarea id="resultados" value={form.resultados_esperados} onChange={(e) => update('resultados_esperados', e.target.value)} rows={2} className={claseTextarea()} />
                  </Campo>
                </Seccion>

                <Seccion
                  titulo="Beneficiarios"
                  columnas={false}
                  accion={<Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => abrirEditorBeneficiario(null)}>Agregar</Button>}
                >
                  {errors.beneficiarios && <p className="text-xs text-red-600">{errors.beneficiarios}</p>}
                  {form.beneficiarios.length === 0 ? (
                    <p className="text-sm text-ink-muted">Aún no hay beneficiarios. Agrega al menos uno directo.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] text-sm">
                        <thead>
                          <tr className="border-b border-line text-left text-xs text-ink-muted">
                            <th className="py-2 pr-3 font-medium">Tipo</th>
                            <th className="py-2 pr-3 font-medium">Grupo</th>
                            <th className="py-2 pr-3 text-right font-medium">Cantidad</th>
                            <th className="py-2 pr-3 font-medium">Ubicación</th>
                            <th className="py-2"><span className="sr-only">Acciones</span></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {form.beneficiarios.map((b, i) => {
                            const error = errors[`beneficiarios.${i}.nombre`]
                            return (
                              <tr key={b._key} className="align-top">
                                <td className="py-2.5 pr-3 text-ink">{b.tipo === 'DIRECTO' ? 'Directo' : 'Indirecto'}</td>
                                <td className="py-2.5 pr-3">
                                  <p className="text-ink">{b.nombre || '—'}</p>
                                  {b.observaciones && <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">{b.observaciones}</p>}
                                  {error && <p className="mt-0.5 text-xs text-red-600">{error}</p>}
                                </td>
                                <td className="py-2.5 pr-3 text-right tabular-nums text-ink">{b.cantidad_estimada || '—'}</td>
                                <td className="py-2.5 pr-3 text-ink-muted">{b.ubicacion || '—'}</td>
                                <td className="whitespace-nowrap py-1.5 text-right">
                                  <button type="button" onClick={() => abrirEditorBeneficiario(i)} className="rounded p-1.5 text-ink-muted hover:bg-bg-soft hover:text-ink" aria-label={`Editar beneficiario ${i + 1}`}><Pencil size={15} /></button>
                                  <button type="button" onClick={() => eliminarBeneficiario(i)} className="rounded p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600" aria-label={`Eliminar beneficiario ${i + 1}`}><Trash2 size={15} /></button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Seccion>

                <Seccion titulo="Viabilidad" columnas={false}>
                  <Campo etiqueta="Viabilidad técnica, social y económica" obligatorio htmlFor="viabilidad" error={errors.viabilidad}>
                    <textarea id="viabilidad" value={form.viabilidad} onChange={(e) => update('viabilidad', e.target.value)} rows={3} className={claseTextarea(errors.viabilidad)} />
                  </Campo>
                </Seccion>
              </>
            )}

            {step === 4 && filaMarco && (
              <Seccion columnas={false}>
                <div role="tablist" aria-label="Niveles del marco lógico" className="flex gap-1 overflow-x-auto border-b border-line">
                  {NIVELES_MARCO.map((nivel) => {
                    const activo = nivel === nivelActivo
                    const conError = Boolean(errors[`marco_logico.${nivel}`])
                    const lleno = Boolean(form.marco_logico.find((m) => m.nivel === nivel)?.resumen_narrativo.trim())
                    return (
                      <button
                        key={nivel} type="button" role="tab" aria-selected={activo}
                        onClick={() => setNivelActivo(nivel)}
                        className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors ${
                          activo ? 'border-naranja font-medium text-ink' : 'border-transparent text-ink-muted hover:text-ink'
                        }`}
                      >
                        {NIVEL_INFO[nivel].titulo}
                        {conError ? <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-label="con error" /> : lleno && <Check size={12} className="text-ink-light" aria-label="completo" />}
                      </button>
                    )
                  })}
                </div>
                <p className="text-sm text-ink-muted">{NIVEL_INFO[nivelActivo].ayuda}</p>
                <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
                  <Campo etiqueta="Resumen narrativo" obligatorio ancho htmlFor="ml-resumen" error={errors[`marco_logico.${nivelActivo}`]}>
                    <textarea
                      id="ml-resumen" value={filaMarco.resumen_narrativo} rows={nivelActivo === 'ACTIVIDADES' ? 6 : 3}
                      onChange={(e) => cambiarMarco(nivelActivo, 'resumen_narrativo', e.target.value)}
                      className={claseTextarea(errors[`marco_logico.${nivelActivo}`])}
                    />
                  </Campo>
                  <Campo etiqueta="Indicadores" htmlFor="ml-indicadores">
                    <textarea id="ml-indicadores" value={filaMarco.indicadores} rows={3} onChange={(e) => cambiarMarco(nivelActivo, 'indicadores', e.target.value)} className={claseTextarea()} />
                  </Campo>
                  <Campo etiqueta="Medios de verificación" htmlFor="ml-medios">
                    <textarea id="ml-medios" value={filaMarco.medios_verificacion} rows={3} onChange={(e) => cambiarMarco(nivelActivo, 'medios_verificacion', e.target.value)} className={claseTextarea()} />
                  </Campo>
                  <Campo etiqueta="Supuestos" ancho htmlFor="ml-supuestos">
                    <textarea id="ml-supuestos" value={filaMarco.supuestos} rows={2} onChange={(e) => cambiarMarco(nivelActivo, 'supuestos', e.target.value)} className={claseTextarea()} />
                  </Campo>
                </div>
              </Seccion>
            )}

            {step === 5 && (
              <>
                <Seccion titulo="Fechas">
                  <Campo etiqueta="Fecha de inicio" obligatorio htmlFor="inicio" error={errors.fecha_inicio}>
                    <input id="inicio" type="date" value={form.fecha_inicio} onChange={(e) => update('fecha_inicio', e.target.value)} className={claseInput(errors.fecha_inicio)} />
                  </Campo>
                  <Campo etiqueta="Fecha de fin planificada" obligatorio htmlFor="fin" error={errors.fecha_fin_planificada}>
                    <input id="fin" type="date" value={form.fecha_fin_planificada} min={form.fecha_inicio || undefined} onChange={(e) => update('fecha_fin_planificada', e.target.value)} className={claseInput(errors.fecha_fin_planificada)} />
                  </Campo>
                </Seccion>

                <Seccion titulo="Presupuesto (USD)" columnas={false}>
                  <div className="grid grid-cols-2 gap-x-5 gap-y-4 lg:grid-cols-4">
                    {montos.map(({ campo, etiqueta }) => (
                      <Campo key={campo} etiqueta={etiqueta} htmlFor={campo}>
                        <input
                          id={campo} type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00"
                          value={form[campo]} onChange={(e) => { update(campo, e.target.value); limpiarError('presupuesto') }}
                          className={`${claseInput(errors.presupuesto)} text-right tabular-nums`}
                        />
                      </Campo>
                    ))}
                  </div>
                  {errors.presupuesto && <p className="text-xs text-red-600">{errors.presupuesto}</p>}
                  <p className="text-sm text-ink-muted">Total del proyecto: <span className="font-semibold tabular-nums text-ink">{dinero(total)}</span></p>
                </Seccion>

                <Seccion titulo="Ejecución y seguimiento" columnas={false}>
                  <Campo etiqueta="Estrategias de ejecución" obligatorio htmlFor="estrategias" error={errors.estrategias_ejecucion} ayuda="Metodología, fases y recursos.">
                    <textarea id="estrategias" value={form.estrategias_ejecucion} onChange={(e) => update('estrategias_ejecucion', e.target.value)} rows={3} className={claseTextarea(errors.estrategias_ejecucion)} />
                  </Campo>
                  <Campo etiqueta="Seguimiento y evaluación" obligatorio htmlFor="seguimiento" error={errors.seguimiento_evaluacion} ayuda="Cada cuánto se revisa el avance, quién evalúa y cómo se reporta.">
                    <textarea id="seguimiento" value={form.seguimiento_evaluacion} onChange={(e) => update('seguimiento_evaluacion', e.target.value)} rows={3} className={claseTextarea(errors.seguimiento_evaluacion)} />
                  </Campo>
                  <Campo etiqueta="Observaciones" htmlFor="observaciones">
                    <textarea id="observaciones" value={form.observaciones} onChange={(e) => update('observaciones', e.target.value)} rows={2} className={claseTextarea()} />
                  </Campo>
                </Seccion>
              </>
            )}

            {step === 6 && (
              <>
                <Seccion titulo="Responsables">
                  <Campo etiqueta="Docente responsable" obligatorio htmlFor="responsable" error={errors.responsable}>
                    <select id="responsable" value={form.responsable} onChange={(e) => update('responsable', e.target.value)} className={claseSelect(errors.responsable)}>
                      <option value="">Seleccionar…</option>
                      {docentes.map((d) => <option key={d.id} value={d.id}>{nombreDe(d)}</option>)}
                    </select>
                  </Campo>
                  <Campo etiqueta="Coordinador académico" htmlFor="coordinador">
                    <select id="coordinador" value={form.coordinador_academico} onChange={(e) => update('coordinador_academico', e.target.value)} className={claseSelect()}>
                      <option value="">Seleccionar…</option>
                      {coordinadores.map((c) => <option key={c.id} value={c.id}>{nombreDe(c)}</option>)}
                    </select>
                  </Campo>
                </Seccion>

                {responsableSel && (
                  <Seccion titulo="Datos del responsable">
                    <dl className="contents">
                      <Dato etiqueta="Cédula" valor={responsableSel.documento_identidad || 'No registrada'} />
                      <Dato etiqueta="Correo" valor={<span className="break-all">{responsableSel.user_email || 'No registrado'}</span>} />
                      <Dato etiqueta="Teléfono" valor={responsableSel.telefono || 'No registrado'} />
                      <Dato etiqueta="Carrera" valor={responsableSel.carrera?.nombre || 'Sin carrera asignada'} />
                    </dl>
                  </Seccion>
                )}

                <Seccion titulo="Firmas y participantes" columnas={false}>
                  <ul className="space-y-1.5 text-sm">
                    <li className={form.responsable ? 'text-ink' : 'text-ink-light'}>
                      {form.responsable ? '✓' : '○'} Firma del responsable{responsableSel ? `: ${nombreDe(responsableSel)}` : ''}
                    </li>
                    <li className={form.coordinador_academico ? 'text-ink' : 'text-ink-light'}>
                      {form.coordinador_academico ? '✓' : '○'} Firma del coordinador{coordinadorSel ? `: ${nombreDe(coordinadorSel)}` : ''}
                    </li>
                    <li className="text-ink-light">○ Firma del aprobador (se asigna al aprobar)</li>
                  </ul>
                  <p className="text-sm text-ink-muted">
                    Las firmas se registran al guardar. Los docentes y estudiantes participantes, con sus horas y rol, se agregan desde el detalle del proyecto.
                  </p>
                </Seccion>
              </>
            )}

            {step === 7 && (
              <>
                <Seccion titulo="Anexos" columnas={false}>
                  <input
                    type="file" ref={anexoInputRef} accept=".pdf,.docx,.xlsx,image/jpeg,image/png,image/webp" multiple className="hidden"
                    onChange={(e) => { seleccionarAnexos(e.target.files); if (anexoInputRef.current) anexoInputRef.current.value = '' }}
                  />
                  <button
                    type="button"
                    onClick={() => anexoInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); seleccionarAnexos(e.dataTransfer.files) }}
                    className="w-full rounded-btn border border-dashed border-line-strong px-4 py-5 text-left text-sm text-ink-muted transition-colors hover:border-ink hover:text-ink"
                  >
                    <span className="font-medium text-ink">Elegir archivos</span> o arrástralos aquí · PDF, DOCX, XLSX o imágenes, hasta {ANEXO_MAX_COUNT} de 10 MB
                  </button>
                  {anexoError && <p className="text-xs text-red-600">{anexoError}</p>}
                  {form.anexos.length > 0 && (
                    <ul className="divide-y divide-line border-y border-line">
                      {form.anexos.map((a) => (
                        <li key={a._key} className="flex items-center gap-3 py-2">
                          <span className="min-w-0 flex-1 truncate text-sm text-ink">{a.name}</span>
                          <span className="text-xs text-ink-muted">{formatBytes(a.size)}</span>
                          <button type="button" onClick={() => eliminarAnexo(a._key)} className="rounded p-1 text-ink-muted hover:bg-red-50 hover:text-red-600" aria-label={`Quitar ${a.name}`}><X size={14} /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Seccion>

                <Seccion titulo="Datos del proyecto">
                  <dl className="contents">
                    <Dato etiqueta="Título" valor={form.titulo} ancho />
                    <Dato etiqueta="Tipo" valor={TIPO_PROYECTO_LABELS[form.tipo] || form.tipo} />
                    <Dato etiqueta="Prioridad" valor={PRIORIDAD_LABELS[form.prioridad] || form.prioridad} />
                    <Dato etiqueta="Carreras" ancho valor={form.carreras.map((cid) => carreras.find((c) => String(c.id) === cid)?.nombre).filter(Boolean).join(', ')} />
                    {form.periodo_academico && <Dato etiqueta="Período" valor={form.periodo_academico} />}
                    <Dato etiqueta="Fechas" valor={form.fecha_inicio && form.fecha_fin_planificada ? `${form.fecha_inicio} al ${form.fecha_fin_planificada}` : ''} />
                    <Dato etiqueta="Responsable" valor={nombreDe(responsableSel) || 'No asignado'} />
                    <Dato etiqueta="Coordinador" valor={nombreDe(coordinadorSel) || 'No asignado'} />
                    <Dato
                      etiqueta="Beneficiarios"
                      valor={`${form.beneficiarios.length} (${form.beneficiarios.filter((b) => b.tipo === 'DIRECTO').length} directos, ${form.beneficiarios.filter((b) => b.tipo === 'INDIRECTO').length} indirectos)`}
                    />
                    <Dato etiqueta="Alineaciones" valor={form.alineaciones.map((a) => a.eje).join(', ')} />
                    {instituciones.length > 0 && <Dato etiqueta="Instituciones" ancho valor={instituciones.join(', ')} />}
                  </dl>
                </Seccion>

                <Seccion titulo="Presupuesto">
                  <dl className="contents">
                    <Dato etiqueta="Total" valor={<span className="font-semibold tabular-nums">{dinero(total)}</span>} ancho />
                    {montos.map(({ campo, etiqueta }) => (
                      <Dato key={campo} etiqueta={etiqueta} valor={<span className="tabular-nums">{dinero(Number(form[campo] || 0))}</span>} />
                    ))}
                  </dl>
                </Seccion>

                <Seccion titulo="Marco lógico" columnas={false}>
                  <dl className="space-y-3">
                    {form.marco_logico.map((m) => (
                      <div key={m._key} className="grid gap-1 sm:grid-cols-[8rem_1fr]">
                        <dt className="text-xs text-ink-muted sm:pt-0.5">{NIVEL_INFO[m.nivel as NivelMarco]?.titulo ?? m.nivel}</dt>
                        <dd className="whitespace-pre-line text-sm text-ink">{m.resumen_narrativo || '—'}</dd>
                      </div>
                    ))}
                  </dl>
                </Seccion>

                <section className="border-t border-line pt-6">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox" checked={confirmAck}
                      onChange={(e) => { setConfirmAck(e.target.checked); if (e.target.checked) limpiarError('confirm') }}
                      className="mt-0.5 h-4 w-4 accent-naranja"
                    />
                    <span className="text-sm text-ink">
                      Confirmo que los datos son correctos y se ajustan a la normativa institucional de la UNL <span className="text-red-500">*</span>
                    </span>
                  </label>
                  {errors.confirm && <p className="mt-1.5 text-xs text-red-600">{errors.confirm}</p>}
                  <p className="mt-2 text-xs text-ink-muted">Una vez enviado a revisión, el proyecto ya no se puede editar.</p>
                </section>
              </>
            )}
          </div>
        </Bloque>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-b-lg">
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" icon={<ArrowLeft size={15} />} onClick={handlePrev} disabled={step === 1 || saving}>
            Anterior
          </Button>
          {step < TOTAL_FASES ? (
            <Button onClick={handleNext} loading={saving}>
              {saving ? 'Guardando…' : 'Siguiente'}
              {!saving && <ArrowRight size={15} />}
            </Button>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
                Guardar borrador
              </Button>
              <Button onClick={handleSaveAndSubmit} loading={saving}>
                {saving ? 'Enviando…' : 'Guardar y enviar'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={alineacionEditorOpen}
        onClose={cerrarEditorAlineacion}
        title={alineacionEditIdx === null ? 'Nueva alineación' : `Editar alineación ${alineacionEditIdx + 1}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={cerrarEditorAlineacion}>Cancelar</Button>
            <Button onClick={guardarAlineacion}>{alineacionEditIdx === null ? 'Agregar' : 'Guardar cambios'}</Button>
          </>
        }
      >
        <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
          <Campo etiqueta="Eje estratégico" obligatorio ancho htmlFor="al-eje" ayuda="Sin números.">
            <input id="al-eje" value={alineacionDraft.eje} onChange={(e) => setAlineacionDraft({ ...alineacionDraft, eje: e.target.value })} className={claseInput()} placeholder="Ej.: Desarrollo social y comunitario" />
          </Campo>
          <Campo etiqueta="Objetivo estratégico institucional" obligatorio ancho htmlFor="al-objetivo" ayuda="Mínimo 30 caracteres.">
            <textarea id="al-objetivo" value={alineacionDraft.objetivo_estrategico} onChange={(e) => setAlineacionDraft({ ...alineacionDraft, objetivo_estrategico: e.target.value })} rows={2} className={claseTextarea()} />
          </Campo>
          <Campo etiqueta="Programa" obligatorio htmlFor="al-programa">
            <input id="al-programa" value={alineacionDraft.programa} onChange={(e) => setAlineacionDraft({ ...alineacionDraft, programa: e.target.value })} className={claseInput()} />
          </Campo>
          <Campo etiqueta="Plan" obligatorio htmlFor="al-plan">
            <input id="al-plan" value={alineacionDraft.plan} onChange={(e) => setAlineacionDraft({ ...alineacionDraft, plan: e.target.value })} className={claseInput()} placeholder="Ej.: Plan Estratégico 2024-2028" />
          </Campo>
          <Campo etiqueta="Línea de investigación UNL" htmlFor="al-linea">
            <select id="al-linea" value={alineacionDraft.linea_investigacion} onChange={(e) => setAlineacionDraft({ ...alineacionDraft, linea_investigacion: e.target.value })} className={claseSelect()}>
              <option value="">Seleccionar…</option>
              {LINEAS_INVESTIGACION.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Programa de vinculación" htmlFor="al-pv">
            <select id="al-pv" value={alineacionDraft.programa_vinculacion} onChange={(e) => setAlineacionDraft({ ...alineacionDraft, programa_vinculacion: e.target.value })} className={claseSelect()}>
              <option value="">Seleccionar…</option>
              {PROGRAMAS_VINCULACION.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Eje del Plan de Igualdad" htmlFor="al-igualdad">
            <select id="al-igualdad" value={alineacionDraft.eje_plan_igualdad} onChange={(e) => setAlineacionDraft({ ...alineacionDraft, eje_plan_igualdad: e.target.value })} className={claseSelect()}>
              <option value="">Seleccionar…</option>
              {EJES_IGUALDAD.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="ODS" htmlFor="al-ods">
            <select id="al-ods" value={alineacionDraft.ods} onChange={(e) => setAlineacionDraft({ ...alineacionDraft, ods: e.target.value })} className={claseSelect()}>
              <option value="">Seleccionar…</option>
              {ODS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Plan Nacional de Desarrollo" ancho htmlFor="al-pnd">
            <textarea id="al-pnd" value={alineacionDraft.plan_nacional_desarrollo} onChange={(e) => setAlineacionDraft({ ...alineacionDraft, plan_nacional_desarrollo: e.target.value })} rows={2} className={claseTextarea()} />
          </Campo>
          <Campo etiqueta="Agenda zonal" htmlFor="al-agenda">
            <input id="al-agenda" value={alineacionDraft.agenda_zonal} onChange={(e) => setAlineacionDraft({ ...alineacionDraft, agenda_zonal: e.target.value })} className={claseInput()} />
          </Campo>
          <Campo etiqueta="Descripción adicional" htmlFor="al-desc">
            <input id="al-desc" value={alineacionDraft.descripcion} onChange={(e) => setAlineacionDraft({ ...alineacionDraft, descripcion: e.target.value })} className={claseInput()} />
          </Campo>
        </div>
        {alineacionDraftError && <p className="mt-4 text-xs text-red-600" role="alert">{alineacionDraftError}</p>}
      </Modal>

      <Modal
        open={beneficiarioEditorOpen}
        onClose={cerrarEditorBeneficiario}
        title={beneficiarioEditIdx === null ? 'Nuevo beneficiario' : `Editar beneficiario ${beneficiarioEditIdx + 1}`}
        footer={
          <>
            <Button variant="outline" onClick={cerrarEditorBeneficiario}>Cancelar</Button>
            <Button onClick={guardarBeneficiario}>{beneficiarioEditIdx === null ? 'Agregar' : 'Guardar cambios'}</Button>
          </>
        }
      >
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Campo etiqueta="Tipo" obligatorio htmlFor="be-tipo">
            <select id="be-tipo" value={beneficiarioDraft.tipo} onChange={(e) => setBeneficiarioDraft({ ...beneficiarioDraft, tipo: e.target.value as 'DIRECTO' | 'INDIRECTO' })} className={claseSelect()}>
              <option value="DIRECTO">Directo</option>
              <option value="INDIRECTO">Indirecto</option>
            </select>
          </Campo>
          <Campo etiqueta="Cantidad estimada" htmlFor="be-cantidad">
            <input id="be-cantidad" type="number" min="0" value={beneficiarioDraft.cantidad_estimada} onChange={(e) => setBeneficiarioDraft({ ...beneficiarioDraft, cantidad_estimada: e.target.value })} className={`${claseInput()} tabular-nums`} placeholder="0" />
          </Campo>
          <div className="sm:col-span-2">
            <Campo etiqueta="Nombre o descripción del grupo" obligatorio htmlFor="be-nombre" error={beneficiarioDraftError}>
              <input id="be-nombre" value={beneficiarioDraft.nombre} onChange={(e) => setBeneficiarioDraft({ ...beneficiarioDraft, nombre: e.target.value })} className={claseInput(beneficiarioDraftError)} placeholder="Ej.: Familias de la parroquia El Valle" />
            </Campo>
          </div>
          <div className="sm:col-span-2">
            <Campo etiqueta="Ubicación" htmlFor="be-ubicacion">
              <input id="be-ubicacion" value={beneficiarioDraft.ubicacion} onChange={(e) => setBeneficiarioDraft({ ...beneficiarioDraft, ubicacion: e.target.value })} className={claseInput()} placeholder="Ej.: Parroquia El Valle, Loja" />
            </Campo>
          </div>
          <div className="sm:col-span-2">
            <Campo etiqueta="Observaciones" htmlFor="be-obs">
              <textarea id="be-obs" value={beneficiarioDraft.observaciones} onChange={(e) => setBeneficiarioDraft({ ...beneficiarioDraft, observaciones: e.target.value })} rows={2} className={claseTextarea()} />
            </Campo>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={modalAction !== null}
        titulo={modalAction === 'submit' ? '¿Enviar a revisión?' : '¿Guardar borrador?'}
        mensaje={modalAction === 'submit'
          ? 'Está seguro de enviar el proyecto a revisión'
          : 'Está seguro de guardar el proyecto como borrador'}
        onConfirm={executeAction}
        onCancel={() => setModalAction(null)}
      />

      <ConfirmModal
        isOpen={confirmarRelleno}
        titulo="¿Reemplazar los datos del formulario?"
        mensaje="El formulario ya tiene datos. Rellenar IA los reemplaza en las 7 fases con datos de prueba nuevos."
        confirmLabel="Reemplazar"
        cancelLabel="Cancelar"
        onConfirm={() => { setConfirmarRelleno(false); void rellenar() }}
        onCancel={() => setConfirmarRelleno(false)}
      />
    </div>
  )
}
