import { useCallback, useEffect, useRef, useState } from 'react'
import {
  COMPORTAMIENTO,
  RETARDO_PROCESANDO_MS,
  TITULO_ERROR,
  conTiempoLimite,
  mensajeOperacion,
  transicionar,
  type EstadoOperacion,
  type Progreso,
  type TextosOperacion,
} from '@/lib/operacion'

export interface OpcionesOperacion<T> {
  procesando: TextosOperacion
  /** Sin `exito`, la operación termina sin modal (p. ej. un guardado intermedio entre fases). */
  exito?: TextosOperacion | ((resultado: T) => TextosOperacion)
  /** Se llama al pulsar [Aceptar] en el modal de éxito: navegar o refrescar. */
  alAceptar?: (resultado: T) => void
  /** Se llama al pulsar [Cerrar] en el modal de error. */
  alCerrarError?: () => void
  tituloError?: string
  /** Mensaje más específico para ciertos errores (p. ej. el primer error de campo de auth-service). */
  traducirError?: (error: unknown) => string | null | undefined
  /** false oculta [Intentar nuevamente] (p. ej. con reCAPTCHA, cuyo token solo vale una vez). */
  reintento?: boolean
  /** Límite de tiempo en ms (70 s por defecto). */
  tiempoLimiteMs?: number
}

/** Reporta el progreso real de una subida; null vuelve a la rueda indeterminada. */
export type InformarProgreso = (progreso: Progreso | null) => void
/** `senal` se aborta al vencer el tiempo límite: pásala a las peticiones (axios `signal`). */
type Tarea<T> = (senal: AbortSignal, informar: InformarProgreso) => Promise<T>

/**
 * Ejecuta una operación de guardado y expone su estado para OperationStatusModal.
 *
 * - Usa solo el estado real de la petición: "éxito" llega con la respuesta, nunca antes.
 * - `ocupado` es true desde el primer clic: úsalo para deshabilitar el botón. Un segundo clic
 *   mientras hay una operación en curso se ignora (sin envíos duplicados).
 * - "Procesando" se muestra pasados 400 ms; si responde antes no hay parpadeo, pero el éxito sí se ve.
 * - Límite de 70 s (arranque en frío de Render); error de red, de servidor y timeout se traducen a un mensaje en español.
 * - El estado se libera siempre (finally) y los datos del formulario no se tocan.
 */
export function useOperacion() {
  const [estado, setEstado] = useState<EstadoOperacion>({ tipo: 'inactivo' })
  const enCurso = useRef(false)
  const montado = useRef(true)
  const ultima = useRef<{ tarea: Tarea<unknown>; opciones: OpcionesOperacion<unknown> } | null>(null)
  const resultado = useRef<unknown>(undefined)

  useEffect(() => {
    montado.current = true
    return () => { montado.current = false }
  }, [])

  const cambiar = useCallback((siguiente: EstadoOperacion | ((actual: EstadoOperacion) => EstadoOperacion)) => {
    if (!montado.current) return
    setEstado((actual) => transicionar(actual, typeof siguiente === 'function' ? siguiente(actual) : siguiente))
  }, [])

  const ejecutar = useCallback(async <T,>(tarea: Tarea<T>, opciones: OpcionesOperacion<T>): Promise<T | undefined> => {
    if (enCurso.current) return undefined
    enCurso.current = true
    ultima.current = { tarea: tarea as Tarea<unknown>, opciones: opciones as OpcionesOperacion<unknown> }
    cambiar({ tipo: 'procesando', textos: opciones.procesando, visible: false, progreso: null })
    const informar: InformarProgreso = (progreso) => {
      cambiar((actual) => (actual.tipo === 'procesando' ? { ...actual, progreso } : actual))
    }
    const retardo = setTimeout(() => {
      cambiar((actual) => (actual.tipo === 'procesando' ? { ...actual, visible: true } : actual))
    }, RETARDO_PROCESANDO_MS)
    try {
      const valor = await conTiempoLimite((senal) => tarea(senal, informar), opciones.tiempoLimiteMs)
      resultado.current = valor
      if (opciones.exito) {
        const textos = typeof opciones.exito === 'function' ? opciones.exito(valor) : opciones.exito
        cambiar({ tipo: 'exito', textos })
      } else {
        cambiar({ tipo: 'inactivo' })
      }
      return valor
    } catch (error) {
      if (import.meta.env.DEV) console.error('[operacion]', error)
      const especifico = (error as { response?: unknown })?.response ? opciones.traducirError?.(error) : null
      cambiar({
        tipo: 'error',
        titulo: opciones.tituloError ?? TITULO_ERROR,
        mensaje: especifico || mensajeOperacion(error),
        reintento: opciones.reintento !== false,
      })
      return undefined
    } finally {
      clearTimeout(retardo)
      enCurso.current = false
    }
  }, [cambiar])

  const aceptar = useCallback(() => {
    const opciones = ultima.current?.opciones
    cambiar({ tipo: 'inactivo' })
    opciones?.alAceptar?.(resultado.current)
  }, [cambiar])

  const cerrar = useCallback(() => {
    const opciones = ultima.current?.opciones
    cambiar({ tipo: 'inactivo' })
    opciones?.alCerrarError?.()
  }, [cambiar])

  const reintentar = useCallback(() => {
    const previa = ultima.current
    if (!previa) return
    void ejecutar(previa.tarea, previa.opciones)
  }, [ejecutar])

  return {
    estado,
    /** true mientras la operación está en curso (aunque aún no se muestre el modal). */
    ocupado: COMPORTAMIENTO[estado.tipo].bloqueaFormulario,
    ejecutar,
    aceptar,
    cerrar,
    reintentar,
  }
}

export type Operacion = ReturnType<typeof useOperacion>
