Seguimiento de Proyectos de Vinculación con la Sociedad
El sistema propuesto está orientado al seguimiento de proyectos de vinculación, permitiendo gestionar, monitorear y evaluar el progreso de las actividades y resultados asociados. Para su desarrollo se utiliza el framework Django, el cual facilita la creación de aplicaciones web de forma rápida, segura y escalable.

Dentro de esta arquitectura, el servidor cumple un rol fundamental, ya que se encarga de recibir y procesar las solicitudes de los usuarios, ejecutar la lógica del sistema, interactuar con la base de datos y generar respuestas en formato HTTP. De esta manera, el sistema garantiza una gestión eficiente de la información y un acceso organizado a los datos de los proyectos.

Estructura del Proyecto:
PROYECTOS-VINCULACION/
│
├── .idea/
│   ├── inspectionProfiles/
│   ├── misc.xml
│   ├── modules.xml
│   ├── Proyectos-Vinculaci-n.iml
│   └── vcs.xml
│
├── p_vinculacion/
│   ├── __pycache__/
│   ├── migrations/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── tests.py
│   └── views.py
│
├── proyecto_vinculacion_universidad/
│   └── ...
│
├── venv/
│   └── ...
│
├── db.sqlite3
├── manage.py
