export const claseInput = (invalido = false) =>
  `w-full px-4 py-2.5 text-sm bg-white rounded-btn text-ink placeholder:text-ink-light focus:outline-none transition-all duration-200 ${
    invalido
      ? 'border border-status-error focus:border-status-error focus:ring-2 focus:ring-status-error/15'
      : 'border border-line focus:border-ink focus:ring-2 focus:ring-ink/10'
  }`

export const claseBotonPrimario =
  'group w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-naranja text-white rounded-btn transition-colors hover:bg-naranja-hover disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2'

export const claseEtiqueta = 'block text-xs font-medium text-ink-muted mb-2'
