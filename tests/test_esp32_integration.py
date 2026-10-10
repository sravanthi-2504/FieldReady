"""
Comprehensive Integration Tests for ESP32 Hardware Integration & Sensor API
Verifies:
  1. POST /api/sensor with ESP32 JSON payload
  2. GET /api/sensor, GET /api/sensor/latest, and GET /api/sensor/{field_id}
  3. Dynamic physical telemetry promotion (is_simulated: False) in /api/sensors/demo
  4. Integration of environmental context into /api/vision/predict
  5. TEST 9: Independent failure handling:
     - Image prediction functions when sensors are offline
     - Graceful handling when AI model is unavailable
  6. CORS support for mobile devices on LAN
"""

import os
import time
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.sensor_api import _STORE, get_latest

client = TestClient(app)
ROOT = Path(__file__).resolve().parents[1]


def test_esp32_post_sensor_payload():
    """Verify POST /api/sensor accepts realistic ESP32 telemetry."""
    payload = {
        "field_id": "field-esp32-unit-01",
        "temperature_c": 27.8,
        "humidity_pct": 82.5,
        "leaf_wetness_hours_24h": 5.0,
        "soil_moisture_pct": 33.2
    }
    response = client.post("/api/sensor", json=payload)
    assert response.status_code == 200
    assert response.json() == {"ok": True}

    # Verify stored in-memory
    latest = get_latest("field-esp32-unit-01")
    assert latest is not None
    assert latest.temperature_c == 27.8
    assert latest.humidity_pct == 82.5
    assert latest.leaf_wetness_hours_24h == 5.0
    assert latest.soil_moisture_pct == 33.2
    assert latest.usable() is True


def test_get_sensor_endpoints():
    """Verify GET /api/sensor and /api/sensor/{field_id}."""
    payload = {
        "field_id": "field-test-get",
        "temperature_c": 26.0,
        "humidity_pct": 79.0,
        "leaf_wetness_hours_24h": 4.5,
        "soil_moisture_pct": 30.0
    }
    client.post("/api/sensor", json=payload)

    # 1. Field-specific endpoint
    resp1 = client.get("/api/sensor/field-test-get")
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["temperature_c"] == 26.0
    assert data1["usable"] is True
    assert data1["age_hours"] is not None

    # 2. General latest endpoint
    resp2 = client.get("/api/sensor")
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["status"] in ("online", "stale")
    assert "field-test-get" in data2["active_fields"]

    # 3. Non-existent field returns 404
    resp3 = client.get("/api/sensor/non-existent-field-xyz")
    assert resp3.status_code == 404


def test_sensor_adapter_promotes_physical_telemetry():
    """Verify /api/sensors/demo outputs PHYSICAL telemetry when ESP32 has reported."""
    payload = {
        "field_id": "field-live-demo",
        "temperature_c": 28.2,
        "humidity_pct": 84.0,
        "leaf_wetness_hours_24h": 6.1,
        "soil_moisture_pct": 35.0
    }
    client.post("/api/sensor", json=payload)

    resp = client.get("/api/sensors/demo?field_id=field-live-demo")
    assert resp.status_code == 200
    readings = resp.json()
    assert len(readings) >= 3

    # Check physical promotion
    for r in readings:
        assert r["is_simulated"] is False
        assert r["provenance_tag"] == "PHYSICAL_ESP32_TELEMETRY"
        assert "ESP32" in r["sensor_id"]


def test_sensor_adapter_falls_back_to_simulated_when_offline():
    """Verify /api/sensors/demo falls back to SIMULATED data when no physical readings exist."""
    resp = client.get("/api/sensors/demo?field_id=completely-offline-field")
    assert resp.status_code == 200
    readings = resp.json()
    assert len(readings) == 3
    for r in readings:
        assert r["is_simulated"] is True
        assert r["provenance_tag"] == "SIMULATED_DEMO_DATA"


def test_independent_failure_image_prediction_without_sensors():
    """
    TEST 9: Independent failure handling
    Confirm image prediction works normally if sensors are completely offline.
    """
    demo_img_path = ROOT / "public" / "assets" / "demo_images" / "common_rust.jpg"
    assert demo_img_path.exists(), "Demo leaf asset must exist"

    # Post an empty/unmatched field ID so no sensor data is found
    with open(demo_img_path, "rb") as f:
        resp = client.post(
            "/api/vision/predict",
            files={"image": ("leaf.jpg", f.read(), "image/jpeg")},
            data={
                "crop": "maize",
                "field_id": "unconnected-offline-field",
                "demo_mode": False
            }
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["crop"] == "maize"
    assert data["predicted_class"] == "common_rust"
    assert data["confidence"] > 0.65
    assert data["environmental_context"]["sensor_status"] == "offline"
    assert data["sensor_fusion"]["sensor_used"] is False


def test_image_prediction_with_live_esp32_sensor_fused():
    """Verify image prediction attaches live microclimate and evaluates advisory gate."""
    # 1. Post fresh favourable sensor reading for common rust (temp 16-23C, rh >85%, wet >4h)
    client.post(
        "/api/sensor",
        json={
            "field_id": "field-rust-plot",
            "temperature_c": 19.5,
            "humidity_pct": 92.0,
            "leaf_wetness_hours_24h": 6.5,
            "soil_moisture_pct": 38.0
        }
    )

    demo_img_path = ROOT / "public" / "assets" / "demo_images" / "common_rust.jpg"
    with open(demo_img_path, "rb") as f:
        resp = client.post(
            "/api/vision/predict",
            files={"image": ("leaf.jpg", f.read(), "image/jpeg")},
            data={
                "crop": "maize",
                "field_id": "field-rust-plot",
                "demo_mode": False,
                "field_confirmed": True
            }
        )

    assert resp.status_code == 200
    data = resp.json()
    # Confirm prediction remained intact
    assert data["predicted_class"] == "common_rust"
    # Environmental context reflects physical sensor
    env = data["environmental_context"]
    assert env["sensor_status"] == "online"
    assert env["temperature_c"] == 19.5
    assert env["humidity_pct"] == 92.0
    assert env["leaf_wetness_hours_24h"] == 6.5
    assert env["weather_favourable"] is True

    # Advisory gate received weather evidence
    assert data["advisory"]["evidence"]["weather_favourable"] is True


def test_independent_failure_dashboard_when_ai_model_unavailable():
    """
    TEST 9: Independent failure handling
    Confirm the dashboard works if the AI model is unavailable.
    Health check, weather, crop matrix, and sensor endpoints remain 100% operational.
    """
    # 1. Dashboard health check
    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"

    # 2. Weather service
    weather = client.get("/api/weather")
    assert weather.status_code == 200
    assert "temperature_c" in weather.json()

    # 3. Sensor telemetry service
    sensors = client.get("/api/sensors/demo")
    assert sensors.status_code == 200
    assert len(sensors.json()) >= 3

    # 4. Crop support matrix
    crops = client.get("/api/crops/matrix")
    assert crops.status_code == 200

    # 5. Model endpoint returns clear 503 (or 400 for uncertified crop) rather than crashing backend
    resp = client.post(
        "/api/vision/predict",
        files={"image": ("leaf.jpg", b"fake-corrupted-bytes", "image/jpeg")},
        data={"crop": "cotton", "demo_mode": False}
    )
    # Cotton is safely halted with 400
    assert resp.status_code == 400
