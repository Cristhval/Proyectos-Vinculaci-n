const PILLARS = [
  {
    n: '01',
    title: 'Formulación',
    desc: 'El docente presenta la propuesta con objetivos, alcance y presupuesto estimado.',
    color: '#3B82F6',
  },
  {
    n: '02',
    title: 'Revisión y aprobación',
    desc: 'Coordinación académica valida la propuesta y autoriza su ejecución.',
    color: '#10B981',
  },
  {
    n: '03',
    title: 'Ejecución y seguimiento',
    desc: 'Registro de avances, evidencias documentales e informes durante el desarrollo.',
    color: '#6366F1',
  },
  {
    n: '04',
    title: 'Cierre y reporte',
    desc: 'Informe final, indicadores de impacto y archivo institucional del proyecto.',
    color: '#F59E0B',
  },
]

export default function Pillars() {
  return (
    <section id="proyectos" className="relative pt-8 pb-28 bg-bg-soft">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
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
            className="hidden sm:block absolute top-[18px] left-[18px] right-[18px] h-0.5 rounded-full"
            style={{ background: 'linear-gradient(to right, #3B82F6, #10B981, #6366F1, #F59E0B)', opacity: 0.25 }}
          />
          <div className="grid sm:grid-cols-4 gap-x-6 gap-y-10">
            {PILLARS.map((p) => (
              <div key={p.n} className="group relative">
                <div className="relative z-10 flex flex-col items-start">
                  <div
                    className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full text-white text-sm font-bold shadow-lg transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: p.color,
                      boxShadow: `0 4px 14px ${p.color}40`,
                    }}
                  >
                    {p.n}
                  </div>
                  <div className="mt-4 sm:mt-6 rounded-xl p-4 sm:p-5 w-full bg-white transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5">
                    <h3 className="text-sm font-semibold text-ink">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                      {p.desc}
                    </p>
                    <div
                      className="mt-4 h-0.5 w-6 rounded-full transition-all duration-300 group-hover:w-full"
                      style={{ backgroundColor: p.color, opacity: 0.4 }}
                    />
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
