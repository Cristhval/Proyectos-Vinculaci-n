# UML DIAGRAMA DE CLASES - PROYECTOS DE VINCULACIÓN UNL
## (Refleja fielmente el código Django - models.py)

---

### HERENCIA BASE

Todas las clases heredan de `TimeStampedModel` y reciben:
```
- creado_en: DateTime
- actualizado_en: DateTime
```

---

## APP: usuarios

### Carrera
| Atributo | Tipo |
|----------|------|
| codigo | String |
| nombre | String |
| facultad | String |
| descripcion | String |
| activa | Boolean |

### Usuario
| Atributo | Tipo |
|----------|------|
| user | FK (OneToOne → django.auth.User) |
| codigo | String |
| documento_identidad | String |
| carrera | FK → Carrera |
| rol | RolUsuario (Enum) |
| telefono | String |
| direccion | String |
| fecha_nacimiento | Date |
| biografia | String |
| activo | Boolean |

### RolUsuario (Enum)
| Valor |
|-------|
| ADMIN - Administrador |
| COORDINADOR - Coordinador |
| DOCENTE - Docente |
| ESTUDIANTE - Estudiante |
| DIRECTIVO - Directivo |

### RELACIONES - usuarios
```
Usuario ──FK──→ Carrera
```

---

## APP: proyectos

### Proyecto
| Atributo | Tipo |
|----------|------|
| codigo | String |
| titulo | String |
| resumen | String |
| descripcion | String |
| problema | String |
| justificacion | String |
| objetivo_general | String |
| resultados_esperados | String |
| linea_intervencion | String |
| tipo | TipoProyecto (Enum) |
| prioridad | PrioridadProyecto (Enum) |
| estado | EstadoProyecto (Enum) |
| carrera | FK → Carrera |
| responsable | FK → Usuario |
| coordinador_academico | FK → Usuario |
| fecha_inicio | Date |
| fecha_fin_planificada | Date |
| fecha_fin_real | Date |
| presupuesto_aprobado | Double |
| direccion_ejecucion | String |
| observaciones | String |
| activo | Boolean |

### Objetivo
| Atributo | Tipo |
|----------|------|
| proyecto | FK → Proyecto |
| tipo | TipoObjetivo (Enum) |
| orden | Integer |
| descripcion | String |
| meta | String |
| cumplido | Boolean |
| fecha_cumplimiento | Date |
| observaciones | String |

### Indicador
| Atributo | Tipo |
|----------|------|
| objetivo | FK → Objetivo |
| codigo | String |
| nombre | String |
| descripcion | String |
| formula | String |
| unidad_medida | String |
| linea_base | Double |
| meta | Double |
| valor_actual | Double |
| frecuencia | FrecuenciaIndicador (Enum) |
| estado | EstadoIndicador (Enum) |
| fecha_medicion | Date |
| observaciones | String |

### Actividad
| Atributo | Tipo |
|----------|------|
| proyecto | FK → Proyecto |
| objetivo | FK → Objetivo |
| codigo | String |
| nombre | String |
| descripcion | String |
| fecha_inicio | Date |
| fecha_fin | Date |
| responsable | FK → Usuario |
| porcentaje_programado | Double |
| porcentaje_ejecucion | Double |
| estado | EstadoActividad (Enum) |
| orden | Integer |
| requiere_evidencia | Boolean |
| observaciones | String |

### ParticipanteProyecto
| Atributo | Tipo |
|----------|------|
| proyecto | FK → Proyecto |
| usuario | FK → Usuario |
| rol | RolParticipante (Enum) |
| fecha_inicio | Date |
| fecha_fin | Date |
| horas_comprometidas | Double |
| horas_cumplidas | Double |
| estado | String |
| observaciones | String |

### Presupuesto
| Atributo | Tipo |
|----------|------|
| proyecto | FK (OneToOne → Proyecto) |
| codigo | String |
| monto_aprobado | Double |
| monto_ejecutado | Double |
| monto_saldo | Double |
| estado | EstadoPresupuesto (Enum) |
| fecha_aprobacion | Date |
| responsable | FK → Usuario |
| observaciones | String |

### Beneficiario
| Atributo | Tipo |
|----------|------|
| proyecto | FK → Proyecto |
| tipo | String (DIRECTO / INDIRECTO) |
| nombre | String |
| descripcion | String |
| cantidad_estimada | Integer |
| ubicacion | String |
| observaciones | String |

### AlineacionEstrategica
| Atributo | Tipo |
|----------|------|
| proyecto | FK → Proyecto |
| eje | String |
| objetivo_estrategico | String |
| programa | String |
| plan | String |
| descripcion | String |

### FirmaResponsabilidad
| Atributo | Tipo |
|----------|------|
| proyecto | FK → Proyecto |
| usuario | FK → Usuario |
| tipo | String (RESPONSABLE / COORDINADOR / APROBADOR) |
| fecha_firma | Date |
| comentario | String |

### TipoProyecto (Enum)
| Valor |
|-------|
| VINCULACION - Vinculacion |
| INVESTIGACION - Investigacion |
| EXTENSION - Extension |
| MIXTO - Mixto |

### EstadoProyecto (Enum)
| Valor |
|-------|
| BORRADOR - Borrador |
| EN_REVISION - En revision |
| APROBADO - Aprobado |
| EN_EJECUCION - En ejecucion |
| EN_SUSPENSION - En suspension |
| FINALIZADO - Finalizado |
| CERRADO - Cerrado |
| CANCELADO - Cancelado |

### PrioridadProyecto (Enum)
| Valor |
|-------|
| BAJA - Baja |
| MEDIA - Media |
| ALTA - Alta |
| CRITICA - Critica |

### TipoObjetivo (Enum)
| Valor |
|-------|
| GENERAL - General |
| ESPECIFICO - Especifico |

### EstadoIndicador (Enum)
| Valor |
|-------|
| ACTIVO - Activo |
| EN_ALERTA - En alerta |
| CUMPLIDO - Cumplido |
| NO_CUMPLIDO - No cumplido |

### FrecuenciaIndicador (Enum)
| Valor |
|-------|
| DIARIA - Diaria |
| SEMANAL - Semanal |
| MENSUAL - Mensual |
| TRIMESTRAL - Trimestral |
| SEMESTRAL - Semestral |
| ANUAL - Anual |

### EstadoActividad (Enum)
| Valor |
|-------|
| PENDIENTE - Pendiente |
| EN_PROCESO - En proceso |
| COMPLETADA - Completada |
| ATRASADA - Atrasada |
| CANCELADA - Cancelada |

### EstadoPresupuesto (Enum)
| Valor |
|-------|
| BORRADOR - Borrador |
| APROBADO - Aprobado |
| EJECUTADO - Ejecutado |
| CERRADO - Cerrado |

### RolParticipante (Enum)
| Valor |
|-------|
| LIDER - Lider |
| DOCENTE - Docente |
| ESTUDIANTE - Estudiante |
| APOYO - Apoyo |
| EXTERNO - Externo |

### RELACIONES - proyectos
```
Proyecto       ──FK──→ Carrera
Proyecto       ──FK──→ Usuario (responsable)
Proyecto       ──FK──→ Usuario (coordinador_academico)
Proyecto   1 ──→ Objetivo              1..*  (Composicion)
Proyecto   1 ──→ Actividad             1..*  (Composicion)
Proyecto   1 ──→ ParticipanteProyecto  0..*  (Composicion)
Proyecto   1 ──→ Presupuesto           1     (OneToOne)
Proyecto   1 ──→ Beneficiario          0..*  (Composicion)
Proyecto   1 ──→ AlineacionEstrategica 0..*
Proyecto   1 ──→ FirmaResponsabilidad  0..*
Objetivo   1 ──→ Indicador             1..*  (Composicion)
Actividad  ──FK──→ Objetivo
Actividad  ──FK──→ Usuario (responsable)
ParticipanteProyecto ──FK──→ Usuario
Presupuesto ──FK──→ Usuario
FirmaResponsabilidad ──FK──→ Usuario
```

---

## APP: convenios

### Institucion
| Atributo | Tipo |
|----------|------|
| nombre | String |
| sigla | String |
| descripcion | String |
| direccion | String |
| telefono | String |
| email | String |
| sitio_web | String |
| activa | Boolean |

### Convenio
| Atributo | Tipo |
|----------|------|
| codigo | String |
| institucion | FK → Institucion |
| entidad_contraparte | String |
| objeto | String |
| descripcion | String |
| fecha_firma | Date |
| fecha_inicio | Date |
| fecha_fin | Date |
| tipo | TipoConvenio (Enum) |
| estado | EstadoConvenio (Enum) |
| archivo_firmado | String (FileField) |
| observaciones | String |
| activo | Boolean |

### ProyectoConvenio
| Atributo | Tipo |
|----------|------|
| proyecto | FK → Proyecto |
| convenio | FK → Convenio |
| fecha_vinculacion | Date |
| vigente | Boolean |
| observaciones | String |

### Compromiso
| Atributo | Tipo |
|----------|------|
| convenio | FK → Convenio |
| codigo | String |
| descripcion | String |
| fecha_compromiso | Date |
| fecha_vencimiento | Date |
| responsable | FK → Usuario |
| estado | EstadoCompromiso (Enum) |
| observaciones | String |

### Producto
| Atributo | Tipo |
|----------|------|
| convenio | FK → Convenio |
| codigo | String |
| nombre | String |
| descripcion | String |
| tipo | String |
| fecha_entrega_esperada | Date |
| fecha_entrega_real | Date |
| entregado | Boolean |
| archivo | String (FileField) |
| observaciones | String |

### Contribucion
| Atributo | Tipo |
|----------|------|
| proyecto | FK → Proyecto |
| institucion | FK → Institucion |
| tipo | TipoContribucion (Enum) |
| descripcion | String |
| valor | Double |
| fecha_aporte | Date |
| observaciones | String |

### TipoConvenio (Enum)
| Valor |
|-------|
| MARCO - Marco |
| ESPECIFICO - Especifico |
| COOPERACION - Cooperacion |
| OTRO - Otro |

### EstadoConvenio (Enum)
| Valor |
|-------|
| BORRADOR - Borrador |
| EN_REVISION - En revision |
| VIGENTE - Vigente |
| VENCIDO - Vencido |
| SUSPENDIDO - Suspendido |
| FINALIZADO - Finalizado |
| CANCELADO - Cancelado |

### EstadoCompromiso (Enum)
| Valor |
|-------|
| PENDIENTE - Pendiente |
| EN_PROCESO - En proceso |
| CUMPLIDO - Cumplido |
| INCUMPLIDO - Incumplido |

### TipoContribucion (Enum)
| Valor |
|-------|
| FINANCIERO - Financiero |
| HORAS - Horas |
| INFRAESTRUCTURA - Infraestructura |
| EQUIPO - Equipo |
| SERVICIO - Servicio |
| EXTERNO - Externo |

### RELACIONES - convenios
```
Convenio       ──FK──→ Institucion
ProyectoConvenio ──FK──→ Proyecto
ProyectoConvenio ──FK──→ Convenio
Compromiso     ──FK──→ Convenio
Compromiso     ──FK──→ Usuario
Producto       ──FK──→ Convenio
Contribucion   ──FK──→ Proyecto
Contribucion   ──FK──→ Institucion
```

---

## APP: seguimiento

### Avance
| Atributo | Tipo |
|----------|------|
| actividad | FK → Actividad |
| registrado_por | FK → Usuario |
| porcentaje_avance | Double |
| descripcion | String |
| dificultades | String |
| acciones_correctivas | String |
| horas_invertidas | Double |
| fecha_registro | Date |
| estado | EstadoAvance (Enum) |

### Evidencia
| Atributo | Tipo |
|----------|------|
| avance | FK → Avance |
| actividad | FK → Actividad |
| tipo | TipoEvidencia (Enum) |
| titulo | String |
| descripcion | String |
| archivo | String (FileField) |
| enlace_externo | String |
| fecha_carga | Date |
| verificada | Boolean |

### Informe
| Atributo | Tipo |
|----------|------|
| proyecto | FK → Proyecto |
| tipo | TipoInforme (Enum) |
| numero | String |
| titulo | String |
| resumen | String |
| contenido | String |
| periodo_inicio | Date |
| periodo_fin | Date |
| elaborado_por | FK → Usuario |
| aprobado_por | FK → Usuario |
| estado | String |
| archivo | String (FileField) |
| fecha_emision | Date |
| observaciones | String |

### Alerta
| Atributo | Tipo |
|----------|------|
| usuario | FK → Usuario |
| proyecto | FK → Proyecto |
| convenio | FK → Convenio |
| mensaje | String |
| detalle | String |
| prioridad | PrioridadAlerta (Enum) |
| estado | EstadoAlerta (Enum) |
| enlace | String |
| leida | Boolean |
| fecha_vencimiento | DateTime |

### Revision
| Atributo | Tipo |
|----------|------|
| proyecto | FK → Proyecto |
| revisor | FK → Usuario |
| fecha_revision | Date |
| decision | String (APROBADO / OBSERVADO / RECHAZADO) |
| comentario | String |
| observaciones | String |

### FlujoValidacion
| Atributo | Tipo |
|----------|------|
| proyecto | FK → Proyecto |
| paso | Integer |
| nombre_paso | String |
| responsable | FK → Usuario |
| estado | String (PENDIENTE / COMPLETADO / RECHAZADO) |
| fecha_completado | Date |
| comentario | String |

### EstadoAvance (Enum)
| Valor |
|-------|
| PENDIENTE - Pendiente |
| EN_REVISION - En revision |
| APROBADO - Aprobado |
| RECHAZADO - Rechazado |

### TipoEvidencia (Enum)
| Valor |
|-------|
| FOTOGRAFIA - Fotografia |
| VIDEO - Video |
| DOCUMENTO - Documento |
| ENLACE - Enlace |
| OTRO - Otro |

### TipoInforme (Enum)
| Valor |
|-------|
| INICIAL - Inicial |
| PARCIAL - Parcial |
| FINAL - Final |
| TECNICO - Tecnico |
| FINANCIERO - Financiero |

### EstadoAlerta (Enum)
| Valor |
|-------|
| PENDIENTE - Pendiente |
| LEIDA - Leida |
| ATENDIDA - Atendida |
| CANCELADA - Cancelada |

### PrioridadAlerta (Enum)
| Valor |
|-------|
| BAJA - Baja |
| MEDIA - Media |
| ALTA - Alta |
| URGENTE - Urgente |

### RELACIONES - seguimiento
```
Avance      ──FK──→ Actividad
Avance      ──FK──→ Usuario (registrado_por)
Evidencia   ──FK──→ Avance
Evidencia   ──FK──→ Actividad
Informe     ──FK──→ Proyecto
Informe     ──FK──→ Usuario (elaborado_por)
Informe     ──FK──→ Usuario (aprobado_por)
Alerta      ──FK──→ Usuario
Alerta      ──FK──→ Proyecto
Alerta      ──FK──→ Convenio
Revision    ──FK──→ Proyecto
Revision    ──FK──→ Usuario (revisor)
FlujoValidacion ──FK──→ Proyecto
FlujoValidacion ──FK──→ Usuario (responsable)
```

---

## APP: auditoria

### Auditoria
| Atributo | Tipo |
|----------|------|
| usuario | FK → Usuario |
| accion | TipoAccion (Enum) |
| entidad | String |
| entidad_id | Integer |
| detalle | String |
| ip_address | String |

### TipoAccion (Enum)
| Valor |
|-------|
| CREAR - Crear |
| ACTUALIZAR - Actualizar |
| ELIMINAR - Eliminar |
| APROBAR - Aprobar |
| RECHAZAR - Rechazar |
| INICIAR_SESION - Iniciar sesion |

### RELACIONES - auditoria
```
Auditoria ──FK──→ Usuario
```

---

## RESUMEN GENERAL

| App | Clases | Enums |
|-----|--------|-------|
| usuarios | 2 (Carrera, Usuario) | 1 (RolUsuario) |
| proyectos | 9 (Proyecto, Objetivo, Indicador, Actividad, ParticipanteProyecto, Presupuesto, Beneficiario, AlineacionEstrategica, FirmaResponsabilidad) | 9 |
| convenios | 6 (Institucion, Convenio, ProyectoConvenio, Compromiso, Producto, Contribucion) | 4 |
| seguimiento | 6 (Avance, Evidencia, Informe, Alerta, Revision, FlujoValidacion) | 5 |
| auditoria | 1 (Auditoria) | 1 (TipoAccion) |

**Totales: 24 clases, 20 enums, ~180 atributos**

---

### NOTAS
- Todas las clases heredan `creado_en` y `actualizado_en` de TimeStampedModel
- Las FK indican navegabilidad: A ──FK──→ B significa que A contiene la llave foránea hacia B
- Las cardinalidades de composición se indican como: Padre 1 ──→ Hijo 0..*
