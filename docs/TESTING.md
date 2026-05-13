# Guia de Tests Automatizados

Esta guia explica como ejecutar y crear tests automatizados para el Sistema de Gestion de Proyectos.

## Tabla de Contenidos

1. [Ejecutar Tests](#ejecutar-tests)
2. [Estructura de Tests](#estructura-de-tests)
3. [Crear Nuevos Tests](#crear-nuevos-tests)
4. [Comandos Utiles](#comandos-utiles)

---

## Ejecutar Tests

### Metodo 1: Script Automatico (Recomendado)

**Windows:**
```bash
run_tests.bat
```

**Linux/Mac:**
```bash
chmod +x run_tests.sh
./run_tests.sh
```

### Metodo 2: Comando Manual

```bash
# 1. Activar entorno virtual
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# 2. Ejecutar tests
python manage.py test --verbosity=2
```

### Metodo 3: Desde tu IDE (VS Code, PyCharm)

Most IDEs detectan automaticamente los tests de Django y muestran botones de "Run" junto a cada test.

---

## Estructura de Tests

Los tests estan organizados en `usuarios/tests.py`:

```python
class AuthTestCase(TestCase):
    """Tests de autenticacion (login, registro)"""
    
class UsuarioTestCase(TestCase):
    """Tests de gestion de usuarios"""
    
class ProyectoTestCase(TestCase):
    """Tests de proyectos"""
    
class ConveniosTestCase(TestCase):
    """Tests de convenios e instituciones"""
    
class SeguimientoTestCase(TestCase):
    """Tests de seguimiento (actividades, avances)"""
    
class ReportesTestCase(TestCase):
    """Tests de reportes y dashboard"""
    
class ErrorHandlingTestCase(TestCase):
    """Tests de manejo de errores"""
```

---

## Crear Nuevos Tests

### Ejemplo: Test para un endpoint nuevo

Supongamos que tienes un nuevo endpoint `GET /api/v1/proyectos/{id}/estadisticas/`:

```python
# En usuarios/tests.py o crear un nuevo archivo tests.py en tu app

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

class EstadisticasTestCase(TestCase):
    def setUp(self):
        """Configuracion inicial que se ejecuta antes de cada test"""
        self.client = APIClient()
        # Crear datos de prueba
        self.carrera = Carrera.objects.create(
            codigo='TEST', 
            nombre='Carrera Test', 
            facultad='Facultad Test'
        )
        self.user = User.objects.create_user(
            username='testuser', 
            password='TestPass123!'
        )
        self.perfil = Usuario.objects.create(
            user=self.user, 
            codigo='TST-001', 
            rol=RolUsuario.COORDINADOR, 
            carrera=self.carrera
        )
        # Autenticar
        login = self.client.post('/api/v1/auth/login/', {
            'username': 'testuser', 
            'password': 'TestPass123!'
        }, format='json')
        self.token = login.data['data']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
    
    def test_estadisticas_proyecto(self):
        """Test: obtener estadisticas de un proyecto"""
        # Crear un proyecto primero
        proyecto = self.client.post('/api/v1/proyectos/', {
            'titulo': 'Proyecto Test',
            'tipo': 'VINCULACION',
            'carrera_id': self.carrera.id,
        }, format='json')
        proyecto_id = proyecto.data['id']
        
        # Llamar al endpoint de estadisticas
        response = self.client.get(f'/api/v1/proyectos/{proyecto_id}/estadisticas/')
        
        # Verificar respuesta
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('total_actividades', response.data['data'])
```

### Buenas Practicas

1. **Nombres descriptivos**: `test_<que_estas_probando>`
2. **Una sola cosa por test**: Cada test debe verificar una sola funcionalidad
3. **Datos de prueba aislados**: Usa `setUp()` para crear datos necesarios
4. **Limpieza automatica**: Django limpia la BD despues de cada test
5. **Autenticacion**: Usa `self.client.credentials()` para enviar tokens

---

## Comandos Utiles

### Ejecutar todos los tests
```bash
python manage.py test
```

### Ejecutar con detalles (muestra nombres de tests)
```bash
python manage.py test --verbosity=2
```

### Ejecutar un TestCase especifico
```bash
python manage.py test usuarios.tests.AuthTestCase
```

### Ejecutar un test especifico
```bash
python manage.py test usuarios.tests.AuthTestCase.test_login_success
```

### Ejecutar tests de una app especifica
```bash
python manage.py test usuarios
```

### Ver cobertura de tests (requiere coverage)
```bash
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

### Ejecutar tests mas rapidos (sin migraciones)
```bash
python manage.py test --keepdb
```

### Ejecutar tests en paralelo (mas rapido)
```bash
python manage.py test --parallel
```

### Ejecutar tests y parar en el primero que falle
```bash
python manage.py test --failfast
```

---

## Solucion de Problemas

### Error: "No module named 'django'"
**Solucion**: Activa el entorno virtual
```bash
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac
```

### Error: "Database locked"
**Solucion**: Usa SQLite en memoria (ya esta configurado por defecto en tests)

### Tests lentos
**Solucion**: Usa `--keepdb` para reutilizar la BD entre ejecuciones
```bash
python manage.py test --keepdb
```

---

## Recursos Adicionales

- [Documentacion oficial de Django Testing](https://docs.djangoproject.com/en/stable/topics/testing/)
- [DRF Testing Guide](https://www.django-rest-framework.org/api-guide/testing/)
- [Buenas practicas de testing](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Django/Testing)

---

**Ultima actualizacion:** Mayo 2026
