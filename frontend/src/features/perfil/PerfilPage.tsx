import { useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import toast from 'react-hot-toast'
import { Camera, CheckCircle2, Loader2, Lock, Trash2 } from 'lucide-react'
import { authApi } from '@/api/auth'
import { carrerasApi, urlFoto, usuariosApi } from '@/api/usuarios'
import { ROL_BADGE_STYLES, ROL_LABELS } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'
import type { Carrera, Usuario } from '@/types/usuarios'
import SelectorCarrera from './SelectorCarrera'
import Aviso from '@/components/ui/Aviso'

const ROLES_ACADEMICOS = ['ESTUDIANTE', 'DOCENTE', 'COORDINADOR']
const TAMANO_MAXIMO = 10 * 1024 * 1024

type Errores = Partial<Record<string, string>>

interface Formulario {
  telefono: string
  direccion: string
  carrera_id: string
  cargo: string
  fecha_nacimiento: string
  biografia: string
}

const desdeUsuario = (u: Usuario): Formulario => ({
  telefono: u.telefono || '',
  direccion: u.direccion || '',
  carrera_id: u.carrera ? String(u.carrera.id) : '',
  cargo: u.cargo || '',
  fecha_nacimiento: u.fecha_nacimiento || '',
  biografia: u.biografia || '',
})

/** Mismas reglas que la cédula del registro: 10 dígitos, provincia, tercer dígito y módulo 10. */
function cedulaValida(valor: string) {
  const c = valor.replace(/[\s-]/g, '')
  if (!/^\d{10}$/.test(c) || new Set(c).size === 1) return false
  const provincia = Number(c.slice(0, 2))
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30) || Number(c[2]) >= 6) return false
  const suma = [2, 1, 2, 1, 2, 1, 2, 1, 2].reduce((acc, k, i) => {
    const p = Number(c[i]) * k
    return acc + (p >= 10 ? p - 9 : p)
  }, 0)
  return (10 - (suma % 10)) % 10 === Number(c[9])
}

const telefonoValido = (v: string) => {
  let t = v.replace(/[\s()-]/g, '')
  if (t.startsWith('+593')) t = '0' + t.slice(4)
  return /^(09\d{8}|0[2-7]\d{7})$/.test(t)
}

const mensajeDe = (e: any, porDefecto: string) => e?.response?.data?.message || porDefecto

const claseCampo = (error?: string) =>
  `w-full rounded-btn border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-light transition-colors focus:outline-none focus:ring-2 ${
    error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-line focus:border-ink focus:ring-ink/10'
  }`

function Campo({ etiqueta, obligatorio, error, ayuda, children, htmlFor }: {
  etiqueta: string; obligatorio?: boolean; error?: string; ayuda?: string; children: React.ReactNode; htmlFor?: string
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ink-muted">
        {etiqueta}
        {obligatorio && <span className="text-red-500" aria-hidden="true">*</span>}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : ayuda && <p className="mt-1.5 text-xs text-ink-light">{ayuda}</p>}
    </div>
  )
}

function Seccion({ titulo, descripcion, children }: { titulo: string; descripcion: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-line py-8 first:border-t-0 first:pt-0 lg:grid-cols-[220px_1fr]">
      <div>
        <h2 className="text-sm font-semibold text-ink">{titulo}</h2>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{descripcion}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  )
}

export default function PerfilPage() {
  const { user, setUser, setTokens } = useAuthStore(useShallow((s) => ({ user: s.user, setUser: s.setUser, setTokens: s.setTokens })))
  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [form, setForm] = useState<Formulario | null>(user ? desdeUsuario(user) : null)
  const [errores, setErrores] = useState<Errores>({})
  const [guardando, setGuardando] = useState(false)
  const [cedula, setCedula] = useState('')
  const [errorCedula, setErrorCedula] = useState<string>()
  const [guardandoCedula, setGuardandoCedula] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const archivoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    usuariosApi.me().then(({ data }) => { setUser(data.data); setForm(desdeUsuario(data.data)) }).catch(() => {})
    carrerasApi.list({ page_size: '100' })
      .then(({ data }) => setCarreras(Array.isArray(data) ? data : data.results))
      .catch(() => setCarreras([]))
  }, [setUser])

  const ordenadas = useMemo(
    () => [...carreras].sort((a, b) => a.facultad.localeCompare(b.facultad) || a.nombre.localeCompare(b.nombre)),
    [carreras],
  )

  if (!user || !form) return null

  const academico = ROLES_ACADEMICOS.includes(user.rol)
  const pendientes = user.campos_pendientes ?? []
  const total = academico ? 4 : 3
  const avance = Math.round(((total - pendientes.length) / total) * 100)
  const sinCedula = !user.documento_identidad || user.documento_identidad.startsWith('PEND-')
  const foto = urlFoto(user.foto_token)
  const iniciales = `${user.user_first_name?.[0] ?? ''}${user.user_last_name?.[0] ?? ''}`.toUpperCase() || '?'
  const insignia = ROL_BADGE_STYLES[user.rol]

  const cambiar = (campo: keyof Formulario, valor: string) => {
    setForm({ ...form, [campo]: valor })
    setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  const validar = (): Errores => {
    const e: Errores = {}
    if (!form.telefono.trim()) e.telefono = 'El teléfono es obligatorio.'
    else if (!telefonoValido(form.telefono)) e.telefono = 'Escribe un celular (09XXXXXXXX) o un fijo con código de provincia.'
    if (!form.direccion.trim()) e.direccion = 'La dirección es obligatoria.'
    else if (form.direccion.trim().length < 8) e.direccion = 'Escribe calle principal, secundaria y una referencia.'
    if (academico && !form.carrera_id) e.carrera_id = 'Elige tu carrera.'
    return e
  }

  const guardar = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const e = validar()
    setErrores(e)
    if (Object.keys(e).length) return toast.error('Revisa los campos marcados.')
    setGuardando(true)
    try {
      const { data } = await usuariosApi.actualizarPerfil({
        ...form,
        carrera_id: form.carrera_id ? Number(form.carrera_id) : null,
        cargo: user.rol === 'ESTUDIANTE' ? '' : form.cargo,
        fecha_nacimiento: form.fecha_nacimiento || null,
      })
      setUser(data.data)
      setForm(desdeUsuario(data.data))
      toast.success('Perfil actualizado')
    } catch (err: any) {
      const detalle = err?.response?.data?.data
      if (detalle && typeof detalle === 'object') {
        setErrores(Object.fromEntries(Object.entries(detalle).map(([k, v]) => [k, Array.isArray(v) ? String(v[0]) : String(v)])))
      }
      toast.error(mensajeDe(err, 'No se pudo guardar el perfil'))
    } finally {
      setGuardando(false)
    }
  }

  const registrarCedula = async () => {
    if (!cedulaValida(cedula)) return setErrorCedula('La cédula no es válida. Revisa los 10 dígitos.')
    setGuardandoCedula(true)
    try {
      const { data } = await authApi.registrarCedula(cedula.replace(/[\s-]/g, ''))
      setTokens(data.data.access, data.data.refresh)
      const me = await usuariosApi.me()
      setUser(me.data.data)
      setCedula('')
      toast.success('Cédula registrada')
    } catch (err) {
      setErrorCedula(mensajeDe(err, 'No se pudo registrar la cédula'))
    } finally {
      setGuardandoCedula(false)
    }
  }

  const subirFoto = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = ev.target.files?.[0]
    ev.target.value = ''
    if (!archivo) return
    if (archivo.size > TAMANO_MAXIMO) return toast.error('La imagen supera los 10 MB.')
    setSubiendoFoto(true)
    try {
      const { data } = await usuariosApi.subirFoto(archivo)
      setUser(data.data)
      toast.success('Foto actualizada')
    } catch (err) {
      toast.error(mensajeDe(err, 'No se pudo subir la foto'))
    } finally {
      setSubiendoFoto(false)
    }
  }

  const quitarFoto = async () => {
    setSubiendoFoto(true)
    try {
      const { data } = await usuariosApi.borrarFoto()
      setUser(data.data)
    } catch (err) {
      toast.error(mensajeDe(err, 'No se pudo quitar la foto'))
    } finally {
      setSubiendoFoto(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">Mi perfil</h1>
        <p className="mt-1 text-sm text-ink-muted">Tus datos personales y académicos dentro del sistema.</p>
      </div>

      {/* Encabezado: foto, identidad y avance */}
      <div className="rounded-card bg-white p-6 shadow-card">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 flex-shrink-0">
            {foto
              ? <img src={foto} alt="Foto de perfil" width={96} height={96} decoding="async" className="h-24 w-24 rounded-full object-cover ring-1 ring-line" />
              : <div className="flex h-24 w-24 items-center justify-center rounded-full bg-ink text-2xl font-semibold text-white">{iniciales}</div>}
            {subiendoFoto && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
                <Loader2 size={22} className="animate-spin text-ink" aria-label="Subiendo foto" />
              </div>
            )}
            <button
              type="button"
              onClick={() => archivoRef.current?.click()}
              disabled={subiendoFoto}
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-ink text-white shadow transition-colors hover:bg-ink/90 disabled:opacity-50"
              aria-label="Cambiar foto de perfil"
              title="Cambiar foto"
            >
              <Camera size={16} />
            </button>
            <input ref={archivoRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={subirFoto} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-ink">{user.user_first_name} {user.user_last_name}</p>
            <p className="truncate text-sm text-ink-muted">{user.user_email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${insignia?.bg ?? 'bg-bg-muted'} ${insignia?.text ?? 'text-ink'} ${insignia?.ring ?? 'ring-line'}`}>
                {ROL_LABELS[user.rol] ?? user.rol}
              </span>
              {foto && (
                <button type="button" onClick={quitarFoto} disabled={subiendoFoto} className="inline-flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-red-600">
                  <Trash2 size={12} /> Quitar foto
                </button>
              )}
            </div>
          </div>

          <div className="w-full sm:w-64">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-ink-muted">Perfil completo</span>
              <span className="text-sm font-semibold text-ink">{avance}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-muted">
              <div className={`h-full rounded-full transition-all ${avance === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${avance}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              {pendientes.length
                ? <>Falta: {pendientes.map((p) => p.etiqueta).join(', ')}</>
                : <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 size={13} /> Todo listo</span>}
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs text-ink-light">Puedes subir JPG, PNG, WebP, GIF, BMP, TIFF o HEIC (fotos de iPhone), hasta 10 MB. La foto se recorta en círculo.</p>
      </div>

      {pendientes.length > 0 && (
        <Aviso variante="advertencia" titulo="Perfil incompleto">
          Completa los datos obligatorios <span className="text-red-500">*</span> para terminar tu perfil.
        </Aviso>
      )}

      <form onSubmit={guardar} className="rounded-card bg-white p-6 shadow-card sm:p-8" noValidate>
        <Seccion titulo="Identidad" descripcion="Datos de tu cuenta institucional. El nombre y el correo vienen de tu cuenta UNL.">
          <Campo etiqueta="Nombre completo"><input className={`${claseCampo()} bg-bg-soft text-ink-muted`} value={`${user.user_first_name} ${user.user_last_name}`} disabled /></Campo>
          <Campo etiqueta="Correo institucional"><input className={`${claseCampo()} bg-bg-soft text-ink-muted`} value={user.user_email} disabled /></Campo>
          <div className="sm:col-span-2">
            {sinCedula ? (
              <Campo etiqueta="Cédula" obligatorio htmlFor="cedula" error={errorCedula} ayuda="Solo podrás registrarla una vez. Si te equivocas, el administrador puede corregirla.">
                <div className="flex gap-2">
                  <input
                    id="cedula"
                    inputMode="numeric"
                    maxLength={10}
                    value={cedula}
                    onChange={(e) => { setCedula(e.target.value.replace(/\D/g, '')); setErrorCedula(undefined) }}
                    placeholder="10 dígitos"
                    className={`${claseCampo(errorCedula)} max-w-xs font-mono tracking-wider`}
                  />
                  <button
                    type="button"
                    onClick={registrarCedula}
                    disabled={guardandoCedula || cedula.length !== 10}
                    className="inline-flex items-center gap-2 rounded-btn border border-line bg-white px-4 text-sm font-medium text-ink transition-colors hover:bg-bg-soft disabled:opacity-40"
                  >
                    {guardandoCedula && <Loader2 size={14} className="animate-spin" />} Registrar cédula
                  </button>
                </div>
              </Campo>
            ) : (
              <Campo etiqueta="Cédula" ayuda="Registrada. Para corregirla, contacta al administrador.">
                <div className="relative max-w-xs">
                  <input className={`${claseCampo()} bg-bg-soft pr-9 font-mono tracking-wider text-ink-muted`} value={user.documento_identidad ?? ''} disabled />
                  <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light" />
                </div>
              </Campo>
            )}
          </div>
        </Seccion>

        <Seccion titulo="Datos académicos" descripcion={academico ? 'Tu carrera define los proyectos y reportes que verás.' : 'Opcional para tu rol.'}>
          <Campo etiqueta="Carrera" obligatorio={academico} htmlFor="carrera" error={errores.carrera_id}>
            <SelectorCarrera id="carrera" carreras={ordenadas} valor={form.carrera_id} onCambiar={(v) => cambiar('carrera_id', v)} error={errores.carrera_id} />
          </Campo>
          {/* El cargo describe una función institucional: no aplica a estudiantes. */}
          {user.rol !== 'ESTUDIANTE' && (
            <Campo etiqueta="Cargo" htmlFor="cargo" ayuda="Por ejemplo: Docente titular, Coordinador de vinculación." error={errores.cargo}>
              <input id="cargo" maxLength={100} value={form.cargo} onChange={(e) => cambiar('cargo', e.target.value)} className={claseCampo(errores.cargo)} />
            </Campo>
          )}
        </Seccion>

        <Seccion titulo="Contacto" descripcion="Para coordinar actividades de los proyectos. No se muestra públicamente.">
          <Campo etiqueta="Teléfono" obligatorio htmlFor="telefono" error={errores.telefono} ayuda="Celular 09XXXXXXXX o fijo 07XXXXXXX.">
            <input id="telefono" type="tel" inputMode="tel" maxLength={16} value={form.telefono} onChange={(e) => cambiar('telefono', e.target.value)} placeholder="0987654321" className={claseCampo(errores.telefono)} />
          </Campo>
          <Campo etiqueta="Dirección" obligatorio htmlFor="direccion" error={errores.direccion}>
            <input id="direccion" maxLength={255} value={form.direccion} onChange={(e) => cambiar('direccion', e.target.value)} placeholder="Calle principal, secundaria y referencia" className={claseCampo(errores.direccion)} />
          </Campo>
        </Seccion>

        <Seccion titulo="Información adicional" descripcion="Opcional.">
          <Campo etiqueta="Fecha de nacimiento" htmlFor="nacimiento" error={errores.fecha_nacimiento}>
            <input id="nacimiento" type="date" value={form.fecha_nacimiento} onChange={(e) => cambiar('fecha_nacimiento', e.target.value)} className={claseCampo(errores.fecha_nacimiento)} />
          </Campo>
          <div className="sm:col-span-2">
            <Campo etiqueta="Biografía" htmlFor="biografia" error={errores.biografia} ayuda={`${form.biografia.length}/600`}>
              <textarea id="biografia" rows={3} maxLength={600} value={form.biografia} onChange={(e) => cambiar('biografia', e.target.value)} placeholder="Áreas de interés, experiencia en proyectos de vinculación…" className={`${claseCampo(errores.biografia)} resize-y`} />
            </Campo>
          </div>
        </Seccion>

        <div className="flex justify-end border-t border-line pt-6">
          <button type="submit" disabled={guardando} className="inline-flex items-center gap-2 rounded-btn bg-naranja px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-naranja-hover disabled:opacity-50">
            {guardando && <Loader2 size={15} className="animate-spin" />} Guardar cambios
          </button>
        </div>
      </form>
    </div>
  )
}
