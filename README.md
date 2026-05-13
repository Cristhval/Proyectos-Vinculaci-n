# Sistema de Gestion de Proyectos de Vinculacion y Convenios Interinstitucionales

Sistema institucional para la gestion, monitoreo y evaluacion de proyectos de vinculacion con la sociedad y convenios interinstitucionales de la Universidad Nacional de Loja.

## Stack Tecnologico

- **Backend:** Django 6.0 + Django REST Framework
- **Autenticacion:** JWT (Simple JWT)
- **Documentacion API:** Swagger UI + ReDoc (drf-spectacular)
- **Base de datos:** SQLite (desarrollo) / PostgreSQL (produccion)

## Estructura del Proyecto

```
Proyectos-Vinculacion/
├── core/                    # Modelo base (TimeStampedModel) y utilidades
├── usuarios/                # Gestion de usuarios, carreras, autenticacion
├── proyectos/               # Proyectos, objetivos, indicadores, actividades
├── convenios/               # Instituciones, convenios, compromisos, productos
├── seguimiento/             # Avances, evidencias, informes, alertas, revisiones
├── reportes/                # Dashboard, reportes y KPIs
├── auditoria/               # Registro de auditoria y trazabilidad
├── specs/                   # Especificaciones (OpenAPI, dominio, flujos)
│   ├── api/openapi.yml      # Especificacion OpenAPI 3.0 completa
│   ├── dominio/             # Modelo de entidades, DER, estados
│   ├── workflows/           # Flujos de trabajo (aprobacion, ciclo de vida)
│   ├── arquitectura/        # Decisiones de arquitectura (ADR)
│   └── postman/             # Coleccion Postman
├── scripts/                 # Scripts de utilidad (seed users)
├── proyecto_vinculacion_universidad/  # Configuracion del proyecto Django
├── manage.py
├── requirements.txt
├── .env                     # Variables de entorno (NO COMMITEAR)
└── .env.example             # Ejemplo de variables de entorno
```

## Instalacion

```bash
# Clonar repositorio
git clone <repo-url>
cd Proyectos-Vinculacion

# Crear y activar entorno virtual
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Copiar y configurar variables de entorno
cp .env.example .env

# Ejecutar migraciones
python manage.py migrate

# Crear usuarios de prueba
python scripts/create_test_users.py

# Iniciar servidor
python manage.py runserver
```

## Comandos utiles

```bash
# Iniciar servidor de desarrollo
python manage.py runserver

# Ejecutar tests
python manage.py test

# Generar schema OpenAPI
python manage.py spectacular --file schema.yml
```

## Endpoints Principales

| Modulo | URL | Descripcion |
|--------|-----|-------------|
| **Swagger UI** | http://localhost:8000/api/docs/ | Documentacion interactiva |
| **ReDoc** | http://localhost:8000/api/redoc/ | Documentacion alternativa |
| **Auth** | /api/v1/auth/register/ | Registro de usuarios |
| | /api/v1/auth/login/ | Inicio de sesion (JWT) |
| | /api/v1/auth/refresh/ | Renovar token |
| **Usuarios** | /api/v1/usuarios/ | CRUD usuarios |
| | /api/v1/usuarios/me/ | Perfil actual |
| | /api/v1/carreras/ | Lista de carreras |
| **Proyectos** | /api/v1/proyectos/ | CRUD proyectos |
| | /api/v1/proyectos/{id}/enviar-revision/ | Enviar a revision |
| | /api/v1/proyectos/{id}/aprobar/ | Aprobar proyecto |
| | /api/v1/proyectos/{id}/rechazar/ | Rechazar (devuelve a borrador) |
| | /api/v1/objetivos/ | CRUD objetivos |
| | /api/v1/indicadores/ | CRUD indicadores |
| | /api/v1/indicadores/{id}/medir/ | Registrar medicion |
| | /api/v1/actividades/ | CRUD actividades |
| | /api/v1/participantes/ | CRUD participantes |
| | /api/v1/presupuestos/ | CRUD presupuestos |
| | /api/v1/beneficiarios/ | CRUD beneficiarios |
| | /api/v1/alineaciones/ | CRUD alineacion estrategica |
| | /api/v1/firmas/ | CRUD firmas responsabilidad |
| **Convenios** | /api/v1/instituciones/ | CRUD instituciones |
| | /api/v1/convenios/ | CRUD convenios |
| | /api/v1/proyecto-convenios/ | Vincular proyecto-convenio |
| | /api/v1/compromisos/ | CRUD compromisos |
| | /api/v1/productos/ | CRUD productos |
| | /api/v1/contribuciones/ | CRUD contribuciones |
| **Seguimiento** | /api/v1/avances/ | CRUD avances |
| | /api/v1/avances/{id}/aprobar/ | Aprobar avance |
| | /api/v1/avances/{id}/rechazar/ | Rechazar avance |
| | /api/v1/evidencias/ | CRUD evidencias |
| | /api/v1/informes/ | CRUD informes |
| | /api/v1/alertas/ | Listar alertas |
| | /api/v1/alertas/{id}/leer/ | Marcar como leida |
| | /api/v1/alertas/{id}/atender/ | Marcar como atendida |
| | /api/v1/revisiones/ | CRUD revisiones |
| | /api/v1/flujos-validacion/ | CRUD flujo validacion |
| **Reportes** | /api/v1/reportes/dashboard/ | Dashboard KPIs |
| | /api/v1/reportes/proyectos/ | Reporte de proyectos |
| | /api/v1/reportes/convenios/ | Reporte de convenios |
| | /api/v1/reportes/progreso/ | Reporte de progreso |
| **Auditoria** | /api/v1/auditoria/ | Registro de auditoria (solo admin) |

## Usuarios de Prueba

| Usuario | Password | Rol |
|---------|----------|-----|
| admin | Admin123! | Administrador |
| coordinador | Admin123! | Coordinador |
| docente | Admin123! | Docente |
| estudiante | Admin123! | Estudiante |

## Licencia

Propiedad de la Universidad Nacional de Loja.
