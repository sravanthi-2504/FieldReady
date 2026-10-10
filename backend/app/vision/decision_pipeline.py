"""
One call that turns a raw model result into the final, safe response.

In banana_predictor.py and predictor.py (maize), replace the final `return {...}` with:

    from app.vision.decision_pipeline import run_decision_pipeline
    result = {... existing dict ...}
    return run_decision_pipeline(result, image_bytes, sensor, field_confirmed, lookup)

  sensor           SensorReading or None (from sensor_api.get_latest(field_id))
  field_confirmed  True only after the farmer answered the symptom questions
  lookup(cls)      -> (display_name_dict, guidance_dict) for a class, used if the sensor
                      changes the winning class so the text matches the new class
"""
import re
from typing import Any, Callable, Dict, Optional, Tuple

try:
    from backend.app.vision.lesion_stage import analyze_lesions, highlight_lesions
    from backend.app.vision.sensor_fusion import CONFIDENT, SensorReading, advise, fuse
    from backend.app.vision.stage_guidance import enrich_with_stage
except ImportError:
    try:
        from app.vision.lesion_stage import analyze_lesions, highlight_lesions
        from app.vision.sensor_fusion import CONFIDENT, SensorReading, advise, fuse
        from app.vision.stage_guidance import enrich_with_stage
    except ImportError:
        from lesion_stage import analyze_lesions, highlight_lesions
        from sensor_fusion import CONFIDENT, SensorReading, advise, fuse
        from stage_guidance import enrich_with_stage

_CHEM = re.compile(
    r"(\d+(\.\d+)?\s*(ml|g|kg|l)\s*(/|per)\s*(l|ha|acre|litre|liter))|(\d+\s*%\s*(ec|wp|sc|sl)\b)|\b(ec|wp)\b|"
    r"propiconazole|mancozeb|tebuconazole|azoxystrobin|carbendazim|copper oxychloride|strobilurin|triazole|"
    r"trifloxystrobin|hexaconazole|chlorothalonil|fungicide|bactericide|pesticide",
    re.IGNORECASE,
)
_SAFE = {
    "en": "Product choice and dose must come from your agriculture officer or the registered product label.",
    "te": "మందు ఎంపిక, మోతాదు మీ వ్యవసాయ అధికారి లేదా నమోదిత లేబుల్ నుండి మాత్రమే తీసుకోండి.",
    "hi": "दवा का चुनाव और मात्रा कृषि अधिकारी या पंजीकृत लेबल से ही लें।",
}


def strip_chemicals(obj: Any, lang: Optional[str] = None) -> Any:
    """Remove product names, formulations and doses from any guidance structure.
    Any dict key containing 'disclaimer' is left alone, so the warning text is kept."""
    if isinstance(obj, str):
        return _SAFE.get(lang or "en", _SAFE["en"]) if _CHEM.search(obj) else obj
    if isinstance(obj, list):
        return [strip_chemicals(x, lang) for x in obj if not (isinstance(x, str) and _CHEM.search(x))]
    if isinstance(obj, dict):
        return {k: (v if "disclaimer" in str(k).lower() else strip_chemicals(v, k if k in _SAFE else lang))
                for k, v in obj.items()}
    return obj


def run_decision_pipeline(
    result: Dict[str, Any],
    image_bytes: bytes,
    sensor: Optional[SensorReading] = None,
    field_confirmed: bool = False,
    lookup: Optional[Callable[[str], Tuple[Dict[str, str], Dict[str, Any]]]] = None,
) -> Dict[str, Any]:
    # 1) image probabilities -> fused with sensor weather for risk context
    probs = {p["label"]: p["probability"] for p in result.get("all_probabilities", [])}
    fused, info = fuse(probs, sensor) if probs else (probs, {"sensor_used": False, "reason": "no probabilities"})
    result["sensor_info"] = info
    result["sensor_fusion"] = info

    # Attach fused probabilities as context without altering model's visual prediction (Phase 8 requirement)
    if probs and info.get("sensor_used"):
        result["image_only_class"] = result.get("predicted_class")
        result["image_only_confidence"] = result.get("confidence")
        for p in result["all_probabilities"]:
            p["fused_probability"] = round(fused.get(p["label"], p["probability"]), 4)

    # 1b) Build environmental context for UI and agronomic explanation
    pred_cls = result.get("predicted_class", "healthy")
    fav_score = (info.get("favourability") or {}).get(pred_cls)
    if sensor is not None and sensor.usable():
        result["environmental_context"] = {
            "temperature_c": sensor.temperature_c,
            "humidity_pct": sensor.humidity_pct,
            "leaf_wetness_hours_24h": sensor.leaf_wetness_hours_24h,
            "soil_moisture_pct": sensor.soil_moisture_pct,
            "source": sensor.source,
            "sensor_status": "online",
            "age_hours": round(sensor.age_hours(), 2) if sensor.age_hours() is not None else 0.0,
            "favourability_score": round(fav_score, 2) if fav_score is not None else None,
            "weather_favourable": bool(fav_score is not None and fav_score >= 0.5)
        }
    else:
        result["environmental_context"] = {
            "temperature_c": None,
            "humidity_pct": None,
            "leaf_wetness_hours_24h": None,
            "soil_moisture_pct": None,
            "source": "none",
            "sensor_status": "offline",
            "age_hours": None,
            "favourability_score": None,
            "weather_favourable": False
        }


    # 2) damage stage + stage-specific cultural advice
    result = enrich_with_stage(result, image_bytes)

    # 2b) affected-area picture: the leaf photo with suspected damaged tissue marked.
    # Built from the same colour masks as the damage %, so the marks match the numbers.
    # None when the leaf looks clean or the photo can't be measured.
    try:
        if result.get("predicted_class") == "healthy" and not result.get("is_uncertain"):
            result["highlight"] = None
        else:
            result["highlight"] = highlight_lesions(image_bytes)
    except Exception:
        result["highlight"] = None

    # 3) advisory gate
    pred = result.get("predicted_class")
    fav = (info.get("favourability") or {}).get(pred)
    result["advisory"] = advise(
        pred, float(result.get("confidence", 0.0)), bool(result.get("is_uncertain")),
        result.get("stage_info"), fav, bool(info.get("sensor_used")), field_confirmed,
    )

    # 4) never ship product names or doses in general guidance
    if "management_guidance" in result:
        result["management_guidance"] = strip_chemicals(result["management_guidance"])

    # 5) verified, rule-based pesticide recommendation & lookalike rust differentiation
    try:
        from backend.app.services.pesticide_recommendation import get_pesticide_recommendation, get_lookalike_comparison
        result["pesticide_recommendation"] = get_pesticide_recommendation(
            str(pred), bool(result.get("is_uncertain", False))
        )
        if str(pred) in ("common_rust", "southern_rust"):
            result["lookalike_comparison"] = get_lookalike_comparison("common_rust", "southern_rust")
        else:
            result["lookalike_comparison"] = None
    except Exception as e:
        print(f"Warning: Failed to attach pesticide recommendation: {e}")
        result["pesticide_recommendation"] = None
        result["lookalike_comparison"] = None

    return result
