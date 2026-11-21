/**
 * Marca del sistema: cuadro azul marino con la "U" y una esquina naranja.
 * Sobre fondos oscuros el cuadro pasa a blanco para mantener el contraste.
 */
export function SimboloUNL({ oscuro = false, className = '' }: { oscuro?: boolean; className?: string }) {
  return (
    <span
      className={`relative inline-flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-md text-sm font-extrabold tracking-tight ${
        oscuro ? 'bg-white text-ink' : 'bg-ink text-white'
      } ${className}`}
      aria-hidden="true"
    >
      U
      <span className="absolute -bottom-1.5 -right-1.5 h-4 w-4 rotate-45 bg-naranja" />
    </span>
  )
}

export function MarcaUNL({ oscuro = false, subtitulo = true }: { oscuro?: boolean; subtitulo?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <SimboloUNL oscuro={oscuro} />
      <span className="min-w-0 leading-tight">
        <span className={`block truncate text-sm font-semibold tracking-tight ${oscuro ? 'text-white' : 'text-ink'}`}>Vinculación UNL</span>
        {subtitulo && (
          <span className={`block truncate text-[11px] ${oscuro ? 'text-slate-400' : 'text-ink-muted'}`}>Universidad Nacional de Loja</span>
        )}
      </span>
    </span>
  )
}
