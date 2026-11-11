export function esCedulaValida(valor: string): boolean {
  const cedula = valor.replace(/[\s-]/g, '')
  if (!/^\d{10}$/.test(cedula) || new Set(cedula).size === 1) return false
  const provincia = Number(cedula.slice(0, 2))
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) return false
  if (Number(cedula[2]) >= 6) return false
  const suma = cedula
    .slice(0, 9)
    .split('')
    .reduce((total, digito, indice) => {
      const producto = Number(digito) * (indice % 2 === 0 ? 2 : 1)
      return total + (producto >= 10 ? producto - 9 : producto)
    }, 0)
  return (10 - (suma % 10)) % 10 === Number(cedula[9])
}
