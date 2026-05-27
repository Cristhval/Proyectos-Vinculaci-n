# UML-FINAL: Diagrama de Clases - Sistema de Vinculacion UNL

> Este documento refleja exactamente las clases, atributos, operaciones y relaciones
> implementadas en el backend Django. Usar como referencia para el diagrama UML final.

---

## Enumeraciones (TextChoices)

### usuarios

#### RolUsuario
| Valor | Etiqueta |
|-------|----------|
| ADMIN | Administrador |
| COORDINADOR | Coordinador |
| DOCENTE | Docente |
| ESTUDIANTE | Estudiante |
| DIRECTIVO | Directivo |

---

### proyectos

#### TipoProyecto
| Valor | Etiqueta |
|-------|----------|
| VINCULACION | Vinculacion |
| INVESTIGACION | Investigacion |
| EXTENSION | Extension |
| MIXTO | Mixto |

#### EstadoProyecto
| Valor | Etiqueta |
|-------|----------|
| BORRADOR | Borrador |
| EN_REVISION | En revision |
| APROBADO | Aprobado |
| EN_EJECUCION | En ejecucion |
| EN_SUSPENSION | En suspension |
| FINALIZADO | Finalizado |
| CERRADO | Cerrado |
| CANCELADO | Cancelado |

#### PrioridadProyecto
| Valor | Etiqueta |
|-------|----------|
| BAJA | Baja |
| MEDIA | Media |
| ALTA | Alta |
| CRITICA | Critica |

#### TipoObjetivo
| Valor | Etiqueta |
|-------|----------|
| GENERAL | General |
| ESPECIFICO | Especifico |

#### EstadoIndicador
| Valor | Etiqueta |
|-------|----------|
| ACTIVO | Activo |
| EN_ALERTA | En alerta |
| CUMPLIDO | Cumplido |
| NO_CUMPLIDO | No cumplido |

#### FrecuenciaIndicador
| Valor | Etiqueta |
|-------|----------|
| DIARIA | Diaria |
| SEMANAL | Semanal |
| MENSUAL | Mensual |
| TRIMESTRAL | Trimestral |
| SEMESTRAL | Semestral |
| ANUAL | Anual |

#### EstadoActividad
| Valor | Etiqueta |
|-------|----------|
| PENDIENTE | Pendiente |
| EN_PROCESO | En proceso |
| COMPLETADA | Completada |
| ATRASADA | Atrasada |
| CANCELADA | Cancelada |

#### RolParticipante
| Valor | Etiqueta |
|-------|----------|
| LIDER | Lider |
| DOCENTE | Docente |
| ESTUDIANTE | Estudiante |
| APOYO | Apoyo |
| EXTERNO | Externo |

#### EstadoParticipante
| Valor | Etiqueta |
|-------|----------|
| ACTIVO | Activo |
| INACTIVO | Inactivo |
| RETIRADO | Retirado |

#### EstadoPresupuesto
| Valor | Etiqueta |
|-------|----------|
| PENDIENTE | Pendiente |
| APROBADO | Aprobado |
| EJECUTADO | Ejecutado |

#### TipoBeneficiario
| Valor | Etiqueta |
|-------|----------|
| DIRECTO | Directo |
| INDIRECTO | Indirecto |

#### TipoFirma
| Valor | Etiqueta |
|-------|----------|
| RESPONSABLE | Responsable |
| COORDINADOR | Coordinador |
| APROBADOR | Aprobador |

---

### convenios

#### TipoConvenio
| Valor | Etiqueta |
|-------|----------|
| MARCO | Marco |
| ESPECIFICO | Especifico |
| COOPERACION | Cooperacion |
| OTRO | Otro |

#### EstadoConvenio
| Valor | Etiqueta |
|-------|----------|
| BORRADOR | Borrador |
| EN_REVISION | En revision |
| VIGENTE | Vigente |
| VENCIDO | Vencido |
| SUSPENDIDO | Suspendido |
| FINALIZADO | Finalizado |
| CANCELADO | Cancelado |

#### EstadoCompromiso
| Valor | Etiqueta |
|-------|----------|
| PENDIENTE | Pendiente |
| EN_PROCESO | En proceso |
| CUMPLIDO | Cumplido |
| INCUMPLIDO | Incumplido |

#### TipoContribucion
| Valor | Etiqueta |
|-------|----------|
| FINANCIERO | Financiero |
| HORAS | Horas |
| INFRAESTRUCTURA | Infraestructura |
| EQUIPO | Equipo |
| SERVICIO | Servicio |
| EXTERNO | Externo |

---

### seguimiento

#### EstadoAvance
| Valor | Etiqueta |
|-------|----------|
| PENDIENTE | Pendiente |
| EN_REVISION | En revision |
| APROBADO | Aprobado |
| RECHAZADO | Rechazado |

#### TipoEvidencia
| Valor | Etiqueta |
|-------|----------|
| FOTOGRAFIA | Fotografia |
| VIDEO | Video |
| DOCUMENTO | Documento |
| ENLACE | Enlace |
| OTRO | Otro |

#### TipoInforme
| Valor | Etiqueta |
|-------|----------|
| INICIAL | Inicial |
| PARCIAL | Parcial |
| FINAL | Final |
| TECNICO | Tecnico |
| FINANCIERO | Financiero |

#### EstadoAlerta
| Valor | Etiqueta |
|-------|----------|
| PENDIENTE | Pendiente |
| LEIDA | Leida |
| ATENDIDA | Atendida |
| CANCELADA | Cancelada |

#### PrioridadAlerta
| Valor | Etiqueta |
|-------|----------|
| BAJA | Baja |
| MEDIA | Media |
| ALTA | Alta |
| URGENTE | Urgente |

---

### auditoria

#### TipoAccion
| Valor | Etiqueta |
|-------|----------|
| CREAR | Crear |
| ACTUALIZAR | Actualizar |
| ELIMINAR | Eliminar |
| APROBAR | Aprobar |
| RECHAZAR | Rechazar |
| INICIAR_SESION | Iniciar sesion |

---

## Clases Abstractas

### TimeStampedModel (abstract) — core.models

| Atributo | Tipo | Restriccion |
|----------|------|-------------|
| creado_en | DateTimeField | auto_now_add=True |
| actualizado_en | DateTimeField | auto_now=True |

> Todas las clases concretas heredan de TimeStampedModel.

---

## Clases por Modulo

### App: usuarios

#### Carrera

| Atributo | Tipo | Restriccion |
|----------|------|-------------|
| id | BigAutoField | PK |
| codigo | CharField(30) | unique |
| nombre | CharField(255) | |
| facultad | CharField(255) | |
| descripcion | TextField | blank |
| activa | BooleanField | default=True |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Operaciones:** CRUD via CarreraViewSet (Admin: write, Auth: read)

---

#### Usuario

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| user | OneToOneField(User) | CASCADE, related_name='perfil' |
| codigo | CharField(30) | unique |
| documento_identidad | CharField(20) | unique, blank, null |
| carrera | ForeignKey(Carrera) | SET_NULL, null, blank, related_name='usuarios' |
| rol | CharField(20) | choices=RolUsuario, default=ESTUDIANTE |
| telefono | CharField(20) | blank |
| direccion | CharField(255) | blank |
| fecha_nacimiento | DateField | null, blank |
| biografia | TextField | blank |
| activo | BooleanField | default=True |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Relaciones:**
- Usuario *---1 User (Django auth)
- Usuario *---0..1 Carrera

**Operaciones:**
- CRUD via UsuarioViewSet (Admin: write, Auth: read)
- `GET /me/` — perfil del usuario autenticado
- `perform_destroy()` — soft delete (activo=False)

---

### App: proyectos

#### Proyecto

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| codigo | CharField(40) | unique |
| titulo | CharField(255) | |
| resumen | TextField | blank |
| descripcion | TextField | blank |
| problema | TextField | blank |
| justificacion | TextField | blank |
| objetivo_general | TextField | blank |
| resultados_esperados | TextField | blank |
| linea_intervencion | CharField(255) | blank |
| tipo | CharField(20) | choices=TipoProyecto, default=VINCULACION |
| prioridad | CharField(20) | choices=PrioridadProyecto, default=MEDIA |
| estado | CharField(20) | choices=EstadoProyecto, default=BORRADOR |
| carrera | ForeignKey(Carrera) | SET_NULL, null, blank, related_name='proyectos' |
| responsable | ForeignKey(Usuario) | SET_NULL, null, blank, related_name='proyectos_responsable' |
| coordinador_academico | ForeignKey(Usuario) | SET_NULL, null, blank, related_name='proyectos_coordinados' |
| fecha_inicio | DateField | null, blank |
| fecha_fin_planificada | DateField | null, blank |
| fecha_fin_real | DateField | null, blank |
| presupuesto_aprobado | DecimalField(12,2) | default=0 |
| direccion_ejecucion | CharField(255) | blank |
| observaciones | TextField | blank |
| activo | BooleanField | default=True |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Relaciones:**
- Proyecto *---0..1 Carrera
- Proyecto *---0..1 Usuario (responsable)
- Proyecto *---0..1 Usuario (coordinador_academico)
- Proyecto 1---* Objetivo
- Proyecto 1---* Actividad
- Proyecto 1---* ParticipanteProyecto
- Proyecto 1---0..1 Presupuesto
- Proyecto 1---* Beneficiario
- Proyecto 1---* AlineacionEstrategica
- Proyecto 1---* FirmaResponsabilidad

**Operaciones (ProyectoViewSet + ProyectoWorkflowService):**
- CRUD (Coordinador/Admin: write, Auth: read)
- `POST /{id}/enviar-revision/` — BORRADOR -> EN_REVISION
- `POST /{id}/aprobar/` — EN_REVISION -> APROBADO | EN_SUSPENSION -> APROBADO
- `POST /{id}/rechazar/` — EN_REVISION -> BORRADOR
- `POST /{id}/iniciar-ejecucion/` — APROBADO -> EN_EJECUCION
- `POST /{id}/suspender/` — EN_EJECUCION -> EN_SUSPENSION
- `POST /{id}/reanudar/` — EN_SUSPENSION -> EN_EJECUCION
- `POST /{id}/finalizar/` — EN_EJECUCION -> FINALIZADO (sets fecha_fin_real)
- `POST /{id}/cerrar/` — FINALIZADO -> CERRADO
- `POST /{id}/cancelar/` — * -> CANCELADO (except CERRADO/CANCELADO)
- `perform_create()` — genera codigo automatico PRJ-XXXXX

---

#### Objetivo

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| proyecto | ForeignKey(Proyecto) | CASCADE, related_name='objetivos' |
| tipo | CharField(20) | choices=TipoObjetivo, default=ESPECIFICO |
| orden | PositiveIntegerField | default=1 |
| descripcion | TextField | |
| meta | TextField | blank |
| cumplido | BooleanField | default=False |
| fecha_cumplimiento | DateField | null, blank |
| observaciones | TextField | blank |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Meta:** ordering = ['proyecto', 'orden']

**Operaciones:** CRUD via ObjetivoViewSet (Coordinador/Admin: write, Auth: read)

---

#### Indicador

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| objetivo | ForeignKey(Objetivo) | CASCADE, related_name='indicadores' |
| codigo | CharField(40) | |
| nombre | CharField(255) | |
| descripcion | TextField | blank |
| formula | CharField(255) | blank |
| unidad_medida | CharField(50) | blank |
| linea_base | DecimalField(10,2) | default=0 |
| meta | DecimalField(10,2) | default=0 |
| valor_actual | DecimalField(10,2) | default=0 |
| frecuencia | CharField(20) | choices=FrecuenciaIndicador, default=MENSUAL |
| estado | CharField(20) | choices=EstadoIndicador, default=ACTIVO |
| fecha_medicion | DateField | null, blank |
| observaciones | TextField | blank |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Meta:** ordering = ['objetivo', 'codigo']

**Operaciones (IndicadorViewSet + IndicadorMedicionService):**
- CRUD (Docente+: write, Auth: read)
- `POST /{id}/medir/` — actualiza valor_actual, fecha_medicion; marca CUMPLIDO si valor >= meta

---

#### Actividad

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| proyecto | ForeignKey(Proyecto) | CASCADE, related_name='actividades' |
| objetivo | ForeignKey(Objetivo) | SET_NULL, null, blank, related_name='actividades' |
| codigo | CharField(40) | |
| nombre | CharField(255) | |
| descripcion | TextField | blank |
| fecha_inicio | DateField | null, blank |
| fecha_fin | DateField | null, blank |
| responsable | ForeignKey(Usuario) | SET_NULL, null, blank, related_name='actividades_responsable' |
| porcentaje_programado | DecimalField(5,2) | default=0 |
| porcentaje_ejecucion | DecimalField(5,2) | default=0 |
| estado | CharField(20) | choices=EstadoActividad, default=PENDIENTE |
| orden | PositiveIntegerField | default=1 |
| requiere_evidencia | BooleanField | default=False |
| observaciones | TextField | blank |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Meta:** ordering = ['proyecto', 'orden']

**Operaciones:** CRUD via ActividadViewSet (Docente+: write, Auth: read)

---

#### ParticipanteProyecto

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| proyecto | ForeignKey(Proyecto) | CASCADE, related_name='participantes' |
| usuario | ForeignKey(Usuario) | CASCADE, related_name='participaciones' |
| rol | CharField(20) | choices=RolParticipante, default=ESTUDIANTE |
| fecha_inicio | DateField | null, blank |
| fecha_fin | DateField | null, blank |
| horas_comprometidas | DecimalField(8,2) | default=0 |
| horas_cumplidas | DecimalField(8,2) | default=0 |
| estado | CharField(20) | choices=EstadoParticipante, default=ACTIVO |
| observaciones | TextField | blank |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Meta:** unique_together = (proyecto, usuario, rol), ordering = ['proyecto']

**Operaciones:** CRUD via ParticipanteProyectoViewSet (Coordinador/Admin: write, Auth: read)

---

#### Presupuesto

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| proyecto | OneToOneField(Proyecto) | CASCADE, related_name='presupuesto' |
| codigo | CharField(40) | blank |
| monto_aprobado | DecimalField(12,2) | default=0 |
| monto_ejecutado | DecimalField(12,2) | default=0 |
| monto_saldo | DecimalField(12,2) | default=0 |
| estado | CharField(20) | choices=EstadoPresupuesto, default=PENDIENTE |
| fecha_aprobacion | DateField | null, blank |
| responsable | ForeignKey(Usuario) | SET_NULL, null, blank, related_name='presupuestos_responsable' |
| observaciones | TextField | blank |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Operaciones:** CRUD via PresupuestoViewSet (Coordinador/Admin: write, Auth: read)

---

#### Beneficiario

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| proyecto | ForeignKey(Proyecto) | CASCADE, related_name='beneficiarios' |
| tipo | CharField(20) | choices=TipoBeneficiario, default=DIRECTO |
| nombre | CharField(255) | |
| descripcion | TextField | blank |
| cantidad_estimada | PositiveIntegerField | default=0 |
| ubicacion | CharField(255) | blank |
| observaciones | TextField | blank |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Operaciones:** CRUD via BeneficiarioViewSet (Docente+: write, Auth: read)

---

#### AlineacionEstrategica

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| proyecto | ForeignKey(Proyecto) | CASCADE, related_name='alineaciones' |
| eje | CharField(255) | |
| objetivo_estrategico | CharField(255) | blank |
| programa | CharField(255) | blank |
| plan | CharField(255) | blank |
| descripcion | TextField | blank |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Operaciones:** CRUD via AlineacionEstrategicaViewSet (Docente+: write, Auth: read)

---

#### FirmaResponsabilidad

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| proyecto | ForeignKey(Proyecto) | CASCADE, related_name='firmas' |
| usuario | ForeignKey(Usuario) | CASCADE, related_name='firmas_responsabilidad' |
| tipo | CharField(20) | choices=TipoFirma, default=RESPONSABLE |
| fecha_firma | DateField | null, blank |
| comentario | TextField | blank |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Meta:** unique_together = (proyecto, usuario, tipo)

**Operaciones:** CRUD via FirmaResponsabilidadViewSet (Coordinador/Admin: write, Auth: read)

---

### App: convenios

#### Institucion

| Atributo | Tipo | Restriccion |
|----------|------|-------------|
| id | BigAutoField | PK |
| nombre | CharField(255) | |
| sigla | CharField(50) | blank |
| descripcion | TextField | blank |
| direccion | CharField(255) | blank |
| telefono | CharField(20) | blank |
| email | EmailField | blank |
| sitio_web | URLField | blank |
| activa | BooleanField | default=True |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Operaciones:** CRUD via InstitucionViewSet (Coordinador/Admin: write, Auth: read)

---

#### Convenio

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| codigo | CharField(40) | unique |
| institucion | ForeignKey(Institucion) | SET_NULL, null, blank, related_name='convenios' |
| entidad_contraparte | CharField(255) | |
| objeto | TextField | |
| descripcion | TextField | blank |
| fecha_firma | DateField | null, blank |
| fecha_inicio | DateField | null, blank |
| fecha_fin | DateField | null, blank |
| tipo | CharField(20) | choices=TipoConvenio, default=ESPECIFICO |
| estado | CharField(20) | choices=EstadoConvenio, default=BORRADOR |
| archivo_firmado | FileField | upload_to='convenios/', null, blank |
| observaciones | TextField | blank |
| activo | BooleanField | default=True |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Relaciones:**
- Convenio *---0..1 Institucion
- Convenio 1---* Compromiso
- Convenio 1---* Producto
- Convenio *---* Proyecto (via ProyectoConvenio)

**Operaciones (ConvenioViewSet + ConvenioWorkflowService):**
- CRUD (Coordinador/Admin: write, Auth: read)
- `POST /{id}/enviar-revision/` — BORRADOR -> EN_REVISION
- `POST /{id}/aprobar/` — EN_REVISION -> VIGENTE
- `POST /{id}/rechazar/` — EN_REVISION -> BORRADOR
- `POST /{id}/suspender/` — VIGENTE -> SUSPENDIDO
- `POST /{id}/finalizar/` — VIGENTE -> FINALIZADO
- `POST /{id}/cancelar/` — * -> CANCELADO (except FINALIZADO/CANCELADO)

---

#### ProyectoConvenio

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| proyecto | ForeignKey(Proyecto) | CASCADE, related_name='vinculaciones_convenio' |
| convenio | ForeignKey(Convenio) | CASCADE, related_name='vinculaciones_proyecto' |
| fecha_vinculacion | DateField | auto_now_add |
| vigente | BooleanField | default=True |
| observaciones | TextField | blank |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Meta:** unique_together = (proyecto, convenio)

**Operaciones:** CRUD via ProyectoConvenioViewSet (Coordinador/Admin: write, Auth: read)

---

#### Compromiso

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| convenio | ForeignKey(Convenio) | CASCADE, related_name='compromisos' |
| codigo | CharField(40) | |
| descripcion | TextField | |
| fecha_compromiso | DateField | null, blank |
| fecha_vencimiento | DateField | null, blank |
| responsable | ForeignKey(Usuario) | SET_NULL, null, blank, related_name='compromisos_responsables' |
| estado | CharField(20) | choices=EstadoCompromiso, default=PENDIENTE |
| observaciones | TextField | blank |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Meta:** unique_together = (convenio, codigo)

**Operaciones:** CRUD via CompromisoViewSet (Docente+: write, Auth: read)

---

#### Producto

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| convenio | ForeignKey(Convenio) | CASCADE, related_name='productos' |
| codigo | CharField(40) | |
| nombre | CharField(255) | |
| descripcion | TextField | blank |
| tipo | CharField(50) | blank |
| fecha_entrega_esperada | DateField | null, blank |
| fecha_entrega_real | DateField | null, blank |
| entregado | BooleanField | default=False |
| archivo | FileField | upload_to='productos/', null, blank |
| observaciones | TextField | blank |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Meta:** unique_together = (convenio, codigo)

**Operaciones:** CRUD via ProductoViewSet (Docente+: write, Auth: read)

---

#### Contribucion

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| proyecto | ForeignKey(Proyecto) | CASCADE, related_name='contribuciones' |
| institucion | ForeignKey(Institucion) | SET_NULL, null, blank, related_name='contribuciones' |
| tipo | CharField(20) | choices=TipoContribucion, default=FINANCIERO |
| descripcion | TextField | |
| valor | DecimalField(12,2) | default=0 |
| fecha_aporte | DateField | null, blank |
| observaciones | TextField | blank |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Operaciones:** CRUD via ContribucionViewSet (Docente+: write, Auth: read)

---

### App: seguimiento

#### Avance

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| actividad | ForeignKey(Actividad) | CASCADE, related_name='avances' |
| registrado_por | ForeignKey(Usuario) | SET_NULL, null, blank, related_name='avances_registrados' |
| porcentaje_avance | DecimalField(5,2) | default=0 |
| descripcion | TextField | |
| dificultades | TextField | blank |
| acciones_correctivas | TextField | blank |
| horas_invertidas | DecimalField(8,2) | default=0 |
| fecha_registro | DateField | auto_now_add |
| estado | CharField(20) | choices=EstadoAvance, default=PENDIENTE |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Operaciones (AvanceViewSet):**
- CRUD (Coordinador/Admin: delete, Auth: rest)
- `POST /{id}/aprobar/` — estado -> APROBADO
- `POST /{id}/rechazar/` — estado -> RECHAZADO

---

#### Evidencia

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| avance | ForeignKey(Avance) | CASCADE, null, blank, related_name='evidencias' |
| actividad | ForeignKey(Actividad) | CASCADE, null, blank, related_name='evidencias' |
| tipo | CharField(20) | choices=TipoEvidencia, default=DOCUMENTO |
| titulo | CharField(255) | |
| descripcion | TextField | blank |
| archivo | FileField | upload_to='evidencias/', null, blank |
| enlace_externo | URLField | blank |
| fecha_carga | DateField | auto_now_add |
| verificada | BooleanField | default=False |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Operaciones:** CRUD via EvidenciaViewSet (Coordinador/Admin: delete, Auth: rest)

---

#### Informe

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| proyecto | ForeignKey(Proyecto) | CASCADE, related_name='informes' |
| tipo | CharField(20) | choices=TipoInforme, default=PARCIAL |
| numero | CharField(40) | |
| titulo | CharField(255) | |
| resumen | TextField | blank |
| contenido | TextField | |
| periodo_inicio | DateField | null, blank |
| periodo_fin | DateField | null, blank |
| elaborado_por | ForeignKey(Usuario) | SET_NULL, null, blank, related_name='informes_elaborados' |
| aprobado_por | ForeignKey(Usuario) | SET_NULL, null, blank, related_name='informes_aprobados' |
| estado | CharField(20) | choices=EstadoAvance, default=PENDIENTE |
| archivo | FileField | upload_to='informes/', null, blank |
| fecha_emision | DateField | null, blank |
| observaciones | TextField | blank |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Meta:** unique_together = (proyecto, tipo, numero)

**Operaciones:** CRUD via InformeViewSet (Docente+: write, Auth: read)

---

#### Alerta

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| usuario | ForeignKey(Usuario) | CASCADE, related_name='alertas' |
| proyecto | ForeignKey(Proyecto) | CASCADE, null, blank, related_name='alertas' |
| convenio | ForeignKey(Convenio) | CASCADE, null, blank, related_name='alertas' |
| mensaje | CharField(500) | |
| detalle | TextField | blank |
| prioridad | CharField(20) | choices=PrioridadAlerta, default=MEDIA |
| estado | CharField(20) | choices=EstadoAlerta, default=PENDIENTE |
| enlace | URLField | blank |
| leida | BooleanField | default=False |
| fecha_vencimiento | DateTimeField | null, blank |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Operaciones (AlertaViewSet — ReadOnly + custom actions):**
- GET list/detail (filtrado por usuario autenticado)
- `POST /{id}/leer/` — leida=True, estado=LEIDA
- `POST /{id}/atender/` — estado=ATENDIDA

---

#### Revision

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| proyecto | ForeignKey(Proyecto) | CASCADE, related_name='revisiones' |
| revisor | ForeignKey(Usuario) | CASCADE, related_name='revisiones_realizadas' |
| fecha_revision | DateField | auto_now_add |
| decision | CharField(20) | choices=[APROBADO, OBSERVADO, RECHAZADO], default=OBSERVADO |
| comentario | TextField | blank |
| observaciones | TextField | blank |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Meta:** ordering = ['proyecto', '-fecha_revision']

**Operaciones:** CRUD via RevisionViewSet (Coordinador/Admin: write, Auth: read)

---

#### FlujoValidacion

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| proyecto | ForeignKey(Proyecto) | CASCADE, related_name='flujos_validacion' |
| paso | PositiveIntegerField | |
| nombre_paso | CharField(255) | |
| responsable | ForeignKey(Usuario) | SET_NULL, null, blank, related_name='flujos_asignados' |
| estado | CharField(20) | choices=[PENDIENTE, COMPLETADO, RECHAZADO], default=PENDIENTE |
| fecha_completado | DateField | null, blank |
| comentario | TextField | blank |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Meta:** ordering = ['proyecto', 'paso']

**Operaciones:** CRUD via FlujoValidacionViewSet (Coordinador/Admin: write, Auth: read)

---

### App: reportes

> No tiene modelos propios. Consume datos de proyectos, convenios y seguimiento.

**Operaciones (ReportesViewSet):**
- `GET /reportes/dashboard/` — KPIs generales (DashboardService)
- `GET /reportes/proyectos/?estado=&tipo=&carrera=` — Reporte de proyectos (ReporteProyectoService)
- `GET /reportes/convenios/?estado=&tipo=` — Reporte de convenios (ReporteConvenioService)
- `GET /reportes/progreso/?proyecto=` — Progreso de actividades (ReporteProgresoService)

---

### App: auditoria

#### Auditoria

| Atributo | Tipo | Relacion / Restriccion |
|----------|------|------------------------|
| id | BigAutoField | PK |
| usuario | ForeignKey(Usuario) | SET_NULL, null, blank, related_name='auditorias' |
| accion | CharField(20) | choices=TipoAccion |
| entidad | CharField(100) | |
| entidad_id | PositiveIntegerField | null, blank |
| detalle | JSONField | default=dict, blank |
| ip_address | GenericIPAddressField | null, blank |
| creado_en | DateTimeField | auto_now_add |
| actualizado_en | DateTimeField | auto_now |

**Meta:** ordering = ['-creado_en']

**Operaciones (AuditoriaViewSet — ReadOnly, solo Admin):**
- GET list/detail con filtros (usuario, accion, entidad, entidad_id)
- Registro automatico via signals post_save / post_delete

---

## Servicios (Capa de Logica de Negocio)

### ProyectoWorkflowService (proyectos.services)
| Metodo | Descripcion |
|--------|-------------|
| generar_codigo(proyecto) | Asigna PRJ-XXXXX si no tiene codigo |
| enviar_revision(proyecto) | BORRADOR -> EN_REVISION |
| aprobar(proyecto) | EN_REVISION/EN_SUSPENSION -> APROBADO |
| rechazar(proyecto) | EN_REVISION -> BORRADOR |
| iniciar_ejecucion(proyecto) | APROBADO -> EN_EJECUCION |
| suspender(proyecto) | EN_EJECUCION -> EN_SUSPENSION |
| reanudar(proyecto) | EN_SUSPENSION -> EN_EJECUCION |
| finalizar(proyecto) | EN_EJECUCION -> FINALIZADO (+ fecha_fin_real) |
| cerrar(proyecto) | FINALIZADO -> CERRADO |
| cancelar(proyecto) | * -> CANCELADO (excepto CERRADO/CANCELADO) |

### IndicadorMedicionService (proyectos.services)
| Metodo | Descripcion |
|--------|-------------|
| medir(indicador, valor) | Actualiza valor_actual, fecha_medicion; marca CUMPLIDO si >= meta |

### ConvenioWorkflowService (convenios.services)
| Metodo | Descripcion |
|--------|-------------|
| enviar_revision(convenio) | BORRADOR -> EN_REVISION |
| aprobar(convenio) | EN_REVISION -> VIGENTE |
| rechazar(convenio) | EN_REVISION -> BORRADOR |
| suspender(convenio) | VIGENTE -> SUSPENDIDO |
| finalizar(convenio) | VIGENTE -> FINALIZADO |
| cancelar(convenio) | * -> CANCELADO (excepto FINALIZADO/CANCELADO) |

### DashboardService (reportes.services)
| Metodo | Descripcion |
|--------|-------------|
| obtener_kpis() | Retorna resumen, proyectos_por_estado, proyectos_por_tipo, actividades_por_estado |

### ReporteProyectoService (reportes.services)
| Metodo | Descripcion |
|--------|-------------|
| generar(estado, tipo, carrera_id) | Lista proyectos con conteos y progreso |

### ReporteConvenioService (reportes.services)
| Metodo | Descripcion |
|--------|-------------|
| generar(estado, tipo) | Lista convenios con conteos |

### ReporteProgresoService (reportes.services)
| Metodo | Descripcion |
|--------|-------------|
| generar(proyecto_id) | Progreso detallado de actividades por proyecto |

---

## Permisos RBAC (core.permissions)

| Clase | Nivel minimo | Roles que pasan |
|-------|-------------|-----------------|
| IsAdmin | 5 | ADMIN |
| IsCoordinadorOrAdmin | 4 | COORDINADOR, ADMIN |
| IsDocenteOrAbove | 3 | DOCENTE, COORDINADOR, ADMIN |
| IsDirectivoOrAbove | 2 | DIRECTIVO, DOCENTE, COORDINADOR, ADMIN |

**Jerarquia:** ESTUDIANTE(1) < DIRECTIVO(2) < DOCENTE(3) < COORDINADOR(4) < ADMIN(5)

---

## Maquinas de Estado

### Proyecto
```
BORRADOR --> EN_REVISION --> APROBADO --> EN_EJECUCION --> FINALIZADO --> CERRADO
    ^             |               ^              |
    |             v               |              v
    +------ (rechazar)            |         EN_SUSPENSION
                                  |              |
                                  +----- (reanudar/aprobar)
                            CANCELADO (desde cualquier estado excepto CERRADO/CANCELADO)
```

### Convenio
```
BORRADOR --> EN_REVISION --> VIGENTE --> FINALIZADO
    ^             |              |
    |             v              v
    +------ (rechazar)      SUSPENDIDO
                            CANCELADO (desde cualquier estado excepto FINALIZADO/CANCELADO)
```

### Actividad
```
PENDIENTE --> EN_PROCESO --> COMPLETADA
                  |
                  v
              ATRASADA / CANCELADA
```

---

## Endpoints API (Resumen)

| Prefijo | App | ViewSets |
|---------|-----|----------|
| /api/v1/auth/ | usuarios | Register, Login, Refresh |
| /api/v1/carreras/ | usuarios | CarreraViewSet |
| /api/v1/usuarios/ | usuarios | UsuarioViewSet (+/me/) |
| /api/v1/proyectos/ | proyectos | ProyectoViewSet (+workflow actions) |
| /api/v1/objetivos/ | proyectos | ObjetivoViewSet |
| /api/v1/indicadores/ | proyectos | IndicadorViewSet (+/medir/) |
| /api/v1/actividades/ | proyectos | ActividadViewSet |
| /api/v1/participantes/ | proyectos | ParticipanteProyectoViewSet |
| /api/v1/presupuestos/ | proyectos | PresupuestoViewSet |
| /api/v1/beneficiarios/ | proyectos | BeneficiarioViewSet |
| /api/v1/alineaciones/ | proyectos | AlineacionEstrategicaViewSet |
| /api/v1/firmas/ | proyectos | FirmaResponsabilidadViewSet |
| /api/v1/instituciones/ | convenios | InstitucionViewSet |
| /api/v1/convenios/ | convenios | ConvenioViewSet (+workflow actions) |
| /api/v1/proyecto-convenios/ | convenios | ProyectoConvenioViewSet |
| /api/v1/compromisos/ | convenios | CompromisoViewSet |
| /api/v1/productos/ | convenios | ProductoViewSet |
| /api/v1/contribuciones/ | convenios | ContribucionViewSet |
| /api/v1/avances/ | seguimiento | AvanceViewSet (+aprobar/rechazar) |
| /api/v1/evidencias/ | seguimiento | EvidenciaViewSet |
| /api/v1/informes/ | seguimiento | InformeViewSet |
| /api/v1/alertas/ | seguimiento | AlertaViewSet (+leer/atender) |
| /api/v1/revisiones/ | seguimiento | RevisionViewSet |
| /api/v1/flujos-validacion/ | seguimiento | FlujoValidacionViewSet |
| /api/v1/reportes/ | reportes | ReportesViewSet (dashboard, proyectos, convenios, progreso) |
| /api/v1/auditoria/registros/ | auditoria | AuditoriaViewSet (ReadOnly, Admin) |
| /api/docs/ | — | Swagger UI |
| /api/redoc/ | — | ReDoc |
| /api/schema/ | — | OpenAPI Schema |
