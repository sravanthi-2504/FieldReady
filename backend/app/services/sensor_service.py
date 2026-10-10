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
    Simulated sensor adapter for testing and examiner presentation.
    Explicitly flags data provenance as simulated.
    """
    def get_readings(self, field_id: Optional[str] = None) -> List[Dict[str, Any]]:
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
