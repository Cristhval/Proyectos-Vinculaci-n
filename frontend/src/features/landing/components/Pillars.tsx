import { ArrowUpRight, Lightbulb, Handshake, ClipboardCheck, TrendingUp } from 'lucide-react'

const PILLARS = [
  {
    n: '01',
    title: 'Proyectos de vinculación',
    desc: 'Formulación, revisión, aprobación y ejecución integral del ciclo de vida de los proyectos académicos con la sociedad.',
    icon: Lightbulb,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    n: '02',
    title: 'Convenios institucionales',
    desc: 'Gestión de convenios marco, específicos y de cooperación con instituciones públicas y privadas.',
    icon: Handshake,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    n: '03',
    title: 'Seguimiento y evidencias',
    desc: 'Registro estructurado de avances, evidencias documentales e informes técnicos durante toda la ejecución.',
    icon: ClipboardCheck,
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    n: '04',
    title: 'Reportes y KPIs',
    desc: 'Tableros institucionales con indicadores clave, métricas de progreso y reportes filtrados.',
    icon: TrendingUp,
    color: 'bg-rose-50 text-rose-600',
  },
]

export default function Pillars() {
  return (
    <section id="proyectos" className="relative py-28 bg-bg-soft">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Pilares de acción
            </span>
            <h2 className="mt-4 text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-ink">
              Cuatro ejes que articulan la vinculación universitaria.
            </h2>
          </div>
          <div className="flex items-end">
            <p className="text-base leading-relaxed text-ink-muted">
              Cada módulo del sistema está diseñado para acompañar a docentes, estudiantes y
              coordinadores en cada etapa del proceso, garantizando trazabilidad y transparencia.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PILLARS.map((p) => (
            <div
              key={p.n}
              className="group card-hover p-6 bg-white rounded-card shadow-card cursor-default"
            >
              <div className="flex items-start justify-between mb-5">
                <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${p.color}`}>
                  <p.icon size={20} className="icon-hover" />
                </div>
                <span className="text-xs text-ink-light font-medium">
                  {p.n}
                </span>
              </div>
              <h3 className="text-sm font-semibold leading-tight text-ink mb-2.5">
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-muted">
                {p.desc}
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-ink-muted opacity-0 group-hover:opacity-100 transition-all duration-200">
                <span>Ver más</span>
                <ArrowUpRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
