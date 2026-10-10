#ifndef CONFIG_H
#define CONFIG_H

// ==============================================================================
// AgriRhythm: FieldReady — ESP32 Sensor Node Configuration
// ==============================================================================

// --- Wi-Fi Network Credentials ---
// Change these to your local 2.4GHz Wi-Fi access point (e.g., your home router or phone hotspot)
#define WIFI_SSID       "YOUR_WIFI_SSID"
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"

// --- FieldReady Backend Server Configuration ---
// Replace with the IPv4 address of your laptop running the backend
// Port 8008 is the default port for AgriRhythm: FieldReady backend
#define SERVER_HOST     "20.20.18.25"
#define SERVER_PORT     8008
#define SENSOR_ENDPOINT "/api/sensor"

// Optional authentication header: matches SENSOR_API_KEY in backend environment
// Leave as empty string "" if authentication is disabled in backend
#define SENSOR_API_KEY  ""

// --- Field Identification ---
// Matches the field ID created in the FieldReady dashboard or default field
#define FIELD_ID        "field-demo-01"

// --- Transmission Timing ---
// Sampling & HTTP POST interval in milliseconds
// 15000 ms (15 sec) for real-time live demonstrations; 300000 ms (5 min) for battery field use
#define TRANSMIT_INTERVAL_MS  15000

// --- Hardware GPIO Pin Allocations (ESP32 DevKit V1) ---
// IMPORTANT: Analog sensors MUST use ADC1 pins (GPIO 32-39) because ADC2 is disabled during Wi-Fi transmission.
#define PIN_DHT               4    // Digital I/O for DHT22 / DHT11
#define PIN_SOIL_ANALOG       32   // ADC1_CH4 for Soil Moisture Sensor
#define PIN_LEAF_WET_ANALOG   33   // ADC1_CH5 for Leaf Wetness / Cellulose Sensor
#define PIN_STATUS_LED        2    // On-board LED for visual status indicator

// Sensor Type: Set to DHT22 or DHT11
#define DHT_TYPE              DHT22

// --- Calibration Thresholds (12-bit ADC: 0 - 4095 @ 3.3V) ---
// Soil Moisture Sensor Calibration (tune by taking dry air and water cup readings)
#define SOIL_ADC_DRY          3100  // ADC reading in completely dry air (0% moisture)
#define SOIL_ADC_WET          1300  // ADC reading immersed in wet soil / water (100% moisture)

// Leaf Wetness Sensor Calibration
#define LEAF_ADC_DRY          3800  // High resistance when leaf surface is dry
#define LEAF_ADC_WET_THRESH   2400  // ADC reading below which leaf is considered "wet"

#endif // CONFIG_H
