# Pendientes

## Documentos en disco efímero (Render)

**Estado:** pendiente, no implementado.

Render no tiene disco persistente: lo que se escribe en `media/` se borra en cada despliegue o
reinicio (el plan gratuito reinicia cuando el servicio se duerme). Además, con `DEBUG=False`
Django no sirve `/media/`, así que estos archivos devuelven 404 en producción.

Las **imágenes** de proyecto ya no tienen este problema: se guardan en la base como WebP
(`proyectos.ImagenProyecto`, ver `proyectos/imagenes.py`). Los **documentos** siguen en disco:

| Modelo | Campo | Contenido |
|---|---|---|
| `proyectos.Anexo` | `archivo` | PDF, DOCX y XLSX de los anexos (las imágenes ya van a la base) |
| `seguimiento.Evidencia` | `archivo` | Evidencias de actividades |
| `seguimiento.Informe` | `archivo` | Informes |
| `convenios.Convenio` | `archivo_firmado` | Convenio firmado |
| `convenios.Producto` | `archivo` | Productos del convenio |
| `formatos.FormatoInstitucional` | `archivo` | Formatos institucionales |
| `proyectos.Proyecto` | `imagen_portada` | Solo portadas antiguas; las nuevas van a la base |

Mientras tanto, el frontend muestra «Archivo no disponible» cuando un documento devuelve 404,
en lugar de un enlace roto.

**Por qué no en la base:** Neon gratuito tiene 0,5 GB para toda la base y un documento puede
pesar hasta 10 MB.

**Propuesta:** almacenamiento de objetos con `django-storages` (por ejemplo, Supabase Storage o
Cloudflare R2, ambos compatibles con S3), URLs firmadas con vencimiento y una migración de datos
para los archivos que aún existan. Cambia `STORAGES['default']`; los modelos no se tocan.

**Vigilar el espacio de las imágenes:** `python manage.py reporte_imagenes`.
