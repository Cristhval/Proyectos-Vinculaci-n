FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8001

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN DEBUG=True python manage.py collectstatic --noinput

EXPOSE 8001

CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py sembrar_cuentas && gunicorn auth_project.wsgi:application --bind 0.0.0.0:${PORT}"]
