export const claseInput = (invalido = false) =>
  `w-full px-4 py-2.5 text-sm bg-white rounded-btn text-ink placeholder:text-ink-light focus:outline-none transition-all duration-200 ${
    invalido
      ? 'border-2 border-red-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/10'
      : 'border border-line focus:border-accent focus:ring-2 focus:ring-accent/10'
  }`

export const claseBotonPrimario =
  'group w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-ink text-white rounded-btn neu-btn-dark disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2'

export const claseEtiqueta = 'block text-xs font-medium text-ink-muted mb-2'
