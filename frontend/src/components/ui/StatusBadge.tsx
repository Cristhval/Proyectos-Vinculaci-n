import { clsx } from 'clsx'
import { ESTADO_PROYECTO_LABELS } from '@/lib/constants'
import { TONOS_ESTADO, TONO_ESTADO_PROYECTO, estiloDe } from '@/lib/estados'

interface StatusBadgeProps {
  estado: string
  texto?: string
}

interface StatusStyle {
  bg: string
  text: string
  dot: string
  pulse: boolean
  pulseColor?: string
}

/** Estilos derivados de la paleta única (lib/estados.ts); el punto late en los estados activos. */
const ACTIVOS = new Set(['EN_EJECUCION', 'EN_REVISION', 'EN_SUSPENSION'])
const STATUS_STYLES: Record<string, StatusStyle> = Object.fromEntries(
  Object.keys(TONO_ESTADO_PROYECTO).map((k) => {
    const t = estiloDe(TONO_ESTADO_PROYECTO, k)
    return [k, { bg: t.fondo, text: t.texto, dot: t.punto, pulse: ACTIVOS.has(k), pulseColor: ACTIVOS.has(k) ? t.punto : undefined }]
  }),
)

const FALLBACK: StatusStyle = {
  bg: TONOS_ESTADO.neutro.fondo,
  text: TONOS_ESTADO.neutro.texto,
  dot: TONOS_ESTADO.neutro.punto,
  pulse: false,
}

export default function StatusBadge({ estado, texto }: StatusBadgeProps) {
  const style: StatusStyle = STATUS_STYLES[estado] ?? FALLBACK
  const label = texto || ESTADO_PROYECTO_LABELS[estado] || estado

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-md whitespace-nowrap',
        style.bg,
        style.text,
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {style.pulse && style.pulseColor && (
          <span
            className={clsx(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              style.pulseColor,
            )}
          />
        )}
        <span
          className={clsx(
            'relative inline-flex rounded-full h-2 w-2',
            style.pulse ? style.pulseColor : style.dot,
          )}
        />
      </span>
      {label}
    </span>
  )
}
