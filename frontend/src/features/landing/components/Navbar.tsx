import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'

const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Proyectos', href: '#proyectos' },
  { label: 'Convenios', href: '#convenios' },
  { label: 'Contacto', href: '#contacto' },
]

function getHash() {
  return window.location.hash || '#inicio'
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [activeHash, setActiveHash] = useState(getHash)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onHashChange = () => setActiveHash(getHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.querySelector(l.href)).filter(Boolean) as Element[]
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) {
          const id = visible.target.getAttribute('id')
          if (id) setActiveHash(`#${id}`)
        }
      },
      { threshold: [0.25, 0.5, 0.75], rootMargin: '-64px 0px -40% 0px' }
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300 bg-bg-soft',
        scrolled ? 'neu-header backdrop-blur-xl' : '',
      )}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-btn neu-btn-dark bg-ink text-white text-xs font-semibold">
              U
            </div>
            <span className="text-sm font-semibold text-ink tracking-tight">
              Vinculación UNL
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = activeHash === link.href
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    'relative px-3.5 py-2 text-sm font-medium transition-colors duration-200 group',
                    isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
                  )}
                >
                  {link.label}
                  <span
                    className={clsx(
                      'absolute bottom-1 left-3.5 right-3.5 h-0.5 bg-emerald-600 transition-transform duration-200 origin-left',
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    )}
                  />
                </a>
              )
            })}
          </nav>

          <Link
            to="/login"
            className="inline-flex items-center px-5 py-2 text-sm font-medium rounded-btn neu-btn-dark bg-ink text-white"
          >
            Acceder
          </Link>
        </div>
      </div>
    </header>
  )
}
