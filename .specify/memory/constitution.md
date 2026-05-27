# Constitución del Proyecto - Sistema de Vinculación UNL

## Propósito

Este documento establece las reglas fundamentales, principios de diseño y estándares que deben seguirse en el desarrollo del Sistema de Vinculación.

---

## 1. Visión del Proyecto

**Nombre:** Sistema de Vinculación UNL  
**Versión:** 1.0.0  
**Cliente:** Universidad Nacional de Loja - Coordinación de Vinculación

**Propósito:** Plataforma centralizada para gestión, monitoreo y evaluación de proyectos de vinculación y convenios interinstitucionales.

**Actores:**
- Docente: Director o responsable de proyecto
- Estudiante: Participante en actividades
- Coordinador: Coordinación de Vinculación
- Administrador: Gestión institucional

---

## 2. Principios de Diseño

### 2.1 Arquitectura

1. **Arquitectura Modular por Dominio (DDD)**
   - Cada app representa un dominio funcional claro
   - Apps: core, usuarios, proyectos, convenios, seguimiento, reportes, auditoria
   - Baja耦合 entre dominios

2. **API-First**
   - Todo el acceso a datos pasa por la API REST
   - Documentación OpenAPI 3.0 siempre sincronizada
   - Versionado de API en URLs (`/api/v1/`)

3. **Seguridad por Diseño**
   - Autenticación JWT obligatoria
   - Autorización RBAC por roles
   - Auditoría de todas las acciones

### 2.2 Código

1. **Python/Django**
   - Seguir PEP 8
   - Type hints obligatorios en funciones nuevas
   - Docstrings en formatos Google o NumPy
   - Models, Views, Serializers, Tests en archivos separados

2. **Django REST Framework**
   - Usar ViewSets para CRUD
   - Serializadores anidados para relaciones
   - Filters, Search, Ordering habilitados
   - Paginación estándar

3. **Nomenclatura**
   - Models: PascalCase (`Proyecto`, `Usuario`)
   - Fields: snake_case (`fecha_inicio`, `codigo`)
   - URLs: kebab-case (`/proyectos-en-ejecucion/`)
   - Enums: PascalCase con sufijo (EstadoProyecto)

### 2.3 Base de Datos

1. **PostgreSQL 14**
   - Todas las tablas con `created_at` y `updated_at`
   - Índices en campos de búsqueda frecuente
   - Foreign keys con `on_delete` explícito
   - Unique constraints donde aplique

2. **Migraciones**
   - Cada cambio de modelo requiere migración
   - Migraciones atómicas y reversibles
   - Data migrations para datos semilla

---

## 3. Modelo de Dominio

### 3.1 Entidades Core

**Proyecto** (Entidad Central)
- 8 estados: BORRADOR → EN_REVISION → APROBADO → EN_EJECUCION → FINALIZADO → CERRADO
- Tipos: VINCULACION, INVESTIGACION, EXTENSION, MIXTO
- Prioridades: BAJA, MEDIA, ALTA, CRITICA

**Convenio**
- Estados: BORRADOR → EN_REVISION → VIGENTE → FINALIZADO
- Tipos: MARCO, ESPECIFICO, COOPERACION, OTRO

**Usuario**
- Roles: ADMIN, COORDINADOR, DOCENTE, ESTUDIANTE, DIRECTIVO
- Vinculado a Carrera

### 3.2 Relaciones Clave

```
Proyecto 1:1 Presupuesto
Proyecto 1:N Objetivo → 1:N Indicador
Proyecto 1:N Actividad → 1:N Avance → 1:N Evidencia
Convenio 1:N Compromiso
Convenio 1:N Producto
Usuario N:M Proyecto (ParticipanteProyecto)
```

### 3.3 Máquinas de Estado

**Proyecto:**
```
BORRADOR → EN_REVISION → APROBADO → EN_EJECUCION → FINALIZADO → CERRADO
    ↑           ↑           ↑            ↑
    └── rechazar┘           └── suspender┘
    CANCELADO (desde cualquier estado)
```

---

## 4. Workflows

### 4.1 Flujo de Aprobación

1. **Formulación** (BORRADOR): Responsable crea y completa
2. **Revisión** (EN_REVISION): Coordinación revisa y observa
3. **Corrección** (si OBSERVADO): Vuelve a BORRADOR
4. **Aprobación** (APROBADO): Autoridad competente aprueba

### 4.2 Ciclo de Vida

1. Formulación → 2. Revisión → 3. Aprobación → 4. Ejecución → 5. Finalización → 6. Cierre

### 4.3 Seguimiento

- Registro de avances por actividad
- Evidencias con verificación
- Informes periódicos (INICIAL, PARCIAL, FINAL)
- Alertas automáticas por vencimientos

---

## 5. Estándares de Calidad

### 5.1 Documentación

- ✅ Especificación completa en `specs/`
- ✅ API documentada con OpenAPI 3.0
- ✅ README en cada app
- ✅ Comentarios en código complejo

### 5.2 Testing

- ✅ Tests de modelos obligatorios
- ✅ Tests de serializadores obligatorios
- ✅ Tests de views para endpoints críticos
- ✅ Cobertura mínima 80%

### 5.3 Seguridad

- ✅ JWT con expiración (60 min acceso, 1 día refresco)
- ✅ CORS configurado por entorno
- ✅ Validación de entrada en serializadores
- ✅ Sanitización de datos de usuario

---

## 6. Decisiones de Arquitectura (ADR)

| ADR | Decisión | Estado |
|-----|----------|--------|
| 001 | Django + DRF | Aceptado |
| 002 | JWT para autenticación | Aceptado |
| 003 | Arquitectura modular por dominio | Aceptado |
| 004 | SQLite dev / PostgreSQL prod | Aceptado |
| 005 | ViewSets para CRUD | Aceptado |
| 006 | drf-spectacular para OpenAPI | Aceptado |
| 007 | Permisos por rol | Aceptado |

---

## 7. Reglas de Negocio Críticas

1. **RF-01**: Solo ADMIN y COORDINADOR pueden aprobar proyectos
2. **RF-02**: Proyecto en BORRADOR solo puede ser editado por su responsable
3. **RF-03**: Cada cambio de estado debe quedar registrado en Auditoria
4. **RF-04**: Indicadores en ALERTA deben generar notificación automática
5. **RF-05**: Presupuestos requieren aprobación antes de ejecución
6. **RF-06**: Evidencias deben ser verificadas por coordinador
7. **RF-07**: Informes finales bloquean proyecto para cierre
8. **RF-08**: Cancelación requiere justificación obligatoria
9. **RF-09**: Participantes deben tener rol definido en proyecto
10. **RF-16**: Revisiones y validaciones son trazables (auditoría)

---

## 8. Checklist de Implementación

### Por Feature

- [ ] Modelo definido con campos y relaciones
- [ ] Serializador (read + write)
- [ ] ViewSet con permisos
- [ ] URLs registradas en router
- [ ] Tests de modelo
- [ ] Tests de serializador
- [ ] Tests de endpoint
- [ ] Documentación OpenAPI actualizada
- [ ] Migración creada y probada

### Por Release

- [ ] Todas las specs actualizadas
- [ ] Tests passing (>80% coverage)
- [ ] Migraciones aplicadas
- [ ] Documentación revisada
- [ ] CHANGELOG actualizado

---

## 9. Glosario

| Término | Definición |
|---------|------------|
| **Vinculación** | Proceso de conexión universidad-sociedad |
| **Convenio Marco** | Acuerdo general de cooperación |
| **Convenio Específico** | Acuerdo para proyecto particular |
| **Indicador** | Medida cuantitativa de resultado |
| **Línea Base** | Valor inicial de indicador |
| **Evidencia** | Comprobante de actividad realizada |
| **Revisión** | Evaluación formal de proyecto |

---

*Última actualización: Mayo 2026*  
*Este documento es la fuente de verdad para el desarrollo del sistema.*
