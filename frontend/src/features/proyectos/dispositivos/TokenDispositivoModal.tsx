import { useEffect, useState } from 'react'
import { Check, Copy, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Aviso from '@/components/ui/Aviso'

async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    // Respaldo para navegadores sin Clipboard API o fuera de HTTPS.
    const area = document.createElement('textarea')
    area.value = texto
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  }
}

interface Props {
  /** Token en texto plano; null cierra el modal. */
  token: string | null
  identificador: string
  titulo: string
  onCerrar: () => void
}

/**
 * Muestra el token una única vez. No se cierra (ni con la X) hasta que el
 * usuario confirma que lo copió.
 */
export default function TokenDispositivoModal({ token, identificador, titulo, onCerrar }: Props) {
  const [copiado, setCopiado] = useState(false)
  const [confirmado, setConfirmado] = useState(false)

  useEffect(() => {
    setCopiado(false)
    setConfirmado(false)
  }, [token])

  useEffect(() => {
    if (!copiado) return
    const t = setTimeout(() => setCopiado(false), 2500)
    return () => clearTimeout(t)
  }, [copiado])

  const copiar = async () => {
    if (!token) return
    if (await copiarAlPortapapeles(token)) {
      setCopiado(true)
      toast.success('Token copiado al portapapeles')
    } else {
      toast.error('No se pudo copiar. Selecciónelo y cópielo manualmente.')
    }
  }

  const intentarCerrar = () => {
    if (!confirmado) {
      toast.error('Confirme que copió el token antes de cerrar.')
      return
    }
    onCerrar()
  }

  return (
    <Modal
      open={token !== null}
      onClose={intentarCerrar}
      title={titulo}
      subtitle={`Dispositivo ${identificador}`}
      icon={<KeyRound size={18} className="text-naranja" />}
      iconClassName="bg-naranja/10"
      footer={
        <Button variant="primary" onClick={intentarCerrar} disabled={!confirmado}>
          Listo, ya lo guardé
        </Button>
      }
    >
      <div className="space-y-4">
        <Aviso variante="advertencia" titulo="Este token no se volverá a mostrar">
          Cópielo ahora y péguelo en el archivo <code className="font-mono text-xs">config.h</code> del dispositivo.
          Si lo pierde, tendrá que regenerarlo.
        </Aviso>

        <div>
          <p className="mb-1.5 text-xs font-medium text-ink-muted">Token del dispositivo</p>
          <div className="flex items-stretch gap-2">
            <code
              className="min-w-0 flex-1 select-all break-all rounded-md border border-line bg-bg-soft px-3 py-2 font-mono text-xs text-ink"
              data-testid="token-dispositivo"
            >
              {token}
            </code>
            <Button
              variant={copiado ? 'outline' : 'institucional'}
              onClick={copiar}
              icon={copiado ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
              aria-live="polite"
            >
              {copiado ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-texto">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-naranja"
            checked={confirmado}
            onChange={(e) => setConfirmado(e.target.checked)}
          />
          Copié el token y lo guardé en un lugar seguro.
        </label>
      </div>
    </Modal>
  )
}
