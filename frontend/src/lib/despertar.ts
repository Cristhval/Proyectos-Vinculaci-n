import { API_BASE, AUTH_BASE } from '@/config/api'

const INTERVALO_DESPERTAR = 5 * 60 * 1000
let ultimoDespertar = 0

function origenDe(url: string): string {
  try {
    return new URL(url, window.location.origin).origin
  } catch {
    return window.location.origin
  }
}

export function despertarServicios(): void {
  const ahora = Date.now()
  if (ahora - ultimoDespertar < INTERVALO_DESPERTAR) return
  ultimoDespertar = ahora

  for (const base of [AUTH_BASE, API_BASE]) {
    void fetch(`${origenDe(base)}/salud/`, {
      method: 'GET',
      credentials: 'omit',
    }).catch(() => undefined)
  }
}
