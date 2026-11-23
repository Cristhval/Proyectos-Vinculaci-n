// Plantilla de configuración del firmware esp32_sensores.
//
// 1. Copie este archivo como config.h en la misma carpeta:
//      cp config.example.h config.h
// 2. Complete sus datos. config.h está en .gitignore: NUNCA lo suba al repositorio
//    (contiene la clave del Wi-Fi y el token del dispositivo).

#pragma once

// --- Wi-Fi --------------------------------------------------------------------
#define WIFI_SSID      "nombre-de-la-red"
#define WIFI_PASSWORD  "clave-de-la-red"

// --- API ------------------------------------------------------------------------
// Endpoint completo de mediciones (HTTPS en producción).
#define API_URL        "https://su-backend.onrender.com/api/v1/iot/mediciones/"
// Token que mostró la pestaña "Dispositivos" al registrar o regenerar (empieza con dv_).
#define DEVICE_TOKEN   "dv_reemplazar_por_el_token"

// Certificado raíz de la CA del servidor (PEM) para validar HTTPS.
// Si lo deja comentado, la conexión va cifrada pero SIN verificar el certificado
// (aceptable para pruebas, no para producción).
// #define ROOT_CA_PEM "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n"

// --- Tiempos --------------------------------------------------------------------
// Cada cuánto se lee el sensor (ms). El servidor acepta 1 medición cada 30 s por
// dispositivo; con 60 s queda margen para vaciar la cola tras un corte.
#define INTERVALO_LECTURA_MS  60000UL
// Separación mínima entre dos envíos (ms). No bajar de 30000 (el servidor responde 429).
#define INTERVALO_ENVIO_MS    31000UL

// --- Pines y sensores -------------------------------------------------------------
#define DHT_PIN    4        // Datos del DHT11
#define DHT_TYPE   DHT11

// MQ-135 (CO₂). Comente USAR_MQ135 si el equipo no lo tiene.
#define USAR_MQ135
#define MQ135_PIN       34      // Entrada analógica (ADC1: GPIO32-39; ADC2 no funciona con Wi-Fi)
#define MQ135_RL_KOHM   10.0    // Resistencia de carga del módulo (mídala: muchos módulos traen 1 kΩ)
#define MQ135_R0_KOHM   76.63   // Resistencia en aire limpio: OBTÉNGALA con el modo calibración
#define MQ135_VCC       5.0     // Tensión con la que se alimenta el sensor
#define MQ135_DIVISOR   (2.0 / 3.0)  // Divisor de tensión entre AOUT y el ESP32 (ver .ino)

// Descomente para que el equipo NO envíe datos y solo imprima por Serial el R0 medido.
// #define MQ135_MODO_CALIBRACION

// --- Cola local -----------------------------------------------------------------
// Lecturas que se guardan mientras no hay Wi-Fi o el servidor no responde.
#define TAMANO_COLA  30
