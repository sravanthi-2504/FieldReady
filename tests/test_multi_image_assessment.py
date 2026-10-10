"""
Automated Integration Tests for Multi-Image Plant Assessment
Tests:
1. Multi-leaf submission from the same maize plant.
2. Exclusion of invalid images with documented rejection reasons.
3. Consensus aggregation across valid leaves.
4. Leaf-level disagreement detection.
5. Integration with verified pesticide recommendations.
"""

from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

RUST_PATH = Path("public/assets/demo_images/common_rust.jpg")
BLIGHT_PATH = Path("public/assets/demo_images/northern_leaf_blight.jpg")
HEALTHY_PATH = Path("public/assets/demo_images/healthy.jpg")

def test_multi_image_assessment_consensus():
    assert RUST_PATH.exists()
    rust_bytes = RUST_PATH.read_bytes()

    # Submit 2 leaf images of common rust
    files = [
        ("images", ("leaf_top.jpg", rust_bytes, "image/jpeg")),
        ("images", ("leaf_mid.jpg", rust_bytes, "image/jpeg"))
    ]
    data = {
        "crop": "maize",
        "plant_id": "test-plant-01",
        "field_id": "demo-field-42",
        "location": "India"
    }

    res = client.post("/api/vision/assess-plant", files=files, data=data)
    assert res.status_code == 200
    res_data = res.json()

    assert res_data["plant_id"] == "test-plant-01"
    assert res_data["crop"] == "maize"
    assert res_data["total_leaves_submitted"] == 2
    assert res_data["valid_leaves_count"] == 2
    assert res_data["excluded_leaves_count"] == 0
    assert res_data["plant_level_prediction"] == "common_rust"
    assert res_data["has_disagreement"] is False
    assert len(res_data["leaf_assessments"]) == 2

    # Check that verified pesticide recommendation is attached
    pesticide_rec = res_data["pesticide_recommendation"]
    assert pesticide_rec is not None
    assert pesticide_rec["disease"] == "common_rust"
    assert pesticide_rec["recommendation_status"] == "verified"
    assert len(pesticide_rec["chemical_interventions"]) >= 2

def test_multi_image_assessment_with_unusable_image():
    rust_bytes = RUST_PATH.read_bytes()
    empty_bytes = b""
    blank_white = b"\xff" * 500  # corrupt / invalid image

    files = [
        ("images", ("valid_rust.jpg", rust_bytes, "image/jpeg")),
        ("images", ("empty_leaf.jpg", empty_bytes, "image/jpeg")),
        ("images", ("corrupted_leaf.jpg", blank_white, "image/jpeg"))
    ]
    data = {"crop": "maize", "plant_id": "plant-with-corrupt"}

    res = client.post("/api/vision/assess-plant", files=files, data=data)
    assert res.status_code == 200
    res_data = res.json()

    assert res_data["total_leaves_submitted"] == 3
    assert res_data["valid_leaves_count"] == 1
    assert res_data["excluded_leaves_count"] == 2

    assessments = res_data["leaf_assessments"]
    assert len(assessments) == 3
    # Check that invalid leaves have rejection reasons
    assert assessments[0]["is_usable"] is True
    assert assessments[1]["is_usable"] is False
    assert "Empty" in assessments[1]["rejection_reason"]
    assert assessments[2]["is_usable"] is False
    assert assessments[2]["rejection_reason"] is not None

def test_multi_image_assessment_disagreement():
    assert RUST_PATH.exists()
    assert BLIGHT_PATH.exists()
    rust_bytes = RUST_PATH.read_bytes()
    blight_bytes = BLIGHT_PATH.read_bytes()

    # Submit 1 rust leaf and 1 blight leaf
    files = [
        ("images", ("rust_leaf.jpg", rust_bytes, "image/jpeg")),
        ("images", ("blight_leaf.jpg", blight_bytes, "image/jpeg"))
    ]
    data = {"crop": "maize", "plant_id": "plant-disagreement"}

    res = client.post("/api/vision/assess-plant", files=files, data=data)
    assert res.status_code == 200
    res_data = res.json()

    assert res_data["valid_leaves_count"] == 2
    assert res_data["has_disagreement"] is True
    assert "disagreement" in res_data["disagreement_summary"].lower()
    assert res_data["is_uncertain"] is True
    # When uncertain due to disagreement, chemical advice must be withheld
    assert res_data["pesticide_recommendation"]["recommendation_status"] == "withheld_uncertain"
