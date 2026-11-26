import type { AxiosProgressEvent, AxiosRequestConfig } from 'axios'
import type { InformarProgreso } from '@/hooks/useOperacion'

export interface ArchivoASubir {
  /** Identificador estable (p. ej. 'portada' o el _key del anexo). */
  clave: string
  tamano: number
  esImagen: boolean
}

const PROCESANDO_SERVIDOR = 'Procesando en el servidor…'

/**
 * Progreso real de varias subidas (patrón Observer: cada petición notifica con onUploadProgress
 * y el seguimiento recalcula el total y avisa a la operación).
 *
 * - El porcentaje pondera cada archivo por su tamaño y usa los bytes que reporta el navegador.
 * - "Subiendo 3 de 5 imágenes": el número es el archivo en curso (completados + 1).
 * - Cuando todo llegó al 100 % pero falta la respuesta, pasa a "Procesando en el servidor…"
 *   con la rueda indeterminada.
 * - Sin archivos no informa nada: la operación queda con la rueda indeterminada.
 */
export function seguimientoDeSubidas(archivos: ArchivoASubir[], informar: InformarProgreso, senal?: AbortSignal) {
  const total = archivos.reduce((suma, a) => suma + Math.max(1, a.tamano), 0)
  const fraccion = new Map<string, number>(archivos.map((a) => [a.clave, 0]))
  const completados = new Set<string>()
  const soloImagenes = archivos.length > 0 && archivos.every((a) => a.esImagen)

  const nombre = (cantidad: number) =>
    soloImagenes ? (cantidad === 1 ? 'imagen' : 'imágenes') : (cantidad === 1 ? 'archivo' : 'archivos')

  const notificar = () => {
    if (archivos.length === 0) return
    const enviados = archivos.reduce((suma, a) => suma + (fraccion.get(a.clave) ?? 0) * Math.max(1, a.tamano), 0)
    const porcentaje = Math.min(100, Math.floor((enviados / total) * 100))
    const todoEnviado = archivos.every((a) => (fraccion.get(a.clave) ?? 0) >= 1)
    if (todoEnviado) {
      informar({ porcentaje: null, detalle: PROCESANDO_SERVIDOR })
      return
    }
    const n = archivos.length
    const actual = Math.min(n, completados.size + 1)
    const detalle = n === 1
      ? `Subiendo ${soloImagenes ? 'la imagen' : 'el archivo'}`
      : `Subiendo ${actual} de ${n} ${nombre(n)}`
    informar({ porcentaje, detalle })
  }

  return {
    hayArchivos: archivos.length > 0,
    /** Config de axios para la petición que sube `clave`: progreso real y cancelación por timeout. */
    config(clave: string): AxiosRequestConfig {
      if (!fraccion.has(clave)) return { signal: senal }
      return {
        signal: senal,
        onUploadProgress: (evento: AxiosProgressEvent) => {
          const valor = evento.total ? evento.loaded / evento.total : (evento.progress ?? 0)
          fraccion.set(clave, Math.min(1, valor))
          notificar()
        },
      }
    },
    /** Marca la respuesta recibida (el archivo ya está guardado en el servidor). */
    completar(clave: string) {
      if (!fraccion.has(clave)) return
      fraccion.set(clave, 1)
      completados.add(clave)
      notificar()
    },
    /** Arranca en 0 % para que la rueda muestre el porcentaje desde el inicio. */
    iniciar() {
      notificar()
    },
  }
}

export type SeguimientoSubidas = ReturnType<typeof seguimientoDeSubidas>

export const esArchivoImagen = (archivo: File) =>
  archivo.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(archivo.name)
