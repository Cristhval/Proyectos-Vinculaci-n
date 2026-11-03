import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui'

/** Destino del login social: canjea el código de un solo uso por la sesión. */
export default function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { loginConTokens } = useAuth()
  const canjeado = useRef(false)

  useEffect(() => {
    // StrictMode ejecuta los efectos dos veces en desarrollo; el código solo se puede canjear una vez.
    if (canjeado.current) return
    canjeado.current = true
    const code = params.get('code')
    if (!code) {
      navigate('/login?error=social_fallido', { replace: true })
      return
    }
    authApi.canjear(code)
      .then(({ data }) => loginConTokens(data.data))
      .catch(() => navigate('/login?error=social_fallido', { replace: true }))
  }, [params, navigate, loginConTokens])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white" role="status">
      <Spinner />
      <p className="text-sm text-ink-muted">Verificando tu cuenta…</p>
    </div>
  )
}
