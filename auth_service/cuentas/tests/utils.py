from cuentas.models import Cuenta


def crear_cuenta(username='u', password='Clave.Segura1', rol='ESTUDIANTE', email=None, **extra):
	return Cuenta.objects.create_user(
		username=username,
		password=password,
		email=email or f'{username}@unl.edu.ec',
		rol=rol,
		**extra,
	)


def autenticar(client, cuenta):
	from cuentas.servicios.tokens import EmisorTokens
	tokens = EmisorTokens.emitir(cuenta)
	client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')
	return tokens
