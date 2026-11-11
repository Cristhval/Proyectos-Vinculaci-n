# auth-service — Módulo de acceso

Servicio de autenticación **independiente** del Sistema de Gestión de Proyectos de Vinculación con la Sociedad (UNL).
Es un proyecto Django aparte, con su propia base de datos, que:

- inicia sesión con usuario o correo + contraseña, protegido con **reCAPTCHA v2**;
- inicia sesión con **Google, GitHub y Facebook** (solo para cuentas ya registradas, se vinculan por correo verificado);
- asigna y administra los **roles** (`ADMIN`, `COORDINADOR`, `DOCENTE`, `ESTUDIANTE`, `DIRECTIVO`);
- emite tokens **JWT firmados con RS256**; la API principal los valida con la clave pública, sin llamar a este servicio;
- permite **recuperar la contraseña** con un enlace de un solo uso que vence en 30 minutos;
- registra todos los intentos de acceso (auditoría).

Arquitectura, flujos y patrones de diseño: [`docs/arquitectura/modulo-acceso.md`](../docs/arquitectura/modulo-acceso.md).

## Correr en local

Necesitas Python 3.12+ y los tres componentes en marcha: auth-service (8001), API principal (8000) y frontend (5173).

```bash
# 1. auth-service
cd auth_service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py generar_claves        # copia JWT_PRIVATE_KEY y JWT_PUBLIC_KEY a auth_service/.env
python manage.py migrate
python manage.py sembrar_cuentas       # admin, coordinador, docente, estudiante
python manage.py runserver 8001

# 2. API principal (otra terminal, en la raíz del repo)
#    pega en .env la línea AUTH_PUBLIC_KEY=... que imprimió generar_claves
python manage.py migrate
python manage.py runserver 8000

# 3. Frontend (otra terminal)
cd frontend && cp .env.example .env && npm install && npm run dev
```

Cuentas de demostración (contraseña por defecto `Vinculacion.2026`, cámbiala con `SEED_<ROL>_PASSWORD`):
`admin`, `coordinador`, `docente`, `estudiante`, con correos `<rol>@unl.edu.ec`.
Si tu admin actual del sistema principal tiene otro correo, pon ese correo en `SEED_ADMIN_EMAIL` antes de sembrar: al primer login, la API principal lo enlaza con tu admin existente.

Pruebas automáticas: `python manage.py test` (52 pruebas).

> **Importante:** con `DEBUG=True` y sin `JWT_PRIVATE_KEY`, el servicio genera claves temporales al arrancar. La API principal no podrá validar esos tokens: usa siempre `generar_claves` y comparte la clave pública.

## Credenciales externas

En todas las URLs de callback, reemplaza `https://vinculacion-auth.onrender.com` por la URL real de tu servicio en Render.

### reCAPTCHA v2 ("No soy un robot")

1. Entra a <https://www.google.com/recaptcha/admin/create>.
2. Tipo: **reCAPTCHA v2 → Casilla "No soy un robot"**.
3. Dominios: `localhost` y el dominio de tu frontend (por ejemplo `tu-frontend.vercel.app`).
4. Copia la **clave del sitio** a `VITE_RECAPTCHA_SITE_KEY` (frontend) y la **clave secreta** a `RECAPTCHA_SECRET_KEY` (auth-service).

Para desarrollo puedes usar las claves de prueba públicas de Google (ya están en los `.env.example`): la casilla siempre aprueba.

### Google

1. <https://console.cloud.google.com/> → crea un proyecto.
2. **APIs y servicios → Pantalla de consentimiento de OAuth**: tipo *Externo*; agrega tu correo como usuario de prueba.
3. **Credenciales → Crear credenciales → ID de cliente de OAuth → Aplicación web**.
4. URIs de redireccionamiento autorizados:
   - `http://localhost:8001/api/auth/social/google/callback/`
   - `https://vinculacion-auth.onrender.com/api/auth/social/google/callback/`
5. Copia el ID y el secreto a `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.

### GitHub

GitHub admite **una** URL de callback por aplicación: crea una para local y otra para producción.

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Homepage URL: la del frontend.
3. Authorization callback URL: `http://localhost:8001/api/auth/social/github/callback/` (local) o `https://vinculacion-auth.onrender.com/api/auth/social/github/callback/` (producción).
4. **Generate a new client secret** y copia ambos valores a `GITHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET`.

El servicio pide el permiso `user:email` y solo usa correos **verificados** en GitHub.

### Facebook

1. <https://developers.facebook.com/apps> → **Crear app** → caso de uso *Autenticar y solicitar datos a usuarios con el inicio de sesión con Facebook*.
2. En el caso de uso, agrega el permiso **email**.
3. **Inicio de sesión con Facebook → Configuración → URI de redireccionamiento de OAuth válidos**:
   - `https://vinculacion-auth.onrender.com/api/auth/social/facebook/callback/`
   - (en modo desarrollo, Facebook también acepta `http://localhost:8001/...`)
4. **Configuración de la app → Básica**: copia *Identificador de la app* y *Clave secreta* a `FACEBOOK_CLIENT_ID` y `FACEBOOK_CLIENT_SECRET`.
5. Mientras la app esté en **modo desarrollo**, solo pueden entrar las cuentas con un rol en la app. Para la defensa, agrega como *testers* las cuentas que usarás (**Roles de la app → Roles**).

Si a un proveedor le faltan sus dos variables, su botón no aparece en el login.

### Correo para recuperación (Brevo)

El plan gratuito de Render bloquea el tráfico SMTP saliente, por eso el envío usa la API HTTP de Brevo.

1. Crea una cuenta en <https://www.brevo.com/>.
2. **Remitentes, dominios e IP dedicadas → Remitentes**: agrega y verifica el correo remitente.
3. **SMTP y API → Claves API**: crea una clave.
4. Variables: `EMAIL_EMISOR=brevo`, `BREVO_API_KEY`, `EMAIL_REMITENTE` (el correo verificado).

Con `EMAIL_EMISOR=consola` (por defecto), el enlace de recuperación se imprime en la terminal de auth-service; sirve para probar sin internet.

## Despliegue en Render

`render.yaml` (raíz del repo) define `vinculacion-auth` con `rootDir: auth_service`. Completa las variables marcadas `sync: false` en el panel de Render:

| Servicio | Variable | Valor |
|---|---|---|
| vinculacion-auth | `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY` | salida de `python manage.py generar_claves` |
| vinculacion-auth | `DATABASE_URL` | ver "Base de datos" |
| vinculacion-auth | `FRONTEND_URL` | `https://tu-frontend.vercel.app` |
| vinculacion-auth | `AUTH_SERVICE_URL` | URL pública de este servicio |
| vinculacion-auth | reCAPTCHA, Google, GitHub, Facebook, Brevo | ver arriba |
| vinculacion-api | `AUTH_PUBLIC_KEY` | el mismo valor que `JWT_PUBLIC_KEY` |
| frontend (Vercel) | `VITE_AUTH_URL` | `https://vinculacion-auth.onrender.com/api/auth` |
| frontend (Vercel) | `VITE_RECAPTCHA_SITE_KEY` | clave del sitio de reCAPTCHA |

### Base de datos

Render gratis permite **una sola** base PostgreSQL activa por workspace, y la ocupa la API principal. Opciones:

- **Recomendada: base aparte.** Crea una base gratuita en otro proveedor (por ejemplo, Neon) y pega su URL en `DATABASE_URL`. Así cada servicio tiene su propia base, como pide la arquitectura.
- **Esquema propio en la misma base.** Conéctate a `vinculacion-db` y ejecuta `CREATE SCHEMA auth;`. Luego usa la URL de esa base agregando `?options=-csearch_path%3Dauth`. Las tablas quedan separadas en el esquema `auth`.

Las bases gratuitas de Render vencen a los 30 días de creadas; tenlo en cuenta para la fecha de la defensa.

### Antes de presentar

- Render gratis apaga los servicios tras 15 minutos sin tráfico y el primer acceso tarda cerca de un minuto. Abre `https://vinculacion-auth.onrender.com/salud/` y la API unos minutos antes.
- Revisa que las URLs de callback de los tres proveedores apunten al dominio de Render.

## Lista de comprobación para la demo

- [ ] Login con `admin`, `coordinador`, `docente` y `estudiante`: cada uno cae en su dashboard y ve solo su menú.
- [ ] Sin marcar el reCAPTCHA, el botón "Iniciar sesión" está deshabilitado.
- [ ] Contraseña incorrecta: "Usuario o contraseña incorrectos." y la casilla se reinicia.
- [ ] Seis intentos seguidos en un minuto: "Demasiados intentos…".
- [ ] Google, GitHub y Facebook con una cuenta cuyo correo está registrado: entra.
- [ ] Con una cuenta cuyo correo no está registrado: mensaje "no está registrada en el sistema".
- [ ] "¿Olvidaste tu contraseña?": llega el correo (o aparece en consola), el enlace funciona una vez y la segunda dice que expiró.
- [ ] Admin → Usuarios: crear un docente, cambiarlo a coordinador; al volver a entrar ve el dashboard de coordinador.
- [ ] Cerrar sesión: el refresh token queda invalidado en el servidor y al volver se pide iniciar sesión.
- [ ] Admin de Django en `/admin/` de auth-service → **Registros de acceso**: aparecen los intentos.
