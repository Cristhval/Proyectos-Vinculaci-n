import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, FolderKanban, ShieldCheck, BarChart3, Users, Handshake, FileText } from 'lucide-react'
import { reportesApi } from '@/api/reportes'

function formatNumber(n: number): string {
  if (n >= 1000) {
    const k = n / 1000
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`
  }
  return String(n)
}

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
  const [stats, setStats] = useState([
    { value: '...', label: 'Proyectos activos', accent: '#D97706' },
    { value: '...', label: 'Convenios vigentes', accent: '#059669' },
    { value: '...', label: 'Estudiantes vinculados', accent: '#4F46E5' },
    { value: '...', label: 'Carreras participantes', accent: '#E11D48' },
  ])

  useEffect(() => {
    reportesApi.estadisticasPublicas().then(({ data: res }) => {
      const d = res.data
      setStats([
        { value: `${d.proyectos_activos}+`, label: 'Proyectos activos', accent: '#D97706' },
        { value: formatNumber(d.convenios_vigentes), label: 'Convenios vigentes', accent: '#059669' },
        { value: formatNumber(d.estudiantes_vinculados), label: 'Estudiantes vinculados', accent: '#4F46E5' },
        { value: formatNumber(d.carreras_participantes), label: 'Carreras participantes', accent: '#E11D48' },
      ])
    }).catch(() => {})
  }, [])
  return (
    <section id="inicio" className="relative pt-28 pb-24 overflow-hidden bg-white">
      <div className="relative mx-auto max-w-6xl px-6 w-full">
        <div className="max-w-3xl mb-24">
          <div className="group">
            <h1 className="text-7xl md:text-8xl font-bold tracking-[-4px] leading-[0.95] text-slate-900">
              <span className="block">
                {"Vinculación".split("").map((char, index) => (
                  <span
                    key={index}
                    className="inline-block transition-all duration-500 ease-out group-hover:-translate-y-px"
                    style={{ transitionDelay: `${index * 25}ms` }}
                  >
                    {char}
                  </span>
                ))}
              </span>
              <span className="block text-slate-400">
                {"con la sociedad.".split("").map((char, index) => (
                  <span
                    key={index}
                    className="inline-block transition-all duration-500 ease-out group-hover:text-emerald-600 group-hover:-translate-y-px"
                    style={{ transitionDelay: `${index * 25}ms` }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))}
              </span>
            </h1>
          </div>

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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 mb-24 border-t border-b border-slate-200">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`group relative overflow-hidden py-5 px-6 transition-colors duration-300 hover:bg-slate-50 ${
                index !== 0 ? 'border-l border-slate-200' : ''
              }`}
            >
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold tracking-tight text-slate-900 transition-transform duration-300 group-hover:-translate-y-0.5">
                  {stat.value}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div 
                  className="h-px w-4 transition-all duration-300 group-hover:w-8"
                  style={{ backgroundColor: stat.accent, opacity: 0.6 }}
                />
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  {stat.label}
                </span>
              </div>
              <div 
                className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 transition-transform duration-300 group-hover:scale-x-100 origin-left"
                style={{ backgroundColor: stat.accent }}
              />
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
              <div className="flex items-start justify-between mb-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${f.color}`}>
                  <f.icon size={22} className="icon-hover" />
                </div>
                <ArrowUpRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0" />
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
