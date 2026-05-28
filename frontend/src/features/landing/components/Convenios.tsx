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
    <section id="convenios" className="relative bg-bg-soft border-y border-line py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 mb-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-10 bg-ink" />
              <span className="text-[11px] uppercase tracking-[0.24em] text-ink-muted">
                Convenios interinstitucionales
              </span>
            </div>
            <h2 className="font-display text-4xl lg:text-6xl leading-[1.02] tracking-tightest text-ink">
              Alianzas que <span className="italic font-normal">construyen</span> impacto.
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-ink-muted max-w-md">
            La UNL mantiene vínculos formales con instituciones públicas, privadas y
            organismos de cooperación que potencian el alcance de sus proyectos.
          </p>
        </div>

        <div className="border-t border-line">
          {CONVENIOS.map((c, i) => (
            <div
              key={i}
              className="group flex items-center justify-between gap-6 border-b border-line py-8 hover:px-4 transition-all duration-500 ease-editorial cursor-default"
            >
              <div className="flex items-center gap-8 min-w-0">
                <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted shrink-0 w-8">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-display text-xl lg:text-2xl text-ink truncate">
                  {c.name}
                </span>
              </div>
              <div className="flex items-center gap-10 shrink-0">
                <span className="hidden sm:block text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                  {c.type}
                </span>
                <span className="text-[11px] uppercase tracking-[0.18em] text-ink-muted tabular-nums">
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
