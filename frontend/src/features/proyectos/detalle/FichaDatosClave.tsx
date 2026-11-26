import { Plus } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { ParticipanteProyecto, Proyecto } from '@/types/proyectos'
import { PARTICIPANTE_AVATAR_COLORS, ROL_PARTICIPANTE_LABELS, iniciales } from './constantes'

interface Props {
  proyecto: Proyecto
  participantes: ParticipanteProyecto[]
  actividadesCompletadas: number
  actividadesTotal: number
  diasRestantes: number | null
  puedeAgregarIntegrante: boolean
  onAgregarIntegrante: () => void
  onVerParticipantes: () => void
}

function Fila({ etiqueta, children, tono }: { etiqueta: string; children: React.ReactNode; tono?: 'alerta' | 'peligro' }) {
  const color = tono === 'peligro' ? 'text-status-error' : tono === 'alerta' ? 'text-[#B45309]' : 'text-ink'
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-[12.5px] text-ink-muted">{etiqueta}</dt>
      <dd className={`text-right text-[13px] font-semibold ${color}`}>{children}</dd>
    </div>
  )
}

/** Columna lateral con los datos clave del proyecto y sus integrantes. */
export default function FichaDatosClave({
  proyecto, participantes, actividadesCompletadas, actividadesTotal, diasRestantes,
  puedeAgregarIntegrante, onAgregarIntegrante, onVerParticipantes,
}: Props) {
  const p = proyecto.presupuesto
  const ejecutado = p ? Number(p.monto_ejecutado) : 0
  const vencido = diasRestantes !== null && diasRestantes < 0

  return (
    <div className="space-y-6">
      <section aria-labelledby="datos-clave-titulo">
        <h2 id="datos-clave-titulo" className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Datos clave</h2>
        <dl className="divide-y divide-line">
          <Fila etiqueta="Coordinador académico">{proyecto.coordinador_academico_nombre || '—'}</Fila>
          {proyecto.fecha_fin_real && <Fila etiqueta="Fin real">{formatDate(proyecto.fecha_fin_real)}</Fila>}
          {diasRestantes !== null && !proyecto.fecha_fin_real && (
            <Fila etiqueta="Plazo" tono={diasRestantes <= 0 ? 'peligro' : diasRestantes <= 30 ? 'alerta' : undefined}>
              {vencido ? `${Math.abs(diasRestantes)} días vencido` : `${diasRestantes} días restantes`}
            </Fila>
          )}
          <Fila etiqueta="Actividades completadas">{actividadesCompletadas}/{actividadesTotal}</Fila>
          <Fila etiqueta="Participantes">{participantes.length}</Fila>
          {p && ejecutado > 0 && <Fila etiqueta="Presupuesto ejecutado">{formatCurrency(p.monto_ejecutado)}</Fila>}
          {p && ejecutado > 0 && <Fila etiqueta="Saldo">{formatCurrency(p.monto_saldo)}</Fila>}
        </dl>
      </section>

      <section aria-labelledby="integrantes-titulo">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="integrantes-titulo" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Integrantes</h2>
          {participantes.length > 0 && (
            <button type="button" onClick={onVerParticipantes} className="text-[12px] font-semibold text-ink underline-offset-2 hover:underline">
              Ver todos
            </button>
          )}
        </div>
        {participantes.length === 0 ? (
          <p className="py-1 text-[13px] text-ink-muted">No hay participantes registrados</p>
        ) : (
          <ul className="space-y-2.5">
            {participantes.slice(0, 4).map((pt) => (
              <li key={pt.id} className="flex items-center gap-3">
                <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${PARTICIPANTE_AVATAR_COLORS[pt.rol] || PARTICIPANTE_AVATAR_COLORS.ESTUDIANTE}`}>
                  {iniciales(pt.usuario_nombre)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">{pt.usuario_nombre || '—'}</p>
                  <p className="text-[11.5px] text-ink-muted">{ROL_PARTICIPANTE_LABELS[pt.rol] || pt.rol}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {puedeAgregarIntegrante && (
          <button
            type="button"
            onClick={onAgregarIntegrante}
            className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-btn border border-line-strong bg-white text-[13px] font-medium text-ink transition-colors hover:bg-bg-soft"
          >
            <Plus size={14} aria-hidden="true" /> Agregar integrante
          </button>
        )}
      </section>
    </div>
  )
}
