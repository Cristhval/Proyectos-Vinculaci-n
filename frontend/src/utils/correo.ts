/** Quita todos los espacios y pasa a minúsculas, antes de validar el correo. */
export const normalizarCorreo = (valor: string) => valor.replace(/\s+/g, '').toLowerCase()

/** Misma dirección sin tildes, diéresis ni ñ: "maría.ñ@unl.edu.ec" → "maria.n@unl.edu.ec". */
export const correoSinTildes = (correo: string) => correo.normalize('NFD').replace(/[̀-ͯ]/g, '')

/**
 * Si el correo (ya normalizado) lleva tildes o ñ, devuelve la sugerencia sin ellas; si no, null.
 * La sugerencia solo se muestra: el usuario decide si la usa.
 */
export const sugerenciaCorreo = (correo: string): string | null => {
  const sugerencia = correoSinTildes(correo)
  return sugerencia !== correo ? sugerencia : null
}

/** Atributos para que el teclado del celular no agregue tildes ni mayúsculas. */
export const atributosInputCorreo = {
  autoCapitalize: 'off',
  autoCorrect: 'off',
  spellCheck: false,
  inputMode: 'email',
} as const
