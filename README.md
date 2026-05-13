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
├── docs/                    # Documentacion adicional
│   └── TESTING.md           # Guia completa de tests automatizados
├── scripts/                 # Scripts de utilidad (seed users)
├── proyecto_vinculacion_universidad/  # Configuracion del proyecto Django
├── manage.py                # Script principal de Django
├── run_tests.bat            # Ejecutor de tests (Windows)
├── run_tests.sh             # Ejecutor de tests (Linux/Mac)
├── generate_docs_pdf.py     # Generador de documentacion PDF
├── generate_pdf.bat         # Script generador PDF (Windows)
├── generate_pdf.sh          # Script generador PDF (Linux/Mac)
├── requirements.txt         # Dependencias del proyecto
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

# Ejecutar tests con detalles
python manage.py test --verbosity=2

# Ejecutar un test especifico
python manage.py test usuarios.tests.AuthTestCase

# Generar schema OpenAPI
python manage.py spectacular --file schema.yml
```

## Tests Automatizados

El proyecto incluye **tests automatizados** que verifican el funcionamiento correcto de los endpoints de la API.

### Ejecucion Rapida

**Windows (doble clic):**
```
run_tests.bat
```

**Linux/Mac:**
```bash
chmod +x run_tests.sh
./run_tests.sh
```

**Manualmente:**
```bash
# Activar entorno virtual
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Ejecutar todos los tests
python manage.py test --verbosity=2
```

### Tests Disponibles (19 tests)

| Modulo | Tests | Descripcion |
|--------|-------|-------------|
| **Auth** | 4 tests | Registro, login, credenciales invalidas, duplicados |
| **Usuarios** | 3 tests | Listar usuarios, perfil actual, listar carreras |
| **Proyectos** | 3 tests | Crear proyecto, listar proyectos, enviar a revision |
| **Convenios** | 2 tests | Crear institucion, crear convenio |
| **Seguimiento** | 3 tests | Crear actividad, crear avance, listar alertas |
| **Reportes** | 1 test | Dashboard KPIs |
| **Manejo de Errores** | 3 tests | Acceso no autenticado, endpoints no encontrados |

### Beneficios de los Tests Automatizados

- ✅ **Ejecucion automatica**: Corre todos los tests con un solo comando
- ✅ **Base de datos aislada**: Usa SQLite en memoria (no afecta tu BD real)
- ✅ **Deteccion de regresiones**: Detecta si nuevos cambios rompen funcionalidad existente
- ✅ **Documentacion viva**: Los tests muestran como usar los endpoints
- ✅ **Integracion continua**: Ideal para CI/CD pipelines

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

## Generacion de Documentacion PDF

El proyecto incluye un **generador automatico de documentacion PDF** que crea un informe completo con toda la informacion del sistema. Es ideal para:

- Reportar avances al docente
- Entregar documentacion tecnica
- Tener un respaldo offline de la documentacion
- Presentaciones y revisiones

### Contenido del PDF Generado

El PDF incluye 10 secciones profesionales:

1. **Portada** - Informacion institucional y fecha
2. **Resumen Ejecutivo** - Vision general del proyecto
3. **Informacion General** - Datos del proyecto y universidad
4. **Stack Tecnologico** - Tecnologias y versiones utilizadas
5. **Estructura del Proyecto** - Organizacion de archivos y modulos
6. **Tests Automatizados** - Resultados y cobertura de tests
7. **Endpoints de la API** - Documentacion completa de endpoints
8. **Modelos de Datos** - Descripcion de entidades
9. **Estado Actual y Avances** - Funcionalidades completadas
10. **Proximos Pasos** - Mejoras planificadas

### Como Generar el PDF

#### Opcion 1: Script Automatico (Recomendada)

**Windows:**
```bash
generate_pdf.bat
```
O simplemente haz doble clic en el archivo `generate_pdf.bat`

**Linux/Mac:**
```bash
chmod +x generate_pdf.sh
./generate_pdf.sh
```

#### Opcion 2: Comando Manual

```bash
# Activar entorno virtual
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Generar PDF
python generate_docs_pdf.py
```

#### Opcion 3: Instalacion de dependencias (primera vez)

Si es la primera vez que generas el PDF, instala ReportLab:

```bash
pip install reportlab
```

### Ubicacion del PDF Generado

El archivo se genera en la raiz del proyecto:
```
documentacion_proyecto.pdf
```

### Actualizar el PDF

Puedes regenerar el PDF cuantas veces quieras para reflejar los ultimos cambios:

```bash
# Cada vez que quieras actualizar la documentacion:
python generate_docs_pdf.py
```

### Ejemplo de Uso

```bash
# Despues de completar una funcionalidad:
1. Ejecuta: python generate_docs_pdf.py
2. Revisa: documentacion_proyecto.pdf
3. Entrega al docente o guarda para tu portafolio
```

## Licencia

Propiedad de la Universidad Nacional de Loja.
