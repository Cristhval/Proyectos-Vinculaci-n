import { useRef, useState } from 'react'
import type ReCAPTCHA from 'react-google-recaptcha'
import { authApi, mensajeDeError } from '@/api/auth'
import AlertaFormulario from './components/AlertaFormulario'
import CaptchaField from './components/CaptchaField'
import PantallaAcceso from './components/PantallaAcceso'
import { claseBotonPrimario, claseEtiqueta, claseInput } from './components/estilos'

export default function RecuperarPage() {
  const captchaRef = useRef<ReCAPTCHA>(null)
  const [email, setEmail] = useState('')
  const [captcha, setCaptcha] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviado, setEnviado] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Escribe el correo con el que te registraste.')
      return
    }
    if (!captcha) return
    setCargando(true)
    setError(null)
    try {
      const { data } = await authApi.solicitarRecuperacion(email.trim(), captcha)
      setEnviado(data.message)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
      captchaRef.current?.reset()
      setCaptcha(null)
    }
  }

  return (
    <PantallaAcceso
      titulo="Recupera tu contraseña."
      subtitulo="Te enviaremos un enlace para crear una nueva. Vence en 30 minutos."
      volver={{ to: '/login', texto: 'Volver a iniciar sesión' }}
    >
      {enviado ? (
        <AlertaFormulario tipo="exito" mensaje={enviado} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <AlertaFormulario mensaje={error} />
          <div>
            <label htmlFor="email" className={claseEtiqueta}>Correo</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={claseInput()}
              placeholder="nombre@unl.edu.ec"
            />
          </div>
          <CaptchaField value={captcha} ref={captchaRef} onChange={setCaptcha} />
          <button type="submit" disabled={cargando || !captcha} className={claseBotonPrimario}>
            {cargando ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
      )}
    </PantallaAcceso>
  )
}
