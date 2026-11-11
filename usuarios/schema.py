# Describe en Swagger (drf-spectacular) la autenticacion con tokens de auth-service.
from drf_spectacular.extensions import OpenApiAuthenticationExtension


class AuthServiceJWTScheme(OpenApiAuthenticationExtension):
	target_class = 'usuarios.autenticacion.AuthServiceJWTAuthentication'
	name = 'jwtAuth'

	def get_security_definition(self, auto_schema):
		return {'type': 'http', 'scheme': 'bearer', 'bearerFormat': 'JWT'}
