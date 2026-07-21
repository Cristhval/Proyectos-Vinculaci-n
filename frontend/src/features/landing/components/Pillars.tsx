const PILLARS = [
  {
    n: '01',
    title: 'Formulación',
    desc: 'El docente presenta la propuesta con objetivos, alcance y presupuesto estimado.',
    color: '#D97706',
  },
  {
    n: '02',
    title: 'Revisión y aprobación',
    desc: 'Coordinación académica valida la propuesta y autoriza su ejecución.',
    color: '#059669',
  },
  {
    n: '03',
    title: 'Ejecución y seguimiento',
    desc: 'Registro de avances, evidencias documentales e informes durante el desarrollo.',
    color: '#4F46E5',
  },
  {
    n: '04',
    title: 'Cierre y reporte',
    desc: 'Informe final, indicadores de impacto y archivo institucional del proyecto.',
    color: '#E11D48',
  },
]

export default function Pillars() {
  return (
    <section id="proyectos" className="relative py-28 bg-bg-soft">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Cómo funciona
            </span>
            <h2 className="mt-4 text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-ink">
              Un proceso claro, de principio a fin.
            </h2>
          </div>
          <div className="flex items-end">
            <p className="text-base leading-relaxed text-ink-muted">
              Cada proyecto de vinculación avanza por cuatro etapas controladas, con
              responsables y evidencias registradas en cada una.
            </p>
          </div>
        </div>

        <div className="relative">
          <div
            className="hidden sm:block absolute top-[13px] left-0 right-0 h-1 rounded-full"
            style={{ background: 'linear-gradient(to right, #D97706, #059669, #4F46E5, #E11D48)', opacity: 0.25 }}
          />
          <div className="grid sm:grid-cols-4 gap-y-8 gap-x-6">
            {PILLARS.map((p) => (
              <div key={p.n} className="relative">
                <div className="relative z-10 flex items-center gap-3 sm:block">
                  <div
                    className="flex items-center justify-center w-7 h-7 shrink-0 rounded-full text-white text-xs font-semibold shadow-sm"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.n}
                  </div>
                  <h3 className="text-sm font-semibold text-ink sm:mt-5">
                    {p.title}
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:pr-4">
                  {p.desc}
                </p>
                <div
                  className="hidden sm:block mt-4 h-0.5 w-8"
                  style={{ backgroundColor: p.color }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
