"""
Sensor Integration Architecture & Demo Adapter for AgriRhythm: FieldReady
Defines the sensor telemetry interface. Provides simulated demonstration telemetry
clearly labeled as non-physical demo data to satisfy Section 12 rules.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

class SensorAdapter:
    """Base interface for IoT sensor ingestion (MQTT / LoRaWAN / HTTP)."""
    def get_readings(self, field_id: Optional[str] = None) -> List[Dict[str, Any]]:
        raise NotImplementedError

class DemoSensorAdapter(SensorAdapter):
    """
    Hybrid sensor adapter for testing and physical IoT integration.
    If physical telemetry from the ESP32 node is available in sensor_api, it returns
    verified physical telemetry with is_simulated=False.
    If no physical sensor has reported, it gracefully serves simulated telemetry
    with is_simulated=True per Section 12 rules.
    """
    def get_readings(self, field_id: Optional[str] = None) -> List[Dict[str, Any]]:
        try:
            from backend.app.sensor_api import get_latest
            r = get_latest(field_id)
        except Exception:
            r = None

        if r is not None and r.usable():
            now_iso = (
                datetime.fromtimestamp(r.taken_at, timezone.utc).isoformat()
                if r.taken_at else datetime.now(timezone.utc).isoformat()
            )
            fid = field_id or "field-demo-01"
            readings = []
            if r.temperature_c is not None:
                readings.append({
                    "sensor_id": "ESP32-CANOPY-TEMP-01",
                    "parameter": "Canopy Air Temperature",
                    "value": round(float(r.temperature_c), 1),
                    "unit": "°C",
                    "timestamp": now_iso,
                    "field_id": fid,
                    "is_simulated": False,
                    "provenance_tag": "PHYSICAL_ESP32_TELEMETRY",
                    "disclaimer": "Live physical microclimate reading from ESP32 field sensor node."
                })
            if r.humidity_pct is not None:
                readings.append({
                    "sensor_id": "ESP32-CANOPY-HUMID-02",
                    "parameter": "Relative Air Humidity",
                    "value": round(float(r.humidity_pct), 1),
                    "unit": "% RH",
                    "timestamp": now_iso,
                    "field_id": fid,
                    "is_simulated": False,
                    "provenance_tag": "PHYSICAL_ESP32_TELEMETRY",
                    "disclaimer": "Live physical microclimate reading from ESP32 field sensor node."
                })
            if r.leaf_wetness_hours_24h is not None:
                readings.append({
                    "sensor_id": "ESP32-LEAF-WET-03",
                    "parameter": "Leaf Wetness Duration",
                    "value": round(float(r.leaf_wetness_hours_24h), 1),
                    "unit": "hours",
                    "timestamp": now_iso,
                    "field_id": fid,
                    "is_simulated": False,
                    "provenance_tag": "PHYSICAL_ESP32_TELEMETRY",
                    "disclaimer": "Live physical microclimate reading from ESP32 field sensor node."
                })
            if r.soil_moisture_pct is not None:
                readings.append({
                    "sensor_id": "ESP32-SOIL-MOIST-04",
                    "parameter": "Root-Zone Soil Moisture (15cm)",
                    "value": round(float(r.soil_moisture_pct), 1),
                    "unit": "% Volumetric",
                    "timestamp": now_iso,
                    "field_id": fid,
                    "is_simulated": False,
                    "provenance_tag": "PHYSICAL_ESP32_TELEMETRY",
                    "disclaimer": "Live physical microclimate reading from ESP32 field sensor node."
                })
            if readings:
                return readings

        # Graceful fallback: simulated demonstration telemetry
        now_iso = datetime.now(timezone.utc).isoformat()
        return [
            {
                "sensor_id": "DEMO-CANOPY-TEMP-01",
                "parameter": "Canopy Air Temperature",
                "value": 29.4,
                "unit": "°C",
                "timestamp": now_iso,
                "field_id": field_id or "demo-field-01",
                "is_simulated": True,
                "provenance_tag": "SIMULATED_DEMO_DATA",
                "disclaimer": "SIMULATED DEMO DATA — NOT A REAL SENSOR MEASUREMENT."
            },
            {
                "sensor_id": "DEMO-LEAF-WET-02",
                "parameter": "Leaf Wetness Duration",
                "value": 4.2,
                "unit": "hours",
                "timestamp": now_iso,
                "field_id": field_id or "demo-field-01",
                "is_simulated": True,
                "provenance_tag": "SIMULATED_DEMO_DATA",
                "disclaimer": "SIMULATED DEMO DATA — NOT A REAL SENSOR MEASUREMENT."
            },
            {
                "sensor_id": "DEMO-SOIL-MOIST-03",
                "parameter": "Root-Zone Soil Moisture (15cm)",
                "value": 28.5,
                "unit": "% Volumetric",
                "timestamp": now_iso,
                "field_id": field_id or "demo-field-01",
                "is_simulated": True,
                "provenance_tag": "SIMULATED_DEMO_DATA",
                "disclaimer": "SIMULATED DEMO DATA — NOT A REAL SENSOR MEASUREMENT."
            }
        ]

