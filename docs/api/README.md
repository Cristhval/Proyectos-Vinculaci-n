# Documentacion de la API

## Base URL

```
http://127.0.0.1:8000/api/v1
```

## Autenticacion

### Login

```http
POST /api/v1/auth/login/
Content-Type: application/json

{
    "email": "usuario@unl.edu.ec",
    "password": "contrasena"
}
```

### Respuesta

```json
{
    "access": "eyJ...",
    "refresh": "eyJ...",
    "usuario": {
        "id": 1,
        "email": "usuario@unl.edu.ec",
        "rol": "DOCENTE"
    }
}
```

### Uso del Token

```http
Authorization: Bearer <access_token>
```

### Renovar Token

```http
POST /api/v1/auth/refresh/
Content-Type: application/json

{
    "refresh": "eyJ..."
}
```

## Endpoints por Modulo

### Autenticacion

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| POST | `/api/v1/auth/login/` | Iniciar sesion | No |
| POST | `/api/v1/auth/register/` | Registrar usuario | No |
| POST | `/api/v1/auth/refresh/` | Renovar access token | No |

### Usuarios

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/usuarios/` | Listar usuarios | Si |
| POST | `/api/v1/usuarios/` | Crear usuario | Si |
| GET | `/api/v1/usuarios/{id}/` | Detalle usuario | Si |
| PUT | `/api/v1/usuarios/{id}/` | Actualizar usuario | Si |
| DELETE | `/api/v1/usuarios/{id}/` | Eliminar usuario | Si |

### Carreras

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/carreras/` | Listar carreras | Si |
| POST | `/api/v1/carreras/` | Crear carrera | Si |

### Proyectos

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/proyectos/` | Listar proyectos | Si |
| POST | `/api/v1/proyectos/` | Crear proyecto | Si |
| GET | `/api/v1/proyectos/{id}/` | Detalle proyecto | Si |
| PUT | `/api/v1/proyectos/{id}/` | Actualizar proyecto | Si |
| DELETE | `/api/v1/proyectos/{id}/` | Eliminar proyecto | Si |

### Objetivos

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/objetivos/` | Listar objetivos | Si |
| POST | `/api/v1/objetivos/` | Crear objetivo | Si |

### Indicadores

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/indicadores/` | Listar indicadores | Si |
| POST | `/api/v1/indicadores/` | Crear indicador | Si |

### Actividades

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/actividades/` | Listar actividades | Si |
| POST | `/api/v1/actividades/` | Crear actividad | Si |

### Participantes

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/participantes/` | Listar participantes | Si |
| POST | `/api/v1/participantes/` | Agregar participante | Si |

### Presupuestos

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/presupuestos/` | Listar presupuestos | Si |
| POST | `/api/v1/presupuestos/` | Crear presupuesto | Si |

### Beneficiarios

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/beneficiarios/` | Listar beneficiarios | Si |
| POST | `/api/v1/beneficiarios/` | Crear beneficiario | Si |

### Convenios

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/convenios/` | Listar convenios | Si |
| POST | `/api/v1/convenios/` | Crear convenio | Si |
| GET | `/api/v1/convenios/{id}/` | Detalle convenio | Si |
| PUT | `/api/v1/convenios/{id}/` | Actualizar convenio | Si |
| DELETE | `/api/v1/convenios/{id}/` | Eliminar convenio | Si |

### Instituciones

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/instituciones/` | Listar instituciones | Si |
| POST | `/api/v1/instituciones/` | Crear institucion | Si |

### Avances

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/avances/` | Listar avances | Si |
| POST | `/api/v1/avances/` | Registrar avance | Si |

### Evidencias

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/evidencias/` | Listar evidencias | Si |
| POST | `/api/v1/evidencias/` | Subir evidencia | Si |

### Informes

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/informes/` | Listar informes | Si |
| POST | `/api/v1/informes/` | Crear informe | Si |

### Alertas

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/alertas/` | Listar alertas | Si |

### Revisiones

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/revisiones/` | Listar revisiones | Si |
| POST | `/api/v1/revisiones/` | Crear revision | Si |

### Flujos de Validacion

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/flujos-validacion/` | Listar flujos | Si |
| POST | `/api/v1/flujos-validacion/` | Crear flujo | Si |

### Reportes

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/reportes/dashboard/` | Dashboard ejecutivo | Si |
| GET | `/api/v1/reportes/proyectos/` | Reporte de proyectos | Si |
| GET | `/api/v1/reportes/convenios/` | Reporte de convenios | Si |
| GET | `/api/v1/reportes/progreso/` | Reporte de progreso | Si |
| GET | `/api/v1/reportes/docente/` | Reporte docente | Si |

### Auditoria

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/auditoria/registros/` | Logs de auditoria | Si (Admin) |

### Formatos

| Metodo | Endpoint | Descripcion | Auth |
|:-------|:---------|:------------|:-----|
| GET | `/api/v1/formatos/` | Listar formatos | Si |
| POST | `/api/v1/formatos/` | Subir formato | Si |

### Documentacion

| Metodo | Endpoint | Descripcion |
|:-------|:---------|:------------|
| GET | `/api/schema/` | Esquema OpenAPI |
| GET | `/api/docs/` | Swagger UI |
| GET | `/api/redoc/` | ReDoc |

## Codigos de Respuesta

| Codigo | Significado |
|:-------|:------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 204 | No Content - Eliminacion exitosa |
| 400 | Bad Request - Datos invalidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |
