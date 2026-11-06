import { useEffect, useRef, useState } from 'react'
import type ReCAPTCHA from 'react-google-recaptcha'
import CaptchaField from './components/CaptchaField'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi, mensajeDeError } from '@/api/auth'
import { esCedulaValida } from '@/utils/cedula'

const SOLO_LETRAS = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/
const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+-]+[A-Za-z0-9%+-]@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/


interface FormState {
  first_name: string
  last_name: string
  email: string
  documento_identidad: string
  password: string
  confirmPassword: string
  rol_solicitado: 'ESTUDIANTE' | 'DOCENTE' | 'COORDINADOR'
  motivo: string
}

interface InlineErrors {
  first_name?: string
  last_name?: string
  email?: string
  documento_identidad?: string
  password?: string
  confirmPassword?: string
  rol_solicitado?: string
  motivo?: string
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
    password: '',
    confirmPassword: '',
    rol_solicitado: 'ESTUDIANTE',
    motivo: '',
  })
  const captchaRef = useRef<ReCAPTCHA>(null)
  const [captcha, setCaptcha] = useState<string | null>(null)
  const [emailPendiente, setEmailPendiente] = useState<string | null>(null)
  const [codigo, setCodigo] = useState('')
  const [solicitudEnviada, setSolicitudEnviada] = useState(false)
  const [segundosReenvio, setSegundosReenvio] = useState(0)

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
    } else if (!form.email.trim().toLowerCase().endsWith('@unl.edu.ec')) {
      invalid.add('email')
      errors.email = 'Usa tu correo institucional @unl.edu.ec'
    }
    if (!esCedulaValida(form.documento_identidad)) {
      invalid.add('documento_identidad')
      errors.documento_identidad = 'La cédula no es válida. Revisa los 10 dígitos.'
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
    if (form.motivo.trim().length < 10 || form.motivo.trim().length > 500) {
      invalid.add('motivo')
      errors.motivo = 'El motivo debe tener entre 10 y 500 caracteres'
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
    if (!captcha) {
      toast.error('Marca la casilla "No soy un robot" para continuar.')
      return
    }

    setLoading(true)
    try {
      await authApi.registro({
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        documento_identidad: form.documento_identidad.trim(),
        rol_solicitado: form.rol_solicitado,
        motivo: form.motivo.trim(),
        captcha_token: captcha,
      })
      setEmailPendiente(form.email.trim().toLowerCase())
      toast.success('Solicitud creada. Revisa tu correo para obtener el código.')
    } catch (err: any) {
      captchaRef.current?.reset()
      setCaptcha(null)
      const data = err?.response?.data
      const fieldErrors: string[] = []
      // auth-service: { message, data: { errores: { campo: [mensajes] } } }; DRF: { data: { campo: [...] } }
      const errores = data?.data?.errores ?? data?.data

      if (errores && typeof errores === 'object') {
        for (const [field, msgs] of Object.entries(errores)) {
          if (field === 'detail' || field === 'message') continue
          if (Array.isArray(msgs) && msgs.length > 0) {
            const label = field === 'documento_identidad' ? 'Cédula'
              : field === 'username' ? 'Usuario'
              : field === 'password' ? 'Contraseña'
              : field === 'email' ? 'Correo'
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

  const verificarEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailPendiente || !/^\d{6}$/.test(codigo)) {
      toast.error('Escribe el código de 6 dígitos recibido por correo.')
      return
    }
    setLoading(true)
    try {
      await authApi.verificarEmail(emailPendiente, codigo)
      toast.success('Correo verificado. Tu solicitud fue enviada al administrador.')
      setEmailPendiente(null)
      setCodigo('')
      setSolicitudEnviada(true)
    } catch (err) {
      toast.error(mensajeDeError(err, 'El código no es válido o ya expiró.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (segundosReenvio <= 0) return
    const timer = window.setInterval(() => setSegundosReenvio((actual) => Math.max(0, actual - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [segundosReenvio])

  const reenviarCodigo = async () => {
    if (!emailPendiente || segundosReenvio > 0) return
    setLoading(true)
    try {
      await authApi.reenviarVerificacion(emailPendiente)
      setSegundosReenvio(60)
      toast.success('Código reenviado. Revisa tu correo.')
    } catch (err) {
      toast.error(mensajeDeError(err, 'No se pudo reenviar el código.'))
    } finally {
      setLoading(false)
    }
  }

  if (emailPendiente) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-soft px-6">
        <form onSubmit={verificarEmail} className="w-full max-w-md rounded-btn border border-line bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-ink">Ingresa el código que enviamos a tu correo</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Enviamos un código de 6 dígitos a <strong className="text-ink">{emailPendiente}</strong>.
          </p>
          <label htmlFor="codigo-verificacion" className="mt-6 block text-xs font-medium text-ink-muted">
            Código de seguridad
          </label>
          <input
            id="codigo-verificacion"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
            className="mt-2 w-full rounded-btn border border-line px-4 py-3 text-center text-lg tracking-[0.4em] text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            placeholder="000000"
          />
          <button type="submit" disabled={loading || codigo.length !== 6} className="mt-5 w-full rounded-btn bg-ink px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">
            {loading ? 'Verificando…' : 'Verificar correo'}
          </button>
          <button type="button" onClick={reenviarCodigo} disabled={loading || segundosReenvio > 0} className="mt-4 w-full text-sm text-ink-muted underline underline-offset-2 disabled:no-underline disabled:opacity-50">
            {segundosReenvio > 0 ? `Reenviar código en ${segundosReenvio}s` : 'Reenviar código'}
          </button>
        </form>
      </div>
    )
  }

  if (solicitudEnviada) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-soft px-6">
        <div className="w-full max-w-md rounded-btn border border-line bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-ink">Solicitud enviada</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            El administrador revisará tu solicitud. Te avisaremos por correo.
          </p>
          <button type="button" onClick={() => navigate('/login')} className="mt-6 w-full rounded-btn bg-ink px-4 py-3 text-sm font-medium text-white">
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-bg-soft lg:flex">
      <aside className="sticky top-0 hidden h-screen min-h-0 w-[42%] max-w-[500px] shrink-0 flex-col justify-start bg-slate-900 px-10 pt-28 text-white lg:flex xl:px-16 xl:pt-32">
        <div className="max-w-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Sistema de gestión
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight xl:text-5xl">
            Proyectos de<br />vinculación y<br />convenios, en un<br />solo lugar.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-slate-300">
            Crea tu cuenta institucional para postular, dar seguimiento y documentar tus proyectos.
          </p>

          <div className="mt-9 space-y-5">
            {[
              ['1', 'Solicita acceso', 'Envía tus datos con tu correo institucional.'],
              ['2', 'Verifica tu correo', 'Te enviaremos un enlace de confirmación.'],
              ['3', 'Espera aprobación', 'El administrador revisará tu solicitud y asignará el rol final.'],
            ].map(([number, title, description], index) => (
              <div key={number} className="flex items-start gap-3">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium ${
                    index === 0 ? 'border-blue-400 bg-blue-400 text-white' : 'border-slate-400 text-slate-200'
                }`}>
                  {number}
                </span>
                <div>
                  <p className="text-xs font-semibold">{title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="flex min-h-screen flex-1 flex-col px-5 py-8 sm:px-8">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-2 text-xs font-medium text-ink hover:opacity-70 transition-opacity duration-200"
        >
          <ArrowLeft size={14} />
          Volver al inicio
        </Link>

        <div className="mx-auto mt-10 w-full max-w-2xl pb-8">
          <div className="mb-7">
            <h1 className="text-3xl font-bold tracking-tight text-ink">Solicitar acceso</h1>
            <p className="mt-2 text-sm text-ink-muted">Completa los datos para enviar tu solicitud.</p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-card border border-line bg-white p-6 shadow-card sm:p-8" noValidate>
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-xs font-bold text-blue-600">1</span>
              <div>
                <h2 className="text-sm font-bold text-ink">Datos personales</h2>
                <p className="text-xs text-ink-muted">Tal como aparecen en tu documento.</p>
              </div>
            </div>

            <div className="space-y-4">
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

              </div>

              <div className="my-7 border-t border-line" />
              <div className="mb-5 flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-xs font-bold text-blue-600">2</span>
                <div>
                  <h2 className="text-sm font-bold text-ink">Cuenta institucional</h2>
                  <p className="text-xs text-ink-muted">Usarás estos datos para identificarte en la plataforma.</p>
                </div>
              </div>

              {/* Correo institucional */}
                <div>
                  <div>
                    <label htmlFor="email" className="block text-xs font-medium text-ink-muted mb-2">
                      Correo electrónico
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      className={inputClass('email')}
                      placeholder="juan@unl.edu.ec"
                    />
                    {inlineErrors.email && (
                      <p className="text-xs text-red-600 mt-1 animate-fade-in">{inlineErrors.email}</p>
                    )}
                  </div>

                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="rol_solicitado" className="block text-xs font-medium text-ink-muted mb-2">Rol que solicitas</label>
                    <select id="rol_solicitado" value={form.rol_solicitado} onChange={(e) => update('rol_solicitado', e.target.value as FormState['rol_solicitado'])} className={inputClass('rol_solicitado')}>
                      <option value="ESTUDIANTE">Estudiante</option>
                      <option value="DOCENTE">Docente</option>
                      <option value="COORDINADOR">Coordinador</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="motivo" className="block text-xs font-medium text-ink-muted mb-2">¿Por qué necesitas acceso?</label>
                    <textarea
                      id="motivo"
                      value={form.motivo}
                      maxLength={500}
                      onChange={(e) => update('motivo', e.target.value)}
                      className={`${inputClass('motivo')} min-h-24 resize-y`}
                      placeholder="Explica brevemente tu necesidad de acceso"
                    />
                    <p className="mt-1 text-right text-xs text-ink-light">{form.motivo.length}/500</p>
                    {inlineErrors.motivo && <p className="text-xs text-red-600 mt-1">{inlineErrors.motivo}</p>}
                  </div>
                </div>

                {/* Cédula */}
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
                      onChange={(e) => update('documento_identidad', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onBlur={() => {
                        if (!esCedulaValida(form.documento_identidad)) setFieldError('documento_identidad', 'La cédula no es válida. Revisa los 10 dígitos.')
                      }}
                      className={inputClass('documento_identidad')}
                      placeholder="1234567890"
                    />
                    {inlineErrors.documento_identidad && (
                      <p className="text-xs text-red-600 mt-1 animate-fade-in">{inlineErrors.documento_identidad}</p>
                    )}
                  </div>

                </div>

                <div className="my-7 border-t border-line" />
                <div className="mb-5 flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-xs font-bold text-blue-600">3</span>
                  <div>
                    <h2 className="text-sm font-bold text-ink">Seguridad</h2>
                    <p className="text-xs text-ink-muted">Protege tu cuenta con una contraseña segura.</p>
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

                <CaptchaField value={captcha} ref={captchaRef} onChange={setCaptcha} />

                <button
                  type="submit"
                  disabled={loading || !captcha || (form.password.length > 0 && !isPasswordValid(form.password))}
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 mt-2 text-sm font-medium bg-ink text-white rounded-btn neu-btn-dark disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando solicitud...' : 'Solicitar acceso'}
                  {!loading && (
                    <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  )}
                </button>
              </form>

          <div className="mt-7 border-t border-line pt-5">
                <p className="text-sm text-ink-muted text-center">
                  ¿Ya tienes cuenta?{' '}
                  <Link to="/login" className="font-medium text-accent underline underline-offset-2 hover:text-accent-hover transition-colors duration-200">
                    Inicia sesión
                  </Link>
                </p>
          </div>
        </div>
      </section>
    </div>
  )
}
