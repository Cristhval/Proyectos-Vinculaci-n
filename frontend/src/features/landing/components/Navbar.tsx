import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'

const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Proyectos', href: '#proyectos' },
  { label: 'Convenios', href: '#convenios' },
  { label: 'Reportes', href: '#reportes' },
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
        'fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-editorial',
        scrolled
          ? 'bg-white/80 backdrop-blur-md border-b border-line'
          : 'bg-transparent border-b border-transparent',
      )}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-ink text-white text-sm font-semibold tracking-wider">
              UNL
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                Universidad Nacional
              </span>
              <span className="text-sm font-semibold tracking-tight text-ink">
                de Loja
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative text-sm text-ink/80 hover:text-ink transition-colors duration-200 group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-ink transition-all duration-300 ease-editorial group-hover:w-full" />
              </a>
            ))}
          </nav>

          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-medium uppercase tracking-wider border border-ink bg-white text-ink hover:bg-ink hover:text-white hover:shadow-elev transition-all duration-300 ease-editorial"
          >
            Acceder
          </Link>
        </div>
      </div>
    </header>
  )
}
