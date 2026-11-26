import type { Carrera, Usuario } from '@/types/usuarios'
import type { PrioridadProyecto, TipoProyecto } from '@/types/proyectos'
import { normalizar } from '@/lib/texto'
import {
  MAX_CARRERAS, PERIODOS, formularioVacio, totalPresupuesto, uid,
  type AlineacionItem, type BeneficiarioItem, type FormState, type MarcoLogicoItem,
} from '../formulario/tipos'
import { LUGARES, TEMAS, type Lugar, type TemaDemo } from './temasDemo'

/**
 * Generador de proyectos de prueba para el botón "Rellenar IA" (no usa IA ni APIs externas).
 *
 * Patrón Builder: cada fase del formulario tiene su método (`faseGeneral`, `faseAlineacion`, …)
 * y `construir()` las encadena. Los textos salen de temasDemo.ts; los IDs (carreras, docentes,
 * coordinadores, instituciones) salen solo de los catálogos que la página ya trajo de la API.
 * Si falta un catálogo, el campo queda vacío y se agrega un aviso.
 */

export interface InstitucionDemo {
  id: number
  nombre: string
  sigla: string
}

export interface CatalogosDemo {
  carreras: Carrera[]
  docentes: Usuario[]
  coordinadores: Usuario[]
  instituciones: InstitucionDemo[]
}

export interface ResultadoDemo {
  form: FormState
  avisos: string[]
}

interface Opciones {
  /** Fecha de referencia (para pruebas); por defecto, hoy. */
  hoy?: Date
  /** Fuente aleatoria en [0, 1) (para pruebas); por defecto, Math.random. */
  aleatorio?: () => number
}

const PLAN_INSTITUCIONAL = 'Plan Estratégico de Desarrollo Institucional 2024-2028'
const PND = 'Plan de Desarrollo para el Nuevo Ecuador 2024-2025, eje social: mejorar las condiciones de vida de la población de forma integral.'
const AGENDA_ZONAL = 'Agenda Zonal 7 (El Oro, Loja y Zamora Chinchipe)'

const ALINEACION_VINCULACION = {
  eje: 'Vinculación con la sociedad',
  objetivo_estrategico: 'Articular la docencia y la investigación con las necesidades de la comunidad mediante prácticas de servicio comunitario de los estudiantes.',
  programa: 'Prácticas de servicio comunitario UNL',
}

const SEGUIMIENTO = [
  'Reuniones quincenales entre el docente responsable y los estudiantes para revisar el cronograma; informe de avance trimestral al coordinador de vinculación y evaluación final con los indicadores del marco lógico y una encuesta de satisfacción a los beneficiarios.',
  'Seguimiento mensual con fichas de avance por actividad, visitas de supervisión del docente responsable, informe parcial a la mitad del proyecto e informe final con la comparación entre la línea base y los resultados.',
]

let ultimoTema = -1

const dos = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`
const corta = (d: Date) => `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()}`
const sumarDias = (d: Date, dias: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias)
const dinero = (n: number) => `$${n.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export class GeneradorProyectoDemo {
  private readonly form: FormState = formularioVacio()
  private readonly avisos: string[] = []
  private readonly rnd: () => number
  private readonly hoy: Date
  private readonly tema: TemaDemo
  private readonly lugar: Lugar
  private inicio!: Date
  private fin!: Date

  constructor(private readonly catalogos: CatalogosDemo, opciones: Opciones = {}) {
    this.rnd = opciones.aleatorio ?? Math.random
    const h = opciones.hoy ?? new Date()
    this.hoy = new Date(h.getFullYear(), h.getMonth(), h.getDate())
    // Evita repetir el mismo tema en dos clics seguidos.
    let i = this.entero(0, TEMAS.length - 1)
    if (TEMAS.length > 1 && i === ultimoTema) i = (i + 1) % TEMAS.length
    ultimoTema = i
    this.tema = TEMAS[i]!
    this.lugar = this.uno(LUGARES)
  }

  // --- utilidades aleatorias ---------------------------------------------------

  private entero(min: number, max: number) {
    return Math.floor(this.rnd() * (max - min + 1)) + min
  }

  private uno<T>(lista: readonly T[]): T {
    return lista[this.entero(0, lista.length - 1)]!
  }

  private algunos<T>(lista: readonly T[], cantidad: number): T[] {
    const copia = [...lista]
    for (let i = copia.length - 1; i > 0; i--) {
      const j = this.entero(0, i)
      ;[copia[i], copia[j]] = [copia[j]!, copia[i]!]
    }
    return copia.slice(0, cantidad)
  }

  private texto(plantilla: string) {
    return plantilla.split('{lugar}').join(this.lugar.frase).split('{nombre}').join(this.lugar.nombre)
  }

  // --- fases -------------------------------------------------------------------

  /** Fase 1: datos generales y carreras. */
  faseGeneral() {
    const t = this.tema
    const tipos: TipoProyecto[] = ['VINCULACION', 'VINCULACION', 'VINCULACION', 'EXTENSION', 'MIXTO']
    const prioridades: PrioridadProyecto[] = ['MEDIA', 'MEDIA', 'ALTA', 'BAJA']
    Object.assign(this.form, {
      titulo: this.texto(this.uno(t.titulos)),
      tipo: this.uno(tipos),
      prioridad: this.uno(prioridades),
      linea_intervencion: t.linea,
      resumen: this.texto(t.resumen),
      descripcion: this.texto(t.descripcion),
      carreras: this.elegirCarreras(),
    })
    return this
  }

  /** Fase 2: alineación estratégica e instituciones participantes. */
  faseAlineacion() {
    const t = this.tema
    const alineaciones: AlineacionItem[] = [{
      _key: uid(),
      eje: t.eje,
      objetivo_estrategico: t.objetivoEstrategico,
      programa: t.programa,
      plan: PLAN_INSTITUCIONAL,
      descripcion: '',
      linea_investigacion: t.lineaInvestigacion,
      programa_vinculacion: t.programaVinculacion,
      eje_plan_igualdad: t.ejeIgualdad,
      ods: this.uno(t.ods),
      plan_nacional_desarrollo: PND,
      agenda_zonal: AGENDA_ZONAL,
    }]
    if (this.rnd() < 0.5) {
      alineaciones.push({
        _key: uid(),
        ...ALINEACION_VINCULACION,
        plan: PLAN_INSTITUCIONAL,
        descripcion: '',
        linea_investigacion: t.lineaInvestigacion,
        programa_vinculacion: 'Prácticas preprofesionales',
        eje_plan_igualdad: 'NO_APLICA',
        ods: '4. Educación de calidad',
        plan_nacional_desarrollo: '',
        agenda_zonal: AGENDA_ZONAL,
      })
    }
    this.form.alineaciones = alineaciones

    const { instituciones } = this.catalogos
    if (instituciones.length === 0) {
      this.avisos.push('No hay instituciones registradas: "Instituciones participantes" quedó vacío.')
    } else {
      this.form.instituciones_participantes = this.algunos(instituciones, this.entero(1, Math.min(2, instituciones.length)))
        .map((i) => i.nombre).join('\n')
    }
    return this
  }

  /** Fase 3: diagnóstico y beneficiarios (siempre al menos uno directo). */
  faseDiagnostico() {
    const t = this.tema
    const beneficiarios: BeneficiarioItem[] = [
      {
        _key: uid(), tipo: 'DIRECTO', nombre: this.texto(t.directo.nombre),
        cantidad_estimada: String(this.entero(t.directo.min, t.directo.max)),
        ubicacion: this.lugar.ubicacion, observaciones: t.directo.observaciones,
      },
      {
        _key: uid(), tipo: 'INDIRECTO', nombre: this.texto(t.indirecto.nombre),
        cantidad_estimada: String(this.entero(t.indirecto.min, t.indirecto.max)),
        ubicacion: this.lugar.ubicacion, observaciones: '',
      },
    ]
    Object.assign(this.form, {
      problema: this.texto(t.problema),
      justificacion: this.texto(t.justificacion),
      objetivo_general: this.texto(t.objetivo),
      resultados_esperados: this.texto(t.resultados),
      viabilidad: this.texto(t.viabilidad),
      beneficiarios,
    })
    return this
  }

  /** Fechas del proyecto: empieza en 2 a 6 semanas y dura de 5 a 10 meses. */
  private fechas() {
    if (this.inicio) return
    this.inicio = sumarDias(this.hoy, this.entero(14, 45))
    this.fin = new Date(this.inicio.getFullYear(), this.inicio.getMonth() + this.entero(5, 10), this.inicio.getDate())
  }

  /** Fase 4: matriz de marco lógico. Las actividades llevan fechas dentro del proyecto y su costo. */
  faseMarcoLogico() {
    this.fechas()
    const t = this.tema
    const actividades = t.actividades
    const dias = Math.round((this.fin.getTime() - this.inicio.getTime()) / 86_400_000)
    const tramo = Math.floor(dias / actividades.length)
    const costos = actividades.map(() => this.entero(15, 120) * 10)
    const lineas = actividades.map((nombre, i) => {
      const desde = sumarDias(this.inicio, i * tramo)
      const hasta = i === actividades.length - 1 ? this.fin : sumarDias(this.inicio, (i + 1) * tramo - 1)
      return `${i + 1}. ${nombre} (${corta(desde)} al ${corta(hasta)}): ${dinero(costos[i]!)}`
    })
    const totalActividades = costos.reduce((a, b) => a + b, 0)
    this.repartirEconomico(totalActividades)

    const fila = (nivel: MarcoLogicoItem['nivel'], resumen: string, indicadores: string): MarcoLogicoItem => ({
      _key: uid(), nivel, resumen_narrativo: resumen, indicadores,
      medios_verificacion: t.medios, supuestos: t.supuestos,
    })
    this.form.marco_logico = [
      fila('FIN', this.texto(t.fin), t.indicadores.fin),
      fila('PROPOSITO', this.texto(t.proposito), t.indicadores.proposito),
      fila('COMPONENTES', t.componentes, t.indicadores.componentes),
      fila('ACTIVIDADES', `${lineas.join('\n')}\nTotal de actividades: ${dinero(totalActividades)}`, t.indicadores.actividades),
    ]
    return this
  }

  /** El aporte económico (UNL + externo) suma exactamente el costo de las actividades. */
  private repartirEconomico(total: number) {
    const unl = Math.round(total * (this.entero(55, 80) / 100) / 10) * 10
    this.form.monto_unl_economico = unl.toFixed(2)
    this.form.monto_externo_economico = (total - unl).toFixed(2)
  }

  /** Fase 5: fechas, estrategias, presupuesto y seguimiento. */
  fasePlanificacion() {
    this.fechas()
    if (!this.form.monto_unl_economico) this.repartirEconomico(this.entero(80, 300) * 10)
    Object.assign(this.form, {
      fecha_inicio: iso(this.inicio),
      fecha_fin_planificada: iso(this.fin),
      periodo_academico: this.periodo(),
      estrategias_ejecucion: this.tema.estrategias,
      monto_unl_valorado: (this.entero(15, 60) * 100).toFixed(2),
      monto_externo_valorado: (this.entero(3, 20) * 100).toFixed(2),
      seguimiento_evaluacion: this.uno(SEGUIMIENTO),
    })
    const economico = Number(this.form.monto_unl_economico) + Number(this.form.monto_externo_economico)
    this.form.observaciones = `El aporte económico (${dinero(economico)}) corresponde al costo de las actividades del marco lógico; el aporte valorado cubre horas docentes, equipos y espacios.`
    return this
  }

  /**
   * Período académico en que arranca. Siempre devuelve una opción del formulario: si la fecha cae
   * entre enero y marzo o en un año sin período en la lista, usa el período más reciente.
   */
  private periodo() {
    const m = this.inicio.getMonth() + 1
    const y = this.inicio.getFullYear()
    const etiqueta = m >= 8 ? `Agosto - Diciembre ${y}` : m >= 4 ? `Abril - Agosto ${y}` : `Agosto - Diciembre ${y - 1}`
    return PERIODOS.includes(etiqueta) ? etiqueta : PERIODOS[0]!
  }

  /** Fase 6: responsable y coordinador, elegidos entre usuarios reales. */
  faseResponsables() {
    const { docentes, coordinadores } = this.catalogos
    if (docentes.length === 0) this.avisos.push('No hay docentes registrados: elige el responsable a mano en la fase 6.')
    else this.form.responsable = String(this.uno(docentes).id)
    if (coordinadores.length === 0) this.avisos.push('No hay coordinadores registrados: "Coordinador académico" quedó vacío.')
    else this.form.coordinador_academico = String(this.uno(coordinadores).id)
    return this
  }

  private elegirCarreras(): string[] {
    const { carreras } = this.catalogos
    if (carreras.length === 0) {
      this.avisos.push('No se pudieron cargar las carreras: elige al menos una en la fase 1.')
      return []
    }
    const afines = carreras.filter((c) => this.tema.carreras.some((k) => normalizar(c.nombre).includes(k)))
    const base = afines.length > 0 ? afines : carreras
    return this.algunos(base, this.entero(1, Math.min(3, base.length, MAX_CARRERAS))).map((c) => String(c.id))
  }

  /** Encadena las 7 fases (la 7 no tiene campos: el usuario confirma a mano). */
  construir(): ResultadoDemo {
    this.faseGeneral().faseAlineacion().faseDiagnostico().faseMarcoLogico().fasePlanificacion().faseResponsables()
    this.form.presupuesto_aprobado = totalPresupuesto(this.form).toFixed(2)
    return { form: this.form, avisos: this.avisos }
  }
}

export const generarProyectoDemo = (catalogos: CatalogosDemo, opciones?: Opciones) =>
  new GeneradorProyectoDemo(catalogos, opciones).construir()

