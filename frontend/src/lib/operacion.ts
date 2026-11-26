/**
 * Estado de una operación de guardado (patrón State).
 *
 * Cada estado define cómo se ve y cómo se comporta el modal (si se puede cerrar, qué botones
 * muestra), y TRANSICIONES fija a qué estados se puede pasar desde cada uno. Así no se puede
 * mostrar "éxito" sin haber pasado por "procesando" ni quedar en "procesando" tras un error.
 *
 *   inactivo ──ejecutar──▶ procesando ──respuesta ok──▶ éxito ──aceptar──▶ inactivo
 *                              │                                  ▲
 *                              └──error/red/timeout──▶ error ──reintentar
 */

export type TipoEstado = 'inactivo' | 'procesando' | 'exito' | 'error'

export interface TextosOperacion {
  titulo: string
  descripcion?: string
}

export type EstadoOperacion =
  | { tipo: 'inactivo' }
  /** `visible` pasa a true a los 400 ms: las operaciones rápidas no muestran "procesando". */
  | { tipo: 'procesando'; textos: TextosOperacion; visible: boolean }
  | { tipo: 'exito'; textos: TextosOperacion }
  | { tipo: 'error'; titulo: string; mensaje: string; reintento: boolean }

export const TRANSICIONES: Record<TipoEstado, readonly TipoEstado[]> = {
  inactivo: ['procesando'],
  procesando: ['exito', 'error', 'inactivo'],
  exito: ['inactivo'],
  error: ['procesando', 'inactivo'],
}

/** Comportamiento del modal en cada estado. */
export const COMPORTAMIENTO: Record<TipoEstado, { cerrable: boolean; bloqueaFormulario: boolean }> = {
  inactivo: { cerrable: true, bloqueaFormulario: false },
  procesando: { cerrable: false, bloqueaFormulario: true },
  exito: { cerrable: true, bloqueaFormulario: false },
  error: { cerrable: true, bloqueaFormulario: false },
}

export function transicionar(actual: EstadoOperacion, siguiente: EstadoOperacion): EstadoOperacion {
  if (actual.tipo === siguiente.tipo || TRANSICIONES[actual.tipo].includes(siguiente.tipo)) return siguiente
  if (import.meta.env.DEV) {
    console.warn(`[operacion] transición no válida: ${actual.tipo} → ${siguiente.tipo}`)
  }
  return actual
}

export const TIEMPO_LIMITE_MS = 30_000
export const RETARDO_PROCESANDO_MS = 400
export const TITULO_ERROR = 'No se pudo completar la operación'

export class ErrorTiempoAgotado extends Error {
  constructor() {
    super('tiempo agotado')
    this.name = 'ErrorTiempoAgotado'
  }
}

const MENSAJE_RED = 'No hay conexión con el servidor. Revisa tu conexión a internet e inténtalo nuevamente.'
const MENSAJE_TIEMPO = 'El servidor tardó más de 30 segundos en responder. Inténtalo nuevamente en unos momentos.'
const MENSAJE_SERVIDOR = 'El servidor tuvo un problema al procesar la solicitud. Inténtalo nuevamente más tarde.'
const MENSAJE_GENERICO = 'Ocurrió un error inesperado. Inténtalo nuevamente.'

/** Un texto apto para el usuario: corto, sin HTML ni trazas técnicas. */
function esLegible(texto: unknown): texto is string {
  if (typeof texto !== 'string') return false
  const t = texto.trim()
  return (
    t.length > 0 &&
    t.length <= 300 &&
    !/<\/?[a-z][\s\S]*>/i.test(t) &&
    !/Traceback|Exception|Error:|at \w+ \(|File "|status code \d{3}|Network Error|timeout of \d+ms/i.test(t)
  )
}

/** Primer mensaje legible dentro de { campo: ['msg'] } o { data: { errores: {...} } }. */
function primerMensajeDeCampos(datos: unknown, profundidad = 0): string | null {
  if (profundidad > 3 || datos === null || datos === undefined) return null
  if (esLegible(datos)) return datos
  if (Array.isArray(datos)) {
    for (const item of datos) {
      const m = primerMensajeDeCampos(item, profundidad + 1)
      if (m) return m
    }
    return null
  }
  if (typeof datos === 'object') {
    for (const valor of Object.values(datos as Record<string, unknown>)) {
      const m = primerMensajeDeCampos(valor, profundidad + 1)
      if (m) return m
    }
  }
  return null
}

/**
 * Traduce cualquier error (axios, red, timeout o uno propio) al mensaje que verá el usuario.
 * Prioriza el `message` del backend, que ya viene en español.
 */
export function mensajeOperacion(error: unknown): string {
  if (error instanceof ErrorTiempoAgotado) return MENSAJE_TIEMPO
  const e = error as {
    code?: string
    message?: string
    response?: { status?: number; data?: unknown }
    request?: unknown
  }
  if (e?.code === 'ECONNABORTED' || e?.code === 'ETIMEDOUT') return MENSAJE_TIEMPO
  if (!e?.response) {
    if (e?.request || e?.code === 'ERR_NETWORK' || e?.message === 'Network Error') return MENSAJE_RED
    if (esLegible(e?.message)) return e.message
    return MENSAJE_GENERICO
  }
  const { status = 0, data } = e.response
  const cuerpo = (data ?? {}) as { message?: unknown; detail?: unknown; data?: unknown }
  if (esLegible(cuerpo.message)) return cuerpo.message
  if (esLegible(cuerpo.detail)) return cuerpo.detail
  if (status >= 500) return MENSAJE_SERVIDOR
  return primerMensajeDeCampos(cuerpo.data ?? data) ?? MENSAJE_GENERICO
}

/**
 * Ejecuta `tarea` con límite de tiempo. Al vencer, aborta la señal (las peticiones que la
 * reciban se cancelan) y rechaza con ErrorTiempoAgotado.
 */
export function conTiempoLimite<T>(tarea: (senal: AbortSignal) => Promise<T>, ms = TIEMPO_LIMITE_MS): Promise<T> {
  const control = new AbortController()
  let temporizador: ReturnType<typeof setTimeout> | undefined
  const limite = new Promise<never>((_, rechazar) => {
    temporizador = setTimeout(() => {
      control.abort()
      rechazar(new ErrorTiempoAgotado())
    }, ms)
  })
  return Promise.race([tarea(control.signal), limite]).finally(() => clearTimeout(temporizador))
}
