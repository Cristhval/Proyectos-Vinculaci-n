/**
 * Caché mínima para peticiones GET que varias partes de la UI disparan a la vez
 * (p. ej. los contadores del encabezado al montar el layout, al cambiar de ruta
 * y al recuperar el foco).
 *
 * - Deduplica: mientras una petición está en vuelo, quien pida la misma clave
 *   recibe la MISMA promesa (incluso si el servidor tarda por un arranque en frío).
 * - TTL corto: al terminar, la respuesta se reutiliza durante `ttlMs`.
 * - Los errores no se guardan: la siguiente llamada vuelve a intentar.
 *
 * Devuelve exactamente lo que devuelve `pedir` (la respuesta de axios), así que
 * los componentes no cambian.
 */
interface Entrada {
  promesa: Promise<unknown>
  /** `Infinity` mientras la petición está en vuelo. */
  expira: number
}

const entradas = new Map<string, Entrada>()

export function conCache<T>(clave: string, pedir: () => Promise<T>, ttlMs = 3000): Promise<T> {
  const actual = entradas.get(clave)
  if (actual && actual.expira > Date.now()) return actual.promesa as Promise<T>

  const entrada: Entrada = { promesa: Promise.resolve(), expira: Infinity }
  entrada.promesa = pedir().then(
    (valor) => {
      entrada.expira = Date.now() + ttlMs
      return valor
    },
    (error: unknown) => {
      if (entradas.get(clave) === entrada) entradas.delete(clave)
      throw error
    },
  )
  entradas.set(clave, entrada)
  return entrada.promesa as Promise<T>
}

/** Descarta las entradas cuya clave empieza por `prefijo` (todas si se omite). */
export function invalidarCache(prefijo = ''): void {
  for (const clave of entradas.keys()) {
    if (clave.startsWith(prefijo)) entradas.delete(clave)
  }
}

/** Envuelve una mutación para invalidar la caché relacionada cuando termina (con o sin error). */
export function invalidaAlTerminar<T>(promesa: Promise<T>, prefijo: string): Promise<T> {
  return promesa.finally(() => invalidarCache(prefijo))
}
