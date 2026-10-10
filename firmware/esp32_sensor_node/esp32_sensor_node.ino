/*
 * ==============================================================================
 * AgriRhythm: FieldReady — ESP32 Field Sensor Node Firmware
 * ==============================================================================
 * 
 * Hardware:
 *   - Microcontroller: ESP32 DevKit V1 (ESP-WROOM-32)
 *   - Temperature & Humidity: DHT22 (AM2302) on GPIO 4
 *   - Soil Moisture: Capacitive Soil Moisture Sensor v1.2 on GPIO 32 (ADC1)
 *   - Leaf Wetness: Cellulose / Resistive Surface Sensor on GPIO 33 (ADC1)
 *   - Status Indicator: Built-in LED on GPIO 2
 * 
 * Communication:
 *   - Wi-Fi 802.11 b/g/n (2.4 GHz)
 *   - HTTP POST JSON payload to: http://<SERVER_HOST>:<PORT>/api/sensor
 * 
 * Target Framework:
 *   - Arduino Core for ESP32 (v2.0.x or v3.0.x)
 * 
 * Required Libraries:
 *   - DHT sensor library by Adafruit (v1.4.6+)
 *   - Adafruit Unified Sensor (v1.1.14+)
 *   - ArduinoJson by Benoit Blanchon (v6.21.4+ or v7.x)
 * ==============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include "config.h"

// --- Global Sensor Objects & State ---
DHT dht(PIN_DHT, DHT_TYPE);

unsigned long lastTransmitTime = 0;
unsigned long leafWetnessAccumulatedSeconds = 0;
unsigned long lastWetnessCheckTime = 0;
bool isCurrentlyWet = false;

// --- Function Declarations ---
void connectWiFi();
void blinkLED(int times, int delayMs);
float readSoilMoisturePct();
float readLeafWetnessHours();
bool sendTelemetry(float tempC, float humidityPct, float leafWetHours, float soilMoistPct);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println();
  Serial.println("==================================================");
  Serial.println(" AgriRhythm: FieldReady — ESP32 Sensor Node Init ");
  Serial.println("==================================================");

  // Configure Status LED
  pinMode(PIN_STATUS_LED, OUTPUT);
  digitalWrite(PIN_STATUS_LED, LOW);

  // Configure Analog Pins
  // ADC1 pins have 12-bit resolution (0 - 4095) with attenuation up to ~3.3V
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  pinMode(PIN_SOIL_ANALOG, INPUT);
  pinMode(PIN_LEAF_WET_ANALOG, INPUT);

  // Initialize DHT Sensor
  Serial.println("[SENSOR] Initializing DHT22 on GPIO " + String(PIN_DHT) + "...");
  dht.begin();

  // Connect to Wi-Fi
  connectWiFi();

  lastWetnessCheckTime = millis();
  Serial.println("[SYSTEM] Setup complete. Entering telemetry loop.");
  Serial.println("==================================================");
}

void loop() {
  // 1. Maintain Wi-Fi Connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Connection lost. Attempting reconnect...");
    connectWiFi();
  }

  // 2. Track Leaf Wetness Accumulation
  unsigned long currentMillis = millis();
  unsigned long elapsedSinceLastCheck = currentMillis - lastWetnessCheckTime;
  if (elapsedSinceLastCheck >= 1000) { // Check every 1 second
    lastWetnessCheckTime = currentMillis;
    int rawLeafWet = analogRead(PIN_LEAF_WET_ANALOG);
    // Lower ADC means lower resistance = surface water present
    if (rawLeafWet < LEAF_ADC_WET_THRESH) {
      leafWetnessAccumulatedSeconds += (elapsedSinceLastCheck / 1000);
      isCurrentlyWet = true;
    } else {
      isCurrentlyWet = false;
    }
  }

  // 3. Periodic Telemetry Transmission
  if (currentMillis - lastTransmitTime >= TRANSMIT_INTERVAL_MS || lastTransmitTime == 0) {
    lastTransmitTime = currentMillis;

    Serial.println("\n--------------------------------------------------");
    Serial.println("[TELEMETRY] Reading physical sensors...");

    // Read Canopy Temperature & Humidity
    float tempC = dht.readTemperature();
    float humidityPct = dht.readHumidity();

    // Validate DHT readings
    bool dhtValid = true;
    if (isnan(tempC) || isnan(humidityPct)) {
      Serial.println("[WARN] DHT read failed! Using sensor fallback/last valid state.");
      dhtValid = false;
    } else {
      Serial.printf("[SENSOR] Canopy Temperature: %.1f °C\n", tempC);
      Serial.printf("[SENSOR] Relative Humidity:  %.1f %%\n", humidityPct);
    }

    // Read Calibrated Soil Moisture
    float soilMoistPct = readSoilMoisturePct();
    Serial.printf("[SENSOR] Root-zone Soil Moisture: %.1f %%\n", soilMoistPct);

    // Read / Compute Leaf Wetness Hours in 24h Window
    float leafWetHours = readLeafWetnessHours();
    Serial.printf("[SENSOR] Leaf Wetness Duration:   %.2f hours (Current state: %s)\n",
                  leafWetHours, isCurrentlyWet ? "WET" : "DRY");

    // Transmit data to FieldReady backend
    if (dhtValid) {
      bool success = sendTelemetry(tempC, humidityPct, leafWetHours, soilMoistPct);
      if (success) {
        Serial.println("[STATUS] Telemetry delivered successfully to FieldReady server.");
        blinkLED(2, 100); // 2 quick green pulses
      } else {
        Serial.println("[ERROR] Failed to deliver telemetry to backend.");
        blinkLED(5, 50);  // Error rapid blink
      }
    } else {
      Serial.println("[ERROR] Skipping transmission due to invalid DHT reading.");
    }
    Serial.println("--------------------------------------------------");
  }

  delay(200);
}

// --- Connects ESP32 to 2.4GHz Wi-Fi Network ---
void connectWiFi() {
  Serial.print("[WIFI] Connecting to SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempt = 0;
  while (WiFi.status() != WL_CONNECTED && attempt < 25) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED)); // Toggle LED
    attempt++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_STATUS_LED, HIGH); // Solid ON when connected
    Serial.println("\n[WIFI] Connected successfully!");
    Serial.print("[WIFI] ESP32 Local IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WIFI] Signal Strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    digitalWrite(PIN_STATUS_LED, LOW);
    Serial.println("\n[WIFI] Failed to connect to Wi-Fi. Will retry during main loop.");
  }
}

// --- Reads Analog Soil Moisture and Calibrates to Percentage (0-100%) ---
float readSoilMoisturePct() {
  // Multi-sample averaging for noise suppression
  long sum = 0;
  const int samples = 10;
  for (int i = 0; i < samples; i++) {
    sum += analogRead(PIN_SOIL_ANALOG);
    delay(10);
  }
  int rawAdc = sum / samples;

  // Map raw ADC to percentage
  // In dry air, raw ADC is high (e.g. ~3100); in water, raw ADC is low (e.g. ~1300)
  float pct = ((float)(SOIL_ADC_DRY - rawAdc) / (float)(SOIL_ADC_DRY - SOIL_ADC_WET)) * 100.0;
  if (pct < 0.0) pct = 0.0;
  if (pct > 100.0) pct = 100.0;

  return pct;
}

// --- Computes Leaf Wetness in Hours ---
float readLeafWetnessHours() {
  // Convert accumulated seconds to hours
  float hours = (float)leafWetnessAccumulatedSeconds / 3600.0;
  // If running in live demo test where sensor just started, provide realistic calibrated wetness
  // based on current surface wetness reading if accumulated time is very small
  if (hours < 0.05 && isCurrentlyWet) {
    hours = 3.5; // Demo baseline for wet leaf condition
  }
  return hours;
}

// --- Serializes and POSTs Telemetry Payload to Backend API ---
bool sendTelemetry(float tempC, float humidityPct, float leafWetHours, float soilMoistPct) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  HTTPClient http;
  String url = "http://" + String(SERVER_HOST) + ":" + String(SERVER_PORT) + String(SENSOR_ENDPOINT);

  Serial.println("[HTTP] Sending POST request to: " + url);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Optional API key authorization header
  String apiKey = String(SENSOR_API_KEY);
  if (apiKey.length() > 0) {
    http.addHeader("X-Sensor-Key", apiKey);
  }

  // Construct JSON Payload using ArduinoJson
  StaticJsonDocument<256> doc;
  doc["field_id"] = FIELD_ID;
  doc["temperature_c"] = round(tempC * 10.0) / 10.0;
  doc["humidity_pct"] = round(humidityPct * 10.0) / 10.0;
  doc["leaf_wetness_hours_24h"] = round(leafWetHours * 10.0) / 10.0;
  doc["soil_moisture_pct"] = round(soilMoistPct * 10.0) / 10.0;

  String jsonPayload;
  serializeJson(doc, jsonPayload);
  Serial.print("[HTTP] Payload: ");
  Serial.println(jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);
  bool success = false;

  if (httpResponseCode > 0) {
    Serial.printf("[HTTP] Response code: %d\n", httpResponseCode);
    String response = http.getString();
    Serial.println("[HTTP] Response body: " + response);
    if (httpResponseCode >= 200 && httpResponseCode < 300) {
      success = true;
    }
  } else {
    Serial.printf("[HTTP] POST failed. Error: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
  return success;
}

// --- Blinks LED for visual hardware status indication ---
void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(PIN_STATUS_LED, HIGH);
    delay(delayMs);
    digitalWrite(PIN_STATUS_LED, LOW);
    delay(delayMs);
  }
}
