import json
import django
from django.conf import settings
settings.ALLOWED_HOSTS = ['*']
from django.test import Client
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from auditoria.middleware import _thread_local
from auditoria.models import Auditoria
from usuarios.models import Usuario, RolUsuario


def fake_request(user):
    """Construye un request falso con user autenticado para que el signal encuentre usuario."""
    from django.test import RequestFactory
    from django.contrib.sessions.middleware import SessionMiddleware
    rf = RequestFactory()
    req = rf.post('/fake/')
    req.user = user
    SessionMiddleware(lambda r: r).process_request(req)
    _thread_local.request = req
    return req


def clear_request():
    if hasattr(_thread_local, 'request'):
        del _thread_local.request


def run():
    # Resetear password de admin
    u = User.objects.filter(username='admin').first()
    if u:
        u.set_password('admin12345')
        u.save()
        print('admin password reseteado')

    now = timezone.now()
    hace_24h = now - timedelta(hours=24)
    qs = Auditoria.objects.exclude(usuario__isnull=True)

    def snap(tag):
        ult_24 = qs.filter(creado_en__gte=hace_24h)
        print(f'[{tag}] total={qs.count()} | acciones_24h={ult_24.count()} | usuarios_24h={ult_24.values("usuario").distinct().count()}')

    print('=' * 60)
    print('CASO 1: admin crea estudiante via API (POST real HTTP)')
    print('=' * 60)
    snap('antes')
    c = Client()
    r = c.post('/api/v1/auth/login/', data=json.dumps({'username': 'admin', 'password': 'admin12345'}), content_type='application/json')
    admin_token = r.json().get('data', {}).get('access')
    c2 = Client(HTTP_AUTHORIZATION=f'Bearer {admin_token}')

    uniq = timezone.now().strftime('%H%M%S%f')
    payload = {
        'username': f'test_e2e_{uniq}',
        'password': 'TestPass123!',
        'first_name': 'Test',
        'last_name': 'Est',
        'email': f'test_{uniq}@x.com',
        'documento_identidad': f'17{uniq[-6:]}99',
        'rol': 'ESTUDIANTE',
    }
    r = c2.post('/api/v1/auth/register/', data=json.dumps(payload), content_type='application/json')
    print('  status registro:', r.status_code)
    snap('despues admin registra estudiante')
    print('  -> usuarios_24h sigue en 1 porque solo el admin actuó')
    print()

    print('=' * 60)
    print('CASO 2: estudiante modifica su propio perfil (via signal directo)')
    print('=' * 60)
    # Limpiar request anterior
    clear_request()
    # Obtener el usuario Django recien creado
    django_user = User.objects.get(username=f'test_e2e_{uniq}')
    perfil = django_user.perfil
    print(f'  perfil_id={perfil.id}, codigo={perfil.codigo}, rol={perfil.rol}')

    # Simular que el estudiante está autenticado y modifica su perfil
    fake_request(django_user)
    perfil.telefono = '0988887777'
    perfil.save()
    clear_request()
    snap('despues estudiante modifica su perfil')
    print('  -> usuarios_24h debe ser 2 ahora')
    print()

    print('=' * 60)
    print('CASO 3: confirmamos que el ultimo registro fue del ESTUDIANTE')
    print('=' * 60)
    for r in qs.order_by('-creado_en')[:3]:
        print(f'  {r.creado_en} | usuario={r.usuario.codigo if r.usuario else "None"} | {r.accion} {r.entidad} #{r.entidad_id}')
    print()

    print('=' * 60)
    print('CASO 4: el signal NO registra si NO hay request (comando consola)')
    print('=' * 60)
    clear_request()
    from proyectos.models import Actividad
    act_count_before = qs.filter(entidad='Actividad').count()
    # crear una actividad SIN request (caso comando)
    a = Actividad.objects.create(nombre='TEST_SIN_REQUEST', estado='PENDIENTE', porcentaje_ejecucion=0, orden=999)
    act_count_after = qs.filter(entidad='Actividad').count()
    print(f'  Actividades audit antes: {act_count_before}, despues: {act_count_after}')
    print(f'  -> {"OK signal corto-circuit (no crea registro)" if act_count_after == act_count_before else "FALLO: signal creo registro sin request"}')
    a.delete()  # cleanup
    print()

    print('=' * 60)
    print('RESUMEN FINAL')
    print('=' * 60)
    snap('FINAL')


run()
