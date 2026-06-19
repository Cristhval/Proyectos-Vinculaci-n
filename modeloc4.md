# Modelo C4 - Sistema de Vinculación UNL (Actualizado)

> **Herramienta:** [Structurizr Playground](https://playground.structurizr.com/)  
> **Última actualización:** 2026-06-17

---

## Resumen de cambios respecto al modelo anterior

| Aspecto | Modelo anterior | Estado actual del proyecto |
|---------|----------------|---------------------------|
| **Frontend** | React 18, Redux, Bootstrap | **React 19, Vite, TypeScript, Tailwind CSS, Zustand, React Router DOM v7** |
| **App Móvil** | Flutter / React Native | **No implementada** (planificación futura) |
| **Backend** | Django 6.0, DRF 3.17.1, SimpleJWT 5.5.1, django-filter 25.2 | **Django 6.0.4, DRF 3.17.1, SimpleJWT 5.5.1, django-filter 24.1** |
| **Apps Django** | 7 apps | **8 apps** (`core`, `usuarios`, `proyectos`, `convenios`, `seguimiento`, `reportes`, `auditoria`, **`formatos`**) |
| **Entidades ORM** | 26 genéricas | **~25 entidades concretas** distribuidas en las 8 apps |
| **Roles** | Admin, Coordinador, Docente, Estudiante | **+ Directivo** (5 roles) |
| **Nivel 3 (C3)** | Solo backend (Django) | **Dos diagramas: React SPA Frontend + Django REST API** |
| **Servicios de negocio** | No detallados | **WorkflowService, MedicionService, DashboardService, ReporteService** |
| **Notificaciones** | Celery + SendGrid + FCM Push | **Solo alertas internas** (modelo `Alerta`). Email/FCM **no implementados** |
| **Integraciones externas** | Google Drive, Auth UNL LDAP/OAuth2 | **Planificadas pero no implementadas** en código |
| **Base de datos** | SQLite dev / PostgreSQL 14 prod | SQLite dev / PostgreSQL prod (sin cambio) |
| **Build tool** | No especificado | **Vite 6.3** |
| **Exportación** | No especificado | **jsPDF, xlsx, ApexCharts** en frontend |

---

## Código DSL para Structurizr

Copia y pega el siguiente bloque en [https://playground.structurizr.com/](https://playground.structurizr.com/)

```dsl
workspace "Sistema de Vinculacion UNL" "Gestion de proyectos y convenios interinstitucionales" {

    model {

        # ============================================
        # ACTORES
        # ============================================
        docente = person "Docente" "Director o responsable de proyecto. Formula, supervisa y reporta avances." {
            tags "Usuario Interno"
        }

        estudiante = person "Estudiante" "Participante en actividades de vinculacion. Registra evidencias y avances." {
            tags "Usuario Interno"
        }

        coordinador = person "Coordinador" "Coordinacion de Vinculacion. Aprueba proyectos, revisa indicadores y evalua resultados." {
            tags "Usuario Interno"
        }

        admin = person "Administrador" "Gestion institucional, usuarios, carreras y configuracion del sistema." {
            tags "Usuario Interno"
        }

        directivo = person "Directivo" "Consulta reportes estrategicos, KPIs y estados generales de vinculacion." {
            tags "Usuario Interno"
        }

        # ============================================
        # SISTEMA PRINCIPAL
        # ============================================
        vinculacion = softwareSystem "Vinculacion UNL" "Plataforma centralizada para gestion de proyectos de vinculacion y convenios interinstitucionales." {
            tags "Sistema Principal"

            # ----------------------------------------
            # CONTENEDORES
            # ----------------------------------------

            web = container "React SPA Frontend" {
                description "Interfaz de usuario web administrativa. Exporta reportes PDF/Excel, graficos interactivos y gestiona formularios complejos."
                technology "React 19, TypeScript, Vite 6.3, Tailwind CSS 3.4, Zustand 5, React Router DOM 7, React Hook Form 7, ApexCharts 5, jsPDF 4, xlsx"
                tags "Frontend"

                # ========================================
                # NIVEL 3: COMPONENTES FRONTEND
                # ========================================

                fe_router = component "React Router SPA" {
                    description "Enrutamiento del lado del cliente. Gestiona navegacion entre modulos: Dashboard, Proyectos, Convenios, Seguimiento, Reportes, Admin."
                    technology "React Router DOM 7 + protected routes por rol"
                    tags "Frontend-Enrutamiento"
                }

                fe_layouts = component "Layouts & Shell" {
                    description "Estructura visual principal: Navbar, Sidebar, Footer y layout responsivo adaptativo."
                    technology "React Components + Tailwind CSS 3.4"
                    tags "Frontend-UI"
                }

                fe_pages = component "Pages & Features" {
                    description "Vistas funcionales por dominio: Dashboard KPIs, CRUD Proyectos, CRUD Convenios, Seguimiento/Avances, Reportes, Gestion Usuarios, Admin."
                    technology "React 19 + TypeScript + feature-based folders"
                    tags "Frontend-Vista"
                }

                fe_ui = component "Shared UI Components" {
                    description "Biblioteca de componentes reutilizables: tablas, formularios, modales, selectores, date-pickers, badges de estado y graficos."
                    technology "React + Tailwind + shadcn/ui patron + ApexCharts"
                    tags "Frontend-UI"
                }

                fe_store = component "State Management" {
                    description "Store global reactivo con slices por dominio. Persistencia de sesion y cache de datos."
                    technology "Zustand 5 + TypeScript"
                    tags "Frontend-Datos"
                }

                fe_api_client = component "API Client" {
                    description "Cliente HTTP con interceptores para JWT (Bearer token), refresh automatico y manejo estandarizado de errores."
                    technology "Axios 1.9 + interceptores"
                    tags "Frontend-Integracion"
                }

                fe_hooks_utils = component "Hooks & Utils" {
                    description "Hooks personalizados y utilidades: formularios (React Hook Form), fechas (date-fns), exportacion PDF/Excel y validaciones."
                    technology "React Hook Form 7 + date-fns 4 + jsPDF 4 + xlsx"
                    tags "Frontend-Logica"
                }

                # ========================================
                # RELACIONES L3: FLUJO INTERNO FRONTEND
                # ========================================

                fe_router -> fe_layouts "1. Renderiza shell de la app"
                fe_layouts -> fe_pages "2. Carga vista activa"
                fe_pages -> fe_ui "3. Usa componentes UI compartidos"
                fe_pages -> fe_hooks_utils "4. Usa hooks y utilidades"
                fe_pages -> fe_store "5a. Lee / escribe estado global"
                fe_hooks_utils -> fe_api_client "5b. Ejecuta peticiones HTTP"
                fe_store -> fe_api_client "5c. Sincroniza datos con backend"
                fe_api_client -> api "6. Consume API REST via HTTPS/JSON"
            }

            api = container "Django REST API" {
                description "API REST monolitica con logica de negocio. Expone +40 endpoints organizados en 8 apps modulares por dominio."
                technology "Django 6.0.4, DRF 3.17.1, SimpleJWT 5.5.1, django-filter 24.1, drf-spectacular 0.28, django-cors-headers 4.3, django-environ 0.11"
                tags "Backend"

                # ========================================
                # NIVEL 3: COMPONENTES DJANGO
                # ========================================

                api_router = component "URL Router & Middleware" {
                    description "Enruta peticiones HTTP a los viewsets correspondientes. Aplica CORS, autenticacion JWT y CSRF."
                    technology "Django URLs + DRF DefaultRouter + SimpleJWT + django-cors-headers + AuditoriaMiddleware"
                    tags "Arquitectura"
                }

                permissions_layer = component "Capa de Permisos RBAC" {
                    description "Control de acceso granular por rol: IsAdmin, IsCoordinadorOrAdmin, IsDocenteOrAbove."
                    technology "DRF BasePermission + permisos personalizados en core.permissions"
                    tags "Seguridad"
                }

                viewsets_layer = component "Capa de ViewSets (Controladores)" {
                    description "Atiende +40 endpoints REST con acciones personalizadas (@action) para workflows de aprobacion, medicion y reportes."
                    technology "DRF ModelViewSet + GenericViewSet + @action"
                    tags "Vista"
                }

                filters_layer = component "Capa de Filtros y Paginacion" {
                    description "Filtros por campos, busqueda textual (SearchFilter), ordenamiento y paginacion flexible."
                    technology "django-filter + SearchFilter + OrderingFilter + FlexiblePageNumberPagination"
                    tags "Vista"
                }

                serializers_layer = component "Capa de Serializadores" {
                    description "Transforma QuerySets a JSON estructurado. Validacion de entrada y seleccion dinamica por accion (list/detail/create)."
                    technology "DRF Serializers + ModelSerializer + campos anidados"
                    tags "Serializacion"
                }

                services_layer = component "Capa de Servicios de Negocio" {
                    description "Orquesta reglas de negocio complejas: flujo de estados de proyectos, medicion de indicadores y generacion de reportes."
                    technology "Python services: ProyectoWorkflowService, IndicadorMedicionService, DashboardService, ReporteProyectoService, ReporteConvenioService, ReporteProgresoService"
                    tags "Negocio"
                }

                models_layer = component "Capa de Modelos (ORM)" {
                    description "Define ~25 entidades en 8 apps: core (base), usuarios, proyectos, convenios, seguimiento, reportes, auditoria, formatos. Herencia de TimeStampedModel."
                    technology "Django Models + TimeStampedModel + TextChoices + ImageField/FileField"
                    tags "Datos"
                }

                docs_layer = component "Documentacion API Automatica" {
                    description "Genera esquema OpenAPI 3.0 automatico. Expone Swagger UI interactivo y ReDoc."
                    technology "drf-spectacular (AutoSchema)"
                    tags "Documentacion"
                }

                # ========================================
                # RELACIONES L3: FLUJO INTERNO DE PETICION
                # ========================================

                api_router -> permissions_layer "1. Valida token JWT y verifica permisos"
                permissions_layer -> viewsets_layer "2. Autoriza ejecucion de la accion"
                viewsets_layer -> filters_layer "3. Aplica filtros, busqueda y paginacion"
                viewsets_layer -> serializers_layer "4. Solicita serializacion / validacion"
                viewsets_layer -> services_layer "5a. Ejecuta reglas de negocio (workflows, reportes)"
                serializers_layer -> models_layer "5b. Lee / escribe a traves del ORM"
                services_layer -> models_layer "5c. Consulta / actualiza entidades"
                models_layer -> db "6. Persistencia SQL (lectura/escritura)"
                docs_layer -> api_router "Expone schema OpenAPI de los endpoints"
            }

            db = container "Base de Datos" {
                description "Almacenamiento relacional de todas las entidades del sistema, incluyendo archivos multimedia en disco."
                technology "SQLite (desarrollo) / PostgreSQL (produccion)"
                tags "Datos"
            }

            admin_panel = container "Admin Django" {
                description "Panel administrativo nativo con inlines para gestion directa de entidades, usuarios y auditoria."
                technology "Django Admin + ModelAdmin personalizados"
                tags "Backend"
            }
        }

        # ============================================
        # SISTEMAS EXTERNOS (Planificados / Futuros)
        # ============================================
        auth_unl = softwareSystem "Auth UNL" {
            description "Autenticacion institucional centralizada (LDAP / OAuth2). Integracion planificada."
            tags "Sistema Externo Planificado"
        }

        google_oauth = softwareSystem "Google OAuth2" {
            description "Proveedor de identidad para acceso a Google Drive. Integracion planificada."
            tags "Sistema Externo Planificado"
        }

        google_drive = softwareSystem "Google Drive Workspace" {
            description "Almacenamiento de documentos y respaldos en la nube. Integracion planificada."
            tags "Sistema Externo Planificado"
        }

        fcm = softwareSystem "Firebase Cloud Messaging" {
            description "Plataforma para envio de notificaciones Push. Integracion planificada."
            tags "Sistema Externo Planificado"
        }

        # ============================================
        # RELACIONES NIVEL 1 (Contexto)
        # ============================================
        docente -> vinculacion "Formula proyectos, registra avances y sube evidencias"
        estudiante -> vinculacion "Participa en actividades y registra evidencias"
        coordinador -> vinculacion "Aprueba, revisa, evalua proyectos y genera reportes"
        admin -> vinculacion "Administra usuarios, carreras y configuracion"
        directivo -> vinculacion "Consulta dashboard, KPIs y reportes estrategicos"

        vinculacion -> auth_unl "Autentica usuarios contra credenciales institucionales (planificado)"
        vinculacion -> google_drive "Almacena y sincroniza documentos (planificado)"
        vinculacion -> google_oauth "Obtiene tokens de acceso a Google Drive (planificado)"
        vinculacion -> fcm "Envia notificaciones push a dispositivos moviles (planificado)"

        # ============================================
        # RELACIONES NIVEL 2 (Contenedores)
        # ============================================
        docente -> web "Usa via navegador"
        estudiante -> web "Usa via navegador"
        coordinador -> web "Usa via navegador"
        admin -> web "Usa via navegador"
        admin -> admin_panel "Gestiona entidades y auditoria"
        directivo -> web "Usa via navegador"

        web -> api "Consume API REST via HTTPS/JSON (autenticacion JWT Bearer)"
        api -> db "Lee y escribe datos SQL"
        api -> admin_panel "Expone modelos en panel administrativo"

        api -> auth_unl "Valida credenciales institucionales (planificado)"
        api -> google_drive "Sube/lee archivos de respaldo (planificado)"
        api -> fcm "Programa notificaciones push (planificado)"

        # ============================================
        # RELACIONES NIVEL 3 (Componentes)
        # Nota: ya definidas dentro del contenedor 'api'
        # ============================================
    }

    views {

        # ============================================
        # VISTA NIVEL 1: CONTEXTO
        # ============================================
        systemContext vinculacion {
            title "C1 - Contexto: Sistema de Vinculacion UNL"
            description "Actores internos (5 roles) e integraciones externas planificadas."
            include *
            autoLayout lr
        }

        # ============================================
        # VISTA NIVEL 2: CONTENEDORES
        # ============================================
        container vinculacion {
            title "C2 - Contenedores: Arquitectura General"
            description "SPA React + Django REST API + Base de Datos + Admin. Integraciones externas planificadas."
            include *
            autoLayout tb
        }

        # ============================================
        # VISTA NIVEL 3: COMPONENTES FRONTEND
        # ============================================
        component web {
            title "C3 - Componentes: React SPA Frontend"
            description "Flujo: Router -> Layouts -> Pages -> [UI Components | Hooks | Store] -> API Client -> Django REST API."
            include *
            autoLayout tb
        }

        # ============================================
        # VISTA NIVEL 3: COMPONENTES BACKEND
        # ============================================
        component api {
            title "C3 - Componentes: Django REST API"
            description "Flujo interno: Router -> Permisos -> ViewSets -> [Filtros | Serializadores | Servicios] -> Modelos -> DB. + Docs OpenAPI."
            include *
            autoLayout tb
        }

        # ============================================
        # ESTILOS VISUALES
        # ============================================
        styles {
            element "Usuario Interno" {
                background #08427B
                color #ffffff
                fontSize 14
                shape Person
            }
            element "Sistema Principal" {
                background #1168BD
                color #ffffff
                fontSize 14
            }
            element "Frontend" {
                background #438DD5
                color #ffffff
                fontSize 12
            }
            element "Backend" {
                background #3C7FC0
                color #ffffff
                fontSize 12
            }
            element "Datos" {
                background #1D7E5D
                color #ffffff
                fontSize 12
            }
            element "Sistema Externo" {
                background #999999
                color #ffffff
                fontSize 12
            }
            element "Sistema Externo Planificado" {
                background #BDC3C7
                color #2C3E50
                fontSize 12
                border dashed
            }
            element "Notificaciones" {
                background #E74C3C
                color #ffffff
                fontSize 12
            }
            element "Arquitectura" {
                background #7F77DD
                color #ffffff
                fontSize 11
            }
            element "Seguridad" {
                background #E67E22
                color #ffffff
                fontSize 11
            }
            element "Vista" {
                background #2980B9
                color #ffffff
                fontSize 11
            }
            element "Serializacion" {
                background #27AE60
                color #ffffff
                fontSize 11
            }
            element "Negocio" {
                background #8E44AD
                color #ffffff
                fontSize 11
            }
            element "Documentacion" {
                background #16A085
                color #ffffff
                fontSize 11
            }
            element "Frontend-Enrutamiento" {
                background #E74C3C
                color #ffffff
                fontSize 11
            }
            element "Frontend-UI" {
                background #3498DB
                color #ffffff
                fontSize 11
            }
            element "Frontend-Vista" {
                background #9B59B6
                color #ffffff
                fontSize 11
            }
            element "Frontend-Datos" {
                background #2ECC71
                color #ffffff
                fontSize 11
            }
            element "Frontend-Integracion" {
                background #F39C12
                color #ffffff
                fontSize 11
            }
            element "Frontend-Logica" {
                background #1ABC9C
                color #ffffff
                fontSize 11
            }
        }
    }
}
```

---

## Entidades del modelo de datos (referencia para Nivel 3)

| App | Entidades principales |
|-----|----------------------|
| `core` | `TimeStampedModel` (abstracta base) |
| `usuarios` | `Usuario`, `Carrera` (extiende `django.contrib.auth.models.User`) |
| `proyectos` | `Proyecto`, `Objetivo`, `Indicador`, `Actividad`, `ParticipanteProyecto`, `Presupuesto`, `Beneficiario`, `AlineacionEstrategica`, `FirmaResponsabilidad`, `Anexo` |
| `convenios` | `Institucion`, `Convenio`, `ProyectoConvenio`, `Compromiso`, `Producto`, `Contribucion` |
| `seguimiento` | `Avance`, `Evidencia`, `Informe`, `Alerta`, `Revision`, `FlujoValidacion` |
| `reportes` | Sin modelos propios (servicios sobre datos de otras apps) |
| `auditoria` | `Auditoria` |
| `formatos` | `FormatoInstitucional` |

**Total: ~25 entidades concretas** persistidas en la base de datos relacional.

---

## Notas para el usuario

1. **App Móvil y Email Service:** Se mantuvieron fuera del modelo activo porque no existen en el código fuente actual. Si en el futuro se implementan, se deben agregar como contenedores dentro de `vinculacion`.
2. **Integraciones externas:** Auth UNL, Google Drive y FCM están definidas con el tag `Sistema Externo Planificado` y bordes punteados para distinguirlas visualmente de lo que ya está operativo.
3. **Servicios de negocio:** Se agregó la `Capa de Servicios de Negocio` en C3-Backend porque el código actual incluye `ProyectoWorkflowService`, `IndicadorMedicionService` y los servicios de reportes, los cuales orquestan la lógica compleja antes de tocar los modelos.
4. **Frontend modernizado:** Se actualizaron todas las tecnologías del frontend según `package.json`: React 19, Vite, Zustand, Tailwind CSS, React Router DOM 7, etc.
5. **Dos diagramas de Nivel 3:** El workspace incluye **dos vistas de componentes**: una para el **React SPA Frontend** (`component web`) y otra para el **Django REST API** (`component api`). Esto permite analizar la arquitectura interna de cada contenedor por separado.
