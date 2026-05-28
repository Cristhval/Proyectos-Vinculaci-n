# Documento de Diseño de Software (SDD)

## Sistema de Gestión de Proyectos de Vinculación con la Sociedad

**Basado en:** IEEE 1016-2009 (Software Design Description)

---

| Campo | Valor |
|-------|-------|
| **Proyecto** | Sistema de Gestión de Proyectos de Vinculación con la Sociedad |
| **Organización** | Universidad Nacional de Loja (UNL) |
| **Versión** | 1.0.0 |
| **Fecha** | Mayo 2026 |
| **Autores** | Equipo de Desarrollo - Coordinación de Vinculación |
| **Estado** | En desarrollo |

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Referencias](#2-referencias)
3. [Glosario](#3-glosario)
4. [Descripción de la Descomposición del Sistema](#4-descripción-de-la-descomposición-del-sistema)
5. [Descripción del Diseño de Datos](#5-descripción-del-diseño-de-datos)
6. [Descripción del Diseño de Interfaces](#6-descripción-del-diseño-de-interfaces)
7. [Diseño Detallado de Componentes](#7-diseño-detallado-de-componentes)
8. [Diseño de la Interfaz de Usuario](#8-diseño-de-la-interfaz-de-usuario)
9. [Requisitos No Funcionales Cubiertos](#9-requisitos-no-funcionales-cubiertos)
10. [Apéndices](#10-apéndices)

---

## 1. Introducción

### 1.1 Propósito

Este documento describe la arquitectura y diseño detallado del **Sistema de Gestión de Proyectos de Vinculación con la Sociedad** de la Universidad Nacional de Loja. Su objetivo es servir como guía técnica para el equipo de desarrollo y como referencia para la verificación y validación del sistema.

### 1.2 Alcance

El sistema cubre la gestión integral del ciclo de vida de proyectos de vinculación con la sociedad, incluyendo:

- Formulación, revisión, aprobación y ejecución de proyectos de vinculación
- Gestión de convenios interinstitucionales y sus compromisos
- Registro de avances, evidencias e informes de actividades
- Monitoreo de indicadores y gestión presupuestaria
- Generación de reportes y dashboards con KPIs
- Sistema de alertas y notificaciones
- Auditoría y trazabilidad de operaciones

### 1.3 Definiciones y Acrónimos

| Acrónimo | Significado |
|----------|-------------|
| UNL | Universidad Nacional de Loja |
| SPA | Single Page Application |
| DRF | Django REST Framework |
| JWT | JSON Web Token |
| RBAC | Role-Based Access Control |
| CRUD | Create, Read, Update, Delete |
| ORM | Object-Relational Mapping |
| API | Application Programming Interface |
| KPI | Key Performance Indicator |
| ADR | Architecture Decision Record |

### 1.4 Audiencia

- Equipo de desarrollo (frontend y backend)
- Coordinación de Vinculación UNL (stakeholder principal)
- Docentes evaluadores del proyecto
- Personal de mantenimiento futuro

---

## 2. Referencias

| ID | Documento | Ubicación |
|----|-----------|-----------|
| REF-01 | Reglamento de Vinculación con la Sociedad UNL | Normativa institucional |
| REF-02 | Especificación Completa del Sistema | `specs/ESPECIFICACION-COMPLETA.md` |
| REF-03 | Plan del Proyecto | `specs/001-sistema-vinculacion/plan.md` |
| REF-04 | Especificación Funcional | `specs/001-sistema-vinculacion/spec.md` |
| REF-05 | Modelo de Entidades | `specs/dominio/modelo-entidades.md` |
| REF-06 | Diagrama E-R | `specs/dominio/diagrama-entidad-relacion.md` |
| REF-07 | Máquinas de Estado | `specs/dominio/estados.md` |
| REF-08 | Decisiones de Arquitectura | `specs/arquitectura/decisiones.md` |
| REF-09 | Modelo C4 | `specs/arquitectura/modelo-c4.dsl` |
| REF-10 | Especificación OpenAPI | `specs/api/openapi.yml` |
| REF-11 | IEEE 1016-2009 | Standard for Software Design Descriptions |
| REF-12 | Django Documentation | https://docs.djangoproject.com/en/5.0/ |
| REF-13 | DRF Documentation | https://www.django-rest-framework.org/ |

---

## 3. Glosario

| Término | Definición |
|---------|------------|
| **Proyecto de Vinculación** | Iniciativa académica que conecta la universidad con la comunidad para resolver problemas sociales |
| **Convenio** | Acuerdo formal entre la UNL y una institución externa para cooperación |
| **Seguimiento** | Proceso de monitoreo del avance de actividades e indicadores |
| **Flujo de Validación** | Proceso secuencial de aprobación con múltiples pasos y responsables |
| **Auditoría** | Registro histórico de todas las acciones realizadas en el sistema |

---

## 4. Descripción de la Descomposición del Sistema

### 4.1 Vista de Contexto (C4 Nivel 1)

```
┌─────────────┐     ┌──────────────────────────────────┐     ┌─────────────┐
│   Docente   │────►│                                  │◄────│ Coordinador │
└─────────────┘     │    Sistema de Vinculación UNL    │     └─────────────┘
                    │                                  │
┌─────────────┐     │  - Gestión de proyectos          │     ┌─────────────┐
│ Estudiante  │────►│  - Convenios interinstitucionales│◄────│    Admin    │
└─────────────┘     │  - Seguimiento y evidencias      │     └─────────────┘
                    │  - Reportes y KPIs               │
┌─────────────┐     │  - Auditoría                     │
│  Directivo  │────►│                                  │
└─────────────┘     └─────────────┬────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │    Integraciones Externas  │
                    │  - Auth UNL (LDAP/OAuth2)  │
                    │  - Google Drive            │
                    │  - Firebase (Push)         │
                    │  - SendGrid (Email)        │
                    └───────────────────────────┘
```

### 4.2 Vista de Contenedores (C4 Nivel 2)

| Contenedor | Tecnología | Responsabilidad |
|------------|------------|-----------------|
| **React SPA** | React 19, TypeScript, Vite, TailwindCSS | Interfaz web administrativa |
| **Django REST API** | Django 6.0, DRF 3.17.1, SimpleJWT | Lógica de negocio y API REST |
| **Base de Datos** | SQLite (dev) / PostgreSQL 14 (prod) | Persistencia relacional |
| **Admin Django** | Django Admin | Panel administrativo interno |

### 4.3 Vista de Componentes (C4 Nivel 3 - Backend)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Router    │───►│  Permisos   │───►│  ViewSets   │
│  URL + JWT  │    │    RBAC     │    │ (Control.)  │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                             │
                                             ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Modelos    │◄───│Serializadores│◄───│   Filtros   │
│   (ORM)     │    │   (JSON)    │    │ + Paginación│
└─────────────┘    └─────────────┘    └─────────────┘
```

### 4.4 Módulos del Sistema (Apps Django)

| Módulo | App Django | Responsabilidad |
|--------|-----------|-----------------|
| **Core** | `core` | Modelo base `TimeStampedModel`, utilidades, clases de permisos reutilizables |
| **Usuarios** | `usuarios` | Gestión de usuarios, carreras, autenticación JWT |
| **Proyectos** | `proyectos` | Proyectos, objetivos, indicadores, actividades, participantes, presupuesto |
| **Convenios** | `convenios` | Instituciones, convenios, compromisos, productos, contribuciones |
| **Seguimiento** | `seguimiento` | Avances, evidencias, informes, alertas, revisiones, flujos de validación |
| **Reportes** | `reportes` | Dashboard KPIs, reportes filtrados, métricas de progreso |
| **Auditoría** | `auditoria` | Registro de auditoría y trazabilidad de acciones |

### 4.5 Módulos del Frontend (Features React)

| Feature | Ruta | Descripción |
|---------|------|-------------|
| `auth` | `/login` | Autenticación de usuarios |
| `dashboard` | `/dashboard` | Panel principal con KPIs |
| `proyectos` | `/proyectos` | CRUD y gestión de proyectos |
| `convenios` | `/convenios` | CRUD y gestión de convenios |
| `seguimiento` | `/seguimiento` | Avances, evidencias, informes |
| `reportes` | `/reportes` | Reportes y gráficos |
| `usuarios` | `/usuarios` | Administración de usuarios |
| `auditoria` | `/auditoria` | Log de auditoría (solo admin) |

---

## 5. Descripción del Diseño de Datos

### 5.1 Modelo de Datos Lógico

#### 5.1.1 Módulo Usuarios

**Carrera**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| codigo | CharField(30) | PK, unique |
| nombre | CharField(255) | not null |
| facultad | CharField(255) | not null |
| descripcion | TextField | nullable |
| activa | BooleanField | default=True |

**Usuario**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| user | OneToOneField(User) | FK, cascade |
| codigo | CharField(30) | unique |
| documento_identidad | CharField(20) | unique |
| carrera | FK(Carrera) | nullable, SET_NULL |
| rol | CharField(RolUsuario) | enum: ADMIN, COORDINADOR, DOCENTE, ESTUDIANTE, DIRECTIVO |
| telefono | CharField(20) | nullable |
| direccion | CharField(255) | nullable |
| fecha_nacimiento | DateField | nullable |
| biografia | TextField | nullable |
| activo | BooleanField | default=True |

#### 5.1.2 Módulo Proyectos

**Proyecto (Entidad Central)**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| codigo | CharField(40) | unique |
| titulo | CharField(255) | not null |
| resumen | TextField | nullable |
| descripcion | TextField | nullable |
| problema | TextField | nullable |
| justificacion | TextField | nullable |
| objetivo_general | TextField | nullable |
| resultados_esperados | TextField | nullable |
| linea_intervencion | CharField(255) | nullable |
| tipo | CharField(TipoProyecto) | enum: VINCULACION, INVESTIGACION, EXTENSION, MIXTO |
| prioridad | CharField(PrioridadProyecto) | enum: BAJA, MEDIA, ALTA, CRITICA |
| estado | CharField(EstadoProyecto) | enum: BORRADOR, EN_REVISION, APROBADO, EN_EJECUCION, EN_SUSPENSION, FINALIZADO, CERRADO, CANCELADO |
| carrera | FK(Carrera) | nullable, SET_NULL |
| responsable | FK(Usuario) | nullable, SET_NULL |
| coordinador_academico | FK(Usuario) | nullable, SET_NULL |
| fecha_inicio | DateField | nullable |
| fecha_fin_planificada | DateField | nullable |
| fecha_fin_real | DateField | nullable |
| presupuesto_aprobado | DecimalField(12,2) | default=0 |
| direccion_ejecucion | CharField(255) | nullable |
| observaciones | TextField | nullable |
| activo | BooleanField | default=True |

**Objetivo**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| proyecto | FK(Proyecto) | CASCADE |
| tipo | CharField | enum: GENERAL, ESPECIFICO |
| orden | PositiveIntegerField | not null |
| descripcion | TextField | not null |
| meta | TextField | nullable |
| cumplido | BooleanField | default=False |
| fecha_cumplimiento | DateField | nullable |
| observaciones | TextField | nullable |

**Indicador**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| objetivo | FK(Objetivo) | CASCADE |
| codigo | CharField(30) | not null |
| nombre | CharField(255) | not null |
| descripcion | TextField | nullable |
| formula | TextField | nullable |
| unidad_medida | CharField(50) | not null |
| linea_base | DecimalField(10,2) | default=0 |
| meta | DecimalField(10,2) | not null |
| valor_actual | DecimalField(10,2) | default=0 |
| frecuencia | CharField | enum: DIARIA, SEMANAL, MENSUAL, TRIMESTRAL, SEMESTRAL, ANUAL |
| estado | CharField | enum: ACTIVO, EN_ALERTA, CUMPLIDO, NO_CUMPLIDO |
| fecha_medicion | DateField | nullable |
| observaciones | TextField | nullable |

**Actividad**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| proyecto | FK(Proyecto) | CASCADE |
| objetivo | FK(Objetivo) | nullable, SET_NULL |
| codigo | CharField(30) | not null |
| nombre | CharField(255) | not null |
| descripcion | TextField | nullable |
| fecha_inicio | DateField | nullable |
| fecha_fin | DateField | nullable |
| responsable | FK(Usuario) | nullable, SET_NULL |
| porcentaje_planificado | DecimalField(5,2) | default=0 |
| porcentaje_real | DecimalField(5,2) | default=0 |
| estado | CharField | enum: PENDIENTE, EN_PROCESO, COMPLETADA, ATRASADA, CANCELADA |
| orden | PositiveIntegerField | default=0 |
| requiere_evidencia | BooleanField | default=True |
| observaciones | TextField | nullable |

**ParticipanteProyecto**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| proyecto | FK(Proyecto) | CASCADE |
| usuario | FK(Usuario) | CASCADE |
| rol | CharField | enum: LIDER, DOCENTE, ESTUDIANTE, APOYO, EXTERNO |
| fecha_inicio | DateField | nullable |
| fecha_fin | DateField | nullable |
| horas_comprometidas | PositiveIntegerField | default=0 |
| horas_cumplidas | PositiveIntegerField | default=0 |
| estado | CharField | ACTIVO, INACTIVO |
| observaciones | TextField | nullable |
| **Restricción** | unique_together | (proyecto, usuario, rol) |

**Presupuesto**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| proyecto | OneToOneField(Proyecto) | CASCADE |
| codigo | CharField(30) | not null |
| monto_solicitado | DecimalField(12,2) | default=0 |
| monto_aprobado | DecimalField(12,2) | default=0 |
| monto_ejecutado | DecimalField(12,2) | default=0 |
| estado | CharField | enum: BORRADOR, APROBADO, EJECUTADO, CERRADO |
| responsable | FK(Usuario) | nullable, SET_NULL |
| fecha_aprobacion | DateField | nullable |
| observaciones | TextField | nullable |

**Beneficiario**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| proyecto | FK(Proyecto) | CASCADE |
| tipo | CharField | enum: DIRECTO, INDIRECTO |
| nombre | CharField(255) | not null |
| descripcion | TextField | nullable |
| cantidad_estimada | PositiveIntegerField | default=0 |
| ubicacion | CharField(255) | nullable |
| observaciones | TextField | nullable |

**AlineacionEstrategica**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| proyecto | FK(Proyecto) | CASCADE |
| eje | CharField(255) | not null |
| objetivo_estrategico | CharField(255) | not null |
| programa | CharField(255) | nullable |
| plan | CharField(255) | nullable |
| descripcion | TextField | nullable |

**FirmaResponsabilidad**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| proyecto | FK(Proyecto) | CASCADE |
| usuario | FK(Usuario) | CASCADE |
| tipo | CharField | enum: RESPONSABLE, COORDINADOR, APROBADOR |
| fecha_firma | DateTimeField | auto_now_add |
| comentario | TextField | nullable |
| **Restricción** | unique_together | (proyecto, usuario, tipo) |

#### 5.1.3 Módulo Convenios

**Institucion**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| nombre | CharField(255) | not null |
| sigla | CharField(20) | nullable |
| descripcion | TextField | nullable |
| direccion | CharField(255) | nullable |
| telefono | CharField(20) | nullable |
| email | EmailField | nullable |
| sitio_web | URLField | nullable |
| activa | BooleanField | default=True |

**Convenio**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| institucion | FK(Institucion) | nullable, SET_NULL |
| codigo | CharField(40) | unique |
| entidad_contraparte | CharField(255) | nullable |
| objeto | TextField | not null |
| descripcion | TextField | nullable |
| fecha_inicio | DateField | nullable |
| fecha_fin | DateField | nullable |
| tipo | CharField | enum: MARCO, ESPECIFICO, COOPERACION, OTRO |
| estado | CharField | enum: BORRADOR, EN_REVISION, VIGENTE, VENCIDO, SUSPENDIDO, FINALIZADO, CANCELADO |
| archivo_firmado | FileField | nullable |
| observaciones | TextField | nullable |
| activo | BooleanField | default=True |

**ProyectoConvenio**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| proyecto | FK(Proyecto) | CASCADE |
| convenio | FK(Convenio) | CASCADE |
| fecha_vinculacion | DateField | auto_now_add |
| vigente | BooleanField | default=True |
| observaciones | TextField | nullable |
| **Restricción** | unique_together | (proyecto, convenio) |

**Compromiso**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| convenio | FK(Convenio) | CASCADE |
| codigo | CharField(30) | not null |
| descripcion | TextField | not null |
| fecha_inicio | DateField | nullable |
| fecha_fin | DateField | nullable |
| responsable | CharField(255) | nullable |
| estado | CharField | enum: PENDIENTE, EN_PROCESO, CUMPLIDO, INCUMPLIDO |
| observaciones | TextField | nullable |
| **Restricción** | unique_together | (convenio, codigo) |

**Producto**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| convenio | FK(Convenio) | CASCADE |
| codigo | CharField(30) | not null |
| nombre | CharField(255) | not null |
| descripcion | TextField | nullable |
| tipo | CharField(100) | nullable |
| fecha_entrega_esperada | DateField | nullable |
| fecha_entrega_real | DateField | nullable |
| entregado | BooleanField | default=False |
| archivo | FileField | nullable |
| observaciones | TextField | nullable |
| **Restricción** | unique_together | (convenio, codigo) |

**Contribucion**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| proyecto | FK(Proyecto) | CASCADE |
| institucion | FK(Institucion) | nullable, SET_NULL |
| tipo | CharField | enum: FINANCIERO, HORAS, INFRAESTRUCTURA, EQUIPO, SERVICIO, EXTERNO |
| descripcion | TextField | not null |
| valor | DecimalField(12,2) | default=0 |
| fecha_aporte | DateField | nullable |
| observaciones | TextField | nullable |

#### 5.1.4 Módulo Seguimiento

**Avance**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| actividad | FK(Actividad) | CASCADE |
| registrado_por | FK(Usuario) | SET_NULL |
| porcentaje_avance | DecimalField(5,2) | not null |
| descripcion | TextField | not null |
| dificultades | TextField | nullable |
| acciones_correctivas | TextField | nullable |
| horas_invertidas | DecimalField(6,2) | default=0 |
| fecha_registro | DateTimeField | auto_now_add |
| estado | CharField | enum: PENDIENTE, EN_REVISION, APROBADO, RECHAZADO |

**Evidencia**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| avance | FK(Avance) | nullable, CASCADE |
| actividad | FK(Actividad) | nullable, CASCADE |
| tipo | CharField | enum: FOTOGRAFIA, VIDEO, DOCUMENTO, ENLACE, OTRO |
| titulo | CharField(255) | not null |
| descripcion | TextField | nullable |
| archivo | FileField | nullable |
| enlace_externo | URLField | nullable |
| fecha_carga | DateTimeField | auto_now_add |
| verificada | BooleanField | default=False |

**Informe**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| proyecto | FK(Proyecto) | CASCADE |
| tipo | CharField | enum: INICIAL, PARCIAL, FINAL, TECNICO, FINANCIERO |
| numero | PositiveIntegerField | not null |
| titulo | CharField(255) | not null |
| resumen | TextField | nullable |
| contenido | TextField | nullable |
| fecha_inicio_periodo | DateField | nullable |
| fecha_fin_periodo | DateField | nullable |
| elaborado_por | FK(Usuario) | nullable, SET_NULL |
| aprobado_por | FK(Usuario) | nullable, SET_NULL |
| estado | CharField | BORRADOR, APROBADO |
| archivo | FileField | nullable |
| fecha_emision | DateField | nullable |
| observaciones | TextField | nullable |
| **Restricción** | unique_together | (proyecto, tipo, numero) |

**Alerta**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| usuario | FK(Usuario) | CASCADE |
| proyecto | FK(Proyecto) | nullable, CASCADE |
| convenio | FK(Convenio) | nullable, CASCADE |
| mensaje | CharField(255) | not null |
| detalle | TextField | nullable |
| prioridad | CharField | enum: BAJA, MEDIA, ALTA, URGENTE |
| estado | CharField | enum: PENDIENTE, LEIDA, ATENDIDA, CANCELADA |
| enlace | CharField(255) | nullable |
| leida | BooleanField | default=False |
| fecha_vencimiento | DateField | nullable |

**Revision**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| proyecto | FK(Proyecto) | CASCADE |
| revisor | FK(Usuario) | SET_NULL |
| fecha_revision | DateTimeField | auto_now_add |
| decision | CharField | enum: APROBADO, OBSERVADO, RECHAZADO |
| comentario | TextField | nullable |
| observaciones | TextField | nullable |

**FlujoValidacion**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| proyecto | FK(Proyecto) | CASCADE |
| responsable | FK(Usuario) | SET_NULL |
| paso | PositiveIntegerField | not null |
| nombre_paso | CharField(255) | not null |
| estado | CharField | enum: PENDIENTE, COMPLETADO, RECHAZADO |
| fecha_completado | DateTimeField | nullable |
| comentario | TextField | nullable |

#### 5.1.5 Módulo Auditoría

**Auditoria**

| Atributo | Tipo | Restricciones |
|----------|------|---------------|
| usuario | FK(Usuario) | nullable, SET_NULL |
| accion | CharField | enum: CREAR, ACTUALIZAR, ELIMINAR, APROBAR, RECHAZAR, INICIAR_SESION |
| entidad | CharField(100) | not null |
| entidad_id | PositiveIntegerField | nullable |
| detalle | JSONField | nullable |
| ip_address | GenericIPAddressField | nullable |

### 5.2 Diagrama Entidad-Relación

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
└──┬───────┬───────┘       └──┬──────┬───────┘
   │       │                  │ 1:N  │ 1:N
   │       │         ┌────────┘      └────────┐
   │       │         ▼                        ▼
   │       │  ┌──────────────┐    ┌─────────────────┐
   │       │  │  Compromiso  │    │    Producto     │
   │       │  └──────────────┘    └─────────────────┘
   │       │
   │       │    ┌──────────────────┐
   │       ├───►│  Proyecto        │◄───── 1:1 ─── Presupuesto
   │       │    │──────────────────│
   │       │    │ + codigo         │────── 1:N ─── Objetivo ──► Indicador
   │       │    │ + titulo         │
   │       │    │ + estado         │────── 1:N ─── Actividad ──► Avance ──► Evidencia
   │       │    │ + tipo           │
   │       │    └──┬───────────────┘────── 1:N ─── Beneficiario
   │       │       │                │
   │       │       │                ├───── 1:N ─── AlineacionEstrategica
   │       │       │                │
   │       │       │                ├───── 1:N ─── FirmaResponsabilidad
   │       │       │                │
   │       │       │                ├───── 1:N ─── ParticipanteProyecto
   │       │       │                │
   │       │       │                ├───── 1:N ─── Informe
   │       │       │                │
   │       │       │                └───── N:M ─── ProyectoConvenio
   │       │       │
   │       │       ├──────────────── 1:N ── Revision
   │       │       │
   │       │       └──────────────── 1:N ── FlujoValidacion
   │       │
   │       └──────────── 1:N ── Alerta
   │
   └─────────────────── N:1 ── Auditoria
```

### 5.3 Máquinas de Estado

#### 5.3.1 Proyecto - Ciclo de Vida

```
BORRADOR ──► EN_REVISION ──► APROBADO ──► EN_EJECUCION ──► FINALIZADO ──► CERRADO
    ▲             │               ▲              │
    │             ▼               │              ▼
    └────── (rechazar)            │         EN_SUSPENSION ──► (aprobar) ──► APROBADO
                                  │
                            CANCELADO (desde cualquier estado)
```

| Estado Origen | Acción | Estado Destino | Rol Requerido |
|---------------|--------|----------------|---------------|
| BORRADOR | enviar_revision | EN_REVISION | DOCENTE, COORDINADOR |
| EN_REVISION | aprobar | APROBADO | COORDINADOR, ADMIN |
| EN_REVISION | rechazar | BORRADOR | COORDINADOR, ADMIN |
| APROBADO | iniciar_ejecucion | EN_EJECUCION | COORDINADOR |
| EN_EJECUCION | suspender | EN_SUSPENSION | COORDINADOR, ADMIN |
| EN_SUSPENSION | aprobar | APROBADO | COORDINADOR, ADMIN |
| EN_EJECUCION | finalizar | FINALIZADO | COORDINADOR |
| FINALIZADO | cerrar | CERRADO | ADMIN |
| * (cualquiera) | cancelar | CANCELADO | ADMIN |

#### 5.3.2 Convenio

```
BORRADOR ──► EN_REVISION ──► VIGENTE ──► FINALIZADO
    ▲                            │
    │                            ▼
    └────── (rechazar)      VENCIDO / SUSPENDIDO / CANCELADO
```

#### 5.3.3 Actividad

```
PENDIENTE ──► EN_PROCESO ──► COMPLETADA
                  │
                  ▼
              ATRASADA / CANCELADA
```

---

## 6. Descripción del Diseño de Interfaces

### 6.1 Interfaz API REST

#### 6.1.1 Autenticación (JWT)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/auth/register/` | Registrar nuevo usuario |
| POST | `/api/v1/auth/login/` | Iniciar sesión → devuelve access + refresh tokens |
| POST | `/api/v1/auth/refresh/` | Renovar token de acceso |

**Flujo de autenticación:**
1. Cliente envía `POST /api/v1/auth/login/` con `{username, password}`
2. Servidor retorna `{access: "...", refresh: "...", user: {...}}`
3. Cliente incluye header `Authorization: Bearer <access_token>` en cada petición
4. Al expirar (60 min), cliente envía `POST /api/v1/auth/refresh/` con `{refresh: "..."}`

#### 6.1.2 Endpoints CRUD Principales

| Recurso | Endpoint Base | Métodos | Filtros |
|---------|---------------|---------|---------|
| Usuarios | `/api/v1/usuarios/` | GET, POST, PUT, DELETE | rol, carrera, activo |
| Carreras | `/api/v1/carreras/` | GET, POST, PUT, DELETE | activa, facultad |
| Proyectos | `/api/v1/proyectos/` | GET, POST, PUT, DELETE | estado, tipo, carrera, search, ordering |
| Objetivos | `/api/v1/objetivos/` | GET, POST, PUT, DELETE | proyecto, tipo |
| Indicadores | `/api/v1/indicadores/` | GET, POST, PUT, DELETE | objetivo, estado |
| Actividades | `/api/v1/actividades/` | GET, POST, PUT, DELETE | proyecto, estado |
| Participantes | `/api/v1/participantes/` | GET, POST, PUT, DELETE | proyecto, usuario |
| Instituciones | `/api/v1/instituciones/` | GET, POST, PUT, DELETE | activa |
| Convenios | `/api/v1/convenios/` | GET, POST, PUT, DELETE | estado, tipo, search |
| Compromisos | `/api/v1/compromisos/` | GET, POST, PUT, DELETE | convenio, estado |
| Productos | `/api/v1/productos/` | GET, POST, PUT, DELETE | convenio, entregado |
| Avances | `/api/v1/avances/` | GET, POST, PUT, DELETE | actividad, estado |
| Evidencias | `/api/v1/evidencias/` | GET, POST, PUT, DELETE | avance, tipo |
| Informes | `/api/v1/informes/` | GET, POST, PUT, DELETE | proyecto, tipo |
| Alertas | `/api/v1/alertas/` | GET, POST, PUT, DELETE | usuario, estado |
| Auditoría | `/api/v1/auditoria/` | GET | usuario, accion, entidad |

#### 6.1.3 Endpoints de Workflow (Acciones)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/proyectos/{id}/enviar-revision/` | Enviar a revisión |
| POST | `/api/v1/proyectos/{id}/aprobar/` | Aprobar proyecto |
| POST | `/api/v1/proyectos/{id}/rechazar/` | Rechazar (devolver a borrador) |
| POST | `/api/v1/proyectos/{id}/iniciar-ejecucion/` | Iniciar ejecución |
| POST | `/api/v1/proyectos/{id}/suspender/` | Suspender proyecto |
| POST | `/api/v1/proyectos/{id}/finalizar/` | Finalizar proyecto |
| POST | `/api/v1/proyectos/{id}/cerrar/` | Cerrar proyecto |
| POST | `/api/v1/proyectos/{id}/cancelar/` | Cancelar proyecto |
| POST | `/api/v1/convenios/{id}/enviar-revision/` | Enviar convenio a revisión |
| POST | `/api/v1/convenios/{id}/aprobar/` | Aprobar convenio |
| POST | `/api/v1/indicadores/{id}/medir/` | Registrar medición |
| POST | `/api/v1/avances/{id}/aprobar/` | Aprobar avance |
| POST | `/api/v1/avances/{id}/rechazar/` | Rechazar avance |
| POST | `/api/v1/alertas/{id}/leer/` | Marcar alerta leída |
| POST | `/api/v1/alertas/{id}/atender/` | Marcar alerta atendida |

#### 6.1.4 Endpoints de Reportes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/` | Dashboard con KPIs generales |
| GET | `/api/v1/reportes/proyectos/` | Reporte de proyectos filtrado |
| GET | `/api/v1/reportes/progreso/` | Reporte de progreso de actividades |

### 6.2 Formato de Respuesta Estándar

```json
{
  "count": 25,
  "next": "http://localhost:8000/api/v1/proyectos/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "codigo": "PROY-001",
      "titulo": "Proyecto ejemplo",
      "estado": "EN_EJECUCION",
      "creado_en": "2026-01-15T10:30:00Z",
      "actualizado_en": "2026-03-20T14:00:00Z"
    }
  ]
}
```

### 6.3 Códigos de Error HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado |
| 400 | Bad Request | Datos de entrada inválidos |
| 401 | Unauthorized | Token ausente o expirado |
| 403 | Forbidden | Sin permisos para la operación |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Transición de estado inválida |
| 500 | Server Error | Error interno |

---

## 7. Diseño Detallado de Componentes

### 7.1 Backend - Capa de Permisos (RBAC)

```python
# Jerarquía de roles
ROLE_HIERARCHY = {
    'ADMIN': 5,       # Acceso total
    'DIRECTIVO': 4,   # Lectura total + reportes
    'COORDINADOR': 3, # CRUD proyectos + aprobar/rechazar
    'DOCENTE': 2,     # CRUD actividades + avances propios
    'ESTUDIANTE': 1,  # Lectura + registro de avances y evidencias
}
```

| Clase de Permiso | Descripción |
|-----------------|-------------|
| `IsAdmin` | Solo rol ADMIN |
| `IsCoordinadorOrAbove` | ADMIN o COORDINADOR |
| `IsDocenteOrAbove` | ADMIN, COORDINADOR o DOCENTE |
| `IsOwnerOrAdmin` | Propietario del recurso o ADMIN |
| `IsProjectParticipant` | Participante activo del proyecto |

### 7.2 Backend - Patrón ViewSet + Actions

Cada módulo implementa:

```
ViewSet
├── list()           → GET /recurso/
├── create()         → POST /recurso/
├── retrieve()       → GET /recurso/{id}/
├── update()         → PUT /recurso/{id}/
├── partial_update() → PATCH /recurso/{id}/
├── destroy()        → DELETE /recurso/{id}/
└── @action()        → POST /recurso/{id}/accion-custom/
```

### 7.3 Backend - Serializers

| Tipo | Uso |
|------|-----|
| `ListSerializer` | Campos mínimos para listados (rendimiento) |
| `DetailSerializer` | Todos los campos + relaciones anidadas |
| `CreateUpdateSerializer` | Validación de entrada + lógica de creación |
| `ActionSerializer` | Validación para acciones de workflow |

### 7.4 Frontend - Arquitectura de Componentes

```
src/
├── api/              → Servicios HTTP (1 archivo/módulo)
│   └── client.ts     → Axios instance + interceptors JWT
├── components/ui/    → Componentes presentacionales reutilizables
│   ├── Button, Input, Select, Badge
│   ├── Card, Modal, Table, Spinner
│   └── Breadcrumb, EmptyState
├── features/         → Páginas por dominio (smart components)
├── hooks/            → Lógica reutilizable (useAuth, usePermissions)
├── layouts/          → Estructura visual (Dashboard + Sidebar)
├── routes/           → Definición de navegación y protección
├── store/            → Estado global (Zustand: auth, ui)
└── types/            → Interfaces TypeScript (espejo del backend)
```

### 7.5 Frontend - Flujo de Autenticación

```
LoginPage → useAuth.login() → authApi.login() → authStore.setTokens()
                                                       ↓
                                              localStorage (persist)
                                                       ↓
                                              Axios interceptor (inyecta Bearer)
                                                       ↓
                                              ProtectedRoute → DashboardLayout
```

### 7.6 Frontend - Gestión de Estado

| Store | Datos | Persistencia |
|-------|-------|--------------|
| `authStore` | accessToken, refreshToken, user, isAuthenticated | localStorage |
| `uiStore` | sidebarOpen, loading | memoria (no persiste) |

---

## 8. Diseño de la Interfaz de Usuario

### 8.1 Estructura de Navegación

```
Login
│
└── Dashboard (autenticado)
    ├── Proyectos
    │   ├── Lista (tabla con filtros)
    │   ├── Detalle (datos + workflow)
    │   └── Crear/Editar (formulario)
    ├── Convenios
    │   ├── Lista
    │   ├── Detalle
    │   └── Crear/Editar
    ├── Seguimiento
    │   ├── Avances
    │   ├── Evidencias
    │   └── Informes
    ├── Reportes
    │   ├── Dashboard KPIs
    │   └── Reportes filtrados
    ├── Usuarios (COORDINADOR+)
    │   ├── Lista
    │   └── Detalle
    └── Auditoría (ADMIN)
        └── Log de acciones
```

### 8.2 Layout Principal

```
┌─────────────────────────────────────────────────────┐
│  Header (logo + título + info usuario + rol)        │
├────────────┬────────────────────────────────────────┤
│            │                                        │
│  Sidebar   │         Contenido Principal            │
│  (nav +    │     ┌──────────────────────────┐       │
│   roles)   │     │  Breadcrumb              │       │
│            │     ├──────────────────────────┤       │
│  Dashboard │     │                          │       │
│  Proyectos │     │  Feature Page            │       │
│  Convenios │     │  (tabla, form, detalle)  │       │
│  Seguim.   │     │                          │       │
│  Reportes  │     └──────────────────────────┘       │
│  Usuarios* │                                        │
│  Auditoria*│                                        │
│            │                                        │
│  [Salir]   │                                        │
├────────────┴────────────────────────────────────────┤
```

### 8.3 Principios de Diseño UI

- **Responsive:** Sidebar colapsable, tablas con scroll horizontal
- **Accesibilidad:** Labels en formularios, focus visible, alt en imágenes
- **Feedback:** Toast notifications, estados de carga, empty states
- **Consistencia:** Componentes reutilizables, colores semánticos por estado
- **Roles:** Navegación filtrada por permisos, acciones condicionadas

---

## 9. Requisitos No Funcionales Cubiertos

| ID | Requisito | Implementación |
|----|-----------|----------------|
| RNF-01 | Seguridad por roles | RBAC con 5 niveles jerárquicos + permisos granulares |
| RNF-02 | Autenticación segura | JWT con access (60 min) + refresh (24h) + rotación |
| RNF-03 | Trazabilidad | Modelo `Auditoria` + middleware de captura automática |
| RNF-04 | Escalabilidad | Arquitectura modular por dominio, stateless API |
| RNF-05 | Rendimiento | select_related/prefetch_related, paginación, filtros |
| RNF-06 | Mantenibilidad | Separación frontend/backend, TypeScript, tests |
| RNF-07 | Disponibilidad | PostgreSQL en producción, estructura para deploy |
| RNF-08 | Usabilidad | UI consistente, breadcrumbs, feedback inmediato |

---

## 10. Apéndices

### A. Enumeraciones del Sistema

| Enum | Valores |
|------|---------|
| RolUsuario | ADMIN, COORDINADOR, DOCENTE, ESTUDIANTE, DIRECTIVO |
| TipoProyecto | VINCULACION, INVESTIGACION, EXTENSION, MIXTO |
| EstadoProyecto | BORRADOR, EN_REVISION, APROBADO, EN_EJECUCION, EN_SUSPENSION, FINALIZADO, CERRADO, CANCELADO |
| PrioridadProyecto | BAJA, MEDIA, ALTA, CRITICA |
| TipoObjetivo | GENERAL, ESPECIFICO |
| EstadoIndicador | ACTIVO, EN_ALERTA, CUMPLIDO, NO_CUMPLIDO |
| FrecuenciaIndicador | DIARIA, SEMANAL, MENSUAL, TRIMESTRAL, SEMESTRAL, ANUAL |
| EstadoActividad | PENDIENTE, EN_PROCESO, COMPLETADA, ATRASADA, CANCELADA |
| EstadoPresupuesto | BORRADOR, APROBADO, EJECUTADO, CERRADO |
| RolParticipante | LIDER, DOCENTE, ESTUDIANTE, APOYO, EXTERNO |
| TipoConvenio | MARCO, ESPECIFICO, COOPERACION, OTRO |
| EstadoConvenio | BORRADOR, EN_REVISION, VIGENTE, VENCIDO, SUSPENDIDO, FINALIZADO, CANCELADO |
| EstadoCompromiso | PENDIENTE, EN_PROCESO, CUMPLIDO, INCUMPLIDO |
| TipoContribucion | FINANCIERO, HORAS, INFRAESTRUCTURA, EQUIPO, SERVICIO, EXTERNO |
| EstadoAvance | PENDIENTE, EN_REVISION, APROBADO, RECHAZADO |
| TipoEvidencia | FOTOGRAFIA, VIDEO, DOCUMENTO, ENLACE, OTRO |
| TipoInforme | INICIAL, PARCIAL, FINAL, TECNICO, FINANCIERO |
| EstadoAlerta | PENDIENTE, LEIDA, ATENDIDA, CANCELADA |
| PrioridadAlerta | BAJA, MEDIA, ALTA, URGENTE |
| TipoAccion | CREAR, ACTUALIZAR, ELIMINAR, APROBAR, RECHAZAR, INICIAR_SESION |

### B. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + TypeScript | 19.x |
| Build | Vite | 6.x |
| Estilos | TailwindCSS | 3.x |
| Estado | Zustand | 5.x |
| HTTP Client | Axios | 1.x |
| Routing | React Router | 7.x |
| Backend | Django | 6.0 |
| API | Django REST Framework | 3.17.1 |
| Auth | SimpleJWT | 5.5.1 |
| Filtros | django-filter | 25.2 |
| Docs API | drf-spectacular | latest |
| CORS | django-cors-headers | latest |
| Config | django-environ | latest |
| BD (dev) | SQLite | 3.x |
| BD (prod) | PostgreSQL | 14+ |

### C. Decisiones de Arquitectura (ADRs)

| ADR | Decisión | Justificación |
|-----|----------|---------------|
| ADR-001 | Django + DRF | Framework maduro, DRF para APIs, Admin incluido |
| ADR-002 | JWT (SimpleJWT) | Stateless, compatible con móvil, rotación de tokens |
| ADR-003 | Arquitectura modular por dominio | DDD, separación de responsabilidades |
| ADR-004 | SQLite (dev) / PostgreSQL (prod) | Facilidad de desarrollo + rendimiento en producción |
| ADR-005 | ViewSets + Router | Reduce boilerplate, acciones personalizadas con @action |
| ADR-006 | drf-spectacular | Documentación OpenAPI siempre sincronizada |
| ADR-007 | Permisos por rol (RBAC) | Cumple RNF-01, clases BasePermission reutilizables |

### D. Resumen Cuantitativo del Modelo

| Métrica | Valor |
|---------|-------|
| Apps Django | 7 |
| Modelos (clases) | 24 |
| Enumeraciones | 20 |
| Atributos totales | ~180 |
| Endpoints API | ~50+ |
| Componentes UI | 10 |
| Feature Pages | 8 |

---

*Documento generado conforme al estándar IEEE 1016-2009.*
*Última actualización: Mayo 2026*
