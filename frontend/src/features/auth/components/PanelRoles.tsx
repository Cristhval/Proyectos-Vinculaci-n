/** Panel lateral común de las pantallas de acceso. */
export default function PanelRoles({ titulo = 'Sistema de Vinculación con la Sociedad' }: { titulo?: string }) {
  return (
    <aside className="sticky top-0 hidden h-screen min-h-0 w-[42%] max-w-[500px] shrink-0 flex-col justify-start bg-slate-900 px-10 pt-28 text-white lg:flex xl:px-16 xl:pt-32">
      <div className="max-w-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-400">
          Sistema de gestión
        </p>
        <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight xl:text-5xl">
          Proyectos de<br />vinculación y<br />convenios, en un<br />solo lugar.
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-slate-300">
          {titulo === 'Sistema de Vinculación con la Sociedad'
            ? 'Ingresa con tu cuenta institucional para gestionar tus proyectos y convenios.'
            : 'Accede a tu cuenta institucional para continuar.'}
        </p>

        <div className="mt-9 space-y-5">
          {[
            ['1', 'Accede a tu cuenta', 'Ingresa con tus credenciales institucionales.'],
            ['2', 'Verifica tu identidad', 'Protegemos tu acceso con autenticación segura.'],
            ['3', 'Gestiona tus proyectos', 'Visualiza las opciones disponibles para tu rol.'],
          ].map(([number, nombre, detalle], index) => (
            <div key={number} className="flex items-start gap-3">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium ${
                index === 0 ? 'border-blue-400 bg-blue-400 text-white' : 'border-slate-400 text-slate-200'
              }`}>
                {number}
              </span>
              <div>
                <p className="text-xs font-semibold">{nombre}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-300">{detalle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
