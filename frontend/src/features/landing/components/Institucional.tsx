const ITEMS = [
  {
    term: 'Misión',
    desc: 'Articular la docencia y la investigación con la realidad social mediante proyectos pertinentes y de alto impacto.',
  },
  {
    term: 'Visión',
    desc: 'Ser referente regional en gestión transparente y eficiente de la vinculación universitaria con la sociedad.',
  },
  {
    term: 'Alcance',
    desc: 'Cubre todo el ciclo de vida del proyecto: formulación, revisión, aprobación, ejecución, seguimiento y cierre.',
  },
  {
    term: 'Auditoría',
    desc: 'Cada cambio queda registrado con usuario, fecha y estado, como respaldo ante procesos de control interno.',
  },
]

export default function Institucional() {
  return (
    <section className="relative bg-white py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-14 lg:grid-cols-[5fr_7fr] lg:gap-24">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm font-medium text-naranja-hover">Información institucional</p>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-ink">
              Una plataforma centralizada para la gestión académica.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-muted">
              El sistema consolida la información de proyectos, convenios y seguimiento en un
              solo entorno digital, accesible según el rol de cada usuario.
            </p>
          </div>

          <dl className="divide-y divide-line border-y border-line">
            {ITEMS.map((item) => (
              <div key={item.term} className="grid sm:grid-cols-[112px_1fr] gap-1.5 sm:gap-8 py-6">
                <dt className="text-sm font-semibold text-ink">
                  {item.term}
                </dt>
                <dd className="text-[15px] leading-relaxed text-ink-muted">
                  {item.desc}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
