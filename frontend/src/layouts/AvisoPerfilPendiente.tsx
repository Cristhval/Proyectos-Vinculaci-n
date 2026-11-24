import { useState } from 'react'
import { UserRound } from 'lucide-react'
import Aviso, { AccionAviso } from '@/components/ui/Aviso'

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

/** Aviso de perfil incompleto (usa el componente Aviso común a todo el sistema). */
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
    <Aviso
      variante="advertencia"
      icono={<UserRound size={15} />}
      titulo="Información de perfil pendiente"
      descripcion="Para utilizar todas las funcionalidades del sistema, completa los datos que aún faltan."
      accion={<AccionAviso onClick={() => onCompletar(ancla ? `/perfil#${ancla}` : '/perfil')}>Completar información</AccionAviso>}
      onCerrar={cerrar}
      className="mb-6"
    >
      Datos pendientes: {lista}
    </Aviso>
  )
}
