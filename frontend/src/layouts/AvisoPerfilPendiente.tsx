import { useState } from 'react'
import { X } from 'lucide-react'

const CLAVE_OCULTO = 'aviso-perfil-oculto'

/** Ancla del campo en la página de perfil (ids de PerfilPage). */
const ANCLAS: Record<string, string> = {
  documento_identidad: 'cedula',
  carrera: 'carrera',
  telefono: 'telefono',
  direccion: 'direccion',
}

/** «Teléfono», «Teléfono y dirección», «Teléfono, dirección y carrera». */
export function enumerarPendientes(etiquetas: string[]) {
  const items = etiquetas.map((e, i) => (i === 0 ? e.charAt(0).toUpperCase() + e.slice(1) : e.charAt(0).toLowerCase() + e.slice(1)))
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

function ocultoEnSesion() {
  try { return sessionStorage.getItem(CLAVE_OCULTO) === '1' } catch { return false }
}

interface Props {
  /** Campos vacíos que informa la API (`user.campos_pendientes`); se actualiza al guardar el perfil. */
  pendientes: { campo: string; etiqueta: string }[]
  onCompletar: (ruta: string) => void
}

/**
 * Aviso de perfil incompleto: una fila compacta con un punto naranja como único acento.
 * En móvil, dos líneas: título y cierre arriba; datos pendientes y enlace abajo.
 */
export default function AvisoPerfilPendiente({ pendientes, onCompletar }: Props) {
  const [oculto, setOculto] = useState(ocultoEnSesion)
  if (oculto || pendientes.length === 0) return null

  const ancla = ANCLAS[pendientes[0]!.campo]
  const lista = enumerarPendientes(pendientes.map((p) => p.etiqueta))
  const cerrar = () => {
    setOculto(true)
    try { sessionStorage.setItem(CLAVE_OCULTO, '1') } catch { /* sin almacenamiento: se oculta solo en esta vista */ }
  }

  return (
    <div
      role="status"
      className="mb-6 grid grid-cols-[8px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 rounded-[6px] border border-line bg-bg-soft px-4 py-2.5 sm:grid-cols-[8px_minmax(0,1fr)_auto_auto] min-[1680px]:grid-cols-[8px_auto_minmax(0,1fr)_auto_auto]"
    >
      <span className="h-2 w-2 rounded-full bg-naranja" aria-hidden="true" />

      <p className="col-start-2 row-start-1 min-w-0 text-sm leading-5">
        <span className="font-semibold text-ink">Información de perfil pendiente</span>
        <span className="hidden text-ink-muted sm:inline">
          <span className="mx-1.5 text-line-strong" aria-hidden="true">·</span>
          Para utilizar todas las funcionalidades del sistema, completa los datos que aún faltan.
        </span>
      </p>

      {/* Móvil: segunda línea con los datos y el enlace. Desde sm, cada uno va a su columna. */}
      <div className="col-span-2 col-start-2 row-start-2 flex items-center justify-between gap-3 sm:contents">
        <p
          title={`Datos pendientes: ${lista}`}
          className="min-w-0 truncate text-[13px] leading-4 text-ink-muted sm:col-start-2 sm:row-start-2 sm:whitespace-normal min-[1680px]:col-start-3 min-[1680px]:row-start-1"
        >
          {/* En móvil solo los campos y en una línea, para no pasar de dos líneas en total. */}
          <span className="hidden sm:inline">Datos pendientes: </span>{lista}
        </p>
        <button
          type="button"
          onClick={() => onCompletar(ancla ? `/perfil#${ancla}` : '/perfil')}
          className="whitespace-nowrap text-[13px] font-medium text-ink underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:text-sm min-[1680px]:col-start-4 min-[1680px]:row-span-1"
        >
          Completar información
        </button>
      </div>

      <button
        type="button"
        onClick={cerrar}
        aria-label="Cerrar aviso"
        className="col-start-3 row-start-1 flex h-6 w-6 items-center justify-center justify-self-end rounded text-ink-light transition-colors hover:bg-panel-alterno hover:text-ink sm:col-start-4 sm:row-span-2 min-[1680px]:col-start-5 min-[1680px]:row-span-1"
      >
        <X size={16} />
      </button>
    </div>
  )
}
