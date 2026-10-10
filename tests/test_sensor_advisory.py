"""
Tests for Sensor Fusion, Advisory Gate, Lesion Quantification v2, and Decision Pipeline
"""
import io
import time
import pytest
from PIL import Image
import numpy as np

from backend.app.vision.lesion_stage import analyze_lesions, highlight_lesions, CONFIG
from backend.app.vision.sensor_fusion import (
    SensorReading,
    favourability,
    fuse,
    advise,
    strip_chemicals,
    PROFILES
)
from backend.app.vision.decision_pipeline import run_decision_pipeline
from backend.app.sensor_api import get_latest, _STORE, SensorIn, post_sensor


def create_test_leaf_image(color=(34, 139, 34), lesion_color=(101, 67, 33), lesion_fraction=0.0):
    """Creates a synthetic RGB leaf image with an optional lesion patch."""
    arr = np.zeros((200, 200, 3), dtype=np.uint8)
    arr[:, :] = color  # base green leaf
    if lesion_fraction > 0:
        h = int(200 * lesion_fraction)
        arr[:h, :h] = lesion_color  # necrotic spot
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_lesion_stage_clean_leaf():
    clean_bytes = create_test_leaf_image(color=(45, 130, 45), lesion_fraction=0.0)
    res = analyze_lesions(clean_bytes)
    assert res["reliable"] is True
    assert res["stage"] in ("trace", "early")
    assert res["lesion_percent"] is not None
    assert res["lesion_percent"] < 3.0


def test_lesion_stage_heavily_lesioned_leaf():
    from pathlib import Path
    real_sigatoka = Path("data/raw/banana/black_sigatoka/8.PNG")
    if real_sigatoka.exists():
        damaged_bytes = real_sigatoka.read_bytes()
    else:
        damaged_bytes = create_test_leaf_image(color=(45, 130, 45), lesion_color=(40, 20, 10), lesion_fraction=0.7)
    res = analyze_lesions(damaged_bytes)
    assert res["reliable"] is True
    assert res["stage"] in ("moderate", "severe")
    assert res["lesion_percent"] is not None
    assert res["lesion_percent"] > 12.0


def test_sensor_reading_usability_and_age():
    fresh_reading = SensorReading(
        temperature_c=26.5,
        humidity_pct=88.0,
        leaf_wetness_hours_24h=7.0,
        taken_at=time.time() - 3600  # 1 hour ago
    )
    assert fresh_reading.usable() is True
    assert 0.9 <= fresh_reading.age_hours() <= 1.1

    stale_reading = SensorReading(
        temperature_c=26.5,
        humidity_pct=88.0,
        leaf_wetness_hours_24h=7.0,
        taken_at=time.time() - (8 * 3600)  # 8 hours ago
    )
    assert stale_reading.usable() is False


def test_weather_favourability():
    reading = SensorReading(
        temperature_c=26.0,
        humidity_pct=88.0,
        leaf_wetness_hours_24h=8.0,
        taken_at=time.time()
    )
    # Favourable for gray leaf spot (20-30C, rh>85%, wet>6h)
    fav_gls = favourability("gray_leaf_spot", reading)
    assert fav_gls is not None
    assert fav_gls > 0.5

    # Hot/dry reading
    dry_reading = SensorReading(
        temperature_c=38.0,
        humidity_pct=40.0,
        leaf_wetness_hours_24h=0.0,
        taken_at=time.time()
    )
    fav_dry = favourability("gray_leaf_spot", dry_reading)
    assert fav_dry is not None
    assert fav_dry == 0.0


def test_probability_fusion_caps_influence():
    reading = SensorReading(
        temperature_c=26.0,
        humidity_pct=92.0,
        leaf_wetness_hours_24h=8.0,
        taken_at=time.time()
    )
    probs = {"gray_leaf_spot": 0.54, "common_rust": 0.46}
    fused, info = fuse(probs, reading)
    assert info["sensor_used"] is True
    # The multiplier is strictly bounded between 0.75x and 1.25x
    assert fused["gray_leaf_spot"] > 0.54
    assert fused["common_rust"] < 0.46
    assert abs(sum(fused.values()) - 1.0) < 1e-4


def test_advisory_gate_consult_officer_requires_all_four():
    stage_info = {"stage": "moderate", "reliable": True, "lesion_percent": 18.0}

    # 1. Stale / missing sensor -> cultural_only
    adv_no_sensor = advise(
        pred="gray_leaf_spot",
        confidence=0.88,
        is_uncertain=False,
        stage_info=stage_info,
        fav_pred=None,
        sensor_ok=False,
        field_confirmed=True
    )
    assert adv_no_sensor["level"] == "cultural_only"
    assert "a fresh sensor reading" in adv_no_sensor["still_needed_for_officer_consult"]

    # 2. Trace / unmeasured damage -> cultural_only
    trace_stage = {"stage": "trace", "reliable": True, "lesion_percent": 1.5}
    adv_trace = advise(
        pred="gray_leaf_spot",
        confidence=0.88,
        is_uncertain=False,
        stage_info=trace_stage,
        fav_pred=0.9,
        sensor_ok=True,
        field_confirmed=True
    )
    assert adv_trace["level"] == "cultural_only"
    assert "damage at moderate or severe level" in adv_trace["still_needed_for_officer_consult"]

    # 3. Not field confirmed -> cultural_only
    adv_unconfirmed = advise(
        pred="gray_leaf_spot",
        confidence=0.88,
        is_uncertain=False,
        stage_info=stage_info,
        fav_pred=0.9,
        sensor_ok=True,
        field_confirmed=False
    )
    assert adv_unconfirmed["level"] == "cultural_only"
    assert "field symptom confirmation" in adv_unconfirmed["still_needed_for_officer_consult"]

    # 4. All four agree -> consult_officer
    adv_all_agree = advise(
        pred="gray_leaf_spot",
        confidence=0.88,
        is_uncertain=False,
        stage_info=stage_info,
        fav_pred=0.9,
        sensor_ok=True,
        field_confirmed=True
    )
    assert adv_all_agree["level"] == "consult_officer"
    assert len(adv_all_agree["still_needed_for_officer_consult"]) == 0
    assert adv_all_agree["names_products_or_doses"] is False


def test_strip_chemicals_scrubs_all_products_and_doses():
    bad_guidance = {
        "summary": "Sample summary",
        "chemical_advice": {
            "en": "Spray Propiconazole 25% EC @ 1 mL/L water or Mancozeb 75% WP @ 2.5 g/L.",
            "te": "మ్యాంకోజెబ్ 75% WP పిచికారీ చేయండి.",
            "hi": "प्रोपीकोनाज़ोल 25% EC का छिड़काव करें।"
        },
        "immediate_actions": [
            "Cut infected leaves.",
            "Apply Azoxystrobin fungicide spray @ 1 g/L."
        ]
    }
    clean = strip_chemicals(bad_guidance)
    # Check that Propiconazole / Mancozeb / 25% EC / @ 1 mL/L are completely absent
    clean_en = clean["chemical_advice"]["en"]
    assert "Propiconazole" not in clean_en
    assert "Mancozeb" not in clean_en
    assert "1 mL/L" not in clean_en
    assert "Product choice and dose must come from your agriculture officer" in clean_en
    # Check immediate_actions filtered out the chemical line
    assert len(clean["immediate_actions"]) == 1
    assert "Cut infected leaves." in clean["immediate_actions"]


def test_sensor_api_store_and_retrieve():
    body = SensorIn(
        field_id="test-field-42",
        temperature_c=25.0,
        humidity_pct=85.0,
        leaf_wetness_hours_24h=6.0,
        soil_moisture_pct=40.0
    )
    resp = post_sensor(body)
    assert resp == {"ok": True}

    latest = get_latest("test-field-42")
    assert latest is not None
    assert latest.temperature_c == 25.0
    assert latest.humidity_pct == 85.0
    assert latest.usable() is True


def test_highlight_clean_leaf_returns_none():
    clean_bytes = create_test_leaf_image(color=(45, 130, 45), lesion_fraction=0.0)
    highlight = highlight_lesions(clean_bytes)
    assert highlight is None


def test_highlight_damaged_leaf_returns_overlay():
    from pathlib import Path
    real_sigatoka = Path("data/raw/banana/black_sigatoka/8.PNG")
    if real_sigatoka.exists():
        damaged_bytes = real_sigatoka.read_bytes()
    else:
        damaged_bytes = Path("public/assets/demo_images/common_rust.jpg").read_bytes()
    highlight = highlight_lesions(damaged_bytes)
    assert highlight is not None
    assert "image_data_url" in highlight
    assert highlight["image_data_url"].startswith("data:image/jpeg;base64,")
    assert highlight["lesion_percent"] > 2.0
    assert "legend" in highlight
    legend = highlight["legend"]
    for field in ["title", "red", "amber", "note"]:
        assert field in legend
        for lang in ["en", "te", "hi"]:
            assert lang in legend[field]
            assert len(legend[field][lang]) > 0

