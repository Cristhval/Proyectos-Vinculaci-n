# Tareas de Implementación - Sistema de Vinculación UNL

**ID:** 001-sistema-vinculacion  
**Versión:** 1.0.0  
**Estado:** Pendiente  
**Última actualización:** Mayo 2026

---

## backlog

### ÉPICA 1: Setup y Fundación

```markdown
task: Inicializar proyecto Django
id: T001
estado: pending
prioridad: high
estimacion: 2h
descripcion: Crear estructura base del proyecto Django con todas las configuraciones iniciales
criterios:
  - Proyecto Django ejecutándose en localhost:8000
  - Settings divididos por entorno (dev, prod)
  - Requirements.txt actualizado
app: core
---

task: Configurar apps del sistema
id: T002
estado: pending
prioridad: high
estimacion: 3h
descripcion: Crear las 7 apps: core, usuarios, proyectos, convenios, seguimiento, reportes, auditoria
criterios:
  - Todas las apps registradas en INSTALLED_APPS
  - Estructura de carpetas estándar Django
  - Apps listadas en config.json
app: core
---

task: Configurar base de datos SQLite desarrollo
id: T003
estado: pending
prioridad: high
estimacion: 1h
descripcion: Configurar SQLite para desarrollo y dejar lista migración a PostgreSQL
criterios:
  - DATABASES configurado en settings
  - Migraciones iniciales aplicables
  - django-environ configurado
app: core
---

task: Configurar autenticación JWT
id: T004
estado: pending
prioridad: high
estimacion: 3h
descripcion: Instalar y configurar djangorestframework-simplejwt con tokens de acceso (60min) y refresco (1 día)
criterios:
  - SimpleJWT instalado y configurado
  - Endpoints /token/ y /token/refresh/ funcionales
  - Custom claims para rol de usuario
app: core
---

task: Configurar CORS y seguridad
id: T005
estado: pending
prioridad: high
estimacion: 2h
descripcion: Configurar django-cors-headers y settings de seguridad
criterios:
  - CORS_ALLOWED_ORIGINS configurado
  - CSRF protegido
  - Security settings para producción
app: core
---

task: Configurar Admin Django
id: T006
estado: pending
prioridad: medium
estimacion: 4h
descripcion: Habilitar y personalizar Django Admin con inlines para todas las entidades
criterios:
  - Admin accesible en /admin/
  - Modelos registrados con list_display, filters
  - Inlines configurados para relaciones
app: core
---

task: Configurar documentación OpenAPI
id: T007
estado: pending
prioridad: medium
estimacion: 2h
descripcion: Instalar drf-spectacular y configurar Swagger UI + ReDoc
criterios:
  - Schema OpenAPI generándose automáticamente
  - Swagger UI accesible en /api/docs/
  - ReDoc accesible en /api/redoc/
app: core
```

---

### ÉPICA 2: Módulo de Usuarios

```markdown
task: Implementar modelo Carrera
id: T010
estado: pending
prioridad: high
estimacion: 3h
descripcion: Crear modelo Carrera con campos: codigo, nombre, facultad, descripcion, activa
criterios:
  - Modelo con validaciones
  - Admin registrado
  - Tests de modelo passing
  - Migración creada
app: usuarios
---

task: Implementar modelo Usuario
id: T011
estado: pending
prioridad: high
estimacion: 4h
descripcion: Crear modelo Usuario con relación OneToOne a User de Django, campos de perfil y rol
criterios:
  - Modelo con todos los campos especificados
  - RolUsuario Enum implementado
  - Admin con inlines
  - Tests passing
app: usuarios
---

task: Crear serializadores de Usuario
id: T012
estado: pending
prioridad: high
estimacion: 3h
descripcion: Serializadores para registro, login, perfil completo y listado
criterios:
  - UsuarioRegisterSerializer
  - UsuarioLoginSerializer
  - UsuarioSerializer (read)
  - UsuarioUpdateSerializer (write)
app: usuarios
---

task: Crear ViewSets de Usuario
id: T013
estado: pending
prioridad: high
estimacion: 4h
descripcion: ViewSets con CRUD, filtros y permisos por rol
criterios:
  - UsuarioViewSet con acciones list, retrieve, create, update, destroy
  - Filtros por rol, carrera, activo
  - Búsqueda por nombre, código, email
  - Permisos aplicados
app: usuarios
---

task: Implementar permisos de usuario
id: T014
estado: pending
prioridad: high
estimacion: 3h
descripcion: Crear clases de permiso: IsAdmin, IsCoordinadorOrAdmin, IsDocenteOrAbove
criterios:
  - Clases heredando de BasePermission
  - Tests de permisos passing
  - Documentación de permisos
app: core
```

---

### ÉPICA 3: Módulo de Proyectos

```markdown
task: Implementar modelo Proyecto
id: T020
estado: pending
prioridad: high
estimacion: 6h
descripcion: Crear modelo Proyecto con todos los campos especificados y enums (TipoProyecto, EstadoProyecto, PrioridadProyecto)
criterios:
  - Modelo con 20+ campos
  - 3 Enums implementados
  - Unique en codigo
  - Admin configurado
  - Tests passing
app: proyectos
---

task: Implementar modelo Objetivo
id: T021
estado: pending
prioridad: high
estimacion: 3h
descripcion: Crear modelo Objetivo con relación FK a Proyecto y tipo (GENERAL, ESPECIFICO)
criterios:
  - FK a Proyecto con CASCADE
  - TipoObjetivo Enum
  - Ordenamiento por campo orden
  - Tests passing
app: proyectos
---

task: Implementar modelo Indicador
id: T022
estado: pending
prioridad: high
estimacion: 4h
descripcion: Crear modelo Indicador con FK a Objetivo, campos de medición y estado
criterios:
  - FK a Objetivo con CASCADE
  - FrecuenciaIndicador Enum (6 valores)
  - EstadoIndicador Enum (4 valores)
  - Método para calcular desviación de meta
  - Tests passing
app: proyectos
---

task: Implementar modelo Actividad
id: T023
estado: pending
prioridad: high
estimacion: 4h
descripcion: Crear modelo Actividad con FK a Proyecto y Objetivo, campos de fechas y porcentaje
criterios:
  - FK a Proyecto (CASCADE) y Objetivo (SET_NULL)
  - EstadoActividad Enum (5 valores)
  - Campos de porcentaje programado/ejecución
  - Tests passing
app: proyectos
---

task: Implementar modelos auxiliares de Proyecto
id: T024
estado: pending
prioridad: high
estimacion: 5h
descripcion: Crear ParticipanteProyecto, Presupuesto, Beneficiario, AlineacionEstrategica, FirmaResponsabilidad
criterios:
  - 5 modelos creados con relaciones correctas
  - Enums: RolParticipante, EstadoPresupuesto
  - Unique constraints aplicados
  - Admin con inlines
  - Tests passing
app: proyectos
---

task: Crear serializadores de Proyecto
id: T025
estado: pending
prioridad: high
estimacion: 6h
descripcion: Serializadores anidados para Proyecto, Objetivo, Indicador, Actividad y auxiliares
criterios:
  - ProyectoSerializer con relaciones anidadas (read)
  - ProyectoCreateSerializer (write)
  - ObjetivoSerializer, IndicadorSerializer, ActividadSerializer
  - Validadores personalizados
app: proyectos
---

task: Crear ViewSets de Proyecto
id: T026
estado: pending
prioridad: high
estimacion: 8h
descripcion: ViewSets con CRUD completo, acciones personalizadas y filtros
criterios:
  - ProyectoViewSet con list, retrieve, create, update, destroy
  - Acciones: enviar-revision, aprobar, rechazar, cancelar
  - Filtros: estado, tipo, carrera, search, ordering
  - Paginación configurada
app: proyectos
---

task: Implementar acciones de flujo de Proyecto
id: T027
estado: pending
prioridad: high
estimacion: 6h
descripcion: Implementar lógica de transiciones de estado con validaciones
criterios:
  - Método enviar_revision(): BORRADOR → EN_REVISION
  - Método aprobar(): EN_REVISION → APROBADO
  - Método rechazar(): EN_REVISION → BORRADOR
  - Método cancelar(): cualquier estado → CANCELADO
  - Validación de transiciones
  - Registro en auditoría
app: proyectos
```

---

### ÉPICA 4: Módulo de Convenios

```markdown
task: Implementar modelo Institucion
id: T030
estado: pending
prioridad: high
estimacion: 3h
descripcion: Crear modelo Institucion con campos de información de contacto
criterios:
  - Campos: nombre, sigla, descripcion, direccion, telefono, email, sitio_web, activa
  - Admin registrado
  - Tests passing
app: convenios
---

task: Implementar modelo Convenio
id: T031
estado: pending
prioridad: high
estimacion: 5h
descripcion: Crear modelo Convenio con FK a Institucion, enums de tipo y estado
criterios:
  - FK a Institucion (SET_NULL)
  - TipoConvenio Enum (4 valores)
  - EstadoConvenio Enum (7 valores)
  - Campo archivo_firmado (FileField)
  - Tests passing
app: convenios
---

task: Implementar modelos de Convenio
id: T032
estado: pending
prioridad: high
estimacion: 5h
descripcion: Crear Compromiso, Producto, Contribucion con relaciones y validaciones
criterios:
  - Compromiso con FK a Convenio, estado (4 valores)
  - Producto con FK a Convenio, campo entregado
  - Contribucion con FK a Proyecto e Institucion
  - Unique constraints aplicados
  - Tests passing
app: convenios
---

task: Implementar modelo ProyectoConvenio
id: T033
estado: pending
prioridad: medium
estimacion: 2h
descripcion: Crear modelo intermedio para relación N:M entre Proyecto y Convenio
criterios:
  - FK a Proyecto y Convenio
  - unique_together: (proyecto, convenio)
  - Campo vigente (boolean)
  - Admin con autocomplete
app: convenios
---

task: Crear serializadores y ViewSets de Convenio
id: T034
estado: pending
prioridad: high
estimacion: 6h
descripcion: Serializadores y ViewSets para Convenio, Institucion, Compromiso, Producto
criterios:
  - ConvenioSerializer anidado
  - InstitucionViewSet, ConvenioViewSet
  - Filtros por estado, tipo, search
  - Tests passing
app: convenios
```

---

### ÉPICA 5: Módulo de Seguimiento

```markdown
task: Implementar modelo Avance
id: T040
estado: pending
prioridad: high
estimacion: 4h
descripcion: Crear modelo Avance con FK a Actividad y Usuario, campos de porcentaje y estado
criterios:
  - FK a Actividad (CASCADE), registrado_por (Usuario)
  - EstadoAvance Enum (4 valores)
  - Campos: porcentaje_avance, descripcion, dificultades, acciones_correctivas
  - Tests passing
app: seguimiento
---

task: Implementar modelo Evidencia
id: T041
estado: pending
prioridad: high
estimacion: 4h
descripcion: Crear modelo Evidencia con subida de archivos y tipos
criterios:
  - FK a Avance (null=True) y Actividad (null=True)
  - TipoEvidencia Enum (5 valores)
  - FileField para archivo, URLField para enlace_externo
  - Campo verificada (boolean)
  - Tests passing
app: seguimiento
---

task: Implementar modelo Informe
id: T042
estado: pending
prioridad: high
estimacion: 4h
descripcion: Crear modelo Informe con tipos y generación de PDF
criterios:
  - FK a Proyecto, elaborado_por, aprobado_por
  - TipoInforme Enum (5 valores)
  - unique_together: (proyecto, tipo, numero)
  - Método para generar PDF
  - Tests passing
app: seguimiento
---

task: Implementar modelo Alerta
id: T043
estado: pending
prioridad: high
estimacion: 3h
descripcion: Crear modelo Alerta con prioridades y estados
criterios:
  - FK a Usuario, Proyecto (null), Convenio (null)
  - PrioridadAlerta Enum (4 valores)
  - EstadoAlerta Enum (4 valores)
  - Campo fecha_vencimiento (datetime)
  - Tests passing
app: seguimiento
---

task: Implementar modelos Revision y FlujoValidacion
id: T044
estado: pending
prioridad: high
estimacion: 5h
descripcion: Crear modelos para trazabilidad de aprobaciones
criterios:
  - Revision: FK a Proyecto y revisor, decision (APROBADO/OBSERVADO/RECHAZADO)
  - FlujoValidacion: FK a Proyecto y responsable, paso, estado
  - Relación con Proyecto
  - Tests passing
app: seguimiento
---

task: Crear ViewSets de Seguimiento
id: T045
estado: pending
prioridad: high
estimacion: 8h
descripcion: ViewSets para Avance, Evidencia, Informe, Alerta con acciones de aprobación
criterios:
  - AvanceViewSet con acciones aprobar/rechazar
  - EvidenciaViewSet con upload
  - InformeViewSet con generación PDF
  - AlertaViewSet con acciones leer/atender
  - Filtros y permisos aplicados
app: seguimiento
---

task: Implementar sistema de notificaciones
id: T046
estado: pending
prioridad: medium
estimacion: 6h
descripcion: Configurar Celery + SendGrid para emails y Firebase para push notifications
criterios:
  - Celery configurado
  - SendGrid integrado
  - Templates de email
  - Firebase Cloud Messaging setup
  - Tests de integración
app: seguimiento
```

---

### ÉPICA 6: Módulo de Reportes

```markdown
task: Implementar Dashboard
id: T050
estado: pending
prioridad: high
estimacion: 6h
descripcion: Crear endpoint /dashboard/ con KPIs generales
criterios:
  - KPIs: total proyectos, por estado, por tipo, por carrera
  - KPIs: total convenios, vigentes, vencidos
  - KPIs: indicadores en alerta, avances pendientes
  - Response JSON estructurado
  - Tests passing
app: reportes
---

task: Implementar Reporte de Proyectos
id: T051
estado: pending
prioridad: medium
estimacion: 4h
descripcion: Crear endpoint /reportes/proyectos/ con filtros y exportación
criterios:
  - Filtros: estado, tipo, carrera, fecha
  - Exportación a Excel
  - Exportación a PDF
  - Tests passing
app: reportes
---

task: Implementar Reporte de Progreso
id: T052
estado: pending
prioridad: medium
estimacion: 4h
descripcion: Crear endpoint /reportes/progreso/ con avance por proyecto
criterios:
  - Filtro por proyecto
  - Porcentaje de avance por actividad
  - Gráfico de progreso (datos)
  - Exportación PDF
  - Tests passing
app: reportes
```

---

### ÉPICA 7: Auditoría y Seguridad

```markdown
task: Implementar modelo Auditoria
id: T060
estado: pending
prioridad: high
estimacion: 4h
descripcion: Crear modelo Auditoria y signals para registro automático
criterios:
  - Campos: usuario, accion, entidad, entidad_id, detalle, ip_address
  - TipoAccion Enum (6 valores)
  - Signal post_save para registro automático
  - Admin de solo lectura
  - Tests passing
app: auditoria
---

task: Implementar logging de seguridad
id: T061
estado: pending
prioridad: high
estimacion: 3h
descripcion: Configurar logging para eventos de seguridad
criterios:
  - Logs de intentos de login fallidos
  - Logs de cambios de permisos
  - Logs de acceso a datos sensibles
  - Rotación de logs configurada
app: core
```

---

### ÉPICA 8: Producción

```markdown
task: Configurar PostgreSQL producción
id: T070
estado: pending
prioridad: high
estimacion: 3h
descripcion: Configurar PostgreSQL para producción con django-environ
criterios:
  - DATABASES configurado para PostgreSQL
  - Variables de entorno seguras
  - Conexión SSL habilitada
  - Pool de conexiones configurado
app: core
---

task: Optimizar rendimiento
id: T071
estado: pending
prioridad: medium
estimacion: 6h
descripcion: Optimizar consultas con select_related, prefetch_related e índices
criterios:
  - Queries reducidas en listados
  - Índices en campos de búsqueda
  - Caching configurado
  - Load testing passing (<200ms p95)
app: core
---

task: Configurar despliegue
id: T072
estado: pending
prioridad: high
estimacion: 4h
descripcion: Crear Dockerfile, docker-compose y configuración para producción
criterios:
  - Dockerfile funcional
  - docker-compose.yml con servicios
  - Gunicorn configurado
  - Nginx reverse proxy
  - Variables de entorno documentadas
app: core
---

task: Documentación final
id: T073
estado: pending
prioridad: medium
estimacion: 4h
descripcion: Completar documentación de API, README y manual de usuario
criterios:
  - README.md completo
  - API documentada en OpenAPI
  - Manual de usuario en PDF
  - CHANGELOG actualizado
app: core
```

---

## sprint-backlog

### Sprint 1 (Semanas 1-2): Setup

| Tarea | ID | Estado | Assignee |
|-------|-----|--------|----------|
| Inicializar proyecto Django | T001 | pending | - |
| Configurar apps del sistema | T002 | pending | - |
| Configurar base de datos SQLite | T003 | pending | - |
| Configurar autenticación JWT | T004 | pending | - |
| Configurar CORS y seguridad | T005 | pending | - |
| Configurar Admin Django | T006 | pending | - |
| Configurar documentación OpenAPI | T007 | pending | - |

**Definition of Done:**
- [ ] Proyecto ejecutándose en localhost:8000
- [ ] Login JWT funcional
- [ ] Admin accesible
- [ ] Swagger UI disponible

---

### Sprint 2 (Semanas 3-4): Usuarios

| Tarea | ID | Estado | Assignee |
|-------|-----|--------|----------|
| Implementar modelo Carrera | T010 | pending | - |
| Implementar modelo Usuario | T011 | pending | - |
| Crear serializadores de Usuario | T012 | pending | - |
| Crear ViewSets de Usuario | T013 | pending | - |
| Implementar permisos de usuario | T014 | pending | - |

**Definition of Done:**
- [ ] CRUD de usuarios funcional
- [ ] Permisos aplicados
- [ ] Tests passing (>80%)

---

### Sprint 3 (Semanas 5-6): Proyectos I

| Tarea | ID | Estado | Assignee |
|-------|-----|--------|----------|
| Implementar modelo Proyecto | T020 | pending | - |
| Implementar modelo Objetivo | T021 | pending | - |
| Implementar modelo Indicador | T022 | pending | - |
| Implementar modelo Actividad | T023 | pending | - |

**Definition of Done:**
- [ ] Modelos creados y testeados
- [ ] Admin configurado
- [ ] Migraciones aplicadas

---

### Sprint 4 (Semanas 7-8): Proyectos II

| Tarea | ID | Estado | Assignee |
|-------|-----|--------|----------|
| Implementar modelos auxiliares | T024 | pending | - |
| Crear serializadores de Proyecto | T025 | pending | - |
| Crear ViewSets de Proyecto | T026 | pending | - |
| Implementar acciones de flujo | T027 | pending | - |

**Definition of Done:**
- [ ] CRUD de proyectos funcional
- [ ] Flujos de aprobación implementados
- [ ] Tests passing (>80%)

---

## Referencias

- **Especificación:** `specs/001-sistema-vinculacion/spec.md`
- **Plan:** `specs/001-sistema-vinculacion/plan.md`
- **Constitución:** `.specify/memory/constitution.md`

---

*Documento vivo - Actualizar estado de tareas diariamente*
