import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Menu, Bell, ChevronDown, Camera, LogOut, User, X, CheckCheck, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import Sidebar from './Sidebar'
import { alertasApi } from '@/api/seguimiento'
import { formatDateTime } from '@/lib/formatters'
import type { Alerta } from '@/types/seguimiento'
import type { PaginatedResponse } from '@/types/common'

type NotifFilter = 'PENDIENTE' | 'TODAS'
type TimeGroup = 'HOY' | 'AYER' | 'ESTA_SEMANA' | 'ANTERIOR'

const TIME_GROUP_LABELS: Record<TimeGroup, string> = {
  HOY: 'Hoy',
  AYER: 'Ayer',
  ESTA_SEMANA: 'Esta semana',
  ANTERIOR: 'Anterior',
}

const TIME_GROUP_ORDER: TimeGroup[] = ['HOY', 'AYER', 'ESTA_SEMANA', 'ANTERIOR']

function getTimeGroup(dateStr: string): TimeGroup {
  const d = new Date(dateStr)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - 6)
  if (d >= startOfToday) return 'HOY'
  if (d >= startOfYesterday) return 'AYER'
  if (d >= startOfWeek) return 'ESTA_SEMANA'
  return 'ANTERIOR'
}

export default function DashboardLayout() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUiStore()
  const user = useAuthStore((state) => state.user)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifFilter, setNotifFilter] = useState<NotifFilter>('PENDIENTE')
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
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarOpen])

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
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') { setNotifOpen(false); setMenuOpen(false) }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleEscape) }
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
    if (notifOpen) {
      loadAlertasRecientes()
      setNotifFilter('PENDIENTE')
    } else {
      loadContador()
    }
  }, [notifOpen, loadAlertasRecientes, loadContador])

  useEffect(() => {
    loadContador()
  }, [location.pathname, loadContador])

  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === 'visible') loadContador() }
    const onFocus = () => loadContador()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
    }
  }, [loadContador])

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
      if (a.estado === 'PENDIENTE' && !a.leida) {
        await alertasApi.leer(a.id)
        setContadorPendientes((c) => Math.max(0, c - 1))
        setAlertas((prev) => prev.map((x) => (x.id === a.id ? { ...x, leida: true, estado: 'LEIDA' } : x)))
      }
      setNotifOpen(false)
      if (a.enlace) navigate(a.enlace)
      else navigate(alertasPath)
    } catch {
      toast.error('No se pudo marcar la alerta')
    }
  }

  const handleMarcarTodasLeidas = async () => {
    const pendientes = alertas.filter((a) => a.estado === 'PENDIENTE' && !a.leida)
    if (pendientes.length === 0) return
    await Promise.all(pendientes.map((a) => alertasApi.leer(a.id).catch(() => null)))
    setAlertas((prev) => prev.map((x) => ({ ...x, leida: true, estado: 'LEIDA' })))
    loadContador()
    toast.success('Notificaciones marcadas como leídas')
  }

  const initials = user
    ? `${(user.user_first_name || 'U')[0]}${(user.user_last_name || '')[0]}`.toUpperCase()
    : 'U'

  const filteredAlertas = useMemo(() => {
    if (notifFilter === 'PENDIENTE') {
      return alertas.filter((a) => a.estado === 'PENDIENTE' && !a.leida)
    }
    return alertas
  }, [alertas, notifFilter])

  const groupedAlertas = useMemo(() => {
    const groups: Record<TimeGroup, Alerta[]> = {
      HOY: [], AYER: [], ESTA_SEMANA: [], ANTERIOR: [],
    }
    const sorted = [...filteredAlertas].sort(
      (a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()
    )
    sorted.forEach((a) => {
      groups[getTimeGroup(a.creado_en)].push(a)
    })
    return groups
  }, [filteredAlertas])

  const hasUnreadInList = filteredAlertas.some((a) => !a.leida && a.estado === 'PENDIENTE')

  return (
    <div className="h-screen overflow-hidden flex bg-bg-soft">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`
          fixed md:relative z-50 h-full shrink-0 transition-all duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden'}
        `}
      >
        <Sidebar open={sidebarOpen} onNavigate={() => { if (window.innerWidth < 768) setSidebarOpen(false) }} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 md:h-16 bg-white border-b border-line flex items-center justify-between px-3 md:px-6">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-bg-soft rounded-btn transition-colors duration-150"
            >
              <Menu size={18} className="text-ink-muted" />
            </button>
            <h1 className="text-xs md:text-sm font-semibold text-ink tracking-tight">
              Sistema de Vinculación UNL
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false) }}
                className="relative p-2 hover:bg-bg-soft rounded-btn transition-colors duration-150"
                aria-label="Notificaciones"
              >
                <Bell size={18} className={contadorPendientes > 0 ? 'text-ink' : 'text-ink-muted'} />
                {contadorPendientes > 0 && (
                  <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white tabular-nums ${alertas.some((a) => a.prioridad === 'URGENTE' && !a.leida) ? 'animate-pulse' : ''}`}>
                    {contadorPendientes > 99 ? '99+' : contadorPendientes}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div
                  className="fixed md:absolute inset-0 md:inset-auto md:right-0 md:top-full md:mt-2 w-full md:w-[380px] h-full md:h-auto md:max-h-[420px] bg-white md:border md:border-line z-[60] flex flex-col overflow-hidden notif-shell"
                  style={{
                    boxShadow:
                      '0 0 0 100vmax rgba(15, 23, 42, 0.18), 0 24px 48px -12px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <style>{`
                    @keyframes notifShellIn {
                      from { transform: translateX(100%); opacity: 0; }
                      to   { transform: translateX(0); opacity: 1; }
                    }
                    @media (min-width: 768px) {
                      @keyframes notifShellIn {
                        from { transform: translateY(-8px) scale(0.97); opacity: 0; }
                        to   { transform: translateY(0) scale(1); opacity: 1; }
                      }
                    }
                    .notif-shell { animation: notifShellIn 0.24s cubic-bezier(0.16, 1, 0.3, 1); }
                    .notif-scroll { scrollbar-width: thin; scrollbar-color: #E2E8F0 transparent; }
                    .notif-scroll::-webkit-scrollbar { width: 6px; }
                    .notif-scroll::-webkit-scrollbar-track { background: transparent; }
                    .notif-scroll::-webkit-scrollbar-thumb { background: #E2E8F0; }
                    .notif-scroll::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
                  `}</style>

                  {/* Header (sticky) */}
                  <div className="px-5 pt-3 pb-2.5 flex-shrink-0 bg-white/95 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h2 className="text-[15px] font-semibold text-ink tracking-tight">Notificaciones</h2>
                        {contadorPendientes > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 bg-emerald-600 text-white text-[10.5px] font-semibold tabular-nums">
                            {contadorPendientes > 99 ? '99+' : contadorPendientes}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {hasUnreadInList && (
                          <button
                            type="button"
                            onClick={handleMarcarTodasLeidas}
                            className="p-1.5 hover:bg-bg-soft transition-colors duration-150"
                            title="Marcar todas como leídas"
                          >
                            <CheckCheck size={15} className="text-ink-muted" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setNotifOpen(false)}
                          className="p-1.5 hover:bg-bg-soft transition-colors duration-150"
                          title="Cerrar"
                        >
                          <X size={15} className="text-ink-muted" />
                        </button>
                      </div>
                    </div>

                    {/* Segmented control (pill selector) */}
                    <div className="mt-2.5 grid grid-cols-2 p-0.5 bg-bg-muted">
                      {([
                        { key: 'PENDIENTE', label: 'Pendientes', count: alertas.filter((a) => a.estado === 'PENDIENTE' && !a.leida).length },
                        { key: 'TODAS', label: 'Todas', count: alertas.length },
                      ] as { key: NotifFilter; label: string; count: number }[]).map((t) => {
                        const active = notifFilter === t.key
                        return (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => setNotifFilter(t.key)}
                            className={`relative inline-flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-semibold transition-colors duration-200 ${
                              active
                                ? 'bg-white text-ink shadow-[0_2px_8px_rgba(15,23,42,0.08)] border border-line/70'
                                : 'text-ink-muted hover:text-ink border border-transparent'
                            }`}
                          >
                            <span>{t.label}</span>
                            <span
                              className={`inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 text-[10px] font-semibold tabular-nums ${
                                active
                                  ? 'bg-ink text-white'
                                  : 'bg-white text-ink-muted border border-line'
                              }`}
                            >
                              {t.count}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Hairline divider */}
                  <div className="hairline flex-shrink-0" />

                  {/* Lista */}
                  {loadingNotif ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                      <div className="w-5 h-5 border-[2px] border-line border-t-emerald-600 animate-spin" />
                      <p className="text-[11.5px] text-ink-muted">Cargando notificaciones…</p>
                    </div>
                  ) : filteredAlertas.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-5">
                      <div
                        className="w-16 h-16 flex items-center justify-center mb-3"
                        style={{
                          background:
                            'radial-gradient(circle at 32% 30%, #ECFDF5 0%, #D1FAE5 100%)',
                          borderRadius: '999px',
                        }}
                      >
                        <Bell size={26} className="text-emerald-500" strokeWidth={1.5} />
                      </div>
                      <p className="text-[13px] font-semibold text-ink tracking-tight">No tienes notificaciones</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto notif-scroll">
                      {TIME_GROUP_ORDER.map((group) => {
                        const items = groupedAlertas[group]
                        if (items.length === 0) return null
                        return (
                          <div key={group}>
                            <div className="sticky top-0 z-10 px-5 pt-2.5 pb-1 bg-white/90 backdrop-blur-sm">
                              <p className="text-[10.5px] font-semibold text-ink-muted uppercase tracking-[0.06em]">
                                {TIME_GROUP_LABELS[group]}
                                <span className="ml-1.5 text-ink-light normal-case tracking-normal font-medium">
                                  {items.length}
                                </span>
                              </p>
                            </div>
                            {items.map((a) => {
                              const isUnread = !a.leida && a.estado === 'PENDIENTE'
                              return (
                                <button
                                  key={a.id}
                                  type="button"
                                  onClick={() => handleNotifClick(a)}
                                  className="group relative w-full text-left flex items-start gap-2.5 px-5 py-2.5 hover:bg-bg-soft transition-colors duration-150 border-b border-line/60"
                                  style={{ background: isUnread ? 'rgba(236, 253, 245, 0.35)' : 'white' }}
                                >
                                  {isUnread && (
                                    <span
                                      className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100"
                                      title="No leída"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0 pl-1">
                                    <p
                                      className={`text-[12.5px] leading-snug line-clamp-2 ${
                                        isUnread ? 'font-semibold text-ink' : 'font-medium text-ink-muted'
                                      }`}
                                    >
                                      {a.mensaje}
                                    </p>
                                    {a.detalle && (
                                      <p className="text-[11.5px] text-ink-muted mt-0.5 line-clamp-1">{a.detalle}</p>
                                    )}
                                    <div className="flex items-center gap-1.5 mt-1 text-[10.5px] text-ink-light">
                                      {a.proyecto_codigo && (
                                        <span className="inline-flex items-center px-1 py-px bg-blue-50 text-blue-700 font-semibold tracking-tight border border-blue-100">
                                          {a.proyecto_codigo}
                                        </span>
                                      )}
                                      {a.proyecto_codigo && <span className="text-ink-light/60">·</span>}
                                      <span className="tabular-nums">{formatRelative(a.creado_en)}</span>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Footer (CTA) */}
                  <div className="px-4 py-2.5 flex-shrink-0 bg-white border-t border-line/60">
                    <button
                      type="button"
                      onClick={() => { setNotifOpen(false); navigate(alertasPath) }}
                      className="group w-full inline-flex items-center justify-center gap-1.5 py-2 bg-ink hover:bg-ink-deep text-white text-[12.5px] font-semibold tracking-tight transition-colors duration-200 active:scale-[0.99]"
                    >
                      <span>Ver todas las notificaciones</span>
                      <ArrowRight
                        size={14}
                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                      />
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
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
