"""
API Router for AgriRhythm: FieldReady
Exposes vision quality checks, genuine MobileNetV2 inference for Maize and Banana,
crop support matrix, environmental data, and offline sync endpoints.
"""

import json
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, Query, HTTPException
from typing import Optional

from backend.app.vision.quality import evaluate_image_quality
from backend.app.vision.crop_verifier import verify_crop_image
from backend.app.vision.predictor import MaizePredictor
from backend.app.vision.banana_predictor import BananaPredictor
from backend.app.services.weather_service import WeatherService
from backend.app.services.sensor_service import DemoSensorAdapter
from backend.app.services.sync_service import SyncService
from backend.app.schemas.models import (
    QualityCheckResponse, HealthPredictionResponse, WeatherResponse,
    SensorReading, SyncPayload, SyncResponse
)

router = APIRouter(prefix="/api")

# Project root (backend/app/api/routes.py -> parents[3]); keeps model/report paths independent of the launch folder
ROOT = Path(__file__).resolve().parents[3]

predictor = MaizePredictor()
banana_predictor = BananaPredictor()
weather_service = WeatherService()
sensor_adapter = DemoSensorAdapter()
sync_service = SyncService()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AgriRhythm: FieldReady Backend",
        "model_loaded": predictor.is_loaded and banana_predictor.is_loaded,
        "maize_model_loaded": predictor.is_loaded,
        "banana_model_loaded": banana_predictor.is_loaded,
        "supported_crops": ["maize", "banana"],
        "planned_crops": ["cotton"],
        "offline_sync_ready": True
    }

@router.get("/crops/matrix")
def get_crop_support_matrix():
    registry_file = ROOT / "models" / "model_registry.json"
    if registry_file.exists():
        with open(registry_file, "r") as f:
            return json.load(f)
    return {
        "version": "1.1.0",
        "crops": {
            "maize": {
                "status": "supported",
                "model_available": True,
                "classes": ["healthy", "common_rust", "northern_leaf_blight", "gray_leaf_spot"]
            },
            "banana": {
                "status": "supported",
                "model_available": True,
                "classes": ["healthy", "black_sigatoka", "bacterial_wilt"]
            },
            "cotton": {
                "status": "extension_ready",
                "model_available": False,
                "note": "Not certified for diagnostic inference in this release."
            }
        }
    }

@router.post("/vision/quality-check", response_model=QualityCheckResponse)
async def check_quality(image: UploadFile = File(...)):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a JPEG or PNG image.")

    image_bytes = await image.read()
    if len(image_bytes) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size exceeds 15MB limit.")

    result = evaluate_image_quality(image_bytes)
    return result

@router.post("/vision/verify-crop")
async def verify_crop_gate(
    image: UploadFile = File(...),
    crop: str = Form("maize")
):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a JPEG or PNG image.")

    image_bytes = await image.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image file received.")

    result = verify_crop_image(image_bytes, selected_crop=crop)
    return result

@router.post("/vision/predict", response_model=HealthPredictionResponse)
async def predict_crop_health(
    image: UploadFile = File(...),
    crop: str = Form("maize"),
    demo_mode: bool = Form(False),
    field_id: Optional[str] = Form(None),
    field_confirmed: bool = Form(False)
):
    norm_crop = crop.lower().strip()
    if norm_crop not in ["maize", "banana"]:
        raise HTTPException(
            status_code=400,
            detail=f"Crop '{crop}' is not certified for AI diagnosis. Only 'maize' and 'banana' are verified in this release."
        )

    image_bytes = await image.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image file received.")

    # Strict Crop Verification Gate: Enforce botanical crop verification before disease inference
    verify_result = verify_crop_image(image_bytes, selected_crop=norm_crop)
    if not verify_result.get("passed", False):
        err_msg = verify_result.get("message", {}).get("en", "Crop verification failed.")
        status_code = 400
        raise HTTPException(
            status_code=status_code,
            detail=f"Crop Verification Gate: {err_msg} (Status: {verify_result.get('status')})"
        )

    active_predictor = banana_predictor if norm_crop == "banana" else predictor
    if not active_predictor.is_loaded and not demo_mode:
        # Never answer with the canned demo result unless it was requested explicitly
        raise HTTPException(
            status_code=503,
            detail=(
                f"The {norm_crop} model weights are not loaded on the server "
                f"(expected {active_predictor.weights_path}). Check the 'models/' folder and the server log."
            )
        )

    try:
        from backend.app.sensor_api import get_latest
        sensor_reading = get_latest(field_id)
    except Exception:
        sensor_reading = None

    try:
        result = active_predictor.predict(
            image_bytes,
            is_demo_mode=demo_mode,
            field_id=field_id,
            field_confirmed=field_confirmed,
            sensor=sensor_reading
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {e}")

    return result

@router.get("/weather", response_model=WeatherResponse)
def get_weather(lat: Optional[float] = Query(None), lon: Optional[float] = Query(None)):
    return weather_service.get_weather(lat, lon)

@router.get("/sensors/demo")
def get_sensor_data(field_id: Optional[str] = Query(None)):
    return sensor_adapter.get_readings(field_id)

@router.post("/sync", response_model=SyncResponse)
def sync_client_data(payload: SyncPayload):
    return sync_service.sync_records(payload.model_dump())

@router.get("/sync/records")
def list_synced_data():
    return sync_service.get_all_synced_data()

@router.get("/ml/evaluation")
def get_ml_evaluation_metrics(crop: str = Query("maize")):
    if crop.lower() == "banana":
        report_file = ROOT / "models" / "banana_evaluation_report.json"
    else:
        report_file = ROOT / "models" / "model_evaluation_report.json"

    if report_file.exists():
        with open(report_file, "r") as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail=f"Model evaluation report for '{crop}' not found.")
