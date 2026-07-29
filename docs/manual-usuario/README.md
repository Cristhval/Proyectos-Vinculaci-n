# Manual de Usuario

## Sistema de Gestión de Proyectos de Vinculación con la Sociedad

**Universidad Nacional de Loja**

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Acceso al Sistema](#2-acceso-al-sistema)
3. [Panel Principal (Dashboard)](#3-panel-principal-dashboard)
4. [Gestión de Proyectos](#4-gestión-de-proyectos)
5. [Gestión de Convenios](#5-gestión-de-convenios)
6. [Seguimiento de Actividades](#6-seguimiento-de-actividades)
7. [Evidencias](#7-evidencias)
8. [Informes](#8-informes)
9. [Alertas y Notificaciones](#9-alertas-y-notificaciones)
10. [Reportes y Estadísticas](#10-reportes-y-estadísticas)
11. [Formatos Institucionales](#11-formatos-institucionales)
12. [Administración (Admin)](#12-administración-admin)
13. [Auditoría](#13-auditoría)
14. [Preguntas Frecuentes](#14-preguntas-frecuentes)

---

## 1. Introducción

### ¿Qué es el sistema?

El **Sistema de Gestión de Proyectos de Vinculación con la Sociedad** es una plataforma web que le permite gestionar todo el ciclo de vida de los proyectos de vinculación universitaria: desde la creación y aprobación, hasta el seguimiento de actividades, la carga de evidencias y la generación de reportes.

### ¿Para quién es este manual?

Este manual está dirigido a todos los usuarios del sistema:

| Rol | ¿Quién lo usa? |
|:----|:----------------|
| **Administrador** | Personal de TI encargado de la configuración del sistema |
| **Coordinador** | Coordinadores académicos que revisan y aprueban proyectos |
| **Docente** | Profesores que crean y gestionan proyectos de vinculación |
| **Directivo** | Autoridades que monitorean indicadores institucionales |
| **Estudiante** | Alumnos que ejecutan actividades y suben evidencias |

### ¿Qué puede hacer con el sistema?

- Crear proyectos de vinculación usando la metodología de Marco Lógico
- Dar seguimiento a las actividades y avances
- Subir evidencias del trabajo realizado
- Gestionar convenios con instituciones externas
- Generar informes y reportes
- Visualizar estadísticas y dashboards
- Descargar formatos institucionales oficiales

---

## 2. Acceso al Sistema

### 2.1 Iniciar Sesión

1. Abra su navegador y acceda a la dirección del sistema
2. Verá la pantalla de inicio de sesión con el banner institucional
3. Ingrese su **correo electrónico institucional** y **contraseña**
4. Haga clic en **"Iniciar Sesión"**

```
┌─────────────────────────────────────────────┐
│          [Banner Institucional]              │
│                                             │
│       Universidad Nacional de Loja          │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │  Correo electrónico                 │   │
│   │  [___________________________]      │   │
│   │                                     │   │
│   │  Contraseña                         │   │
│   │  [___________________________]      │   │
│   │                                     │   │
│   │  [      Iniciar Sesión      ]       │   │
│   └─────────────────────────────────────┘   │
│                                             │
│        ¿No tiene cuenta? Registrarse        │
└─────────────────────────────────────────────┘
```

### 2.2 Registro de Usuario

Si no tiene una cuenta:

1. En la pantalla de inicio de sesión, haga clic en **"Registrarse"**
2. Complete el formulario con sus datos personales:
   - Nombres y apellidos
   - Correo electrónico institucional
   - Nombre de usuario
   - Contraseña (mínimo 8 caracteres)
   - Rol (Docente o Estudiante)
   - Cédula de identidad
   - Teléfono
   - Carrera a la que pertenece
3. Haga clic en **"Registrarse"**

> **Nota:** Si necesita una cuenta de Administrador o Coordinador, solicítela al administrador del sistema.

### 2.3 Cerrar Sesión

Para cerrar sesión de forma segura, haga clic en su nombre de usuario en la esquina superior derecha y seleccione **"Cerrar Sesión"**.

---

## 3. Panel Principal (Dashboard)

Al iniciar sesión, será redirigido al panel principal correspondiente a su rol.

### 3.1 Barra Lateral de Navegación

En el lado izquierdo de la pantalla encontrará el menú de navegación con las siguientes opciones (según su rol):

| Ícono | Opción | ¿Quién lo ve? |
|:------|:-------|:--------------|
| 📊 | Dashboard | Todos |
| 👥 | Usuarios | Admin |
| 📁 | Proyectos | Todos |
| 🤝 | Convenios | Todos |
| 📄 | Formatos | Todos |
| 🏢 | Instituciones | Admin |
| 🔔 | Alertas | Todos |
| 📈 | Reportes | Admin, Coordinador, Docente |
| 🛡️ | Auditoría | Admin |

### 3.2 Tarjetas de Resumen (Dashboard)

El panel principal muestra tarjetas con indicadores clave según su rol:

**Panel del Administrador:**
- Total de proyectos
- Total de convenios
- Usuarios registrados
- Alertas pendientes

**Panel del Coordinador:**
- Proyectos en revisión
- Proyectos aprobados
- Convenios vigentes
- Alertas activas

**Panel del Docente:**
- Mis proyectos activos
- Actividades pendientes
- Avances registrados
- Próximos vencimientos

**Panel del Estudiante:**
- Proyectos en los que participo
- Actividades asignadas
- Evidencias enviadas
- Próximas entregas

---

## 4. Gestión de Proyectos

### 4.1 Ver Lista de Proyectos

1. En el menú lateral, haga clic en **"Proyectos"**
2. Verá una tabla con todos los proyectos (o los suyos, según su rol)

**Estadísticas superiores:**
- Total de proyectos
- En ejecución
- En revisión
- Finalizados

**Filtros disponibles:**
- **Buscar**: Escriba el título o código del proyecto
- **Estado**: Borrador, En revisión, Aprobado, En ejecución, Suspendido, Finalizado, Cerrado, Cancelado
- **Tipo**: Vinculación, Investigación, Extensión, Mixto

**Columnas de la tabla:**
- Proyecto (código + título)
- Tipo
- Estado (badge de color)
- Responsable
- Fechas (inicio - fin)
- Acciones (Ver, Editar, Eliminar)

### 4.2 Crear un Nuevo Proyecto

> **¿Quién puede crear proyectos?** Administradores y Docentes.

1. En la lista de proyectos, haga clic en **"Nuevo Proyecto"**
2. Se abrirá un formulario de **7 pasos**. Complete cada paso:

#### Paso 1: Información General
- **Tipo de proyecto**: Vinculación, Investigación, Extensión o Mixto
- **Prioridad**: Baja, Media, Alta o Crítica
- **Período académico**: Seleccione el período
- **Título del proyecto**: Nombre descriptivo
- **Carreras participantes**: Seleccione hasta 5 carreras
- **Línea de intervención**
- **Resumen ejecutivo**: Breve descripción del proyecto
- **Descripción detallada**
- **Imagen representativa**: Arrastre una imagen o haga clic para seleccionar

> **Consejo:** Al hacer clic en "Siguiente" en el paso 1, el proyecto se guarda automáticamente como borrador. Puede retomarlo después desde la lista de proyectos.

#### Paso 2: Alineación Estratégica
- **Alineaciones**: Agregue los elementos estratégicos con los que se alinea el proyecto:
  - Eje estratégico
  - Objetivo estratégico
  - Programa
  - Plan
  - Línea de investigación
  - Programa de vinculación
  - Eje del Plan de Igualdad
  - Objetivos de Desarrollo Sostenible (ODS)
  - Plan Nacional de Desarrollo
  - Agenda Zonal
- **Instituciones participantes**: Busque en el catálogo o agregue una nueva

#### Paso 3: Diagnóstico
- **Problema**: Describa el problema que aborda el proyecto
- **Justificación**: Explique por qué es necesario el proyecto
- **Objetivo general**: El propósito principal del proyecto
- **Resultados esperados**: Lo que se espera lograr
- **Beneficiarios**: Agregue los grupos beneficiarios
  - Tipo: Directo o Indirecto
  - Nombre del grupo
  - Cantidad estimada
  - Ubicación geográfica
- **Viabilidad**: Análisis de factibilidad

#### Paso 4: Marco Lógico

Este es el paso más importante. Debe completar los 4 niveles:

1. **Fin**: El objetivo de desarrollo de más alto nivel
2. **Propósito**: El efecto directo del proyecto
3. **Componentes**: Los resultados o productos entregables
4. **Actividades**: Las acciones concretas para lograr cada componente

Para cada nivel, complete:
- **Resumen narrativo**: Descripción del nivel
- **Indicadores**: Cómo se medirá el cumplimiento
- **Medios de verificación**: Fuentes de información
- **Supuestos**: Condiciones externas necesarias

> Cada nivel se expande y colapsa como un acordeón. Complete uno a la vez.

#### Paso 5: Planificación
- **Fecha de inicio** y **Fecha de fin planificada**
- **Estrategias de ejecución**: Cómo se llevará a cabo
- **Seguimiento y evaluación**: Cómo se monitoreará
- **Presupuesto**:
  - UNL valorado (recursos de la universidad con costo)
  - UNL económico (recursos de la universidad sin costo)
  - Externo valorado (recursos externos con costo)
  - Externo económico (recursos externos sin costo)

#### Paso 6: Responsables
- **Responsable del proyecto**: Docente a cargo
- **Coordinador académico**: Coordinador que supervisa
- **Anexos**: Adjunte hasta 5 archivos (PDF, DOCX, XLSX, JPG, PNG, WebP)
  - Tamaño máximo: 10 MB por archivo
- **Datos del responsable**: Cédula, celular, cargo

#### Paso 7: Confirmación
- Revise el resumen de toda la información ingresada
- Marque la casilla de verificación: "He revisado toda la información y confirmo que es correcta"
- Elija una opción:
  - **"Guardar borrador"**: Guarda el proyecto como BORRADOR para editarlo después
  - **"Guardar y enviar a revisión"**: Guarda y envía el proyecto al coordinador para revisión

### 4.3 Ver Detalle de un Proyecto

1. En la lista de proyectos, haga clic en el ícono de **"Ver"** (👁️)
2. La página de detalle muestra:

**Encabezado:**
- Imagen de portada del proyecto
- Título, código, responsable, carrera
- Badges: tipo, estado (con animación de pulso), prioridad

**Barra de métricas:**
- Fecha de inicio y fin
- Presupuesto asignado
- Barra de progreso general (%)

**Botones de acción** (varían según el estado y su rol):
- **"Editar proyecto"**: Solo si está en BORRADOR y es el responsable
- **"Enviar a revisión"**: Envía de BORRADOR → EN_REVISION
- **"Aprobar"** / **"Rechazar"**: Visible para Coordinador cuando está EN_REVISION
- **"Iniciar ejecución"**: Activa el proyecto (APROBADO → EN_EJECUCION)
- **"Suspender"**: Pausa temporalmente el proyecto
- **"Reanudar"**: Reactiva un proyecto suspendido
- **"Finalizar proyecto"**: Marca como completado
- **"Cerrar proyecto"**: Cierre definitivo (solo Admin, desde FINALIZADO)
- **"Cancelar"**: Cancela el proyecto (solo Admin)

#### Contenido Principal

**Resumen** (columna izquierda):
- Descripción del proyecto
- Objetivo general
- Cronograma de actividades (timeline)

**Información clave** (columna derecha):
- Responsable
- Carrera
- Coordinador académico
- Total de participantes
- Actividades completadas
- Días restantes

#### Pestañas de Detalle

El detalle del proyecto se organiza en **5 pestañas**:

**1. Información**: Datos completos del proyecto
- Identificación (datos generales)
- Narrativa (resumen, problema, justificación, objetivo, resultados)
- Alineación estratégica
- Marco lógico (visualización tipo timeline)
- Beneficiarios (tabla con agregados por tipo)
- Estrategias de ejecución
- Firmas de responsabilidad
- Anexos (descargables)

**2. Actividades**: Gestión de actividades del proyecto
- Resumen por estado (tarjetas)
- Lista de actividades con progreso
- Botones: Agregar, Editar, Eliminar
- Haga clic en una actividad para ir a su detalle

**3. Participantes**: Personas involucradas en el proyecto
- Tabla con roles (Líder, Docente, Estudiante, Apoyo, Externo)
- Agregar participante: Busque usuarios, asigne rol, horas y estado
- Editar o eliminar participantes existentes

**4. Informes**: Reportes generados para el proyecto
- Lista de informes
- Botones: "Nuevo informe" y "Generar con IA"

**5. Historial**: Auditoría del proyecto
- Registro de todos los cambios realizados
- Quién, qué, cuándo

### 4.4 Cambiar el Estado de un Proyecto

Los cambios de estado se realizan mediante los botones de acción en la página de detalle:

| De | A | Botón | ¿Quién puede? |
|:---|:--|:------|:--------------|
| Borrador | En revisión | "Enviar a revisión" | Responsable, Admin |
| En revisión | Aprobado | "Aprobar" | Coordinador, Admin |
| En revisión | Borrador | "Rechazar" | Coordinador, Admin |
| Aprobado | En ejecución | "Iniciar ejecución" | Responsable, Admin |
| En ejecución | Suspendido | "Suspender" | Responsable, Admin |
| Suspendido | En ejecución | "Reanudar" | Responsable, Admin |
| En ejecución | Finalizado | "Finalizar proyecto" | Responsable, Admin |
| Finalizado | Cerrado | "Cerrar proyecto" | Admin |
| Cualquiera | Cancelado | "Cancelar" | Admin |

> **Importante:** Cada cambio de estado genera una notificación automática y queda registrado en la auditoría.

### 4.5 Editar un Proyecto

Solo puede editar proyectos en estado **BORRADOR** y si usted es el responsable (o es Admin).

1. En el detalle del proyecto, haga clic en **"Editar proyecto"**
2. Se abrirá el mismo formulario de 7 pasos con los datos actuales
3. Modifique lo necesario y guarde

### 4.6 Eliminar un Proyecto

> Solo el **Administrador** puede eliminar proyectos.

1. En la lista de proyectos, haga clic en el ícono de **"Eliminar"** (🗑️)
2. Confirme la eliminación en el modal de confirmación

---

## 5. Gestión de Convenios

### 5.1 Ver Lista de Convenios

1. En el menú lateral, haga clic en **"Convenios"**
2. Verá una tabla con todos los convenios registrados

**Estadísticas superiores:**
- Total de convenios
- Vigentes
- Por vencer (próximos 30 días)
- Vencidos

**Filtros disponibles:**
- **Buscar**: Código, objeto o contraparte
- **Estado**: Borrador, En revisión, Vigente, Vencido, Suspendido, Finalizado, Cancelado
- **Tipo**: Marco, Específico, Cooperación, Otro

**Columnas de la tabla:**
- Institución (avatar + nombre)
- Código
- Objeto
- Tipo
- Estado
- Vigencia (fechas con código de color)
- Proyectos vinculados
- Acciones

### 5.2 Crear un Nuevo Convenio

> **¿Quién puede crear convenios?** Administradores y Coordinadores.

1. En la lista de convenios, haga clic en **"Nuevo Convenio"**
2. Complete el formulario en 3 pasos:

#### Paso 1: Información General
- **Código**: Se genera automáticamente (CONV-AAAA-NNN). Puede ver una previsualización.
- **Tipo**: Marco, Específico, Cooperación u Otro
- **Institución**: Seleccione del catálogo o cree una nueva
- **Entidad contraparte**: Nombre de la entidad externa
- **Objeto**: Propósito del convenio
- **Descripción**: Detalles del acuerdo

#### Paso 2: Vigencia y Responsables
- **Fecha de suscripción**: Cuándo se firmó
- **Fecha de inicio**: Cuándo entra en vigor
- **Fecha de vencimiento**: Cuándo expira
- **Responsable UNL**: Coordinador a cargo
- **Observaciones**: Notas adicionales

#### Paso 3: Revisión y Confirmación
- Revise el resumen completo del convenio
- **Proyectos a vincular**: Seleccione los proyectos (aprobados/en ejecución) que se asocian a este convenio
- Marque la casilla de confirmación
- Elija: "Guardar borrador" o "Guardar y enviar a revisión"

### 5.3 Ver Detalle de un Convenio

El detalle del convenio muestra:

**Encabezado:**
- Banner con degradado verde
- Título (objeto del convenio), código, institución
- Badges: tipo y estado

**Barra de métricas:**
- Fecha de inicio y vencimiento
- Días restantes (con color: verde = normal, ámbar = < 30 días, rojo = vencido)
- Estado activo/inactivo

**Pestañas:**

1. **Información general**: Datos completos del convenio
2. **Compromisos**: Obligaciones de cada parte (agregar, editar, eliminar)
3. **Productos**: Entregables esperados
4. **Proyectos vinculados**: Proyectos asociados al convenio
5. **Historial**: Auditoría de cambios

### 5.4 Cambiar Estado de un Convenio

Los estados de un convenio siguen este flujo:

```
Borrador → En revisión → Vigente → Vencido (automático por fecha)
                                  → Suspendido
                                  → Finalizado
                                  → Cancelado
```

| Acción | Botón | ¿Quién? |
|:-------|:------|:--------|
| Enviar a revisión | "Enviar a revisión" | Admin, Coordinador |
| Activar/Aprobar | "Activar" | Admin, Coordinador |
| Suspender | "Suspender" | Admin, Coordinador |
| Reactivar | "Reactivar" | Admin, Coordinador |
| Finalizar | "Finalizar" | Admin, Coordinador |

---

## 6. Seguimiento de Actividades

### 6.1 Ver Actividades de un Proyecto

1. Abra el detalle de un proyecto
2. Vaya a la pestaña **"Actividades"**
3. Verá tarjetas con el resumen por estado y la lista de actividades

Cada actividad muestra:
- Código y nombre
- Descripción
- Responsable (nombre y avatar)
- Círculo de progreso (%)
- Fecha de inicio y fin
- Estado: Pendiente, En proceso, Completada, Atrasada, Cancelada

### 6.2 Ver Detalle de una Actividad

Haga clic en una actividad para ver su detalle completo:

- Nombre, código, descripción y estado
- Barra de progreso general
- Responsable
- Días restantes hasta la fecha fin

**Lista de avances registrados:**
- Cada avance muestra:
  - Autor y fecha
  - Estado (Pendiente, Aprobado, Rechazado)
  - Porcentaje acumulado
  - Descripción del avance
  - Horas invertidas
  - Dificultades y acciones correctivas (si las hay)

**Botones de aprobación** (visible para Docente/Admin):
- ✅ **Aprobar**: Aprueba el avance y actualiza el progreso de la actividad
- ❌ **Rechazar**: Requiere un motivo (mínimo 10 caracteres) que se mostrará al estudiante

### 6.3 Registrar un Avance

> **¿Quién puede registrar avances?** El responsable de la actividad o cualquier participante asignado.

1. En el detalle de la actividad, haga clic en **"Registrar avance"**
2. Complete el formulario:
   - **Descripción**: Mínimo 20 caracteres, máximo 500. Describa lo realizado.
   - **Horas invertidas**: Use los botones +/- para ajustar (incrementos de 0.5)
   - **¿Encontró dificultades?**: Active esta opción si tuvo problemas
     - **Dificultades encontradas**: Describa los obstáculos
     - **Acciones correctivas**: Qué se hizo para resolverlos (obligatorio si hay dificultades)
3. Haga clic en **"Guardar avance"**

> **Nota sobre el porcentaje:**
> - El primer avance registra automáticamente el **50%** de progreso
> - El segundo avance registra el **100%** de progreso
> - Esto sigue el modelo de seguimiento institucional de 2 avances por actividad

### 6.4 Actividades como Estudiante

Como estudiante, verá las actividades que le han sido asignadas:

- Las actividades asignadas a otros estudiantes se muestran en **"Solo lectura"** (con candado azul)
- Solo puede registrar avances en sus propias actividades
- Sus avances pueden ser aprobados o rechazados por el docente

---

## 7. Evidencias

### 7.1 Subir una Evidencia

Las evidencias son archivos que respaldan el trabajo realizado en una actividad.

1. En el detalle de la actividad, haga clic en **"Agregar evidencia"**
2. Seleccione el **tipo de evidencia**:
   - **Fotografía**: Imágenes del trabajo realizado
   - **Documento**: PDF, Word, Excel, etc.
   - **Video**: Archivo de video
   - **Enlace**: URL a un recurso externo
   - **Otro**: Cualquier otro tipo
3. Complete el formulario:
   - **Título**: Nombre descriptivo
   - **Archivo**: Arrastre un archivo o haga clic para seleccionarlo
     - Para tipo "Enlace", ingrese la URL en su lugar
   - **Descripción**: Detalle del contenido (opcional)
4. Haga clic en **"Subir evidencia"**

**Restricciones:**
- Tamaño máximo por archivo: 10 MB
- Formatos permitidos: imágenes, PDF, documentos, videos

### 7.2 Ver y Descargar Evidencias

En el detalle de la actividad, las evidencias se muestran en una cuadrícula:

- **Fotografías**: Vista previa en miniatura
- **Documentos**: Ícono de archivo con nombre y tamaño
- **Videos**: Ícono de video
- **Enlaces**: Ícono de enlace con URL
- **Otros**: Ícono genérico

Cada evidencia muestra:
- Tipo (ícono)
- Insignia de verificación (si está verificada)
- Título
- Fecha de subida
- Descripción

Acciones disponibles:
- 📥 **Descargar/Abrir**: Descarga el archivo o abre el enlace
- 🗑️ **Eliminar**: Elimina la evidencia (solo el autor o Admin)

---

## 8. Informes

### 8.1 Ver Informes de un Proyecto

1. Abra el detalle del proyecto
2. Vaya a la pestaña **"Informes"**
3. Verá la lista de informes generados

Cada informe muestra:
- Número de informe
- Título
- Tipo (badge de color): Inicial, Parcial, Final, Técnico, Financiero, Ejecutivo
- Insignia "IA" si fue generado con inteligencia artificial
- Estado, período y autor

### 8.2 Crear un Informe Manual

1. En la pestaña Informes, haga clic en **"Nuevo informe"**
2. Complete el formulario:
   - **Tipo de informe**: Seleccione entre las 6 opciones disponibles
   - **Título**: Nombre del informe
   - **Período**: Fecha de inicio y fin que cubre el informe
   - **Resumen ejecutivo**: Mínimo 100 caracteres. La barra de progreso le indica el avance.
   - **Contenido completo**: Desarrollo del informe
   - **Observaciones**: Notas adicionales (opcional)
3. Elija:
   - **"Guardar borrador"**: Guarda como PENDIENTE
   - **"Enviar a revisión"**: Guarda y envía para revisión

### 8.3 Generar Informe con Inteligencia Artificial

> **Nota:** Esta funcionalidad requiere configuración previa de la API de IA.

1. En la pestaña Informes, haga clic en **"Generar con IA"**
2. Configure el informe:

   **Paso 1 — Configuración:**
   - **Tipo de informe**: Inicial, Parcial, Final, Técnico, Financiero, Ejecutivo
   - **Atributos a incluir**: Active/desactive las secciones que desea:
     - Datos generales
     - Marco lógico
     - Avances
     - Evidencias
     - Participantes
     - Presupuesto
     - Dificultades
     - Conclusiones
     - Indicadores
     - Próximos pasos
   - **Tono**: Formal institucional, Técnico científico o Ejecutivo resumido
   - **Extensión**: 1 página, 2-3 páginas, o 4-6 páginas
   - **Instrucciones adicionales**: Indicaciones específicas (opcional)

   **Paso 2 — Vista previa de datos:**
   - El sistema analiza los datos disponibles en el proyecto
   - Muestra una puntuación de completitud y campos faltantes

   **Paso 3 — Generación:**
   - Espere mientras se genera el informe
   - La barra de progreso muestra el estado

   **Paso 4 — Revisión del resultado:**
   - Vista previa renderizada del informe
   - Panel lateral con estadísticas (palabras, secciones, páginas)
   - Acciones:
     - 📋 Copiar al portapapeles
     - 📥 Descargar como Word
     - 🔄 Regenerar
     - 💾 Guardar en el sistema

> Si la API de IA no está disponible, el sistema utiliza un motor de plantillas local para generar un informe institucional estructurado.

### 8.4 Estructura del Informe Institucional

Los informes generados siguen el formato oficial UNL:

1. Encabezado institucional (UNL, Coordinación de Vinculación)
2. Datos informativos del proyecto
3. Resumen ejecutivo
4. Avance de actividades (tabla)
5. Logros alcanzados
6. Dificultades y acciones correctivas
7. Indicadores de cumplimiento
8. Participación
9. Presupuesto ejecutado
10. Conclusiones
11. Recomendaciones
12. Firmas de responsabilidad

---

## 9. Alertas y Notificaciones

### 9.1 Ver Alertas

1. En el menú lateral, haga clic en **"Alertas"**
2. Verá el centro de notificaciones del sistema

**Estadísticas superiores:**
- Total de alertas
- Pendientes (con punto de pulso)
- Prioridad alta
- Próximas a vencer

**Filtros:**
- **Buscar**: Mensaje o detalle de la alerta
- **Prioridad**: Baja, Media, Alta, Urgente
- **Estado**: Pendiente, Leída, Atendida, Cancelada

**Tabla de alertas:**
- Código del proyecto/convenio relacionado
- Mensaje de la alerta + detalle
- Prioridad (badge de color con animación si está pendiente)
- Estado (badge)
- Fecha de creación
- Fecha de vencimiento (rojo si expirado, naranja si próximo)
- Acciones (Ver detalle, Marcar atendida)

### 9.2 Gestionar Alertas

**Ver detalle de una alerta:**
1. Haga clic en **"Ver detalle"**
2. Se abre un panel lateral con toda la información
3. Incluye botones para navegar al proyecto o convenio relacionado

**Marcar como leída:**
- Haga clic en el botón correspondiente en el detalle de la alerta

**Marcar como atendida:**
- Haga clic en **"Marcar atendida"** en la tabla o en el detalle

**Marcar todas como leídas** (solo Admin):
- Haga clic en el botón **"Marcar todas leídas"** en la parte superior

### 9.3 Tipos de Alertas

Las alertas se generan automáticamente por:
- Cambios de estado en proyectos y convenios
- Asignación de actividades
- Aprobación o rechazo de avances
- Vencimientos próximos
- Nuevos informes generados

---

## 10. Reportes y Estadísticas

> **¿Quién accede a reportes?** Administradores, Coordinadores y Docentes.

### 10.1 Dashboard de Reportes

1. En el menú lateral, haga clic en **"Reportes"**
2. Verá el panel de estadísticas con gráficas interactivas

**Elementos del dashboard ejecutivo:**
- **KPIs**: Indicadores clave de rendimiento
- **Gráfica de dona**: Distribución de proyectos por estado
- **Gráfica de barras horizontales**: Proyectos por carrera
- **Gráfica de columnas**: Avances mensuales
- **Sparklines**: Tendencias
- **Tablas**: Listados detallados con datos

**Filtros disponibles:**
- Carrera
- Estado
- Tipo de proyecto
- Período

### 10.2 Reportes por Docente

Los docentes tienen su propio panel de reportes con estadísticas de sus proyectos:

- Distribución de proyectos por estado
- Estado de actividades
- Participantes por rol
- Resumen de presupuesto

### 10.3 Exportar Reportes

**Exportar a PDF:**
1. Configure los filtros deseados
2. Haga clic en **"Exportar PDF"**
3. Se descargará un PDF con las gráficas y datos del dashboard

**Exportar a Excel:**
1. Configure los filtros deseados
2. Haga clic en **"Exportar Excel"**
3. Se descargará un archivo .xlsx con los datos tabulares

---

## 11. Formatos Institucionales

### 11.1 Ver Formatos Disponibles

1. En el menú lateral, haga clic en **"Formatos"**
2. Verá la biblioteca de formatos institucionales de la UNL

Los formatos están organizados por:
- **Nivel**: Pregrado, Posgrado
- **Tipo**: Guía, Formulación, Avance, Final

### 11.2 Descargar un Formato

1. Busque el formato que necesita
2. Haga clic en el botón de descarga
3. El archivo se descargará a su computadora

### 11.3 Subir un Nuevo Formato (Admin/Coordinador)

1. Haga clic en **"Subir formato"**
2. Seleccione el nivel y tipo
3. Adjunte el archivo
4. Haga clic en **"Subir"**

---

## 12. Administración (Admin)

> **Este módulo solo está disponible para Administradores.**

### 12.1 Gestión de Usuarios

1. En el menú lateral, haga clic en **"Usuarios"**
2. Verá la lista de todos los usuarios del sistema

**Acciones disponibles:**
- **Ver**: Detalle del usuario (datos personales, rol, carrera)
- **Crear**: Registrar un nuevo usuario
- **Editar**: Modificar datos y rol
- **Eliminar**: Dar de baja un usuario

**Columnas de la tabla:**
- Nombre completo
- Correo electrónico
- Rol (badge de color)
- Carrera
- Estado (activo/inactivo)
- Fecha de registro
- Acciones

### 12.2 Gestión de Instituciones

1. En el menú lateral, haga clic en **"Instituciones"**
2. Administre el catálogo de instituciones externas

**Acciones:**
- **Crear**: Agregar nueva institución (nombre, siglas, tipo, contacto, dirección)
- **Editar**: Modificar datos de la institución
- **Ver detalle**: Información completa y convenios asociados
- **Eliminar**: Quitar del catálogo

---

## 13. Auditoría

> **Solo disponible para Administradores.**

### 13.1 Acceder a la Auditoría

1. En el menú lateral, haga clic en **"Auditoría"**
2. Verá el registro completo de todas las acciones del sistema

### 13.2 Consultar el Registro

La tabla de auditoría muestra:

| Columna | Descripción |
|:--------|:------------|
| Usuario | Quién realizó la acción |
| Acción | CREAR, ACTUALIZAR, ELIMINAR, APROBAR, RECHAZAR, INICIAR_SESION |
| Modelo | Entidad afectada (Proyecto, Convenio, Usuario, etc.) |
| Registro | Identificador del recurso modificado |
| Detalle | Valores anteriores y nuevos (en actualizaciones) |
| Fecha | Fecha y hora exacta |
| IP | Dirección IP del usuario |

**Filtros disponibles:**
- Buscar por usuario, acción o modelo
- Rango de fechas
- Exportar a Excel para análisis externo

---

## 14. Preguntas Frecuentes

### 14.1 ¿Olvidé mi contraseña?

Contacte al administrador del sistema para restablecer su contraseña.

### 14.2 ¿Puedo editar un proyecto después de enviarlo a revisión?

No. Una vez enviado a revisión (estado EN_REVISION), no puede editarse. Si el coordinador lo rechaza, vuelve a BORRADOR y puede editarlo nuevamente.

### 14.3 ¿Por qué no puedo aprobar/rechazar proyectos?

Solo los usuarios con rol de **Coordinador** o **Administrador** pueden aprobar o rechazar proyectos. Si usted es Docente, debe enviar el proyecto a revisión para que el coordinador lo evalúe.

### 14.4 ¿Qué significan los colores de los estados?

| Color | Significado |
|:------|:------------|
| Gris | Borrador — en formulación |
| Azul | En revisión — siendo evaluado |
| Verde | Aprobado / Vigente / Completado — activo |
| Naranja | Suspendido — temporalmente pausado |
| Rojo | Cancelado / Rechazado / Vencido — inactivo |
| Morado | Finalizado — completado |
| Verde oscuro | Cerrado — ciclo terminado |

### 14.5 ¿Cómo sé si una actividad está vencida?

Las actividades con fecha de fin anterior a hoy y estado Pendiente o En proceso se muestran con estado **Atrasada** y un indicador visual de alerta.

### 14.6 ¿Cuántos avances debo registrar por actividad?

El sistema está configurado para **2 avances por actividad**:
- Avance 1: 50% de progreso
- Avance 2: 100% de progreso

### 14.7 ¿Cuántos archivos puedo subir como anexo a un proyecto?

Máximo **5 archivos**, cada uno de hasta **10 MB**. Formatos permitidos: PDF, DOCX, XLSX, JPG, PNG, WebP.

### 14.8 ¿Qué hago si aparece "No autorizado"?

Significa que su sesión ha expirado o no tiene permisos para esa acción. Intente:
1. Cerrar sesión y volver a iniciar
2. Verificar que tiene el rol adecuado para la acción
3. Contactar al administrador si el problema persiste

### 14.9 ¿Puedo usar el sistema en mi celular?

Sí. El sistema tiene un diseño **responsivo** que se adapta a pantallas de escritorio, tablet y teléfono móvil.

### 14.10 ¿Dónde encuentro ayuda adicional?

- Contacte al administrador del sistema
- Consulte la [Documentación de la API](http://127.0.0.1:8000/api/docs/)
- Revise la [Guía del Desarrollador](guia-desarrollador/README.md)

---

## Apéndice: Atajos y Consejos

### Atajos de Navegación

| Ubicación | Cómo llegar rápido |
|:----------|:-------------------|
| Mis proyectos | Menú lateral → Proyectos |
| Proyecto específico | Proyectos → Buscar por código o título → Ver |
| Registrar avance | Proyecto → Actividades → Clic en actividad → Registrar avance |
| Mis alertas | Menú lateral → Alertas (ícono de campana con contador) |
| Descargar formato | Menú lateral → Formatos → Clic en descargar |

### Consejos Útiles

1. **Guarde como borrador frecuentemente** al crear proyectos. Use "Guardar borrador" para no perder el progreso.
2. **Complete el marco lógico con cuidado**. Es la base de todo el seguimiento posterior.
3. **Suba evidencias regularmente**. No espere al final para documentar el trabajo.
4. **Revise sus alertas**. El sistema le notifica sobre vencimientos y acciones pendientes.
5. **Use los filtros** en las tablas para encontrar rápidamente lo que busca.
6. **Exporte reportes** antes de reuniones importantes para tener datos actualizados.
7. **Verifique la pestaña Historial** de un proyecto para entender qué cambios se han realizado.

---

**Documento actualizado: Julio 2026**
**Versión del sistema: 1.0.0**

*Desarrollado para la Universidad Nacional de Loja — Carrera de Ingeniería en Sistemas Computacionales*
