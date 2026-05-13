# Specs

Fuente unica de especificaciones para el Sistema de Vinculacion.

## Estructura

```
specs/
├── README.md                      # Este archivo
├── api/
│   └── openapi.yml                # Especificacion OpenAPI 3.0 completa
├── dominio/
│   ├── modelo-entidades.md        # Descripcion de entidades y relaciones
│   ├── diagrama-entidad-relacion.md
│   └── estados.md                 # Maquina de estados de entidades
├── workflows/
│   ├── flujo-aprobacion.md        # Flujo de revision y aprobacion de proyectos
│   └── ciclo-vida-proyecto.md     # Transiciones de estado del proyecto
├── arquitectura/
│   └── decisiones.md              # ADR - Architecture Decision Records
└── postman/
    └── coleccion.json             # Coleccion Postman para pruebas
```

## Uso

La especificacion OpenAPI se puede visualizar en:
- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`

La coleccion Postman contiene todos los endpoints documentados para pruebas rapidas.
