# Guia de Contribucion

Gracias por tu interes en contribuir al Sistema de Gestion de Proyectos de Vinculacion.

## Como Reportar Bugs

1. Busca issues existentes para evitar duplicados
2. Crea un nuevo issue con la etiqueta `bug`
3. Incluye:
   - Descripcion clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs comportamiento actual
   - Entorno (SO, navegador, version Python, version Node)

## Como Proponer Funcionalidades

1. Crea un issue con la etiqueta `enhancement`
2. Describe la funcionalidad, su justificacion y caso de uso esperado
3. Si es posible, incluye wireframes o mockups

## Proceso de Pull Request

1. Haz fork del repositorio
2. Crea una rama desde `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/nombre-funcionalidad
   ```
3. Desarrolla tu cambio siguiendo los estandares del proyecto
4. Realiza commits con el formato Conventional Commits
5. Push a tu fork y crea un PR hacia `develop`
6. Espera la revision y feedback del equipo

## Formato de Commits

```
<tipo>(<alcance>): <descripcion corta>

Tipos: feat, fix, refactor, docs, style, test, perf, build, ci, chore
```

### Ejemplos

```
feat(proyectos): agregar filtro por estado de proyecto
fix(auth): corregir refresh token expirado
refactor(convenios): extraer logica a services.py
docs: actualizar guia de instalacion
style(dashboard): actualizar colores de badges
test(proyectos): agregar tests de validacion de proyecto
```

## Estandares de Codigo

### Backend (Python/Django)

- Seguir PEP 8 (4 espacios de indentacion, lineas max 79 caracteres)
- Usar docstrings en modelos, views y serializers
- Separar logica de negocio en `services.py`
- Crear tests para nuevas funcionalidades
- Nomenclatura: `snake_case` para funciones/variables, `PascalCase` para clases

### Frontend (React/TypeScript)

- Usar TypeScript estricto (evitar `any`)
- Componentes funcionales con hooks
- Tailwind CSS para estilos
- Nomenclatura: `PascalCase` para componentes, `camelCase` para funciones/variables
- Un componente por archivo

## Branching Strategy

- `main`: Produccion estable
- `develop`: Integracion de cambios
- `feature/*`: Nuevas funcionalidades
- `fix/*`: Correccion de bugs

## Preguntas?

Si tienes dudas, abre un issue con la etiqueta `question`.
