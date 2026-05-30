import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, UserPlus, FolderKanban, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'

const HIGHLIGHTS = [
  { icon: UserPlus, text: 'Crea tu cuenta', color: 'bg-emerald-50 text-emerald-600' },
  { icon: FolderKanban, text: 'Gestiona proyectos', color: 'bg-amber-50 text-amber-600' },
  { icon: ShieldCheck, text: 'Acceso seguro', color: 'bg-indigo-50 text-indigo-600' },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    email: '',
    codigo: '',
  })

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      toast.error('Las contraseñas no coinciden.')
      return
    }
    if (form.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setLoading(true)
    try {
      await authApi.register({
        username: form.username,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        codigo: form.codigo || undefined,
      })
      toast.success('Cuenta creada correctamente. Ahora inicia sesión.')
      navigate('/login')
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.response?.data?.username?.[0] ||
        'Error al registrar. Intenta de nuevo.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
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
                Crea tu cuenta.
              </h1>
              <p className="text-sm leading-relaxed text-ink-muted">
                Regístrate para acceder al sistema de gestión de proyectos de vinculación y convenios interinstitucionales.
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

          <div className="flex-1 flex items-center justify-center px-8 pb-8">
            <div className="w-full max-w-sm">
              <div className="mb-8">
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  Crear cuenta
                </span>
                <h2 className="mt-3 text-2xl font-bold text-ink tracking-tight">
                  Regístrate.
                </h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Completa los datos para tu cuenta institucional
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="first_name" className="block text-xs font-medium text-ink-muted mb-2">
                      Nombre
                    </label>
                    <input
                      id="first_name"
                      type="text"
                      value={form.first_name}
                      onChange={(e) => update('first_name', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-line rounded-btn text-ink placeholder:text-ink-light focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all duration-200"
                      placeholder="Juan"
                    />
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block text-xs font-medium text-ink-muted mb-2">
                      Apellido
                    </label>
                    <input
                      id="last_name"
                      type="text"
                      value={form.last_name}
                      onChange={(e) => update('last_name', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-line rounded-btn text-ink placeholder:text-ink-light focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all duration-200"
                      placeholder="Pérez"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-ink-muted mb-2">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-line rounded-btn text-ink placeholder:text-ink-light focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all duration-200"
                    placeholder="juan@unl.edu.ec"
                  />
                </div>

                <div>
                  <label htmlFor="codigo" className="block text-xs font-medium text-ink-muted mb-2">
                    Código institucional <span className="text-ink-light">(opcional)</span>
                  </label>
                  <input
                    id="codigo"
                    type="text"
                    value={form.codigo}
                    onChange={(e) => update('codigo', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-line rounded-btn text-ink placeholder:text-ink-light focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all duration-200"
                    placeholder="USR-00001"
                  />
                </div>

                <div>
                  <label htmlFor="username" className="block text-xs font-medium text-ink-muted mb-2">
                    Usuario <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={form.username}
                    onChange={(e) => update('username', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-white border border-line rounded-btn text-ink placeholder:text-ink-light focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all duration-200"
                    placeholder="juanperez"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="password" className="block text-xs font-medium text-ink-muted mb-2">
                      Contraseña <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-line rounded-btn text-ink placeholder:text-ink-light focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all duration-200"
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-medium text-ink-muted mb-2">
                      Confirmar <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={(e) => update('confirmPassword', e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-line rounded-btn text-ink placeholder:text-ink-light focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all duration-200"
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 mt-2 text-sm font-medium bg-ink text-white rounded-btn btn-glow disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                  {!loading && (
                    <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-line">
                <p className="text-sm text-ink-muted text-center">
                  ¿Ya tienes cuenta?{' '}
                  <Link to="/login" className="font-medium text-ink underline underline-offset-2 hover:text-accent transition-colors duration-200">
                    Inicia sesión
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
