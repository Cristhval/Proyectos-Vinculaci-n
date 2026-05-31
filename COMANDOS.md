# Guia Rapida de Comandos del Proyecto

Este documento resume los comandos mas utilizados para ejecutar y trabajar con el proyecto.

---

## Requisitos previos

- **Python** 3.12+
- **Node.js** 20+ y **npm**
- Entorno virtual de Python ya creado (`.venv/`)

---

## 1. Levantar el Backend (Django)

Abre una terminal en la raiz del proyecto (`Proyectos-Vinculaci-n`) y ejecuta:

```powershell
# 1. Activar entorno virtual (PowerShell)
.venv\Scripts\Activate.ps1

# Si usas CMD en lugar de PowerShell:
# .venv\Scripts\activate.bat

# 2. Ejecutar servidor de desarrollo
python manage.py runserver
```

- La API estara disponible en: `http://127.0.0.1:8000/`
- Documentacion Swagger: `http://localhost:8000/api/docs/`
- Admin Django: `http://localhost:8000/admin/`

> Nota: La base de datos `db.sqlite3` ya existe con datos de prueba. Si necesitas regenerarla:
> ```powershell
> python manage.py migrate
> python scripts\create_test_users.py
> ```

---

## 2. Levantar el Frontend (React + Vite)

Abre una **segunda terminal** en la raiz del proyecto y ejecuta:

```powershell
Set-Location frontend
npm run dev
```

- La aplicacion estara disponible en: `http://localhost:5173/`

---

## 3. Comandos utiles del Backend

### Instalar dependencias (solo si cambia `requirements.txt`)
```powershell
pip install -r requirements.txt
```

### Aplicar migraciones de base de datos
```powershell
python manage.py migrate
```

### Crear superusuario manualmente
```powershell
python manage.py createsuperuser
```

### Ejecutar tests automatizados
```powershell
# Todos los tests
python manage.py test --verbosity=2

# Tests de un modulo especifico
python manage.py test usuarios.tests.AuthTestCase --verbosity=2
```

### Shell interactivo de Django
```powershell
python manage.py shell
```

### Generar schema OpenAPI
```powershell
python manage.py spectacular --file schema.yml
```

---

## 4. Comandos utiles del Frontend

### Instalar dependencias (solo si cambia `package.json`)
```powershell
cd frontend
npm install
```

### Compilar para produccion
```powershell
cd frontend
npm run build
```

### Previsualizar build de produccion
```powershell
cd frontend
npm run preview
```

### Lint del codigo
```powershell
cd frontend
npm run lint
```

---

## 5. URLs de acceso rapido

Una vez que ambos servidores esten corriendo:

| Servicio | URL |
|----------|-----|
| Frontend (App React) | http://localhost:5173 |
| API REST (Django) | http://localhost:8000/api/v1/ |
| Documentacion Swagger | http://localhost:8000/api/docs/ |
| Documentacion ReDoc | http://localhost:8000/api/redoc/ |
| Panel Admin Django | http://localhost:8000/admin/ |

---

## 6. Usuarios de prueba

| Usuario | Password | Rol |
|---------|----------|-----|
| `admin` | Admin123! | ADMIN |
| `coordinador` | Admin123! | COORDINADOR |
| `docente` | Admin123! | DOCENTE |
| `estudiante` | Admin123! | ESTUDIANTE |

---

## 7. Estructura de terminales recomendada

Para trabajar comodo, manten **dos terminales abiertas**:

- **Terminal 1 (Backend):** Raiz del proyecto → `.venv\Scripts\Activate.ps1` → `python manage.py runserver`
- **Terminal 2 (Frontend):** Raiz del proyecto → `cd frontend` → `npm run dev`

---

*Guia generada el 29 de mayo de 2026.*
