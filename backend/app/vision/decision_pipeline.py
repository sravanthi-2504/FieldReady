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
    # 1) image probabilities -> fused with sensor weather
    probs = {p["label"]: p["probability"] for p in result.get("all_probabilities", [])}
    fused, info = fuse(probs, sensor) if probs else (probs, {"sensor_used": False, "reason": "no probabilities"})
    result["sensor_info"] = info
    result["sensor_fusion"] = info

    if probs and info.get("sensor_used"):
        new_cls = max(fused, key=fused.get)
        result["image_only_class"] = result.get("predicted_class")
        result["image_only_confidence"] = result.get("confidence")
        for p in result["all_probabilities"]:
            p["image_probability"] = p["probability"]
            p["probability"] = round(fused[p["label"]], 4)
            p["percentage"] = round(fused[p["label"]] * 100, 1)
        result["predicted_class"] = new_cls
        result["confidence"] = round(fused[new_cls], 4)
        if result["confidence"] < CONFIDENT:
            result["is_uncertain"] = True
        if new_cls != result["image_only_class"] and lookup is not None:
            result["display_name"], result["management_guidance"] = lookup(new_cls)
            result["class_changed_by_sensor"] = True

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

    # 4) never ship product names or doses
    if "management_guidance" in result:
        result["management_guidance"] = strip_chemicals(result["management_guidance"])
    return result
