workspace "Sistema de Vinculacion UNL" "Gestion de proyectos y convenios interinstitucionales" {

    model {
        
        # ============================================
        # ACTORES
        # ============================================
        docente = person "Docente" "Director o responsable de proyecto" {
            tags "Usuario Interno"
        }
        
        estudiante = person "Estudiante" "Participante en actividades" {
            tags "Usuario Interno"
        }

        coordinador = person "Coordinador" "Coordinacion de Vinculacion, aprueba y valida proyectos" {
            tags "Usuario Interno"
        }
        
        admin = person "Administrador" "Gestion institucional y configuracion del sistema" {
            tags "Usuario Interno"
        }
        
        # ============================================
        # SISTEMA PRINCIPAL
        # ============================================
        vinculacion = softwareSystem "Vinculacion UNL" {
            description "Plataforma centralizada para gestion de proyectos de vinculacion y convenios interinstitucionales"
            tags "Sistema Principal"
            
            # CONTENEDORES
            web = container "React SPA Frontend" {
                description "Interfaz de usuario web administrativa"
                technology "React 18, TypeScript, Redux, Bootstrap"
                tags "Frontend"
            }
            
            mobile_app = container "Aplicacion Movil" {
                description "App para seguimiento operativo, registro de evidencias en campo y alertas"
                technology "Flutter o React Native"
                tags "Frontend"
            }
            
            api = container "Django REST API" {
                description "API REST con logica de negocio, 7 apps modulares por dominio"
                technology "Django 6.0, DRF 3.17.1, SimpleJWT 5.5.1, django-filter 25.2, drf-spectacular, django-cors-headers, django-environ"
                tags "Backend"
                
                # ============== NIVEL 3: COMPONENTES DJANGO ==============
                
                api_router = component "URL Router & Middleware" {
                    description "Enruta peticiones HTTP, valida tokens JWT y aplica CORS."
                    technology "DRF DefaultRouter + SimpleJWT + django-cors-headers"
                    tags "Arquitectura"
                }
                
                permissions_layer = component "Capa de Permisos RBAC" {
                    description "Control de acceso granular por rol: IsAdmin, IsCoordinadorOrAdmin, IsDocenteOrAbove"
                    technology "DRF BasePermission"
                    tags "Seguridad"
                }
                
                viewsets_layer = component "Capa de ViewSets (Controladores)" {
                    description "Centraliza la logica de negocio, validacion y atiende +40 endpoints REST."
                    technology "DRF ModelViewSet + @action"
                    tags "Vista"
                }
                
                filters_layer = component "Capa de Filtros y Paginacion" {
                    description "Filtros por campos, busqueda textual, ordenamiento y paginacion de resultados."
                    technology "django-filter + SearchFilter + OrderingFilter + PageNumberPagination"
                    tags "Vista"
                }
                
                serializers_layer = component "Capa de Serializadores" {
                    description "Transforma QuerySets a JSON estructurado y valida datos de entrada."
                    technology "DRF Serializers + ModelSerializer"
                    tags "Serializacion"
                }
                
                models_layer = component "Capa de Modelos (ORM)" {
                    description "Define 26 entidades en 7 apps: core, usuarios, proyectos, convenios, seguimiento, reportes, auditoria."
                    technology "Django Models + TimeStampedModel + TextChoices"
                    tags "Datos"
                }
                
                docs_layer = component "Documentacion API" {
                    description "Genera esquema OpenAPI 3.0 automatico. Swagger UI interactivo y ReDoc."
                    technology "drf-spectacular"
                    tags "Documentacion"
                }
                
                # ============== RELACIONES L3: FLUJO DE PETICION ==============
                
                api_router -> permissions_layer "1. Verifica rol y permisos"
                permissions_layer -> viewsets_layer "2. Autoriza acceso"
                viewsets_layer -> filters_layer "3. Aplica filtros, busqueda y paginacion"
                viewsets_layer -> serializers_layer "4. Solicita serializacion"
                serializers_layer -> models_layer "5. Lee/Escribe a traves del ORM"
                docs_layer -> api_router "Expone schema OpenAPI"
            }
            
            db = container "Base de Datos" {
                description "Base de datos relacional"
                technology "SQLite (desarrollo) / PostgreSQL 14 (produccion)"
                tags "Datos"
            }

            admin_panel = container "Admin Django" {
                description "Panel administrativo con inlines para gestion de todas las entidades"
                technology "Django Admin"
                tags "Backend"
            }
            
            email_service = container "Email Service SMTP" {
                description "Microservicio interno para envio de correos"
                technology "Celery, SendGrid SMTP"
                tags "Notificaciones"
            }
        }
        
        # ============================================
        # SISTEMAS EXTERNOS
        # ============================================
        auth_unl = softwareSystem "Auth UNL" {
            description "Autenticacion institucional (LDAP, OAuth2)"
            tags "Sistema Externo"
        }
        
        google_oauth = softwareSystem "Google OAuth2" {
            description "Proveedor de identidad para Google Drive (OAuth2)"
            tags "Sistema Externo"
        }

        google_drive = softwareSystem "Google Drive Workspace" {
            description "Plataforma de almacenamiento en la nube"
            tags "Sistema Externo"
        }
        
        fcm = softwareSystem "Firebase Cloud Messaging" {
            description "Plataforma para envio de notificaciones Push"
            tags "Sistema Externo"
        }
        
        # ============================================
        # RELACIONES NIVEL 1 y 2
        # ============================================
        docente -> vinculacion "Usa para formular y supervisar"
        estudiante -> vinculacion "Usa para registrar actividades"
        coordinador -> vinculacion "Usa para aprobar, revisar y evaluar"
        admin -> vinculacion "Usa para administrar y configurar"
        
        vinculacion -> auth_unl "Autentica usuarios"
        vinculacion -> google_drive "Almacena documentos"
        vinculacion -> google_oauth "Accede a Google Drive"
        
        web -> api_router "Consume API via HTTPS"
        mobile_app -> api_router "Consume API via HTTPS"
        mobile_app -> fcm "Recibe notificaciones Push"
        admin_panel -> db "Gestiona datos directamente"
        
        models_layer -> db "Lee y escribe datos"
        api_router -> auth_unl "Valida credenciales"
        
        email_service -> google_drive "Genera reportes PDF y sube a nube"
        email_service -> fcm "Programa notificaciones"
    }
    
    views {
        
        systemContext vinculacion {
            title "C1 - Contexto: Sistema de Vinculacion UNL"
            description "Actores e integraciones externas"
            include *
            autoLayout lr
        }
        
        container vinculacion {
            title "C2 - Contenedores: Arquitectura General"
            description "Componentes principales y comunicaciones"
            include *
            autoLayout tb
        }
        
        component api {
            title "C3 - Componentes: Django REST API"
            description "Flujo: Router -> Permisos -> ViewSets -> Filtros -> Serializers -> Modelos. + Docs y Admin."
            include *
            autoLayout tb
        }
        
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
            element "Notificaciones" {
                background #E74C3C
                color #ffffff
                fontSize 12
            }
            element "Integracion Externa" {
                background #F5A623
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
            element "Documentacion" {
                background #16A085
                color #ffffff
                fontSize 11
            }
        }
    }
}
