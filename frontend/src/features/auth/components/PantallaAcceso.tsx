import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PanelRoles from './PanelRoles'

interface Props {
  titulo: string
  subtitulo: string
  volver?: { to: string; texto: string }
  children: ReactNode
  pie?: ReactNode
}

/** Estructura común de login, recuperación y restablecimiento. */
export default function PantallaAcceso({ titulo, subtitulo, volver = { to: '/', texto: 'Volver al inicio' }, children, pie }: Props) {
  return (
    <div className="min-h-screen w-full bg-white">
      <div className="flex min-h-screen">
        <PanelRoles />
        <main className="relative flex flex-1 flex-col">
          <div className="px-6 py-6 sm:px-8">
            <Link to={volver.to} className="inline-flex items-center gap-2 rounded text-xs text-ink transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
              <ArrowLeft size={14} aria-hidden="true" />
              {volver.texto}
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center px-6 pb-16 sm:px-8">
            <div className="w-full max-w-sm">
              <h2 className="text-2xl font-bold tracking-tight text-ink">{titulo}</h2>
              <p className="mt-2 text-sm text-ink-muted">{subtitulo}</p>
              <div className="mt-8">{children}</div>
              {pie && <div className="mt-10 border-t border-line pt-6">{pie}</div>}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
