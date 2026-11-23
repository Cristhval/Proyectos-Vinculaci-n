# Módulo 2: dispositivos IoT

Monitoreo ambiental de proyectos de vinculación con ESP32 + DHT11 (temperatura y humedad) + MQ-135 (CO₂).

**Documento de diseño oficial** (historias de usuario y pruebas de aceptación PA-xx.y):
<https://docs.google.com/document/d/1l2NPkQqWdc7BAEt0sPocdScX6k15LtnKOKQl-yUOG-8/edit?usp=sharing>

## Historias y dónde están

| HU | Tema | Backend | Pruebas |
|----|------|---------|---------|
| HU-18 | Monitoreo ambiental ON/OFF (campo y reglas) | `proyectos/services.py` (`ProyectoMonitoreoService`), `POST /api/v1/proyectos/{id}/monitoreo/` | `proyectos/tests_monitoreo.py` |
| HU-25 | Registro de dispositivos | `iot/services.py` (`registrar_dispositivo`) | `iot/tests.py`: PA-25.1 a PA-25.7 |
| HU-26 | Edición, baja y regeneración de token | `iot/services.py` (`editar_dispositivo`, `dar_de_baja`, `regenerar_token`) | `iot/tests.py`: PA-26.1 a PA-26.6 |
| HU-28 | Estado de conexión | `iot/services.py` (`EstadoPorUmbralMinutos`) | `iot/tests.py`: PA-28.1 a PA-28.4 (PA-28.5 es del frontend) |
| HU-27 | Recepción de mediciones | Fase 3 | PA-27.1 a PA-27.6 |

## Endpoints

| Método y ruta | Quién |
|---------------|-------|
| `GET /api/v1/proyectos/{id}/dispositivos/` | Quien puede ver el proyecto |
| `POST /api/v1/proyectos/{id}/dispositivos/` | Responsable, COORDINADOR, ADMIN (requiere monitoreo activo) |
| `GET /api/v1/dispositivos/{id}/` | Quien puede ver el proyecto |
| `PATCH /api/v1/dispositivos/{id}/` (solo `nombre`, `descripcion`) | Responsable, COORDINADOR, ADMIN |
| `POST /api/v1/dispositivos/{id}/baja/` | Responsable, COORDINADOR, ADMIN |
| `POST /api/v1/dispositivos/{id}/regenerar-token/` | Responsable, COORDINADOR, ADMIN |

Las respuestas siguen el formato `{success, message, data}` del resto de la API.

## Token del dispositivo

- Formato `dv_` + `secrets.token_urlsafe(32)`, generado por `TokenDispositivoFactory`.
- Solo se guarda su hash SHA-256 (`DispositivoIoT.token_hash`); se compara con `hmac.compare_digest`.
- El texto plano aparece una única vez: en la respuesta de registrar y en la de regenerar.
  Nunca en un GET, en logs ni en la auditoría.
- Dar de baja invalida el token. Regenerar invalida el anterior.

## Estado de conexión

| Estado | Regla |
|--------|-------|
| `EN_LINEA` (En línea) | Última lectura hace ≤ `IOT_MINUTOS_EN_LINEA` minutos (5 por defecto) |
| `SIN_CONEXION` (Sin conexión) | Última lectura más antigua |
| `PENDIENTE` (Pendiente de primera lectura) | Nunca envió datos |

## Patrones de diseño

- **Service Layer**: `iot/services.py` y `ProyectoMonitoreoService`; las vistas solo validan permisos y entrada.
- **Factory**: `TokenDispositivoFactory`.
- **Strategy**: `EstrategiaEstadoConexion` / `EstadoPorUmbralMinutos`.
- **Observer**: señales `monitoreo_cambiado` y `dispositivo_accion` + post_save de `auditoria/signals.py`.
- **Authentication Strategy de DRF**: autenticación del dispositivo por token (Fase 3).
