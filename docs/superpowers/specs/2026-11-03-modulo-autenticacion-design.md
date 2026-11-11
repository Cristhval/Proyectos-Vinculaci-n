# Módulo de Acceso (auth-service) — Diseño

- **Fecha:** 2026-11-03
- **Autor:** Alexander Sánchez
- **Estado:** aprobado en conversación, pendiente de revisión escrita
- **Rama:** `feature/modulo-autenticacion`

## 1. Objetivo

Renovar el login existente del Sistema de Gestión de Proyectos de Vinculación con la Sociedad y convertirlo en un **servicio de autenticación independiente** que:

1. Permita iniciar sesión con credenciales (usuario o correo + contraseña).
2. Valide usuarios y asigne roles (`ADMIN`, `COORDINADOR`, `DOCENTE`, `ESTUDIANTE`; `DIRECTIVO` se conserva por compatibilidad), de modo que cada persona acceda solo a lo que le corresponde.
3. Verifique que el acceso no sea automatizado mediante **reCAPTCHA v2**.
4. Permita autenticarse con **Google, GitHub y Facebook**.
5. Permita **recuperar la contraseña** por correo.
6. Se despliegue por separado en la nube (**Render**) y se integre con el sistema principal mediante servicios (HTTP + JWT).

Es entregable práctico de la Unidad 1 y debe funcionar en vivo para la defensa.

### Criterios de éxito

- El sistema principal ya no tiene endpoints de login, registro, refresh ni cambio de contraseña; todo eso vive en `auth-service`.
- Un usuario de cada rol inicia sesión y ve solo su dashboard y sus opciones.
- Login con contraseña falla si el reCAPTCHA no es válido.
- Login con Google, GitHub y Facebook funciona para cuentas cuyo correo ya está registrado, y se rechaza con mensaje claro si no lo está.
- Recuperación de contraseña envía el enlace (consola en local, Brevo en producción) y el enlace deja de servir tras usarse o tras 30 minutos.
- Cerrar sesión invalida el refresh token en el servidor.
- Ya no es posible registrarse como `ADMIN` desde la API pública.
- Ambos servicios desplegados en Render, cada uno con su base de datos.
- Tests de Django en verde en ambos servicios; frontend compila (`tsc -b && vite build`).

### Fuera de alcance

- Autenticación de dos factores.
- Login social que cree cuentas nuevas (solo vincula cuentas existentes).
- Cambiar el almacenamiento de tokens en el frontend (sigue en zustand + `localStorage`).
- Migración masiva de usuarios (solo existe una cuenta `admin`).

## 2. Situación actual (verificada en el repositorio)

- Login en `usuarios/views.py` (`LoginAPIView`) con SimpleJWT HS256; auditoría de inicio de sesión; perfil `Usuario` 1:1 con `django.contrib.auth.User` y campo `rol`.
- Permisos por jerarquía de rol en `core/permissions.py`; rutas protegidas por rol en `frontend/src/routes/ProtectedRoute.tsx`.
- Problemas detectados:
  - `RegisterSerializer` acepta `rol` del cliente → escalada a `ADMIN`.
  - `BLACKLIST_AFTER_ROTATION=True` sin la app `token_blacklist` instalada; no hay logout en servidor.
  - El login crea en silencio un perfil `ESTUDIANTE` si falta.
  - Sin límite de intentos ni CAPTCHA; sin login social.
  - El enlace "¿Olvidaste?" no lleva a ninguna parte.

## 3. Arquitectura

```
┌──────────────┐  login, registro, social,   ┌──────────────────┐
│  Frontend    │  refresh, logout, recuperar │  auth-service    │──► Google reCAPTCHA
│ React (Vercel)├────────────────────────────►│  Django (Render) │──► Google / GitHub / Facebook OAuth
│              │                              │  auth-db (PG)    │──► Brevo (correo)
│              │  API de negocio + JWT        └──────────────────┘
│              ├────────────────────────────►┌──────────────────┐
└──────────────┘                              │ API principal    │ valida JWT con
                                              │ Django (Render)  │ AUTH_PUBLIC_KEY
                                              │ vinculacion-db   │ (RS256)
                                              └──────────────────┘
```

- `auth-service` vive en `auth_service/` en el mismo repositorio, como **proyecto Django independiente**: `manage.py`, `requirements.txt`, `settings`, `Dockerfile` y base de datos propios. No importa código del sistema principal ni viceversa.
- Comunicación únicamente por HTTP. El sistema principal **no llama** a `auth-service` en tiempo de ejecución: valida los tokens con la clave pública RSA recibida por variable de entorno. Si `auth-service` cae, las sesiones existentes siguen funcionando hasta que expira el access token.
- Firma **RS256**: la clave privada existe solo en `auth-service`; la pública se publica en `/.well-known/jwks.json` y se configura en el sistema principal.

## 4. auth-service

### 4.1 Estructura

```
auth_service/
  manage.py
  requirements.txt
  Dockerfile
  README.md                  # guía de credenciales y despliegue
  auth_project/              # settings, urls, wsgi
  cuentas/
    models.py                # Cuenta, IdentidadSocial, CodigoIntercambio
    serializers.py
    views.py                 # vistas delgadas que delegan en AuthFacade
    urls.py
    permissions.py           # EsAdmin
    servicios/
      fachada.py             # AuthFacade
      captcha.py             # VerificadorCaptcha (reCAPTCHA / de prueba)
      tokens.py              # EmisorTokens (claims + RS256)
      proveedores.py         # ProveedorIdentidad + Google/GitHub/Facebook + FabricaProveedores
      correo.py              # EmisorCorreo + EmisorConsola / EmisorBrevo
      recuperacion.py        # ServicioRecuperacion
    management/commands/sembrar_cuentas.py
    tests/
```

### 4.2 Modelos (mínimos)

| Modelo | Campos clave |
|---|---|
| `Cuenta` (extiende `AbstractUser`) | `email` único, `rol` (TextChoices), `documento_identidad` (opcional, único si se llena), `is_active` |
| `IdentidadSocial` | `cuenta` FK, `proveedor` (`google`/`github`/`facebook`), `uid_externo`; único (`proveedor`, `uid_externo`) |
| `CodigoIntercambio` | `codigo` (aleatorio, 32+ bytes urlsafe), `cuenta` FK, `expira` (60 s), `usado` |
| `RegistroAcceso` | `cuenta` FK (nullable), `identificador` intentado, `metodo` (`password`/`google`/`github`/`facebook`/`recuperacion`), `exito`, `ip`, `fecha` |

`RegistroAcceso` guarda intentos exitosos y fallidos; el admin lo consulta en `GET accesos/` y en el admin de Django.

Se instala `rest_framework_simplejwt.token_blacklist`.

### 4.3 Endpoints (`/api/auth/`)

| Método y ruta | Acceso | Descripción |
|---|---|---|
| `POST login/` | público, throttle 5/min por IP | `{usuario, password, captcha_token}` → `{access, refresh, user}` |
| `POST registro/` | público | `{username, email, password, first_name, last_name, documento_identidad, captcha_token}`; siempre crea `ESTUDIANTE`; ignora `rol` |
| `POST refresh/` | público | rota el refresh; el anterior va a lista negra |
| `POST logout/` | autenticado | pone el refresh recibido en lista negra |
| `GET social/<proveedor>/iniciar/` | público | redirige al proveedor con `state` aleatorio en sesión |
| `GET social/<proveedor>/callback/` | público | ver 4.5 |
| `POST social/canjear/` | público | `{code}` → `{access, refresh, user}` |
| `POST password/solicitar/` | público, throttle 3/min | `{email, captcha_token}` → siempre el mismo mensaje |
| `POST password/restablecer/` | público | `{uid, token, password, password2}` |
| `GET me/` | autenticado | cuenta actual |
| `GET/POST cuentas/` | `ADMIN` | listar / crear con rol |
| `PATCH cuentas/<id>/` | `ADMIN` | nombres, correo, rol, `is_active` |
| `POST cuentas/<id>/contrasena/` | `ADMIN` | fija contraseña |
| `GET accesos/` | `ADMIN` | historial de intentos de acceso (paginado) |
| `GET /.well-known/jwks.json` | público | clave pública |
| `GET /salud/` | público | health check de Render |

`GET social/proveedores/` (público) devuelve qué proveedores están configurados, para que el frontend muestre solo esos botones.

Todas las respuestas usan el formato `{success, message, data}` del proyecto.

### 4.4 Claims del access token

`sub` (id de `Cuenta`), `username`, `email`, `first_name`, `last_name`, `rol`, `documento_identidad`, `iss = vinculacion-auth`, `aud = vinculacion-api`, `exp`, `iat`, `jti`.
Vigencia: access 30 min; refresh 1 día con rotación y lista negra.

### 4.5 Flujo de login social

1. `iniciar/`: genera `state`, lo guarda en sesión y redirige a la URL de autorización del proveedor (Authlib).
2. `callback/`: valida `state`; canjea el código del proveedor; obtiene `uid_externo` y correo **verificado**:
   - Google: `email` con `email_verified = true` (OpenID Connect).
   - GitHub: `GET /user/emails` (scope `user:email`) → correo con `verified = true`, preferentemente `primary`.
   - Facebook: Graph API `me?fields=id,name,email` con permiso `email`.
3. Resolución de cuenta: busca `IdentidadSocial(proveedor, uid_externo)`; si no existe, busca `Cuenta` activa con ese correo (sin distinguir mayúsculas) y crea la `IdentidadSocial`; si tampoco existe → redirige a `FRONTEND_URL/login?error=cuenta_no_registrada&proveedor=<p>`.
4. Errores del proveedor o `state` inválido → `FRONTEND_URL/login?error=social_fallido&proveedor=<p>`.
5. Éxito → crea `CodigoIntercambio` y redirige a `FRONTEND_URL/auth/callback?code=<codigo>`. El JWT nunca viaja en la URL.

### 4.6 Login con contraseña

reCAPTCHA (verificación en `https://www.google.com/recaptcha/api/siteverify`) → búsqueda por username o email → `check_password` → cuenta activa → emisión de tokens. Ante cualquier fallo de credenciales, el mismo mensaje: "Usuario o contraseña incorrectos."

### 4.7 Recuperación de contraseña

- `solicitar/`: verifica CAPTCHA; si existe cuenta activa con ese correo, genera `uid` (base64) + token con `PasswordResetTokenGenerator` (`PASSWORD_RESET_TIMEOUT = 1800`) y envía `FRONTEND_URL/restablecer?uid=..&token=..` con el `EmisorCorreo` configurado. La respuesta es idéntica exista o no la cuenta.
- `restablecer/`: valida token, coincidencia de contraseñas y `AUTH_PASSWORD_VALIDATORS`; guarda la contraseña; pone en lista negra todos los refresh tokens pendientes de la cuenta. El token queda inválido automáticamente al cambiar la contraseña.
- Render (plan gratuito) bloquea el tráfico saliente a puertos SMTP, por eso en producción se usa la API HTTP de **Brevo** con un remitente verificado.

### 4.8 Patrones de diseño

| Patrón | Dónde | Para qué |
|---|---|---|
| **Facade** | `AuthFacade` | Única entrada de las vistas: orquesta CAPTCHA, verificación, emisión de tokens y auditoría |
| **Strategy** | `ProveedorIdentidad` (Google, GitHub, Facebook) | Cada proveedor implementa `url_autorizacion()` y `obtener_identidad(code)` → `IdentidadExterna(uid, email, nombre)` |
| **Factory** | `FabricaProveedores.obtener(nombre)` | Devuelve el proveedor configurado o error 404 si no existe o no tiene credenciales |
| **Strategy** | `EmisorCorreo` (`EmisorConsola`, `EmisorBrevo`) | Envío de correo según `EMAIL_EMISOR` |
| **Strategy** | `VerificadorCaptcha` (`RecaptchaV2`, `CaptchaDesactivado`) | El segundo solo se permite con `DEBUG=True` o en tests |

### 4.9 Datos iniciales

Comando `sembrar_cuentas`: crea (si no existen) `admin`, `coordinador`, `docente` y `estudiante`, una por rol, con correos y contraseñas de variables de entorno (`SEED_<ROL>_EMAIL`, `SEED_<ROL>_PASSWORD`) y valores por defecto documentados para local. El correo de `admin` debe coincidir con el admin actual del sistema principal para que se enlacen.

## 5. Cambios en el sistema principal

- **Nueva autenticación** `usuarios/autenticacion.py` → `AuthServiceJWTAuthentication` (subclase de `JWTAuthentication` de SimpleJWT): valida RS256 con `AUTH_PUBLIC_KEY`, `iss` y `aud`. Configura `SIMPLE_JWT` con `ALGORITHM='RS256'`, `VERIFYING_KEY`, `AUDIENCE`, `ISSUER`, `USER_ID_CLAIM='sub'`.
- **Sincronización** `usuarios/sincronizacion.py` → `SincronizadorUsuario.desde_claims(claims)`:
  1. Busca `Usuario` por `auth_uid`.
  2. Si no hay, busca por `user.email` o `user.username` y lo enlaza (caso del `admin` actual).
  3. Si no hay, crea `User` (contraseña inutilizable) + `Usuario` con `codigo = USR-<auth_uid>` y `documento_identidad` del claim (o `PEND-<auth_uid>` si viene vacío).
  4. Actualiza nombres, correo y `rol` si cambiaron. Para no escribir en cada petición, solo guarda si hay diferencias.
- **Modelo**: `Usuario.auth_uid` (`CharField`, único, nullable) + migración.
- **Se eliminan**: `LoginAPIView`, `RegisterAPIView`, `TokenRefreshAPIView`, la acción `cambiar_contrasena`, sus URLs y `RegisterSerializer`/`LoginSerializer`.
- `UsuarioViewSet`: deja de crear usuarios; edita solo datos de perfil (carrera, teléfono, dirección, cargo, biografía, fecha de nacimiento). `rol` pasa a solo lectura. Nueva acción admin `POST usuarios/sincronizar/` que recibe datos de la cuenta recién creada en `auth-service` (`auth_uid`, username, email, nombres, rol, documento) más datos de perfil y hace el upsert, para que el admin pueda completar el perfil sin esperar el primer login.
- La auditoría de inicios de sesión se traslada a `auth-service` (`RegistroAcceso`, ver 4.2). El sistema principal conserva su auditoría de negocio (proyectos, convenios, etc.) sin cambios.
- `core/permissions.py` y el resto de módulos **no cambian**.

## 6. Frontend

- Configuración: `VITE_AUTH_URL`, `VITE_RECAPTCHA_SITE_KEY`; nuevo `authClient` (axios) hacia `auth-service`; el `client` actual sigue hacia la API principal.
- `LoginPage` renovada (misma línea visual: pantalla dividida, navy + azul):
  - "Usuario o correo", contraseña con mostrar/ocultar, reCAPTCHA v2, botón deshabilitado hasta resolver el CAPTCHA.
  - "o continúa con" + botones Google, GitHub, Facebook (solo los configurados, según `social/proveedores/`).
  - Errores dentro del formulario: credenciales, demasiados intentos, CAPTCHA vencido, `cuenta_no_registrada`, `social_fallido`.
  - "¿Olvidaste tu contraseña?" → `/recuperar`.
  - Panel izquierdo con los cuatro roles y una línea de lo que puede hacer cada uno.
- Nuevas páginas: `/auth/callback`, `/recuperar`, `/restablecer`.
- `RegisterPage`: agrega CAPTCHA y quita la elección de rol.
- Sesión: refresh automático y logout contra `auth-service`; logout llama a `POST logout/` antes de limpiar el estado.
- `UsuariosListPage`: crear cuenta, cambiar rol, activar/desactivar y cambiar contraseña contra `auth-service`; tras crear, llama a `usuarios/sincronizar/` en la API principal con los datos de perfil. Si ese segundo paso falla, el perfil se crea igualmente en el primer login.

## 7. Errores y seguridad

- Mensajes genéricos en login y recuperación (no revelar cuentas existentes).
- Throttling de DRF en login (5/min) y solicitud de recuperación (3/min).
- `state` OAuth en sesión con cookie `SameSite=Lax`, `Secure` en producción.
- `CodigoIntercambio` de un solo uso, 60 s.
- CORS de `auth-service` limitado a `FRONTEND_URL`; en local, `localhost:5173`.
- Ningún secreto en el repositorio: `.env.example` con nombres de variables y claves de prueba públicas de reCAPTCHA para local.
- Cuentas desactivadas: `auth-service` no emite tokens; el sistema principal rechaza tokens cuyo `Usuario` local esté inactivo.

## 8. Pruebas

**auth-service** (Django `TestCase`, proveedores y reCAPTCHA simulados):
- Login correcto, contraseña incorrecta, usuario inexistente (mismo mensaje), cuenta inactiva, CAPTCHA inválido, throttling.
- Registro ignora `rol` y crea `ESTUDIANTE`.
- Refresh rota y el anterior queda inválido; logout invalida.
- Endpoints de `cuentas/` prohibidos para no admin.
- Social: vincula por correo existente; reutiliza `IdentidadSocial`; rechaza correo desconocido; rechaza correo no verificado; rechaza `state` alterado; código de intercambio de un solo uso y vencido.
- Recuperación: respuesta idéntica con y sin cuenta; token válido cambia la contraseña; token reutilizado o vencido falla; sesiones previas invalidadas.
- JWKS expone la clave pública que verifica los tokens emitidos.

**Sistema principal:**
- Token válido crea `Usuario`; enlaza al `admin` existente por correo; actualiza rol.
- Token con firma, `iss` o `aud` incorrectos → 401.
- `usuarios/sincronizar/` solo admin.
- Se adaptan los tests existentes de `usuarios/tests.py` que usaban el login anterior (generando tokens RS256 de prueba).

**Frontend:** `npm run build` sin errores; lista de comprobación manual en `auth_service/README.md` (un login por rol, cada proveedor social, CAPTCHA, recuperación, logout).

## 9. Despliegue (Render)

- `render.yaml`: servicio `vinculacion-auth` (rootDir `auth_service`, `gunicorn`, migraciones y `sembrar_cuentas` en build) + base `auth-db`.
- Variables de `auth-service`: `SECRET_KEY`, `DATABASE_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `FRONTEND_URL`, `RECAPTCHA_SECRET_KEY`, `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`, `FACEBOOK_CLIENT_ID/SECRET`, `EMAIL_EMISOR=brevo`, `BREVO_API_KEY`, `EMAIL_REMITENTE`, `SEED_*`.
- Variables nuevas del sistema principal: `AUTH_PUBLIC_KEY`, `AUTH_ISSUER`, `AUTH_AUDIENCE`.
- Variables del frontend (Vercel): `VITE_AUTH_URL`, `VITE_RECAPTCHA_SITE_KEY`.
- URLs de callback a registrar: `https://<auth>.onrender.com/api/auth/social/{google|github|facebook}/callback/` y su equivalente `http://localhost:8001/...` en local.
- Script `generar_claves` (comando de management) para crear el par RSA.
- Notas para la defensa: despertar los servicios antes de presentar (Render gratuito suspende por inactividad); en Facebook modo desarrollo, agregar como testers las cuentas que se usarán.

## 10. Documentación entregable

- `auth_service/README.md`: arquitectura, cómo correr en local (puerto 8001), guía paso a paso para crear credenciales de reCAPTCHA, Google, GitHub, Facebook y Brevo, despliegue en Render, lista de comprobación de la demo.
- Diagrama de arquitectura y de secuencia del login social en `docs/arquitectura/`.
