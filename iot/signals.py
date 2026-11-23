"""Señales propias de IoT (patrón Observer).

``dispositivo_accion`` se emite en las acciones que no son un guardado normal:
la baja y la regeneración del token. La auditoría se suscribe en
auditoria/signals.py. Nunca se envía el token: solo el dispositivo y la acción.

Argumentos: ``dispositivo``, ``accion`` (TipoAccion.BAJA o REGENERAR_TOKEN),
``usuario`` (perfil o None) y ``request`` (o None).
"""
from django.dispatch import Signal

dispositivo_accion = Signal()
