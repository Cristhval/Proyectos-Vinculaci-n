# Especificación - Sistema de Vinculación UNL

**ID:** 001-sistema-vinculacion  
**Versión:** 1.0.0  
**Estado:** En desarrollo  
**Última actualización:** Mayo 2026

---

## 1. Resumen Ejecutivo

### 1.1 Propósito

Plataforma centralizada para gestión, monitoreo y evaluación de proyectos de vinculación y convenios interinstitucionales de la Universidad Nacional de Loja.

### 1.2 Objetivos

| ID | Objetivo | Prioridad |
|----|----------|-----------|
| O-01 | Digitalizar el ciclo completo de gestión de proyectos | Alta |
| O-02 | Centralizar información de convenios interinstitucionales | Alta |
| O-03 | Facilitar seguimiento y evaluación de actividades | Alta |
| O-04 | Generar reportes automáticos con KPIs | Media |
| O-05 | Habilitar acceso móvil para registro en campo | Media |

### 1.3 Alcance

**Incluye:**
- CRUD completo de proyectos, convenios, participantes
- Flujos de aprobación y validación
- Registro de avances y evidencias
- Sistema de alertas y notificaciones
- Dashboard con indicadores
- API REST documentada
- App móvil para registro

**No incluye:**
- Integración con sistemas contables externos
- Firma electrónica avanzada
- Videoconferencias integradas

---

## 2. Actores y Roles

### 2.1 Actores

| Actor | Descripción |
|-------|-------------|
| Docente | Director o responsable de proyecto |
| Estudiante | Participante en actividades |
| Coordinador | Coordinación de Vinculación |
| Administrador | Gestión institucional |

### 2.2 Roles y Permisos

| Rol | Proyectos | Convenios | Usuarios | Reportes | Configuración |
|-----|-----------|-----------|----------|----------|---------------|
| ADMIN | CRUD total | CRUD total | CRUD total | Todos | Total |
| COORDINADOR | CRUD + Aprobar/Rechazar | CRUD + Aprobar | Lectura | Todos | Parcial |
| DOCENTE | CRUD propios | Lectura | Lectura | Limitados | No |
| ESTUDIANTE | Lectura + Avances | No | No | No | No |
| DIRECTIVO | Lectura total | Lectura total | No | Ejecutivos | No |

---

## 3. Modelo de Datos

### 3.1 Entidades Principales

#### Proyecto (Core)
```
- codigo: string unique
- titulo: string
- tipo: enum (VINCULACION, INVESTIGACION, EXTENSION, MIXTO)
- estado: enum (8 estados)
- prioridad: enum (BAJA, MEDIA, ALTA, CRITICA)
- carrera: FK → Carrera
- responsable: FK → Usuario
- coordinador_academico: FK → Usuario
- fechas: inicio, fin_planificada, fin_real
- presupuesto_aprobado: decimal
- descripcion, problema, justificacion: text
- objetivo_general: text
- resultados_esperados: text
- linea_intervencion: string
- direccion_ejecucion: string
- observaciones: text
- activo: boolean
```

#### Objetivo
```
- proyecto: FK → Proyecto (CASCADE)
- tipo: enum (GENERAL, ESPECIFICO)
- orden: integer
- descripcion: text
- meta: string
- cumplido: boolean
- fecha_cumplimiento: date
- observaciones: text
```

#### Indicador
```
- objetivo: FK → Objetivo (CASCADE)
- codigo: string
- nombre: string
- descripcion: text
- formula: string
- unidad_medida: string
- linea_base: decimal
- meta: decimal
- valor_actual: decimal
- frecuencia: enum (DIARIA, SEMANAL, MENSUAL, TRIMESTRAL, SEMESTRAL, ANUAL)
- estado: enum (ACTIVO, EN_ALERTA, CUMPLIDO, NO_CUMPLIDO)
- fecha_medicion: date
- observaciones: text
```

#### Actividad
```
- proyecto: FK → Proyecto (CASCADE)
- objetivo: FK → Objetivo (SET_NULL)
- codigo: string
- nombre: string
- descripcion: text
- fecha_inicio: date
- fecha_fin: date
- responsable: FK → Usuario
- porcentaje_programado: decimal
- porcentaje_ejecucion: decimal
- estado: enum (PENDIENTE, EN_PROCESO, COMPLETADA, ATRASADA, CANCELADA)
- orden: integer
- requiere_evidencia: boolean
- observaciones: text
```

#### Convenio
```
- codigo: string unique
- institucion: FK → Institucion (SET_NULL)
- entidad_contraparte: string
- objeto: string
- descripcion: text
- fecha_firma: date
- fecha_inicio: date
- fecha_fin: date
- tipo: enum (MARCO, ESPECIFICO, COOPERACION, OTRO)
- estado: enum (7 estados)
- archivo_firmado: file
- observaciones: text
- activo: boolean
```

### 3.2 Entidades de Seguimiento

#### Avance
```
- actividad: FK → Actividad (CASCADE)
- registrado_por: FK → Usuario
- porcentaje_avance: decimal
- descripcion: text
- dificultades: text
- acciones_correctivas: text
- horas_invertidas: decimal
- fecha_registro: date
- estado: enum (PENDIENTE, EN_REVISION, APROBADO, RECHAZADO)
```

#### Evidencia
```
- avance: FK → Avance (null)
- actividad: FK → Actividad (null)
- tipo: enum (FOTOGRAFIA, VIDEO, DOCUMENTO, ENLACE, OTRO)
- titulo: string
- descripcion: text
- archivo: file
- enlace_externo: url
- fecha_carga: date
- verificada: boolean
```

#### Informe
```
- proyecto: FK → Proyecto (CASCADE)
- tipo: enum (INICIAL, PARCIAL, FINAL, TECNICO, FINANCIERO)
- numero: string
- titulo: string
- resumen: text
- contenido: text
- periodo_inicio: date
- periodo_fin: date
- elaborado_por: FK → Usuario
- aprobado_por: FK → Usuario
- estado: string
- archivo: file
- fecha_emision: date
- observaciones: text
```

#### Alerta
```
- usuario: FK → Usuario (CASCADE)
- proyecto: FK → Proyecto (null)
- convenio: FK → Convenio (null)
- mensaje: string
- detalle: text
- prioridad: enum (BAJA, MEDIA, ALTA, URGENTE)
- estado: enum (PENDIENTE, LEIDA, ATENDIDA, CANCELADA)
- enlace: url
- leida: boolean
- fecha_vencimiento: datetime
```

### 3.3 Entidades de Auditoría

#### Auditoria
```
- usuario: FK → Usuario (SET_NULL)
- accion: enum (CREAR, ACTUALIZAR, ELIMINAR, APROBAR, RECHAZAR, INICIAR_SESION)
- entidad: string
- entidad_id: integer
- detalle: json
- ip_address: string
- timestamp: datetime
```

---

## 4. API REST

### 4.1 Autenticación

```yaml
POST /api/v1/auth/login/
  body: { username, password }
  response: { access, refresh }

POST /api/v1/auth/refresh/
  body: { refresh }
  response: { access }

POST /api/v1/auth/register/
  body: { username, password, email, rol, ... }
  response: { id, username, email }
```

### 4.2 Endpoints por Dominio

#### Proyectos
```
GET    /api/v1/proyectos/              # Listar (filtros, search, ordering)
POST   /api/v1/proyectos/              # Crear
GET    /api/v1/proyectos/{id}/         # Detalle
PUT    /api/v1/proyectos/{id}/         # Actualizar
DELETE /api/v1/proyectos/{id}/         # Eliminar
POST   /api/v1/proyectos/{id}/enviar-revision/
POST   /api/v1/proyectos/{id}/aprobar/
POST   /api/v1/proyectos/{id}/rechazar/
```

#### Convenios
```
GET    /api/v1/convenios/              # Listar
POST   /api/v1/convenios/              # Crear
GET    /api/v1/convenios/{id}/         # Detalle
```

#### Seguimiento
```
GET    /api/v1/avances/                # Listar avances
POST   /api/v1/avances/                # Registrar avance
POST   /api/v1/avances/{id}/aprobar/
POST   /api/v1/avances/{id}/rechazar/
GET    /api/v1/evidencias/             # Listar evidencias
POST   /api/v1/evidencias/             # Subir evidencia
GET    /api/v1/informes/               # Listar informes
POST   /api/v1/informes/               # Crear informe
GET    /api/v1/alertas/                # Listar alertas
POST   /api/v1/alertas/{id}/leer/
POST   /api/v1/alertas/{id}/atender/
```

#### Reportes
```
GET    /api/v1/dashboard/              # KPIs generales
GET    /api/v1/reportes/proyectos/     # Reporte filtrado
GET    /api/v1/reportes/progreso/      # Progreso por proyecto
```

### 4.3 Parámetros de Consulta

```
/proyectos/?estado=APROBADO&tipo=VINCULACION&carrera=5&search=texto&ordering=-creado_en
/convenios/?estado=VIGENTE&tipo=MARCO&search=unl
/alertas/?prioridad=ALTA&estado=PENDIENTE
```

---

## 5. Workflows

### 5.1 Flujo de Aprobación de Proyectos

```
┌─────────────┐    enviar     ┌─────────────┐    aprobar    ┌──────────┐
│  BORRADOR   │──────────────►│ EN_REVISION │──────────────►│ APROBADO │
└─────────────┘               └──────┬──────┘               └────┬─────┘
     ▲                               │                           │
     │         rechazar              │                           │ iniciar
     └───────────────────────────────┘                           │
                                                                 ▼
                                                          ┌──────────────┐
                                                          │ EN_EJECUCION │
                                                          └──────────────┘
```

**Reglas:**
- Solo BORRADOR puede enviarse a revisión
- Solo EN_REVISION puede rechazarse (vuelve a BORRADOR)
- Solo EN_REVISION o EN_SUSPENSION pueden aprobarse
- Cada revisión genera registro en modelo `Revision`

### 5.2 Ciclo de Vida Completo

| Fase | Estado | Acciones Permitidas |
|------|--------|---------------------|
| Formulación | BORRADOR | Crear, Editar, Enviar revisión |
| Revisión | EN_REVISION | Aprobar, Rechazar, Observar |
| Aprobación | APROBADO | Iniciar ejecución, Suspender |
| Ejecución | EN_EJECUCION | Registrar avances, Suspender, Finalizar |
| Suspensión | EN_SUSPENSION | Reactivar (aprobar) |
| Finalización | FINALIZADO | Generar informe, Cerrar |
| Cierre | CERRADO | Solo lectura |
| Cancelación | CANCELADO | Solo lectura (desde cualquier estado) |

---

## 6. Requerimientos No Funcionales

### 6.1 Seguridad

| ID | Requerimiento | Prioridad |
|----|---------------|-----------|
| RNF-01 | Autenticación JWT obligatoria | Alta |
| RNF-02 | Autorización RBAC por roles | Alta |
| RNF-03 | Auditoría de todas las acciones | Alta |
| RNF-04 | CORS configurado por entorno | Alta |
| RNF-05 | Validación de entrada en API | Alta |

### 6.2 Rendimiento

| ID | Requerimiento | Meta |
|----|---------------|------|
| RNF-10 | Tiempo respuesta API | < 200ms p95 |
| RNF-11 | Concurrentes soportados | 100 usuarios |
| RNF-12 | Paginación estándar | 20 items/página |

### 6.3 Disponibilidad

| ID | Requerimiento | Meta |
|----|---------------|------|
| RNF-20 | Uptime | 99.5% |
| RNF-21 | Backup automático | Diario |
| RNF-22 | Recovery time | < 4 horas |

---

## 7. Criterios de Aceptación

### 7.1 Por Módulo

**Módulo Proyectos:**
- [ ] CRUD completo funcional
- [ ] Flujos de aprobación implementados
- [ ] Búsqueda y filtros operativos
- [ ] Permisos por rol aplicados
- [ ] Tests passing (>80%)

**Módulo Convenios:**
- [ ] CRUD completo funcional
- [ ] Vinculación proyecto-convenio
- [ ] Compromisos y productos
- [ ] Estados y transiciones

**Módulo Seguimiento:**
- [ ] Registro de avances
- [ ] Subida de evidencias
- [ ] Generación de informes
- [ ] Sistema de alertas

**Módulo Reportes:**
- [ ] Dashboard con KPIs
- [ ] Reportes filtrables
- [ ] Exportación PDF/Excel

### 7.2 Transversales

- [ ] API documentada con OpenAPI 3.0
- [ ] Swagger UI accesible
- [ ] Admin Django configurado
- [ ] Migraciones aplicables
- [ ] CHANGELOG actualizado

---

## 8. Referencias

- **Constitución:** `.specify/memory/constitution.md`
- **Configuración:** `.specify/config.json`
- **Especificación completa:** `specs/ESPECIFICACION-COMPLETA.md`
- **API OpenAPI:** `specs/api/openapi.yml`
- **Modelo de dominio:** `specs/dominio/modelo-entidades.md`
- **Workflows:** `specs/workflows/`

---

*Documento vivo - Actualizar con cada cambio significativo*
