# Architecture Decision Records

## ADR-001: Django + Django REST Framework

**Decision:** Usar Django 6.0 con Django REST Framework como stack backend.

**Justificacion:**
- Framework maduro y estable para aplicaciones web institucionales
- DRF proporciona serializacion, autenticacion y vistas genericas
- Admin de Django util para gestion administrativa interna
- Amplia comunidad y documentacion en espanol

## ADR-002: JWT para autenticacion

**Decision:** Usar `djangorestframework-simplejwt` con tokens de acceso (60 min) y refresco (1 dia).

**Justificacion:**
- Stateless, adecuado para API REST
- Compatible con app movil (no requiere sesiones ni cookies)
- Rotacion de tokens habilitada

## ADR-003: Arquitectura modular por Dominio

**Decision:** Dividir el sistema en apps de Django por dominio funcional.

**Apps:**
| App | Responsabilidad |
|-----|----------------|
| `core` | Modelo base TimeStampedModel, utilidades, permisos |
| `usuarios` | Gestion de usuarios, carreras, autenticacion |
| `proyectos` | Proyectos, objetivos, indicadores, actividades, participantes, presupuesto |
| `convenios` | Instituciones, convenios, compromisos, productos, contribuciones |
| `seguimiento` | Avances, evidencias, informes, alertas, revisiones, flujos de validacion |
| `reportes` | Dashboard, reportes por filtros, KPIs |
| `auditoria` | Registro de auditoria y trazabilidad |

**Justificacion:**
- Separa responsabilidades siguiendo Domain-Driven Design
- Facilita el mantenimiento y escalabilidad
- Cada equipo puede trabajar en su dominio

## ADR-004: SQLite para desarrollo, PostgreSQL para produccion

**Decision:** SQLite en desarrollo, PostgreSQL en produccion mediante `django-environ`.

**Justificacion:**
- SQLite no requiere configuracion para desarrollo
- PostgreSQL ofrece mejor rendimiento, concurrencia y soporte GIS para produccion
- `django-environ` permite cambiar entre entornos sin modificar codigo

## ADR-005: ViewSets de DRF para CRUD

**Decision:** Usar `ModelViewSet` de DRF para operaciones CRUD estandar.

**Justificacion:**
- Reduce boilerplate significativamente
- Integracion automatica con routers
- Acciones personalizadas con `@action` para operaciones no CRUD

## ADR-006: drf-spectacular para documentacion OpenAPI

**Decision:** Generar esquema OpenAPI automaticamente con `drf-spectacular`.

**Justificacion:**
- Documentacion siempre sincronizada con el codigo
- Swagger UI y ReDoc incluidos
- Compatible con generacion de clientes (SDKs)

## ADR-007: Permisos por rol

**Decision:** Implementar permisos granulares basados en `RolUsuario` (ADMIN, COORDINADOR, DOCENTE, ESTUDIANTE, DIRECTIVO).

**Permisos:**
| Rol | Permisos |
|-----|----------|
| ADMIN | Acceso total |
| COORDINADOR | CRUD proyectos, convenios, aprobar/rechazar |
| DOCENTE | CRUD actividades, indicadores, avances |
| ESTUDIANTE | Lectura, registro de avances y evidencias |

**Justificacion:**
- Cumple RNF-01 (seguridad por roles)
- Implementado con clases `BasePermission` reutilizables
