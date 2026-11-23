import { useCallback, useEffect, useRef, useState } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Power } from 'lucide-react'
import toast from 'react-hot-toast'
import { Bloque, Vacio } from '@/components/panel/Bloques'
import { ActionIcon, Button, ConfirmModal, Table } from '@/components/ui'
import { dispositivosApi, mensajeDeError } from '@/api/dispositivos'
import { formatDateTime } from '@/lib/formatters'
import type { Dispositivo, RegistrarDispositivoDatos, RespuestaConToken } from '@/types/iot'
import DispositivoFormModal from './DispositivoFormModal'
import EstadoConexionBadge from './EstadoConexionBadge'
import TokenDispositivoModal from './TokenDispositivoModal'

/** Cada cuánto se vuelve a pedir el estado de conexión mientras la pestaña está abierta (PA-28.5). */
const REFRESCO_MS = 60_000

interface Props {
  proyectoId: number
  monitoreoActivo: boolean
  /** Responsable, coordinador o admin. Solo oculta botones: el backend vuelve a validar. */
  puedeGestionar: boolean
}

type Confirmacion = { tipo: 'baja' | 'regenerar'; dispositivo: Dispositivo } | null
type TokenVisible = { token: string; identificador: string; titulo: string } | null

const VARIABLES = (d: Dispositivo) => [
  d.mide_temperatura && 'Temperatura',
  d.mide_humedad && 'Humedad',
  d.mide_co2 && 'CO₂',
].filter(Boolean) as string[]

function UltimaLectura({ iso }: { iso: string | null }) {
  if (!iso) return <span className="text-xs text-ink-muted">Sin lecturas</span>
  return (
    <span className="block leading-tight">
      <span className="block text-sm tabular-nums text-ink-texto">{formatDateTime(iso)}</span>
      <span className="block text-xs text-ink-muted">{formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: es })}</span>
    </span>
  )
}

export default function DispositivosTab({ proyectoId, monitoreoActivo, puedeGestionar }: Props) {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [cargando, setCargando] = useState(true)
  const [formAbierto, setFormAbierto] = useState(false)
  const [editando, setEditando] = useState<Dispositivo | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [confirmacion, setConfirmacion] = useState<Confirmacion>(null)
  const [procesando, setProcesando] = useState(false)
  const [tokenVisible, setTokenVisible] = useState<TokenVisible>(null)
  const montado = useRef(true)

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true)
    try {
      const { data } = await dispositivosApi.listar(proyectoId)
      if (montado.current) setDispositivos(data.data)
    } catch (err) {
      // En el refresco automático no se insiste con un toast cada minuto.
      if (!silencioso) toast.error(mensajeDeError(err, 'No se pudieron cargar los dispositivos.'))
    } finally {
      if (montado.current && !silencioso) setCargando(false)
    }
  }, [proyectoId])

  useEffect(() => {
    montado.current = true
    cargar()
    const intervalo = setInterval(() => {
      if (document.visibilityState === 'visible') cargar(true)
    }, REFRESCO_MS)
    return () => {
      montado.current = false
      clearInterval(intervalo)
    }
  }, [cargar])

  const reemplazar = (d: Dispositivo) =>
    setDispositivos((lista) => {
      const existe = lista.some((x) => x.id === d.id)
      return existe ? lista.map((x) => (x.id === d.id ? d : x)) : [d, ...lista]
    })

  const mostrarToken = (r: RespuestaConToken, titulo: string) =>
    setTokenVisible({ token: r.token, identificador: r.dispositivo.identificador, titulo })

  const abrirRegistro = () => { setEditando(null); setFormAbierto(true) }
  const abrirEdicion = (d: Dispositivo) => { setEditando(d); setFormAbierto(true) }

  const guardar = async (datos: RegistrarDispositivoDatos) => {
    setGuardando(true)
    try {
      if (editando) {
        const { data } = await dispositivosApi.editar(editando.id, { nombre: datos.nombre, descripcion: datos.descripcion })
        reemplazar(data.data)
        toast.success(data.message)
      } else {
        const { data } = await dispositivosApi.registrar(proyectoId, datos)
        reemplazar(data.data.dispositivo)
        mostrarToken(data.data, 'Dispositivo registrado')
        toast.success(data.message)
      }
      setFormAbierto(false)
    } catch (err) {
      toast.error(mensajeDeError(err))
    } finally {
      setGuardando(false)
    }
  }

  const confirmar = async () => {
    if (!confirmacion) return
    const { tipo, dispositivo } = confirmacion
    setProcesando(true)
    try {
      if (tipo === 'baja') {
        const { data } = await dispositivosApi.darDeBaja(dispositivo.id)
        reemplazar(data.data)
        toast.success(data.message)
      } else {
        const { data } = await dispositivosApi.regenerarToken(dispositivo.id)
        reemplazar(data.data.dispositivo)
        mostrarToken(data.data, 'Token regenerado')
        toast.success(data.message)
      }
      setConfirmacion(null)
    } catch (err) {
      toast.error(mensajeDeError(err))
    } finally {
      setProcesando(false)
    }
  }

  const columnas = [
    {
      key: 'identificador',
      header: 'Identificador',
      render: (d: Dispositivo) => <span className="font-mono text-xs text-ink">{d.identificador}</span>,
    },
    {
      key: 'nombre',
      header: 'Nombre',
      render: (d: Dispositivo) => (
        <span className="block min-w-[10rem] leading-tight">
          <span className="block text-sm font-medium text-ink">{d.nombre}</span>
          {d.descripcion && <span className="block max-w-xs truncate text-xs text-ink-muted" title={d.descripcion}>{d.descripcion}</span>}
        </span>
      ),
    },
    {
      key: 'variables',
      header: 'Mide',
      render: (d: Dispositivo) => (
        <span className="flex flex-wrap gap-1">
          {VARIABLES(d).map((v) => (
            <span key={v} className="rounded bg-bg-muted px-1.5 py-0.5 text-[11px] font-medium text-ink-muted">{v}</span>
          ))}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (d: Dispositivo) => <EstadoConexionBadge dispositivo={d} />,
    },
    {
      key: 'ultima_lectura',
      header: 'Última lectura',
      render: (d: Dispositivo) => <UltimaLectura iso={d.ultima_lectura} />,
    },
    ...(puedeGestionar
      ? [{
          key: 'acciones',
          header: 'Acciones',
          className: 'text-right',
          render: (d: Dispositivo) => (
            <span className="inline-flex items-center gap-0.5">
              <ActionIcon icon="editar" enabled={d.activo} onClick={() => abrirEdicion(d)}
                tooltipActivo="Editar nombre y descripción" tooltipDeshabilitado="Dispositivo dado de baja" />
              <ActionIcon icon="clave" enabled={d.activo} onClick={() => setConfirmacion({ tipo: 'regenerar', dispositivo: d })}
                tooltipActivo="Regenerar token" tooltipDeshabilitado="Dispositivo dado de baja" />
              <ActionIcon icon="eliminar" enabled={d.activo} onClick={() => setConfirmacion({ tipo: 'baja', dispositivo: d })}
                tooltipActivo="Dar de baja" tooltipDeshabilitado="Ya está dado de baja" />
            </span>
          ),
        }]
      : []),
  ]

  const hayDispositivos = dispositivos.length > 0

  return (
    <div className="space-y-4">
      {!monitoreoActivo && (
        <Bloque titulo="Monitoreo ambiental desactivado">
          <div className="flex items-start gap-3 px-5 py-6">
            <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-bg-muted text-ink-muted">
              <Power size={16} />
            </span>
            <div className="text-sm text-ink-muted">
              <p className="font-medium text-ink">Este proyecto no tiene el monitoreo ambiental activo.</p>
              <p className="mt-1">
                Mientras esté desactivado no se pueden registrar dispositivos ni recibir mediciones.
                El responsable del proyecto o la coordinación pueden activarlo cuando el proyecto esté aprobado o en ejecución.
                {hayDispositivos && ' Los dispositivos y su historial se conservan.'}
              </p>
            </div>
          </div>
        </Bloque>
      )}

      {(monitoreoActivo || cargando || hayDispositivos) && (
        <Bloque titulo="Dispositivos IoT">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
            <p className="text-xs text-ink-muted">
              {cargando ? 'Cargando…' : `${dispositivos.length} dispositivo${dispositivos.length === 1 ? '' : 's'}`}
              {' · El estado se actualiza cada minuto.'}
            </p>
            {puedeGestionar && monitoreoActivo && (
              <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={abrirRegistro}>
                Registrar dispositivo
              </Button>
            )}
          </div>
          {!cargando && !hayDispositivos ? (
            <Vacio texto={puedeGestionar
              ? 'Aún no hay dispositivos. Registre el primero para empezar a recibir mediciones.'
              : 'Este proyecto aún no tiene dispositivos registrados.'}
            />
          ) : (
            <div className="p-3">
              <Table columns={columnas} data={dispositivos} keyExtractor={(d) => d.id} loading={cargando} />
            </div>
          )}
        </Bloque>
      )}

      <DispositivoFormModal
        open={formAbierto}
        dispositivo={editando}
        guardando={guardando}
        onCancelar={() => setFormAbierto(false)}
        onGuardar={guardar}
      />

      <ConfirmModal
        isOpen={confirmacion?.tipo === 'baja'}
        titulo="¿Dar de baja este dispositivo?"
        mensaje={`${confirmacion?.dispositivo.identificador ?? ''} dejará de enviar mediciones y su token quedará inválido. Sus mediciones se conservan. Esta acción no se puede deshacer.`}
        confirmLabel={procesando ? 'Procesando…' : 'Dar de baja'}
        cancelLabel="Cancelar"
        confirmColor="rose"
        danger
        confirmDisabled={procesando}
        onConfirm={confirmar}
        onCancel={() => !procesando && setConfirmacion(null)}
      />

      <ConfirmModal
        isOpen={confirmacion?.tipo === 'regenerar'}
        titulo="¿Regenerar el token?"
        mensaje={`El token actual de ${confirmacion?.dispositivo.identificador ?? ''} dejará de funcionar de inmediato. Tendrá que cargar el nuevo token en el dispositivo.`}
        confirmLabel={procesando ? 'Procesando…' : 'Regenerar'}
        cancelLabel="Cancelar"
        confirmDisabled={procesando}
        onConfirm={confirmar}
        onCancel={() => !procesando && setConfirmacion(null)}
      />

      <TokenDispositivoModal
        token={tokenVisible?.token ?? null}
        identificador={tokenVisible?.identificador ?? ''}
        titulo={tokenVisible?.titulo ?? ''}
        onCerrar={() => setTokenVisible(null)}
      />
    </div>
  )
}
