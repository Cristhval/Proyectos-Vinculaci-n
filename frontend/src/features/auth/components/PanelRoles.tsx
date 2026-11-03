const ROLES = [
  { nombre: 'Administrador', detalle: 'Gestiona usuarios, roles y la auditoría del sistema.', barra: 'bg-ink' },
  { nombre: 'Coordinador', detalle: 'Revisa y aprueba proyectos y convenios.', barra: 'bg-accent' },
  { nombre: 'Docente', detalle: 'Crea proyectos y registra su seguimiento.', barra: 'bg-emerald-500' },
  { nombre: 'Estudiante', detalle: 'Consulta sus proyectos y reporta avances.', barra: 'bg-amber-500' },
]

/** Panel lateral de las pantallas de acceso: explica qué ve cada rol al entrar. */
export default function PanelRoles({ titulo = 'Sistema de Vinculación con la Sociedad' }: { titulo?: string }) {
  return (
    <aside className="relative hidden w-[400px] flex-col justify-between border-r border-line bg-bg-soft p-10 lg:flex lg:p-16 xl:w-[480px]">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" aria-hidden="true" />

      <div className="relative flex flex-1 flex-col justify-center">
        <h1 className="mb-3 text-3xl font-bold leading-snug tracking-tight text-ink">{titulo}</h1>
        <p className="max-w-xs text-sm leading-relaxed text-ink-muted">
          Cada persona entra con su cuenta y ve solo las opciones de su rol.
        </p>

        <ul className="mt-10 space-y-5">
          {ROLES.map((rol) => (
            <li key={rol.nombre} className="flex gap-4">
              <span className={`w-1 shrink-0 rounded-full ${rol.barra}`} aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink">{rol.nombre}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{rol.detalle}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-ink-light">Universidad Nacional de Loja, 2026</p>
    </aside>
  )
}
