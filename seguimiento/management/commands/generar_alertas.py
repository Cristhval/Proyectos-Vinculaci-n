from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from proyectos.models import Actividad, EstadoActividad
from convenios.models import Convenio, EstadoConvenio, Compromiso, EstadoCompromiso
from usuarios.models import Usuario, RolUsuario
from seguimiento.alertas_generator import generar_alerta


class Command(BaseCommand):
    help = 'Genera alertas automaticas para actividades, convenios y compromisos proximos a vencer.'

    def handle(self, *args, **options):
        hoy = timezone.now().date()
        alertas_creadas = 0
        faltantes = []

        # ------------------------------------------------------------------
        # 1. Actividades proximas a vencer
        # ------------------------------------------------------------------
        actividades = Actividad.objects.filter(
            estado__in=[EstadoActividad.EN_PROCESO, EstadoActividad.PENDIENTE],
            fecha_fin__gte=hoy,
            fecha_fin__lte=hoy + timedelta(days=7),
        ).select_related('proyecto', 'responsable')

        for act in actividades:
            dias_restantes = (act.fecha_fin - hoy).days
            prioridad = 'ALTA' if dias_restantes <= 3 else 'MEDIA'
            mensaje = f'La actividad "{act.nombre}" vence en {dias_restantes} días'

            # Evitar duplicados: verificar si ya existe alerta PENDIENTE para esta actividad
            # (usamos el proyecto y un mensaje similar como proxy)
            from seguimiento.models import Alerta, EstadoAlerta
            ya_existe = Alerta.objects.filter(
                proyecto=act.proyecto,
                estado=EstadoAlerta.PENDIENTE,
                mensaje=mensaje,
            ).exists()
            if ya_existe:
                continue

            # Alertar al responsable de la actividad
            if act.responsable:
                a = generar_alerta(
                    usuario=act.responsable,
                    mensaje=mensaje,
                    prioridad=prioridad,
                    proyecto=act.proyecto,
                    fecha_vencimiento=act.fecha_fin,
                    enlace=f'/{act.responsable.rol.lower()}/proyectos/{act.proyecto.id}',
                )
                if a:
                    alertas_creadas += 1

            # Alertar al responsable del proyecto
            if act.proyecto and act.proyecto.responsable and act.proyecto.responsable != act.responsable:
                a = generar_alerta(
                    usuario=act.proyecto.responsable,
                    mensaje=mensaje,
                    prioridad=prioridad,
                    proyecto=act.proyecto,
                    fecha_vencimiento=act.fecha_fin,
                    enlace=f'/{act.proyecto.responsable.rol.lower()}/proyectos/{act.proyecto.id}',
                )
                if a:
                    alertas_creadas += 1

        self.stdout.write(self.style.SUCCESS(f'Actividades procesadas: {actividades.count()}'))

        # ------------------------------------------------------------------
        # 2. Convenios proximos a vencer
        # ------------------------------------------------------------------
        # Nota: el modelo Convenio no tiene campo responsable_unl.
        # Como fallback, alertamos a todos los COORDINADORES.
        try:
            convenios = Convenio.objects.filter(
                estado=EstadoConvenio.VIGENTE,
                fecha_fin__gte=hoy,
                fecha_fin__lte=hoy + timedelta(days=30),
            )

            coordinadores = list(Usuario.objects.filter(rol=RolUsuario.COORDINADOR))
            if not coordinadores:
                coordinadores = list(Usuario.objects.filter(rol=RolUsuario.ADMIN))

            for conv in convenios:
                dias_restantes = (conv.fecha_fin - hoy).days
                mensaje = f'El convenio {conv.codigo} vence en {dias_restantes} días'

                from seguimiento.models import Alerta, EstadoAlerta
                ya_existe = Alerta.objects.filter(
                    convenio=conv,
                    estado=EstadoAlerta.PENDIENTE,
                    mensaje=mensaje,
                ).exists()
                if ya_existe:
                    continue

                for coord in coordinadores:
                    a = generar_alerta(
                        usuario=coord,
                        mensaje=mensaje,
                        prioridad='ALTA' if dias_restantes <= 7 else 'MEDIA',
                        convenio=conv,
                        fecha_vencimiento=conv.fecha_fin,
                        enlace=f'/{coord.rol.lower()}/convenios/{conv.id}',
                    )
                    if a:
                        alertas_creadas += 1

            self.stdout.write(self.style.SUCCESS(f'Convenios procesados: {convenios.count()}'))
        except Exception as e:
            faltantes.append(f'Convenios: {e}')
            self.stdout.write(self.style.WARNING(f'Error procesando convenios: {e}'))

        # ------------------------------------------------------------------
        # 3. Compromisos pendientes proximos a vencer
        # ------------------------------------------------------------------
        compromisos = Compromiso.objects.filter(
            estado__in=[EstadoCompromiso.PENDIENTE, EstadoCompromiso.EN_PROCESO],
            fecha_vencimiento__gte=hoy,
            fecha_vencimiento__lte=hoy + timedelta(days=7),
        ).select_related('convenio', 'responsable')

        for comp in compromisos:
            dias_restantes = (comp.fecha_vencimiento - hoy).days
            mensaje = f'El compromiso {comp.codigo} vence en {dias_restantes} días'

            from seguimiento.models import Alerta, EstadoAlerta
            ya_existe = Alerta.objects.filter(
                convenio=comp.convenio,
                estado=EstadoAlerta.PENDIENTE,
                mensaje=mensaje,
            ).exists()
            if ya_existe:
                continue

            if comp.responsable:
                a = generar_alerta(
                    usuario=comp.responsable,
                    mensaje=mensaje,
                    prioridad='ALTA' if dias_restantes <= 3 else 'MEDIA',
                    convenio=comp.convenio,
                    fecha_vencimiento=comp.fecha_vencimiento,
                    enlace=f'/{comp.responsable.rol.lower()}/convenios/{comp.convenio.id}',
                )
                if a:
                    alertas_creadas += 1

        self.stdout.write(self.style.SUCCESS(f'Compromisos procesados: {compromisos.count()}'))

        # ------------------------------------------------------------------
        # Resumen
        # ------------------------------------------------------------------
        self.stdout.write('')
        self.stdout.write('=' * 50)
        self.stdout.write(self.style.SUCCESS(f'[OK] {alertas_creadas} alertas nuevas generadas'))
        self.stdout.write('=' * 50)

        if faltantes:
            self.stdout.write('')
            self.stdout.write(self.style.WARNING('Faltantes detectados:'))
            for f in faltantes:
                self.stdout.write(self.style.WARNING(f'  - {f}'))
        else:
            self.stdout.write(self.style.SUCCESS('[OK] No se detectaron faltantes.'))
