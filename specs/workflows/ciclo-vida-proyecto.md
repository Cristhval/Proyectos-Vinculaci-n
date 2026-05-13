# Ciclo de Vida del Proyecto

Basado en el estado `EstadoProyecto` del modelo `Proyecto`.

## Transiciones permitidas

```
  ┌──────────┐    enviar     ┌─────────────┐    aprobar    ┌──────────┐
  │ BORRADOR │──────────────►│ EN_REVISION  │──────────────►│ APROBADO │
  └──────────┘               └──────┬───────┘               └────┬─────┘
       ▲                            │                            │
       │       rechazar             │                            │ iniciar
       └────────────────────────────┘                            │
                                                                 ▼
  ┌──────────┐               ┌──────────────┐          ┌────────────────┐
  │  CERRADO │◄── cerrar ───│  FINALIZADO  │◄─── finalizar ───│ EN_EJECUCION  │
  └──────────┘               └──────────────┘                 └───────┬────────┘
                                                                      │
                                                    ┌─────────────────┘
                                                    │ suspender
                                                    ▼
                                             ┌────────────────┐
                                             │ EN_SUSPENSION  │──► aprobar ──► APROBADO
                                             └────────────────┘
  
  ┌──────────┐
  │ CANCELADO│ ◄── cancelar (desde cualquier estado)
  └──────────┘
```

## Fases del ciclo de vida

### 1. Formulacion (BORRADOR)
- Proyecto en creacion/edicion
- No visible para procesos oficiales
- Puede ser modificado libremente por el responsable

### 2. Revision (EN_REVISION)
- Sometido a analisis por la Coordinacion de Vinculacion
- Se registran observaciones tecnicas
- Se evalua pertinencia, factibilidad e impacto

### 3. Aprobacion (APROBADO)
- Validado por las autoridades competentes
- Listo para iniciar ejecucion
- Se habilita la gestion de actividades y participantes

### 4. Ejecucion (EN_EJECUCION)
- Actividades en desarrollo
- Registro de avances, evidencias e informes
- Monitoreo de indicadores y presupuesto

### 5. Suspension (EN_SUSPENSION)
- Ejecucion pausada temporalmente
- Requiere aprobacion para reactivar
- Las actividades se marcan como pausadas

### 6. Finalizacion (FINALIZADO)
- Todas las actividades completadas
- Informe final generado
- Evaluacion de resultados e impactos

### 7. Cierre (CERRADO)
- Proyecto archivado
- Lecciones aprendidas registradas
- Solo lectura

### 8. Cancelacion (CANCELADO)
- Proyecto cancelado por cualquier motivo
- Registro de causa de cancelacion
- Solo lectura
