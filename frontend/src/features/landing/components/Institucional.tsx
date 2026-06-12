import { Target, Eye, MapPin, ShieldCheck } from 'lucide-react'

const ITEMS = [
  {
    term: 'Misión',
    desc: 'Articular la docencia y la investigación con la realidad social mediante proyectos pertinentes y de alto impacto.',
    icon: Target,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    term: 'Visión',
    desc: 'Ser referente regional en gestión transparente y eficiente de la vinculación universitaria con la sociedad.',
    icon: Eye,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    term: 'Alcance',
    desc: 'Cubre todo el ciclo de vida del proyecto: formulación, revisión, aprobación, ejecución, seguimiento y cierre.',
    icon: MapPin,
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    term: 'Auditoría',
    desc: 'Cada acción del sistema queda registrada para garantizar trazabilidad y cumplimiento normativo.',
    icon: ShieldCheck,
    color: 'bg-rose-50 text-rose-600',
  },
]

export default function Institucional() {
  return (
    <section className="relative py-28 bg-bg-soft">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Información institucional
            </span>
            <h2 className="mt-4 text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-ink">
              Una plataforma centralizada para la gestión académica.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-muted">
              El sistema consolida la información de proyectos, convenios y seguimiento en un
              solo entorno digital, accesible según el rol de cada usuario.
            </p>
          </div>

          <div className="space-y-4">
            {ITEMS.map((item) => (
              <div
                key={item.term}
                className="group relative overflow-hidden card-hover p-6 bg-white rounded-card shadow-card cursor-default"
              >
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-current scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" style={{ color: item.color.includes('amber') ? '#D97706' : item.color.includes('emerald') ? '#059669' : item.color.includes('indigo') ? '#4F46E5' : '#E11D48' }} />
                <div className="flex items-start gap-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${item.color} shrink-0`}>
                    <item.icon size={18} className="icon-hover" />
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                      {item.term}
                    </dt>
                    <dd className="text-sm leading-relaxed text-ink">
                      {item.desc}
                    </dd>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
