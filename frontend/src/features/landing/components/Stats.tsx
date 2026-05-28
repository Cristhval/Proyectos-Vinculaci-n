const STATS = [
  { value: '180+', label: 'Proyectos activos' },
  { value: '64', label: 'Convenios vigentes' },
  { value: '2.4K', label: 'Estudiantes vinculados' },
  { value: '12', label: 'Carreras participantes' },
]

export default function Stats() {
  return (
    <section className="relative bg-bg-soft border-y border-line py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex items-center gap-3 mb-16">
          <span className="h-px w-10 bg-ink" />
          <span className="text-[11px] uppercase tracking-[0.24em] text-ink-muted">
            Indicadores institucionales
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-line border-y border-line">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="px-8 py-12 first:pl-0 last:pr-0 lg:px-10 group"
            >
              <div className="font-display text-5xl lg:text-6xl font-medium text-ink tracking-tightest leading-none">
                {stat.value}
              </div>
              <div className="mt-6 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
