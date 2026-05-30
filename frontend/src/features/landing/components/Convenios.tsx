import { Building2 } from 'lucide-react'

const CONVENIOS = [
  { name: 'Ministerio de Educación', type: 'Marco', year: '2024', color: 'bg-amber-50 text-amber-600' },
  { name: 'Gobierno Provincial de Loja', type: 'Cooperación', year: '2024', color: 'bg-emerald-50 text-emerald-600' },
  { name: 'GAD Municipal de Loja', type: 'Específico', year: '2025', color: 'bg-indigo-50 text-indigo-600' },
  { name: 'INIAP', type: 'Investigación', year: '2025', color: 'bg-rose-50 text-rose-600' },
  { name: 'Cámara de Comercio de Loja', type: 'Cooperación', year: '2025', color: 'bg-amber-50 text-amber-600' },
  { name: 'Hospital Isidro Ayora', type: 'Específico', year: '2026', color: 'bg-emerald-50 text-emerald-600' },
]

export default function Convenios() {
  return (
    <section id="convenios" className="relative py-28 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">
          <div className="max-w-xl">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Convenios interinstitucionales
            </span>
            <h2 className="mt-4 text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-ink">
              Alianzas que construyen impacto.
            </h2>
          </div>
          <p className="text-base leading-relaxed text-ink-muted max-w-md">
            La UNL mantiene vínculos formales con instituciones públicas, privadas y
            organismos de cooperación que potencian el alcance de sus proyectos.
          </p>
        </div>

        <div className="space-y-3">
          {CONVENIOS.map((c, i) => (
            <div
              key={i}
              className="group flex items-center justify-between gap-6 py-5 px-6 bg-white rounded-card shadow-card card-hover cursor-default"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${c.color}`}>
                  <Building2 size={18} className="icon-hover" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-ink block">
                    {c.name}
                  </span>
                  <span className="text-xs text-ink-muted mt-0.5">
                    {c.type}
                  </span>
                </div>
              </div>
              <span className="text-xs text-ink-light font-medium tabular-nums shrink-0">
                {c.year}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
