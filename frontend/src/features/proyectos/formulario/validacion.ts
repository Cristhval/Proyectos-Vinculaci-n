import { NIVELES_MARCO, NIVEL_INFO, type FormState } from './tipos'

/**
 * Reglas de validación de cada fase. Son las mismas de siempre; solo están fuera del
 * componente para que también las use el generador de datos de prueba.
 */

const largo = (s: string) => s.trim().length

function minimo(e: Record<string, string>, campo: string, valor: string, min: number, nombre: string) {
  if (!largo(valor)) e[campo] = `Escribe ${nombre}.`
  else if (largo(valor) < min) e[campo] = `Escribe al menos ${min} caracteres (llevas ${largo(valor)}).`
}

export function erroresDeFase(fase: number, f: FormState, confirmado: boolean): Record<string, string> {
  const e: Record<string, string> = {}

  if (fase === 1) {
    const titulo = f.titulo.trim()
    if (!titulo) e.titulo = 'Escribe el título del proyecto.'
    else if (titulo.length < 10) e.titulo = `El título debe tener al menos 10 caracteres (lleva ${titulo.length}).`
    else if (f.titulo.length > 255) e.titulo = 'El título no puede pasar de 255 caracteres.'
    else if (/@|#|\$|&|\*/.test(f.titulo)) e.titulo = 'Quita los caracteres @, #, $, & o * del título.'
    if (f.carreras.length === 0) e.carreras = 'Elige al menos una carrera.'
    minimo(e, 'resumen', f.resumen, 50, 'el resumen')
    if (largo(f.descripcion) && largo(f.descripcion) < 30) {
      e.descripcion = `Si escribes una descripción, que tenga al menos 30 caracteres (lleva ${largo(f.descripcion)}).`
    }
  }

  if (fase === 2) {
    if (f.alineaciones.length === 0) {
      e.alineaciones = 'Agrega al menos una alineación estratégica.'
    } else {
      f.alineaciones.forEach((a, idx) => {
        const faltan: string[] = []
        if (!a.eje.trim()) faltan.push('falta el eje')
        else if (/\d/.test(a.eje.trim())) faltan.push('el eje no debe tener números')
        if (!a.objetivo_estrategico.trim()) faltan.push('falta el objetivo estratégico')
        else if (largo(a.objetivo_estrategico) < 30) faltan.push('el objetivo estratégico necesita al menos 30 caracteres')
        if (!a.programa.trim()) faltan.push('falta el programa')
        if (!a.plan.trim()) faltan.push('falta el plan')
        if (faltan.length > 0) e[`alineaciones.${idx}`] = `Alineación ${idx + 1}: ${faltan.join(', ')}.`
      })
    }
  }

  if (fase === 3) {
    minimo(e, 'problema', f.problema, 50, 'el problema')
    minimo(e, 'justificacion', f.justificacion, 50, 'la justificación')
    minimo(e, 'objetivo_general', f.objetivo_general, 30, 'el objetivo general')
    if (f.beneficiarios.length === 0) {
      e.beneficiarios = 'Agrega al menos un beneficiario.'
    } else {
      if (!f.beneficiarios.some((b) => b.tipo === 'DIRECTO')) e.beneficiarios = 'Agrega al menos un beneficiario directo.'
      const idx = f.beneficiarios.findIndex((b) => !b.nombre.trim())
      if (idx !== -1) e[`beneficiarios.${idx}.nombre`] = `Al beneficiario ${idx + 1} le falta el nombre.`
    }
    if (!f.viabilidad.trim()) e.viabilidad = 'Describe la viabilidad del proyecto.'
  }

  if (fase === 4) {
    for (const nivel of NIVELES_MARCO) {
      const fila = f.marco_logico.find((m) => m.nivel === nivel)
      if (!fila || !fila.resumen_narrativo.trim()) {
        e[`marco_logico.${nivel}`] = `Escribe el resumen narrativo del nivel ${NIVEL_INFO[nivel].titulo}.`
      }
    }
  }

  if (fase === 5) {
    if (!f.fecha_inicio) e.fecha_inicio = 'Elige la fecha de inicio.'
    if (!f.fecha_fin_planificada) e.fecha_fin_planificada = 'Elige la fecha de fin.'
    if (f.fecha_inicio && f.fecha_fin_planificada && f.fecha_fin_planificada < f.fecha_inicio) {
      e.fecha_fin_planificada = 'La fecha de fin debe ser posterior a la de inicio.'
    }
    if (!f.estrategias_ejecucion.trim()) e.estrategias_ejecucion = 'Describe las estrategias de ejecución.'
    if (!f.seguimiento_evaluacion.trim()) e.seguimiento_evaluacion = 'Describe cómo se hará el seguimiento y la evaluación.'
    const montos = [f.monto_unl_valorado, f.monto_unl_economico, f.monto_externo_valorado, f.monto_externo_economico]
    if (montos.some((m) => m && Number(m) < 0)) e.presupuesto = 'Los montos no pueden ser negativos.'
  }

  if (fase === 6) {
    if (!f.responsable) e.responsable = 'Elige el docente responsable.'
  }

  if (fase === 7) {
    if (!confirmado) e.confirm = 'Marca la casilla para confirmar los datos.'
  }

  return e
}
