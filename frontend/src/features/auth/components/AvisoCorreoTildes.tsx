import Aviso, { AccionAviso } from '@/components/ui/Aviso'

interface Props {
  sugerencia: string
  onUsar: (correo: string) => void
}

/** Aviso de correo con tildes o ñ, con la sugerencia y el botón para aplicarla. */
export default function AvisoCorreoTildes({ sugerencia, onUsar }: Props) {
  return (
    <Aviso
      variante="advertencia"
      titulo="El correo no debe llevar tildes ni ñ."
      className="mt-2"
      accion={<AccionAviso onClick={() => onUsar(sugerencia)}>Usar este correo</AccionAviso>}
    >
      ¿Quisiste decir <span className="font-semibold text-ink">{sugerencia}</span>?
    </Aviso>
  )
}
