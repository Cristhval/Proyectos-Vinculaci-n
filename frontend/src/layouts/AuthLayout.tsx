import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-soft">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
