import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

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
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-bg">
      {/* LEFT SIDE - Institutional */}
      <aside className="relative hidden lg:flex flex-col justify-between p-14 xl:p-20 bg-bg-soft border-r border-line overflow-hidden">
        {/* subtle pattern */}
        <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/40 pointer-events-none" aria-hidden="true" />

        {/* top */}
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center bg-ink text-white text-sm font-semibold tracking-wider">
              UNL
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                Universidad Nacional
              </span>
              <span className="text-sm font-semibold tracking-tight text-ink">
                de Loja
              </span>
            </div>
          </Link>
        </div>

        {/* center text */}
        <div className="relative max-w-xl">
          <div className="flex items-center gap-3 mb-10">
            <span className="h-px w-10 bg-ink" />
            <span className="text-[11px] uppercase tracking-[0.24em] text-ink-muted">
              Acceso institucional
            </span>
          </div>
          <h1 className="font-display text-5xl xl:text-6xl leading-[1.02] tracking-tightest text-ink">
            Gestión inteligente de
            <br />
            <span className="italic font-normal">vinculación universitaria.</span>
          </h1>
          <p className="mt-8 text-base leading-relaxed text-ink-muted max-w-md">
            Plataforma centralizada para administrar proyectos, convenios y actividades
            académicas de impacto social.
          </p>
        </div>

        {/* bottom meta */}
        <div className="relative flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-ink-muted">
          <span>Coordinación de Vinculación</span>
          <span>v 1.0 · 2026</span>
        </div>
      </aside>

      {/* RIGHT SIDE - Form */}
      <section className="relative flex flex-col justify-between p-8 sm:p-14 lg:p-16">
        {/* top: back link */}
        <div className="flex justify-between items-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-ink-muted hover:text-ink transition-colors duration-200"
          >
            <ArrowLeft size={14} />
            Volver al inicio
          </Link>
          <div className="lg:hidden flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center bg-ink text-white text-xs font-semibold tracking-wider">
              UNL
            </div>
          </div>
        </div>

        {/* center: card */}
        <div className="flex-1 flex items-center justify-center py-16">
          <div className="w-full max-w-md">
            <div className="bg-white border border-line shadow-soft p-10 lg:p-12">
              <div className="mb-10">
                <span className="text-[11px] uppercase tracking-[0.24em] text-ink-muted">
                  Iniciar sesión
                </span>
                <h2 className="font-display text-3xl lg:text-4xl text-ink mt-3 leading-tight tracking-tight">
                  Bienvenido de nuevo.
                </h2>
                <p className="mt-3 text-sm text-ink-muted">
                  Ingresa tus credenciales institucionales para continuar.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-7">
                <div>
                  <label htmlFor="username" className="block text-[11px] uppercase tracking-[0.18em] text-ink-muted mb-3">
                    Usuario
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-0 py-3 bg-transparent border-0 border-b border-line text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-ink transition-colors duration-200"
                    placeholder="admin"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label htmlFor="password" className="block text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                      Contraseña
                    </label>
                    <a href="#" className="text-[11px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink transition-colors">
                      ¿Olvidaste?
                    </a>
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-0 py-3 bg-transparent border-0 border-b border-line text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-ink transition-colors duration-200"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 mt-4 text-xs font-medium uppercase tracking-wider border border-ink bg-white text-ink hover:bg-ink hover:text-white hover:shadow-elev disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 ease-editorial"
                >
                  {loading ? 'Ingresando...' : 'Iniciar sesión'}
                  {!loading && (
                    <ArrowUpRight
                      size={14}
                      className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  )}
                </button>
              </form>
            </div>

            <p className="mt-8 text-center text-xs text-ink-muted">
              ¿Problemas para acceder? Contacta a{' '}
              <a href="mailto:vinculacion@unl.edu.ec" className="text-ink underline underline-offset-4 hover:no-underline">
                vinculacion@unl.edu.ec
              </a>
            </p>
          </div>
        </div>

        {/* bottom */}
        <div className="text-[11px] uppercase tracking-[0.18em] text-ink-muted text-center sm:text-left">
          © 2026 Universidad Nacional de Loja
        </div>
      </section>
    </div>
  )
}
