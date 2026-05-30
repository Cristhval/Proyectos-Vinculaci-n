import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer id="contacto" className="relative bg-ink text-white">
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-10">
        <div className="grid lg:grid-cols-4 gap-10 pb-14 border-b border-white/10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-btn bg-white text-ink text-xs font-semibold">
                U
              </div>
              <span className="text-sm font-semibold">Vinculación UNL</span>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-white/50 max-w-sm">
              Coordinación de Vinculación con la Sociedad. Plataforma para la gestión integral
              de proyectos, convenios y actividades académicas con impacto social.
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-5">
              Sistema
            </div>
            <ul className="space-y-3 text-sm">
              <li><a href="#inicio" className="text-white/60 hover:text-white transition-colors duration-200">Inicio</a></li>
              <li><a href="#proyectos" className="text-white/60 hover:text-white transition-colors duration-200">Proyectos</a></li>
              <li><a href="#convenios" className="text-white/60 hover:text-white transition-colors duration-200">Convenios</a></li>
              <li><Link to="/login" className="text-white/60 hover:text-white transition-colors duration-200">Acceder</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-5">
              Contacto
            </div>
            <ul className="space-y-3 text-sm text-white/60">
              <li>vinculacion@unl.edu.ec</li>
              <li>+593 (07) 254-7252</li>
              <li>Av. Pío Jaramillo Alvarado, Loja</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 text-xs text-white/30">
          <span>© 2026 Universidad Nacional de Loja</span>
          <span>Sistema de Vinculación con la Sociedad · v1.0</span>
        </div>
      </div>
    </footer>
  )
}
