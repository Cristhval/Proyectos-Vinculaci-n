#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec gunicorn proyecto_vinculacion_universidad.wsgi:application --bind 0.0.0.0:8000 --workers 3
