import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const roles = ['ADMIN', 'COORDINADOR', 'DOCENTE', 'ESTUDIANTE', 'DIRECTIVO']
const rolesFile = readFileSync(resolve(raiz, 'frontend/src/lib/roles.ts'), 'utf8')
const routesFile = readFileSync(resolve(raiz, 'frontend/src/routes/index.tsx'), 'utf8')

const rutasInicio = {
  ADMIN: '/admin/dashboard',
  COORDINADOR: '/coordinador/dashboard',
  DOCENTE: '/docente/dashboard',
  ESTUDIANTE: '/estudiante/dashboard',
  DIRECTIVO: '/coordinador/dashboard',
}

for (const rol of roles) {
  if (!rolesFile.includes(`${rol}: '${rutasInicio[rol]}'`)) {
    throw new Error(`Falta la ruta de inicio para ${rol}`)
  }
}

const dashboardRoles = routesFile.match(
  /<Route element={<ProtectedRoute allowedRoles={\['COORDINADOR', 'DIRECTIVO', 'ADMIN'\]} \/>\}>[\s\S]*?<Route path="\/coordinador\/dashboard"/,
)
if (!dashboardRoles) {
  throw new Error('La ruta de inicio de DIRECTIVO no está permitida en las rutas de coordinación')
}

console.log(`Rutas de inicio verificadas para ${roles.length} roles.`)
