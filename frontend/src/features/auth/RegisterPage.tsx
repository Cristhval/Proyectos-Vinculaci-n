import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, UserPlus, FolderKanban, ShieldCheck, Users, Eye, EyeOff, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'
import { ROL_LABELS } from '@/lib/constants'
import type { RolUsuario } from '@/types/usuarios'

const HIGHLIGHTS = [
  { icon: UserPlus, text: 'Crea tu cuenta', color: 'bg-emerald-50 text-emerald-600' },
  { icon: FolderKanban, text: 'Gestiona proyectos', color: 'bg-amber-50 text-amber-600' },
  { icon: ShieldCheck, text: 'Acceso seguro', color: 'bg-indigo-50 text-indigo-600' },
]

const SOLO_LETRAS = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/
const USERNAME_REGEX = /^[a-z0-9._]+$/
const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+-]+[A-Za-z0-9%+-]@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/

const ROLES_REGISTRO: RolUsuario[] = ['ESTUDIANTE', 'DOCENTE', 'COORDINADOR']

interface FormState {
  first_name: string
  last_name: string
  email: string
  documento_identidad: string
  username: string
  password: string
  confirmPassword: string
  rol: RolUsuario
}

interface InlineErrors {
  first_name?: string
  last_name?: string
  email?: string
  documento_identidad?: string
  username?: string
  password?: string
  confirmPassword?: string
  rol?: string
}

const PASSWORD_REQUIREMENTS: { label: string; test: (v: string) => boolean }[] = [
  { label: 'Mínimo 8 caracteres', test: (v) => v.length >= 8 },
  { label: 'Una mayúscula (A-Z)', test: (v) => /[A-Z]/.test(v) },
  { label: 'Una minúscula (a-z)', test: (v) => /[a-z]/.test(v) },
  { label: 'Un número (0-9)', test: (v) => /\d/.test(v) },
  { label: 'Un símbolo (!@#$%...)', test: (v) => /[^A-Za-z0-9]/.test(v) },
]

function isPasswordValid(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every((r) => r.test(password))
}

function getPasswordStrength(password: string): { label: string; percent: number; color: string } {
  if (password.length === 0) return { label: '', percent: 0, color: '' }
  const met = PASSWORD_REQUIREMENTS.filter((r) => r.test(password)).length
  const percent = Math.round((met / PASSWORD_REQUIREMENTS.length) * 100)
  if (met <= 2) return { label: 'Débil', percent, color: 'bg-red-500' }
  if (met === 3) return { label: 'Regular', percent, color: 'bg-amber-500' }
  if (met === 4) return { label: 'Buena', percent, color: 'bg-amber-500' }
  return { label: 'Fuerte', percent, color: 'bg-emerald-600' }
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set())
  const [inlineErrors, setInlineErrors] = useState<InlineErrors>({})
  const [form, setForm] = useState<FormState>({
    first_name: '',
    last_name: '',
    email: '',
    documento_identidad: '',
    username: '',
    password: '',
    confirmPassword: '',
    rol: 'ESTUDIANTE',
  })

  const clearError = (field: keyof FormState) => {
    setInvalidFields((prev) => { const next = new Set(prev); next.delete(field); return next })
    setInlineErrors((prev) => { const { [field]: _, ...rest } = prev; return rest as InlineErrors })
  }

  const setFieldError = (field: keyof FormState, msg: string) => {
    setInvalidFields((prev) => { const next = new Set(prev); next.add(field); return next })
    setInlineErrors((prev) => ({ ...prev, [field]: msg }))
  }

  const handleNombreChange = (field: 'first_name' | 'last_name', value: string) => {
    const filtrado = value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '')
    setForm((prev) => ({ ...prev, [field]: filtrado }))
    if (value !== filtrado) {
      setFieldError(field, 'El nombre solo puede contener letras')
    } else if (filtrado.trim().length > 0 && filtrado.trim().length < 2) {
      setFieldError(field, 'Mínimo 2 caracteres')
    } else {
      clearError(field)
    }
  }

  const handleUsernameChange = (value: string) => {
    const lower = value.toLowerCase().replace(/\s/g, '')
    setForm((prev) => ({ ...prev, username: lower }))
    if (lower.length > 0 && /^\d/.test(lower)) {
      setFieldError('username', 'No puede empezar con número')
    } else if (lower.length > 0 && !USERNAME_REGEX.test(lower)) {
      setFieldError('username', 'El usuario solo puede contener letras minúsculas, números, punto o guión bajo')
    } else {
      clearError('username')
    }
  }

  const handlePasswordChange = (value: string) => {
    setForm((prev) => ({ ...prev, password: value }))
    clearError('password')
    if (form.confirmPassword && value !== form.confirmPassword) {
      setFieldError('confirmPassword', 'Las contraseñas no coinciden')
    } else if (form.confirmPassword) {
      clearError('confirmPassword')
    }
  }

  const handleConfirmPasswordChange = (value: string) => {
    setForm((prev) => ({ ...prev, confirmPassword: value }))
    if (value && value !== form.password) {
      setFieldError('confirmPassword', 'Las contraseñas no coinciden')
    } else {
      clearError('confirmPassword')
    }
  }

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    clearError(field)
  }

  const validateAll = (): boolean => {
    const invalid = new Set<string>()
    const errors: InlineErrors = {}

    if (!form.first_name.trim() || form.first_name.trim().length < 2) {
      invalid.add('first_name')
      errors.first_name = 'El nombre es obligatorio (mínimo 2 caracteres)'
    } else if (!SOLO_LETRAS.test(form.first_name)) {
      invalid.add('first_name')
      errors.first_name = 'El nombre solo puede contener letras'
    }
    if (!form.last_name.trim() || form.last_name.trim().length < 2) {
      invalid.add('last_name')
      errors.last_name = 'El apellido es obligatorio (mínimo 2 caracteres)'
    } else if (!SOLO_LETRAS.test(form.last_name)) {
      invalid.add('last_name')
      errors.last_name = 'El apellido solo puede contener letras'
    }
    if (!form.email.trim() || !EMAIL_REGEX.test(form.email)) {
      invalid.add('email')
      errors.email = 'Ingresa un correo válido (ejemplo: usuario@dominio.com)'
    }
    if (!form.documento_identidad.trim() || !/^\d{10}$/.test(form.documento_identidad.trim())) {
      invalid.add('documento_identidad')
      errors.documento_identidad = 'La cédula debe tener exactamente 10 dígitos numéricos'
    }
    if (!form.username.trim()) {
      invalid.add('username')
      errors.username = 'El nombre de usuario es obligatorio'
    } else if (/^\d/.test(form.username)) {
      invalid.add('username')
      errors.username = 'No puede empezar con número'
    } else if (!USERNAME_REGEX.test(form.username)) {
      invalid.add('username')
      errors.username = 'El usuario solo puede contener letras minúsculas, números, punto o guión bajo'
    }
    if (!form.password) {
      invalid.add('password')
      errors.password = 'La contraseña es obligatoria'
    } else if (!isPasswordValid(form.password)) {
      invalid.add('password')
      errors.password = 'La contraseña no cumple los requisitos de seguridad'
    }
    if (!form.confirmPassword || form.confirmPassword !== form.password) {
      invalid.add('confirmPassword')
      errors.confirmPassword = 'Las contraseñas no coinciden'
    }
    if (!form.rol || !ROLES_REGISTRO.includes(form.rol)) {
      invalid.add('rol')
      errors.rol = 'Selecciona un rol válido'
    }

    setInvalidFields(invalid)
    setInlineErrors(errors)

    if (invalid.size > 0) {
      const firstError = Object.values(errors).find(Boolean)
      if (firstError) toast.error(firstError)
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
        rol: form.rol,
      })
      toast.success('Cuenta creada exitosamente. Redirigiendo al inicio de sesión...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      const data = err?.response?.data
      const fieldErrors: string[] = []

      if (data && typeof data === 'object') {
        for (const [field, msgs] of Object.entries(data)) {
          if (field === 'detail' || field === 'message') continue
          if (Array.isArray(msgs) && msgs.length > 0) {
            const label = field === 'documento_identidad' ? 'Cédula'
              : field === 'username' ? 'Usuario'
              : field === 'password' ? 'Contraseña'
              : field === 'email' ? 'Correo'
              : field === 'rol' ? 'Rol'
              : field
            fieldErrors.push(`${label}: ${msgs[0]}`)
          }
        }
      }

      const detail = data?.detail || data?.message

      if (fieldErrors.length > 0) {
        toast.error(fieldErrors.join(' | '), { duration: 6000 })
      } else if (detail && typeof detail === 'string') {
        toast.error(`Error al crear la cuenta: ${detail}`, { duration: 6000 })
      } else {
        toast.error('Error al crear la cuenta. Verifica los datos e intenta de nuevo', { duration: 6000 })
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
        <aside className="relative hidden lg:flex flex-col justify-between w-[420px] xl:w-[480px] p-16 bg-bg-soft border-r border-line shrink-0">
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
        <section className="relative flex flex-col flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-8 py-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs text-ink hover:opacity-70 transition-opacity duration-200"
            >
              <ArrowLeft size={14} />
              Volver al inicio
            </Link>
          </div>

          <div className="flex-1 flex items-center justify-center px-8 pb-10">
            <div className="w-full max-w-2xl">
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
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first_name" className="block text-xs font-medium text-ink-muted mb-2">
                      Nombre
                    </label>
                    <input
                      id="first_name"
                      type="text"
                      value={form.first_name}
                      onChange={(e) => handleNombreChange('first_name', e.target.value)}
                      className={inputClass('first_name')}
                      placeholder="Juan"
                    />
                    {inlineErrors.first_name && (
                      <p className="text-xs text-red-600 mt-1 animate-fade-in">{inlineErrors.first_name}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block text-xs font-medium text-ink-muted mb-2">
                      Apellido
                    </label>
                    <input
                      id="last_name"
                      type="text"
                      value={form.last_name}
                      onChange={(e) => handleNombreChange('last_name', e.target.value)}
                      className={inputClass('last_name')}
                      placeholder="Pérez"
                    />
                    {inlineErrors.last_name && (
                      <p className="text-xs text-red-600 mt-1 animate-fade-in">{inlineErrors.last_name}</p>
                    )}
                  </div>
                </div>

                {/* Correo + Rol */}
                <div className="grid sm:grid-cols-2 gap-4">
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
                    {inlineErrors.email && (
                      <p className="text-xs text-red-600 mt-1 animate-fade-in">{inlineErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="rol" className="block text-xs font-medium text-ink-muted mb-2">
                      Rol
                    </label>
                    <div className="relative">
                      <select
                        id="rol"
                        value={form.rol}
                        onChange={(e) => update('rol', e.target.value as RolUsuario)}
                        className={`${inputClass('rol')} appearance-none cursor-pointer`}
                      >
                        {ROLES_REGISTRO.map((rol) => (
                          <option key={rol} value={rol}>
                            {ROL_LABELS[rol]}
                          </option>
                        ))}
                      </select>
                      <Users size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light pointer-events-none" />
                    </div>
                    {inlineErrors.rol && (
                      <p className="text-xs text-red-600 mt-1 animate-fade-in">{inlineErrors.rol}</p>
                    )}
                  </div>
                </div>

                {/* Cédula + Usuario */}
                <div className="grid sm:grid-cols-2 gap-4">
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
                    {inlineErrors.documento_identidad && (
                      <p className="text-xs text-red-600 mt-1 animate-fade-in">{inlineErrors.documento_identidad}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-xs font-medium text-ink-muted mb-2">
                      Usuario
                    </label>
                    <input
                      id="username"
                      type="text"
                      autoComplete="username"
                      value={form.username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className={inputClass('username')}
                      placeholder="juanperez"
                    />
                    {inlineErrors.username && (
                      <p className="text-xs text-red-600 mt-1 animate-fade-in">{inlineErrors.username}</p>
                    )}
                  </div>
                </div>

                {/* Contraseña + Confirmar contraseña */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-xs font-medium text-ink-muted mb-2">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        className={`${inputClass('password')} pr-10`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink-muted transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-medium text-ink-muted mb-2">
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                        className={`${inputClass('confirmPassword')} pr-10`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink-muted transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {inlineErrors.confirmPassword && (
                      <p className="text-xs text-red-600 mt-1 animate-fade-in">{inlineErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* Indicador de seguridad de contraseña */}
                <div className="p-4 bg-bg-soft border border-line">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-1.5 bg-bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} rounded-full transition-all duration-300`}
                        style={{ width: `${strength.percent}%` }}
                      />
                    </div>
                    <span className={`text-2xs font-semibold shrink-0 w-12 text-right ${
                      strength.percent === 0 ? 'text-ink-light' :
                      strength.percent <= 40 ? 'text-red-600' :
                      strength.percent < 100 ? 'text-amber-600' :
                      'text-emerald-600'
                    }`}>
                      {strength.label || 'Seguridad'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {PASSWORD_REQUIREMENTS.map((req) => {
                      const passed = form.password.length > 0 && req.test(form.password)
                      return (
                        <div
                          key={req.label}
                          className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
                            passed ? 'text-emerald-700 font-medium' : 'text-ink-light'
                          }`}
                        >
                          <span
                            className={`flex items-center justify-center w-4 h-4 rounded-full shrink-0 transition-all duration-200 ${
                              passed ? 'bg-emerald-500 text-white' : 'bg-white border border-line'
                            }`}
                          >
                            {passed && <Check size={10} strokeWidth={3.5} />}
                          </span>
                          {req.label}
                        </div>
                      )
                    })}
                  </div>
                  {inlineErrors.password && (
                    <p className="text-xs text-red-600 mt-2 animate-fade-in">{inlineErrors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || (form.password.length > 0 && !isPasswordValid(form.password))}
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 mt-2 text-sm font-medium bg-ink text-white rounded-btn neu-btn-dark disabled:opacity-40 disabled:cursor-not-allowed"
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
