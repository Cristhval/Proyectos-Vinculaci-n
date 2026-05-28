import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer id="contacto" className="relative bg-ink text-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-24 pb-12">
        <div className="grid lg:grid-cols-12 gap-12 pb-20 border-b border-white/10">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-white text-ink text-sm font-semibold tracking-wider">
                UNL
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/60">
                  Universidad Nacional
                </span>
                <span className="text-sm font-semibold tracking-tight">de Loja</span>
              </div>
            </div>
            <p className="mt-8 text-sm leading-relaxed text-white/70 max-w-md">
              Coordinación de Vinculación con la Sociedad. Plataforma para la gestión integral
              de proyectos, convenios y actividades académicas con impacto social.
            </p>
          </div>

          <div className="lg:col-span-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-6">
              Sistema
            </div>
            <ul className="space-y-3 text-sm">
              <li><a href="#inicio" className="text-white/80 hover:text-white transition-colors">Inicio</a></li>
              <li><a href="#proyectos" className="text-white/80 hover:text-white transition-colors">Proyectos</a></li>
              <li><a href="#convenios" className="text-white/80 hover:text-white transition-colors">Convenios</a></li>
              <li><Link to="/login" className="text-white/80 hover:text-white transition-colors">Acceder</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-6">
              Recursos
            </div>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-white/80 hover:text-white transition-colors">Reglamento</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition-colors">Documentación</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition-colors">Reportes</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition-colors">Soporte</a></li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-6">
              Contacto
            </div>
            <ul className="space-y-3 text-sm text-white/80">
              <li>vinculacion@unl.edu.ec</li>
              <li>+593 (07) 254-7252</li>
              <li>Av. Pío Jaramillo Alvarado<br />Loja, Ecuador</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-10 text-[11px] uppercase tracking-[0.18em] text-white/40">
          <span>© 2026 Universidad Nacional de Loja</span>
          <span>Sistema de Vinculación con la Sociedad · v 1.0</span>
        </div>
      </div>
    </footer>
  )
}
