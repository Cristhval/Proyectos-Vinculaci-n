/** El botón "Rellenar IA" solo existe con VITE_HABILITAR_RELLENO_DEMO=true y para ADMIN. */
export const rellenoDemoHabilitado = (rol?: string) =>
  import.meta.env.VITE_HABILITAR_RELLENO_DEMO === 'true' && rol === 'ADMIN'
