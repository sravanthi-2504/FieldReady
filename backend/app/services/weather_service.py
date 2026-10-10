"""
Weather Service for AgriRhythm: FieldReady
Integrates with Open-Meteo public API with offline resilience and transparent provenance tagging.
Distinguishes meteorological weather estimates from in-situ soil/leaf sensor readings.
"""

import time
import json
import urllib.request
from datetime import datetime, timezone
from typing import Dict, Any

class WeatherService:
    def __init__(self):
        # Default coordinates: Hyderabad / Telangana agricultural zone (17.3850° N, 78.4867° E)
        self.default_lat = 17.3850
        self.default_lon = 78.4867
        self.default_location = "Hyderabad / Telangana Maize Belt"

    def get_weather(self, lat: float = None, lon: float = None) -> Dict[str, Any]:
        latitude = lat if lat is not None else self.default_lat
        longitude = lon if lon is not None else self.default_lon
        location_name = "Field Location" if lat is not None else self.default_location

        url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=auto"

        now_iso = datetime.now(timezone.utc).isoformat()

        try:
            req = urllib.request.Request(url, headers={"User-Agent": "AgriRhythm-FieldReady/1.0"})
            with urllib.request.urlopen(req, timeout=3.5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                current = data.get("current", {})

                temp_c = current.get("temperature_2m", 28.5)
                humidity = current.get("relative_humidity_2m", 72.0)
                precip = current.get("precipitation", 0.0)
                wind = current.get("wind_speed_10m", 9.4)
                code = current.get("weather_code", 0)

                cond = "Clear / Sunny"
                if code in [1, 2, 3]:
                    cond = "Partly Cloudy"
                elif code in [51, 53, 55, 61, 63, 65]:
                    cond = "Rain / Showers"
                elif code in [95, 96]:
                    cond = "Thunderstorm"

                return {
                    "temperature_c": round(float(temp_c), 1),
                    "relative_humidity_pct": round(float(humidity), 1),
                    "precipitation_mm": round(float(precip), 1),
                    "wind_speed_kmh": round(float(wind), 1),
                    "weather_condition": cond,
                    "provenance": "EXTERNAL_OPEN_METEO_API",
                    "retrieval_time": now_iso,
                    "is_live_api": True,
                    "location_name": location_name,
                    "disclaimer": "Regional weather estimate from Open-Meteo. Not a calibrated leaf-canopy or root-zone measurement."
                }
        except Exception as e:
            # Resilient fallback with honest provenance
            return {
                "temperature_c": 28.0,
                "relative_humidity_pct": 74.0,
                "precipitation_mm": 0.0,
                "wind_speed_kmh": 8.5,
                "weather_condition": "Partly Cloudy (Cached)",
                "provenance": "OFFLINE_CACHED_ESTIMATE",
                "retrieval_time": now_iso,
                "is_live_api": False,
                "location_name": f"{location_name} (Offline / Network Unavailable)",
                "disclaimer": "Offline estimation fallback. Weather network endpoint was unreachable; do not use for critical irrigation decisions."
            }
