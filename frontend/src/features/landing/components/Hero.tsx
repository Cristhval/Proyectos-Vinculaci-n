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
        d.proyectos_activos > 0 ? `${d.proyectos_activos}+` : "0",
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
              <span className="block text-naranja">
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

        {/* Indicadores: el valor es lo protagonista; ícono y etiqueta lo acompañan. */}
        <div className="mb-24 overflow-hidden rounded-2xl bg-ink shadow-lg shadow-ink/10">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 md:px-8">
            <span className="text-sm font-semibold text-white">Nuestro impacto</span>
            <span className="hidden text-xs text-white/50 sm:inline">Datos en tiempo real del sistema</span>
          </div>
          <div className="grid grid-cols-2 divide-white/10 md:grid-cols-4 md:divide-x">
            {STAT_META.map((meta, i) => (
              <div
                key={meta.label}
                className={`group relative flex flex-col gap-8 p-6 transition-colors duration-300 hover:bg-white/[0.04] md:p-8 ${i < 2 ? 'border-b border-white/10 md:border-b-0' : ''} ${i % 2 === 0 ? 'border-r border-white/10 md:border-r-0' : ''}`}
              >
                <span className="flex items-center gap-2 text-[13px] font-medium text-slate-400">
                  <meta.icon size={16} strokeWidth={1.75} className="text-naranja" />
                  {meta.label}
                </span>
                <div>
                  <span className="block text-5xl font-bold tracking-tight text-white tabular-nums md:text-6xl">
                    {values[i]}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 origin-left scale-x-0 bg-naranja transition-transform duration-300 group-hover:scale-x-100" />
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
              <span className="shrink-0 sm:w-10 text-xs font-bold text-naranja tabular-nums">
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
