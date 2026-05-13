# Flujo de Aprobacion de Proyectos

## Descripcion

El flujo de aprobacion permite que un proyecto pase de borrador a aprobado mediante un proceso de revision y analisis de pertinencia.

## Pasos del Flujo

1. **Formulacion** (BORRADOR)
   - El responsable crea el proyecto y completa toda la informacion
   - Adjunta documentos, anexos y firmas de responsabilidad
   - Envia a revision

2. **Revision** (EN_REVISION)
   - La Coordinacion de Vinculacion revisa el proyecto
   - Se registran observaciones (modelo `Revision`)
   - Se generan pasos de validacion (modelo `FlujoValidacion`)
   - Decision: APROBADO, OBSERVADO o RECHAZADO

3. **Correccion** (si fue OBSERVADO)
   - El proyecto vuelve a BORRADOR
   - El responsable corrige las observaciones
   - Re-envia a revision

4. **Aprobacion** (APROBADO)
   - La autoridad competente aprueba el proyecto
   - Se registra la firma de aprobacion
   - El proyecto queda listo para ejecucion

## Endpoints del flujo

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | /api/v1/proyectos/{id}/enviar-revision/ | Envia proyecto a revision |
| POST | /api/v1/proyectos/{id}/aprobar/ | Aprueba el proyecto |
| POST | /api/v1/proyectos/{id}/rechazar/ | Devuelve a borrador |
| GET/POST | /api/v1/revisiones/ | CRUD de revisiones |
| GET/POST | /api/v1/flujos-validacion/ | CRUD de flujo de validacion |

## Reglas de negocio

- Solo BORRADOR puede enviarse a revision
- Solo EN_REVISION o EN_SUSPENSION pueden aprobarse
- Solo EN_REVISION puede rechazarse (devuelve a BORRADOR)
- Cada revision y validacion queda registrada para trazabilidad (RF-16)
