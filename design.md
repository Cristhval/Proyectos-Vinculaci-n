# Design System - Sistema de Vinculación UNL

**Versión:** 1.0.0  
**Última actualización:** Junio 2026  
**Herramienta destino:** Stitch (Interfaces UI/UX)

---

## Tabla de Contenidos

1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Sistema de Diseño](#2-sistema-de-diseño)
3. [Arquitectura de Información](#3-arquitectura-de-información)
4. [Pantallas del Sistema](#4-pantallas-del-sistema)
5. [Componentes UI](#5-componentes-ui)
6. [Flujos de Navegación](#6-flujos-de-navegación)
7. [Modelo de Datos (Referencia Visual)](#7-modelo-de-datos-referencia-visual)
8. [Estados y Transiciones](#8-estados-y-transiciones)
9. [Guía de Roles y Permisos](#9-guía-de-roles-y-permisos)

---

## 1. Visión General del Proyecto

### 1.1 Contexto

| Campo | Valor |
|-------|-------|
| **Nombre** | Sistema de Gestión de Proyectos de Vinculación con la Sociedad |
| **Organización** | Universidad Nacional de Loja (UNL) |
| **Usuarios** | Docentes, Estudiantes, Coordinadores, Administradores, Directivos |
| **Propósito** | Gestión integral del ciclo de vida de proyectos de vinculación y convenios |

### 1.2 Actores del Sistema

| Actor | Rol | Permisos Principales |
|-------|-----|---------------------|
| **Administrador** | Configuración total | CRUD completo, gestión de usuarios, auditoría |
| **Coordinador** | Gestión operativa | Aprobar/rechazar proyectos, revisar avances, reportes |
| **Docente** | Gestión de proyectos | Crear/editar proyectos, actividades, indicadores |
| **Estudiante** | Participación | Registrar avances, subir evidencias, ver proyectos |
| **Directivo** | Supervisión | Consulta general, reportes ejecutivos |

### 1.3 Módulos del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA VINCULACIÓN UNL                   │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│  Dashboard  │  Proyectos  │  Convenios  │   Seguimiento     │
│  (KPIs)     │  (CRUD)     │  (CRUD)     │   (Avances)       │
├─────────────┼─────────────┼─────────────┼───────────────────┤
│  Reportes   │  Usuarios   │  Auditoría  │   Alertas         │
│  (Gráficos) │  (Admin)    │  (Logs)     │   (Notificaciones)│
└─────────────┴─────────────┴─────────────┴───────────────────┘
```

---

## 2. Sistema de Diseño

### 2.1 Paleta de Colores

#### Colores Primarios

| Nombre | Hex | Uso |
|--------|-----|-----|
| **Primary** | `#1E40AF` | Botones principales, headers, links |
| **Primary Light** | `#3B82F6` | Hover states, badges activos |
| **Primary Dark** | `#1E3A8A` | Texto sobre fondos claros |

#### Colores Secundarios

| Nombre | Hex | Uso |
|--------|-----|-----|
| **Secondary** | `#059669` | Acciones de éxito, estados positivos |
| **Secondary Light** | `#10B981` | Iconos de verificación |

#### Colores de Estado

| Estado | Hex | Uso |
|--------|-----|-----|
| **Borrador** | `#6B7280` | Estado inicial, sin procesar |
| **En Revisión** | `#F59E0B` | Pendiente de revisión |
| **Aprobado** | `#10B981` | Confirmado, exitoso |
| **En Ejecución** | `#3B82F6` | Activo, en proceso |
| **Rechazado/Cancelado** | `#EF4444` | Error, cancelado |
| **Suspendido** | `#F97316` | Pausado, alerta |
| **Finalizado** | `#8B5CF6` | Completado |

#### Colores Neutros

| Nombre | Hex | Uso |
|--------|-----|-----|
| **Background** | `#F9FAFB` | Fondo general |
| **Surface** | `#FFFFFF` | Tarjetas, modales |
| **Border** | `#E5E7EB` | Bordes, divisores |
| **Text Primary** | `#111827` | Texto principal |
| **Text Secondary** | `#6B7280` | Texto secundario, labels |
| **Text Disabled** | `#9CA3AF` | Texto deshabilitado |

### 2.2 Tipografía

| Elemento | Font | Tamaño | Peso | Uso |
|----------|------|--------|------|-----|
| **H1** | Inter | 32px | 700 | Títulos de página |
| **H2** | Inter | 24px | 600 | Subtítulos de sección |
| **H3** | Inter | 20px | 600 | Títulos de tarjetas |
| **Body** | Inter | 16px | 400 | Texto general |
| **Body Small** | Inter | 14px | 400 | Texto secundario |
| **Caption** | Inter | 12px | 400 | Labels, metadatos |
| **Button** | Inter | 14px | 500 | Texto de botones |

### 2.3 Espaciado

| Token | Valor | Uso |
|-------|-------|-----|
| **xs** | 4px | Espacio entre icono y texto |
| **sm** | 8px | Padding interno de botones |
| **md** | 16px | Padding de tarjetas, gaps |
| **lg** | 24px | Separación entre secciones |
| **xl** | 32px | Márgenes de página |
| **2xl** | 48px | Separación entre módulos |

### 2.4 Bordes y Sombras

| Elemento | Estilo |
|----------|--------|
| **Border Radius** | 8px (default), 12px (cards), 9999px (badges) |
| **Shadow Small** | `0 1px 2px rgba(0,0,0,0.05)` |
| **Shadow Medium** | `0 4px 6px rgba(0,0,0,0.1)` |
| **Shadow Large** | `0 10px 15px rgba(0,0,0,0.1)` |

---

## 3. Arquitectura de Información

### 3.1 Mapa del Sitio

```
Login
│
└── Dashboard (Autenticado)
    │
    ├── 📊 Dashboard Principal
    │   ├── KPIs resumen
    │   ├── Proyectos activos
    │   ├── Alertas recientes
    │   └── Accesos rápidos
    │
    ├── 📁 Proyectos
    │   ├── Lista de Proyectos
    │   │   ├── Filtros (estado, tipo, carrera)
    │   │   ├── Búsqueda
    │   │   └── Tabla de resultados
    │   ├── Detalle de Proyecto
    │   │   ├── Información general
    │   │   ├── Objetivos e Indicadores
    │   │   ├── Actividades
    │   │   ├── Participantes
    │   │   ├── Presupuesto
    │   │   ├── Avances y Evidencias
    │   │   ├── Informes
    │   │   └── Historial de Revisiones
    │   └── Crear/Editar Proyecto
    │
    ├── 📋 Convenios
    │   ├── Lista de Convenios
    │   ├── Detalle de Convenio
    │   │   ├── Información general
    │   │   ├── Compromisos
    │   │   ├── Productos
    │   │   └── Proyectos vinculados
    │   └── Crear/Editar Convenio
    │
    ├── 📈 Seguimiento
    │   ├── Avances
    │   │   ├── Lista por proyecto
    │   │   ├── Registrar avance
    │   │   └── Aprobar/Rechazar
    │   ├── Evidencias
    │   │   ├── Galería
    │   │   └── Subir evidencia
    │   └── Informes
    │       ├── Lista de informes
    │       └── Generar informe
    │
    ├── 📊 Reportes
    │   ├── Dashboard KPIs
    │   │   ├── Gráficos de proyectos
    │   │   ├── Métricas de avance
    │   │   └── Comparativas
    │   └── Reportes Exportables
    │       ├── PDF
    │       └── Excel
    │
    ├── 👥 Usuarios (Coordinador+)
    │   ├── Lista de Usuarios
    │   ├── Detalle de Usuario
    │   └── Crear/Editar Usuario
    │
    └── 🔒 Auditoría (Solo Admin)
        └── Log de Acciones
            ├── Filtros por fecha, usuario, acción
            └── Detalle de cada acción
```

---

## 4. Pantallas del Sistema

### 4.1 Pantalla: Login

**Descripción:** Pantalla de inicio de sesión

**Elementos:**
- Logo UNL + Nombre del sistema
- Campo: Usuario (email o código)
- Campo: Contraseña
- Checkbox: Recordar sesión
- Botón: Iniciar Sesión
- Link: ¿Olvidó su contraseña?

**Estados:**
- Default (formulario vacío)
- Loading (validando credenciales)
- Error (credenciales inválidas)
- Success (redirige a Dashboard)

---

### 4.2 Pantalla: Dashboard Principal

**Descripción:** Panel principal con resumen de información

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo + Título + Usuario + Rol + Notificaciones     │
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│  Sidebar   │  ┌─────────────────────────────────────────┐  │
│            │  │  Bienvenida + Fecha actual               │  │
│  Dashboard │  ├─────────────────────────────────────────┤  │
│  Proyectos │  │                                          │  │
│  Convenios │  │  [KPI 1]  [KPI 2]  [KPI 3]  [KPI 4]    │  │
│  Seguim.   │  │                                          │  │
│  Reportes  │  ├─────────────────────────────────────────┤  │
│  Usuarios  │  │                                          │  │
│  Auditoría │  │  ┌─────────────────┐ ┌────────────────┐ │  │
│            │  │  │ Proyectos       │ │ Alertas        │ │  │
│  ────────  │  │  │ Recientes       │ │ Recientes      │ │  │
│  Config    │  │  │                 │ │                │ │  │
│  Salir     │  │  └─────────────────┘ └────────────────┘ │  │
│            │  │                                          │  │
│            │  └─────────────────────────────────────────┘  │
└────────────┴────────────────────────────────────────────────┘
```

**KPIs del Dashboard:**

| KPI | Descripción | Icono |
|-----|-------------|-------|
| **Proyectos Activos** | Total de proyectos en ejecución | 📁 |
| **Convenios Vigentes** | Convenios con estado VIGENTE | 📋 |
| **Avances Pendientes** | Avances por revisar | ⏳ |
| **Alertas sin leer** | Notificaciones pendientes | 🔔 |

**Secciones:**

1. **Proyectos Recientes** (Tabla)
   - Columnas: Código, Título, Estado, Responsable, Fecha
   - Acciones: Ver detalle, Editar
   - Límite: 5 proyectos más recientes

2. **Alertas Recientes** (Lista)
   - Icono de prioridad (color)
   - Mensaje resumido
   - Tiempo relativo (hace 2 horas)
   - Acción: Marcar como leída

---

### 4.3 Pantalla: Lista de Proyectos

**Descripción:** Listado de todos los proyectos con filtros

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Header + Breadcrumb: Inicio > Proyectos                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Título: Proyectos                    [Nuevo Proyecto]│   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Filtros:                                           │   │
│  │  [Estado ▼] [Tipo ▼] [Carrera ▼] [🔍 Buscar...]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Tabla de Proyectos                                 │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  │ Código │ Título │ Estado │ Tipo │ Responsable │  │   │
│  │  ├────────┼────────┼────────┼──────┼─────────────┤  │   │
│  │  │ PRO-01 │ Proy.. │ 🟢 Apr │ VINC │ Juan P...   │  │   │
│  │  │ PRO-02 │ Proy.. │ 🟡 Rev │ INV  │ María L...  │  │   │
│  │  │ PRO-03 │ Proy.. │ 🔵 Ej  │ EXT  │ Carlos...   │  │   │
│  │  └────────────────────────────────────────────────  │   │
│  │                                                     │   │
│  │  Paginación: [< 1 2 3 ... 10 >]                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Filtros Disponibles:**

| Filtro | Tipo | Opciones |
|--------|------|----------|
| **Estado** | Select | Todos, Borrador, En Revisión, Aprobado, En Ejecución, Suspendido, Finalizado, Cerrado, Cancelado |
| **Tipo** | Select | Todos, Vinculación, Investigación, Extensión, Mixto |
| **Carrera** | Select | Todas las carreras activas |
| **Búsqueda** | Text | Código, título, descripción, responsable |

**Columnas de la Tabla:**

| Columna | Ancho | Ordenable | Descripción |
|---------|-------|-----------|-------------|
| Código | 120px | ✅ | Código único del proyecto |
| Título | Flex | ✅ | Título del proyecto |
| Estado | 140px | ✅ | Badge con color de estado |
| Tipo | 120px | ❌ | Tipo de proyecto |
| Responsable | 180px | ❌ | Nombre del responsable |
| Fecha Inicio | 120px | ✅ | Fecha de inicio |
| Acciones | 100px | ❌ | Ver, Editar, Eliminar |

---

### 4.4 Pantalla: Detalle de Proyecto

**Descripción:** Vista completa de un proyecto con todas sus secciones

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Header + Breadcrumb: Inicio > Proyectos > PRO-001          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Código: PRO-001                                    │   │
│  │  Título: Proyecto de Vinculación Comunitaria        │   │
│  │  Estado: [En Ejecución]  Tipo: [Vinculación]        │   │
│  │  Prioridad: [Alta]                                  │   │
│  │                                                     │   │
│  │  Acciones: [Enviar Revisión] [Aprobar] [Suspender]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Tabs:                                              │   │
│  │  [General] [Objetivos] [Actividades] [Participantes]│   │
│  │  [Presupuesto] [Avances] [Informes] [Revisiones]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  Contenido del Tab seleccionado                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Tab: General

**Campos de información:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Código | Text (readonly) | Código único |
| Título | Text | Título del proyecto |
| Resumen | Textarea | Resumen ejecutivo |
| Descripción | Textarea | Descripción detallada |
| Problema | Textarea | Planteamiento del problema |
| Justificación | Textarea | Justificación |
| Objetivo General | Textarea | Objetivo general |
| Resultados Esperados | Textarea | Resultados esperados |
| Línea de Intervención | Text | Línea de intervención |
| Tipo | Select | Tipo de proyecto |
| Prioridad | Select | Nivel de prioridad |
| Carrera | Select | Carrera responsable |
| Responsable | Select | Usuario responsable |
| Coordinador Académico | Select | Coordinador |
| Fecha Inicio | Date | Fecha de inicio |
| Fecha Fin Planificada | Date | Fecha fin planificada |
| Fecha Fin Real | Date | Fecha fin real (solo lectura si finalizado) |
| Presupuesto Aprobado | Number | Monto aprobado |
| Dirección Ejecución | Text | Lugar de ejecución |
| Observaciones | Textarea | Observaciones adicionales |

#### Tab: Objetivos

**Componentes:**
- Botón: Nuevo Objetivo
- Lista de objetivos (accordion)
  - Tipo (General/Específico)
  - Orden
  - Descripción
  - Meta
  - Estado (Cumplido/Pendiente)
  - Indicadores asociados (sub-lista)

#### Tab: Actividades

**Componentes:**
- Botón: Nueva Actividad
- Tabla de actividades
  - Columnas: Código, Nombre, Fechas, Responsable, Porcentaje, Estado
  - Acciones: Editar, Ver avances

#### Tab: Participantes

**Componentes:**
- Botón: Agregar Participante
- Tabla de participantes
  - Columnas: Usuario, Rol, Fechas, Horas, Estado
  - Acciones: Editar, Eliminar

#### Tab: Presupuesto

**Componentes:**
- Formulario de presupuesto
- Campos: Monto solicitado, Aprobado, Ejecutado
- Estado del presupuesto
- Barra de progreso de ejecución

#### Tab: Avances

**Componentes:**
- Botón: Nuevo Avance
- Lista de avances por actividad
  - Porcentaje, descripción, fecha
  - Estado (Pendiente/Aprobado/Rechazado)
  - Evidencias asociadas

#### Tab: Informes

**Componentes:**
- Botón: Nuevo Informe
- Lista de informes
  - Tipo, Número, Título, Estado
  - Acciones: Ver, Descargar PDF

#### Tab: Revisiones

**Componentes:**
- Timeline de revisiones
  - Fecha, Revisor, Decisión, Comentario
- Botón: Nueva Revisión (si tiene permisos)

---

### 4.5 Pantalla: Crear/Editar Proyecto

**Descripción:** Formulario para crear o editar un proyecto

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Header + Breadcrumb: Inicio > Proyectos > Nuevo            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Paso 1] ─── [Paso 2] ─── [Paso 3] ─── [Paso 4]   │   │
│  │  Información  Objetivos   Actividades  Revisión     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  Formulario del paso actual                         │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Campo 1: [____________________________]     │   │   │
│  │  │ Campo 2: [____________________________]     │   │   │
│  │  │ Campo 3: [____________________________]     │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  [Anterior]                    [Guardar] [Siguiente]│   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Pasos del Wizard:**

| Paso | Contenido |
|------|-----------|
| **1. Información** | Datos generales del proyecto |
| **2. Objetivos** | Definir objetivos e indicadores |
| **3. Actividades** | Planificar actividades |
| **4. Revisión** | Revisar y enviar |

---

### 4.6 Pantalla: Lista de Convenios

**Descripción:** Listado de convenios interinstitucionales

**Layout similar a Lista de Proyectos**

**Filtros:**

| Filtro | Opciones |
|--------|----------|
| Estado | Todos, Borrador, En Revisión, Vigente, Vencido, Suspendido, Finalizado, Cancelado |
| Tipo | Todos, Marco, Específico, Cooperación, Otro |
| Búsqueda | Código, objeto, institución |

**Columnas:**

| Columna | Descripción |
|---------|-------------|
| Código | Código del convenio |
| Objeto | Objeto del convenio |
| Institución | Institución contraparte |
| Tipo | Tipo de convenio |
| Estado | Estado actual |
| Fechas | Inicio - Fin |
| Acciones | Ver, Editar, Eliminar |

---

### 4.7 Pantalla: Detalle de Convenio

**Descripción:** Vista completa de un convenio

**Tabs:**

| Tab | Contenido |
|-----|-----------|
| **General** | Información básica del convenio |
| **Compromisos** | Lista de compromisos |
| **Productos** | Productos entregables |
| **Proyectos** | Proyectos vinculados |

---

### 4.8 Pantalla: Seguimiento - Avances

**Descripción:** Gestión de avances de actividades

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Header + Breadcrumb: Inicio > Seguimiento > Avances        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Filtros: [Proyecto ▼] [Estado ▼] [Actividad ▼]            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Lista de Avances                                   │   │
│  │                                                     │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │ Actividad: Implementar talleres               │ │   │
│  │  │ Avance: 75% ████████████░░░░                  │ │   │
│  │  │ Registrado: Juan Pérez - 15/05/2026           │ │   │
│  │  │ Estado: [En Revisión]                         │ │   │
│  │  │                                               │ │   │
│  │  │ Evidencias: 📷 3 fotos, 📄 1 documento       │ │   │
│  │  │                                               │ │   │
│  │  │ [Aprobar] [Rechazar] [Ver Detalle]            │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.9 Pantalla: Reportes - Dashboard KPIs

**Descripción:** Dashboard con métricas y gráficos

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Header + Breadcrumb: Inicio > Reportes                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Filtros: [Período ▼] [Carrera ▼] [Tipo ▼]                 │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Total       │ │ En          │ │ Completados │          │
│  │ Proyectos   │ │ Ejecución   │ │ este mes    │          │
│  │    45       │ │    12       │ │     8       │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                             │
│  ┌─────────────────────────┐ ┌─────────────────────────┐   │
│  │ Gráfico: Proyectos      │ │ Gráfico: Avance         │   │
│  │ por Estado (Torta)      │ │ por Carrera (Barras)    │   │
│  │                         │ │                         │   │
│  └─────────────────────────┘ └─────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Gráfico: Tendencia de Proyectos (Líneas)            │   │
│  │ Últimos 12 meses                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**KPIs del Dashboard:**

| KPI | Fórmula | Visualización |
|-----|---------|---------------|
| Total Proyectos | COUNT(proyectos) | Número grande |
| Proyectos Activos | COUNT(estado=EN_EJECUCION) | Número grande |
| % Avance Promedio | AVG(porcentaje_avance) | Barra de progreso |
| Convenios Vigentes | COUNT(estado=VIGENTE) | Número grande |
| Alertas Pendientes | COUNT(estado=PENDIENTE) | Badge |

**Gráficos:**

| Gráfico | Tipo | Datos |
|---------|------|-------|
| Proyectos por Estado | Dona | Distribución de estados |
| Avance por Carrera | Barras horizontales | % promedio por carrera |
| Tendencia Mensual | Líneas | Nuevos proyectos por mes |
| Presupuesto Ejecutado | Barras | Monto vs Ejecutado |

---

### 4.10 Pantalla: Gestión de Usuarios

**Descripción:** Administración de usuarios del sistema (Solo Admin/Coordinador)

**Layout similar a Lista de Proyectos**

**Columnas:**

| Columna | Descripción |
|---------|-------------|
| Código | Código institucional |
| Nombre | Nombre completo |
| Email | Correo electrónico |
| Carrera | Carrera asociada |
| Rol | Rol del usuario |
| Estado | Activo/Inactivo |
| Acciones | Ver, Editar, Activar/Desactivar |

**Filtros:**

| Filtro | Opciones |
|--------|----------|
| Rol | Todos, Admin, Coordinador, Docente, Estudiante, Directivo |
| Carrera | Todas las carreras |
| Estado | Todos, Activos, Inactivos |
| Búsqueda | Nombre, código, email |

---

### 4.11 Pantalla: Auditoría

**Descripción:** Log de acciones del sistema (Solo Admin)

**Columnas:**

| Columna | Descripción |
|---------|-------------|
| Fecha/Hora | Timestamp de la acción |
| Usuario | Quién realizó la acción |
| Acción | Tipo de acción (Crear, Actualizar, etc.) |
| Entidad | Tipo de entidad afectada |
| ID Entidad | ID del registro |
| IP | Dirección IP |
| Detalle | JSON con cambios |

---

## 5. Componentes UI

### 5.1 Botones

| Variante | Estilo | Uso |
|----------|--------|-----|
| **Primary** | Solid blue | Acciones principales (Crear, Guardar) |
| **Secondary** | Outline | Acciones secundarias (Cancelar, Volver) |
| **Danger** | Solid red | Eliminar, Cancelar |
| **Ghost** | Text only | Links, acciones menores |
| **Icon** | Solo icono | Acciones en tablas (Editar, Eliminar) |

**Tamaños:**

| Tamaño | Padding | Font Size |
|--------|---------|-----------|
| Small | 6px 12px | 12px |
| Medium | 8px 16px | 14px |
| Large | 12px 24px | 16px |

---

### 5.2 Formularios

**Componentes de formulario:**

| Componente | Uso |
|------------|-----|
| **Input Text** | Campos de texto cortos |
| **Textarea** | Campos de texto largos |
| **Select** | Selección de opciones |
| **Date Picker** | Selección de fecha |
| **Number Input** | Campos numéricos |
| **File Upload** | Subida de archivos |
| **Checkbox** | Opciones múltiples |
| **Radio** | Selección única |

**Estados de validación:**

| Estado | Borde | Icono | Mensaje |
|--------|-------|-------|---------|
| Default | Gray | - | - |
| Focus | Blue | - | - |
| Success | Green | ✅ | - |
| Error | Red | ❌ | Mensaje de error |
| Disabled | Gray light | - | - |

---

### 5.3 Tablas

**Características:**
- Encabezados fijos
- Ordenamiento por columnas
- Selección múltiple (checkboxes)
- Paginación integrada
- Acciones por fila
- Estado vacío (empty state)
- Loading state (skeleton)

---

### 5.4 Badges de Estado

| Estado | Color | Texto |
|--------|-------|-------|
| BORRADOR | Gray | Borrador |
| EN_REVISION | Yellow | En Revisión |
| APROBADO | Green | Aprobado |
| EN_EJECUCION | Blue | En Ejecución |
| EN_SUSPENSION | Orange | Suspendido |
| FINALIZADO | Purple | Finalizado |
| CERRADO | Gray | Cerrado |
| CANCELADO | Red | Cancelado |

---

### 5.5 Tarjetas (Cards)

**Tipos:**

| Tipo | Uso |
|------|-----|
| **KPI Card** | Métricas del dashboard |
| **Project Card** | Resumen de proyecto |
| **Alert Card** | Notificaciones |
| **Stat Card** | Estadísticas |

**Estructura KPI Card:**
```
┌─────────────────────────┐
│  📁                     │
│  Proyectos Activos      │
│  12                     │
│  ↑ 8% vs mes anterior  │
└─────────────────────────┘
```

---

### 5.6 Modales

**Tipos:**

| Tipo | Tamaño | Uso |
|------|--------|-----|
| **Confirm** | Small (400px) | Confirmar acciones |
| **Form** | Medium (600px) | Formularios simples |
| **Detail** | Large (800px) | Ver detalles completos |
| **Full** | Full width | Formularios complejos |

**Estructura:**
```
┌─────────────────────────────────────────┐
│  Título del Modal                    [X]│
├─────────────────────────────────────────┤
│                                         │
│  Contenido                              │
│                                         │
├─────────────────────────────────────────┤
│            [Cancelar] [Aceptar]         │
└─────────────────────────────────────────┘
```

---

### 5.7 Alertas y Notificaciones

**Tipos:**

| Tipo | Color | Icono | Uso |
|------|-------|-------|-----|
| **Success** | Green | ✅ | Operación exitosa |
| **Warning** | Yellow | ⚠️ | Advertencias |
| **Error** | Red | ❌ | Errores |
| **Info** | Blue | ℹ️ | Información |

**Posiciones:**
- Toast: Esquina superior derecha
- Inline: Dentro del formulario
- Banner: Parte superior de la página

---

### 5.8 Timeline

**Uso:** Historial de revisiones y cambios de estado

**Estructura:**
```
○ 15/05/2026 10:30 - Juan Pérez
  │  Enviado a revisión
  │  "Proyecto listo para evaluación"
  │
○ 16/05/2026 14:20 - María López
  │  Aprobado
  │  "Proyecto aprobado sin observaciones"
  │
● 17/05/2026 09:00 - Carlos Ruiz
     Inició ejecución
```

---

### 5.9 Barra de Progreso

**Uso:** Porcentaje de avance de actividades y proyectos

**Variantes:**
- Lineal (default)
- Circular (para KPIs)

**Colores:**
- 0-25%: Red
- 26-50%: Orange
- 51-75%: Yellow
- 76-100%: Green

---

## 6. Flujos de Navegación

### 6.1 Flujo de Login

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐
│  Login  │────►│ Validating  │────►│  Dashboard  │
│  Page   │     │ Credentials │     │  (Success)  │
└─────────┘     └─────────────┘     └─────────────┘
     │                │
     │                ▼
     │          ┌─────────────┐
     └─────────►│ Error Modal │
                └─────────────┘
```

### 6.2 Flujo de Creación de Proyecto

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Nuevo   │────►│  Paso 1  │────►│  Paso 2  │────►│  Paso 3  │
│ Proyecto │     │ Info Gen │     │ Objetivos│     │Actividad.│
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                       │
                                                       ▼
┌──────────┐     ┌──────────┐     ┌──────────────────────────┐
│  Lista   │◄────│  Paso 4  │◄────│  Revisar y Confirmar     │
│Proyectos │     │ Enviado  │     │                          │
└──────────┘     └──────────┘     └──────────────────────────┘
```

### 6.3 Flujo de Aprobación

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ BORRADOR │────►│EN_REVISION│───►│ APROBADO │
└──────────┘     └──────────┘     └──────────┘
     ▲                │                │
     │                ▼                ▼
     │          ┌──────────┐     ┌──────────┐
     └──────────│ RECHAZADO│     │EN_EJECUC│
                └──────────┘     └──────────┘
                                      │
                                      ▼
                                 ┌──────────┐
                                 │FINALIZADO│
                                 └──────────┘
```

---

## 7. Modelo de Datos (Referencia Visual)

### 7.1 Diagrama de Entidades Principal

```
┌─────────────────────────────────────────────────────────────────┐
│                         MÓDULO USUARIOS                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────┐       ┌───────────┐                              │
│  │  Carrera  │1────N│  Usuario  │                              │
│  │───────────│       │───────────│                              │
│  │ codigo    │       │ codigo    │                              │
│  │ nombre    │       │ rol       │                              │
│  │ facultad  │       │ activo    │                              │
│  └───────────┘       └─────┬─────┘                              │
└─────────────────────────────┼───────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                         MÓDULO PROYECTOS                        │
├─────────────────────────────┼───────────────────────────────────┤
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────┐     │
│  │                           │                           │     │
│  │  ┌───────────┐      ┌─────┴─────┐      ┌───────────┐ │     │
│  │  │ Presupuesto│1───1│  Proyecto │1────N│  Objetivo │ │     │
│  │  └───────────┘      │───────────│      └─────┬─────┘ │     │
│  │                     │ codigo    │            │       │     │
│  │                     │ titulo    │      ┌─────┴─────┐ │     │
│  │                     │ estado    │1────N│Indicador  │ │     │
│  │                     │ tipo      │      └───────────┘ │     │
│  │                     └─────┬─────┘                    │     │
│  │                           │                          │     │
│  │                     ┌─────┴─────┐                    │     │
│  │                     │           │                    │     │
│  │               ┌─────┴─────┐ ┌───┴───────┐           │     │
│  │               │Actividad  │ │Participante│           │     │
│  │               └─────┬─────┘ └───────────┘           │     │
│  │                     │                               │     │
│  └─────────────────────┼───────────────────────────────┘     │
└─────────────────────────┼─────────────────────────────────────┘
                          │
┌─────────────────────────┼─────────────────────────────────────┐
│                    MÓDULO SEGUIMIENTO                           │
├─────────────────────────┼─────────────────────────────────────┤
│                          │                                     │
│  ┌───────────┐     ┌─────┴─────┐     ┌───────────┐           │
│  │ Evidencia │◄────│  Avance   │     │  Informe  │           │
│  └───────────┘     └───────────┘     └───────────┘           │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 8. Estados y Transiciones

### 8.1 Estados de Proyecto

| Estado | Color | Acciones Disponibles |
|--------|-------|---------------------|
| **BORRADOR** | Gray | Editar, Enviar Revisión, Eliminar |
| **EN_REVISION** | Yellow | Aprobar, Rechazar |
| **APROBADO** | Green | Iniciar Ejecución |
| **EN_EJECUCION** | Blue | Suspender, Finalizar |
| **EN_SUSPENSION** | Orange | Reactivar (→ APROBADO) |
| **FINALIZADO** | Purple | Cerrar |
| **CERRADO** | Gray | Solo lectura |
| **CANCELADO** | Red | Solo lectura |

### 8.2 Estados de Convenio

| Estado | Color | Acciones Disponibles |
|--------|-------|---------------------|
| **BORRADOR** | Gray | Editar, Enviar Revisión |
| **EN_REVISION** | Yellow | Aprobar, Rechazar |
| **VIGENTE** | Green | Suspender, Finalizar |
| **VENCIDO** | Orange | Renovar |
| **SUSPENDIDO** | Orange | Reactivar |
| **FINALIZADO** | Purple | Solo lectura |
| **CANCELADO** | Red | Solo lectura |

### 8.3 Estados de Actividad

| Estado | Color | Acciones Disponibles |
|--------|-------|---------------------|
| **PENDIENTE** | Gray | Iniciar |
| **EN_PROCESO** | Blue | Completar, Cancelar |
| **COMPLETADA** | Green | Solo lectura |
| **ATRASADA** | Orange | Reanudar |
| **CANCELADA** | Red | Solo lectura |

### 8.4 Estados de Avance

| Estado | Color | Acciones Disponibles |
|--------|-------|---------------------|
| **PENDIENTE** | Gray | Enviar a Revisión |
| **EN_REVISION** | Yellow | Aprobar, Rechazar |
| **APROBADO** | Green | Solo lectura |
| **RECHAZADO** | Red | Corregir, Reenviar |

---

## 9. Guía de Roles y Permisos

### 9.1 Matriz de Permisos por Pantalla

| Pantalla | ADMIN | COORDINADOR | DOCENTE | ESTUDIANTE | DIRECTIVO |
|----------|-------|-------------|---------|------------|-----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Proyectos (Lista) | ✅ | ✅ | ✅ | ✅ (solo sus proyectos) | ✅ (solo lectura) |
| Proyectos (Crear) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Proyectos (Editar) | ✅ | ✅ | ✅ (solo sus proyectos) | ❌ | ❌ |
| Proyectos (Eliminar) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Proyectos (Aprobar) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Convenios | ✅ | ✅ | ❌ | ❌ | ✅ (solo lectura) |
| Seguimiento | ✅ | ✅ | ✅ | ✅ (registrar avances) | ✅ (solo lectura) |
| Reportes | ✅ | ✅ | ✅ | ❌ | ✅ |
| Usuarios | ✅ | ✅ | ❌ | ❌ | ❌ |
| Auditoría | ✅ | ❌ | ❌ | ❌ | ❌ |

### 9.2 Acciones por Rol

| Acción | ADMIN | COORDINADOR | DOCENTE | ESTUDIANTE |
|--------|-------|-------------|---------|------------|
| Crear proyecto | ✅ | ✅ | ✅ | ❌ |
| Editar proyecto propio | ✅ | ✅ | ✅ | ❌ |
| Editar cualquier proyecto | ✅ | ✅ | ❌ | ❌ |
| Enviar a revisión | ✅ | ✅ | ✅ | ❌ |
| Aprobar proyecto | ✅ | ✅ | ❌ | ❌ |
| Rechazar proyecto | ✅ | ✅ | ❌ | ❌ |
| Iniciar ejecución | ✅ | ✅ | ❌ | ❌ |
| Suspender proyecto | ✅ | ✅ | ❌ | ❌ |
| Finalizar proyecto | ✅ | ✅ | ❌ | ❌ |
| Crear actividad | ✅ | ✅ | ✅ | ❌ |
| Registrar avance | ✅ | ✅ | ✅ | ✅ |
| Subir evidencia | ✅ | ✅ | ✅ | ✅ |
| Aprobar avance | ✅ | ✅ | ❌ | ❌ |
| Crear convenio | ✅ | ✅ | ❌ | ❌ |
| Ver reportes | ✅ | ✅ | ✅ | ❌ |
| Gestionar usuarios | ✅ | ✅ | ❌ | ❌ |
| Ver auditoría | ✅ | ❌ | ❌ | ❌ |

---

## 10. Especificaciones Adicionales

### 10.1 Responsive Design

**Breakpoints:**

| Dispositivo | Ancho | Comportamiento |
|-------------|-------|----------------|
| Mobile | < 768px | Sidebar oculta, menú hamburguesa |
| Tablet | 768px - 1024px | Sidebar colapsada |
| Desktop | > 1024px | Sidebar expandida |

### 10.2 Accesibilidad

- Contraste mínimo: 4.5:1 (texto), 3:1 (grande)
- Navegación por teclado
- Labels en todos los formularios
- Alt text en imágenes
- Focus visible en elementos interactivos

### 10.3 Estados de Carga

| Estado | Componente |
|--------|------------|
| Loading | Skeleton screens |
| Empty | Empty state con ilustración |
| Error | Mensaje de error con retry |
| Success | Toast de confirmación |

---

*Documento de diseño para interfaces en Stitch*  
*Basado en: SDD.md, ESPECIFICACION-COMPLETA.md, constitution.md*  
*Última actualización: Junio 2026*
