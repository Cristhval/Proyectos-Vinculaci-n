import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi, mensajeDeError } from '@/api/auth'
import AlertaFormulario from './components/AlertaFormulario'
import PantallaAcceso from './components/PantallaAcceso'
import { claseBotonPrimario, claseEtiqueta, claseInput } from './components/estilos'

export default function RestablecerPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const uid = params.get('uid') ?? ''
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(uid && token ? null : 'El enlace no es válido o ya expiró.')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setCargando(true)
    setError(null)
    try {
      await authApi.restablecer({ uid, token, password, password2 })
      toast.success('Contraseña actualizada. Inicia sesión.')
      navigate('/login', { replace: true })
    } catch (err) {
      const e2 = err as { response?: { data?: { data?: { errores?: Record<string, string[]> } } } }
      const detalle = e2.response?.data?.data?.errores?.password?.[0]
      setError(detalle || mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }

  return (
    <PantallaAcceso
      titulo="Crea una contraseña nueva."
      subtitulo="Al guardarla se cerrarán las sesiones abiertas en otros dispositivos."
      volver={{ to: '/login', texto: 'Volver a iniciar sesión' }}
      pie={
        <p className="text-center text-sm text-ink-muted">
          ¿El enlace venció?{' '}
          <Link to="/recuperar" className="font-medium text-ink underline underline-offset-2 hover:text-accent">Pide uno nuevo</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AlertaFormulario mensaje={error} />
        <div>
          <label htmlFor="password" className={claseEtiqueta}>Contraseña nueva</label>
          <input id="password" type="password" autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} className={claseInput()} />
        </div>
        <div>
          <label htmlFor="password2" className={claseEtiqueta}>Repite la contraseña</label>
          <input id="password2" type="password" autoComplete="new-password" value={password2}
            onChange={(e) => setPassword2(e.target.value)} className={claseInput()} />
        </div>
        <button type="submit" disabled={cargando || !uid || !token} className={claseBotonPrimario}>
          {cargando ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </PantallaAcceso>
  )
}
