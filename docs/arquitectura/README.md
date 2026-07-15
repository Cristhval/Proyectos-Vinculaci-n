# Arquitectura del Sistema

## Vision General

El sistema sigue una arquitectura **monolitica modular** basada en Django,
con una API REST que consume una SPA (Single Page Application) en React.

## Diagrama C4 - Nivel 1 (Contexto)

```mermaid
graph TB
    User[Usuario Universitario] --> Frontend[React SPA]
    Frontend -->|HTTP/REST JWT| Backend[Django REST API]
    Backend --> DB[(SQLite/PostgreSQL)]
    Backend --> FileSystem[Media Files]
```

## Diagrama C4 - Nivel 2 (Contenedores)

```mermaid
graph TB
    subgraph Frontend["Frontend - React SPA"]
        UI[Componentes UI]
        Features[Feature Modules]
        Store[Zustand Store]
    end

    subgraph Backend["Backend - Django REST Framework"]
        Apps[Django Apps]
        Auth[JWT Authentication]
        Audit[Audit Middleware]
    end

    subgraph Data["Data Layer"]
        DB[(SQLite)]
        Media[Media Files]
    end

    Frontend --> Backend
    Backend --> Data
```

## Diagrama de Modulos Backend

```mermaid
graph LR
    subgraph core["core"]
        Models[Modelos Abstractos]
        Perms[Permisos RBAC]
        Utils[Utilidades]
    end

    subgraph usuarios["usuarios"]
        Auth[Autenticacion]
        Users[Gestion de Usuarios]
    end

    subgraph proyectos["proyectos"]
        Projects[Gestion de Proyectos]
        Activities[Actividades]
        Indicators[Indicadores]
    end

    subgraph convenios["convenios"]
        Agreements[Convenios]
        Institutions[Instituciones]
    end

    subgraph seguimiento["seguimiento"]
        Advances[Avances]
        Evidence[Evidencias]
        Reports[Informes]
        Alerts[Alertas]
    end

    subgraph reportes["reportes"]
        Dashboard[Dashboard]
        Analytics[Analytics]
        Export[Exportacion]
    end

    subgraph auditoria["auditoria"]
        AuditLog[Log de Auditoria]
        Middleware[Middleware]
    end

    core --> usuarios
    core --> proyectos
    core --> convenios
    core --> seguimiento
    core --> reportes
    core --> auditoria
```

## Patron de Flujo de Proyectos

```mermaid
stateDiagram-v2
    [*] --> BORRADOR
    BORRADOR --> EN_REVISION : Enviar para revision
    EN_REVISION --> APROBADO : Aprobar
    EN_REVISION --> BORRADOR : Observar
    APROBADO --> EN_EJECUCION : Iniciar
    EN_EJECUCION --> EN_SUSPENSION : Suspender
    EN_SUSPENSION --> EN_EJECUCION : Reanudar
    EN_EJECUCION --> FINALIZADO : Finalizar
    FINALIZADO --> CERRADO : Cerrar
    BORRADOR --> CANCELADO : Cancelar
    EN_REVISION --> CANCELADO : Cancelar
    APROBADO --> CANCELADO : Cancelar
    EN_EJECUCION --> CANCELADO : Cancelar
```

## Patron de Flujo de Convenios

```mermaid
stateDiagram-v2
    [*] --> BORRADOR
    BORRADOR --> EN_REVISION : Enviar
    EN_REVISION --> VIGENTE : Aprobar
    EN_REVISION --> BORRADOR : Observar
    VIGENTE --> VENCIDO : Por tiempo
    VIGENTE --> SUSPENDIDO : Suspender
    VIGENTE --> FINALIZADO : Finalizar
    SUSPENDIDO --> VIGENTE : Reactivar
    VIGENTE --> CANCELADO : Cancelar
    BORRADOR --> CANCELADO : Cancelar
```

## Patrones de Diseno Aplicados

- **Repository Pattern**: Modelos Django como capa de acceso a datos
- **Service Layer**: Logica de negocio en `services.py` de cada app
- **Serializer Pattern**: DRF Serializers para validacion y transformacion
- **RBAC**: Control de acceso basado en roles jerarquicos
- **Middleware Pattern**: Auditoria automatica via middleware
- **Signal Pattern**: Eventos Django para logging automatico
