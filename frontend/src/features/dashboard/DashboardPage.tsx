import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top bar */}
      <header className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-ink text-white text-sm font-semibold tracking-wider">
              UNL
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                Sistema de Vinculación
              </span>
              <span className="text-sm font-semibold tracking-tight text-ink">
                Panel administrativo
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            {user && (
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-sm font-medium text-ink">
                  {user.user.first_name} {user.user.last_name}
                </span>
                <span className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                  {user.rol}
                </span>
              </div>
            )}
            <button
              onClick={logout}
              className="group inline-flex items-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-wider border border-line bg-white text-ink hover:border-ink hover:bg-ink hover:text-white transition-all duration-300 ease-editorial"
            >
              <LogOut size={14} />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Empty content */}
      <main className="flex-1 flex items-center justify-center px-6 py-32">
        <div className="text-center max-w-2xl">
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="h-px w-10 bg-ink" />
            <span className="text-[11px] uppercase tracking-[0.24em] text-ink-muted">
              Panel principal
            </span>
            <span className="h-px w-10 bg-ink" />
          </div>
          <h1 className="font-display text-5xl lg:text-7xl leading-[1.02] tracking-tightest text-ink">
            Bienvenido al
            <br />
            <span className="italic font-normal">sistema institucional.</span>
          </h1>
          <p className="mt-8 text-base leading-relaxed text-ink-muted max-w-lg mx-auto">
            Esta es la vista inicial del panel. Los módulos de gestión de proyectos, convenios,
            seguimiento, reportes y auditoría se incorporarán progresivamente.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          <span>© 2026 Universidad Nacional de Loja</span>
          <span>v 1.0</span>
        </div>
      </footer>
    </div>
  )
}
