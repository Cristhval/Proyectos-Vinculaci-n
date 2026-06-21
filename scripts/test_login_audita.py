import json
import django
from django.conf import settings
settings.ALLOWED_HOSTS = ['*']
from django.test import Client
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from auditoria.models import Auditoria


def run():
    u = User.objects.filter(username='admin').first()
    if u:
        u.set_password('admin12345')
        u.save()

    now = timezone.now()
    hace_24h = now - timedelta(hours=24)
    qs = Auditoria.objects.exclude(usuario__isnull=True)

    def snap(tag):
        ult_24 = qs.filter(creado_en__gte=hace_24h)
        print(f'  [{tag}] total={qs.count()} | acciones_24h={ult_24.count()} | usuarios_24h={ult_24.values("usuario").distinct().count()}')

    print('=' * 70)
    print('PASO 1: login admin via API')
    print('=' * 70)
    c = Client()
    r = c.post('/api/v1/auth/login/', data=json.dumps({'username': 'admin', 'password': 'admin12345'}), content_type='application/json')
    print('  status:', r.status_code)
    snap('admin acaba de loguearse')
    print()

    print('=' * 70)
    print('PASO 2: admin crea estudiante via API')
    print('=' * 70)
    admin_token = r.json().get('data', {}).get('access')
    c2 = Client(HTTP_AUTHORIZATION=f'Bearer {admin_token}')
    uniq = timezone.now().strftime('%H%M%S%f')
    payload = {
        'username': f'e2e_login_{uniq}',
        'password': 'TestPass123!',
        'first_name': 'Test',
        'last_name': 'Login',
        'email': f'test_{uniq}@x.com',
        'documento_identidad': f'17{uniq[-6:]}99',
        'rol': 'ESTUDIANTE',
    }
    r = c2.post('/api/v1/auth/register/', data=json.dumps(payload), content_type='application/json')
    print('  status registro:', r.status_code)
    snap('admin creo estudiante')
    print()

    print('=' * 70)
    print('PASO 3: ESTUDIANTE inicia sesion')
    print('=' * 70)
    c3 = Client()
    r = c3.post('/api/v1/auth/login/', data=json.dumps({'username': f'e2e_login_{uniq}', 'password': 'TestPass123!'}), content_type='application/json')
    print('  status login estudiante:', r.status_code)
    snap('estudiante acaba de loguearse')
    print()

    print('=' * 70)
    print('PASO 4: ultimos 5 registros de auditoria')
    print('=' * 70)
    for r in qs.order_by('-creado_en')[:5]:
        actor = r.usuario.codigo if r.usuario else 'None'
        print(f'  {r.creado_en.strftime("%H:%M:%S")} | {actor:<15} | {r.accion:<20} | {r.entidad} #{r.entidad_id}')
    print()

    print('=' * 70)
    print('PASO 5: /auditoria/registros/stats/ (consumido por admin)')
    print('=' * 70)
    c4 = Client(HTTP_AUTHORIZATION=f'Bearer {admin_token}')
    r = c4.get('/api/v1/auditoria/registros/stats/')
    print('  status:', r.status_code, '| payload:', r.json() if r.status_code == 200 else r.content)
    print()

    print('=' * 70)
    print('CONCLUSION')
    print('=' * 70)
    ult_24 = qs.filter(creado_en__gte=hace_24h)
    usuarios = ult_24.values('usuario').distinct().count()
    if usuarios >= 2:
        print(f'  [OK] usuarios_24h = {usuarios} (admin + estudiante)')
    else:
        print(f'  [FALLO] usuarios_24h = {usuarios}, esperaba >= 2')


run()
