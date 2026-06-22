import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Menu, Bell, ChevronDown, Camera, LogOut, User, CheckCheck, Inbox, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import Sidebar from './Sidebar'
import { alertasApi } from '@/api/seguimiento'
import { formatDateTime } from '@/lib/formatters'
import type { Alerta, PrioridadAlerta } from '@/types/seguimiento'
import type { PaginatedResponse } from '@/types/common'

type NotifFilter = 'PENDIENTE' | 'TODAS'
type TimeGroup = 'HOY' | 'AYER' | 'ESTA_SEMANA' | 'ANTERIOR'

const PRIORIDAD_META: Record<PrioridadAlerta, { bar: string; tag: string; tagText: string; tagBorder: string; dot: string; label: string }> = {
  URGENTE: { bar: 'bg-[#DC2626]', tag: 'bg-[#FEE2E2]', tagText: 'text-[#991B1B]', tagBorder: 'border-[#FECACA]', dot: 'bg-[#DC2626]', label: 'Urgente' },
  ALTA:    { bar: 'bg-[#D97706]', tag: 'bg-[#FEF3C7]', tagText: 'text-[#92400E]', tagBorder: 'border-[#FDE68A]', dot: 'bg-[#D97706]', label: 'Alta'    },
  MEDIA:   { bar: 'bg-[#2563EB]', tag: 'bg-[#DBEAFE]', tagText: 'text-[#1E40AF]', tagBorder: 'border-[#BFDBFE]', dot: 'bg-[#2563EB]', label: 'Media'   },
  BAJA:    { bar: 'bg-[#94A3B8]', tag: 'bg-[#F1F5F9]', tagText: 'text-[#475569]', tagBorder: 'border-line',         dot: 'bg-[#94A3B8]', label: 'Baja'    },
}

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
    if (notifOpen) {
      loadAlertasRecientes()
      setNotifFilter('PENDIENTE')
    }
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
    setContadorPendientes(0)
    setAlertas((prev) => prev.map((x) => ({ ...x, leida: true, estado: 'LEIDA' })))
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

  const totalLeidasVisibles = filteredAlertas.filter((a) => a.leida || a.estado !== 'PENDIENTE').length
  const hasUnreadInList = filteredAlertas.some((a) => !a.leida && a.estado === 'PENDIENTE')

  return (
    <div className="h-screen overflow-hidden flex bg-bg-soft">
      {/* Mobile sidebar overlay */}
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
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white tabular-nums">
                    {contadorPendientes > 99 ? '99+' : contadorPendientes}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] max-w-[420px] bg-white border border-line z-50 overflow-hidden"
                  style={{
                    borderRadius: '4px',
                    boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 12px 32px -8px rgba(15,23,42,0.18), 0 24px 64px -16px rgba(15,23,42,0.10)',
                  }}
                >
                  {/* Header editorial */}
                  <div className="px-5 pt-4 pb-3 border-b border-line">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center justify-center w-7 h-7 bg-emerald-600 text-white" style={{ borderRadius: '4px' }}>
                          <Inbox size={14} strokeWidth={2.25} />
                        </span>
                        <div>
                          <p className="text-[13px] font-semibold text-ink leading-tight tracking-[-0.01em]">
                            Bandeja de entrada
                          </p>
                          <p className="text-[11px] text-ink-muted mt-0.5">
                            {contadorPendientes > 0
                              ? `${contadorPendientes} sin atender · ${alertas.length} en los últimos 30 días`
                              : `Sin pendientes · ${alertas.length} en los últimos 30 días`}
                          </p>
                        </div>
                      </div>
                      {hasUnreadInList && (
                        <button
                          type="button"
                          onClick={handleMarcarTodasLeidas}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
                          style={{ borderRadius: '4px' }}
                          title="Marcar todas como leídas"
                        >
                          <CheckCheck size={12} strokeWidth={2.5} />
                          Marcar leídas
                        </button>
                      )}
                    </div>
                    {/* Tabs filtrados */}
                    <div className="mt-3 inline-flex p-0.5 bg-bg-muted border border-line" style={{ borderRadius: '4px' }}>
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
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-medium transition-colors ${active ? 'bg-white text-ink shadow-sm border border-line' : 'text-ink-muted hover:text-ink border border-transparent'}`}
                            style={{ borderRadius: '3px' }}
                          >
                            {t.label}
                            <span className={`inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 text-[10px] font-semibold tabular-nums ${active ? 'bg-emerald-600 text-white' : 'bg-white text-ink-muted border border-line'}`} style={{ borderRadius: '2px' }}>
                              {t.count}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Lista */}
                  {loadingNotif ? (
                    <div className="px-5 py-12 flex flex-col items-center gap-3">
                      <div className="w-5 h-5 border-[2px] border-line border-t-emerald-600 rounded-full animate-spin" />
                      <p className="text-[11px] text-ink-muted">Cargando bandeja…</p>
                    </div>
                  ) : filteredAlertas.length === 0 ? (
                    <div className="px-5 py-12 flex flex-col items-center text-center">
                      <div className="w-11 h-11 bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3" style={{ borderRadius: '4px' }}>
                        <CheckCircle2 size={20} className="text-emerald-600" strokeWidth={2.25} />
                      </div>
                      <p className="text-[13px] font-semibold text-ink">Bandeja al día</p>
                      <p className="text-[11.5px] text-ink-muted mt-1 max-w-[240px]">
                        {notifFilter === 'PENDIENTE'
                          ? 'No tienes alertas pendientes en este momento.'
                          : 'Sin alertas registradas en los últimos 30 días.'}
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[360px] overflow-y-auto">
                      {TIME_GROUP_ORDER.map((group) => {
                        const items = groupedAlertas[group]
                        if (items.length === 0) return null
                        return (
                          <div key={group}>
                            <div className="sticky top-0 z-10 px-5 py-1.5 bg-bg-soft/95 backdrop-blur-sm border-b border-line">
                              <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-[0.08em]">
                                {TIME_GROUP_LABELS[group]}
                                <span className="ml-1.5 text-ink-light normal-case tracking-normal font-normal">
                                  {items.length}
                                </span>
                              </p>
                            </div>
                            {items.map((a) => {
                              const meta = PRIORIDAD_META[a.prioridad as PrioridadAlerta] ?? PRIORIDAD_META.BAJA
                              const isUnread = !a.leida && a.estado === 'PENDIENTE'
                              return (
                                <button
                                  key={a.id}
                                  type="button"
                                  onClick={() => handleNotifClick(a)}
                                  className="group relative w-full text-left flex items-stretch hover:bg-bg-soft transition-colors"
                                >
                                  {/* Barra lateral de severidad — color del sistema (Buscar) */}
                                  <span className={`w-[3px] flex-shrink-0 bg-ink ${isUnread ? 'opacity-100' : 'opacity-20'}`} />
                                  <div className={`flex-1 min-w-0 px-3 py-2 border-b border-line ${isUnread ? 'bg-white' : 'bg-bg-soft/40'}`}>
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-flex items-center px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.04em] border ${meta.tag} ${meta.tagText} ${meta.tagBorder} flex-shrink-0`} style={{ borderRadius: '2px' }}>
                                        {meta.label}
                                      </span>
                                      {(a.proyecto_codigo || a.convenio_codigo) && (
                                        <span className="inline-flex items-center px-1.5 py-px text-[10px] font-mono font-medium text-ink-muted bg-bg-muted border border-line flex-shrink-0" style={{ borderRadius: '2px' }}>
                                          {a.proyecto_codigo || a.convenio_codigo}
                                        </span>
                                      )}
                                      <p className={`text-[12.5px] leading-tight truncate ${isUnread ? 'font-semibold text-ink' : 'font-medium text-ink-muted'}`}>
                                        {a.mensaje}
                                      </p>
                                      {isUnread && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-[10.5px] text-ink-light mt-0.5 tabular-nums">
                                      {formatRelative(a.creado_en)}
                                    </p>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-5 py-2.5 border-t border-line bg-bg-soft flex items-center justify-between">
                    <p className="text-[10.5px] text-ink-muted">
                      {totalLeidasVisibles > 0
                        ? `${totalLeidasVisibles} ${totalLeidasVisibles === 1 ? 'leída visible' : 'leídas visibles'}`
                        : 'Actualizado en tiempo real'}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setNotifOpen(false); navigate(alertasPath) }}
                      className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Ver historial completo
                      <ArrowUpRight size={12} strokeWidth={2.5} />
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
