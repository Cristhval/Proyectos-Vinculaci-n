# Módulo de Acceso (auth-service) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sacar el login del monolito a un servicio Django independiente (`auth_service/`) que emite JWT RS256 con rol, verifica reCAPTCHA v2, autentica con Google/GitHub/Facebook, recupera contraseñas, y que el sistema principal y el frontend consumen por HTTP.

**Architecture:** `auth_service/` es un proyecto Django aparte (DB propia, puerto 8001 en local) con una app `cuentas`; sus vistas son delgadas y delegan en `AuthFacade`. El sistema principal valida tokens con `AUTH_PUBLIC_KEY` (sin llamar al servicio) y sincroniza una copia local `Usuario`. El frontend usa un segundo cliente axios hacia `VITE_AUTH_URL`.

**Tech Stack:** Python 3.13, Django 6.0, DRF 3.17, djangorestframework-simplejwt 5.5 (RS256 + token_blacklist), cryptography, Authlib (cliente OAuth con `requests`), requests, django-environ, gunicorn; React 19 + TS + Vite 6, `react-google-recaptcha`.

**Spec:** `docs/superpowers/specs/2026-11-03-modulo-autenticacion-design.md`

## Global Constraints

- Idioma de código de dominio, mensajes y commits: español; respuestas JSON con `{success, message, data}` (mismo helper que `core/utils.api_response`, copiado en `auth_service/cuentas/respuestas.py`).
- Indentación: tabs en Python (igual que el repo).
- Claims: `sub`, `username`, `email`, `first_name`, `last_name`, `rol`, `documento_identidad`, `iss='vinculacion-auth'`, `aud='vinculacion-api'`. Access 30 min, refresh 1 día, `ROTATE_REFRESH_TOKENS=True`, `BLACKLIST_AFTER_ROTATION=True`.
- Roles: `ADMIN`, `COORDINADOR`, `DOCENTE`, `ESTUDIANTE`, `DIRECTIVO`.
- Throttles: login `5/min`, `password/solicitar` `3/min` (por IP).
- `CodigoIntercambio` vive 60 s y es de un solo uso. `PASSWORD_RESET_TIMEOUT = 1800`.
- Mensaje único de credenciales: `"Usuario o contraseña incorrectos."`. Mensaje único de recuperación: `"Si el correo está registrado, te llegará un enlace para restablecer tu contraseña."`.
- Errores sociales redirigen a `FRONTEND_URL/login?error=<cuenta_no_registrada|social_fallido>&proveedor=<p>`; éxito a `FRONTEND_URL/auth/callback?code=<c>`.
- Ningún secreto en el repo. `CaptchaDesactivado` solo si `DEBUG=True` o en tests (`RECAPTCHA_SECRET_KEY` vacío).
- Patrones obligatorios: Facade (`AuthFacade`), Strategy (`ProveedorIdentidad`, `EmisorCorreo`, `VerificadorCaptcha`), Factory (`FabricaProveedores`).
- `auth_service` no importa nada de los apps del monolito y viceversa.

## Review Focus

1. Correos con mayúsculas o espacios (`Admin@UNL.edu.ec `) en login, social y recuperación → deben encontrar la misma cuenta (normalizar `strip().lower()`). Test en Task 2 y Task 5.
2. Cuenta desactivada que ya tiene refresh token válido → `refresh/` debe rechazarla (SimpleJWT no lo hace solo si la cuenta se desactiva después). Test en Task 3.
3. Proveedor social sin credenciales configuradas al que se llama por URL directa → 404 limpio, no excepción. Test en Task 5.
4. El sistema principal recibe un token de un usuario cuyo `Usuario` local está `activo=False` → 401 aunque el token sea válido. Test en Task 7.
5. Dos usuarios nuevos sin `documento_identidad` creados por sincronización → no deben chocar en la restricción única (usar `PEND-<auth_uid>`). Test en Task 7.

---

### Task 1: Esqueleto de auth-service, modelo `Cuenta`, emisión de tokens RS256 y JWKS

**Files:**
- Create: `auth_service/manage.py`, `auth_service/requirements.txt`, `auth_service/.env.example`
- Create: `auth_service/auth_project/{__init__,settings,urls,wsgi}.py`
- Create: `auth_service/cuentas/{__init__,apps,models,admin,respuestas,urls,views}.py`
- Create: `auth_service/cuentas/servicios/{__init__,tokens}.py`
- Create: `auth_service/cuentas/management/commands/generar_claves.py`
- Create: `auth_service/cuentas/tests/{__init__,utils,test_tokens}.py`

**Interfaces:**
- Produces:
  - `cuentas.models.Rol(TextChoices)`; `Cuenta(AbstractUser)` con `email` único, `rol` (default `ESTUDIANTE`), `documento_identidad` (`CharField(20, null=True, blank=True, unique=True)`). `AUTH_USER_MODEL='cuentas.Cuenta'`.
  - `cuentas.respuestas.api_response(success: bool, message: str, data=None, http_status=200) -> Response`
  - `cuentas.servicios.tokens.EmisorTokens.emitir(cuenta: Cuenta) -> dict` → `{'access': str, 'refresh': str, 'user': dict}`; `EmisorTokens.datos_usuario(cuenta) -> dict` con `id, username, email, first_name, last_name, rol, documento_identidad`.
  - `cuentas.servicios.tokens.jwks() -> dict` (formato RFC 7517, `kid` = primeros 16 hex del SHA-256 de la clave pública DER).
  - Settings: `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY` (PEM desde env; si faltan y `DEBUG`, se generan en memoria al arrancar y se avisa en log), `FRONTEND_URL`, `SIMPLE_JWT` con `ALGORITHM='RS256'`, `SIGNING_KEY`, `VERIFYING_KEY`, `AUDIENCE`, `ISSUER`, `USER_ID_CLAIM='sub'`, `TOKEN_OBTAIN_SERIALIZER` no usado.
  - `cuentas.tests.utils.crear_cuenta(username='u', password='Clave.Segura1', rol='ESTUDIANTE', email=None, **kw) -> Cuenta`
  - URLs: `GET /.well-known/jwks.json`, `GET /salud/`.

- [ ] **Step 1: Crear proyecto y requirements**
  `requirements.txt`: `Django>=6.0.4,<6.1`, `djangorestframework>=3.17.1,<4`, `djangorestframework_simplejwt[crypto]>=5.5.1,<6`, `django-cors-headers>=4.3,<5`, `django-environ>=0.11,<1`, `Authlib>=1.3,<2`, `requests>=2.32,<3`, `gunicorn>=23,<24`, `psycopg2-binary>=2.9,<3`. Settings con `DATABASE_URL` (default sqlite `auth.sqlite3`), apps `rest_framework`, `rest_framework_simplejwt.token_blacklist`, `corsheaders`, `cuentas`; `CORS_ALLOWED_ORIGINS=[FRONTEND_URL]`; `LANGUAGE_CODE='es-ec'`, `TIME_ZONE='America/Guayaquil'`.

- [ ] **Step 2: Test que falla** — `test_tokens.py`:

```python
def test_access_contiene_claims_y_verifica_con_jwks(self):
	cuenta = crear_cuenta(username='doc', rol='DOCENTE', email='doc@unl.edu.ec')
	tokens = EmisorTokens.emitir(cuenta)
	jwk = self.client.get('/.well-known/jwks.json').json()['keys'][0]
	clave = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))
	claims = jwt.decode(tokens['access'], clave, algorithms=['RS256'], audience='vinculacion-api', issuer='vinculacion-auth')
	assert claims['sub'] == str(cuenta.id) and claims['rol'] == 'DOCENTE' and claims['email'] == 'doc@unl.edu.ec'
	assert tokens['user']['rol'] == 'DOCENTE'

def test_salud(self):
	assert self.client.get('/salud/').json()['success'] is True
```

- [ ] **Step 3: Verificar fallo** — `cd auth_service && python manage.py test cuentas.tests.test_tokens` → FAIL (import error).
- [ ] **Step 4: Implementar** `Cuenta`, `EmisorTokens` (usa `RefreshToken.for_user` y agrega los claims extra al refresh y al access), `jwks()`, vistas `jwks_view`, `salud_view`, comando `generar_claves` (imprime par RSA 2048 en PEM con `\n` escapados listo para `.env`). `makemigrations cuentas`.
- [ ] **Step 5: Verificar** — mismo comando → PASS.
- [ ] **Step 6: Commit** — `feat(auth): esqueleto de auth-service con tokens RS256 y JWKS`

### Task 2: Login con contraseña (Facade + CAPTCHA + auditoría + throttle)

**Files:**
- Create: `auth_service/cuentas/servicios/{captcha,fachada}.py`, `auth_service/cuentas/serializers.py`, `auth_service/cuentas/tests/test_login.py`
- Modify: `auth_service/cuentas/models.py` (+`RegistroAcceso`), `views.py`, `urls.py`, `settings.py` (throttle rates `login: 5/min`, `recuperacion: 3/min`)

**Interfaces:**
- Consumes: `EmisorTokens.emitir`, `api_response`.
- Produces:
  - `RegistroAcceso(cuenta FK null, identificador CharField(150), metodo CharField choices password/google/github/facebook/recuperacion, exito Bool, ip GenericIPAddressField null, fecha auto_now_add)`.
  - `servicios.captcha.VerificadorCaptcha` (abstracta `verificar(token: str, ip: str|None) -> bool`), `RecaptchaV2(secret)`, `CaptchaDesactivado`, `obtener_verificador() -> VerificadorCaptcha` (lee `RECAPTCHA_SECRET_KEY`; vacío → `CaptchaDesactivado` solo si `DEBUG` o `settings.TESTING`, si no `ImproperlyConfigured`).
  - `servicios.fachada.AuthError(Exception)` con `codigo: str`, `mensaje: str`, `http_status: int`.
  - `AuthFacade.login(identificador: str, password: str, captcha_token: str, ip: str|None) -> dict` (devuelve `EmisorTokens.emitir`); lanza `AuthError('captcha_invalido', 'Verificación reCAPTCHA inválida o vencida.', 400)` o `AuthError('credenciales', <mensaje único>, 401)`.
  - `AuthFacade.registrar_acceso(cuenta, identificador, metodo, exito, ip) -> None`.
  - `POST /api/auth/login/` body `{usuario, password, captcha_token}`.

- [ ] **Step 1: Tests que fallan** — `test_login.py` (parchea `cuentas.servicios.captcha.obtener_verificador`):
  - `test_login_correcto_por_username` → 200, `data.access`, `data.user.rol == 'ADMIN'`; existe `RegistroAcceso(exito=True, metodo='password')`.
  - `test_login_por_correo_normaliza` → usuario `'  Admin@UNL.edu.ec '` encuentra cuenta `admin@unl.edu.ec` → 200.
  - `test_password_incorrecta_y_usuario_inexistente_mismo_mensaje` → ambos 401 con `message == "Usuario o contraseña incorrectos."`; `RegistroAcceso(exito=False)` ×2.
  - `test_cuenta_inactiva` → 401 mismo mensaje.
  - `test_captcha_invalido` → verificador devuelve False → 400, `message` contiene `reCAPTCHA`; no se evalúa la contraseña.
  - `test_throttle` → 6.º intento en el mismo minuto → 429 (limpiar `cache` en `setUp`).
- [ ] **Step 2: Verificar fallo** — `python manage.py test cuentas.tests.test_login` → FAIL.
- [ ] **Step 3: Implementar** `RegistroAcceso` + migración, `captcha.py` (`RecaptchaV2` hace `requests.post('https://www.google.com/recaptcha/api/siteverify', data={secret, response, remoteip}, timeout=5)` y devuelve `json()['success']`; excepción de red → False), `AuthFacade.login`, `LoginSerializer`, `LoginView` con `ScopedRateThrottle` scope `login` que traduce `AuthError` a `api_response(False, ...)`.
- [ ] **Step 4: Verificar** → PASS.
- [ ] **Step 5: Commit** — `feat(auth): login con reCAPTCHA, auditoria de accesos y limite de intentos`

### Task 3: Registro, refresh, logout y `me`

**Files:**
- Modify: `auth_service/cuentas/{serializers,views,urls}.py`, `servicios/fachada.py`
- Create: `auth_service/cuentas/tests/test_sesion.py`

**Interfaces:**
- Produces:
  - `AuthFacade.registrar(datos: dict, captcha_token: str, ip) -> Cuenta` (fuerza `rol=ESTUDIANTE`, valida `AUTH_PASSWORD_VALIDATORS`, email único normalizado).
  - `AuthFacade.refrescar(refresh: str) -> dict` → `{'access', 'refresh'}`; `AuthError('sesion_invalida', 'Sesión inválida o expirada.', 401)` si token inválido, en lista negra o cuenta inactiva.
  - `AuthFacade.cerrar_sesion(refresh: str) -> None` (blacklist; token inválido se ignora).
  - Rutas: `POST registro/`, `POST refresh/`, `POST logout/` (IsAuthenticated), `GET me/`.

- [ ] **Step 1: Tests que fallan**
  - `test_registro_ignora_rol` → POST con `rol='ADMIN'` → 201, `Cuenta.rol == 'ESTUDIANTE'`.
  - `test_registro_email_duplicado` → 400.
  - `test_registro_password_debil` → `'123'` → 400.
  - `test_refresh_rota_y_el_anterior_no_sirve` → primer refresh 200 con `refresh` nuevo; reutilizar el viejo → 401.
  - `test_refresh_cuenta_desactivada` → desactivar cuenta tras login → 401.
  - `test_logout_invalida_refresh` → logout 200; refresh con ese token → 401.
  - `test_me` → 200 con `data.username`.
- [ ] **Step 2: Verificar fallo.**
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Verificar** → PASS, y `python manage.py test` completo en verde.
- [ ] **Step 5: Commit** — `feat(auth): registro como estudiante, refresh con rotacion y logout real`

### Task 4: Gestión de cuentas (admin), historial de accesos y `sembrar_cuentas`

**Files:**
- Create: `auth_service/cuentas/permissions.py`, `management/commands/sembrar_cuentas.py`, `tests/test_admin.py`
- Modify: `serializers.py`, `views.py`, `urls.py`, `admin.py`

**Interfaces:**
- Produces:
  - `permissions.EsAdmin` (rol `ADMIN` del `request.user`).
  - `CuentaViewSet` (list/create/retrieve/partial_update; sin destroy) en `cuentas/`; create acepta `rol` y `password`; `partial_update` acepta `first_name, last_name, email, rol, is_active, documento_identidad`; acción `POST cuentas/<id>/contrasena/` `{password, password2}`. Filtros `?rol=`, `?search=`. Paginación de 10.
  - `GET accesos/` (ListAPIView, `EsAdmin`, orden `-fecha`).
  - Comando `sembrar_cuentas`: crea si no existen `admin/coordinador/docente/estudiante` con `SEED_<ROL>_EMAIL` (default `<rol>@unl.edu.ec`) y `SEED_<ROL>_PASSWORD` (default `Vinculacion.2026`), idempotente.

- [ ] **Step 1: Tests que fallan**
  - `test_no_admin_recibe_403` en list, create y contrasena (token de DOCENTE).
  - `test_admin_crea_cuenta_con_rol` → 201, rol `COORDINADOR`.
  - `test_admin_cambia_rol_y_desactiva` → PATCH → reflejado en DB.
  - `test_admin_fija_contrasena` → luego login con la nueva → 200.
  - `test_accesos_lista_intentos` → tras un login fallido, `accesos/` devuelve 1+ con `exito=False`.
  - `test_sembrar_cuentas_idempotente` → `call_command` dos veces → 4 cuentas, una por rol.
- [ ] **Step 2: Verificar fallo.**
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Verificar** → PASS.
- [ ] **Step 5: Commit** — `feat(auth): gestion de cuentas por admin, historial de accesos y semilla por rol`

### Task 5: Login social (Strategy + Factory) con Google, GitHub y Facebook

**Files:**
- Create: `auth_service/cuentas/servicios/proveedores.py`, `tests/test_social.py`
- Modify: `models.py` (+`IdentidadSocial`, `CodigoIntercambio`), `servicios/fachada.py`, `views.py`, `urls.py`, `settings.py` (`GOOGLE_/GITHUB_/FACEBOOK_CLIENT_ID/SECRET`, `AUTH_SERVICE_URL` para armar `redirect_uri`, sesión con `SESSION_COOKIE_SAMESITE='Lax'`, `SESSION_COOKIE_SECURE=not DEBUG`)

**Interfaces:**
- Produces:
  - `IdentidadSocial(cuenta FK, proveedor, uid_externo)`, `unique_together=('proveedor','uid_externo')`.
  - `CodigoIntercambio(codigo CharField(64) unique, cuenta FK, expira DateTime, usado Bool)`.
  - `proveedores.IdentidadExterna` (dataclass: `uid: str`, `email: str|None`, `email_verificado: bool`, `nombre: str`).
  - `ProveedorIdentidad` (abstracta): `nombre: str`; `configurado() -> bool`; `url_autorizacion(state: str, redirect_uri: str) -> str`; `obtener_identidad(code: str, redirect_uri: str) -> IdentidadExterna`.
  - `ProveedorGoogle` (scopes `openid email profile`, usa `email_verified`), `ProveedorGitHub` (scope `user:email`, `GET https://api.github.com/user` + `/user/emails`, toma el `verified` y `primary`), `ProveedorFacebook` (scope `email`, Graph `v19.0/me?fields=id,name,email`; email de Facebook se considera verificado). Todos con `authlib.integrations.requests_client.OAuth2Session`.
  - `FabricaProveedores.obtener(nombre: str) -> ProveedorIdentidad` (lanza `Http404` si no existe o no `configurado()`); `FabricaProveedores.configurados() -> list[str]`.
  - `AuthFacade.resolver_social(proveedor: str, identidad: IdentidadExterna, ip) -> Cuenta` (lanza `AuthError('cuenta_no_registrada', ..., 403)`; email no verificado o ausente → mismo error).
  - `AuthFacade.crear_codigo(cuenta) -> str`; `AuthFacade.canjear_codigo(codigo: str) -> dict` (`AuthError('codigo_invalido', ..., 400)` si usado o vencido).
  - Rutas: `GET social/proveedores/` → `data: ['google', ...]`; `GET social/<p>/iniciar/`; `GET social/<p>/callback/`; `POST social/canjear/`.

- [ ] **Step 1: Tests que fallan** (parchear `FabricaProveedores.obtener` con un proveedor falso):
  - `test_iniciar_redirige_y_guarda_state` → 302 a la URL del falso; `session['oauth_state_google']` existe.
  - `test_callback_vincula_por_correo_existente` → cuenta `docente@unl.edu.ec`; identidad con `'Docente@UNL.edu.ec'` verificado → 302 a `FRONTEND_URL/auth/callback?code=`; se crea `IdentidadSocial`.
  - `test_callback_reutiliza_identidad` → segunda vez con email distinto pero mismo uid → misma cuenta.
  - `test_callback_correo_desconocido` → 302 a `.../login?error=cuenta_no_registrada&proveedor=github`; `RegistroAcceso(exito=False, metodo='github')`.
  - `test_callback_correo_no_verificado` → mismo error.
  - `test_callback_state_alterado` → `?state=otro` → `error=social_fallido`.
  - `test_proveedor_no_configurado_404` → sin `GITHUB_CLIENT_ID` → `social/github/iniciar/` 404; `social/proveedores/` no lo lista.
  - `test_canjear_codigo_una_vez` → 200 con tokens; segundo canje 400.
  - `test_canjear_codigo_vencido` → `expira` en el pasado → 400.
- [ ] **Step 2: Verificar fallo.**
- [ ] **Step 3: Implementar.** `callback` atrapa cualquier excepción del proveedor → `social_fallido` (y la registra en log). `state` = `secrets.token_urlsafe(32)` y se elimina de sesión al usarse.
- [ ] **Step 4: Verificar** → PASS.
- [ ] **Step 5: Commit** — `feat(auth): login social con Google, GitHub y Facebook (strategy + factory)`

### Task 6: Recuperación de contraseña y envío de correo (Strategy)

**Files:**
- Create: `auth_service/cuentas/servicios/{correo,recuperacion}.py`, `tests/test_recuperacion.py`
- Modify: `views.py`, `urls.py`, `settings.py` (`EMAIL_EMISOR` = `consola|brevo`, `BREVO_API_KEY`, `EMAIL_REMITENTE`, `EMAIL_REMITENTE_NOMBRE='Vinculación UNL'`, `PASSWORD_RESET_TIMEOUT=1800`)

**Interfaces:**
- Produces:
  - `correo.EmisorCorreo` (abstracta `enviar(destino: str, asunto: str, html: str) -> None`), `EmisorConsola` (log `INFO` con el HTML), `EmisorBrevo` (`POST https://api.brevo.com/v3/smtp/email`, header `api-key`, body `{sender:{email,name}, to:[{email}], subject, htmlContent}`), `obtener_emisor() -> EmisorCorreo`.
  - `recuperacion.ServicioRecuperacion.solicitar(email: str, captcha_token: str, ip) -> None` (no lanza si no existe la cuenta; sí lanza `AuthError` de captcha); `ServicioRecuperacion.restablecer(uid: str, token: str, password: str, password2: str) -> None` (`AuthError('enlace_invalido', 'El enlace no es válido o ya expiró.', 400)`; contraseñas distintas o débiles → 400; blacklist de todos los `OutstandingToken` de la cuenta).
  - Rutas: `POST password/solicitar/` (throttle `recuperacion`), `POST password/restablecer/`.

- [ ] **Step 1: Tests que fallan** (`EMAIL_EMISOR='consola'`, parchear `obtener_emisor` con un doble que guarda envíos):
  - `test_solicitar_misma_respuesta_exista_o_no` → ambos 200 con el mensaje único; solo 1 envío; el HTML contiene `FRONTEND_URL/restablecer?uid=`.
  - `test_restablecer_cambia_password_y_cierra_sesiones` → refresh previo queda inválido; login con nueva → 200.
  - `test_token_reutilizado_falla` → segundo uso del mismo enlace → 400.
  - `test_token_vencido` → `override_settings(PASSWORD_RESET_TIMEOUT=0)` y avanzar tiempo → 400.
  - `test_passwords_no_coinciden` → 400.
- [ ] **Step 2: Verificar fallo.**
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Verificar** → PASS; suite completa de `auth_service` en verde.
- [ ] **Step 5: Commit** — `feat(auth): recuperacion de contrasena con enlace temporal y envio por Brevo`

### Task 7: Sistema principal valida RS256 y sincroniza usuarios

**Files:**
- Create: `usuarios/autenticacion.py`, `usuarios/sincronizacion.py`, `usuarios/tests_utils.py`, `usuarios/tests_auth_service.py`
- Create: `usuarios/migrations/00XX_usuario_auth_uid.py`
- Modify: `usuarios/models.py` (+`auth_uid = CharField(64, null=True, blank=True, unique=True)`), `usuarios/views.py`, `usuarios/urls.py`, `usuarios/serializers.py`, `proyecto_vinculacion_universidad/settings.py`, `usuarios/tests.py`, `requirements.txt` (`djangorestframework_simplejwt[crypto]`), `.env.example` si existe

**Interfaces:**
- Produces:
  - Settings: `AUTH_PUBLIC_KEY` (env, PEM), `SIMPLE_JWT = {'ALGORITHM': 'RS256', 'VERIFYING_KEY': AUTH_PUBLIC_KEY, 'SIGNING_KEY': None, 'AUDIENCE': env('AUTH_AUDIENCE', default='vinculacion-api'), 'ISSUER': env('AUTH_ISSUER', default='vinculacion-auth'), 'USER_ID_CLAIM': 'sub'}`; `DEFAULT_AUTHENTICATION_CLASSES = ('usuarios.autenticacion.AuthServiceJWTAuthentication',)`.
  - `AuthServiceJWTAuthentication(JWTAuthentication).get_user(validated_token) -> User` → delega en `SincronizadorUsuario.desde_claims(dict(validated_token.payload))`; si `perfil.activo` es False → `AuthenticationFailed('Usuario inactivo')`.
  - `SincronizadorUsuario.desde_claims(claims: dict) -> User` (orden: `auth_uid` → `email` iexact o `username` → crear; `codigo=f'USR-{sub}'` si es nuevo, `documento_identidad = claims.get('documento_identidad') or f'PEND-{sub}'`; guarda solo si hay cambios).
  - `UsuarioViewSet`: sin `create`, sin `cambiar_contrasena`; `rol` read-only en `UsuarioSerializer`; acción `POST usuarios/sincronizar/` (IsAdmin) que acepta claims (`sub`, `username`, `email`, `first_name`, `last_name`, `rol`, `documento_identidad`) + perfil (`carrera_id`, `telefono`, `direccion`, `cargo`) y responde el `Usuario` serializado.
  - `usuarios.tests_utils.token_para(usuario_o_claims, **extra) -> str` firma con una clave RSA de prueba fija; `@override_settings` de `SIMPLE_JWT` con su pública vía `usuarios.tests_utils.SIMPLE_JWT_TEST`.

- [ ] **Step 1: Tests que fallan** — `tests_auth_service.py`:
  - `test_token_valido_crea_usuario` → `GET /api/v1/usuarios/me/` 200 y `Usuario(auth_uid='7', rol='DOCENTE')` creado.
  - `test_enlaza_admin_existente_por_correo` → `User(username='admin', email='admin@unl.edu.ec')` previo; token con otro username y ese email → no se crea otro `User`; `perfil.auth_uid == sub`.
  - `test_actualiza_rol` → segundo token con `rol='COORDINADOR'` → perfil actualizado.
  - `test_dos_usuarios_sin_documento_no_chocan` → `PEND-1` y `PEND-2`.
  - `test_firma_aud_iss_incorrectos_401` → tres casos.
  - `test_usuario_inactivo_401`.
  - `test_sincronizar_solo_admin` → DOCENTE 403; ADMIN 200 y aplica `telefono`.
  - `test_endpoints_viejos_eliminados` → `POST /api/v1/auth/login/` → 404.
- [ ] **Step 2: Verificar fallo** — `python manage.py test usuarios.tests_auth_service` → FAIL.
- [ ] **Step 3: Implementar** y eliminar `LoginAPIView`, `RegisterAPIView`, `TokenRefreshAPIView`, `LoginSerializer`, `LoginResponseSerializer`, `RegisterSerializer`, `cambiar_contrasena` y sus rutas. Migración `auth_uid`.
- [ ] **Step 4: Adaptar `usuarios/tests.py`** — reemplazar cada `self.client.post('/api/v1/auth/login/'...)` por `self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_para(self.perfil)}')`; borrar `AuthTestCase` (cubierto en auth-service); clase con `@override_settings(SIMPLE_JWT=SIMPLE_JWT_TEST)`.
- [ ] **Step 5: Verificar** — `python manage.py test` (todo el monolito) → PASS.
- [ ] **Step 6: Commit** — `feat(usuarios): validar JWT RS256 de auth-service y sincronizar perfiles`

### Task 8: Frontend — cliente de auth-service y sesión

**Files:**
- Create: `frontend/src/api/authClient.ts`
- Modify: `frontend/src/config/api.ts`, `frontend/src/api/auth.ts`, `frontend/src/api/client.ts`, `frontend/src/hooks/useAuth.ts`, `frontend/src/types/auth.ts`, `frontend/src/vite-env.d.ts`, `frontend/.env.example`

**Interfaces:**
- Produces:
  - `AUTH_BASE = import.meta.env.VITE_AUTH_URL || 'http://localhost:8001/api/auth'`; `RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'` (clave pública de prueba de Google).
  - `API.AUTH = { LOGIN: '/login/', REGISTRO: '/registro/', REFRESH: '/refresh/', LOGOUT: '/logout/', ME: '/me/', PROVEEDORES: '/social/proveedores/', SOCIAL_INICIAR: (p) => `${AUTH_BASE}/social/${p}/iniciar/`, CANJEAR: '/social/canjear/', SOLICITAR: '/password/solicitar/', RESTABLECER: '/password/restablecer/', CUENTAS: '/cuentas/', CUENTA: (id) => ..., CUENTA_CONTRASENA: (id) => ..., ACCESOS: '/accesos/' }`.
  - `authApi`: `login({usuario, password, captcha_token})`, `registro(data & {captcha_token})`, `refresh(refresh)`, `logout(refresh)`, `proveedores()`, `canjear(code)`, `solicitarRecuperacion(email, captcha_token)`, `restablecer({uid, token, password, password2})`.
  - `useAuth()` → `{ login, loginConTokens(payload: LoginResponse), logout, user, isAuthenticated }`; `logout` llama `authApi.logout` (ignora errores) antes de limpiar.
  - `LoginRequest = { usuario: string; password: string; captcha_token: string }`.
- [ ] **Step 1:** Implementar `authClient` (axios a `AUTH_BASE` con el mismo interceptor de `Authorization`) y mover el refresh de `client.ts` a `authApi.refresh` guardando también el nuevo `refresh` (rotación).
- [ ] **Step 2:** Actualizar `useAuth`; mapear 401 → "Usuario o contraseña incorrectos.", 429 → "Demasiados intentos. Espera un minuto.", 400 con `reCAPTCHA` → mensaje del servidor. Devolver el mensaje para mostrarlo en el formulario (no solo toast).
- [ ] **Step 3:** Ajustar mínimamente `LoginPage` y `RegisterPage` a la nueva firma (campo `usuario`, `captcha_token: ''` provisional) para que el proyecto compile; el rediseño va en Task 9.
- [ ] **Step 4: Verificar** — `cd frontend && npm ci && npx tsc -b` → sin errores.
- [ ] **Step 5: Commit** — `feat(frontend): cliente de auth-service con refresh rotativo y logout en servidor`

### Task 9: Frontend — login renovado, callback social, recuperación y registro

**Files:**
- Create: `frontend/src/features/auth/components/{CaptchaField,BotonesSociales,PanelRoles}.tsx`, `frontend/src/features/auth/{AuthCallbackPage,RecuperarPage,RestablecerPage}.tsx`
- Modify: `frontend/src/features/auth/LoginPage.tsx`, `RegisterPage.tsx`, `frontend/src/routes/index.tsx`, `frontend/package.json` (`react-google-recaptcha`, `@types/react-google-recaptcha`)

**Interfaces:**
- Consumes: `authApi`, `useAuth().loginConTokens`, `RECAPTCHA_SITE_KEY`, `API.AUTH.SOCIAL_INICIAR`.
- Produces: rutas públicas `/auth/callback`, `/recuperar`, `/restablecer`; `CaptchaField({ onChange: (token: string|null) => void, ref })` con `reset()`.
- Copy fija:
  - `cuenta_no_registrada` → "Tu cuenta de {Proveedor} no está registrada en el sistema. Pide al administrador que te dé de alta."
  - `social_fallido` → "No se pudo completar el inicio de sesión con {Proveedor}. Inténtalo de nuevo."
  - Callback: "Verificando tu cuenta…"
  - Panel de roles: Administrador — "Gestiona usuarios, roles y la auditoría del sistema."; Coordinador — "Revisa y aprueba proyectos y convenios."; Docente — "Crea proyectos y registra su seguimiento."; Estudiante — "Consulta sus proyectos y reporta avances."
- [ ] **Step 1:** Cargar el skill `frontend-design` y aplicar la línea visual existente (pantalla dividida, `#161D2F`/azul `#2563EB`, Inter). Rediseñar `LoginPage` según spec §6: botón deshabilitado sin CAPTCHA; tras error de credenciales, `captcha.reset()`; leer `?error=&proveedor=` de la URL; `BotonesSociales` pide `authApi.proveedores()` y renderiza solo los configurados como enlaces `<a href={API.AUTH.SOCIAL_INICIAR(p)}>`.
- [ ] **Step 2:** `AuthCallbackPage`: lee `code`, llama `canjear`, `loginConTokens`, redirige por rol; si falla, `navigate('/login?error=social_fallido')`. Guardar contra doble ejecución de `useEffect` en StrictMode (ref de "ya canjeado").
- [ ] **Step 3:** `RecuperarPage` (correo + CAPTCHA → muestra siempre el mensaje único) y `RestablecerPage` (lee `uid`, `token`; dos contraseñas; éxito → `/login` con toast "Contraseña actualizada. Inicia sesión.").
- [ ] **Step 4:** `RegisterPage`: quitar el selector de rol y `ROLES_REGISTRO`; agregar `CaptchaField`; enviar a `authApi.registro`.
- [ ] **Step 5: Verificar** — `npm run build` → sin errores. Levantar `auth_service` (8001, `sembrar_cuentas`), monolito (8000) y `npm run dev`; comprobar con navegador: login de cada rol cae en su dashboard; sin CAPTCHA el botón está deshabilitado; `?error=cuenta_no_registrada&proveedor=github` muestra el mensaje; recuperación imprime el enlace en la consola de auth-service y el enlace funciona una sola vez.
- [ ] **Step 6: Commit** — `feat(frontend): login renovado con reCAPTCHA, acceso social y recuperacion de contrasena`

### Task 10: Frontend — gestión de usuarios contra auth-service

**Files:**
- Create: `frontend/src/api/cuentas.ts`
- Modify: `frontend/src/features/usuarios/UsuariosListPage.tsx`, `frontend/src/api/usuarios.ts`

**Interfaces:**
- Produces: `cuentasApi = { list(params), create(data), update(id, data), cambiarContrasena(id, {password, password2}), accesos(params) }` sobre `authClient`; `usuariosApi.sincronizar(data)` → `POST /usuarios/sincronizar/`; `usuariosApi.create` y `usuariosApi.cambiarContrasena` eliminados.
- [ ] **Step 1:** Crear usuario: `cuentasApi.create` → con su `id` llamar `usuariosApi.sincronizar({ sub: String(id), ...datosCuenta, carrera_id, telefono, cargo })`; si el segundo falla, toast de advertencia "La cuenta se creó; el perfil se completará en su primer inicio de sesión."
- [ ] **Step 2:** Cambiar rol/activar → `cuentasApi.update(auth_uid, ...)` seguido de `usuariosApi.sincronizar` para reflejarlo sin esperar al siguiente login. Cambiar contraseña → `cuentasApi.cambiarContrasena(auth_uid, ...)`. Datos de perfil → `usuariosApi.update` (sin `rol`). Agregar `auth_uid` al tipo `Usuario`. Usuarios sin `auth_uid` muestran rol/contraseña deshabilitados con tooltip "Aún no inicia sesión en el nuevo sistema de acceso".
- [ ] **Step 3: Verificar** — `npm run build`; en navegador como `admin`: crear un docente, cambiarlo a coordinador, iniciar sesión con él y ver dashboard de coordinador.
- [ ] **Step 4: Commit** — `feat(frontend): gestion de usuarios a traves de auth-service`

### Task 11: Despliegue, Docker y documentación

**Files:**
- Create: `auth_service/Dockerfile`, `auth_service/README.md`, `docs/arquitectura/modulo-acceso.md`
- Modify: `render.yaml`, `docker-compose.yml`, `README.md` (sección corta enlazando al README de auth-service)

**Interfaces:** ninguna nueva.
- [ ] **Step 1:** `Dockerfile` (python:3.13-slim, `gunicorn auth_project.wsgi:application --bind 0.0.0.0:${PORT:-8001}`); servicio `auth` en `docker-compose.yml` (puerto 8001); `render.yaml`: servicio `vinculacion-auth` (`rootDir: auth_service`, build `pip install -r requirements.txt && python manage.py migrate && python manage.py sembrar_cuentas`, `healthCheckPath: /salud/`) + base `auth-db`, todas las variables de spec §9 (`sync: false` para secretos); variables nuevas en `vinculacion-api`.
- [ ] **Step 2:** `auth_service/README.md`: correr en local; generar claves (`python manage.py generar_claves`) y copiar la pública a `AUTH_PUBLIC_KEY` del monolito; guía paso a paso con URLs de consola y valores exactos de callback para reCAPTCHA v2 (dominios `localhost` y el de Vercel), Google Cloud (OAuth client web), GitHub (OAuth App), Meta for Developers (Facebook Login, testers en modo desarrollo), Brevo (API key + remitente verificado); notas de Render (servicios dormidos, SMTP bloqueado); lista de comprobación de la demo.
- [ ] **Step 3:** `docs/arquitectura/modulo-acceso.md` con diagrama de componentes y diagrama de secuencia del login social (Mermaid), y tabla de patrones de diseño.
- [ ] **Step 4: Verificar** — `docker build auth_service` termina; `python -c "import yaml,sys; yaml.safe_load(open('render.yaml'))"` sin error; ambas suites de tests en verde; `npm run build` en verde.
- [ ] **Step 5: Commit** — `chore: despliegue de auth-service en Render, Docker y documentacion del modulo de acceso`
