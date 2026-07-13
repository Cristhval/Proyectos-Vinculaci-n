# Sistema de Gestión de Proyectos de Vinculación con la Sociedad

**Universidad Nacional de Loja — Área de la Energía, las Industrias y los Recursos Naturales No Renovables**

Sistema web para la gestión integral del ciclo de vida de proyectos de vinculación universitaria, convenios interinstitucionales y seguimiento de actividades académicas.

---

## Tecnologías utilizadas

**Backend**
- Python 3.12
- Django 5.x
- Django REST Framework
- SimpleJWT (autenticación)
- SQLite (desarrollo)

**Frontend**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- ApexCharts

---

## Requisitos previos

Antes de instalar, asegúrate de tener:

- Python 3.10 o superior
- Node.js 18 o superior
- npm 9 o superior
- Git

Verifica las versiones con:

```bash
python --version
node --version
npm --version
```

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Cristhval/Proyectos-Vinculaci-n.git
cd Proyectos-Vinculaci-n
```

### 2. Configurar el Backend

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En macOS/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 3. Configurar variables de entorno del Backend

```bash
# Copiar el archivo de ejemplo
cp .env.example .env
```

El archivo `.env` ya tiene los valores
por defecto para desarrollo local.
No es necesario modificarlo para
una prueba básica.

### 4. Aplicar migraciones

```bash
python manage.py migrate
```

### 5. (Opcional) Poblar datos de prueba

El repositorio incluye `db.sqlite3`
con datos listos para probar. Si
prefieres empezar desde cero:

```bash
# Eliminar la base de datos actual
del db.sqlite3

# Crear nueva base de datos
python manage.py migrate

# Crear superusuario administrador
python manage.py createsuperuser

# Poblar proyectos de ejemplo
python manage.py seed_proyectos_demo
```

### 6. Iniciar el servidor Backend

```bash
python manage.py runserver
```

El backend estará disponible en:
`http://127.0.0.1:8000`

Documentación de la API (Swagger):
`http://127.0.0.1:8000/api/docs/`

---

### 7. Configurar el Frontend

En una nueva terminal:

```bash
# Entrar a la carpeta del frontend
cd frontend

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
```

### 8. Iniciar el servidor Frontend

```bash
npm run dev
```

El frontend estará disponible en:
`http://localhost:5173`

---

## Estructura del proyecto

```
Proyectos-Vinculaci-n/
├── auditoria/          # Módulo de auditoría y trazabilidad
├── convenios/          # Módulo de convenios interinstitucionales
├── core/               # Configuración base y permisos
├── frontend/           # Aplicación React (interfaz web)
├── formatos/           # Módulo de formatos institucionales
├── proyectos/          # Módulo principal de proyectos
├── reportes/           # Reportes y dashboards
├── seguimiento/        # Módulo de avances, evidencias e informes
├── usuarios/           # Módulo de usuarios y autenticación
├── proyecto_vinculacion_universidad/  # Configuración Django
├── manage.py
├── requirements.txt
├── .env.example
├── .gitignore
├── db.sqlite3
└── README.md
```

---

## Funcionalidades principales

- Gestión completa del ciclo de vida de proyectos (8 estados)
- Formulación de proyectos con metodología de marco lógico
- Flujo de revisión y aprobación con notificaciones automáticas
- Registro de avances, evidencias e informes de seguimiento
- Gestión de convenios interinstitucionales
- Gestión de participantes (docentes y estudiantes)
- Reportes con gráficas interactivas y exportación a PDF/Excel
- Auditoría completa de acciones del sistema
- Centro de notificaciones y alertas automáticas
- Formatos oficiales UNL descargables

---

## Documentación de la API

La documentación interactiva de todos
los endpoints está disponible en
Swagger una vez iniciado el backend:

`http://127.0.0.1:8000/api/docs/`

La especificación alternativa está
disponible en ReDoc:

`http://127.0.0.1:8000/api/redoc/`

---

## Solución de problemas comunes

**Error: "No module named 'django'"**
```bash
# Verifica que el entorno virtual está activado
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
```

**Error: "CORS policy" en el navegador**
```bash
# Verifica que el backend está corriendo
# en http://127.0.0.1:8000 (no localhost)
```

**Error: "relation does not exist"**
```bash
python manage.py migrate
```

**El frontend no conecta con el backend**
```bash
# Verifica el archivo frontend/.env
cat frontend/.env
# Debe tener: VITE_API_URL=http://127.0.0.1:8000/api/v1
```

**Puerto 8000 ocupado**
```bash
python manage.py runserver 8001
# Y actualizar VITE_API_URL en frontend/.env
```

---

## Comandos útiles

```bash
# Ver logs del servidor
python manage.py runserver --verbosity=2

# Crear migraciones después de cambiar modelos
python manage.py makemigrations
python manage.py migrate

# Generar alertas de vencimiento manualmente
python manage.py generar_alertas

# Poblar proyectos de demo
python manage.py seed_proyectos_demo

# Acceder al shell de Django
python manage.py shell

# Compilar el frontend para producción
cd frontend && npm run build

# Ejecutar tests automatizados del backend
python manage.py test
```

---

## Autores

- Alexander Sánchez
- Cristian Valverde
- Mateo Rojas
- David Toledo
- Jorge Luzuriaga
- Jean Encalada

Carrera de Ingeniería en Sistemas
Universidad Nacional de Loja
2026

---

## Licencia

Este proyecto fue desarrollado como
trabajo académico para la Universidad
Nacional de Loja. Todos los derechos
reservados.
