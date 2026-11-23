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
| HU-27 | Recepción de mediciones | `iot/services.py` (`registrar_medicion`), `iot/authentication.py`, `iot/throttling.py` | `iot/tests_mediciones.py`: PA-27.1 a PA-27.5; PA-27.6 es manual (ver abajo) |

## Endpoints

| Método y ruta | Quién |
|---------------|-------|
| `GET /api/v1/proyectos/{id}/dispositivos/` | Quien puede ver el proyecto |
| `POST /api/v1/proyectos/{id}/dispositivos/` | Responsable, COORDINADOR, ADMIN (requiere monitoreo activo) |
| `GET /api/v1/dispositivos/{id}/` | Quien puede ver el proyecto |
| `PATCH /api/v1/dispositivos/{id}/` (solo `nombre`, `descripcion`) | Responsable, COORDINADOR, ADMIN |
| `POST /api/v1/dispositivos/{id}/baja/` | Responsable, COORDINADOR, ADMIN |
| `POST /api/v1/dispositivos/{id}/regenerar-token/` | Responsable, COORDINADOR, ADMIN |
| `GET /api/v1/dispositivos/{id}/mediciones/?desde=&hasta=` (paginado) | Quien puede ver el proyecto |
| `POST /api/v1/iot/mediciones/` | El dispositivo, con `Authorization: Device <token>` |

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
- **Authentication Strategy de DRF**: `DeviceTokenAuthentication` para el dispositivo; JWT para usuarios.

## Recepción de mediciones (HU-27)

`POST /api/v1/iot/mediciones/` con `Authorization: Device <token>` y un JSON como
`{"temperatura": 22.5, "humedad": 61, "co2": 640}`.

| Caso | Respuesta |
|------|-----------|
| Medición válida | 201; guarda la hora del servidor y actualiza `ultima_lectura` |
| Fuera de rango: temperatura −40 a 80 °C, humedad 0 a 100 %, CO₂ 0 a 10 000 ppm | 400 |
| Ninguna variable que el dispositivo mida | 400 |
| Variable que el dispositivo no mide | Se ignora (se informa en `ignoradas`) |
| Token inválido, regenerado o dispositivo dado de baja | 401 (`WWW-Authenticate: Device`) |
| Monitoreo del proyecto desactivado | 403 (el historial se conserva) |
| Otra medición del mismo dispositivo antes de 30 s | 429 con `Retry-After` |

El límite de 1 medición cada 30 s es por dispositivo (no por IP) y usa la caché de
Django (LocMemCache): sirve con una sola instancia, como en Render. Con varias
instancias se necesita una caché compartida (Redis). La tasa se puede cambiar con la
variable de entorno `IOT_THROTTLE_MEDICION` (por defecto `1/30s`).

## Simulador

```bash
export IOT_DEVICE_TOKEN='dv_...'      # el token que mostró la pestaña Dispositivos
python scripts/simulador_esp32.py                       # local, cada 30 s
python scripts/simulador_esp32.py --url https://<api>/api/v1/iot/mediciones/ --intervalo 60
python scripts/simulador_esp32.py --sin-co2 --veces 5
```

## Firmware ESP32 (DHT11 + MQ-135)

`firmware/esp32_sensores/esp32_sensores.ino`. Copie `config.example.h` como `config.h`
(está en `.gitignore`) y complete Wi-Fi, URL y token. Las conexiones, el divisor de
tensión del MQ-135 y la calibración de R0 están documentados al inicio del `.ino`.
Sin calibrar, el CO₂ en ppm es aproximado.

## PA-27.6: cola del ESP32 al reconectar (verificación manual con hardware)

Esta prueba no se puede automatizar: necesita el ESP32 real, el firmware cargado y un
proyecto con monitoreo activo.

**Preparación**

1. Registre un dispositivo en la pestaña Dispositivos y copie el token.
2. Complete `firmware/esp32_sensores/config.h` (Wi-Fi, `API_URL`, `DEVICE_TOKEN`) y deje
   `INTERVALO_LECTURA_MS` en 60000 e `INTERVALO_ENVIO_MS` en 31000.
3. Cargue el programa y abra el monitor serie a 115200 baudios.
4. Espere a ver `[api] {...} -> 201` al menos una vez.

**Pasos**

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Apague el router (o el punto de acceso) | El monitor serie muestra `[wifi] conexión perdida: las lecturas se guardan en la cola` |
| 2 | Espere unos 5 minutos | Cada minuto aparece `[lectura] ... (en cola: N)` con N creciente; no hay líneas `[api]` |
| 3 | En la pestaña Dispositivos, espere a que pasen más de 5 min sin datos | El estado cambia a **Sin conexión** |
| 4 | Encienda el router | Aparece `[wifi] conectado, IP ... Reintentando la cola (N pendientes)` y enseguida un `[api] ... -> 201` |
| 5 | Observe el monitor unos minutos | Se envía una lectura cada ~31 s, con 201, y el número en cola baja hasta 0 |
| 6 | Revise la pestaña Dispositivos | El estado vuelve a **En línea** y la última lectura se actualiza sin recargar |
| 7 | Consulte `GET /api/v1/dispositivos/{id}/mediciones/` | Están las lecturas tomadas durante el corte |

**Criterio de aprobación:** ninguna lectura tomada durante el corte se pierde mientras
el corte dure menos de `TAMANO_COLA` lecturas (30 por defecto, unos 30 min). Si se
supera, el firmware descarta las más antiguas y lo avisa con `[cola] llena`.

**A tener en cuenta:** el servidor registra la hora de llegada, así que las lecturas
que esperaron en la cola quedan con la hora en que se enviaron, no con la hora en que
se midieron. No se reciben antes de 30 s entre sí (límite del servidor), por eso la
cola se vacía a razón de una lectura cada 31 s.
