import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AlertTriangle, ArrowLeft, Check, ShieldCheck, UserCheck } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { solicitudesApi } from '@/api/solicitudes'
import { ROL_AVATAR_STYLES, ROL_BADGE_STYLES, ROL_LABELS } from '@/lib/constants'
import type { SolicitudAcceso } from '@/types/solicitudes'
import Aviso from '@/components/ui/Aviso'

/** Roles asignables, con una línea que ayuda al administrador a decidir. */
const ROLES: { value: string; descripcion: string }[] = [
  { value: 'ESTUDIANTE', descripcion: 'Participa en proyectos y registra avances.' },
  { value: 'DOCENTE', descripcion: 'Dirige proyectos y revisa a sus estudiantes.' },
  { value: 'COORDINADOR', descripcion: 'Supervisa los proyectos de su carrera.' },
  { value: 'DIRECTIVO', descripcion: 'Consulta reportes e indicadores generales.' },
  { value: 'ADMIN', descripcion: 'Control total del sistema y de las cuentas.' },
]

const MOTIVOS_RAPIDOS = [
  'El correo no corresponde a la persona indicada.',
  'El rol solicitado no corresponde a su función.',
  'Falta información para validar la solicitud.',
]

const fechaLarga = (iso: string) =>
  new Date(iso).toLocaleString('es-EC', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function haceCuanto(iso: string) {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutos < 1) return 'hace un momento'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.round(horas / 24)
  return dias === 1 ? 'ayer' : `hace ${dias} días`
}

const iniciales = (nombre: string) =>
  nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?'

function RolBadge({ rol }: { rol: string }) {
  const estilo = ROL_BADGE_STYLES[rol]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${estilo?.bg ?? 'bg-bg-muted'} ${estilo?.text ?? 'text-ink'} ${estilo?.ring ?? 'ring-line'}`}>
      {ROL_LABELS[rol] ?? rol}
    </span>
  )
}

interface Props {
  solicitud: SolicitudAcceso | null
  onClose: () => void
  onResolved: () => void
}

export default function SolicitudAccesoModal({ solicitud, onClose, onResolved }: Props) {
  const [rol, setRol] = useState('')
  const [rechazando, setRechazando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setRol(solicitud?.rol_solicitado || '')
    setRechazando(false)
    setMotivo('')
  }, [solicitud])

  if (!solicitud) return null

  const aprobar = async () => {
    setLoading(true)
    try {
      await solicitudesApi.aprobar(solicitud.id, rol)
      toast.success(`Acceso aprobado como ${ROL_LABELS[rol] ?? rol}`)
      onResolved()
      onClose()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'No se pudo aprobar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  const rechazar = async () => {
    if (!motivo.trim()) return toast.error('Escribe el motivo del rechazo')
    setLoading(true)
    try {
      await solicitudesApi.rechazar(solicitud.id, motivo.trim())
      toast.success('Solicitud rechazada')
      onResolved()
      onClose()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'No se pudo rechazar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  const footer = rechazando ? (
    <>
      <Button type="button" variant="ghost" onClick={() => setRechazando(false)} disabled={loading} icon={<ArrowLeft size={15} />}>
        Volver
      </Button>
      <Button type="button" variant="danger" onClick={rechazar} loading={loading} disabled={!motivo.trim()}>
        Confirmar rechazo
      </Button>
    </>
  ) : (
    <div className="flex w-full items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => setRechazando(true)}
        disabled={loading}
        className="text-sm font-medium text-rose-600 transition-colors hover:text-rose-700 disabled:opacity-40"
      >
        Rechazar solicitud
      </button>
      <Button type="button" onClick={aprobar} loading={loading} disabled={!rol} icon={<Check size={15} />}>
        Aprobar como {ROL_LABELS[rol] ?? '…'}
      </Button>
    </div>
  )

  return (
    <Modal
      open={Boolean(solicitud)}
      onClose={onClose}
      title={rechazando ? 'Rechazar solicitud' : 'Solicitud de acceso'}
      subtitle={rechazando ? 'La persona recibirá el motivo por correo.' : `Recibida ${haceCuanto(solicitud.creada)}`}
      icon={rechazando ? <AlertTriangle size={18} className="text-rose-600" /> : <UserCheck size={18} className="text-ink" />}
      iconClassName={rechazando ? 'bg-rose-50' : 'bg-bg-muted'}
      size="md"
      footer={footer}
    >
      <div className="space-y-5 text-sm text-ink">
        {/* Solicitante */}
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${ROL_AVATAR_STYLES[solicitud.rol_solicitado] ?? 'bg-ink text-white'}`}>
            {iniciales(solicitud.nombres)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-ink">{solicitud.nombres}</p>
            <p className="truncate text-ink-muted">{solicitud.email}</p>
          </div>
          <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Pendiente
          </span>
        </div>

        {/* Datos */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-line bg-bg-soft px-4 py-3">
          <div>
            <dt className="text-xs text-ink-muted">Cédula</dt>
            <dd className="mt-0.5 font-mono text-[13px] tracking-wide text-ink">{solicitud.documento_identidad || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Rol solicitado</dt>
            <dd className="mt-1"><RolBadge rol={solicitud.rol_solicitado} /></dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-ink-muted">Recibida</dt>
            <dd className="mt-0.5 text-ink">{fechaLarga(solicitud.creada)}</dd>
          </div>
        </dl>

        {solicitud.motivo && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-ink-muted">Motivo</p>
            <blockquote className="border-l-2 border-line-strong pl-3 leading-relaxed text-ink">{solicitud.motivo}</blockquote>
          </div>
        )}

        {!rechazando ? (
          /* Asignación de rol */
          <fieldset>
            <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-muted">Asignar rol</legend>
            <div className="space-y-1.5" role="radiogroup">
              {ROLES.map(({ value, descripcion }) => {
                const activo = rol === value
                return (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${activo ? 'border-ink bg-bg-soft' : 'border-line hover:border-line-strong hover:bg-bg-soft/60'}`}
                  >
                    <input
                      type="radio"
                      name="rol-asignado"
                      value={value}
                      checked={activo}
                      onChange={() => setRol(value)}
                      className="sr-only"
                    />
                    <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${activo ? 'border-ink bg-ink' : 'border-line-strong bg-white'}`}>
                      {activo && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-ink">{ROL_LABELS[value]}</span>
                        {value === solicitud.rol_solicitado && (
                          <span className="rounded bg-bg-muted px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Solicitado</span>
                        )}
                      </span>
                      <span className="block text-xs text-ink-muted">{descripcion}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            {rol === 'ADMIN' && (
              <Aviso variante="advertencia" icono={<ShieldCheck size={16} />} className="mt-2">
                Este rol podrá administrar cuentas y aprobar otras solicitudes. Asígnalo solo a personal autorizado.
              </Aviso>
            )}
          </fieldset>
        ) : (
          /* Rechazo */
          <div>
            <label htmlFor="motivo-rechazo" className="mb-2 block text-xs font-medium uppercase tracking-wider text-ink-muted">Motivo del rechazo</label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {MOTIVOS_RAPIDOS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMotivo(m)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${motivo === m ? 'border-ink bg-ink text-white' : 'border-line text-ink-muted hover:border-line-strong hover:text-ink'}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <textarea
              id="motivo-rechazo"
              autoFocus
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              maxLength={500}
              placeholder="Explica brevemente por qué no se aprueba el acceso."
              className="min-h-24 w-full resize-y rounded-lg border border-line px-3 py-2 text-sm text-ink placeholder:text-ink-light focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
            />
            <p className="mt-1 text-right text-xs text-ink-light">{motivo.length}/500</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
