import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Eye, EyeOff } from 'lucide-react'
import type ReCAPTCHA from 'react-google-recaptcha'
import { useAuth } from '@/hooks/useAuth'
import type { ProveedorSocial } from '@/config/api'
import AlertaFormulario from './components/AlertaFormulario'
import BotonesSociales, { NOMBRE_PROVEEDOR } from './components/BotonesSociales'
import CaptchaField from './components/CaptchaField'
import PantallaAcceso from './components/PantallaAcceso'
import { claseBotonPrimario, claseEtiqueta, claseInput } from './components/estilos'

function mensajeSocial(error: string | null, proveedor: string | null): string | null {
  if (!error) return null
  const nombre = NOMBRE_PROVEEDOR[proveedor as ProveedorSocial] ?? 'el proveedor'
  if (error === 'cuenta_no_registrada') {
    return `Todavía no tienes acceso al sistema.`
  }
  if (error === 'solicitud_pendiente') return 'Tu solicitud de acceso está en revisión. Te avisaremos por correo.'
  if (error === 'solicitud_rechazada') return 'Tu solicitud de acceso no fue aprobada. Contacta al administrador.'
  return `No se pudo completar el inicio de sesión con ${nombre}. Inténtalo de nuevo.`
}

export default function LoginPage() {
  const { login } = useAuth()
  const [params] = useSearchParams()
  const captchaRef = useRef<ReCAPTCHA>(null)
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState<string | null>(null)
  const [verPassword, setVerPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(() => mensajeSocial(params.get('error'), params.get('proveedor')))
  const [invalidos, setInvalidos] = useState<Set<'usuario' | 'password'>>(new Set())

  const limpiar = (campo: 'usuario' | 'password') =>
    setInvalidos((prev) => { const n = new Set(prev); n.delete(campo); return n })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const faltan = new Set<'usuario' | 'password'>()
    if (!usuario.trim()) faltan.add('usuario')
    if (!password) faltan.add('password')
    setInvalidos(faltan)
    if (faltan.size > 0) {
      setError('Escribe tu usuario o correo y tu contraseña.')
      return
    }
    if (!captcha) {
      setError('Marca la casilla "No soy un robot" para continuar.')
      return
    }

    setCargando(true)
    setError(null)
    const fallo = await login({ usuario: usuario.trim(), password, captcha_token: captcha })
    setCargando(false)
    if (fallo) {
      setError(fallo)
      // Un token de reCAPTCHA solo vale una vez: hay que volver a marcar la casilla.
      captchaRef.current?.reset()
      setCaptcha(null)
    }
  }

  return (
    <PantallaAcceso
      titulo="Bienvenido de nuevo."
      subtitulo="Ingresa con tu cuenta institucional."
      pie={
        <p className="text-center text-sm text-ink-muted">
          ¿No tienes acceso?{' '}
          <Link to="/registro" className="font-medium text-ink underline underline-offset-2 transition-colors hover:text-accent">
            Solicitar acceso
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {params.get('error') === 'cuenta_no_registrada' ? (
          <div className="rounded-btn border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Todavía no tienes acceso al sistema.{' '}
            <Link to="/registro" className="font-semibold underline underline-offset-2">Solicitar acceso</Link>
          </div>
        ) : <AlertaFormulario mensaje={error} />}

        <div>
          <label htmlFor="usuario" className={claseEtiqueta}>Usuario o correo</label>
          <input
            id="usuario"
            type="text"
            autoComplete="username"
            value={usuario}
            onChange={(e) => { setUsuario(e.target.value); limpiar('usuario') }}
            className={claseInput(invalidos.has('usuario'))}
            placeholder="usuario o nombre@unl.edu.ec"
            aria-invalid={invalidos.has('usuario')}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-medium text-ink-muted">Contraseña</label>
            <Link to="/recuperar" className="text-xs text-ink-muted underline underline-offset-2 transition-colors hover:text-ink">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={verPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); limpiar('password') }}
              className={`${claseInput(invalidos.has('password'))} pr-10`}
              placeholder="••••••••"
              aria-invalid={invalidos.has('password')}
            />
            <button
              type="button"
              onClick={() => setVerPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-ink-light transition-colors hover:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <CaptchaField value={captcha} ref={captchaRef} onChange={(token) => { setCaptcha(token); if (token) setError(null) }} />

        <button type="submit" disabled={cargando || !captcha} className={claseBotonPrimario}>
          {cargando ? 'Ingresando…' : 'Iniciar sesión'}
          {!cargando && (
            <ArrowUpRight size={14} aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          )}
        </button>
      </form>

      <BotonesSociales />
    </PantallaAcceso>
  )
}
