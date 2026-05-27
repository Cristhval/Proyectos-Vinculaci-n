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
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar open={sidebarOpen} />
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center">
            <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-100">
              <Menu size={20} />
            </button>
            <h1 className="ml-4 text-lg font-semibold text-gray-800">
              Sistema de Vinculacion UNL
            </h1>
          </div>
          {user && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{user.user.first_name} {user.user.last_name}</span>
              <span className="ml-2 px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
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
