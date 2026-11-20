import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BadgeCheck, CheckCircle2 } from 'lucide-react'
import { authApi } from '@/api/auth'
import type { ProveedorSocial } from '@/config/api'
import AlertaFormulario from './components/AlertaFormulario'
import { NOMBRE_PROVEEDOR } from './components/BotonesSociales'
import PantallaAcceso from './components/PantallaAcceso'
import { claseBotonPrimario, claseEtiqueta } from './components/estilos'

/** Roles que se pueden pedir; el administrador decide el definitivo. */
const ROLES = [
  { value: 'ESTUDIANTE', titulo: 'Estudiante', descripcion: 'Participo en proyectos y registro avances.' },
  { value: 'DOCENTE', titulo: 'Docente', descripcion: 'Dirijo proyectos y reviso a mis estudiantes.' },
  { value: 'COORDINADOR', titulo: 'Coordinador', descripcion: 'Superviso los proyectos de mi carrera.' },
]

interface Identidad { email: string; nombre: string; proveedor: ProveedorSocial }

const mensajeDe = (error: any, porDefecto: string) => error?.response?.data?.message || porDefecto

const iniciales = (nombre: string, email: string) =>
  (nombre || email).split(/[\s.@]+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')

/**
 * Primera vez con Google/GitHub: el proveedor ya verificó nombre y correo,
 * así que solo se pide el rol. La cuenta queda pendiente hasta que el administrador la apruebe.
 */
export default function RegistroSocialPage() {
  const [params] = useSearchParams()
  const pase = params.get('pase') ?? ''
  const [identidad, setIdentidad] = useState<Identidad | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorPase, setErrorPase] = useState<string | null>(null)
  const [rol, setRol] = useState('')
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviada, setEnviada] = useState(false)

  useEffect(() => {
    if (!pase) {
      setErrorPase('El enlace no es válido. Vuelve a continuar con Google desde el inicio de sesión.')
      setCargando(false)
      return
    }
    authApi.registroSocial(pase)
      .then(({ data }) => setIdentidad(data.data))
      .catch((e) => setErrorPase(mensajeDe(e, 'No pudimos verificar tu identidad. Vuelve a intentarlo.')))
      .finally(() => setCargando(false))
  }, [pase])

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rol) return setError('Elige el rol que necesitas.')
    setEnviando(true)
    setError(null)
    try {
      await authApi.enviarRegistroSocial(pase, rol, motivo.trim())
      setEnviada(true)
    } catch (err) {
      setError(mensajeDe(err, 'No se pudo enviar la solicitud. Inténtalo de nuevo.'))
    } finally {
      setEnviando(false)
    }
  }

  const volver = { to: '/login', texto: 'Volver al inicio de sesión' }

  if (enviada && identidad) {
    return (
      <PantallaAcceso titulo="Solicitud enviada" subtitulo="Tu cuenta fue creada y está pendiente de aprobación." volver={volver}>
        <div className="space-y-5 text-sm text-ink">
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
            <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
            <p>Un administrador revisará tu acceso. Te avisaremos a <strong className="font-semibold">{identidad.email}</strong> cuando se resuelva.</p>
          </div>
          <p className="text-ink-muted">Cuando tu solicitud sea aprobada, entra con el botón <strong className="font-medium text-ink">{NOMBRE_PROVEEDOR[identidad.proveedor]}</strong> en la pantalla de inicio de sesión.</p>
          <Link to="/login" className={claseBotonPrimario}>Ir al inicio de sesión</Link>
        </div>
      </PantallaAcceso>
    )
  }

  return (
    <PantallaAcceso titulo="Completa tu solicitud" subtitulo="Último paso para solicitar acceso al sistema." volver={volver}>
      {cargando && <p className="text-sm text-ink-muted">Verificando tu identidad…</p>}

      {!cargando && errorPase && (
        <div className="space-y-5">
          <AlertaFormulario mensaje={errorPase} />
          <Link to="/login" className={claseBotonPrimario}>Volver al inicio de sesión</Link>
        </div>
      )}

      {!cargando && identidad && (
        <form onSubmit={enviar} className="space-y-6" noValidate>
          <AlertaFormulario mensaje={error} />

          {/* Identidad verificada por el proveedor: no se edita */}
          <div className="flex items-center gap-3 rounded-lg border border-line bg-bg-soft px-4 py-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
              {iniciales(identidad.nombre, identidad.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{identidad.nombre || identidad.email}</p>
              <p className="truncate text-sm text-ink-muted">{identidad.email}</p>
            </div>
            <span className="inline-flex flex-shrink-0 items-center gap-1 text-xs font-medium text-emerald-700" title={`Verificado por ${NOMBRE_PROVEEDOR[identidad.proveedor]}`}>
              <BadgeCheck size={15} aria-hidden="true" />
              Verificado
            </span>
          </div>

          <fieldset>
            <legend className={claseEtiqueta}>¿Qué rol necesitas?</legend>
            <div className="space-y-2" role="radiogroup">
              {ROLES.map((r) => {
                const activo = rol === r.value
                return (
                  <label
                    key={r.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-3 transition-colors ${activo ? 'border-ink bg-bg-soft' : 'border-line hover:border-line-strong hover:bg-bg-soft/60'}`}
                  >
                    <input type="radio" name="rol" value={r.value} checked={activo} onChange={() => { setRol(r.value); setError(null) }} className="sr-only" />
                    <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${activo ? 'border-ink bg-ink' : 'border-line-strong bg-white'}`}>
                      {activo && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink">{r.titulo}</span>
                      <span className="block text-xs text-ink-muted">{r.descripcion}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-ink-light">El administrador confirmará el rol al aprobar tu acceso.</p>
          </fieldset>

          <div>
            <label htmlFor="motivo" className={claseEtiqueta}>Motivo <span className="font-normal text-ink-light">(opcional)</span></label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Por ejemplo: dirijo el proyecto de alfabetización digital en Vilcabamba."
              className="w-full resize-y rounded-btn border border-line px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </div>

          <button type="submit" disabled={enviando || !rol} className={claseBotonPrimario}>
            {enviando ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </form>
      )}
    </PantallaAcceso>
  )
}
