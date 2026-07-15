# Guia del Desarrollador

## Configuracion del Entorno de Desarrollo

### VS Code (Recomendado)

Extensiones recomendadas:
- Python
- Pylance
- ESLint
- Prettier
- Tailwind CSS IntelliSense

### Backend

```bash
# Activar entorno virtual
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Instalar dependencias de desarrollo
pip install -r requirements.txt

# Iniciar con auto-reload
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Estandares de Codigo

### Python (PEP 8)

- 4 espacios de indentacion
- Lineas maximas: 79 caracteres
- Nomenclatura: `snake_case` para funciones/variables, `PascalCase` para clases
- Docstrings en todas las funciones publicas

### TypeScript

- Nomenclatura: `PascalCase` para componentes, `camelCase` para funciones/variables
- Siempre usar tipos explícitos
- Evitar `any` cuando sea posible
- Un componente por archivo

## Estructura de una App Django

```
mi_app/
├── __init__.py
├── admin.py          # Registro en Django Admin
├── apps.py           # Configuracion de la app
├── models.py         # Modelos de la base de datos
├── serializers.py    # Serializadores DRF
├── services.py       # Logica de negocio
├── signals.py        # Senales Django (opcional)
├── urls.py           # Rutas de la app
├── views.py          # Vistas/ViewSets
├── tests.py          # Tests unitarios
└── migrations/       # Migraciones de la BD
```

## Estructura de un Componente React

```typescript
// src/features/mi-modulo/MiComponente.tsx

import { FC } from 'react';

interface MiComponenteProps {
  titulo: string;
  onAccion: () => void;
}

export const MiComponente: FC<MiComponenteProps> = ({ titulo, onAccion }) => {
  return (
    <div>
      <h2>{titulo}</h2>
      <button onClick={onAccion}>Accion</button>
    </div>
  );
};
```

## Comandos Utiles del Backend

```bash
python manage.py runserver              # Iniciar servidor
python manage.py migrate                # Aplicar migraciones
python manage.py makemigrations         # Crear migraciones
python manage.py createsuperuser        # Crear admin
python manage.py seed_proyectos_demo    # Poblar datos de prueba
python manage.py generar_alertas        # Generar alertas de vencimiento
python manage.py shell                  # Shell de Django
python manage.py test                   # Ejecutar tests
python manage.py collectstatic          # Recopilar archivos estaticos
```

## Comandos Utiles del Frontend

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build de produccion
npm run lint       # Linting
npm run preview    # Preview del build
```

## Agregar una Nueva App Django

```bash
# 1. Crear la app
python manage.py startapp mi_app

# 2. Registrar en settings.py -> INSTALLED_APPS

# 3. Crear modelos, serializers, views, urls

# 4. Incluir URLs en proyecto_vinculacion_universidad/urls.py

# 5. Crear migraciones
python manage.py makemigrations
python manage.py migrate
```

## Agregar un Nuevo Componente React

```bash
# 1. Crear archivo en src/components/ui/ o src/features/[modulo]/

# 2. Exportar desde index.ts (si es UI component)

# 3. Tipar con TypeScript

# 4. Usar Tailwind CSS para estilos
```

## Debugging

### Backend

- Usar `print()` o `logging` para debug basico
- Django Debug Toolbar para analisis de queries
- `python manage.py shell` para interactuar con modelos

### Frontend

- React Developer Tools (extension del navegador)
- `console.log()` para debug basico
- breakpoints en VS Code
