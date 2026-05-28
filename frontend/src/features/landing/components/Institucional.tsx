export default function Institucional() {
  return (
    <section id="reportes" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-16">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-10 bg-ink" />
              <span className="text-[11px] uppercase tracking-[0.24em] text-ink-muted">
                Información institucional
              </span>
            </div>
            <h2 className="font-display text-4xl lg:text-5xl leading-[1.05] tracking-tightest text-ink">
              Una plataforma centralizada para la gestión académica.
            </h2>
            <p className="mt-8 text-base leading-relaxed text-ink-muted">
              El sistema consolida la información de proyectos, convenios y seguimiento en un
              solo entorno digital, accesible para administradores, coordinadores, docentes,
              estudiantes y directivos según su rol.
            </p>
          </div>

          <div className="lg:col-span-7 lg:col-start-7">
            <dl className="divide-y divide-line border-y border-line">
              {[
                ['Misión', 'Articular la docencia y la investigación con la realidad social mediante proyectos pertinentes y de alto impacto.'],
                ['Visión', 'Ser referente regional en gestión transparente y eficiente de la vinculación universitaria con la sociedad.'],
                ['Alcance', 'Cubre todo el ciclo de vida del proyecto: formulación, revisión, aprobación, ejecución, seguimiento y cierre.'],
                ['Auditoría', 'Cada acción del sistema queda registrada para garantizar trazabilidad y cumplimiento normativo.'],
              ].map(([term, desc]) => (
                <div key={term} className="grid grid-cols-12 gap-6 py-8">
                  <dt className="col-span-12 sm:col-span-3 text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                    {term}
                  </dt>
                  <dd className="col-span-12 sm:col-span-9 text-base leading-relaxed text-ink">
                    {desc}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
