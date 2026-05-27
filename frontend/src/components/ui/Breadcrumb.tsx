import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { BREADCRUMBS } from '@/routes/routes'

export default function Breadcrumb() {
  const { pathname } = useLocation()
  const items = BREADCRUMBS[pathname]

  if (!items) return null

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} />}
          {item.path ? (
            <Link to={item.path} className="hover:text-primary-600 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-800 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
