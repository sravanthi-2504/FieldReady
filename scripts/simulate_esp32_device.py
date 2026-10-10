#!/usr/bin/env python3
"""
AgriRhythm: FieldReady — ESP32 Telemetry Device Simulator
Simulates physical ESP32 field hardware streaming microclimate readings to the backend.
Useful for testing Wi-Fi HTTP reception and frontend telemetry updates before flashing physical board.

Usage:
    python3 scripts/simulate_esp32_device.py [--host 20.20.18.25] [--port 8008] [--interval 10]
"""

import sys
import time
import random
import argparse
import urllib.request
import json

def run_simulation(host: str, port: int, field_id: str, interval: int, api_key: str = None, count: int = 0):
    url = f"http://{host}:{port}/api/sensor"
    print("=" * 60)
    print(f" AgriRhythm: FieldReady — ESP32 Sensor Node Simulator")
    print("=" * 60)
    print(f" Target Endpoint: {url}")
    print(f" Field ID:        {field_id}")
    print(f" Interval:        {interval} seconds")
    print(f" Press Ctrl+C to stop simulation.")
    print("=" * 60)

    # Base values
    base_temp = 28.0
    base_humid = 82.0
    base_wetness = 4.5
    base_soil = 32.0

    iterations = 0
    while True:
        try:
            # Simulate realistic microclimate fluctuations
            temp = round(base_temp + random.uniform(-1.5, 1.5), 1)
            humid = round(base_humid + random.uniform(-4.0, 4.0), 1)
            humid = max(10.0, min(100.0, humid))
            wetness = round(base_wetness + random.uniform(-0.5, 0.8), 1)
            wetness = max(0.0, min(24.0, wetness))
            soil = round(base_soil + random.uniform(-2.0, 2.0), 1)
            soil = max(0.0, min(100.0, soil))

            payload = {
                "field_id": field_id,
                "temperature_c": temp,
                "humidity_pct": humid,
                "leaf_wetness_hours_24h": wetness,
                "soil_moisture_pct": soil
            }

            json_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=json_data,
                headers={"Content-Type": "application/json"}
            )
            if api_key:
                req.add_header("X-Sensor-Key", api_key)

            t0 = time.time()
            with urllib.request.urlopen(req, timeout=5) as resp:
                status_code = resp.status
                body = resp.read().decode("utf-8")
                elapsed_ms = round((time.time() - t0) * 1000, 1)

            print(f"[{time.strftime('%H:%M:%S')}] HTTP {status_code} ({elapsed_ms}ms) -> Temp: {temp}°C | RH: {humid}% | Wetness: {wetness}h | Soil: {soil}%")
            iterations += 1
            if count > 0 and iterations >= count:
                print(f"[COMPLETED] Sent {iterations} simulated ESP32 transmissions.")
                break

            time.sleep(interval)
        except urllib.error.URLError as e:
            print(f"[{time.strftime('%H:%M:%S')}] Connection Error: {e.reason}. Is the backend running on {host}:{port}?")
            time.sleep(interval)
        except KeyboardInterrupt:
            print("\nSimulation stopped by user.")
            break

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simulate ESP32 field telemetry for AgriRhythm")
    parser.add_argument("--host", default="127.0.0.1", help="Backend host IP (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8008, help="Backend port (default: 8008)")
    parser.add_argument("--field", default="field-demo-01", help="Field ID (default: field-demo-01)")
    parser.add_argument("--interval", type=int, default=10, help="Transmission interval in seconds (default: 10)")
    parser.add_argument("--key", default=None, help="Optional SENSOR_API_KEY header")
    parser.add_argument("--count", type=int, default=0, help="Number of packets to send (0 = infinite)")

    args = parser.parse_args()
    run_simulation(args.host, args.port, args.field, args.interval, args.key, args.count)
