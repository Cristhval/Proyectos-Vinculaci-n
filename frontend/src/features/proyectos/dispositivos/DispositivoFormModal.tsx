import { useEffect, useState } from 'react'
import { Cpu } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import type { Dispositivo, RegistrarDispositivoDatos } from '@/types/iot'

const SLUG = /^[a-zA-Z0-9_-]+$/

type Errores = Partial<Record<'identificador' | 'nombre' | 'variables', string>>

interface Props {
  open: boolean
  /** Si llega, el modal edita (solo nombre y descripción). */
  dispositivo?: Dispositivo | null
  guardando: boolean
  onCancelar: () => void
  onGuardar: (datos: RegistrarDispositivoDatos) => void
}

const VACIO: RegistrarDispositivoDatos = {
  identificador: '',
  nombre: '',
  descripcion: '',
  mide_temperatura: true,
  mide_humedad: true,
  mide_co2: true,
}

const VARIABLES: { campo: 'mide_temperatura' | 'mide_humedad' | 'mide_co2'; etiqueta: string; ayuda: string }[] = [
  { campo: 'mide_temperatura', etiqueta: 'Temperatura', ayuda: 'DHT11, °C' },
  { campo: 'mide_humedad', etiqueta: 'Humedad', ayuda: 'DHT11, %' },
  { campo: 'mide_co2', etiqueta: 'CO₂', ayuda: 'MQ-135, ppm' },
]

export function validarDispositivo(datos: RegistrarDispositivoDatos, editando: boolean): Errores {
  const errores: Errores = {}
  if (!editando) {
    const id = datos.identificador.trim()
    if (!id) errores.identificador = 'El identificador es obligatorio.'
    else if (!SLUG.test(id)) errores.identificador = 'Solo letras, números, guiones y guiones bajos (sin espacios).'
    else if (id.length > 50) errores.identificador = 'Máximo 50 caracteres.'
    if (!datos.mide_temperatura && !datos.mide_humedad && !datos.mide_co2) {
      errores.variables = 'Seleccione al menos una variable.'
    }
  }
  if (!datos.nombre.trim()) errores.nombre = 'El nombre es obligatorio.'
  else if (datos.nombre.trim().length > 120) errores.nombre = 'Máximo 120 caracteres.'
  return errores
}

export default function DispositivoFormModal({ open, dispositivo, guardando, onCancelar, onGuardar }: Props) {
  const editando = !!dispositivo
  const [datos, setDatos] = useState<RegistrarDispositivoDatos>(VACIO)
  const [errores, setErrores] = useState<Errores>({})
  const [intentado, setIntentado] = useState(false)

  useEffect(() => {
    if (!open) return
    setDatos(dispositivo ? { ...VACIO, ...dispositivo } : VACIO)
    setErrores({})
    setIntentado(false)
  }, [open, dispositivo])

  const cambiar = <K extends keyof RegistrarDispositivoDatos>(campo: K, valor: RegistrarDispositivoDatos[K]) => {
    const nuevos = { ...datos, [campo]: valor }
    setDatos(nuevos)
    if (intentado) setErrores(validarDispositivo(nuevos, editando))
  }

  const enviar = (e?: React.FormEvent) => {
    e?.preventDefault()
    setIntentado(true)
    const encontrados = validarDispositivo(datos, editando)
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) return
    onGuardar({
      ...datos,
      identificador: datos.identificador.trim().toLowerCase(),
      nombre: datos.nombre.trim(),
      descripcion: (datos.descripcion || '').trim(),
    })
  }

  return (
    <Modal
      open={open}
      onClose={guardando ? () => undefined : onCancelar}
      title={editando ? 'Editar dispositivo' : 'Registrar dispositivo'}
      subtitle={editando ? `Identificador ${dispositivo?.identificador} (no se puede cambiar)` : 'Al guardar se generará su token de acceso.'}
      icon={<Cpu size={18} className="text-ink" />}
      iconClassName="bg-bg-muted"
      footer={
        <>
          <Button variant="outline" onClick={onCancelar} disabled={guardando}>Cancelar</Button>
          <Button variant="primary" onClick={() => enviar()} loading={guardando}>
            {editando ? 'Guardar cambios' : 'Registrar'}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={enviar} noValidate>
        {!editando && (
          <Input
            id="dispositivo-identificador"
            label="Identificador *"
            placeholder="esp32-huerto-01"
            value={datos.identificador}
            maxLength={50}
            autoFocus
            onChange={(e) => cambiar('identificador', e.target.value)}
            error={errores.identificador}
            helperText="Único en todo el sistema. Se usa para reconocer el equipo."
          />
        )}
        <Input
          id="dispositivo-nombre"
          label="Nombre *"
          placeholder="Sensor del huerto norte"
          value={datos.nombre}
          maxLength={120}
          autoFocus={editando}
          onChange={(e) => cambiar('nombre', e.target.value)}
          error={errores.nombre}
        />
        <div className="space-y-1.5">
          <label htmlFor="dispositivo-descripcion" className="block text-xs font-medium text-ink-muted">Descripción</label>
          <textarea
            id="dispositivo-descripcion"
            rows={3}
            value={datos.descripcion}
            onChange={(e) => cambiar('descripcion', e.target.value)}
            placeholder="Ubicación, responsable en campo, observaciones…"
            className="w-full border border-line px-3 py-2 text-sm transition-all focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
        </div>
        {!editando && (
          <fieldset>
            <legend className="mb-1.5 text-xs font-medium text-ink-muted">Variables que mide *</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {VARIABLES.map((v) => (
                <label key={v.campo} className="flex cursor-pointer items-start gap-2 rounded-md border border-line px-3 py-2 text-sm hover:bg-bg-soft">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-naranja"
                    checked={datos[v.campo]}
                    onChange={(e) => cambiar(v.campo, e.target.checked)}
                  />
                  <span>
                    <span className="block font-medium text-ink">{v.etiqueta}</span>
                    <span className="block text-xs text-ink-muted">{v.ayuda}</span>
                  </span>
                </label>
              ))}
            </div>
            {errores.variables && <p className="mt-1.5 text-xs text-status-error">{errores.variables}</p>}
          </fieldset>
        )}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  )
}
