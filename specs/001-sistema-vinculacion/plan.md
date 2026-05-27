# Plan de Implementación - Sistema de Vinculación UNL

**ID:** 001-sistema-vinculacion  
**Versión:** 1.0.0  
**Estado:** En planificación  
**Última actualización:** Mayo 2026

---

## 1. Visión General

Este plan describe la estrategia de implementación del Sistema de Vinculación, organizado en fases iterativas e incrementales.

### 1.1 Enfoque

- **Metodología:** Iterativa e incremental
- **Duración estimada:** 12-16 semanas
- **Entregables:** 4 releases principales
- **Revisión:** Al final de cada sprint (2 semanas)

### 1.2 Dependencias

```
Fase 1 (Setup) → Fase 2 (Core) → Fase 3 (Seguimiento) → Fase 4 (Reportes)
      ↓                ↓                  ↓                    ↓
   Infraestructura   Proyectos        Convenios           Dashboard
   Auth/JWT         Usuarios          Seguimiento         Notificaciones
```

---

## 2. Fases de Implementación

### Fase 1: Setup y Fundación (Semanas 1-2)

**Objetivo:** Establecer infraestructura base y configuración del proyecto.

#### Entregables
- [ ] Estructura de proyecto Django configurada
- [ ] Apps creadas (core, usuarios, proyectos, convenios, seguimiento, reportes, auditoria)
- [ ] Base de datos SQLite para desarrollo
- [ ] JWT configurado (SimpleJWT)
- [ ] CORS configurado
- [ ] Admin Django habilitado
- [ ] Documentación OpenAPI básica

#### Tareas Clave
1. Inicializar proyecto Django
2. Configurar apps y dependencias
3. Setup de base de datos y migraciones iniciales
4. Configurar autenticación JWT
5. Configurar CORS y entornos
6. Crear superusuario admin

#### Criterios de Aceptación
- Proyecto ejecutándose en localhost:8000
- Login JWT funcional
- Admin accesible
- Swagger UI disponible en `/api/docs/`

---

### Fase 2: Módulo Core - Proyectos y Usuarios (Semanas 3-6)

**Objetivo:** Implementar gestión completa de proyectos y usuarios.

#### Entregables
- [ ] Modelos de usuarios (Carrera, Usuario)
- [ ] Modelos de proyectos (Proyecto, Objetivo, Indicador, Actividad)
- [ ] Modelos auxiliares (ParticipanteProyecto, Presupuesto, Beneficiario)
- [ ] Serializadores para todos los modelos
- [ ] ViewSets con CRUD completo
- [ ] Permisos por rol implementados
- [ ] Filtros, búsqueda y ordenamiento

#### Tareas Clave

**Semana 3-4: Usuarios**
1. Modelo Carrera (CRUD + tests)
2. Modelo Usuario (CRUD + tests)
3. Serializadores de usuario
4. ViewSets de usuario
5. Permisos: IsAdmin, IsCoordinadorOrAdmin

**Semana 5-6: Proyectos**
1. Modelo Proyecto (CRUD + tests)
2. Modelos Objetivo e Indicador
3. Modelo Actividad
4. Modelos auxiliares (Presupuesto, ParticipanteProyecto, Beneficiario)
5. Serializadores anidados
6. ViewSets con acciones personalizadas
7. Filtros por estado, tipo, carrera
8. Búsqueda textual

#### Criterios de Aceptación
- CRUD de proyectos funcional
- Permisos aplicados correctamente
- Búsqueda y filtros operativos
- Tests passing (>80% cobertura)

---

### Fase 3: Módulo Convenios y Seguimiento (Semanas 7-10)

**Objetivo:** Implementar gestión de convenios y sistema de seguimiento.

#### Entregables
- [ ] Modelos de convenios (Institucion, Convenio, Compromiso, Producto)
- [ ] Modelos de seguimiento (Avance, Evidencia, Informe, Alerta)
- [ ] Modelos de flujo (Revision, FlujoValidacion)
- [ ] Endpoints de aprobación/rechazo
- [ ] Sistema de alertas
- [ ] Subida de archivos (evidencias, informes)

#### Tareas Clave

**Semana 7-8: Convenios**
1. Modelo Institucion (CRUD)
2. Modelo Convenio (CRUD + estados)
3. Modelos Compromiso y Producto
4. Modelo Contribucion
5. Relación Proyecto-Convenio (ProyectoConvenio)
6. Serializadores y ViewSets

**Semana 9-10: Seguimiento**
1. Modelo Avance (CRUD + aprobación)
2. Modelo Evidencia (subida de archivos)
3. Modelo Informe (generación PDF)
4. Modelo Alerta (notificaciones)
5. Modelos Revision y FlujoValidacion
6. Endpoints de aprobación/rechazo
7. Acciones: `/aprobar/`, `/rechazar/`, `/enviar-revision/`

#### Criterios de Aceptación
- Convenios CRUD funcional
- Registro de avances operativo
- Subida de evidencias funcional
- Alertas generándose automáticamente
- Flujos de aprobación implementados

---

### Fase 4: Reportes y Dashboard (Semanas 11-14)

**Objetivo:** Implementar sistema de reportes, dashboard y notificaciones.

#### Entregables
- [ ] Dashboard con KPIs
- [ ] Reportes filtrables
- [ ] Exportación PDF/Excel
- [ ] Notificaciones email
- [ ] Integración con Firebase (push notifications)
- [ ] Auditoría completa

#### Tareas Clave

**Semana 11-12: Reportes**
1. Endpoint `/dashboard/` con KPIs
2. Endpoint `/reportes/proyectos/` con filtros
3. Endpoint `/reportes/progreso/`
4. Generación de PDF (informes)
5. Exportación Excel

**Semana 13-14: Notificaciones y Auditoría**
1. Modelo Auditoria (registro automático)
2. Email service (Celery + SendGrid)
3. Firebase Cloud Messaging integration
4. Notificaciones automáticas por alertas
5. Optimización de queries

#### Criterios de Aceptación
- Dashboard mostrando KPIs en tiempo real
- Reportes exportables
- Emails enviándose
- Auditoría registrando acciones
- Tests passing (>85% cobertura)

---

### Fase 5: Pulido y Producción (Semanas 15-16)

**Objetivo:** Preparar sistema para despliegue en producción.

#### Entregables
- [ ] Configuración PostgreSQL
- [ ] Variables de entorno configuradas
- [ ] Dockerfile (opcional)
- [ ] Documentación completa
- [ ] Manual de usuario
- [ ] Plan de despliegue

#### Tareas Clave
1. Migrar a PostgreSQL (producción)
2. Configurar django-environ
3. Optimizar consultas (select_related, prefetch_related)
4. Revisión de seguridad
5. Documentación final
6. Pruebas de carga
7. Plan de rollback

#### Criterios de Aceptación
- Sistema estable en entorno staging
- Todos los tests passing
- Documentación completa
- Plan de despliegue aprobado

---

## 3. Matriz de Trazabilidad

| Requerimiento | Fase | Tareas | Estado |
|---------------|------|--------|--------|
| RNF-01 (Auth JWT) | Fase 1 | Setup JWT, Login endpoints | Pendiente |
| RNF-02 (RBAC) | Fase 2 | Permisos por rol | Pendiente |
| RF-01 (Aprobación) | Fase 3 | Endpoints aprobar/rechazar | Pendiente |
| RF-02 (Edición BORRADOR) | Fase 2 | Permisos en ViewSet Proyecto | Pendiente |
| RF-03 (Auditoría) | Fase 4 | Modelo Auditoria, signals | Pendiente |
| RF-04 (Alertas) | Fase 3-4 | Modelo Alerta, notificaciones | Pendiente |
| RF-05 (Presupuesto) | Fase 2 | Modelo Presupuesto | Pendiente |
| RF-06 (Evidencias) | Fase 3 | Subida de archivos, verificación | Pendiente |
| RF-07 (Informes) | Fase 3-4 | Modelo Informe, generación PDF | Pendiente |
| RF-08 (Cancelación) | Fase 2 | Acción cancelar en Proyecto | Pendiente |
| RF-09 (Participantes) | Fase 2 | Modelo ParticipanteProyecto | Pendiente |
| RF-16 (Trazabilidad) | Fase 3-4 | Revision, FlujoValidacion, Auditoria | Pendiente |

---

## 4. Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Cambios en requerimientos | Media | Alto | Revisión quincenal, backlog flexible |
| Dependencias externas (API UNL) | Alta | Medio | Mocks para desarrollo, fallbacks |
| Complejidad de flujos de aprobación | Media | Medio | Prototipado temprano, feedback usuario |
| Performance con grandes volúmenes | Baja | Alto | Paginación, índices, caching |
| Curva de aprendizaje Django | Baja | Bajo | Documentación, pair programming |

---

## 5. Métricas de Éxito

### 5.1 Métricas de Proceso

| Métrica | Meta | Frecuencia |
|---------|------|------------|
| Velocity | 20-30 puntos/sprint | Por sprint |
| Cobertura tests | >80% | Continuo |
| Bugs críticos | 0 | Por release |
| Deuda técnica | <10% | Por sprint |

### 5.2 Métricas de Producto

| Métrica | Meta | Medición |
|---------|------|----------|
| Tiempo respuesta API | <200ms p95 | Load testing |
| Uptime | 99.5% | Monitoreo |
| Satisfacción usuario | >4/5 | Encuestas |
| Adoption rate | >80% usuarios objetivo | Analytics |

---

## 6. Recursos Necesarios

### 6.1 Humanos

| Rol | Cantidad | Dedicación |
|-----|----------|------------|
| Backend Developer | 2 | Full-time |
| Frontend Developer | 1 | Full-time |
| QA Engineer | 1 | Part-time |
| Product Owner | 1 | Part-time |

### 6.2 Técnicos

| Recurso | Uso |
|---------|-----|
| Servidor desarrollo | Django local + SQLite |
| Servidor staging | PostgreSQL + Docker |
| Servidor producción | PostgreSQL + Gunicorn + Nginx |
| CI/CD Pipeline | GitHub Actions |
| Monitorización | Sentry + Prometheus |

---

## 7. Checklist de Release

### Pre-Release
- [ ] Todos los tests passing
- [ ] Cobertura >80%
- [ ] Migraciones aplicadas
- [ ] Documentación actualizada
- [ ] CHANGELOG completo
- [ ] Revisión de código completada
- [ ] Pruebas de aceptación pass

### Post-Release
- [ ] Deploy en staging verificado
- [ ] Deploy en producción completado
- [ ] Smoke tests passing
- [ ] Monitoreo activo
- [ ] Usuarios notificados
- [ ] Backup realizado

---

## 8. Referencias

- **Especificación:** `specs/001-sistema-vinculacion/spec.md`
- **Tareas:** `specs/001-sistema-vinculacion/tasks.md`
- **Constitución:** `.specify/memory/constitution.md`
- **Configuración:** `.specify/config.json`

---

*Documento vivo - Actualizar al final de cada fase*
