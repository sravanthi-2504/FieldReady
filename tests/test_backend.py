"""
Automated Backend Test Suite for AgriRhythm: FieldReady
Validates all endpoints, quality checks, PyTorch inference, crop protection, and sync.
"""

import os
import io
import pytest
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def create_synthetic_leaf_image(color=(34, 139, 34), draw_spots=True, size=(300, 300)):
    img = Image.new("RGB", size, color=color)
    draw = ImageDraw.Draw(img)
    if draw_spots:
        # draw textured spots to produce high Laplacian variance (sharp)
        for i in range(20, 280, 20):
            draw.rectangle([i, i, i + 10, i + 10], fill=(139, 69, 19))
            draw.line([i, 10, i, 290], fill=(200, 200, 50), width=2)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def create_dark_image(size=(300, 300)):
    img = Image.new("RGB", size, color=(10, 10, 10))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert "maize" in data["supported_crops"]

def test_crop_support_matrix():
    response = client.get("/api/crops/matrix")
    assert response.status_code == 200
    data = response.json()
    crops = data.get("crops", {})
    assert "maize" in crops
    assert crops["maize"]["status"] == "supported"
    assert crops["cotton"]["status"] == "extension_ready"

def test_quality_check_good_image():
    good_img = create_synthetic_leaf_image(draw_spots=True)
    response = client.post(
        "/api/vision/quality-check",
        files={"image": ("leaf.jpg", good_img, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["passed"] is True
    assert data["status"] == "passed"
    assert "en" in data["farmer_feedback"]
    assert "te" in data["farmer_feedback"]
    assert "hi" in data["farmer_feedback"]

def test_quality_check_dark_image():
    dark_img = create_dark_image()
    response = client.post(
        "/api/vision/quality-check",
        files={"image": ("dark.jpg", dark_img, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["passed"] is False
    assert data["lighting_status"] == "too_dark"

def test_model_inference_with_real_demo_asset():
    # Use authentic PlantVillage sample generated during dataset prep
    sample_path = "public/assets/demo_images/common_rust.jpg"
    if os.path.exists(sample_path):
        with open(sample_path, "rb") as f:
            img_bytes = f.read()
    else:
        img_bytes = create_synthetic_leaf_image()

    response = client.post(
        "/api/vision/predict",
        files={"image": ("rust.jpg", img_bytes, "image/jpeg")},
        data={"crop": "maize", "demo_mode": "false"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["crop"] == "maize"
    assert "predicted_class" in data
    assert "confidence" in data
    assert len(data["all_probabilities"]) == 4
    assert data["source_mode"] == "model_inference"
    assert "differential_possibilities" in data
    assert "management_guidance" in data
    assert "official_source" in data["management_guidance"]

def test_unsupported_crop_refusal():
    # Cotton must NOT receive a fabricated prediction
    img_bytes = create_synthetic_leaf_image()
    response = client.post(
        "/api/vision/predict",
        files={"image": ("cotton.jpg", img_bytes, "image/jpeg")},
        data={"crop": "cotton", "demo_mode": "false"}
    )
    assert response.status_code == 400
    detail = response.json()["detail"].lower()
    assert "not certified" in detail or "not model-supported" in detail

def test_weather_endpoint_and_provenance():
    response = client.get("/api/weather")
    assert response.status_code == 200
    data = response.json()
    assert "temperature_c" in data
    assert "relative_humidity_pct" in data
    assert "provenance" in data
    assert "disclaimer" in data

def test_banana_model_inference():
    sample_path = "public/assets/demo_images/banana_black_sigatoka.jpg"
    if os.path.exists(sample_path):
        with open(sample_path, "rb") as f:
            img_bytes = f.read()
    else:
        img_bytes = create_synthetic_leaf_image()

    response = client.post(
        "/api/vision/predict",
        files={"image": ("banana.jpg", img_bytes, "image/jpeg")},
        data={"crop": "banana", "demo_mode": "false"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["crop"] == "banana"
    assert "predicted_class" in data
    assert len(data["all_probabilities"]) == 3
    assert data["source_mode"] == "model_inference"

def test_crop_verification_gate_foliage():
    # 1. Valid leaf foliage pass
    good_img = create_synthetic_leaf_image(color=(34, 139, 34), draw_spots=True)
    resp = client.post(
        "/api/vision/verify-crop",
        files={"image": ("leaf.jpg", good_img, "image/jpeg")},
        data={"crop": "maize"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_plant_leaf"] is True
    assert data["foliage_coverage_pct"] >= 15.0
    assert data["decision"] in ["require_farmer_confirmation", "proceed"]

    # 2. Non-leaf rejection (e.g. black image with < 15% foliage)
    dark_img = create_dark_image()
    resp_dark = client.post(
        "/api/vision/verify-crop",
        files={"image": ("dark.jpg", dark_img, "image/jpeg")},
        data={"crop": "maize"}
    )
    assert resp_dark.status_code == 200
    dark_data = resp_dark.json()
    assert dark_data["is_plant_leaf"] is False
    assert dark_data["decision"] == "reject_not_leaf"

    # 3. Unsupported crop halt (cotton)
    resp_cotton = client.post(
        "/api/vision/verify-crop",
        files={"image": ("leaf.jpg", good_img, "image/jpeg")},
        data={"crop": "cotton"}
    )
    assert resp_cotton.status_code == 200
    cotton_data = resp_cotton.json()
    assert cotton_data["decision"] == "halt_unsupported"

def test_localized_guidance_structure():
    good_img = create_synthetic_leaf_image()
    response = client.post(
        "/api/vision/predict",
        files={"image": ("leaf.jpg", good_img, "image/jpeg")},
        data={"crop": "maize", "demo_mode": "false"}
    )
    assert response.status_code == 200
    guidance = response.json()["management_guidance"]
    assert "summary" in guidance
    assert "te" in guidance["summary"]
    assert "hi" in guidance["summary"]
    assert "en" in guidance["summary"]
    assert "immediate_actions" in guidance
    assert "te" in guidance["immediate_actions"]
    assert "hi" in guidance["immediate_actions"]
    assert "reinspect_days" in guidance
    assert "chemical_advice" in guidance

def test_sensor_demo_disclaimer():
    response = client.get("/api/sensors/demo")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    for reading in data:
        assert reading["is_simulated"] is True
        assert "SIMULATED DEMO DATA" in reading["disclaimer"]

def test_sync_records():
    payload = {
        "client_id": "test-farmer-device-01",
        "synced_at": "2026-10-10T00:00:00Z",
        "fields": [
            {
                "id": "field-test-01",
                "name": "North Acre Plot",
                "crop": "maize",
                "planting_date": "2026-06-15",
                "acreage": 2.5,
                "created_at": "2026-10-09T10:00:00Z",
                "notes": "Testing field creation"
            }
        ],
        "inspections": [
            {
                "id": "insp-test-01",
                "field_id": "field-test-01",
                "crop": "maize",
                "visited_at": "2026-10-09T11:00:00Z",
                "sample_count": 20,
                "symptomatic_count": 4,
                "uncertain_count": 1,
                "predicted_condition": "common_rust",
                "confidence": 0.89,
                "provenance": "field_device_tested",
                "notes": "Lower leaf rust lesions noted",
                "image_count": 1
            }
        ]
    }
    response = client.post("/api/sync", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["synced_fields_count"] == 1
    assert data["synced_inspections_count"] == 1

def test_ml_evaluation_metrics_endpoint():
    response = client.get("/api/ml/evaluation")
    assert response.status_code == 200
    data = response.json()
    assert data["crop"] == "maize"
    assert data["architecture"] == "mobilenet_v2"
    assert "held_out_test_metrics" in data
    assert data["held_out_test_metrics"]["accuracy"] >= 0.70


