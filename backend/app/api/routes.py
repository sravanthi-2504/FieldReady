"""
API Router for AgriRhythm: FieldReady
Exposes vision quality checks, genuine MobileNetV2 inference for Maize and Banana,
crop support matrix, environmental data, and offline sync endpoints.
"""

import json
import time
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, Query, HTTPException
from typing import Optional, List

from backend.app.vision.quality import evaluate_image_quality
from backend.app.vision.crop_verifier import verify_crop_image
from backend.app.vision.predictor import MaizePredictor
from backend.app.vision.banana_predictor import BananaPredictor
from backend.app.services.weather_service import WeatherService
from backend.app.services.sensor_service import DemoSensorAdapter
from backend.app.services.sync_service import SyncService
from backend.app.services.pesticide_recommendation import (
    get_pesticide_recommendation, get_lookalike_comparison, load_catalog
)
from backend.app.schemas.models import (
    QualityCheckResponse, HealthPredictionResponse, WeatherResponse,
    SensorReading, SyncPayload, SyncResponse, LeafAssessmentItem, PlantAssessmentResponse
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

@router.post("/vision/assess-plant", response_model=PlantAssessmentResponse)
async def assess_plant_leaves(
    images: List[UploadFile] = File(...),
    crop: str = Form("maize"),
    plant_id: Optional[str] = Form(None),
    field_id: Optional[str] = Form(None),
    location: str = Form("India"),
    demo_mode: bool = Form(False)
):
    """
    Multi-image plant assessment endpoint.
    Processes 1 to 10 leaf photographs from the same maize or banana plant.
    Individually validates each leaf via quality and crop verification gates.
    Aggregates valid predictions into a plant-level diagnosis, highlights disagreements,
    and attaches verified CIBRC / ICAR-IIMR pesticide and non-chemical management guidance.
    """
    t0 = time.perf_counter()
    norm_crop = crop.lower().strip()
    if norm_crop not in ["maize", "banana"]:
        raise HTTPException(status_code=400, detail=f"Crop '{crop}' is not certified for AI diagnosis.")

    if not images or len(images) == 0:
        raise HTTPException(status_code=400, detail="At least one leaf image is required.")

    if len(images) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 leaf images per plant assessment session.")

    assigned_plant_id = plant_id or f"plant-{int(time.time())}"
    active_predictor = banana_predictor if norm_crop == "banana" else predictor

    try:
        from backend.app.sensor_api import get_latest
        sensor_reading = get_latest(field_id)
    except Exception:
        sensor_reading = None

    leaf_items: List[LeafAssessmentItem] = []
    class_probs_sum: Dict[str, float] = {}
    class_votes: Dict[str, int] = {}
    valid_count = 0

    for idx, img in enumerate(images):
        fname = img.filename or f"leaf_{idx + 1}.jpg"
        img_bytes = await img.read()

        if len(img_bytes) == 0:
            leaf_items.append(LeafAssessmentItem(
                leaf_index=idx + 1,
                filename=fname,
                is_usable=False,
                rejection_reason="Empty file received."
            ))
            continue

        if len(img_bytes) > 15 * 1024 * 1024:
            leaf_items.append(LeafAssessmentItem(
                leaf_index=idx + 1,
                filename=fname,
                is_usable=False,
                rejection_reason="Image size exceeds 15MB limit."
            ))
            continue

        # 1. Quality evaluation
        quality_eval = evaluate_image_quality(img_bytes)
        if not quality_eval.get("is_valid_quality", True):
            issues = quality_eval.get("quality_issues", [])
            issue_str = f" ({', '.join(issues)})" if issues else ""
            leaf_items.append(LeafAssessmentItem(
                leaf_index=idx + 1,
                filename=fname,
                is_usable=False,
                rejection_reason=f"Quality check failed: blur, poor exposure, or low contrast{issue_str}",
                quality=quality_eval
            ))
            continue

        # 2. Crop botanical verification
        verify_res = verify_crop_image(img_bytes, selected_crop=norm_crop)
        if not verify_res.get("passed", False):
            msg = verify_res.get("message", {}).get("en", "Botanical verification failed.")
            leaf_items.append(LeafAssessmentItem(
                leaf_index=idx + 1,
                filename=fname,
                is_usable=False,
                rejection_reason=f"Botanical check failed: {msg}",
                quality=quality_eval
            ))
            continue

        # 3. Model inference on this leaf
        try:
            pred_res = active_predictor.predict(
                img_bytes,
                is_demo_mode=demo_mode,
                field_id=field_id,
                sensor=sensor_reading
            )
            p_class = pred_res.get("predicted_class", "unknown")
            conf = float(pred_res.get("confidence", 0.0))
            is_unc = bool(pred_res.get("is_uncertain", False))
            les_pct = pred_res.get("lesion_pct")
            stage = pred_res.get("severity_stage")
            highlight = pred_res.get("highlight")

            valid_count += 1
            class_votes[p_class] = class_votes.get(p_class, 0) + 1
            for prob_entry in pred_res.get("all_probabilities", []):
                lbl = prob_entry["label"]
                val = float(prob_entry.get("probability", 0.0))
                class_probs_sum[lbl] = class_probs_sum.get(lbl, 0.0) + val

            leaf_items.append(LeafAssessmentItem(
                leaf_index=idx + 1,
                filename=fname,
                is_usable=True,
                quality=quality_eval,
                predicted_class=p_class,
                confidence=round(conf, 4),
                is_uncertain=is_unc,
                lesion_pct=les_pct,
                severity_stage=stage,
                highlight=highlight
            ))
        except Exception as e:
            leaf_items.append(LeafAssessmentItem(
                leaf_index=idx + 1,
                filename=fname,
                is_usable=False,
                rejection_reason=f"Inference error: {str(e)}",
                quality=quality_eval
            ))

    excluded_count = len(images) - valid_count

    # Plant-level consensus aggregation
    if valid_count == 0:
        plant_pred = "uncertain"
        plant_conf = 0.0
        plant_uncertain = True
        has_disagreement = False
        disagree_summary = "All submitted leaves were excluded due to quality or botanical verification gates."
        avg_probs = {}
    else:
        avg_probs = {lbl: round(val / valid_count, 4) for lbl, val in class_probs_sum.items()}
        plant_pred = max(avg_probs, key=avg_probs.get) if avg_probs else "uncertain"
        plant_conf = avg_probs.get(plant_pred, 0.0)

        # Check for disagreement across valid leaves
        has_disagreement = len(class_votes) > 1
        if has_disagreement:
            breakdown_str = ", ".join([f"{k}: {v}" for k, v in class_votes.items()])
            disagree_summary = f"Leaf symptom disagreement detected across {valid_count} leaves ({breakdown_str})."
        else:
            disagree_summary = f"Unanimous agreement across {valid_count} leaf samples."

        # Plant-level uncertainty gate
        plant_uncertain = (plant_conf < 0.65) or (has_disagreement and (class_votes.get(plant_pred, 0) / valid_count < 0.60))

    # Retrieve verified pesticide recommendation and lookalike comparison
    pesticide_rec = get_pesticide_recommendation(plant_pred, is_uncertain=plant_uncertain, location=location)
    lookalike_comp = get_lookalike_comparison("common_rust", "southern_rust") if plant_pred in ("common_rust", "southern_rust") else None

    latency_ms = (time.perf_counter() - t0) * 1000.0

    return PlantAssessmentResponse(
        plant_id=assigned_plant_id,
        crop=norm_crop,
        total_leaves_submitted=len(images),
        valid_leaves_count=valid_count,
        excluded_leaves_count=excluded_count,
        plant_level_prediction=plant_pred,
        plant_level_confidence=round(plant_conf, 4),
        is_uncertain=plant_uncertain,
        has_disagreement=has_disagreement,
        disagreement_summary=disagree_summary,
        class_vote_breakdown=class_votes,
        average_class_probabilities=avg_probs,
        leaf_assessments=leaf_items,
        pesticide_recommendation=pesticide_rec,
        lookalike_comparison=lookalike_comp,
        source_mode="demonstration" if demo_mode else "model_inference",
        latency_ms=round(latency_ms, 1)
    )

@router.get("/pesticides/recommendation")
def query_pesticide_recommendation(
    disease: str = Query(..., description="Disease identifier, e.g. common_rust, southern_rust, northern_leaf_blight"),
    is_uncertain: bool = Query(False, description="Whether the diagnostic evidence is uncertain"),
    location: str = Query("India", description="Applicable regulatory jurisdiction")
):
    """
    On-demand lookup for verified, rule-based pesticide and IDM guidance from CIBRC & ICAR-IIMR.
    """
    return get_pesticide_recommendation(disease, is_uncertain=is_uncertain, location=location)

@router.get("/pesticides/lookalike")
def query_lookalike_rust_comparison(
    disease_a: str = Query("common_rust"),
    disease_b: str = Query("southern_rust")
):
    """
    Returns side-by-side diagnostic criteria comparing Common Rust (Puccinia sorghi)
    versus Southern Rust (Puccinia polysora).
    """
    return get_lookalike_comparison(disease_a, disease_b)

@router.get("/pesticides/catalog")
def get_full_pesticide_catalog():
    """
    Returns the complete verified maize pesticide catalog.
    """
    return load_catalog()


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
