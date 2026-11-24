import { useState } from 'react'
import { UserRound, X } from 'lucide-react'

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
 * Aviso de perfil incompleto en dos niveles: arriba, ícono de perfil con el punto de estado
 * naranja (único acento), título y descripción; abajo, los datos pendientes y la acción.
 * En móvil todo se apila en vertical.
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
    <div role="status" className="mb-6 rounded-[6px] border border-line bg-bg-soft px-4 py-1.5">
      <div className="flex items-start gap-2.5">
        <span className="relative mt-0.5 flex-shrink-0 text-ink-muted" aria-hidden="true">
          <UserRound size={15} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-naranja ring-2 ring-bg-soft" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-5">
            <span className="font-semibold text-ink">Información de perfil pendiente</span>
            <span className="hidden text-ink-muted sm:inline">
              <span className="mx-1.5 text-line-strong" aria-hidden="true">·</span>
              Para utilizar todas las funcionalidades del sistema, completa los datos que aún faltan.
            </span>
          </p>

          <div className="mt-1 flex flex-col items-start gap-1.5 sm:mt-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <p className="min-w-0 break-words text-[13px] leading-5 text-ink-muted">Datos pendientes: {lista}</p>
            <button
              type="button"
              onClick={() => onCompletar(ancla ? `/perfil#${ancla}` : '/perfil')}
              className="inline-flex h-[22px] flex-shrink-0 items-center whitespace-nowrap rounded-btn bg-ink px-2.5 text-xs font-medium text-white transition-colors hover:bg-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-1"
            >
              Completar información
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar aviso"
          className="-mr-1.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-ink-light transition-colors hover:bg-panel-alterno hover:text-ink"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
