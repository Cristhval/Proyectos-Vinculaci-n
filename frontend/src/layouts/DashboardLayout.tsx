import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import Sidebar from './Sidebar'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { ROL_LABELS } from '@/lib/constants'

export default function DashboardLayout() {
  const { sidebarOpen, toggleSidebar } = useUiStore()
  const user = useAuthStore((state) => state.user)

  return (
    <div className="min-h-screen flex bg-bg-soft">
      <Sidebar open={sidebarOpen} />
      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-white border-b border-line flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} className="p-1.5 hover:bg-bg-soft transition-colors">
              <Menu size={18} className="text-ink-muted" />
            </button>
            <h1 className="text-sm font-medium text-ink">
              Sistema de Vinculación UNL
            </h1>
          </div>
          {user && (
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium text-ink">{user.user.first_name} {user.user.last_name}</span>
              <span className="px-2 py-0.5 bg-bg-muted text-ink-muted text-xs font-medium">
                {ROL_LABELS[user.rol] || user.rol}
              </span>
            </div>
          )}
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Breadcrumb />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
