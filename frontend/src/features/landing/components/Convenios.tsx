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
    <section id="convenios" className="relative bg-ink py-24 text-white md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-naranja">Convenios interinstitucionales</p>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-white">
              Alianzas que construyen impacto.
            </h2>
          </div>
          <p className="text-base leading-relaxed text-slate-400 max-w-md">
            La UNL mantiene vínculos formales con instituciones públicas, privadas y
            organismos de cooperación que potencian el alcance de sus proyectos.
          </p>
        </div>

        <div className="grid overflow-hidden rounded-xl border border-white/10 sm:grid-cols-2">
          {CONVENIOS.map((c, i) => (
            <div
              key={i}
              className="group relative flex items-center justify-between gap-6 py-5 px-6 transition-all duration-300 cursor-default"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                borderRight: i % 2 === 0 ? '1px solid rgba(255,255,255,0.08)' : undefined,
              }}
            >
              <div className="absolute left-0 top-0 w-1 bg-naranja rounded-r scale-y-0 transition-transform duration-300 group-hover:scale-y-100 origin-top" />
              <div className="flex items-center gap-4 min-w-0 relative z-10 transition-all duration-300 group-hover:translate-x-2">
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/[0.06] text-slate-300 ring-1 ring-white/10 transition-all duration-300 group-hover:ring-naranja/60">
                  <Building2 size={18} className="transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white block">
                    {c.name}
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5 block">
                    {c.type}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 relative z-10 transition-all duration-300 group-hover:-translate-x-1">
                <span className="text-xs text-slate-500 font-medium tabular-nums transition-colors duration-300 group-hover:text-naranja">
                  {c.year}
                </span>
                <div className="relative w-4 h-4 flex items-center justify-center">
                  <ArrowUpRight size={14} className="text-slate-500 transition-all duration-300 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
              <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
