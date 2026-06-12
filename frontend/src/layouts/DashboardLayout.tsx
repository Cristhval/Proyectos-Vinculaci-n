import { useState, useRef, useEffect, useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Menu, Bell, ChevronDown, Camera, LogOut, User, CheckCheck, Info, AlertTriangle, AlertOctagon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import Sidebar from './Sidebar'
import { alertasApi } from '@/api/seguimiento'
import { PRIORIDAD_ALERTA_STYLES } from '@/lib/constants'
import { formatDateTime } from '@/lib/formatters'
import type { Alerta, PrioridadAlerta } from '@/types/seguimiento'
import type { PaginatedResponse } from '@/types/common'

export default function DashboardLayout() {
  const { sidebarOpen, toggleSidebar } = useUiStore()
  const user = useAuthStore((state) => state.user)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [contadorPendientes, setContadorPendientes] = useState(0)
  const [loadingNotif, setLoadingNotif] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const rol = user?.rol || ''
  const alertasPath = `/${rol.toLowerCase()}/alertas`

  useEffect(() => {
    if (!user?.id) return
    const saved = localStorage.getItem(`user-avatar-${user.id}`)
    setAvatarUrl(saved)
  }, [user?.id])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadContador = useCallback(() => {
    if (!user?.id) return
    alertasApi.pendientes(user.id)
      .then(({ data }: { data: PaginatedResponse<Alerta> }) => setContadorPendientes(data.count ?? data.results.length))
      .catch(() => {})
  }, [user?.id])

  const loadAlertasRecientes = useCallback(() => {
    if (!user?.id) return
    setLoadingNotif(true)
    alertasApi.recientes(user.id)
      .then(({ data }: { data: PaginatedResponse<Alerta> }) => setAlertas(data.results))
      .catch(() => {})
      .finally(() => setLoadingNotif(false))
  }, [user?.id])

  useEffect(() => {
    loadContador()
    const interval = setInterval(loadContador, 60000)
    return () => clearInterval(interval)
  }, [loadContador])

  useEffect(() => {
    if (notifOpen) loadAlertasRecientes()
  }, [notifOpen, loadAlertasRecientes])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setAvatarUrl(result)
      localStorage.setItem(`user-avatar-${user?.id}`, result)
    }
    reader.readAsDataURL(file)
    setMenuOpen(false)
  }

  const formatRelative = (dateStr: string): string => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHr = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHr / 24)
    if (diffSec < 60) return 'ahora'
    if (diffMin < 60) return `hace ${diffMin} min`
    if (diffHr < 24) return `hace ${diffHr} h${diffHr === 1 ? '' : 's'}`
    if (diffDay === 1) return 'ayer'
    if (diffDay < 7) return `hace ${diffDay} día${diffDay === 1 ? '' : 's'}`
    if (diffDay < 30) return `hace ${Math.floor(diffDay / 7)} sem`
    return formatDateTime(dateStr)
  }

  const handleNotifClick = async (a: Alerta) => {
    try {
      if (a.estado === 'PENDIENTE') {
        await alertasApi.leer(a.id)
        setContadorPendientes((c) => Math.max(0, c - 1))
      }
      setNotifOpen(false)
      navigate(alertasPath)
    } catch {
      toast.error('No se pudo marcar la alerta')
    }
  }

  const handleMarcarTodasLeidas = async () => {
    const pendientes = alertas.filter((a) => a.estado === 'PENDIENTE')
    await Promise.all(pendientes.map((a) => alertasApi.leer(a.id).catch(() => null)))
    setContadorPendientes(0)
    loadAlertasRecientes()
    toast.success('Notificaciones marcadas como leídas')
  }

  const initials = user
    ? `${(user.user_first_name || 'U')[0]}${(user.user_last_name || '')[0]}`.toUpperCase()
    : 'U'

  return (
    <div className="h-screen overflow-hidden flex bg-bg-soft">
      <Sidebar open={sidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-line flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-bg-soft rounded-btn transition-colors duration-150"
            >
              <Menu size={18} className="text-ink-muted" />
            </button>
            <h1 className="text-sm font-semibold text-ink tracking-tight">
              Sistema de Vinculación UNL
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false) }}
                className="relative p-2 hover:bg-bg-soft rounded-btn transition-colors duration-150"
              >
                <Bell size={18} className={contadorPendientes > 0 ? 'text-ink' : 'text-ink-muted'} />
                {contadorPendientes > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white">
                    {contadorPendientes > 99 ? '99+' : contadorPendientes}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-1 w-96 bg-white rounded-card shadow-lg border border-line z-50 py-2">
                  <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-ink">Notificaciones</p>
                      {contadorPendientes > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500 text-white">
                          {contadorPendientes}
                        </span>
                      )}
                    </div>
                    {alertas.some((a) => a.estado === 'PENDIENTE') && (
                      <button
                        type="button"
                        onClick={handleMarcarTodasLeidas}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#16A34A] hover:underline"
                      >
                        <CheckCheck size={11} /> Marcar todas leídas
                      </button>
                    )}
                  </div>
                  {loadingNotif ? (
                    <div className="px-4 py-8 text-center">
                      <div className="w-5 h-5 border-[2px] border-line border-t-emerald-600 rounded-full animate-spin mx-auto" />
                    </div>
                  ) : alertas.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <div className="w-12 h-12 rounded-full bg-bg-soft flex items-center justify-center mx-auto mb-2">
                        <Bell size={22} className="text-ink-light opacity-50" />
                      </div>
                      <p className="text-sm font-medium text-ink">No tienes alertas nuevas</p>
                      <p className="text-[11px] text-ink-muted mt-1">Te avisaremos cuando llegue algo</p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {alertas.map((a) => {
                        const prioStyle = PRIORIDAD_ALERTA_STYLES[a.prioridad as PrioridadAlerta] ?? PRIORIDAD_ALERTA_STYLES.BAJA!
                        const PrioIcon = a.prioridad === 'URGENTE'
                          ? AlertOctagon
                          : a.prioridad === 'ALTA' || a.prioridad === 'MEDIA'
                            ? AlertTriangle
                            : Info
                        const isUnread = !a.leida && a.estado === 'PENDIENTE'
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => handleNotifClick(a)}
                            className={`w-full text-left px-4 py-3 hover:bg-bg-soft transition-colors border-b border-line/40 last:border-0 flex items-start gap-2.5 ${isUnread ? 'bg-emerald-50/50' : ''}`}
                          >
                            <div className={`w-8 h-8 rounded-lg ${prioStyle.bg} ${prioStyle.ring} ring-1 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <PrioIcon size={14} className={prioStyle.icon} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-[13px] leading-snug line-clamp-2 ${isUnread ? 'font-semibold text-ink' : 'font-medium text-ink-muted'}`}>
                                {a.mensaje}
                              </p>
                              <p className="text-[10.5px] text-ink-muted mt-0.5 inline-flex items-center gap-1">
                                {formatRelative(a.creado_en)}
                                {a.proyecto_codigo && (
                                  <>
                                    <span className="opacity-50">·</span>
                                    <span className="font-mono">{a.proyecto_codigo}</span>
                                  </>
                                )}
                                {a.convenio_codigo && !a.proyecto_codigo && (
                                  <>
                                    <span className="opacity-50">·</span>
                                    <span className="font-mono">{a.convenio_codigo}</span>
                                  </>
                                )}
                              </p>
                            </div>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  <div className="border-t border-line px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => { setNotifOpen(false); navigate(alertasPath) }}
                      className="w-full text-center text-[12px] font-semibold text-[#16A34A] hover:underline"
                    >
                      Ver todas las alertas
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Menu */}
            {user && (
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false) }}
                  className="flex items-center gap-2 p-1.5 hover:bg-bg-soft rounded-btn transition-colors duration-150"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover border border-line"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-semibold border border-accent/20">
                      {initials}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-ink max-w-[120px] truncate">
                    {user.user_first_name || user.user_username}
                  </span>
                  <ChevronDown size={14} className="hidden sm:block text-ink-muted" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-card shadow-lg border border-line z-50 py-1">
                    <div className="px-4 py-3 border-b border-line">
                      <p className="text-sm font-medium text-ink truncate">
                        {user.user_first_name} {user.user_last_name}
                      </p>
                      <p className="text-xs text-ink-muted truncate">{user.user_email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-ink hover:bg-bg-soft transition-colors"
                      >
                        <Camera size={16} className="text-ink-muted" />
                        Cambiar foto de perfil
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                      <button
                        onClick={() => { setMenuOpen(false) }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-ink hover:bg-bg-soft transition-colors"
                      >
                        <User size={16} className="text-ink-muted" />
                        Mi perfil
                      </button>
                    </div>
                    <div className="border-t border-line py-1">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
