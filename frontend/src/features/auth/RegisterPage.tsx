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

interface FormState {
  first_name: string
  last_name: string
  email: string
  documento_identidad: string
  username: string
  password: string
  confirmPassword: string
}

function getPasswordStrength(password: string): { label: string; percent: number; color: string } {
  if (password.length === 0) return { label: '', percent: 0, color: '' }
  if (password.length < 5) return { label: 'Débil', percent: 25, color: 'bg-red-500' }
  if (password.length < 8) return { label: 'Regular', percent: 50, color: 'bg-amber-500' }
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)
  if (hasNumber && hasSymbol) return { label: 'Fuerte', percent: 100, color: 'bg-emerald-600' }
  if (hasNumber) return { label: 'Buena', percent: 75, color: 'bg-emerald-500' }
  return { label: 'Regular', percent: 50, color: 'bg-amber-500' }
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set())
  const [form, setForm] = useState<FormState>({
    first_name: '',
    last_name: '',
    email: '',
    documento_identidad: '',
    username: '',
    password: '',
    confirmPassword: '',
  })

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setInvalidFields((prev) => {
      const next = new Set(prev)
      next.delete(field)
      return next
    })
  }

  const validateAll = (): boolean => {
    const invalid = new Set<string>()
    const errors: string[] = []

    if (!form.first_name.trim() || form.first_name.trim().length < 2) {
      invalid.add('first_name')
      errors.push('El nombre es obligatorio')
    }
    if (!form.last_name.trim() || form.last_name.trim().length < 2) {
      invalid.add('last_name')
      errors.push('El apellido es obligatorio')
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      invalid.add('email')
      errors.push('Ingresa un correo válido')
    }
    if (!form.documento_identidad.trim() || !/^\d{10}$/.test(form.documento_identidad.trim())) {
      invalid.add('documento_identidad')
      errors.push('La cédula debe tener exactamente 10 dígitos numéricos')
    }
    if (!form.username.trim()) {
      invalid.add('username')
      errors.push('El nombre de usuario es obligatorio')
    }
    if (!form.password) {
      invalid.add('password')
      errors.push('La contraseña debe tener mínimo 8 caracteres')
    } else if (form.password.length < 8) {
      invalid.add('password')
      errors.push('La contraseña debe tener mínimo 8 caracteres')
    } else if (!/\d/.test(form.password)) {
      invalid.add('password')
      errors.push('La contraseña debe contener al menos un número')
    }
    if (!form.confirmPassword || form.confirmPassword !== form.password) {
      invalid.add('confirmPassword')
      errors.push('Las contraseñas no coinciden')
    }

    setInvalidFields(invalid)

    if (errors.length > 0) {
      toast.error(errors[0]!)
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAll()) return

    setLoading(true)
    try {
      await authApi.register({
        username: form.username,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        documento_identidad: form.documento_identidad.trim(),
      })
      toast.success('Cuenta creada exitosamente. Redirigiendo al inicio de sesión...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      const data = err?.response?.data
      const detail = data?.detail || data?.message
      const usernameErr = data?.username?.[0]
      const cedulaErr = data?.documento_identidad?.[0]

      if (cedulaErr) {
        toast.error(`Error al crear la cuenta: ${cedulaErr}`)
      } else if (usernameErr && usernameErr.toLowerCase().includes('ya existe')) {
        toast.error('Este usuario ya existe. Intenta con un correo diferente')
      } else if (detail && typeof detail === 'string' && detail.toLowerCase().includes('ya existe')) {
        toast.error('Este usuario ya existe. Intenta con un correo diferente')
      } else if (usernameErr) {
        toast.error(`Error al crear la cuenta: ${usernameErr}`)
      } else if (detail) {
        toast.error(`Error al crear la cuenta: ${detail}`)
      } else {
        toast.error('Error al crear la cuenta. Verifica los datos e intenta de nuevo')
      }
    } finally {
      setLoading(false)
    }
  }

  const strength = getPasswordStrength(form.password)

  const inputClass = (field: keyof FormState) =>
    `w-full px-4 py-2.5 text-sm bg-white rounded-btn text-ink placeholder:text-ink-light focus:outline-none transition-all duration-200 ${
      invalidFields.has(field)
        ? 'border-2 border-red-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/10'
        : 'border border-line focus:border-accent focus:ring-2 focus:ring-accent/10'
    }`

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="flex min-h-screen">
        {/* LEFT SIDE */}
        <aside className="relative hidden lg:flex flex-col justify-between w-[480px] p-16 bg-bg-soft border-r border-line">
          <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" aria-hidden="true" />

          <div className="relative flex-1 flex flex-col justify-center">
            <h1 className="text-3xl font-bold leading-snug tracking-tight text-ink mb-3">
              Crea tu cuenta
            </h1>
            <p className="text-sm leading-relaxed text-ink-muted max-w-xs">
              Regístrate para acceder al sistema de gestión de proyectos de vinculación y convenios.
            </p>

            <div className="flex flex-wrap gap-2 mt-8">
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
              className="inline-flex items-center gap-2 text-xs text-accent hover:text-accent-hover transition-colors duration-200"
            >
              <ArrowLeft size={14} />
              Volver al inicio
            </Link>
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

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Nombre + Apellido */}
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
                      className={inputClass('first_name')}
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
                      className={inputClass('last_name')}
                      placeholder="Pérez"
                    />
                  </div>
                </div>

                {/* Correo */}
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-ink-muted mb-2">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="text"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className={inputClass('email')}
                    placeholder="juan@unl.edu.ec"
                  />
                </div>

                {/* Cédula */}
                <div>
                  <label htmlFor="documento_identidad" className="block text-xs font-medium text-ink-muted mb-2">
                    Cédula de identidad
                  </label>
                  <input
                    id="documento_identidad"
                    type="text"
                    maxLength={10}
                    value={form.documento_identidad}
                    onChange={(e) => update('documento_identidad', e.target.value.replace(/\D/g, ''))}
                    className={inputClass('documento_identidad')}
                    placeholder="1234567890"
                  />
                </div>

                {/* Usuario */}
                <div>
                  <label htmlFor="username" className="block text-xs font-medium text-ink-muted mb-2">
                    Usuario
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={form.username}
                    onChange={(e) => update('username', e.target.value)}
                    className={inputClass('username')}
                    placeholder="juanperez"
                  />
                </div>

                {/* Contraseña */}
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-ink-muted mb-2">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    className={inputClass('password')}
                    placeholder="••••••••"
                  />
                  {/* Password strength indicator */}
                  {form.password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-1.5 bg-bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${strength.color} rounded-full transition-all duration-300`}
                            style={{ width: `${strength.percent}%` }}
                          />
                        </div>
                        <span className={`text-2xs font-medium ${
                          strength.percent <= 25 ? 'text-red-600' :
                          strength.percent <= 50 ? 'text-amber-600' :
                          'text-emerald-600'
                        }`}>
                          {strength.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirmar contraseña */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-ink-muted mb-2">
                    Confirmar contraseña
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                    className={inputClass('confirmPassword')}
                    placeholder="••••••••"
                  />
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
        </section>
      </div>
    </div>
  )
}
