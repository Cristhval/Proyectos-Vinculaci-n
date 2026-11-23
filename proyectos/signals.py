"""Señales propias de proyectos (patrón Observer).

``monitoreo_cambiado`` se emite desde ``ProyectoMonitoreoService`` cada vez que
cambia ``Proyecto.monitoreo_activo`` (HU-18). Quien emite no conoce a los
observadores: la auditoría (auditoria/signals.py) y las notificaciones
(seguimiento/notificaciones.py) se suscriben por su cuenta.

Argumentos: ``proyecto``, ``anterior`` (bool), ``nuevo`` (bool),
``usuario`` (perfil que hizo el cambio o None) y ``request`` (o None).
"""
from django.dispatch import Signal

monitoreo_cambiado = Signal()
