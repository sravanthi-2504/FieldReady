#!/usr/bin/env python3
"""
Direct In-Process Integration Verification using FastAPI TestClient
Tests:
1. Health & registry endpoints
2. Quality check
3. Botanical Crop Verifier (Maize vs Banana vs Non-plant rejection vs mismatch)
4. Model inference for Maize (Common Rust, Northern Leaf Blight, Gray Leaf Spot, Healthy)
5. Model inference for Banana (Black Sigatoka, Bacterial Wilt, Healthy)
6. Cotton rejection
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from fastapi.testclient import TestClient
from backend.app.main import app

def run_tests():
    client = TestClient(app)
    print("=" * 60)
    print("RUNNING AGRIRHYTHM IN-PROCESS BACKEND & ML INTEGRATION TESTS")
    print("=" * 60)

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    print("1. Health Check: PASSED ->", health_data)
    assert health_data["maize_model_loaded"] is True
    assert health_data["banana_model_loaded"] is True

    # 2. Crop matrix
    res = client.get("/api/crops/matrix")
    assert res.status_code == 200
    matrix = res.json()
    print("2. Crop Matrix: PASSED -> Maize:", matrix["crops"]["maize"]["status"], "| Banana:", matrix["crops"]["banana"]["status"])
    assert matrix["crops"]["banana"]["status"] == "supported"

    # 3. Test Non-Plant Rejection
    import cv2
    import numpy as np
    blank_white = np.ones((224, 224, 3), dtype=np.uint8) * 255
    _, white_buf = cv2.imencode(".jpg", blank_white)
    white_bytes = white_buf.tobytes()

    res = client.post("/api/vision/verify-crop", files={"image": ("white.jpg", white_bytes, "image/jpeg")}, data={"crop": "maize"})
    assert res.status_code == 200
    vr_nonplant = res.json()
    print("3. Non-Plant Rejection: PASSED -> status:", vr_nonplant["status"], "| decision:", vr_nonplant["decision"])
    assert vr_nonplant["passed"] is False
    assert vr_nonplant["decision"] == "reject_not_leaf"

    # 4. Test Maize Sample Image Inference
    maize_sample = Path("public/assets/demo_images/common_rust.jpg")
    with open(maize_sample, "rb") as f:
        maize_bytes = f.read()

    # Test Crop Verifier on Maize with Maize selected
    res = client.post("/api/vision/verify-crop", files={"image": ("maize.jpg", maize_bytes, "image/jpeg")}, data={"crop": "maize"})
    assert res.status_code == 200
    vr_maize = res.json()
    print("4a. Maize Crop Verification: PASSED -> detected:", vr_maize["detected_crop"], "| verified:", vr_maize["crop_verified"])
    assert vr_maize["passed"] is True
    assert vr_maize["detected_crop"] == "maize"

    # Test Maize Crop Mismatch: Select Banana but provide Maize image
    res = client.post("/api/vision/verify-crop", files={"image": ("maize.jpg", maize_bytes, "image/jpeg")}, data={"crop": "banana"})
    assert res.status_code == 200
    vr_mismatch = res.json()
    assert vr_mismatch["crop_verified"] is False
    assert "crop_mismatch" in vr_mismatch["status"]
    assert "maize" in vr_mismatch["message"]["en"].lower()

    # Test Maize Prediction
    res = client.post("/api/vision/predict", files={"image": ("maize.jpg", maize_bytes, "image/jpeg")}, data={"crop": "maize", "demo_mode": False})
    assert res.status_code == 200
    pred_maize = res.json()
    print("4c. Maize Prediction: PASSED -> predicted:", pred_maize["predicted_class"], "| confidence:", pred_maize["confidence"], "| source:", pred_maize["source_mode"])
    assert pred_maize["crop"] == "maize"
    assert pred_maize["source_mode"] == "model_inference"
    assert "management_guidance" in pred_maize
    assert "differential_possibilities" in pred_maize

    # 5. Test Banana Sample Image Inference
    banana_sample = Path("public/assets/demo_images/banana_black_sigatoka.jpg")
    with open(banana_sample, "rb") as f:
        banana_bytes = f.read()

    # Test Crop Verifier on Banana with Banana selected
    res = client.post("/api/vision/verify-crop", files={"image": ("banana.jpg", banana_bytes, "image/jpeg")}, data={"crop": "banana"})
    assert res.status_code == 200
    vr_banana = res.json()
    print("5a. Banana Crop Verification: PASSED -> detected:", vr_banana["detected_crop"], "| verified:", vr_banana["crop_verified"])
    assert vr_banana["passed"] is True
    assert vr_banana["detected_crop"] == "banana"

    # Test Banana Crop Mismatch: Select Maize but provide Banana image
    res = client.post("/api/vision/verify-crop", files={"image": ("banana.jpg", banana_bytes, "image/jpeg")}, data={"crop": "maize"})
    assert res.status_code == 200
    vr_mismatch2 = res.json()
    assert vr_mismatch2["crop_verified"] is False
    assert "crop_mismatch" in vr_mismatch2["status"]
    assert "banana" in vr_mismatch2["message"]["en"].lower()

    # Test Banana Prediction
    res = client.post("/api/vision/predict", files={"image": ("banana.jpg", banana_bytes, "image/jpeg")}, data={"crop": "banana", "demo_mode": False})
    assert res.status_code == 200
    pred_banana = res.json()
    print("5c. Banana Prediction: PASSED -> predicted:", pred_banana["predicted_class"], "| confidence:", pred_banana["confidence"], "| source:", pred_banana["source_mode"])
    assert pred_banana["crop"] == "banana"
    assert pred_banana["source_mode"] == "model_inference"
    assert "management_guidance" in pred_banana
    assert "differential_possibilities" in pred_banana

    # 6. Test Cotton Rejection
    res = client.post("/api/vision/predict", files={"image": ("maize.jpg", maize_bytes, "image/jpeg")}, data={"crop": "cotton"})
    assert res.status_code == 400
    print("6. Unsupported Crop Rejection (Cotton): PASSED -> HTTP 400 rejected safely")

    print("=" * 60)
    print("ALL 6 LIVE ML & BACKEND INTEGRATION TESTS PASSED!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
