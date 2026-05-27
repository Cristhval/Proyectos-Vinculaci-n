# Especificación Completa - Sistema de Vinculación UNL

**Versión:** 1.0.0  
**Última actualización:** Mayo 2026  
**Contacto:** Coordinación de Vinculación - vinculacion@unl.edu.ec

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Modelo de Dominio](#3-modelo-de-dominio)
4. [API REST](#4-api-rest)
5. [Workflows y Ciclos de Vida](#5-workflows-y-ciclos-de-vida)
6. [Decisiones de Arquitectura](#6-decisiones-de-arquitectura)

---

## 1. Introducción

### 1.1 Propósito

Plataforma centralizada para gestión, monitoreo y evaluación de proyectos de vinculación y convenios interinstitucionales de la Universidad Nacional de Loja.

### 1.2 Alcance

El sistema permite:
- Formular, revisar, aprobar y ejecutar proyectos de vinculación
- Gestionar convenios interinstitucionales y sus compromisos
- Registrar avances, evidencias e informes de actividades
- Monitorear indicadores y presupuestarios
- Generar reportes y dashboards con KPIs
- Notificar alertas y vencimientos

### 1.3 Actores del Sistema

| Actor | Descripción |
|-------|-------------|
| **Docente** | Director o responsable de proyecto, formula y supervisa |
| **Estudiante** | Participante en actividades, registra avances y evidencias |
| **Coordinador** | Coordinación de Vinculación, aprueba y valida proyectos |
| **Administrador** | Gestión institucional y configuración del sistema |

---

## 2. Arquitectura del Sistema

### 2.1 Modelo C4

#### Nivel 1 - Contexto

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Docente   │────►│  Vinculación UNL │◄────│ Coordinador │
└─────────────┘     └────────┬─────────┘     └─────────────┘
                             │
┌─────────────┐     ┌────────┴─────────┐     ┌─────────────┐
│ Estudiante  │────►│                  │◄────│  Admin      │
└─────────────┘     │  Integraciones   │     └─────────────┘
                    │  - Auth UNL      │
                    │  - Google Drive  │
                    │  - Firebase      │
                    └──────────────────┘
```

#### Nivel 2 - Contenedores

| Contenedor | Tecnología | Descripción |
|------------|------------|-------------|
| **React SPA Frontend** | React 18, TypeScript, Redux, Bootstrap | Interfaz web administrativa |
| **Aplicación Móvil** | Flutter o React Native | Seguimiento operativo y evidencias en campo |
| **Django REST API** | Django 6.0, DRF 3.17.1, SimpleJWT | API REST con lógica de negocio |
| **Base de Datos** | SQLite (dev) / PostgreSQL 14 (prod) | Almacenamiento relacional |
| **Admin Django** | Django Admin | Panel administrativo |
| **Email Service** | Celery, SendGrid SMTP | Envío de notificaciones |

#### Nivel 3 - Componentes Django API

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Router    │───►│  Permisos   │───►│  ViewSets   │
│  URL + JWT  │    │    RBAC     │    │ (Control.)  │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                             │
                                             ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Modelos    │◄───│Serializadores│◄───│   Filtros   │
│   (ORM)     │    │   (JSON)    │    │ + Paginación│
└─────────────┘    └─────────────┘    └─────────────┘
```

### 2.2 Apps del Sistema

| App | Responsabilidad |
|-----|----------------|
| `core` | Modelo base TimeStampedModel, utilidades, permisos |
| `usuarios` | Gestión de usuarios, carreras, autenticación |
| `proyectos` | Proyectos, objetivos, indicadores, actividades, participantes, presupuesto |
| `convenios` | Instituciones, convenios, compromisos, productos, contribuciones |
| `seguimiento` | Avances, evidencias, informes, alertas, revisiones, flujos de validación |
| `reportes` | Dashboard, reportes por filtros, KPIs |
| `auditoria` | Registro de auditoría y trazabilidad |

### 2.3 Integraciones Externas

| Sistema | Propósito |
|---------|-----------|
| **Auth UNL** | Autenticación institucional (LDAP, OAuth2) |
| **Google OAuth2** | Proveedor de identidad para Google Drive |
| **Google Drive** | Almacenamiento de documentos en la nube |
| **Firebase Cloud Messaging** | Notificaciones Push a dispositivos móviles |

---

## 3. Modelo de Dominio

### 3.1 Entidades Principales

#### Usuarios

**Carrera**
- `codigo`: CharField(30) unique - Código de la carrera
- `nombre`: CharField(255) - Nombre de la carrera
- `facultad`: CharField(255) - Facultad a la que pertenece
- `descripcion`: TextField - Descripción
- `activa`: BooleanField - Estado activo/inactivo

**Usuario**
- `user`: OneToOneField(User) - Usuario base de Django
- `codigo`: CharField(30) unique - Código institucional
- `documento_identidad`: CharField(20) unique - Cédula/pasaporte
- `carrera`: FK(Carrera) - Carrera a la que pertenece
- `rol`: CharField(RolUsuario) - ADMIN, COORDINADOR, DOCENTE, ESTUDIANTE, DIRECTIVO
- `telefono`: CharField(20) - Teléfono de contacto
- `direccion`: CharField(255) - Dirección
- `fecha_nacimiento`: DateField - Fecha de nacimiento
- `biografia`: TextField - Biografía
- `activo`: BooleanField - Estado activo/inactivo

#### Proyectos

**Proyecto (Entidad Central)**
- `codigo`: CharField(40) unique - Código del proyecto
- `titulo`: CharField(255) - Título
- `resumen`: TextField - Resumen ejecutivo
- `descripcion`: TextField - Descripción detallada
- `problema`: TextField - Planteamiento del problema
- `justificacion`: TextField - Justificación
- `objetivo_general`: TextField - Objetivo general
- `resultados_esperados`: TextField - Resultados esperados
- `linea_intervencion`: CharField(255) - Línea de intervención
- `tipo`: CharField(TipoProyecto) - VINCULACION, INVESTIGACION, EXTENSION, MIXTO
- `prioridad`: CharField(PrioridadProyecto) - BAJA, MEDIA, ALTA, CRITICA
- `estado`: CharField(EstadoProyecto) - BORRADOR, EN_REVISION, APROBADO, EN_EJECUCION, EN_SUSPENSION, FINALIZADO, CERRADO, CANCELADO
- `carrera`: FK(Carrera) - Carrera responsable
- `responsable`: FK(Usuario) - Responsable del proyecto
- `coordinador_academico`: FK(Usuario) - Coordinador académico
- `fecha_inicio`: DateField - Fecha de inicio
- `fecha_fin_planificada`: DateField - Fecha fin planificada
- `fecha_fin_real`: DateField - Fecha fin real
- `presupuesto_aprobado`: DecimalField - Presupuesto aprobado
- `direccion_ejecucion`: CharField(255) - Lugar de ejecución
- `observaciones`: TextField - Observaciones
- `activo`: BooleanField - Proyecto activo

**Objetivo**
- FK a Proyecto (CASCADE)
- `tipo`: GENERAL, ESPECIFICO
- `orden`, `descripcion`, `meta`, `cumplido`, `fecha_cumplimiento`, `observaciones`

**Indicador**
- FK a Objetivo (CASCADE)
- `codigo`, `nombre`, `descripcion`, `formula`, `unidad_medida`
- `linea_base`, `meta`, `valor_actual`
- `frecuencia`: DIARIA, SEMANAL, MENSUAL, TRIMESTRAL, SEMESTRAL, ANUAL
- `estado`: ACTIVO, EN_ALERTA, CUMPLIDO, NO_CUMPLIDO
- `fecha_medicion`, `observaciones`

**Actividad**
- FK a Proyecto (CASCADE), FK a Objetivo (SET_NULL)
- `codigo`, `nombre`, `descripcion`
- `fechas`, `responsable`, `porcentajes`, `estado`, `orden`
- `requiere_evidencia`, `observaciones`

**ParticipanteProyecto**
- FK a Proyecto (CASCADE), FK a Usuario (CASCADE)
- `rol`: LIDER, DOCENTE, ESTUDIANTE, APOYO, EXTERNO
- `fechas`, `horas_comprometidas`, `horas_cumplidas`, `estado`, `observaciones`
- unique_together: (proyecto, usuario, rol)

**Presupuesto**
- OneToOneField a Proyecto (CASCADE)
- `codigo`, `montos`, `estado`, `responsable`, `fecha_aprobacion`, `observaciones`

**Beneficiario**
- FK a Proyecto (CASCADE)
- `tipo`: DIRECTO, INDIRECTO
- `nombre`, `descripcion`, `cantidad_estimada`, `ubicacion`, `observaciones`

**AlineacionEstrategica**
- FK a Proyecto (CASCADE)
- `eje`, `objetivo_estrategico`, `programa`, `plan`, `descripcion`

**FirmaResponsabilidad**
- FK a Proyecto (CASCADE), FK a Usuario (CASCADE)
- `tipo`: RESPONSABLE, COORDINADOR, APROBADOR
- `fecha_firma`, `comentario`
- unique_together: (proyecto, usuario, tipo)

#### Convenios

**Institucion**
- `nombre`, `sigla`, `descripcion`, `direccion`, `telefono`, `email`, `sitio_web`, `activa`

**Convenio**
- FK a Institucion (SET_NULL)
- `codigo`, `entidad_contraparte`, `objeto`, `descripcion`
- `fechas`, `tipo`: MARCO, ESPECIFICO, COOPERACION, OTRO
- `estado`: BORRADOR, EN_REVISION, VIGENTE, VENCIDO, SUSPENDIDO, FINALIZADO, CANCELADO
- `archivo_firmado`, `observaciones`, `activo`

**ProyectoConvenio (Intermedia)**
- FK a Proyecto, FK a Convenio
- `fecha_vinculacion`, `vigente`, `observaciones`
- unique_together: (proyecto, convenio)

**Compromiso**
- FK a Convenio (CASCADE)
- `codigo`, `descripcion`, `fechas`, `responsable`
- `estado`: PENDIENTE, EN_PROCESO, CUMPLIDO, INCUMPLIDO
- `observaciones`
- unique_together: (convenio, codigo)

**Producto**
- FK a Convenio (CASCADE)
- `codigo`, `nombre`, `descripcion`, `tipo`
- `fecha_entrega_esperada`, `fecha_entrega_real`
- `entregado`, `archivo`, `observaciones`
- unique_together: (convenio, codigo)

**Contribucion**
- FK a Proyecto (CASCADE), FK a Institucion (SET_NULL)
- `tipo`: FINANCIERO, HORAS, INFRAESTRUCTURA, EQUIPO, SERVICIO, EXTERNO
- `descripcion`, `valor`, `fecha_aporte`, `observaciones`

#### Seguimiento

**Avance**
- FK a Actividad (CASCADE)
- `registrado_por` (FK Usuario), `porcentaje_avance`, `descripcion`
- `dificultades`, `acciones_correctivas`, `horas_invertidas`
- `fecha_registro`, `estado`: PENDIENTE, EN_REVISION, APROBADO, RECHAZADO

**Evidencia**
- FK a Avance (CASCADE/null), FK a Actividad (CASCADE/null)
- `tipo`: FOTOGRAFIA, VIDEO, DOCUMENTO, ENLACE, OTRO
- `titulo`, `descripcion`, `archivo`, `enlace_externo`, `fecha_carga`, `verificada`

**Informe**
- FK a Proyecto (CASCADE)
- `tipo`: INICIAL, PARCIAL, FINAL, TECNICO, FINANCIERO
- `numero`, `titulo`, `resumen`, `contenido`
- `periodo`, `elaborado_por`, `aprobado_por`, `estado`
- `archivo`, `fecha_emision`, `observaciones`
- unique_together: (proyecto, tipo, numero)

**Alerta**
- FK a Usuario (CASCADE), FK a Proyecto (CASCADE/null), FK a Convenio (CASCADE/null)
- `mensaje`, `detalle`, `prioridad`, `estado`, `enlace`, `leida`, `fecha_vencimiento`

**Revision**
- FK a Proyecto (CASCADE), FK a Usuario (revisor)
- `fecha_revision`, `decision`: APROBADO, OBSERVADO, RECHAZADO
- `comentario`, `observaciones`

**FlujoValidacion**
- FK a Proyecto (CASCADE), FK a Usuario (responsable)
- `paso`, `nombre_paso`, `estado`: PENDIENTE, COMPLETADO, RECHAZADO
- `fecha_completado`, `comentario`

#### Auditoría

**Auditoria**
- FK a Usuario (SET_NULL)
- `accion`: CREAR, ACTUALIZAR, ELIMINAR, APROBAR, RECHAZAR, INICIAR_SESION
- `entidad`, `entidad_id`, `detalle`, `ip_address`

### 3.2 Diagrama Entidad-Relación

```
┌─────────────────┐       ┌─────────────────┐
│    Carrera       │       │   Institucion   │
│  ─────────────   │       │  ─────────────  │
│  + codigo        │       │  + nombre       │
│  + nombre        │       │  + sigla        │
│  + facultad      │       │  + email        │
│  + activa        │       │  + activa       │
└────────┬─────────┘       └────────┬────────┘
         │ 1:N                      │ 1:N
         ▼                          ▼
┌─────────────────┐       ┌─────────────────┐
│    Usuario       │       │    Convenio     │
│  ─────────────   │       │  ─────────────  │
│  + codigo        │       │  + codigo       │
│  + rol           │       │  + objeto       │
│  + activo        │       │  + estado       │
└──┬───────┬───────┘       │  + fechas       │
   │       │               └──┬──────┬───────┘
   │       │                  │ 1:N  │ 1:N
   │       │         ┌────────┘      └────────┐
   │       │         ▼                        ▼
   │       │  ┌──────────────┐    ┌─────────────────┐
   │       │  │  Compromiso  │    │    Producto     │
   │       │  │──────────────│    │─────────────────│
   │       │  │ + codigo     │    │ + codigo        │
   │       │  │ + estado     │    │ + entregado     │
   │       │  │ + fechas     │    │ + fechas        │
   │       │  └──────────────┘    └─────────────────┘
   │       │
   │       │    ┌──────────────────┐
   │       ├───►│  Proyecto        │◄──────────────────┐
   │       │    │──────────────────│                    │
   │       │    │ + codigo         │────── 1:1 ────────┤ Presupuesto
   │       │    │ + titulo         │                    │
   │       │    │ + estado         │────── 1:N ────────┤ Objetivo ──► Indicador
   │       │    │ + tipo           │                    │
   │       │    │ + fechas         │────── 1:N ────────┤ Actividad ──► Avance ──► Evidencia
   │       │    └──┬───────┬───────┘                    │
   │       │       │       │                           │ Beneficiario (NUEVO)
   │       │       │       │                           │
   │       │       │       └─────────┬─────────────────┤ AlineacionEstrategica (NUEVO)
   │       │       │                 │                 │
   │       │       │       ┌─────────┴──────────┐      │ FirmaResponsabilidad (NUEVO)
   │       │       │       │ ProyectoConvenio   │      │
   │       │       │       │────────────────────│      │ ParticipanteProyecto
   │       │       │       │ + fecha_vinculacion│      │
   │       │       │       │ + vigente          │      │ Informe
   │       │       │       └────────────────────┘      │
   │       │       │                                   │ Contribucion (NUEVO)
   │       │       │                                   │
   │       │       │         ┌──────────────────┐      │
   │       │       └────────►│  Revision (NUEVO)│      │
   │       │                 │──────────────────│      │
   │       │                 │ + decision       │      │
   │       │                 │ + comentario     │      │
   │       │                 └──────────────────┘      │
   │       │                                           │
   │       │         ┌──────────────────┐              │
   │       └────────►│FlujoValidacion   │              │
   │                 │  (NUEVO)         │              │
   │                 │ + paso           │              │
   │                 │ + estado         │              │
   │                 └──────────────────┘              │
   │                                                   │
   │         ┌──────────────────┐                      │
   └────────►│     Alerta       │──────────────────────┘
              │──────────────────│
              │ + mensaje        │
              │ + prioridad      │
              │ + estado         │
              └──────────────────┘

┌──────────────────────┐
│    Auditoria (NUEVO) │
│──────────────────────│
│ + usuario            │
│ + accion             │
│ + entidad            │
│ + entidad_id         │
│ + ip_address         │
└──────────────────────┘
```

### 3.3 Máquinas de Estado

#### Proyecto

```
BORRADOR ──► EN_REVISION ──► APROBADO ──► EN_EJECUCION ──► FINALIZADO ──► CERRADO
    ▲             │               ▲              │
    │             ▼               │              ▼
    └────── (rechazar)            │         EN_SUSPENSION ──► (aprobar) ──► APROBADO
                                  │
                            CANCELADO (desde cualquier estado)
```

| Desde | Acción | Hasta |
|-------|--------|-------|
| BORRADOR | enviar_revision | EN_REVISION |
| EN_REVISION | aprobar | APROBADO |
| EN_REVISION | rechazar | BORRADOR |
| APROBADO | iniciar_ejecucion | EN_EJECUCION |
| EN_EJECUCION | suspender | EN_SUSPENSION |
| EN_SUSPENSION | aprobar | APROBADO |
| EN_EJECUCION | finalizar | FINALIZADO |
| FINALIZADO | cerrar | CERRADO |
| * | cancelar | CANCELADO |

#### Convenio

```
BORRADOR ──► EN_REVISION ──► VIGENTE ──► FINALIZADO
    ▲                            │
    │                            ▼
    └────── (rechazar)      VENCIDO / SUSPENDIDO
```

#### Actividad

```
PENDIENTE ──► EN_PROCESO ──► COMPLETADA
                  │
                  ▼
              ATRASADA / CANCELADA
```

---

## 4. API REST

### 4.1 Autenticación

La API usa JWT (JSON Web Tokens). Para autenticarse:
1. POST `/api/v1/auth/login/` con username y password
2. Usar el token `access` en el header: `Authorization: Bearer <token>`
3. Renovar con POST `/api/v1/auth/refresh/`

### 4.2 Endpoints Principales

#### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/auth/register/` | Registrar nuevo usuario |
| POST | `/api/v1/auth/login/` | Iniciar sesión |
| POST | `/api/v1/auth/refresh/` | Renovar token de acceso |

#### Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/usuarios/` | Listar usuarios |

#### Proyectos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/proyectos/` | Listar proyectos (con filtros, búsqueda y ordenamiento) |
| POST | `/api/v1/proyectos/` | Crear proyecto |
| GET | `/api/v1/proyectos/{id}/` | Obtener detalle de proyecto |
| POST | `/api/v1/proyectos/{id}/enviar-revision/` | Enviar proyecto a revisión |
| POST | `/api/v1/proyectos/{id}/aprobar/` | Aprobar proyecto |
| POST | `/api/v1/proyectos/{id}/rechazar/` | Rechazar proyecto (devuelve a borrador) |
| POST | `/api/v1/indicadores/{id}/medir/` | Registrar medición de indicador |

**Parámetros de consulta para GET /proyectos/:**
- `estado`: BORRADOR, EN_REVISION, APROBADO, EN_EJECUCION, EN_SUSPENSION, FINALIZADO, CERRADO, CANCELADO
- `tipo`: VINCULACION, INVESTIGACION, EXTENSION, MIXTO
- `carrera`: ID de carrera (integer)
- `search`: Busca por código, título, descripción, responsable
- `ordering`: Ordenar por (codigo, titulo, estado, creado_en, fecha_inicio). Prefijo `-` para descendente.

#### Convenios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/convenios/` | Listar convenios |

**Parámetros de consulta:**
- `estado`: Estado del convenio
- `tipo`: Tipo de convenio
- `search`: Búsqueda textual

#### Seguimiento

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/avances/{id}/aprobar/` | Aprobar avance |
| POST | `/api/v1/avances/{id}/rechazar/` | Rechazar avance |
| POST | `/api/v1/alertas/{id}/leer/` | Marcar alerta como leída |
| POST | `/api/v1/alertas/{id}/atender/` | Marcar alerta como atendida |

#### Reportes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/` | Dashboard con KPIs generales |
| GET | `/api/v1/reportes/proyectos/` | Reporte de proyectos con filtros |
| GET | `/api/v1/reportes/progreso/` | Reporte de progreso de actividades |

### 4.3 Esquema OpenAPI

La documentación completa está disponible en:
- **Swagger UI:** `http://localhost:8000/api/docs/`
- **ReDoc:** `http://localhost:8000/api/redoc/`

---

## 5. Workflows y Ciclos de Vida

### 5.1 Flujo de Aprobación de Proyectos

#### Descripción

El flujo de aprobación permite que un proyecto pase de borrador a aprobado mediante un proceso de revisión y análisis de pertinencia.

#### Pasos del Flujo

**1. Formulación (BORRADOR)**
- El responsable crea el proyecto y completa toda la información
- Adjunta documentos, anexos y firmas de responsabilidad
- Envía a revisión

**2. Revisión (EN_REVISION)**
- La Coordinación de Vinculación revisa el proyecto
- Se registran observaciones (modelo `Revision`)
- Se generan pasos de validación (modelo `FlujoValidacion`)
- Decisión: APROBADO, OBSERVADO o RECHAZADO

**3. Corrección (si fue OBSERVADO)**
- El proyecto vuelve a BORRADOR
- El responsable corrige las observaciones
- Re-envía a revisión

**4. Aprobación (APROBADO)**
- La autoridad competente aprueba el proyecto
- Se registra la firma de aprobación
- El proyecto queda listo para ejecución

#### Endpoints del Flujo

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/proyectos/{id}/enviar-revision/` | Envía proyecto a revisión |
| POST | `/api/v1/proyectos/{id}/aprobar/` | Aprueba el proyecto |
| POST | `/api/v1/proyectos/{id}/rechazar/` | Devuelve a borrador |
| GET/POST | `/api/v1/revisiones/` | CRUD de revisiones |
| GET/POST | `/api/v1/flujos-validacion/` | CRUD de flujo de validación |

#### Reglas de Negocio

- Solo BORRADOR puede enviarse a revisión
- Solo EN_REVISION o EN_SUSPENSION pueden aprobarse
- Solo EN_REVISION puede rechazarse (devuelve a BORRADOR)
- Cada revisión y validación queda registrada para trazabilidad (RF-16)

### 5.2 Ciclo de Vida del Proyecto

#### Fases del Ciclo de Vida

**1. Formulación (BORRADOR)**
- Proyecto en creación/edición
- No visible para procesos oficiales
- Puede ser modificado libremente por el responsable

**2. Revisión (EN_REVISION)**
- Sometido a análisis por la Coordinación de Vinculación
- Se registran observaciones técnicas
- Se evalúa pertinencia, factibilidad e impacto

**3. Aprobación (APROBADO)**
- Validado por las autoridades competentes
- Listo para iniciar ejecución
- Se habilita la gestión de actividades y participantes

**4. Ejecución (EN_EJECUCION)**
- Actividades en desarrollo
- Registro de avances, evidencias e informes
- Monitoreo de indicadores y presupuesto

**5. Suspensión (EN_SUSPENSION)**
- Ejecución pausada temporalmente
- Requiere aprobación para reactivar
- Las actividades se marcan como pausadas

**6. Finalización (FINALIZADO)**
- Todas las actividades completadas
- Informe final generado
- Evaluación de resultados e impactos

**7. Cierre (CERRADO)**
- Proyecto archivado
- Lecciones aprendidas registradas
- Solo lectura

**8. Cancelación (CANCELADO)**
- Proyecto cancelado por cualquier motivo
- Registro de causa de cancelación
- Solo lectura

---

## 6. Decisiones de Arquitectura

### ADR-001: Django + Django REST Framework

**Decisión:** Usar Django 6.0 con Django REST Framework como stack backend.

**Justificación:**
- Framework maduro y estable para aplicaciones web institucionales
- DRF proporciona serialización, autenticación y vistas genéricas
- Admin de Django útil para gestión administrativa interna
- Amplia comunidad y documentación en español

### ADR-002: JWT para Autenticación

**Decisión:** Usar `djangorestframework-simplejwt` con tokens de acceso (60 min) y refresco (1 día).

**Justificación:**
- Stateless, adecuado para API REST
- Compatible con app móvil (no requiere sesiones ni cookies)
- Rotación de tokens habilitada

### ADR-003: Arquitectura Modular por Dominio

**Decisión:** Dividir el sistema en apps de Django por dominio funcional.

**Justificación:**
- Separa responsabilidades siguiendo Domain-Driven Design
- Facilita el mantenimiento y escalabilidad
- Cada equipo puede trabajar en su dominio

### ADR-004: SQLite para Desarrollo, PostgreSQL para Producción

**Decisión:** SQLite en desarrollo, PostgreSQL en producción mediante `django-environ`.

**Justificación:**
- SQLite no requiere configuración para desarrollo
- PostgreSQL ofrece mejor rendimiento, concurrencia y soporte GIS para producción
- `django-environ` permite cambiar entre entornos sin modificar código

### ADR-005: ViewSets de DRF para CRUD

**Decisión:** Usar `ModelViewSet` de DRF para operaciones CRUD estándar.

**Justificación:**
- Reduce boilerplate significativamente
- Integración automática con routers
- Acciones personalizadas con `@action` para operaciones no CRUD

### ADR-006: drf-spectacular para Documentación OpenAPI

**Decisión:** Generar esquema OpenAPI automáticamente con `drf-spectacular`.

**Justificación:**
- Documentación siempre sincronizada con el código
- Swagger UI y ReDoc incluidos
- Compatible con generación de clientes (SDKs)

### ADR-007: Permisos por Rol

**Decisión:** Implementar permisos granulares basados en `RolUsuario` (ADMIN, COORDINADOR, DOCENTE, ESTUDIANTE, DIRECTIVO).

**Permisos:**

| Rol | Permisos |
|-----|----------|
| ADMIN | Acceso total |
| COORDINADOR | CRUD proyectos, convenios, aprobar/rechazar |
| DOCENTE | CRUD actividades, indicadores, avances |
| ESTUDIANTE | Lectura, registro de avances y evidencias |

**Justificación:**
- Cumple RNF-01 (seguridad por roles)
- Implementado con clases `BasePermission` reutilizables

---

## Apéndices

### A. Enums del Sistema

**RolUsuario:** ADMIN, COORDINADOR, DOCENTE, ESTUDIANTE, DIRECTIVO

**TipoProyecto:** VINCULACION, INVESTIGACION, EXTENSION, MIXTO

**EstadoProyecto:** BORRADOR, EN_REVISION, APROBADO, EN_EJECUCION, EN_SUSPENSION, FINALIZADO, CERRADO, CANCELADO

**PrioridadProyecto:** BAJA, MEDIA, ALTA, CRITICA

**TipoObjetivo:** GENERAL, ESPECIFICO

**EstadoIndicador:** ACTIVO, EN_ALERTA, CUMPLIDO, NO_CUMPLIDO

**FrecuenciaIndicador:** DIARIA, SEMANAL, MENSUAL, TRIMESTRAL, SEMESTRAL, ANUAL

**EstadoActividad:** PENDIENTE, EN_PROCESO, COMPLETADA, ATRASADA, CANCELADA

**EstadoPresupuesto:** BORRADOR, APROBADO, EJECUTADO, CERRADO

**RolParticipante:** LIDER, DOCENTE, ESTUDIANTE, APOYO, EXTERNO

**TipoConvenio:** MARCO, ESPECIFICO, COOPERACION, OTRO

**EstadoConvenio:** BORRADOR, EN_REVISION, VIGENTE, VENCIDO, SUSPENDIDO, FINALIZADO, CANCELADO

**EstadoCompromiso:** PENDIENTE, EN_PROCESO, CUMPLIDO, INCUMPLIDO

**TipoContribucion:** FINANCIERO, HORAS, INFRAESTRUCTURA, EQUIPO, SERVICIO, EXTERNO

**EstadoAvance:** PENDIENTE, EN_REVISION, APROBADO, RECHAZADO

**TipoEvidencia:** FOTOGRAFIA, VIDEO, DOCUMENTO, ENLACE, OTRO

**TipoInforme:** INICIAL, PARCIAL, FINAL, TECNICO, FINANCIERO

**EstadoAlerta:** PENDIENTE, LEIDA, ATENDIDA, CANCELADA

**PrioridadAlerta:** BAJA, MEDIA, ALTA, URGENTE

**TipoAccion:** CREAR, ACTUALIZAR, ELIMINAR, APROBAR, RECHAZAR, INICIAR_SESION

### B. Stack Tecnológico Completo

**Backend:**
- Django 6.0
- Django REST Framework 3.17.1
- djangorestframework-simplejwt 5.5.1
- django-filter 25.2
- drf-spectacular
- django-cors-headers
- django-environ

**Frontend:**
- React 18
- TypeScript
- Redux
- Bootstrap

**Móvil:**
- Flutter o React Native

**Base de Datos:**
- SQLite (desarrollo)
- PostgreSQL 14 (producción)

**Servicios Externos:**
- Celery
- SendGrid SMTP
- Firebase Cloud Messaging
- Google OAuth2
- Google Drive

### C. Resumen del Modelo

| App | Clases | Enums |
|-----|--------|-------|
| usuarios | 2 (Carrera, Usuario) | 1 (RolUsuario) |
| proyectos | 9 (Proyecto, Objetivo, Indicador, Actividad, ParticipanteProyecto, Presupuesto, Beneficiario, AlineacionEstrategica, FirmaResponsabilidad) | 9 |
| convenios | 6 (Institucion, Convenio, ProyectoConvenio, Compromiso, Producto, Contribucion) | 4 |
| seguimiento | 6 (Avance, Evidencia, Informe, Alerta, Revision, FlujoValidacion) | 5 |
| auditoria | 1 (Auditoria) | 1 (TipoAccion) |

**Totales: 24 clases, 20 enums, ~180 atributos**

---

*Documento generado a partir de las especificaciones en `specs/`*
