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
  { label: 'Proyectos activos', accent: '#D97706', bg: 'bg-amber-50', text: 'text-amber-600', icon: FolderKanban },
  { label: 'Convenios vigentes', accent: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: Handshake },
  { label: 'Estudiantes vinculados', accent: '#4F46E5', bg: 'bg-indigo-50', text: 'text-indigo-600', icon: GraduationCap },
  { label: 'Carreras participantes', accent: '#E11D48', bg: 'bg-rose-50', text: 'text-rose-600', icon: Layers },
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
    <section id="inicio" className="relative pt-28 pb-24 overflow-hidden bg-bg-soft">
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-24">
          {STAT_META.map((meta, i) => (
            <div
              key={meta.label}
              className="group relative overflow-hidden py-5 px-6 rounded-none neu-card bg-bg-soft"
            >
              <div className={`flex items-center justify-center w-10 h-10 mb-4 rounded-xl ${meta.bg} ${meta.text} transition-transform duration-300 group-hover:scale-110`}>
                <meta.icon size={20} strokeWidth={2} />
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold tracking-tight text-slate-900 transition-transform duration-300 group-hover:-translate-y-0.5">
                  {values[i]}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div
                  className="h-px w-4 transition-all duration-300 group-hover:w-8"
                  style={{ backgroundColor: meta.accent, opacity: 0.6 }}
                />
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  {meta.label}
                </span>
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 transition-transform duration-300 group-hover:scale-x-100 origin-left"
                style={{ backgroundColor: meta.accent }}
              />
            </div>
          ))}
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
              className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-8 py-6"
            >
              <span className="shrink-0 sm:w-10 text-xs font-semibold text-ink-light tabular-nums">
                {pad(i + 1)}
              </span>
              <h3 className="shrink-0 sm:w-56 text-base font-semibold text-ink">
                {f.title}
              </h3>
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
