# Maquinas de Estado

## Proyecto

```
BORRADOR ──► EN_REVISION ──► APROBADO ──► EN_EJECUCION ──► FINALIZADO ──► CERRADO
    ▲             │               ▲              │
    │             ▼               │              ▼
    └────── (rechazar)            │         EN_SUSPENSION ──► (aprobar) ──► APROBADO
                                  │
                            CANCELADO (desde cualquier estado)
```

| Desde | Accion | Hasta |
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

## Convenio

```
BORRADOR ──► EN_REVISION ──► VIGENTE ──► FINALIZADO
    ▲                            │
    │                            ▼
    └────── (rechazar)      VENCIDO / SUSPENDIDO
```

## Actividad

```
PENDIENTE ──► EN_PROCESO ──► COMPLETADA
                  │
                  ▼
              ATRASADA / CANCELADA
```
