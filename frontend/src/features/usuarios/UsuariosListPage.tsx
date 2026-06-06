import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Pencil, KeyRound, Trash2, Users, Eye, EyeOff, AlertTriangle, UserPlus, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { usuariosApi, carrerasApi } from '@/api/usuarios'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import Modal from '@/components/ui/Modal'
import { ROL_LABELS } from '@/lib/constants'
import type { Usuario, RolUsuario, Carrera } from '@/types/usuarios'

const ROL_COLORS: Record<string, string> = {
  ADMIN: 'bg-[#0A0A0A] text-white',
  COORDINADOR: 'bg-[#2563EB] text-white',
  DOCENTE: 'bg-[#EAB308] text-gray-900',
  ESTUDIANTE: 'bg-[#6B7280] text-white',
  DIRECTIVO: 'bg-[#B45309] text-white',
}

const ROL_AVATAR_COLORS: Record<string, string> = {
  ADMIN: 'bg-[#0A0A0A] text-white',
  COORDINADOR: 'bg-blue-100 text-blue-700',
  DOCENTE: 'bg-emerald-100 text-emerald-700',
  ESTUDIANTE: 'bg-gray-200 text-gray-700',
  DIRECTIVO: 'bg-amber-100 text-amber-700',
}

const PAGE_SIZE = 10

export default function UsuariosListPage() {
  const currentUser = useAuthStore((s) => s.user)
  const { isAdmin } = usePermissions()

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const [search, setSearch] = useState('')
  const [filterRol, setFilterRol] = useState('')
  const [filterActivo, setFilterActivo] = useState('')

  const [carreras, setCarreras] = useState<Carrera[]>([])

  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<Usuario | null>(null)
  const [changePassUser, setChangePassUser] = useState<Usuario | null>(null)
  const [deleteUser, setDeleteUser] = useState<Usuario | null>(null)

  const loadUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        page: String(page),
        page_size: String(PAGE_SIZE),
      }
      if (search) params.search = search
      if (filterRol) params.rol = filterRol
      if (filterActivo) params.activo = filterActivo === 'ACTIVO' ? 'true' : 'false'

      const { data } = await usuariosApi.list(params)
      setUsuarios(data.results)
      setTotal(data.count)
    } catch {
      toast.error('Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }, [page, search, filterRol, filterActivo])

  useEffect(() => { loadUsuarios() }, [loadUsuarios])

  useEffect(() => {
    carrerasApi.list({ page_size: '100' }).then(({ data }) => setCarreras(data.results)).catch(() => {})
  }, [])

  const handleSearch = () => { setPage(1); loadUsuarios() }
  const handleClear = () => { setSearch(''); setFilterRol(''); setFilterActivo(''); setPage(1) }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  const stats = {
    total,
    docentes: usuarios.filter((u) => u.rol === 'DOCENTE' && u.activo).length,
    estudiantes: usuarios.filter((u) => u.rol === 'ESTUDIANTE' && u.activo).length,
    inactivos: usuarios.filter((u) => !u.activo).length,
  }

  const formatFechaCorta = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
  }

  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <ShieldCheck size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-lg font-semibold text-gray-900">Acceso restringido</p>
        <p className="text-sm text-gray-500 mt-1">Solo los administradores pueden gestionar usuarios.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">Administra los usuarios registrados en el sistema</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total usuarios', value: stats.total, color: 'border-l-gray-900', textColor: 'text-gray-900' },
          { label: 'Docentes activos', value: stats.docentes, color: 'border-l-emerald-600', textColor: 'text-emerald-600' },
          { label: 'Estudiantes activos', value: stats.estudiantes, color: 'border-l-blue-600', textColor: 'text-blue-600' },
          { label: 'Usuarios inactivos', value: stats.inactivos, color: 'border-l-gray-500', textColor: 'text-gray-500' },
        ].map((s) => (
          <div key={s.label} className={`bg-white border border-gray-200 p-4 border-l-4 ${s.color}`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.textColor}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Buscar</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"
                placeholder="Buscar por nombre, correo o código..."
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Rol</label>
            <select value={filterRol} onChange={(e) => setFilterRol(e.target.value)} className="px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors">
              <option value="">Todos</option>
              <option value="ADMIN">Administrador</option>
              <option value="COORDINADOR">Coordinador</option>
              <option value="DOCENTE">Docente</option>
              <option value="ESTUDIANTE">Estudiante</option>
              <option value="DIRECTIVO">Directivo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Estado</label>
            <select value={filterActivo} onChange={(e) => setFilterActivo(e.target.value)} className="px-3 py-2 border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors">
              <option value="">Todos</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>
          <button onClick={handleSearch} className="px-4 py-2 text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors">
            Buscar
          </button>
          <button onClick={handleClear} className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
            Limpiar
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-[3px] border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : usuarios.length === 0 ? (
        <div className="bg-white border border-gray-200 p-16 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-sm font-medium text-gray-900">No se encontraron usuarios</p>
          <p className="text-xs text-gray-500 mt-1">Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Usuario</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Correo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Código</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Rol</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Registro</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map((u, i) => {
                  const initials = `${(u.user_first_name?.[0] || '')}${(u.user_last_name?.[0] || '')}`.toUpperCase() || '?'
                  return (
                    <tr key={u.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-emerald-50/30 transition-colors`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${ROL_AVATAR_COLORS[u.rol] || 'bg-gray-200 text-gray-700'}`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{u.user_first_name} {u.user_last_name}</p>
                            <p className="text-xs text-gray-500">@{u.user_username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{u.user_email || '-'}</td>
                      <td className="px-4 py-3">
                        {u.codigo ? (
                          <span className="px-2 py-0.5 text-xs font-mono bg-gray-100 text-gray-700 rounded-md">{u.codigo}</span>
                        ) : (
                          <span className="text-xs text-gray-400">Sin código</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center min-w-[90px] px-2.5 py-0.5 text-[10px] font-semibold rounded-md text-center ${ROL_COLORS[u.rol] || 'bg-gray-200 text-gray-700'}`}>
                          {ROL_LABELS[u.rol] || u.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center gap-1.5 min-w-[80px] px-2.5 py-0.5 text-[10px] font-semibold rounded-md text-center ${u.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                          {u.activo && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatFechaCorta(u.creado_en)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditUser(u)}
                            title="Editar usuario"
                            className="p-1.5 text-[#16A34A] hover:bg-emerald-50 transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setChangePassUser(u)}
                            title="Cambiar contraseña"
                            className="p-1.5 text-[#EAB308] hover:bg-amber-50 transition-colors"
                          >
                            <KeyRound size={15} />
                          </button>
                          <button
                            onClick={() => {
                              if (u.id === currentUser?.id) {
                                toast.error('No puedes eliminar tu propia cuenta')
                                return
                              }
                              setDeleteUser(u)
                            }}
                            title="Eliminar usuario"
                            className={`p-1.5 transition-colors ${u.id === currentUser?.id ? 'text-gray-300 cursor-not-allowed' : 'text-[#DC2626] hover:bg-red-50'}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {from} - {to} de {total} usuarios
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Anterior
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1
                return (
                  <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 text-sm border transition-colors ${page === p ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                    {p}
                  </button>
                )
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}

      {/* MODAL: Crear usuario */}
      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} carreras={carreras} onCreated={loadUsuarios} />

      {/* MODAL: Editar usuario */}
      <EditUserModal user={editUser} onClose={() => setEditUser(null)} carreras={carreras} onSaved={loadUsuarios} />

      {/* MODAL: Cambiar contraseña */}
      <ChangePasswordModal user={changePassUser} onClose={() => setChangePassUser(null)} />

      {/* MODAL: Eliminar usuario */}
      <DeleteUserModal user={deleteUser} onClose={() => setDeleteUser(null)} onDeleted={loadUsuarios} />
    </div>
  )
}

/* ─────────────────────────────────────────────
   MODAL: CREAR USUARIO
   ───────────────────────────────────────────── */
function CreateUserModal({ open, onClose, carreras, onCreated }: { open: boolean; onClose: () => void; carreras: Carrera[]; onCreated: () => void }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', codigo: '',
    documento_identidad: '', carrera_id: '', rol: '' as RolUsuario | '',
    telefono: '', password: '', password2: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => { const n = { ...e }; delete n[field]; return n })
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.first_name.trim()) errs.first_name = 'Los nombres son obligatorios'
    if (!form.last_name.trim()) errs.last_name = 'Los apellidos son obligatorios'
    if (!form.email.trim()) errs.email = 'El correo es obligatorio'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Formato de correo inválido'
    if (!form.rol) errs.rol = 'Selecciona un rol'
    if (!form.password) errs.password = 'La contraseña es obligatoria'
    else if (form.password.length < 8) errs.password = 'Mínimo 8 caracteres'
    if (form.password !== form.password2) errs.password2 = 'Las contraseñas no coinciden'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await usuariosApi.create({
        username: form.email,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
        codigo: form.codigo.trim() || undefined,
        documento_identidad: form.documento_identidad.trim() || undefined,
        rol: form.rol || undefined,
      })
      toast.success('Usuario creado correctamente')
      setForm({ first_name: '', last_name: '', email: '', codigo: '', documento_identidad: '', carrera_id: '', rol: '', telefono: '', password: '', password2: '' })
      onClose()
      onCreated()
    } catch {
      toast.error('No se pudo crear el usuario')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo usuario"
      subtitle="Crea un nuevo usuario en el sistema."
      icon={<UserPlus size={20} className="text-emerald-600" />}
      size="xl"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Creando...' : 'Crear usuario'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-4">
          <Field label="Nombres *" error={errors.first_name}>
            <input value={form.first_name} onChange={(e) => update('first_name', e.target.value)} className={inputCls(errors.first_name)} placeholder="Nombres" />
          </Field>
          <Field label="Apellidos *" error={errors.last_name}>
            <input value={form.last_name} onChange={(e) => update('last_name', e.target.value)} className={inputCls(errors.last_name)} placeholder="Apellidos" />
          </Field>
          <Field label="Correo electrónico *" error={errors.email}>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputCls(errors.email)} placeholder="correo@ejemplo.com" />
          </Field>
          <Field label="Código institucional">
            <input value={form.codigo} onChange={(e) => update('codigo', e.target.value)} className={inputCls()} placeholder="Ej: EST-00001" />
          </Field>
          <Field label="Cédula / Pasaporte">
            <input value={form.documento_identidad} onChange={(e) => update('documento_identidad', e.target.value)} className={inputCls()} placeholder="Documento de identidad" />
          </Field>
        </div>
        <div className="space-y-4">
          <Field label="Rol *" error={errors.rol}>
            <select value={form.rol} onChange={(e) => update('rol', e.target.value)} className={inputCls(errors.rol)}>
              <option value="">Seleccionar rol...</option>
              <option value="ADMIN">Administrador</option>
              <option value="COORDINADOR">Coordinador</option>
              <option value="DOCENTE">Docente</option>
              <option value="ESTUDIANTE">Estudiante</option>
              <option value="DIRECTIVO">Directivo</option>
            </select>
          </Field>
          <Field label="Carrera">
            <select value={form.carrera_id} onChange={(e) => update('carrera_id', e.target.value)} className={inputCls()}>
              <option value="">Seleccionar carrera...</option>
              {carreras.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Field>
          <Field label="Teléfono">
            <input value={form.telefono} onChange={(e) => update('telefono', e.target.value)} className={inputCls()} placeholder="Teléfono" />
          </Field>
          <Field label="Contraseña *" error={errors.password}>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} className={inputCls(errors.password)} placeholder="Mínimo 8 caracteres" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <Field label="Confirmar contraseña *" error={errors.password2}>
            <div className="relative">
              <input type={showPass2 ? 'text' : 'password'} value={form.password2} onChange={(e) => update('password2', e.target.value)} className={inputCls(errors.password2)} placeholder="Repite la contraseña" />
              <button type="button" onClick={() => setShowPass2(!showPass2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass2 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
        </div>
      </div>
    </Modal>
  )
}

/* ─────────────────────────────────────────────
   MODAL: EDITAR USUARIO
   ───────────────────────────────────────────── */
function EditUserModal({ user, onClose, carreras, onSaved }: { user: Usuario | null; onClose: () => void; carreras: Carrera[]; onSaved: () => void }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', telefono: '', codigo: '', documento_identidad: '', carrera_id: '', rol: '' as RolUsuario | '', activo: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.user_first_name || '',
        last_name: user.user_last_name || '',
        email: user.user_email || '',
        telefono: user.telefono || '',
        codigo: user.codigo || '',
        documento_identidad: user.documento_identidad || '',
        carrera_id: user.carrera ? String(user.carrera.id) : '',
        rol: user.rol,
        activo: user.activo,
      })
    }
  }, [user])

  const update = (field: string, value: string | boolean) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async () => {
    if (!user) return
    setSaving(true)
    try {
      await usuariosApi.update(user.id, {
        user_first_name: form.first_name,
        user_last_name: form.last_name,
        user_email: form.email,
        telefono: form.telefono,
        codigo: form.codigo,
        documento_identidad: form.documento_identidad || null,
        carrera_id: form.carrera_id ? Number(form.carrera_id) : null,
        rol: form.rol as RolUsuario,
        activo: form.activo,
      })
      toast.success('Usuario actualizado correctamente')
      onClose()
      onSaved()
    } catch {
      toast.error('No se pudo actualizar el usuario')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title="Editar usuario"
      subtitle={user ? `${user.user_first_name} ${user.user_last_name}` : ''}
      icon={<Pencil size={20} className="text-emerald-600" />}
      size="xl"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </>
      }
    >
      {user && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Información personal</h4>
              <Field label="Nombres *">
                <input value={form.first_name} onChange={(e) => update('first_name', e.target.value)} className={inputCls()} />
              </Field>
              <Field label="Apellidos *">
                <input value={form.last_name} onChange={(e) => update('last_name', e.target.value)} className={inputCls()} />
              </Field>
              <Field label="Correo electrónico *">
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputCls()} />
              </Field>
              <Field label="Teléfono">
                <input value={form.telefono} onChange={(e) => update('telefono', e.target.value)} className={inputCls()} />
              </Field>
              <Field label="Código institucional">
                <input value={form.codigo} onChange={(e) => update('codigo', e.target.value)} className={inputCls()} />
              </Field>
              <Field label="Cédula / Pasaporte">
                <input value={form.documento_identidad} onChange={(e) => update('documento_identidad', e.target.value)} className={inputCls()} />
              </Field>
              <Field label="Carrera">
                <select value={form.carrera_id} onChange={(e) => update('carrera_id', e.target.value)} className={inputCls()}>
                  <option value="">Seleccionar carrera...</option>
                  {carreras.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </Field>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol y acceso</h4>
              <Field label="Rol *">
                <select value={form.rol} onChange={(e) => update('rol', e.target.value)} className={inputCls()}>
                  <option value="ADMIN">Administrador</option>
                  <option value="COORDINADOR">Coordinador</option>
                  <option value="DOCENTE">Docente</option>
                  <option value="ESTUDIANTE">Estudiante</option>
                  <option value="DIRECTIVO">Directivo</option>
                </select>
              </Field>
              {form.rol && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Vista previa:</span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${ROL_COLORS[form.rol] || 'bg-gray-200'}`}>
                    {ROL_LABELS[form.rol] || form.rol}
                  </span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <button
                  type="button"
                  onClick={() => update('activo', !form.activo)}
                  className={`relative inline-flex h-6 w-11 items-center transition-colors ${form.activo ? 'bg-emerald-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${form.activo ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="ml-2 text-sm text-gray-700">{form.activo ? 'Activo' : 'Inactivo'}</span>
                {!form.activo && (
                  <p className="text-xs text-amber-600 mt-1">El usuario no podrá iniciar sesión mientras esté inactivo.</p>
                )}
              </div>
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 mt-4">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">El usuario deberá cerrar sesión y volver a ingresar para que los cambios de rol tomen efecto.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ─────────────────────────────────────────────
   MODAL: CAMBIAR CONTRASEÑA
   ───────────────────────────────────────────── */
function ChangePasswordModal({ user, onClose }: { user: Usuario | null; onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const [saving, setSaving] = useState(false)

  const strength = getPasswordStrength(password)
  const hasError = password.length > 0 && password.length < 8
  const hasMismatch = password2.length > 0 && password !== password2

  const handleSubmit = async () => {
    if (!user || password.length < 8 || password !== password2) return
    setSaving(true)
    try {
      await usuariosApi.cambiarContrasena(user.id, { password, password2 })
      toast.success('Contraseña actualizada correctamente')
      setPassword('')
      setPassword2('')
      onClose()
    } catch {
      toast.error('No se pudo cambiar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={user !== null}
      onClose={() => { setPassword(''); setPassword2(''); onClose() }}
      title="Cambiar contraseña"
      subtitle={user ? `${user.user_first_name} ${user.user_last_name}` : ''}
      icon={<KeyRound size={20} className="text-amber-600" />}
      size="md"
      footer={
        <>
          <button onClick={() => { setPassword(''); setPassword2(''); onClose() }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving || password.length < 8 || password !== password2} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </>
      }
    >
      {user && (
        <div className="space-y-4">
          <Field label="Nueva contraseña *" error={hasError ? 'La contraseña debe tener mínimo 8 caracteres' : ''}>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls(hasError)} placeholder="Mínimo 8 caracteres" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-2">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full transition-all ${strength.color}`} style={{ width: strength.percent }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{strength.label}</p>
              </div>
            )}
          </Field>
          <Field label="Confirmar nueva contraseña *" error={hasMismatch ? 'Las contraseñas no coinciden' : ''}>
            <div className="relative">
              <input type={showPass2 ? 'text' : 'password'} value={password2} onChange={(e) => setPassword2(e.target.value)} className={inputCls(hasMismatch)} placeholder="Repite la contraseña" />
              <button type="button" onClick={() => setShowPass2(!showPass2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass2 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
        </div>
      )}
    </Modal>
  )
}

/* ─────────────────────────────────────────────
   MODAL: ELIMINAR USUARIO
   ───────────────────────────────────────────── */
function DeleteUserModal({ user, onClose, onDeleted }: { user: Usuario | null; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!user) return
    setDeleting(true)
    try {
      await usuariosApi.delete(user.id)
      toast.success('Usuario eliminado')
      onClose()
      onDeleted()
    } catch {
      toast.error('No se pudo eliminar el usuario')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title="¿Eliminar usuario?"
      subtitle="Esta acción no se puede deshacer."
      icon={<AlertTriangle size={20} className="text-red-600" />}
      size="md"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {deleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </>
      }
    >
      {user && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${ROL_AVATAR_COLORS[user.rol] || 'bg-gray-200 text-gray-700'}`}>
              {(user.user_first_name?.[0] || '')}{(user.user_last_name?.[0] || '')}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{user.user_first_name} {user.user_last_name}</p>
              <p className="text-xs text-gray-500">{user.user_email}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">Esta acción no se puede deshacer. Se eliminará toda la información asociada a este usuario.</p>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function inputCls(error?: string | boolean) {
  const hasError = typeof error === 'string' ? error : error === true
  return `w-full px-3 py-2.5 border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors ${hasError ? 'border-red-400' : 'border-gray-300'}`
}

function getPasswordStrength(pw: string): { label: string; percent: string; color: string } {
  if (pw.length === 0) return { label: '', percent: '0%', color: '' }
  if (pw.length < 5) return { label: 'Débil', percent: '25%', color: 'bg-red-500' }
  if (pw.length < 8) return { label: 'Regular', percent: '50%', color: 'bg-amber-500' }
  const hasUpper = /[A-Z]/.test(pw)
  const hasNumber = /\d/.test(pw)
  const hasSymbol = /[^A-Za-z0-9]/.test(pw)
  if (hasUpper && hasNumber && hasSymbol) return { label: 'Fuerte', percent: '100%', color: 'bg-emerald-600' }
  if (hasUpper || hasNumber) return { label: 'Buena', percent: '75%', color: 'bg-emerald-500' }
  return { label: 'Regular', percent: '50%', color: 'bg-amber-500' }
}
