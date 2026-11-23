#!/usr/bin/env python3
"""Simulador de un ESP32 (DHT11 + MQ-135) para probar HU-27 sin hardware.

Envía una medición cada N segundos a POST /api/v1/iot/mediciones/ con
``Authorization: Device <token>``, con valores realistas que varían suavemente.

El token se lee de la variable de entorno IOT_DEVICE_TOKEN (nunca como argumento,
para que no quede en el historial de la terminal) y no se imprime completo.

Uso:
    export IOT_DEVICE_TOKEN='dv_...'          # el que mostró la pestaña Dispositivos
    python scripts/simulador_esp32.py
    python scripts/simulador_esp32.py --url https://<api>/api/v1/iot/mediciones/ --intervalo 60
    python scripts/simulador_esp32.py --sin-co2 --veces 5

Solo usa la biblioteca estándar de Python.
"""
import argparse
import json
import os
import random
import sys
import time
import urllib.error
import urllib.request

URL_POR_DEFECTO = 'http://127.0.0.1:8000/api/v1/iot/mediciones/'
VARIABLE_TOKEN = 'IOT_DEVICE_TOKEN'
INTERVALO_MINIMO = 30  # el backend acepta 1 medición cada 30 s por dispositivo


class Sensor:
	"""Paseo aleatorio que vuelve hacia un valor de referencia (sin saltos bruscos)."""

	def __init__(self, inicial, referencia, paso, minimo, maximo, decimales):
		self.valor = inicial
		self.referencia = referencia
		self.paso = paso
		self.minimo = minimo
		self.maximo = maximo
		self.decimales = decimales

	def leer(self):
		self.valor += 0.15 * (self.referencia - self.valor) + random.gauss(0, self.paso)
		self.valor = min(self.maximo, max(self.minimo, self.valor))
		return round(self.valor, self.decimales)


def enmascarar(token):
	return f'{token[:6]}…{token[-4:]}' if len(token) > 12 else '***'


def enviar(url, token, cuerpo, timeout=15):
	"""Devuelve (código HTTP, cuerpo JSON o texto, encabezados)."""
	peticion = urllib.request.Request(
		url,
		data=json.dumps(cuerpo).encode('utf-8'),
		method='POST',
		headers={
			'Content-Type': 'application/json',
			'Authorization': f'Device {token}',
			'User-Agent': 'simulador-esp32/1.0',
		},
	)
	try:
		with urllib.request.urlopen(peticion, timeout=timeout) as respuesta:
			return respuesta.status, json.loads(respuesta.read() or b'{}'), respuesta.headers
	except urllib.error.HTTPError as error:
		texto = error.read().decode('utf-8', 'replace')
		try:
			return error.code, json.loads(texto), error.headers
		except ValueError:
			return error.code, texto[:200], error.headers


def main():
	parser = argparse.ArgumentParser(description='Simula un ESP32 que envía mediciones ambientales.')
	parser.add_argument('--url', default=URL_POR_DEFECTO, help=f'Endpoint de mediciones (por defecto {URL_POR_DEFECTO})')
	parser.add_argument('--intervalo', type=float, default=INTERVALO_MINIMO, help='Segundos entre mediciones (por defecto 30)')
	parser.add_argument('--sin-co2', action='store_true', help='No enviar CO₂ (equipo sin MQ-135)')
	parser.add_argument('--veces', type=int, default=0, help='Cantidad de mediciones a enviar (0 = sin límite)')
	parser.add_argument('--semilla', type=int, help='Semilla aleatoria para repetir la misma serie')
	args = parser.parse_args()

	token = os.environ.get(VARIABLE_TOKEN, '').strip()
	if not token:
		sys.exit(f'Falta el token: exporte {VARIABLE_TOKEN}="dv_..." (se muestra al registrar el dispositivo).')
	if not token.startswith('dv_'):
		print(f'Aviso: el token no empieza con "dv_"; el servidor lo rechazará.', file=sys.stderr)
	if args.intervalo < INTERVALO_MINIMO:
		print(f'Aviso: con menos de {INTERVALO_MINIMO} s el servidor responderá 429 a parte de las mediciones.', file=sys.stderr)
	if args.semilla is not None:
		random.seed(args.semilla)

	temperatura = Sensor(23.0, 24.0, 0.25, -40, 80, 1)   # DHT11: ±2 °C
	humedad = Sensor(60.0, 62.0, 0.8, 0, 100, 0)          # DHT11: ±5 %, entero
	co2 = Sensor(520.0, 650.0, 12.0, 400, 2000, 0)         # MQ-135, ppm aproximado

	print(f'Enviando a {args.url} cada {args.intervalo:g} s con el token {enmascarar(token)}. Ctrl+C para salir.')
	enviadas = 0
	try:
		while args.veces == 0 or enviadas < args.veces:
			cuerpo = {'temperatura': temperatura.leer(), 'humedad': humedad.leer()}
			if not args.sin_co2:
				cuerpo['co2'] = co2.leer()
			hora = time.strftime('%H:%M:%S')
			try:
				codigo, respuesta, encabezados = enviar(args.url, token, cuerpo)
			except (urllib.error.URLError, TimeoutError, OSError) as error:
				print(f'[{hora}] sin conexión con el servidor ({error}); se reintenta en el siguiente ciclo')
			else:
				mensaje = respuesta.get('message', respuesta) if isinstance(respuesta, dict) else respuesta
				print(f'[{hora}] {cuerpo} -> {codigo} {mensaje}')
				if codigo == 401:
					sys.exit('Token inválido o dispositivo dado de baja: regenere el token y vuelva a exportarlo.')
				if codigo == 429:
					espera = float(encabezados.get('Retry-After') or INTERVALO_MINIMO)
					print(f'        el servidor pide esperar {espera:g} s')
					time.sleep(espera)
					continue
				enviadas += 1
			if args.veces == 0 or enviadas < args.veces:
				time.sleep(args.intervalo)
	except KeyboardInterrupt:
		print('\nSimulador detenido.')
	print(f'Mediciones aceptadas o procesadas: {enviadas}')


if __name__ == '__main__':
	main()
