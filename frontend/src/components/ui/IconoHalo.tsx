import type { ReactNode } from 'react'

/** Paleta común de OperationStatusModal y ConfirmModal. */
export const COLOR_ESTADO = {
  marino: '#14213A',
  naranja: '#E85A3C',
  pista: '#E6ECF4',
  texto: '#5B6B82',
  exito: '#2F9E6E',
  error: '#C8403A',
  advertencia: '#E85A3C',
} as const

interface Props {
  color: string
  /** Diámetro del círculo; el halo mide ~1,44 veces (72 → 104, 56 → 80). */
  tamano: 56 | 72
  children: ReactNode
  /** Fundido y escala 0,9 → 1 al aparecer (sin animación con prefers-reduced-motion). */
  animar?: boolean
}

/** Círculo de color con ícono blanco sobre un halo del mismo color al 12 % de opacidad. */
export default function IconoHalo({ color, tamano, children, animar = true }: Props) {
  const halo = tamano === 72 ? 104 : 80
  return (
    <span
      className={`relative flex items-center justify-center rounded-full ${animar ? 'motion-safe:animate-icono-entrada' : ''}`}
      style={{ width: halo, height: halo, backgroundColor: `${color}1F` /* 12 % */ }}
      aria-hidden="true"
    >
      <span className="flex items-center justify-center rounded-full text-white" style={{ width: tamano, height: tamano, backgroundColor: color }}>
        {children}
      </span>
    </span>
  )
}
