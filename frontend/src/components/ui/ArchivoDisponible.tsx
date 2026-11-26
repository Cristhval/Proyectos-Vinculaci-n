import { useEffect, useState, type ReactNode } from 'react'
import { FileX } from 'lucide-react'

type Estado = 'comprobando' | 'disponible' | 'no-disponible'

/**
 * Los documentos siguen en el disco de Render, que se borra al reiniciar (ver docs/pendientes.md),
 * así que un enlace puede dar 404. Se comprueba una vez por URL con HEAD y se guarda el resultado.
 * Ante un error de red o de CORS no se oculta el enlace: solo 404 o 410 cuentan como "no disponible".
 */
const cache = new Map<string, Promise<Estado>>()

function comprobar(url: string): Promise<Estado> {
  let pendiente = cache.get(url)
  if (!pendiente) {
    pendiente = fetch(url, { method: 'HEAD', credentials: 'omit' })
      .then((r): Estado => (r.status === 404 || r.status === 410 ? 'no-disponible' : 'disponible'))
      .catch((): Estado => 'disponible')
    cache.set(url, pendiente)
  }
  return pendiente
}

export function useArchivoDisponible(url: string | null | undefined): Estado {
  const [estado, setEstado] = useState<Estado>(url ? 'comprobando' : 'no-disponible')
  useEffect(() => {
    if (!url) { setEstado('no-disponible'); return }
    let vigente = true
    setEstado('comprobando')
    void comprobar(url).then((e) => { if (vigente) setEstado(e) })
    return () => { vigente = false }
  }, [url])
  return estado
}

export function ArchivoNoDisponible({ compacto = false }: { compacto?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[3px] border border-line bg-bg-soft font-medium text-ink-muted ${compacto ? 'px-1.5 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-[11.5px]'}`}
      title="El archivo ya no está en el servidor. Vuelve a subirlo."
    >
      <FileX size={compacto ? 11 : 13} aria-hidden="true" />
      Archivo no disponible
    </span>
  )
}

interface Props {
  url: string | null | undefined
  /** El enlace normal; se muestra mientras se comprueba y si el archivo existe. */
  children: ReactNode
  compacto?: boolean
}

/** Muestra el enlace del documento o, si el servidor responde 404, «Archivo no disponible». */
export default function ArchivoDisponible({ url, children, compacto }: Props) {
  const estado = useArchivoDisponible(url)
  if (estado === 'no-disponible') return <ArchivoNoDisponible compacto={compacto} />
  return <>{children}</>
}
