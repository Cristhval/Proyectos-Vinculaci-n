# Modelo de Entidades

## Core (base para todos los modelos)

### TimeStampedModel (Abstracto)
- `creado_en`: DateTimeField (auto_now_add)
- `actualizado_en`: DateTimeField (auto_now)

---

## Usuarios

### Carrera
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| codigo | CharField(30) unique | Codigo de la carrera |
| nombre | CharField(255) | Nombre de la carrera |
| facultad | CharField(255) | Facultad a la que pertenece |
| descripcion | TextField | Descripcion |
| activa | BooleanField | Estado activo/inactivo |

### Usuario
| Campo | Tipo | Relacion |
|-------|------|----------|
| user | OneToOneField(User) | Usuario base de Django |
| codigo | CharField(30) unique | Codigo institucional |
| documento_identidad | CharField(20) unique | Cedula/pasaporte |
| carrera | FK(Carrera) | Carrera a la que pertenece |
| rol | CharField(RolUsuario) | ADMIN, COORDINADOR, DOCENTE, ESTUDIANTE, DIRECTIVO |
| telefono | CharField(20) | Telefono de contacto |
| direccion | CharField(255) | Direccion |
| fecha_nacimiento | DateField | Fecha de nacimiento |
| biografia | TextField | Biografia |
| activo | BooleanField | Estado activo/inactivo |

---

## Proyectos

### Proyecto (Entidad Central)
| Campo | Tipo | Relacion |
|-------|------|----------|
| codigo | CharField(40) unique | Codigo del proyecto |
| titulo | CharField(255) | Titulo |
| resumen | TextField | Resumen ejecutivo |
| descripcion | TextField | Descripcion detallada |
| problema | TextField | Planteamiento del problema |
| justificacion | TextField | Justificacion |
| objetivo_general | TextField | Objetivo general |
| resultados_esperados | TextField | Resultados esperados |
| linea_intervencion | CharField(255) | Linea de intervencion |
| tipo | CharField(TipoProyecto) | VINCULACION, INVESTIGACION, EXTENSION, MIXTO |
| prioridad | CharField(PrioridadProyecto) | BAJA, MEDIA, ALTA, CRITICA |
| estado | CharField(EstadoProyecto) | BORRADOR, EN_REVISION, APROBADO, EN_EJECUCION, EN_SUSPENSION, FINALIZADO, CERRADO, CANCELADO |
| carrera | FK(Carrera) | Carrera responsable |
| responsable | FK(Usuario) | Responsable del proyecto |
| coordinador_academico | FK(Usuario) | Coordinador academico |
| fecha_inicio | DateField | Fecha de inicio |
| fecha_fin_planificada | DateField | Fecha fin planificada |
| fecha_fin_real | DateField | Fecha fin real |
| presupuesto_aprobado | DecimalField | Presupuesto aprobado |
| direccion_ejecucion | CharField(255) | Lugar de ejecucion |
| observaciones | TextField | Observaciones |
| activo | BooleanField | Proyecto activo |

### Objetivo
- FK a Proyecto (CASCADE)
- tipo (GENERAL, ESPECIFICO)
- orden, descripcion, meta, cumplido, fecha_cumplimiento, observaciones

### Indicador
- FK a Objetivo (CASCADE)
- codigo, nombre, descripcion, formula, unidad_medida
- linea_base, meta, valor_actual
- frecuencia (DIARIA, SEMANAL, MENSUAL, TRIMESTRAL, SEMESTRAL, ANUAL)
- estado (ACTIVO, EN_ALERTA, CUMPLIDO, NO_CUMPLIDO)
- fecha_medicion, observaciones

### Actividad
- FK a Proyecto (CASCADE), FK a Objetivo (SET_NULL)
- codigo, nombre, descripcion
- fechas, responsable, porcentajes, estado, orden
- requiere_evidencia, observaciones

### ParticipanteProyecto
- FK a Proyecto (CASCADE), FK a Usuario (CASCADE)
- rol (LIDER, DOCENTE, ESTUDIANTE, APOYO, EXTERNO)
- fechas, horas_comprometidas, horas_cumplidas, estado, observaciones
- unique_together: (proyecto, usuario, rol)

### Presupuesto
- OneToOneField a Proyecto (CASCADE)
- codigo, montos, estado, responsable, fecha_aprobacion, observaciones

### Beneficiario (NUEVO)
- FK a Proyecto (CASCADE)
- tipo (DIRECTO, INDIRECTO)
- nombre, descripcion, cantidad_estimada, ubicacion, observaciones

### AlineacionEstrategica (NUEVO)
- FK a Proyecto (CASCADE)
- eje, objetivo_estrategico, programa, plan, descripcion

### FirmaResponsabilidad (NUEVO)
- FK a Proyecto (CASCADE), FK a Usuario (CASCADE)
- tipo (RESPONSABLE, COORDINADOR, APROBADOR)
- fecha_firma, comentario
- unique_together: (proyecto, usuario, tipo)

---

## Convenios

### Institucion
- nombre, sigla, descripcion, direccion, telefono, email, sitio_web, activa

### Convenio
- FK a Institucion (SET_NULL)
- codigo, entidad_contraparte, objeto, descripcion
- fechas, tipo (MARCO, ESPECIFICO, COOPERACION, OTRO)
- estado (BORRADOR, EN_REVISION, VIGENTE, VENCIDO, SUSPENDIDO, FINALIZADO, CANCELADO)
- archivo_firmado, observaciones, activo

### ProyectoConvenio (Intermedia)
- FK a Proyecto, FK a Convenio
- fecha_vinculacion, vigente, observaciones
- unique_together: (proyecto, convenio)

### Compromiso (NUEVO)
- FK a Convenio (CASCADE)
- codigo, descripcion, fechas, responsable
- estado (PENDIENTE, EN_PROCESO, CUMPLIDO, INCUMPLIDO)
- observaciones
- unique_together: (convenio, codigo)

### Producto (NUEVO)
- FK a Convenio (CASCADE)
- codigo, nombre, descripcion, tipo
- fecha_entrega_esperada, fecha_entrega_real
- entregado, archivo, observaciones
- unique_together: (convenio, codigo)

### Contribucion (NUEVO)
- FK a Proyecto (CASCADE), FK a Institucion (SET_NULL)
- tipo (FINANCIERO, HORAS, INFRAESTRUCTURA, EQUIPO, SERVICIO, EXTERNO)
- descripcion, valor, fecha_aporte, observaciones

---

## Seguimiento

### Avance
- FK a Actividad (CASCADE)
- registrado_por (FK Usuario), porcentaje_avance, descripcion
- dificultades, acciones_correctivas, horas_invertidas
- fecha_registro, estado (PENDIENTE, EN_REVISION, APROBADO, RECHAZADO)

### Evidencia
- FK a Avance (CASCADE/null), FK a Actividad (CASCADE/null)
- tipo (FOTOGRAFIA, VIDEO, DOCUMENTO, ENLACE, OTRO)
- titulo, descripcion, archivo, enlace_externo, fecha_carga, verificada

### Informe
- FK a Proyecto (CASCADE)
- tipo (INICIAL, PARCIAL, FINAL, TECNICO, FINANCIERO)
- numero, titulo, resumen, contenido
- periodo, elaborado_por, aprobado_por, estado
- archivo, fecha_emision, observaciones
- unique_together: (proyecto, tipo, numero)

### Alerta
- FK a Usuario (CASCADE), FK a Proyecto (CASCADE/null), FK a Convenio (CASCADE/null)
- mensaje, detalle, prioridad, estado, enlace, leida, fecha_vencimiento

### Revision (NUEVO)
- FK a Proyecto (CASCADE), FK a Usuario (revisor)
- fecha_revision, decision (APROBADO, OBSERVADO, RECHAZADO)
- comentario, observaciones

### FlujoValidacion (NUEVO)
- FK a Proyecto (CASCADE), FK a Usuario (responsable)
- paso, nombre_paso, estado (PENDIENTE, COMPLETADO, RECHAZADO)
- fecha_completado, comentario

---

## Auditoria

### Auditoria
- FK a Usuario (SET_NULL)
- accion (CREAR, ACTUALIZAR, ELIMINAR, APROBAR, RECHAZAR, INICIAR_SESION)
- entidad, entidad_id, detalle, ip_address
