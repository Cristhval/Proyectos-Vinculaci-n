import { useMemo, useState } from 'react'
import type { Carrera } from '@/types/usuarios'
import { normalizar } from '@/lib/texto'

/**
 * Filtro de carreras por facultad y texto, sobre el mismo catálogo que usa el perfil
 * (GET /carreras/). La facultad es el campo `Carrera.facultad`; no hay otra tabla.
 */
export function useFiltroCarreras(carreras: Carrera[]) {
  const [facultad, setFacultad] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const facultades = useMemo(
    () => [...new Set(carreras.map((c) => c.facultad).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    [carreras],
  )

  const filtradas = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return carreras
      .filter((c) => !facultad || c.facultad === facultad)
      // Igual que el selector del perfil: busca en nombre, código y facultad.
      .filter((c) => !q || normalizar(`${c.nombre} ${c.codigo ?? ''} ${c.facultad}`).includes(q))
      .sort((a, b) => a.facultad.localeCompare(b.facultad, 'es') || a.nombre.localeCompare(b.nombre, 'es'))
  }, [carreras, facultad, busqueda])

  return { facultad, setFacultad, busqueda, setBusqueda, facultades, filtradas }
}
