import { Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-bg-muted mx-auto mb-8">
          <ShieldX size={28} className="text-ink-muted" />
        </div>

        <h1 className="text-6xl font-bold text-ink tracking-tight">
          403
        </h1>

        <p className="mt-4 text-lg font-medium text-ink">
          No tienes permiso para acceder a esta sección.
        </p>

        <p className="mt-2 text-sm text-ink-muted">
          Si crees que esto es un error, contacta al administrador.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-8 px-6 py-2.5 text-sm font-medium bg-ink text-white rounded-btn btn-glow"
        >
          Volver al inicio
        </Link>
      </div>

      <p className="mt-16 text-xs text-ink-light">
        © 2026 Universidad Nacional de Loja
      </p>
    </div>
  )
}
