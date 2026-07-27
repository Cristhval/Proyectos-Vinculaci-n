import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, FolderKanban, Handshake, GraduationCap, Layers } from 'lucide-react'
import { reportesApi } from '@/api/reportes'

function formatNumber(n: number): string {
  if (n >= 1000) {
    const k = n / 1000
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`
  }
  return String(n)
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

const STAT_META = [
  { label: 'Proyectos activos', icon: FolderKanban },
  { label: 'Convenios vigentes', icon: Handshake },
  { label: 'Estudiantes vinculados', icon: GraduationCap },
  { label: 'Carreras participantes', icon: Layers },
]

const FEATURES = [
  {
    title: 'Gestión de proyectos',
    desc: 'Formulación, aprobación, ejecución y cierre de cada proyecto de vinculación en un solo flujo de trabajo.',
  },
  {
    title: 'Convenios institucionales',
    desc: 'Convenios marco y específicos con instituciones públicas y privadas, con vigencia y renovación controladas.',
  },
  {
    title: 'Seguimiento y evidencias',
    desc: 'Actas, informes y documentos de respaldo organizados por proyecto y por etapa.',
  },
  {
    title: 'Equipos y participantes',
    desc: 'Docentes, estudiantes y coordinadores asignados según su rol en cada iniciativa.',
  },
  {
    title: 'Reportes institucionales',
    desc: 'Indicadores de avance para autoridades, coordinación académica y organismos de control.',
  },
  {
    title: 'Auditoría y trazabilidad',
    desc: 'Historial de cambios con responsable, fecha y estado en cada etapa del proceso.',
  },
]


export default function Hero() {
  const [values, setValues] = useState(['...', '...', '...', '...'])
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    reportesApi.estadisticasPublicas().then(({ data: res }) => {
      const d = res.data
      setValues([
        `${d.proyectos_activos}+`,
        formatNumber(d.convenios_vigentes),
        formatNumber(d.estudiantes_vinculados),
        formatNumber(d.carreras_participantes),
      ])
    }).catch(() => {})
  }, [])
  return (
    <section id="inicio" className="relative pt-28 pb-12 bg-bg-soft">
      <div className="relative mx-auto max-w-6xl px-6 w-full">
        <div className="max-w-3xl mb-24">
          <div
            className="group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
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
              <span className="block text-blue-600">
                {"con la sociedad.".split("").map((char, index) => (
                  <span
                    key={index}
                    className="inline-block"
                    style={{
                      transition: 'transform 0.4s ease',
                      transitionDelay: `${index * 25}ms`,
                      animation: isHovered ? `bounce-single 0.9s ease-out ${index * 60}ms` : 'none',
                    }}
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

          <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
            <a
              href="#proyectos"
              className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-ink text-white rounded-btn neu-btn-dark"
            >
              Explorar proyectos
              <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-bg-soft text-ink rounded-btn neu-btn"
            >
              Acceder al sistema
              <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x-0 md:divide-x divide-y md:divide-y-0 divide-slate-200">
            {STAT_META.map((meta, i) => (
              <div
                key={meta.label}
                className="group relative overflow-hidden p-6 bg-white flex flex-col justify-between h-full transition-all duration-300 hover:bg-slate-50"
              >
                <div>
                  <div className="flex items-center justify-center w-10 h-10 mb-4 rounded-xl bg-blue-50 text-blue-600 transition-transform duration-300 group-hover:scale-110">
                    <meta.icon size={20} strokeWidth={2} />
                  </div>
                </div>
                <div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 transition-transform duration-300 group-hover:-translate-y-0.5">
                        {values[i]}
                      </span>
                    </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-0.5 w-8 scale-x-50 transition-transform duration-300 group-hover:scale-x-100 shrink-0 bg-blue-300 rounded-full origin-left" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      {meta.label}
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 scale-x-0 transition-transform duration-300 group-hover:scale-x-100 origin-left" />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-10 max-w-xl">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
            Módulos del sistema
          </span>
          <h2 className="mt-3 text-2xl md:text-3xl font-bold text-ink tracking-tight">
            Todo el proceso de vinculación, en un solo lugar.
          </h2>
        </div>

        <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-8 py-5 px-4 -mx-4 rounded-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:bg-white hover:scale-[1.01] cursor-default"
            >
              <span className="shrink-0 sm:w-10 text-xs font-bold text-blue-600 tabular-nums">
                {pad(i + 1)}
              </span>
              <h3 className="shrink-0 sm:w-56 text-base font-semibold text-slate-900">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
