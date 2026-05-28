import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

export default function Hero() {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center pt-32 pb-24 overflow-hidden">
      {/* Subtle institutional pattern */}
      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-white" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10 w-full">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-10">
            <span className="h-px w-10 bg-ink" />
            <span className="text-[11px] uppercase tracking-[0.24em] text-ink-muted">
              Plataforma Institucional / 2026
            </span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-8xl leading-[0.95] tracking-tightest text-ink">
            Vinculación
            <br />
            <span className="italic font-normal">con la sociedad.</span>
          </h1>

          <p className="mt-10 max-w-2xl text-lg leading-relaxed text-ink-muted">
            La Universidad Nacional de Loja impulsa proyectos, convenios y acciones académicas
            que fortalecen el desarrollo social mediante innovación, investigación y
            compromiso institucional.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <a
              href="#proyectos"
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-medium uppercase tracking-wider border border-ink bg-white text-ink hover:bg-ink hover:text-white hover:shadow-elev transition-all duration-300 ease-editorial"
            >
              Explorar Proyectos
              <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <Link
              to="/login"
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-medium uppercase tracking-wider border border-line bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-white transition-all duration-300 ease-editorial"
            >
              Acceder al Sistema
              <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>

        {/* Bottom meta strip */}
        <div className="mt-32 flex flex-wrap items-center justify-between gap-6 pt-10 border-t border-line">
          <div className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            Coordinación de Vinculación · Loja, Ecuador
          </div>
          <div className="flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            <span>v 1.0</span>
            <span>·</span>
            <span>Sistema institucional</span>
          </div>
        </div>
      </div>
    </section>
  )
}
