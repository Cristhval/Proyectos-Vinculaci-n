from pathlib import Path
from datetime import timedelta
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
ALLOWED_HOSTS = env('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

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

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

SPECKIT_PATH = BASE_DIR / 'specs'

CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = env('CORS_ALLOWED_ORIGINS', default=[
	'http://localhost:3000',
	'http://127.0.0.1:3000',
	'http://localhost:5173',
	'http://127.0.0.1:5173',
])

REST_FRAMEWORK = {
	'DEFAULT_AUTHENTICATION_CLASSES': (
		'rest_framework_simplejwt.authentication.JWTAuthentication',
	),
	'DEFAULT_PERMISSION_CLASSES': (
		'rest_framework.permissions.AllowAny',
	),
	'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
	'PAGE_SIZE': 20,
	'DEFAULT_FILTER_BACKENDS': (
		'django_filters.rest_framework.DjangoFilterBackend',
		'rest_framework.filters.SearchFilter',
		'rest_framework.filters.OrderingFilter',
	),
	'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SIMPLE_JWT = {
	'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
	'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
	'ROTATE_REFRESH_TOKENS': True,
	'BLACKLIST_AFTER_ROTATION': True,
}

SPECTACULAR_SETTINGS = {
	'TITLE': 'Sistema de Vinculacion API',
	'DESCRIPTION': 'API para gestion, monitoreo y evaluacion de proyectos de vinculacion y convenios interinstitucionales.',
	'VERSION': '1.0.0',
	'SERVE_INCLUDE_SCHEMA': False,
	'COMPONENT_SPLIT_REQUEST': True,
}
