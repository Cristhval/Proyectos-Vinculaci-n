import { useEffect, useState } from 'react'
import { Github } from 'lucide-react'
import { authApi } from '@/api/auth'
import { API, type ProveedorSocial } from '@/config/api'

export const NOMBRE_PROVEEDOR: Record<ProveedorSocial, string> = {
  google: 'Google',
  github: 'GitHub',
  facebook: 'Facebook',
}

const ORDEN: ProveedorSocial[] = ['google', 'github', 'facebook']

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
      <div className="mt-4 grid gap-2.5">
        {proveedores.map((p) => (
          <a
            key={p}
            href={API.AUTH.SOCIAL_INICIAR(p)}
            className="group flex w-full items-center justify-center gap-3 rounded-btn border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink-light hover:bg-bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {p === 'github' && <Github size={18} aria-hidden="true" />}
            <span>Continuar con {NOMBRE_PROVEEDOR[p]}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
