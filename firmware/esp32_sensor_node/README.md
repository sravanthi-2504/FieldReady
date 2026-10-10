# ESP32 Field Sensor Node — AgriRhythm: FieldReady

Firmware and hardware integration guide for connecting an autonomous IoT microclimate sensor node to the **AgriRhythm: FieldReady** platform.

---

## 1. Hardware Bill of Materials (BOM)

| Component | Specification | Quantity | Purpose |
| :--- | :--- | :---: | :--- |
| **Microcontroller** | ESP32 DevKit V1 (30-pin or 38-pin, ESP-WROOM-32) | 1 | Sensor sampling, Wi-Fi connectivity, HTTP client |
| **Canopy Sensor** | DHT22 / AM2302 (or DHT11) | 1 | Microclimate ambient temperature & relative humidity |
| **Soil Moisture Sensor** | Capacitive Soil Moisture Sensor v1.2 (Corrosion resistant) | 1 | Root-zone volumetric soil moisture content |
| **Leaf Wetness Sensor** | Resistive Leaf Grid / Cellulose Impedance Sensor | 1 | Canopy leaf wetness duration measurement |
| **Resistor** | 10kΩ 1/4W Resistor | 1 | Pull-up resistor for DHT22 data line (if not built into module) |
| **Power Source** | 5V USB Power Bank or 3.7V 18650 Li-ion battery + boost shield | 1 | Field power delivery |
| **Jumper Wires** | Breadboard / DuPont wires (Male-to-Female, Male-to-Male) | 10 | Circuit interconnection |

---

## 2. Exact Hardware Wiring Table

> **CRITICAL ESP32 ADC LIMITATION:**
> The ESP32 has two ADC units: **ADC1** (GPIO 32–39) and **ADC2** (GPIO 0, 2, 4, 12–15, 25–27).
> When the Wi-Fi subsystem is active, **ADC2 is blocked and cannot be read by analogRead()**.
> Therefore, both analog sensors (**Soil Moisture** and **Leaf Wetness**) **MUST be connected to ADC1 pins** (GPIO 32 and GPIO 33).

| Sensor / Module | Sensor Pin | ESP32 Pin | Signal Type | Electrical Notes |
| :--- | :--- | :--- | :--- | :--- |
| **DHT22 (Temperature & Humidity)** | VCC / '+' | **3V3** (3.3V) | Power | 3.3V power rail |
| | GND / '-' | **GND** | Ground | Common ground |
| | DATA / 'OUT' | **GPIO 4** | Digital I/O | Standard GPIO with 10kΩ pull-up to 3.3V |
| **Capacitive Soil Moisture v1.2** | VCC | **3V3** (3.3V) | Power | 3.3V power rail (avoids 5V over-voltage on ADC) |
| | GND | **GND** | Ground | Common ground |
| | AOUT | **GPIO 32** | Analog In | Connected to **ADC1_CHANNEL_4** |
| **Leaf Wetness / Cellulose Sensor** | VCC | **3V3** (3.3V) | Power | 3.3V power rail |
| | GND | **GND** | Ground | Common ground |
| | SIG / AOUT | **GPIO 33** | Analog In | Connected to **ADC1_CHANNEL_5** |
| **Status Indicator** | Built-in LED | **GPIO 2** | Digital Out | Visual feedback for Wi-Fi and transmission status |

---

## 3. Required Arduino Libraries & Board Settings

### Arduino IDE Board Manager
1. Open **Arduino IDE** -> **Settings / Preferences**.
2. Add this URL to *Additional Boards Manager URLs*:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Open **Tools** -> **Board** -> **Boards Manager**, search for `esp32` by Espressif Systems, and click **Install** (v2.0.14 or v3.0.x).

### Required Libraries (Tools -> Manage Libraries...)
1. **DHT sensor library** by Adafruit (Version `1.4.6` or higher)
2. **Adafruit Unified Sensor** by Adafruit (Version `1.1.14` or higher)
3. **ArduinoJson** by Benoit Blanchon (Version `6.21.4` or `7.x`)

### Board Settings in Tools Menu
- **Board:** `DOIT ESP32 DEVKIT V1` (or `ESP32 Dev Module`)
- **Upload Speed:** `115200` (or `921600` for faster flashing)
- **CPU Frequency:** `240MHz (WiFi/BT)`
- **Flash Frequency:** `80MHz`
- **Flash Mode:** `QIO`
- **Flash Size:** `4MB (32Mb)`
- **Partition Scheme:** `Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)`
- **Core Debug Level:** `None` (or `Info` for debugging)
- **Port:** Select `/dev/cu.usbserial-*` or `/dev/cu.wchusbserial*` (macOS)

---

## 4. Configuration Instructions (`config.h`)

Open `config.h` in Arduino IDE and set:
```cpp
#define WIFI_SSID       "YourWiFiNetwork"     // 2.4GHz Wi-Fi network name
#define WIFI_PASSWORD   "YourWiFiPassword"    // Wi-Fi password
#define SERVER_HOST     "192.168.x.x"         // Laptop local IPv4 address
#define SERVER_PORT     8008                  // Backend port
#define FIELD_ID        "field-demo-01"       // Field ID to associate telemetry with
```

---

## 5. Uploading Firmware to ESP32 (macOS)

1. Connect the ESP32 to your Mac with a data-capable Micro-USB / USB-C cable.
2. Check available serial ports:
   ```bash
   ls /dev/cu.usb*
   # Example output: /dev/cu.usbserial-0001
   ```
3. In Arduino IDE:
   - Select port `/dev/cu.usbserial-0001`.
   - Click **Upload** (Ctrl + U / Cmd + U).
   - If you see `Connecting........_____.....`: Press and hold the **BOOT** button on the ESP32 for 2 seconds until flashing begins.
4. Once flashed, open **Tools -> Serial Monitor** and set baud rate to **115200**.
5. Observe the boot sequence, Wi-Fi connection, and HTTP POST transmission messages.
