import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <header className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center bg-ink text-white text-xs font-semibold">
              U
            </div>
            <span className="text-sm font-medium text-ink">
              Vinculación UNL
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-sm font-medium text-ink">
                  {user.user.first_name} {user.user.last_name}
                </span>
                <span className="px-2 py-0.5 bg-bg-muted text-ink-muted text-xs font-medium">
                  {user.rol}
                </span>
              </div>
            )}
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-ink text-white btn-glow"
            >
              <LogOut size={14} />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Empty content */}
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="text-center max-w-lg">
          <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
            Panel principal
          </span>
          <h1 className="mt-3 text-3xl lg:text-4xl font-semibold leading-tight tracking-tight text-ink">
            Bienvenido al sistema institucional.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            Esta es la vista inicial del panel. Los módulos de gestión de proyectos, convenios,
            seguimiento, reportes y auditoría se incorporarán progresivamente.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between text-xs text-ink-light">
          <span>© 2026 Universidad Nacional de Loja</span>
          <span>v1.0</span>
        </div>
      </footer>
    </div>
  )
}
