# Diagrama Entidad-Relacion

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
