import { ArrowUpRight } from 'lucide-react'

const PILLARS = [
  {
    n: '01',
    title: 'Proyectos de Vinculación',
    desc: 'Formulación, revisión, aprobación y ejecución integral del ciclo de vida de los proyectos académicos con la sociedad.',
  },
  {
    n: '02',
    title: 'Convenios Institucionales',
    desc: 'Gestión de convenios marco, específicos y de cooperación con instituciones públicas y privadas, con seguimiento de compromisos.',
  },
  {
    n: '03',
    title: 'Seguimiento y Evidencias',
    desc: 'Registro estructurado de avances, evidencias documentales e informes técnicos durante toda la ejecución del proyecto.',
  },
  {
    n: '04',
    title: 'Reportes y KPIs',
    desc: 'Tableros institucionales con indicadores clave, métricas de progreso y reportes filtrados por carrera, tipo o estado.',
  },
]

export default function Pillars() {
  return (
    <section id="proyectos" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-16 mb-24">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-10 bg-ink" />
              <span className="text-[11px] uppercase tracking-[0.24em] text-ink-muted">
                Pilares de acción
              </span>
            </div>
            <h2 className="font-display text-4xl lg:text-6xl leading-[1.02] tracking-tightest text-ink">
              Cuatro ejes que articulan la vinculación universitaria.
            </h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 flex items-end">
            <p className="text-lg leading-relaxed text-ink-muted">
              Cada módulo del sistema está diseñado para acompañar a docentes, estudiantes y
              coordinadores en cada etapa del proceso, garantizando trazabilidad, transparencia
              y rigor académico.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-t border-line">
          {PILLARS.map((p) => (
            <div
              key={p.n}
              className="group relative border-b border-r border-line last:border-r-0 sm:[&:nth-child(2)]:border-r-0 lg:[&:nth-child(2)]:border-r lg:[&:nth-child(3)]:border-r p-10 lg:p-12 hover:bg-ink hover:text-white transition-colors duration-500 ease-editorial"
            >
              <div className="flex items-start justify-between mb-12">
                <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted group-hover:text-white/60 transition-colors duration-500">
                  {p.n}
                </span>
                <ArrowUpRight
                  size={18}
                  className="text-ink-muted group-hover:text-white transition-all duration-500 group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </div>
              <h3 className="font-display text-2xl lg:text-3xl leading-tight tracking-tight">
                {p.title}
              </h3>
              <p className="mt-6 text-sm leading-relaxed text-ink-muted group-hover:text-white/70 transition-colors duration-500">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
