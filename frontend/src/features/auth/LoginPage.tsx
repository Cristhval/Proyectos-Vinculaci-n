import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, FolderKanban, ShieldCheck, BarChart3 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const HIGHLIGHTS = [
  { icon: FolderKanban, text: 'Gestión de proyectos', color: 'bg-amber-50 text-amber-600' },
  { icon: ShieldCheck, text: 'Auditoría completa', color: 'bg-emerald-50 text-emerald-600' },
  { icon: BarChart3, text: 'Reportes en tiempo real', color: 'bg-indigo-50 text-indigo-600' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await login({ username, password })
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="flex min-h-screen">
        {/* LEFT SIDE */}
        <aside className="relative hidden lg:flex flex-col justify-between w-[480px] p-16 bg-bg-soft border-r border-line">
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" aria-hidden="true" />

          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-btn bg-ink text-white text-xs font-semibold">
                U
              </div>
              <span className="text-sm font-semibold text-ink">
                Vinculación UNL
              </span>
            </Link>
          </div>

          <div className="relative space-y-6">
            <div>
              <h1 className="text-3xl font-bold leading-snug tracking-tight text-ink mb-2">
                Bienvenido de nuevo.
              </h1>
              <p className="text-sm leading-relaxed text-ink-muted">
                Accede al sistema de gestión de proyectos de vinculación con la sociedad.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {HIGHLIGHTS.map((h) => (
                <div
                  key={h.text}
                  className={`${h.color} flex items-center gap-2 px-3.5 py-2 rounded-btn text-xs font-medium`}
                >
                  <h.icon size={14} />
                  <span>{h.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative text-xs text-ink-light">
            Universidad Nacional de Loja · 2026
          </div>
        </aside>

        {/* RIGHT SIDE - Form */}
        <section className="relative flex flex-col flex-1">
          <div className="flex items-center justify-between px-8 py-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs text-ink-muted hover:text-ink transition-colors duration-200"
            >
              <ArrowLeft size={14} />
              Volver al inicio
            </Link>
            <div className="lg:hidden flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-btn bg-ink text-white text-xs font-semibold">
                U
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-8 pb-16">
            <div className="w-full max-w-sm">
              <div className="mb-10">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  Iniciar sesión
                </span>
                <h2 className="mt-3 text-2xl font-bold text-ink tracking-tight">
                  Bienvenido de nuevo.
                </h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Ingresa tus credenciales institucionales
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="username" className="block text-xs font-medium text-ink-muted mb-2">
                    Usuario
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-line rounded-btn text-ink placeholder:text-ink-light focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all duration-200"
                    placeholder="admin"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-xs font-medium text-ink-muted">
                      Contraseña
                    </label>
                    <a href="#" className="text-xs text-ink-muted hover:text-ink transition-colors duration-200 underline underline-offset-2">
                      ¿Olvidaste?
                    </a>
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-line rounded-btn text-ink placeholder:text-ink-light focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all duration-200"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 mt-2 text-sm font-medium bg-ink text-white rounded-btn btn-glow disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Ingresando...' : 'Iniciar sesión'}
                  {!loading && (
                    <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  )}
                </button>
              </form>

              <div className="mt-10 pt-6 border-t border-line">
                <p className="text-sm text-ink-muted text-center">
                  ¿No tienes cuenta?{' '}
                  <Link to="/register" className="font-medium text-ink underline underline-offset-2 hover:text-accent transition-colors duration-200">
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="px-8 py-5 text-xs text-ink-light text-center sm:text-left">
            © 2026 Universidad Nacional de Loja
          </div>
        </section>
      </div>
    </div>
  )
}
