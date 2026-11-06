"""Configuración del servicio de autenticación (auth-service).

Proyecto Django independiente: no comparte código ni base de datos con la API principal.
"""
import logging
import sys
from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent
env = environ.Env()
environ.Env.read_env(env.str('AUTH_ENV_FILE', default=str(BASE_DIR / '.env')))

TESTING = len(sys.argv) > 1 and sys.argv[1] == 'test'
DEBUG = env.bool('DEBUG', default=False)
SECRET_KEY = env('SECRET_KEY', default='')
if not SECRET_KEY:
	if DEBUG or TESTING:
		SECRET_KEY = 'auth-service-solo-para-desarrollo'
	else:
		raise RuntimeError('SECRET_KEY es obligatorio cuando DEBUG=False.')
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

INSTALLED_APPS = [
	'django.contrib.admin',
	'django.contrib.auth',
	'django.contrib.contenttypes',
	'django.contrib.sessions',
	'django.contrib.messages',
	'django.contrib.staticfiles',
	'rest_framework',
	'rest_framework_simplejwt.token_blacklist',
	'corsheaders',
	'cuentas',
]

MIDDLEWARE = [
	'django.middleware.security.SecurityMiddleware',
	'whitenoise.middleware.WhiteNoiseMiddleware',
	'corsheaders.middleware.CorsMiddleware',
	'django.contrib.sessions.middleware.SessionMiddleware',
	'django.middleware.common.CommonMiddleware',
	'django.middleware.csrf.CsrfViewMiddleware',
	'django.contrib.auth.middleware.AuthenticationMiddleware',
	'django.contrib.messages.middleware.MessageMiddleware',
	'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'auth_project.urls'
WSGI_APPLICATION = 'auth_project.wsgi.application'

TEMPLATES = [{
	'BACKEND': 'django.template.backends.django.DjangoTemplates',
	'DIRS': [],
	'APP_DIRS': True,
	'OPTIONS': {'context_processors': [
		'django.template.context_processors.request',
		'django.contrib.auth.context_processors.auth',
		'django.contrib.messages.context_processors.messages',
	]},
}]

DATABASES = {'default': env.db('DATABASE_URL', default=f'sqlite:///{BASE_DIR / "auth.sqlite3"}')}

AUTH_USER_MODEL = 'cuentas.Cuenta'
AUTH_PASSWORD_VALIDATORS = [
	{'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
	{'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
	{'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
	{'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'es-ec'
TIME_ZONE = 'America/Guayaquil'
USE_I18N = True
USE_TZ = True
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- URLs de los otros componentes -------------------------------------------
FRONTEND_URL = env('FRONTEND_URL', default='http://localhost:5173').rstrip('/')
AUTH_SERVICE_URL = env('AUTH_SERVICE_URL', default='http://localhost:8001').rstrip('/')

_FRONTEND_ORIGINS = [FRONTEND_URL]
if FRONTEND_URL == 'http://localhost:5173':
	_FRONTEND_ORIGINS.append('http://127.0.0.1:5173')
elif FRONTEND_URL == 'http://127.0.0.1:5173':
	_FRONTEND_ORIGINS.append('http://localhost:5173')

CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=_FRONTEND_ORIGINS)
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[AUTH_SERVICE_URL])

# La sesión solo guarda el `state` OAuth entre iniciar/ y callback/.
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = not DEBUG
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# --- Claves RSA para firmar los JWT ------------------------------------------
def _pem(nombre):
	valor = env(nombre, default='')
	return valor.replace('\\n', '\n').strip() if valor else ''


JWT_PRIVATE_KEY = _pem('JWT_PRIVATE_KEY')
JWT_PUBLIC_KEY = _pem('JWT_PUBLIC_KEY')

if not JWT_PRIVATE_KEY or not JWT_PUBLIC_KEY:
	if not (DEBUG or TESTING):
		raise RuntimeError('Faltan JWT_PRIVATE_KEY/JWT_PUBLIC_KEY. Genera un par con: python manage.py generar_claves')
	from cryptography.hazmat.primitives import serialization
	from cryptography.hazmat.primitives.asymmetric import rsa

	_clave = rsa.generate_private_key(public_exponent=65537, key_size=2048)
	JWT_PRIVATE_KEY = _clave.private_bytes(
		serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()
	).decode()
	JWT_PUBLIC_KEY = _clave.public_key().public_bytes(
		serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
	).decode()
	if not TESTING:
		logging.getLogger(__name__).warning('Claves JWT temporales generadas en memoria (solo desarrollo).')

JWT_ISSUER = env('JWT_ISSUER', default='vinculacion-auth')
JWT_AUDIENCE = env('JWT_AUDIENCE', default='vinculacion-api')

SIMPLE_JWT = {
	'ALGORITHM': 'RS256',
	'SIGNING_KEY': JWT_PRIVATE_KEY,
	'VERIFYING_KEY': JWT_PUBLIC_KEY,
	'AUDIENCE': JWT_AUDIENCE,
	'ISSUER': JWT_ISSUER,
	'USER_ID_FIELD': 'id',
	'USER_ID_CLAIM': 'sub',
	'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
	'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
	'ROTATE_REFRESH_TOKENS': True,
	'BLACKLIST_AFTER_ROTATION': True,
	'UPDATE_LAST_LOGIN': False,
}

REST_FRAMEWORK = {
	'DEFAULT_AUTHENTICATION_CLASSES': ('rest_framework_simplejwt.authentication.JWTAuthentication',),
	'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.IsAuthenticated',),
	'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
	'PAGE_SIZE': 10,
	'DEFAULT_THROTTLE_RATES': {'login': '5/min', 'recuperacion': '3/min'},
}

# --- reCAPTCHA v2 --------------------------------------------------------------
RECAPTCHA_SECRET_KEY = env('RECAPTCHA_SECRET_KEY', default='')
if TESTING:
	RECAPTCHA_SECRET_KEY = ''
elif not DEBUG and not RECAPTCHA_SECRET_KEY:
	raise RuntimeError('RECAPTCHA_SECRET_KEY es obligatorio cuando DEBUG=False.')

# --- Proveedores OAuth ---------------------------------------------------------
GOOGLE_CLIENT_ID = env('GOOGLE_CLIENT_ID', default='')
GOOGLE_CLIENT_SECRET = env('GOOGLE_CLIENT_SECRET', default='')
GITHUB_CLIENT_ID = env('GITHUB_CLIENT_ID', default='')
GITHUB_CLIENT_SECRET = env('GITHUB_CLIENT_SECRET', default='')
FACEBOOK_CLIENT_ID = env('FACEBOOK_CLIENT_ID', default='')
FACEBOOK_CLIENT_SECRET = env('FACEBOOK_CLIENT_SECRET', default='')

# --- Correo (recuperación de contraseña) --------------------------------------
EMAIL_EMISOR = env('EMAIL_EMISOR', default='consola')
BREVO_API_KEY = env('BREVO_API_KEY', default='')
EMAIL_REMITENTE = env('EMAIL_REMITENTE', default='no-responder@localhost')
EMAIL_REMITENTE_NOMBRE = env('EMAIL_REMITENTE_NOMBRE', default='Vinculación UNL')
PASSWORD_RESET_TIMEOUT = 1800

LOGGING = {
	'version': 1,
	'disable_existing_loggers': False,
	'handlers': {'console': {'class': 'logging.StreamHandler'}},
	'loggers': {'cuentas': {'handlers': ['console'], 'level': 'INFO'}},
}
