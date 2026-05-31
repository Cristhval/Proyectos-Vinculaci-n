import { Link } from 'react-router-dom'
import { ArrowUpRight, FolderKanban, ShieldCheck, BarChart3, Users, Handshake, FileText } from 'lucide-react'

const FEATURES = [
  {
    icon: FolderKanban,
    title: 'Gestión integral',
    desc: 'Administra el ciclo completo de proyectos de vinculación, desde la formulación hasta el cierre.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: ShieldCheck,
    title: 'Trazabilidad total',
    desc: 'Cada acción queda registrada con auditoría completa, garantizando transparencia institucional.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: BarChart3,
    title: 'Reportes y KPIs',
    desc: 'Dashboards en tiempo real con indicadores clave para la toma de decisiones.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: Users,
    title: 'Participantes',
    desc: 'Gestiona docentes, estudiantes y coordinadores en cada proyecto de forma organizada.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: Handshake,
    title: 'Convenios',
    desc: 'Vinculación con instituciones públicas y privadas para ampliar el impacto académico.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: FileText,
    title: 'Documentación',
    desc: 'Evidencias, informes y documentos estructurados para cada etapa del proyecto.',
    color: 'bg-indigo-50 text-indigo-600',
  },
]

export default function Hero() {
  return (
    <section id="inicio" className="relative pt-28 pb-24 overflow-hidden bg-white">
      <div className="relative mx-auto max-w-6xl px-6 w-full">
        <div className="max-w-3xl mb-24">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-ink">
            Vinculación
            <br />
            <span className="text-ink-muted font-normal">con la sociedad.</span>
          </h1>

          <p className="mt-7 text-lg leading-relaxed text-ink-muted max-w-xl">
            La Universidad Nacional de Loja impulsa proyectos, convenios y acciones académicas
            que fortalecen el desarrollo social mediante innovación e investigación.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-start gap-3">
            <a
              href="#proyectos"
              className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-ink text-white rounded-btn btn-glow"
            >
              Explorar proyectos
              <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-bg-soft text-ink rounded-btn border border-line hover:bg-bg-muted transition-colors duration-200"
            >
              Acceder al sistema
              <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24">
          {[
            { value: '180+', label: 'Proyectos activos', color: 'border-amber-400' },
            { value: '64', label: 'Convenios vigentes', color: 'border-emerald-400' },
            { value: '2.4K', label: 'Estudiantes vinculados', color: 'border-indigo-400' },
            { value: '12', label: 'Carreras participantes', color: 'border-rose-400' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.color} border-l-[3px] p-6 bg-white rounded-card shadow-card`}
            >
              <div className="text-3xl font-bold text-ink tracking-tight">
                {stat.value}
              </div>
              <div className="mt-1.5 text-sm text-ink-muted">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-10">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
            Módulos del sistema
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group card-hover p-6 bg-white rounded-card shadow-card cursor-default"
            >
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${f.color} mb-4`}>
                <f.icon size={22} className="icon-hover" />
              </div>
              <div className="text-base font-semibold text-ink mb-2">
                {f.title}
              </div>
              <p className="text-sm leading-relaxed text-ink-muted">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
