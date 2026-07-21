const CONVENIOS = [
  { name: 'Ministerio de Educación', type: 'Marco', year: '2024' },
  { name: 'Gobierno Provincial de Loja', type: 'Cooperación', year: '2024' },
  { name: 'GAD Municipal de Loja', type: 'Específico', year: '2025' },
  { name: 'INIAP', type: 'Investigación', year: '2025' },
  { name: 'Cámara de Comercio de Loja', type: 'Cooperación', year: '2025' },
  { name: 'Hospital Isidro Ayora', type: 'Específico', year: '2026' },
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

        <div className="border-t border-slate-200">
          {CONVENIOS.map((c, i) => (
            <div
              key={c.name}
              className="group flex items-center justify-between gap-6 py-5 border-b border-slate-200 px-2 -mx-2 transition-colors duration-200 hover:bg-slate-50"
            >
              <div className="flex items-baseline gap-4 min-w-0">
                <span className="text-xs text-ink-light font-medium tabular-nums shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-sm font-semibold text-ink truncate">
                  {c.name}
                </span>
              </div>
              <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                <span className="hidden sm:inline-block text-2xs px-2.5 py-1 border border-line text-ink-muted font-semibold uppercase tracking-wider">
                  {c.type}
                </span>
                <span className="text-xs text-ink-light font-medium tabular-nums">
                  {c.year}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
