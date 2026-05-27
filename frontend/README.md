# Frontend - Sistema de Vinculacion UNL

SPA (Single Page Application) desarrollada con React 19 + TypeScript + Vite para gestionar proyectos de vinculacion con la sociedad de la Universidad Nacional de Loja.

## Stack Tecnologico

| Tecnologia | Version | Uso |
|---|---|---|
| React | 19 | Framework UI |
| TypeScript | 5.x | Tipado estatico |
| Vite | 6.x | Build tool / Dev server |
| TailwindCSS | 3.x | Estilos utilitarios |
| Zustand | 5.x | Estado global |
| Axios | 1.x | Cliente HTTP |
| React Router | 7.x | Enrutamiento SPA |
| React Hook Form | 7.x | Formularios |
| Recharts | 2.x | Graficos |
| Lucide React | - | Iconos |
| date-fns | 4.x | Formateo de fechas |

## Estructura del Proyecto

```
src/
├── api/            # Servicios HTTP (1 archivo por modulo backend)
├── components/
│   └── ui/         # Componentes reutilizables (Button, Input, Card, Modal, Table...)
├── features/       # Paginas agrupadas por dominio
│   ├── auth/
│   ├── dashboard/
│   ├── proyectos/
│   ├── convenios/
│   ├── seguimiento/
│   ├── reportes/
│   ├── auditoria/
│   └── usuarios/
├── hooks/          # Custom hooks (useAuth, usePermissions)
├── layouts/        # Layouts principales (Auth, Dashboard + Sidebar)
├── lib/            # Utilidades (constants, formatters)
├── routes/         # Configuracion de rutas, navegacion, breadcrumbs
├── store/          # Estado global Zustand (auth, ui)
└── types/          # Interfaces TypeScript por modulo
```

## Requisitos

- Node.js >= 18
- npm >= 9

## Instalacion

```bash
cd frontend
npm install
```

## Desarrollo

```bash
npm run dev
```

El servidor de desarrollo se inicia en `http://localhost:5173` y hace proxy de `/api` hacia `http://localhost:8000`.

## Build Produccion

```bash
npm run build
```

Los artefactos se generan en `dist/`.

## Variables de Entorno

Copiar `.env.example` a `.env`:

```bash
cp .env.example .env
```

| Variable | Descripcion | Default |
|---|---|---|
| `VITE_API_URL` | URL base de la API backend | `http://localhost:8000/api/v1` |

## Modulos y Correspondencia con Backend

| Frontend Feature | Backend App | Endpoints |
|---|---|---|
| `features/auth` | `usuarios` | POST login, register, refresh |
| `features/proyectos` | `proyectos` | CRUD + workflow actions |
| `features/convenios` | `convenios` | CRUD + workflow actions |
| `features/seguimiento` | `seguimiento` | Avances, evidencias, informes, alertas |
| `features/reportes` | `reportes` | Dashboard KPIs, reportes filtrados |
| `features/auditoria` | `auditoria` | Logs paginados (solo admin) |
| `features/usuarios` | `usuarios` | CRUD usuarios + carreras |

## Componentes UI

Biblioteca interna de componentes reutilizables en `src/components/ui/`:

- **Button** - Variantes: primary, secondary, danger, ghost. Soporte para loading e iconos.
- **Input** - Con label, error y helper text.
- **Select** - Dropdown con placeholder y opciones.
- **Badge** - Indicadores de estado con variantes de color.
- **Card** - Contenedor con titulo y acciones opcionales.
- **Modal** - Dialogo modal con overlay y tamanos configurables.
- **Table** - Tabla generica con columnas tipadas.
- **Spinner** - Indicador de carga.
- **EmptyState** - Estado vacio con icono, titulo y accion.
- **Breadcrumb** - Navegacion por migas basada en ruta activa.

## Autenticacion

- JWT almacenado en localStorage via Zustand persist.
- Interceptor Axios inyecta token en headers.
- Refresh automatico del access token cuando expira.
- Rutas protegidas via `ProtectedRoute` component.

## Control de Acceso (RBAC)

Roles soportados: `ADMIN`, `COORDINADOR`, `DOCENTE`, `ESTUDIANTE`, `DIRECTIVO`

La navegacion se filtra segun el rol del usuario. El hook `usePermissions` provee metodos para verificar acceso jerarquico.
