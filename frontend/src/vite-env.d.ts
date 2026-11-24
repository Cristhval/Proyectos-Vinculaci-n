/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_AUTH_URL?: string
  readonly VITE_RECAPTCHA_SITE_KEY?: string
  /** "true" muestra el botón "Rellenar IA" (solo ADMIN) en el formulario de proyectos. */
  readonly VITE_HABILITAR_RELLENO_DEMO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
