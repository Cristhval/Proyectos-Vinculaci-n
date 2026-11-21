import { useEffect, useState } from 'react'

/**
 * Devuelve `valor` cuando deja de cambiar durante `espera` ms.
 *
 * Para buscadores que consultan la API mientras se escribe: la petición sale
 * una vez cuando la persona hace una pausa, no una por tecla.
 *
 *   const termino = useDebounce(texto, 300)
 *   useEffect(() => { buscar(termino) }, [termino])
 */
export function useDebounce<T>(valor: T, espera = 300): T {
  const [retrasado, setRetrasado] = useState(valor)
  useEffect(() => {
    const temporizador = setTimeout(() => setRetrasado(valor), espera)
    return () => clearTimeout(temporizador)
  }, [valor, espera])
  return retrasado
}
