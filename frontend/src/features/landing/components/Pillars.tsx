/* Las cuatro etapas sí son una secuencia: el número y la línea de avance comunican el orden. */
const PILLARS = [
  {
    n: '01',
    title: 'Formulación',
    desc: 'El docente presenta la propuesta con objetivos, alcance y presupuesto estimado.',
    quien: 'Docente',
  },
  {
    n: '02',
    title: 'Revisión y aprobación',
    desc: 'Coordinación académica valida la propuesta y autoriza su ejecución.',
    quien: 'Coordinación',
  },
  {
    n: '03',
    title: 'Ejecución y seguimiento',
    desc: 'Registro de avances, evidencias documentales e informes durante el desarrollo.',
    quien: 'Docentes y estudiantes',
  },
  {
    n: '04',
    title: 'Cierre y reporte',
    desc: 'Informe final, indicadores de impacto y archivo institucional del proyecto.',
    quien: 'Coordinación',
  },
]

/* Del azul institucional al naranja: el proyecto "se enciende" al cerrarse. */
const TONOS = ['#14213A', '#2E4A72', '#8A5A55', '#E85A3C']

export default function Pillars() {
  return (
    <section id="proyectos" className="relative bg-panel-alterno py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <p className="text-sm font-medium text-naranja-hover">Cómo funciona</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-ink lg:text-4xl">
              Un proceso claro, de principio a fin.
            </h2>
          </div>
          <p className="self-end text-base leading-relaxed text-ink-muted">
            Cada proyecto de vinculación avanza por cuatro etapas controladas, con
            responsables y evidencias registradas en cada una.
          </p>
        </div>

        <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {/* Línea de avance */}
          <div
            className="absolute left-5 right-5 top-5 hidden h-1.5 rounded-full lg:block"
            style={{ background: `linear-gradient(to right, ${TONOS.join(', ')})` }}
            aria-hidden="true"
          />
          {PILLARS.map((p, i) => (
            <li key={p.n} className="relative">
              <span
                className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ring-4 ring-panel-alterno"
                style={{ backgroundColor: TONOS[i] }}
              >
                {p.n}
              </span>
              <div className="mt-4 rounded-lg bg-white p-4 shadow-nivel-1 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-nivel-2">
                <h3 className="text-[15px] font-semibold text-ink">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{p.desc}</p>
                <p className="mt-3 border-t border-line pt-2.5 text-xs text-ink-muted">
                  Responsable: <span className="font-medium text-ink">{p.quien}</span>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
