import { useEffect, useState, type ComponentType } from 'react'
import { authApi } from '@/api/auth'
import { API, type ProveedorSocial } from '@/config/api'

export const NOMBRE_PROVEEDOR: Record<ProveedorSocial, string> = {
  google: 'Google',
  github: 'GitHub',
  facebook: 'Facebook',
}

/** Orden visual: GitHub a la izquierda, Google a la derecha. */
const ORDEN: ProveedorSocial[] = ['github', 'google', 'facebook']

function LogoGitHub() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.7 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  )
}

function LogoGoogle() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

const LOGO: Partial<Record<ProveedorSocial, ComponentType>> = { github: LogoGitHub, google: LogoGoogle }

/** Muestra solo los proveedores que auth-service tiene configurados. */
export default function BotonesSociales() {
  const [proveedores, setProveedores] = useState<ProveedorSocial[]>([])

  useEffect(() => {
    let activo = true
    authApi.proveedores()
      .then(({ data }) => {
        if (activo) setProveedores(ORDEN.filter((p) => data.data.includes(p)))
      })
      .catch(() => setProveedores([]))
    return () => { activo = false }
  }, [])

  if (proveedores.length === 0) return null

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-xs text-ink-light">
        <span className="h-px flex-1 bg-line" />
        o continúa con
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className={`mt-4 grid gap-3 ${proveedores.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {proveedores.map((p) => {
          const Logo = LOGO[p]
          return (
            <a
              key={p}
              href={API.AUTH.SOCIAL_INICIAR(p)}
              aria-label={`Continuar con ${NOMBRE_PROVEEDOR[p]}`}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-btn border border-line bg-white px-4 text-sm font-medium text-ink shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-ink-light hover:bg-bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {Logo && <Logo />}
              <span>{NOMBRE_PROVEEDOR[p]}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
