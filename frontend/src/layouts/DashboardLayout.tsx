import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import Sidebar from './Sidebar'

export default function DashboardLayout() {
  const { sidebarOpen, toggleSidebar } = useUiStore()

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar open={sidebarOpen} />
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center px-4 shadow-sm">
          <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-100">
            <Menu size={20} />
          </button>
          <h1 className="ml-4 text-lg font-semibold text-gray-800">
            Sistema de Vinculacion UNL
          </h1>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
