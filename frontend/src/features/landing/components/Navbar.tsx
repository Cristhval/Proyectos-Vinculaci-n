import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'

const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Proyectos', href: '#proyectos' },
  { label: 'Convenios', href: '#convenios' },
  { label: 'Contacto', href: '#contacto' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-line shadow-xs'
          : 'bg-white',
      )}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-btn bg-ink text-white text-xs font-semibold">
              U
            </div>
            <span className="text-sm font-semibold text-ink tracking-tight">
              Vinculación UNL
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 text-sm font-medium text-ink-muted hover:text-ink rounded-btn transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <Link
            to="/login"
            className="inline-flex items-center px-5 py-2 text-sm font-medium rounded-btn bg-ink text-white btn-glow"
          >
            Acceder
          </Link>
        </div>
      </div>
    </header>
  )
}
