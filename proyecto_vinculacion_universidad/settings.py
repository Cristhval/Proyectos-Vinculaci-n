from pathlib import Path
import environ
import os

env = environ.Env(
	DEBUG=(bool, False),
	SECRET_KEY=(str, ''),
	ALLOWED_HOSTS=(list, []),
	DB_ENGINE=(str, 'django.db.backends.sqlite3'),
	DB_NAME=(str, 'db.sqlite3'),
)

BASE_DIR = Path(__file__).resolve().parent.parent
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = env('SECRET_KEY', default='django-insecure-change-me-in-production')
DEBUG = env('DEBUG', default=True)
ALLOWED_HOSTS = env('ALLOWED_HOSTS', default=['localhost', '127.0.0.1', '.onrender.com'])

INSTALLED_APPS = [
	'django.contrib.admin',
	'django.contrib.auth',
	'django.contrib.contenttypes',
	'django.contrib.sessions',
	'django.contrib.messages',
	'django.contrib.staticfiles',

	'rest_framework',
	'rest_framework_simplejwt',
	'corsheaders',
	'django_filters',
	'drf_spectacular',

	'core',
	'usuarios',
	'proyectos',
	'convenios',
	'seguimiento',
	'reportes',
	'auditoria',
	'formatos',
]

MIDDLEWARE = [
	'django.middleware.security.SecurityMiddleware',
	'corsheaders.middleware.CorsMiddleware',
	'django.contrib.sessions.middleware.SessionMiddleware',
	'django.middleware.common.CommonMiddleware',
	'django.middleware.csrf.CsrfViewMiddleware',
	'django.contrib.auth.middleware.AuthenticationMiddleware',
	'django.contrib.messages.middleware.MessageMiddleware',
	'django.middleware.clickjacking.XFrameOptionsMiddleware',
	'auditoria.middleware.AuditoriaMiddleware',
]

ROOT_URLCONF = 'proyecto_vinculacion_universidad.urls'

TEMPLATES = [
	{
		'BACKEND': 'django.template.backends.django.DjangoTemplates',
		'DIRS': [],
		'APP_DIRS': True,
		'OPTIONS': {
			'context_processors': [
				'django.template.context_processors.request',
				'django.contrib.auth.context_processors.auth',
				'django.contrib.messages.context_processors.messages',
			],
		},
	},
]

WSGI_APPLICATION = 'proyecto_vinculacion_universidad.wsgi.application'

db_engine = env('DB_ENGINE', default='django.db.backends.sqlite3')
db_name = env('DB_NAME', default='db.sqlite3')

DATABASES_DEFAULT = {
	'ENGINE': db_engine,
	'NAME': BASE_DIR / db_name if 'sqlite' in db_engine else db_name,
}
if env('DATABASE_URL', default=''):
	DATABASES_DEFAULT.update(env.db_url_config('DATABASE_URL'))

DATABASES = {'default': DATABASES_DEFAULT}

AUTH_PASSWORD_VALIDATORS = [
	{'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
	{'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
	{'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
	{'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'es-ec'
TIME_ZONE = 'America/Guayaquil'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

SPECKIT_PATH = BASE_DIR / 'specs'

FRONTEND_URL = env('FRONTEND_URL', default='http://localhost:5173').rstrip('/')
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env('CORS_ALLOWED_ORIGINS', default=[
	FRONTEND_URL,
	'http://localhost:3000',
	'http://127.0.0.1:3000',
	'http://localhost:5173',
	'http://127.0.0.1:5173',
])
CSRF_TRUSTED_ORIGINS = env('CSRF_TRUSTED_ORIGINS', default=[FRONTEND_URL])

REST_FRAMEWORK = {
	'DEFAULT_AUTHENTICATION_CLASSES': (
		'usuarios.autenticacion.AuthServiceJWTAuthentication',
	),
	'DEFAULT_PERMISSION_CLASSES': (
		'rest_framework.permissions.IsAuthenticated',
	),
	'DEFAULT_PAGINATION_CLASS': 'core.utils.FlexiblePageNumberPagination',
	'PAGE_SIZE': 10,
	'DEFAULT_FILTER_BACKENDS': (
		'django_filters.rest_framework.DjangoFilterBackend',
		'rest_framework.filters.SearchFilter',
		'rest_framework.filters.OrderingFilter',
	),
	'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# --- Autenticación delegada a auth-service ---------------------------------
# La API principal NO emite tokens: solo los valida con la clave pública RSA de auth-service.
AUTH_PUBLIC_KEY = env('AUTH_PUBLIC_KEY', default='').replace('\\n', '\n').strip()

SIMPLE_JWT = {
	'ALGORITHM': 'RS256',
	'SIGNING_KEY': None,
	'VERIFYING_KEY': AUTH_PUBLIC_KEY or None,
	'AUDIENCE': env('AUTH_AUDIENCE', default='vinculacion-api'),
	'ISSUER': env('AUTH_ISSUER', default='vinculacion-auth'),
	'USER_ID_CLAIM': 'sub',
	'USER_ID_FIELD': 'id',
}

SPECTACULAR_SETTINGS = {
	'TITLE': 'Sistema de Vinculacion API',
	'DESCRIPTION': 'API para gestion, monitoreo y evaluacion de proyectos de vinculacion y convenios interinstitucionales.',
	'VERSION': '1.0.0',
	'SERVE_INCLUDE_SCHEMA': False,
	'COMPONENT_SPLIT_REQUEST': True,
}

ANTHROPIC_API_KEY = env('ANTHROPIC_API_KEY', default='')
ANTHROPIC_MODEL = env('ANTHROPIC_MODEL', default='claude-sonnet-4-6')
