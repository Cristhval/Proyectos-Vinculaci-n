import { useState } from 'react'
import { ImageOff, Images } from 'lucide-react'
import VisorImagenes, { type ImagenVisor } from './VisorImagenes'

export interface ImagenGaleria extends ImagenVisor {
  miniatura: string
  etiqueta?: string
}

interface Props {
  imagenes: ImagenGaleria[]
  textoVacio?: string
}

/** Miniatura con respaldo: si la URL firmada venció o falla, muestra un ícono en lugar de un hueco. */
function Miniatura({ imagen, indice, onAbrir }: { imagen: ImagenGaleria; indice: number; onAbrir: () => void }) {
  const [fallo, setFallo] = useState(false)
  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-label={`Ampliar ${imagen.nombre || `imagen ${indice + 1}`}`}
      className="group relative aspect-[4/3] overflow-hidden rounded-[4px] border border-line bg-bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naranja focus-visible:ring-offset-1"
    >
      {fallo ? (
        <span className="flex h-full w-full items-center justify-center text-ink-light">
          <ImageOff size={20} aria-hidden="true" />
        </span>
      ) : (
        <img
          src={imagen.miniatura}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFallo(true)}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
        />
      )}
      {imagen.etiqueta && (
        <span className="absolute left-1.5 top-1.5 rounded-[3px] bg-ink/85 px-1.5 py-0.5 text-[10.5px] font-semibold text-white">
          {imagen.etiqueta}
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-naranja transition-transform duration-200 group-hover:scale-x-100" aria-hidden="true" />
    </button>
  )
}

/** Galería en grilla con visor ampliado. Las miniaturas se cargan diferidas (loading="lazy"). */
export default function GaleriaImagenes({ imagenes, textoVacio = 'Sin imágenes registradas' }: Props) {
  const [abierta, setAbierta] = useState<number | null>(null)

  if (imagenes.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-[4px] border border-dashed border-line-strong bg-bg-soft px-4 py-5">
        <Images size={18} className="flex-shrink-0 text-ink-light" aria-hidden="true" />
        <p className="text-[13px] text-ink-muted">{textoVacio}</p>
      </div>
    )
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {imagenes.map((imagen, i) => (
          <li key={imagen.id}>
            <Miniatura imagen={imagen} indice={i} onAbrir={() => setAbierta(i)} />
          </li>
        ))}
      </ul>
      <VisorImagenes imagenes={imagenes} indice={abierta} onCambiar={setAbierta} />
    </>
  )
}
