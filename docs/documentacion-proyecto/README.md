# Documentación del Proyecto

## Sistema de Gestión de Proyectos de Vinculación con la Sociedad

**Universidad Nacional de Loja**
**Área de la Energía, las Industrias y los Recursos Naturales No Renovables**
**Carrera de Ingeniería en Sistemas Computacionales**

---

## 1. Resumen Ejecutivo

El **Sistema de Gestión de Proyectos de Vinculación con la Sociedad** es una plataforma web institucional desarrollada para la Universidad Nacional de Loja que digitaliza y automatiza el ciclo de vida completo de los proyectos de vinculación universitaria. La plataforma permite gestionar desde la formulación y aprobación de proyectos, pasando por el seguimiento de avances y evidencias, hasta la generación de reportes ejecutivos con gráficas interactivas. Adicionalmente, administra convenios interinstitucionales, mantiene una auditoría completa de todas las acciones y ofrece formatos institucionales descargables.

---

## 2. Objetivos del Sistema

### Objetivo General
Desarrollar un sistema web integral que permita la gestión eficiente de los proyectos de vinculación con la sociedad, facilitando la formulación, seguimiento, evaluación y generación de reportes para la Universidad Nacional de Loja.

### Objetivos Específicos
- Automatizar el flujo de formulación, revisión y aprobación de proyectos de vinculación
- Centralizar el seguimiento de avances y evidencias de actividades
- Gestionar convenios interinstitucionales con trazabilidad completa
- Proporcionar dashboards ejecutivos con indicadores clave para la toma de decisiones
- Implementar auditoría automática de todas las acciones del sistema
- Facilitar la descarga de formatos institucionales oficiales de la UNL

---

## 3. Público Objetivo

| Rol | Descripción | Responsabilidades |
|:----|:------------|:------------------|
| **Administrador** | Personal de TI / Administración del sistema | Gestión de usuarios, instituciones, configuración, auditoría |
| **Coordinador** | Coordinadores académicos de vinculación | Revisión y aprobación de proyectos, supervisión de convenios |
| **Docente** | Profesores responsables de proyectos | Creación y gestión de proyectos, registro de avances |
| **Directivo** | Autoridades universitarias | Monitoreo institucional, visualización de KPIs |
| **Estudiante** | Alumnos participantes en proyectos | Completar actividades asignadas, subir evidencias |

---

## 4. Tecnologías

### 4.1 Backend

| Tecnología | Versión | Propósito |
|:-----------|:--------|:----------|
| Python | 3.12 | Lenguaje de programación principal |
| Django | 6.x | Framework web con arquitectura MVT |
| Django REST Framework | 3.17 | Construcción de API RESTful |
| SimpleJWT | 5.5 | Autenticación basada en JSON Web Tokens |
| django-cors-headers | 4.3 | Gestión de Cross-Origin Resource Sharing |
| django-filter | 24.1 | Filtrado avanzado de querysets |
| drf-spectacular | 0.28 | Generación de documentación OpenAPI/Swagger |
| Pillow | 10.0 | Procesamiento y manipulación de imágenes |
| django-environ | 0.11 | Gestión de variables de entorno |

### 4.2 Frontend

| Tecnología | Versión | Propósito |
|:-----------|:--------|:----------|
| React | 19 | Biblioteca para interfaces de usuario |
| TypeScript | 5.x | Tipado estático para JavaScript |
| Vite | 6.x | Empaquetador y servidor de desarrollo |
| Tailwind CSS | 3.x | Framework CSS utilitario |
| Zustand | 5.x | Gestión de estado global |
| Axios | 1.x | Cliente HTTP con interceptores |
| React Router | 7.x | Enrutamiento para SPA |
| React Hook Form | 7.x | Manejo de formularios |
| React Hot Toast | 2.5 | Notificaciones toast |
| ApexCharts | 5.x | Gráficas interactivas |
| Lucide React | 0.511 | Iconografía |
| jsPDF | 4.x/5.x | Generación de documentos PDF |
| xlsx | 0.18 | Exportación a Excel |

### 4.3 Base de Datos
- **Desarrollo/Pruebas:** SQLite 3
- **Producción:** PostgreSQL (soportado vía configuración)

---

## 5. Arquitectura del Sistema

### 5.1 Arquitectura General

El sistema sigue una arquitectura **monolítica modular** de tres capas:

```
+---------------------------------------------------------------+
|                    CAPA DE PRESENTACIÓN                       |
|  +----------------------------------------------------------+ |
|  |              React SPA (TypeScript + Vite)                | |
|  |  Zustand (Estado) + Tailwind CSS (Estilos)                | |
|  +----------------------------------------------------------+ |
|                           | HTTP/REST (JWT Bearer)            |
+---------------------------+-----------------------------------+
|                    CAPA DE APLICACIÓN                         |
|  +----------------------------------------------------------+ |
|  |           Django REST Framework (API v1)                  | |
|  |  Autenticación JWT + RBAC + Auditoría + Señales           | |
|  +----------------------------------------------------------+ |
+---------------------------+-----------------------------------+
|                    CAPA DE DATOS                              |
|  +----------------------------------------------------------+ |
|  |          SQLite (dev) / PostgreSQL (prod)                 | |
|  |          Sistema de Archivos (media/)                     | |
|  +----------------------------------------------------------+ |
+---------------------------------------------------------------+
```

### 5.2 Patrones de Diseño

| Patrón | Aplicación |
|:-------|:-----------|
| **Repository Pattern** | Modelos Django como capa de acceso a datos |
| **Service Layer** | Lógica de negocio en `services.py` de cada app |
| **Serializer Pattern** | DRF Serializers para validación y transformación |
| **RBAC** | Control de acceso basado en roles jerárquicos (5 niveles) |
| **Middleware Pattern** | Auditoría automática vía middleware de Django |
| **Signal Pattern** | Eventos `post_save`/`post_delete` para logging automático |
| **Observer Pattern** | Notificaciones y alertas automáticas ante cambios de estado |
| **State Machine** | Máquina de estados para proyectos (8 estados) y convenios (7 estados) |

### 5.3 Diagrama de Módulos

```
core/ ─────────────────────────────────────────────────────────────┐
│  Modelos abstractos (TimeStampedModel)                           │
│  Permisos RBAC jerárquicos                                       │
│  Utilidades compartidas (paginación, formateo)                   │
└──────────────────────────────────────────────────────────────────┤
                                                                   │
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│ usuarios │proyectos │convenios │seguimiento│reportes │auditoria │
│          │          │          │          │          │          │
│ Auth JWT │Ciclo de  │Convenios │ Avances  │Dashboard │Registro  │
│ Usuarios │vida (8   │(7        │Evidencias│ KPIs     │automático│
│ Carreras │estados)  │estados)  │Informes  │Reportes  │de todas  │
│ Perfiles │Marco     │Institu-  │Alertas   │por rol   │las       │
│          │Lógico    │ciones    │Revisión  │Export    │acciones  │
│          │Objetivos │Compromi- │Validación│PDF/Excel │del       │
│          │Activida- │sos       │          │          │sistema   │
│          │des       │Productos │          │          │          │
│          │Particip. │Proyectos │          │          │          │
│          │Presupues-│vinculados│          │          │          │
│          │tos       │          │          │          │          │
│          │Beneficia-│          │          │          │          │
│          │rios      │          │          │          │          │
│          │Alineacio-│          │          │          │          │
│          │nes       │          │          │          │          │
│          │Anexos    │          │          │          │          │
│          │Firmas    │          │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
                                                                   │
┌──────────┐                                                        │
│ formatos │                                                        │
│          │                                                        │
│Formatos  │                                                        │
│UNL       │                                                        │
│oficiales │                                                        │
│(guías,   │                                                        │
│formulac.,│                                                        │
│avance,   │                                                        │
│finales)  │                                                        │
└──────────┘                                                        │
```

---

## 6. Módulos del Sistema

### 6.1 `core` — Base Compartida

Provee la infraestructura compartida para todos los módulos:

- **TimeStampedModel**: Modelo abstracto con campos `fecha_creacion` y `fecha_actualizacion`
- **Sistema de permisos RBAC**: 5 roles jerárquicos con herencia de permisos
- **Utilidades de paginación**: Paginación estandarizada para todas las APIs

### 6.2 `usuarios` — Autenticación y Gestión de Usuarios

Gestiona la autenticación, autorización y administración de usuarios del sistema.

**Modelos principales:**
- `Usuario`: Extiende el modelo User de Django con rol, cédula, celular, cargo, carrera
- `Carrera`: Catálogo de carreras universitarias

**Roles jerárquicos (RBAC):**
```
ADMIN (5) > COORDINADOR (4) > DOCENTE (3) > DIRECTIVO (2) > ESTUDIANTE (1)
```

**Endpoints:**
| Método | Ruta | Descripción |
|:-------|:-----|:------------|
| POST | `/api/v1/auth/login/` | Iniciar sesión (retorna access + refresh tokens) |
| POST | `/api/v1/auth/register/` | Registrar nuevo usuario |
| POST | `/api/v1/auth/refresh/` | Renovar access token |
| GET | `/api/v1/usuarios/` | Listar usuarios |
| POST | `/api/v1/usuarios/` | Crear usuario |
| GET | `/api/v1/usuarios/{id}/` | Detalle de usuario |
| PUT | `/api/v1/usuarios/{id}/` | Actualizar usuario |
| DELETE | `/api/v1/usuarios/{id}/` | Eliminar usuario |

### 6.3 `proyectos` — Gestión de Proyectos (Módulo Principal)

Módulo central que maneja el ciclo de vida completo de los proyectos de vinculación.

**Ciclo de Vida — Máquina de Estados:**

```
                         ┌──────────┐
                         │ CANCELADO│◄──────────────────────────┐
                         └──────────┘                           │
                              ▲                                 │
                              │ (desde cualquier estado         │
                              │  excepto CERRADO)               │
                              │                                 │
┌──────────┐   enviar    ┌──────────┐  aprobar   ┌──────────┐  │
│ BORRADOR │────────────►│EN_REVISIÓN│───────────►│ APROBADO │  │
└──────────┘             └──────────┘            └──────────┘  │
     ▲                     │      ▲                   │         │
     │                     │      │                   │         │
     │  observar           │      │ rechazar          │ iniciar │
     │  (devuelve)         └──────┘                   │         │
     │                                                ▼         │
     │                   ┌──────────┐  reanudar  ┌────────────┐ │
     │                   │EN_SUSPEN- │◄──────────│EN_EJECUCIÓN│ │
     │                   │SIÓN      │───suspender─►│           │ │
     │                   └──────────┘            └────────────┘ │
     │                                                 │        │
     │                                                 │finalizar│
     │                                                 ▼        │
     │                       ┌──────────┐  cerrar  ┌──────────┐ │
     │                       │ CERRADO  │◄─────────│FINALIZADO│ │
     │                       └──────────┘          └──────────┘ │
     └───────────────────────────────────────────────────────────┘
```

**Estados:**
| Estado | Descripción | Transiciones válidas |
|:-------|:------------|:---------------------|
| `BORRADOR` | Proyecto en formulación | → EN_REVISION, CANCELADO |
| `EN_REVISION` | En proceso de revisión por coordinador | → APROBADO, BORRADOR, CANCELADO |
| `APROBADO` | Aprobado, listo para ejecutar | → EN_EJECUCION, CANCELADO |
| `EN_EJECUCION` | En ejecución activa | → EN_SUSPENSION, FINALIZADO, CANCELADO |
| `EN_SUSPENSION` | Temporalmente suspendido | → EN_EJECUCION |
| `FINALIZADO` | Ejecución completada | → CERRADO |
| `CERRADO` | Proyecto cerrado definitivamente | (estado terminal) |
| `CANCELADO` | Proyecto cancelado | (estado terminal) |

**Formulación con Marco Lógico:**

El sistema implementa la metodología de Marco Lógico en un formulario de 7 pasos:

| Paso | Contenido |
|:-----|:----------|
| 1. General | Tipo, prioridad, período académico, título, carreras, línea de intervención, resumen, descripción, imagen |
| 2. Alineación | Alineaciones estratégicas (ODS, Plan Nacional, Agenda Zonal), instituciones participantes |
| 3. Diagnóstico | Problema, justificación, objetivo general, resultados esperados, beneficiarios, viabilidad |
| 4. Marco Lógico | 4 niveles: Fin, Propósito, Componentes, Actividades — con indicadores, medios de verificación y supuestos |
| 5. Planificación | Fechas, estrategias de ejecución, seguimiento y evaluación, presupuesto |
| 6. Responsables | Responsable del proyecto, coordinador académico, anexos, datos de firma |
| 7. Confirmación | Revisión de resumen y confirmación final |

**Sub-entidades gestionadas:**
- Objetivos (general y específicos)
- Indicadores (por cada nivel del marco lógico)
- Actividades (con responsable, fechas y evidencia requerida)
- Participantes (docentes, estudiantes, apoyo, externos)
- Presupuestos (valorado UNL, económico UNL, valorado externo, económico externo)
- Beneficiarios (directos e indirectos)
- Alineaciones estratégicas
- Firmas de responsabilidad
- Anexos (documentos adjuntos)

### 6.4 `convenios` — Convenios Interinstitucionales

Gestiona los acuerdos y convenios entre la universidad e instituciones externas.

**Máquina de Estados:**
```
BORRADOR → EN_REVISION → VIGENTE → VENCIDO (por tiempo)
                         ↓         → SUSPENDIDO (manual)
                         ↓         → FINALIZADO (manual)
                         ↓         → CANCELADO
                    (observar) → BORRADOR
```

**Estados:**
| Estado | Descripción |
|:-------|:------------|
| `BORRADOR` | Convenio en formulación |
| `EN_REVISION` | En proceso de revisión |
| `VIGENTE` | Activo y en ejecución |
| `VENCIDO` | Ha expirado por fecha de vencimiento |
| `SUSPENDIDO` | Temporalmente suspendido |
| `FINALIZADO` | Completado exitosamente |
| `CANCELADO` | Cancelado |

**Entidades relacionadas:**
- **Instituciones**: Entidades externas con las que se firman convenios
- **Compromisos**: Obligaciones adquiridas por cada parte
- **Productos**: Entregables esperados del convenio
- **Contribuciones**: Aportes de cada institución
- **Proyectos vinculados**: Proyectos de vinculación asociados al convenio

### 6.5 `seguimiento` — Avances, Evidencias e Informes

Módulo de seguimiento y monitoreo de la ejecución de proyectos.

**Componentes:**

1. **Avances**: Registro de progreso por actividad
   - Sistema escalonado: Primer avance = 50%, Segundo avance = 100%
   - Campos: descripción, horas invertidas, dificultades, acciones correctivas
   - Estados: PENDIENTE → APROBADO / RECHAZADO

2. **Evidencias**: Documentación de respaldo
   - Tipos: Fotografía, Documento, Video, Enlace, Otro
   - Carga de archivos con validación de tipo y tamaño
   - Verificación por parte del docente

3. **Informes**: Reportes formales del proyecto
   - Tipos: Inicial, Parcial, Final, Técnico, Financiero, Ejecutivo
   - Generación manual o asistida por IA
   - Plantilla institucional con estructura UNL:
     - Datos informativos
     - Resumen ejecutivo
     - Avance de actividades
     - Logros alcanzados
     - Dificultades y acciones correctivas
     - Indicadores de cumplimiento
     - Participación
     - Presupuesto
     - Conclusiones y recomendaciones
     - Firmas de responsabilidad

4. **Alertas**: Notificaciones automáticas
   - Prioridades: Baja, Media, Alta, Urgente
   - Estados: Pendiente, Leída, Atendida, Cancelada
   - Generadas automáticamente por cambios de estado, asignaciones, vencimientos

5. **Revisiones y Flujos de Validación**: Control de calidad de avances e informes

### 6.6 `reportes` — Dashboards y Reportes

Provee visualización de datos y estadísticas para todos los niveles organizacionales.

**Dashboards por rol:**
| Rol | Métricas principales |
|:----|:---------------------|
| Admin | Total proyectos, convenios, usuarios, alertas pendientes |
| Coordinador | Proyectos en revisión, aprobados, convenios vigentes, alertas activas |
| Docente | Mis proyectos, actividades pendientes, avances registrados, próximos vencimientos |
| Estudiante | Proyectos participantes, actividades asignadas, evidencias enviadas, próximas entregas |

**Reportes disponibles:**
- Reporte general de proyectos (estado, tipo, carrera)
- Reporte de convenios (estado, tipo, institución)
- Reporte de progreso (avances, cumplimiento)
- Reporte por docente (proyectos, actividades, participantes)
- Estadísticas públicas

**Exportación:**
- PDF (con formato institucional, gráficas y tablas)
- Excel/CSV (datos tabulares para análisis)

### 6.7 `auditoria` — Trazabilidad

Registra automáticamente todas las acciones realizadas en el sistema.

**Mecanismos de captura:**
- **Middleware**: Captura el contexto de la petición HTTP (usuario, IP, endpoint, método)
- **Señales Django**: `post_save` y `post_delete` en todos los modelos para registrar cambios
- **Eventos personalizados**: Inicio de sesión, cambios de estado, aprobaciones, rechazos

**Información registrada:**
- Usuario que realizó la acción
- Tipo de acción (CREAR, ACTUALIZAR, ELIMINAR, APROBAR, RECHAZAR, INICIAR_SESION)
- Modelo y registro afectado
- Valores anteriores y nuevos (en actualizaciones)
- Fecha y hora exacta
- Dirección IP
- Endpoint de la API utilizado

### 6.8 `formatos` — Formatos Institucionales UNL

Repositorio de documentos oficiales de la universidad.

**Categorías:**
- **Por nivel**: Pregrado, Posgrado
- **Por tipo**: Guía, Formulación, Avance, Final

**Funcionalidades:**
- Carga de formatos (PDF, DOCX)
- Descarga por parte de usuarios autorizados
- Organización por categorías

---

## 7. Modelo de Datos

### 7.1 Diagrama Entidad-Relación Simplificado

```
┌──────────┐     ┌──────────────┐     ┌───────────────┐
│  Usuario │────►│ Participante │◄────│   Proyecto    │
└──────────┘     └──────────────┘     └───────────────┘
     │                                      │
     │                              ┌───────┼───────┐
     │                              │       │       │
     ▼                              ▼       ▼       ▼
┌──────────┐                 ┌──────────┐ ┌──────┐ ┌──────────┐
│  Carrera │                 │Actividad │ │Objet.│ │Alineación│
└──────────┘                 └──────────┘ └──────┘ └──────────┘
                                  │
                          ┌───────┼───────┐
                          ▼       ▼       ▼
                    ┌────────┐ ┌────────┐ ┌─────────┐
                    │ Avance │ │Evidencia││Informe  │
                    └────────┘ └────────┘ └─────────┘

┌──────────┐     ┌──────────────┐
│Institución│────►│  Convenio    │◄──── Proyecto (vinculado)
└──────────┘     └──────────────┘
                       │
               ┌───────┼───────┐
               ▼       ▼       ▼
         ┌─────────┐ ┌───────┐ ┌───────────┐
         │Compromiso│ │Producto│ │Contribución│
         └─────────┘ └───────┘ └───────────┘

┌──────────┐
│ Auditoría │──► Registra acciones sobre todos los modelos
└──────────┘
```

### 7.2 Modelos Principales

#### Proyecto
| Campo | Tipo | Descripción |
|:------|:-----|:------------|
| `codigo` | CharField | Código único (ej. PRY-2026-001) |
| `titulo` | CharField | Título del proyecto |
| `tipo` | CharField | Vinculación, Investigación, Extensión, Mixto |
| `prioridad` | CharField | Baja, Media, Alta, Crítica |
| `estado` | CharField | Estado en la máquina de estados (8 valores) |
| `responsable` | FK → Usuario | Docente responsable |
| `coordinador_academico` | FK → Usuario | Coordinador que supervisa |
| `carreras` | M2M → Carrera | Carreras participantes |
| `fecha_inicio` | DateField | Fecha de inicio planificada |
| `fecha_fin_planificada` | DateField | Fecha de finalización planificada |
| `resumen` | TextField | Resumen ejecutivo |
| `objetivo_general` | TextField | Objetivo general del proyecto |
| `presupuesto_unl_valorado` | DecimalField | Presupuesto UNL valorado |
| `presupuesto_unl_economico` | DecimalField | Presupuesto UNL económico |
| `presupuesto_externo_valorado` | DecimalField | Presupuesto externo valorado |
| `presupuesto_externo_economico` | DecimalField | Presupuesto externo económico |
| `porcentaje_avance` | FloatField | Progreso general calculado |

#### Convenio
| Campo | Tipo | Descripción |
|:------|:-----|:------------|
| `codigo` | CharField | Código único (ej. CONV-2026-001) |
| `tipo` | CharField | Marco, Específico, Cooperación, Otro |
| `estado` | CharField | Estado en la máquina de estados (7 valores) |
| `institucion` | FK → Institucion | Institución contraparte |
| `entidad_contraparte` | CharField | Nombre de la entidad |
| `objeto` | TextField | Objeto del convenio |
| `descripcion` | TextField | Descripción detallada |
| `fecha_suscripcion` | DateField | Fecha de firma |
| `fecha_inicio` | DateField | Inicio de vigencia |
| `fecha_vencimiento` | DateField | Fin de vigencia |
| `responsable_unl` | FK → Usuario | Coordinador responsable UNL |
| `archivo_firmado` | FileField | Documento firmado escaneado |

---

## 8. API REST

### 8.1 Autenticación

El sistema utiliza **JWT (JSON Web Tokens)** con las siguientes características:

- **Access Token**: 60 minutos de validez
- **Refresh Token**: 24 horas de validez
- **Rotación de tokens**: Cada refresh emite un nuevo par de tokens
- **Blacklist**: Tokens revocados se invalidan inmediatamente
- **Auto-refresh en frontend**: El interceptor de Axios renueva automáticamente el token al recibir 401

**Flujo de autenticación:**
```
1. POST /api/v1/auth/login/ { email, password }
2. Respuesta: { access, refresh, usuario }
3. Todas las peticiones subsiguientes: Authorization: Bearer <access>
4. Cuando el access expira: POST /api/v1/auth/refresh/ { refresh }
5. Nuevo par de tokens emitido
```

### 8.2 Documentación Interactiva

- **Swagger UI**: `http://127.0.0.1:8000/api/docs/`
- **ReDoc**: `http://127.0.0.1:8000/api/redoc/`
- **Esquema OpenAPI**: `http://127.0.0.1:8000/api/schema/`

### 8.3 Códigos de Respuesta HTTP

| Código | Significado | Uso |
|:-------|:------------|:----|
| 200 | OK | Operación exitosa (GET, PUT) |
| 201 | Created | Recurso creado exitosamente (POST) |
| 204 | No Content | Eliminación exitosa (DELETE) |
| 400 | Bad Request | Datos inválidos en la solicitud |
| 401 | Unauthorized | Token inválido, expirado o ausente |
| 403 | Forbidden | Usuario sin permisos para la acción |
| 404 | Not Found | Recurso solicitado no existe |
| 500 | Internal Server Error | Error inesperado del servidor |

### 8.4 Endpoints Principales

Ver la documentación completa en la [Guía de la API](api/README.md) o en Swagger UI.

---

## 9. Seguridad

### 9.1 Medidas Implementadas

| Medida | Implementación |
|:-------|:---------------|
| Autenticación JWT | Tokens de acceso con expiración corta, refresh con rotación |
| RBAC | 5 niveles jerárquicos con validación en cada endpoint |
| CORS | Orígenes permitidos configurados vía variables de entorno |
| Validación de datos | DRF Serializers con validación en backend y React Hook Form en frontend |
| Auditoría | Registro completo de todas las acciones con trazabilidad |
| Secretos | Gestionados vía variables de entorno (.env), no versionados |
| HTTPS | Recomendado para producción |

### 9.2 Recomendaciones para Producción

1. Cambiar `SECRET_KEY` por un valor seguro generado aleatoriamente
2. Configurar `DEBUG = False`
3. Configurar PostgreSQL como base de datos
4. Usar HTTPS con certificado SSL válido
5. Configurar `ALLOWED_HOSTS` con el dominio real
6. Usar un servidor WSGI (Gunicorn/uWSGI) detrás de Nginx
7. Configurar backups automáticos de la base de datos
8. No versionar `db.sqlite3` ni archivos `media/`

---

## 10. Instalación y Despliegue

### 10.1 Requisitos del Sistema

| Requisito | Versión Mínima |
|:----------|:---------------|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |
| Git | 2.x |

### 10.2 Instalación para Desarrollo

```bash
# 1. Clonar repositorio
git clone https://github.com/Cristhval/Proyectos-Vinculaci-n.git
cd Proyectos-Vinculaci-n

# 2. Backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser  # Opcional
python manage.py seed_proyectos_demo  # Datos de prueba
python manage.py runserver

# 3. Frontend (nueva terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 10.3 Variables de Entorno

**Backend (.env):**
| Variable | Descripción | Desarrollo |
|:---------|:------------|:-----------|
| `DEBUG` | Modo debug | `True` |
| `SECRET_KEY` | Clave secreta Django | (cambiar en prod) |
| `ALLOWED_HOSTS` | Hosts permitidos | `localhost,127.0.0.1` |
| `DB_ENGINE` | Motor BD | `django.db.backends.sqlite3` |
| `DB_NAME` | Nombre BD | `db.sqlite3` |
| `CORS_ALLOWED_ORIGINS` | Orígenes CORS | `http://localhost:5173` |

**Frontend (frontend/.env):**
| Variable | Descripción | Desarrollo |
|:---------|:------------|:-----------|
| `VITE_API_URL` | URL base API | `http://127.0.0.1:8000/api/v1` |

### 10.4 Comandos de Gestión Personalizados

| Comando | Descripción |
|:--------|:------------|
| `python manage.py seed_proyectos_demo` | Poblar base de datos con datos de prueba |
| `python manage.py generar_alertas` | Generar alertas de vencimiento automáticas |

---

## 11. Estructura del Proyecto

```
Proyectos-Vinculaci-n/
│
├── core/                          # Modelos abstractos, RBAC, utilidades
├── usuarios/                      # Auth JWT, gestión de usuarios, carreras
├── proyectos/                     # Ciclo de vida de proyectos, marco lógico
├── convenios/                     # Convenios, instituciones, compromisos
├── seguimiento/                   # Avances, evidencias, informes, alertas
├── reportes/                      # Dashboards, KPIs, exportación
├── auditoria/                     # Trazabilidad automática
├── formatos/                      # Formatos institucionales UNL
├── proyecto_vinculacion_universidad/  # Configuración Django
│
├── frontend/                      # SPA React + TypeScript + Tailwind
│   └── src/
│       ├── api/                   # Servicios HTTP por módulo
│       ├── components/ui/         # Componentes reutilizables (20+)
│       ├── features/              # Páginas por dominio (11 módulos)
│       ├── hooks/                 # useAuth, usePermissions
│       ├── layouts/               # AuthLayout, DashboardLayout
│       ├── lib/                   # Formateo, exportadores PDF/Excel
│       ├── routes/                # Enrutamiento, navegación, protección
│       ├── store/                 # Zustand (authStore, uiStore)
│       └── types/                 # Interfaces TypeScript
│
├── docs/                          # Documentación
│   ├── api/                       # Referencia de API
│   ├── arquitectura/              # Diagramas C4 y de estados
│   ├── guia-desarrollador/        # Setup y estándares de código
│   ├── documentacion-proyecto/    # Este documento
│   └── manual-usuario/           # Manual de usuario final
│
├── media/                         # Archivos subidos (evidencias, proyectos)
├── manage.py                      # CLI Django
├── requirements.txt               # Dependencias Python
├── .env.example                   # Plantilla de variables de entorno
└── README.md                      # Descripción general del proyecto
```

---

## 12. Convenciones de Código

### 12.1 Backend (Python)

- **Estilo**: PEP 8
- **Indentación**: 4 espacios
- **Nomenclatura**:
  - `snake_case` para funciones, variables, métodos
  - `PascalCase` para clases y modelos
  - `UPPER_CASE` para constantes
- **Docstrings**: En todas las funciones y clases públicas

### 12.2 Frontend (TypeScript/React)

- **Estilo**: ESLint + Prettier
- **Nomenclatura**:
  - `PascalCase` para componentes React y sus archivos
  - `camelCase` para funciones, variables, hooks
- **Tipado**: Siempre explícito, evitar `any`
- **Componentes**: Un componente por archivo

### 12.3 Git

- **Flujo**: Git Flow (main, develop, feature/*, fix/*)
- **Commits**: Conventional Commits desde v1.0.0
- **Formato**: `<tipo>(<alcance>): <descripción>`

---

## 13. Equipo de Desarrollo

- Alexander Sanchez
- Cristian Valverde
- Mateo Rojas
- David Toledo
- Jorge Luzuriaga
- Jean Encalada

**Carrera**: Ingeniería en Sistemas Computacionales
**Universidad**: Universidad Nacional de Loja
**Año**: 2026

---

## 14. Licencia

Copyright (c) 2026 Universidad Nacional de Loja. Todos los derechos reservados.

Este software es propiedad exclusiva de la Universidad Nacional de Loja y fue desarrollado como proyecto académico para la carrera de Ingeniería en Sistemas Computacionales.
