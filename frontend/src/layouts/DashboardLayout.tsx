import { useState, useRef, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Bell, ChevronDown, Camera, LogOut, User } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import Sidebar from './Sidebar'
import Breadcrumb from '@/components/ui/Breadcrumb'

interface Notification {
  id: string
  title: string
  time: string
  read: boolean
}

export default function DashboardLayout() {
  const { sidebarOpen, toggleSidebar } = useUiStore()
  const user = useAuthStore((state) => state.user)
  const { logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
                <Bell size={18} className={notifications.length > 0 ? 'text-ink' : 'text-ink-muted'} />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-red-500 text-white text-2xs font-bold rounded-full">
                    {notifications.length > 99 ? '99+' : notifications.length}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-card shadow-lg border border-line z-50 py-2">
                  <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
                    <p className="text-xs font-semibold text-ink">Notificaciones</p>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => setNotifications([])}
                        className="text-2xs text-accent hover:underline"
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell size={28} className="mx-auto text-ink-light mb-2 opacity-40" />
                      <p className="text-sm text-ink-muted">No hay notificaciones</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 hover:bg-bg-soft transition-colors cursor-pointer ${!n.read ? 'bg-accent/5' : ''}`}
                        >
                          <p className="text-sm text-ink">{n.title}</p>
                          <p className="text-2xs text-ink-muted mt-0.5">{n.time}</p>
                        </div>
                      ))}
                    </div>
                  )}
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
          <Breadcrumb />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
