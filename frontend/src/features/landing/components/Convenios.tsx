import { Building2, ArrowUpRight } from 'lucide-react'

const CONVENIOS = [
  { name: 'Ministerio de Educación', type: 'Marco', year: '2024' },
  { name: 'Gobierno Provincial de Loja', type: 'Cooperación', year: '2024' },
  { name: 'GAD Municipal de Loja', type: 'Específico', year: '2025' },
  { name: 'INIAP', type: 'Investigación', year: '2025' },
  { name: 'Cámara de Comercio de Loja', type: 'Cooperación', year: '2025' },
  { name: 'Hospital Isidro Ayora', type: 'Específico', year: '2026' },
  { name: 'Policía Nacional - Distrito Loja', type: 'Cooperación', year: '2025' },
  { name: 'Fundación Cultural Loja', type: 'Convenio', year: '2024' },
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

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {CONVENIOS.map((c, i) => (
            <div
              key={i}
              className="group relative flex items-center justify-between gap-6 py-5 px-6 transition-all duration-300 cursor-default"
              style={{
                borderBottom: i < CONVENIOS.length - 1 ? '1px solid #E2E8F0' : undefined,
              }}
            >
              <div className="absolute left-0 top-0 w-1 bg-gradient-to-b from-slate-400 to-slate-600 rounded-r scale-y-0 transition-transform duration-300 group-hover:scale-y-100 origin-top" />
              <div className="flex items-center gap-4 min-w-0 relative z-10 transition-all duration-300 group-hover:translate-x-2">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 transition-all duration-300 group-hover:ring-slate-400 group-hover:ring-2 group-hover:shadow-[0_0_20px_rgba(0,0,0,0.06)]">
                  <Building2 size={18} className="transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-900 block transition-colors duration-300 group-hover:text-slate-950">
                    {c.name}
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5 block transition-all duration-300 group-hover:text-slate-600">
                    {c.type}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 relative z-10 transition-all duration-300 group-hover:-translate-x-1">
                <span className="text-xs text-slate-300 font-medium tabular-nums transition-all duration-300 group-hover:text-slate-500">
                  {c.year}
                </span>
                <div className="relative w-4 h-4 flex items-center justify-center">
                  <ArrowUpRight size={14} className="text-slate-300 transition-all duration-300 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
              <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-slate-400/50 to-transparent scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
