import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { solicitudesApi } from '@/api/solicitudes'
import type { SolicitudAcceso } from '@/types/solicitudes'

const ROLES = [
  ['ESTUDIANTE', 'Estudiante'],
  ['DOCENTE', 'Docente'],
  ['COORDINADOR', 'Coordinador'],
  ['DIRECTIVO', 'Directivo'],
  ['ADMIN', 'Administrador'],
] as const

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
      toast.success(`Acceso aprobado como ${ROLES.find(([value]) => value === rol)?.[1] || rol}`)
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

  return (
    <Modal open={Boolean(solicitud)} onClose={onClose} title="Solicitud de acceso" size="sm">
      <div className="space-y-3 text-sm text-ink">
        <p><strong>{solicitud.nombres}</strong></p>
        <p>{solicitud.email}</p>
        <p><span className="font-medium">Cédula:</span> {solicitud.documento_identidad}</p>
        <p><span className="font-medium">Rol solicitado:</span> {solicitud.rol_solicitado}</p>
        <p><span className="font-medium">Motivo:</span> {solicitud.motivo}</p>
        <p className="text-xs text-ink-muted">{new Date(solicitud.creada).toLocaleString('es-EC')}</p>
        <label className="block text-xs font-medium text-ink-muted" htmlFor="rol-asignado">Asignar rol</label>
        <select id="rol-asignado" value={rol} onChange={(e) => setRol(e.target.value)} className="w-full rounded-btn border border-line px-3 py-2">
          {ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {rechazando && (
          <textarea
            autoFocus
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo obligatorio del rechazo"
            className="min-h-24 w-full rounded-btn border border-line px-3 py-2"
          />
        )}
        <div className="flex justify-end gap-2 pt-2">
          {!rechazando
            ? <><Button type="button" variant="outline" onClick={() => setRechazando(true)}>Rechazar</Button><Button type="button" onClick={aprobar} disabled={loading}>Aprobar</Button></>
            : <><Button type="button" variant="outline" onClick={() => setRechazando(false)}>Cancelar</Button><Button type="button" onClick={rechazar} disabled={loading}>Confirmar rechazo</Button></>}
        </div>
      </div>
    </Modal>
  )
}
