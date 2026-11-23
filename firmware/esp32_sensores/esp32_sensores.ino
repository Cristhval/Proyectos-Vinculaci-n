/*
 * esp32_sensores — Módulo 2 (IoT) del Sistema de Gestión de Proyectos de Vinculación (UNL)
 *
 * ESP32 + DHT11 (temperatura y humedad) + MQ-135 (CO₂ aproximado).
 * Envía cada lectura por HTTPS a POST /api/v1/iot/mediciones/ con el encabezado
 *   Authorization: Device <token>
 *
 * Funciones:
 *  - Lectura cada INTERVALO_LECTURA_MS (config.h).
 *  - Cola local (anillo de TAMANO_COLA lecturas) para cortes de Wi-Fi o del servidor.
 *  - Reconexión del Wi-Fi con espera creciente; al reconectar se reintenta la cola de inmediato.
 *  - Respeta el límite del servidor (1 medición cada 30 s): envía como máximo una lectura
 *    cada INTERVALO_ENVIO_MS. Con lectura cada 60 s, la cola se vacía tras un corte.
 *  - El token nunca se imprime por Serial.
 *
 * Importante: el servidor registra la HORA DE RECEPCIÓN (el ESP32 no tiene reloj confiable),
 * así que las lecturas que esperaron en la cola quedan con la hora en que llegaron.
 *
 * Bibliotecas (Gestor de bibliotecas de Arduino IDE):
 *  - "DHT sensor library" de Adafruit (instala también "Adafruit Unified Sensor").
 *  - Placa: "esp32" de Espressif (core 2.x o 3.x). WiFi, HTTPClient y WiFiClientSecure vienen con el core.
 *
 * Configuración: copie config.example.h como config.h y complételo. config.h NO se sube a git.
 *
 * ---------------------------------------------------------------------------------------------
 * CONEXIONES
 *  DHT11:  VCC → 3V3, GND → GND, DATA → GPIO4 (DHT_PIN). Resistencia pull-up de 10 kΩ DATA–VCC
 *          si el módulo no la trae.
 *  MQ-135: VCC → 5V (VIN), GND → GND, AOUT → divisor de tensión → GPIO34 (MQ135_PIN).
 *          El ADC del ESP32 admite como máximo ~3,3 V y el módulo entrega hasta 5 V:
 *          use un divisor, p. ej. 10 kΩ (AOUT→pin) y 20 kΩ (pin→GND), que da un factor 2/3
 *          (MQ135_DIVISOR). Use un pin de ADC1 (GPIO32–39): ADC2 no funciona con el Wi-Fi activo.
 *
 * ---------------------------------------------------------------------------------------------
 * MQ-135: CÁLCULO Y CALIBRACIÓN (léalo antes de confiar en los ppm)
 *
 *  1) Tensión en AOUT:      Vout = V_pin / MQ135_DIVISOR
 *  2) Resistencia del sensor: Rs = RL · (Vcc − Vout) / Vout          (RL = MQ135_RL_KOHM)
 *  3) Concentración de CO₂:  ppm = a · (Rs / R0)^b,  con a = 110.47 y b = −2.862
 *     (ajuste de la curva de CO₂ de la hoja de datos de Hanwei, a 20 °C y 65 % HR).
 *
 *  R0 es la resistencia del sensor en aire limpio y CAMBIA de un sensor a otro, por eso hay
 *  que calibrarlo:
 *   a. Precaliente el sensor nuevo 24–48 h alimentado (la primera vez). En cada arranque
 *      espere al menos 2–3 min antes de tomar valores.
 *   b. Descomente MQ135_MODO_CALIBRACION en config.h, cargue el programa y deje el equipo
 *      al aire libre (o junto a una ventana abierta), lejos de personas y combustión.
 *   c. El monitor serie (115200 baudios) muestra R0 suponiendo ~420 ppm de CO₂ exterior.
 *      Cuando el valor se estabilice, cópielo en MQ135_R0_KOHM, vuelva a comentar el modo
 *      calibración y cargue de nuevo.
 *
 *  SIN CALIBRAR, EL VALOR EN PPM ES SOLO APROXIMADO. Aun calibrado, el MQ-135 no es un sensor
 *  de CO₂ selectivo (también reacciona a NH₃, alcohol, benceno, humo) y depende de la
 *  temperatura y la humedad: úselo para ver tendencias (ventilación de un aula, invernadero),
 *  no como medición certificada. Para valores exactos se necesita un sensor NDIR (p. ej. SCD40).
 * ---------------------------------------------------------------------------------------------
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <DHT.h>
#include <math.h>

#include "config.h"   // Copie config.example.h como config.h (no se sube a git)

// Curva de CO₂ del MQ-135 (ver encabezado).
static const float MQ135_A = 110.47f;
static const float MQ135_B = -2.862f;
static const float CO2_EXTERIOR_PPM = 420.0f;   // referencia para calibrar R0
static const unsigned long PRECALENTAMIENTO_MS = 120000UL;  // 2 min sin enviar CO₂ tras arrancar

// Rangos que acepta el backend (fuera de ellos responde 400).
static const float TEMP_MIN = -40, TEMP_MAX = 80;
static const float HUM_MIN = 0, HUM_MAX = 100;
static const float CO2_MIN = 0, CO2_MAX = 10000;

DHT dht(DHT_PIN, DHT_TYPE);

// ------------------------------------------------------------------ Cola local (anillo)
struct Lectura {
  float temperatura, humedad, co2;
  bool hayTemperatura, hayHumedad, hayCo2;
};

static Lectura cola[TAMANO_COLA];
static int colaInicio = 0;
static int colaCantidad = 0;

void encolar(const Lectura &l) {
  if (colaCantidad == TAMANO_COLA) {
    // Cola llena: se descarta la más antigua para conservar las más recientes.
    colaInicio = (colaInicio + 1) % TAMANO_COLA;
    colaCantidad--;
    Serial.println(F("[cola] llena: se descartó la lectura más antigua"));
  }
  cola[(colaInicio + colaCantidad) % TAMANO_COLA] = l;
  colaCantidad++;
}

Lectura *primeraDeLaCola() { return colaCantidad ? &cola[colaInicio] : nullptr; }

void quitarPrimera() {
  if (!colaCantidad) return;
  colaInicio = (colaInicio + 1) % TAMANO_COLA;
  colaCantidad--;
}

// ------------------------------------------------------------------ Sensores
float leerVoltajeMq135() {
  // analogReadMilliVolts usa la calibración de fábrica del ADC (más exacto que analogRead).
  uint32_t suma = 0;
  for (int i = 0; i < 10; i++) {
    suma += analogReadMilliVolts(MQ135_PIN);
    delay(5);
  }
  float vPin = (suma / 10.0f) / 1000.0f;
  return vPin / MQ135_DIVISOR;   // tensión real en AOUT
}

float resistenciaMq135(float vout) {
  if (vout <= 0.01f) return NAN;
  return MQ135_RL_KOHM * (MQ135_VCC - vout) / vout;
}

float co2Ppm() {
  float rs = resistenciaMq135(leerVoltajeMq135());
  if (isnan(rs) || rs <= 0) return NAN;
  return MQ135_A * powf(rs / MQ135_R0_KOHM, MQ135_B);
}

bool enRango(float v, float minimo, float maximo) { return !isnan(v) && v >= minimo && v <= maximo; }

bool tomarLectura(Lectura &l) {
  l.temperatura = dht.readTemperature();
  l.humedad = dht.readHumidity();
  l.hayTemperatura = enRango(l.temperatura, TEMP_MIN, TEMP_MAX);
  l.hayHumedad = enRango(l.humedad, HUM_MIN, HUM_MAX);
  if (!l.hayTemperatura || !l.hayHumedad) Serial.println(F("[dht11] lectura inválida (revise el cableado)"));

  l.co2 = NAN;
  l.hayCo2 = false;
#ifdef USAR_MQ135
  if (millis() > PRECALENTAMIENTO_MS) {
    l.co2 = co2Ppm();
    l.hayCo2 = enRango(l.co2, CO2_MIN, CO2_MAX);
    if (!l.hayCo2) Serial.println(F("[mq135] valor fuera de rango: se omite el CO₂ de esta lectura"));
  }
#endif
  return l.hayTemperatura || l.hayHumedad || l.hayCo2;
}

// ------------------------------------------------------------------ Wi-Fi
static unsigned long ultimoIntentoWifi = 0;
static unsigned long esperaWifi = 5000;
static bool wifiConectado = false;
static unsigned long ultimoEnvio = 0;
static bool hayEnvioPrevio = false;

void conectarWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  ultimoIntentoWifi = millis();
  Serial.printf("[wifi] conectando a \"%s\"...\n", WIFI_SSID);
}

void vigilarWifi() {
  bool ahora = WiFi.status() == WL_CONNECTED;
  if (ahora && !wifiConectado) {
    Serial.printf("[wifi] conectado, IP %s. Reintentando la cola (%d pendientes)\n",
                  WiFi.localIP().toString().c_str(), colaCantidad);
    esperaWifi = 5000;
    hayEnvioPrevio = false;   // reintento inmediato de la cola al reconectar
  } else if (!ahora && wifiConectado) {
    Serial.println(F("[wifi] conexión perdida: las lecturas se guardan en la cola"));
  }
  wifiConectado = ahora;

  if (!ahora && millis() - ultimoIntentoWifi > esperaWifi) {
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    ultimoIntentoWifi = millis();
    esperaWifi = min(esperaWifi * 2, 60000UL);   // espera creciente hasta 1 min
    Serial.printf("[wifi] reintentando (próximo intento en %lu s)\n", esperaWifi / 1000);
  }
}

// ------------------------------------------------------------------ Envío HTTP(S)
static bool tokenRechazado = false;
static unsigned long pausaHasta = 0;

String aJson(const Lectura &l) {
  String json = "{";
  bool coma = false;
  if (l.hayTemperatura) { json += "\"temperatura\":" + String(l.temperatura, 1); coma = true; }
  if (l.hayHumedad) { json += String(coma ? "," : "") + "\"humedad\":" + String(l.humedad, 0); coma = true; }
  if (l.hayCo2) { json += String(coma ? "," : "") + "\"co2\":" + String(l.co2, 0); }
  return json + "}";
}

int enviar(const Lectura &l) {
  WiFiClientSecure clienteSeguro;
  WiFiClient clientePlano;
  HTTPClient http;
  bool https = String(API_URL).startsWith("https://");

  if (https) {
#ifdef ROOT_CA_PEM
    clienteSeguro.setCACert(ROOT_CA_PEM);
#else
    clienteSeguro.setInsecure();   // cifrado sin verificar certificado: defina ROOT_CA_PEM en producción
#endif
    if (!http.begin(clienteSeguro, API_URL)) return -1;
  } else {
    if (!http.begin(clientePlano, API_URL)) return -1;
  }
  http.setTimeout(15000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Device ") + DEVICE_TOKEN);

  String cuerpo = aJson(l);
  int codigo = http.POST(cuerpo);
  String respuesta = codigo > 0 ? http.getString() : http.errorToString(codigo);
  http.end();

  Serial.printf("[api] %s -> %d %s\n", cuerpo.c_str(), codigo, respuesta.c_str());
  return codigo;
}

void procesarCola() {
  if (tokenRechazado || !wifiConectado || millis() < pausaHasta) return;
  if (hayEnvioPrevio && millis() - ultimoEnvio < INTERVALO_ENVIO_MS) return;
  Lectura *l = primeraDeLaCola();
  if (!l) return;

  int codigo = enviar(*l);
  ultimoEnvio = millis();
  hayEnvioPrevio = true;

  switch (codigo) {
    case 201:   // aceptada
      quitarPrimera();
      break;
    case 400:   // el servidor la rechazó por sus datos: reintentarla no sirve
      Serial.println(F("[api] lectura rechazada (400): se descarta"));
      quitarPrimera();
      break;
    case 401:   // token inválido o dispositivo dado de baja
      tokenRechazado = true;
      Serial.println(F("[api] 401: token inválido o dispositivo dado de baja. Actualice DEVICE_TOKEN en config.h y vuelva a cargar el programa."));
      break;
    case 403:   // monitoreo del proyecto desactivado
      Serial.println(F("[api] 403: el monitoreo del proyecto está desactivado. Se descarta y se reintenta en 5 min."));
      quitarPrimera();
      pausaHasta = millis() + 300000UL;
      break;
    case 429:   // demasiado pronto: se conserva y se reintenta en el siguiente turno
      Serial.println(F("[api] 429: se reintentará en el siguiente turno de envío"));
      break;
    default:    // sin conexión (<0), 5xx u otro: se conserva en la cola
      Serial.printf("[api] error %d: la lectura queda en la cola (%d pendientes)\n", codigo, colaCantidad);
      break;
  }
}

// ------------------------------------------------------------------ Programa
static unsigned long ultimaLectura = 0;
static bool hayLecturaPrevia = false;

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println(F("\n== esp32_sensores (Módulo 2 IoT) =="));
  dht.begin();
#ifdef USAR_MQ135
  analogReadResolution(12);
  analogSetPinAttenuation(MQ135_PIN, ADC_11db);   // rango ~0–3,1 V en el pin
#endif

#ifdef MQ135_MODO_CALIBRACION
  Serial.println(F("MODO CALIBRACIÓN MQ-135: no se envían datos. Deje el sensor al aire libre."));
#else
  conectarWifi();
#endif
}

void loop() {
#ifdef MQ135_MODO_CALIBRACION
  float rs = resistenciaMq135(leerVoltajeMq135());
  float r0 = rs / powf(CO2_EXTERIOR_PPM / MQ135_A, 1.0f / MQ135_B);
  Serial.printf("Rs = %.2f kΩ  ->  R0 (a %.0f ppm) = %.2f kΩ%s\n", rs, CO2_EXTERIOR_PPM, r0,
                millis() < PRECALENTAMIENTO_MS ? "  (precalentando, aún no es confiable)" : "");
  delay(5000);
  return;
#endif

  vigilarWifi();

  if (!hayLecturaPrevia || millis() - ultimaLectura >= INTERVALO_LECTURA_MS) {
    ultimaLectura = millis();
    hayLecturaPrevia = true;
    Lectura l;
    if (tomarLectura(l)) {
      encolar(l);
      Serial.printf("[lectura] T=%.1f °C  H=%.0f %%  CO2=%s  (en cola: %d)\n",
                    l.temperatura, l.humedad, l.hayCo2 ? String(l.co2, 0).c_str() : "-", colaCantidad);
    }
  }

  procesarCola();
  delay(200);
}
