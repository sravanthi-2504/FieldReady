"""
Sensor fusion + advisory gate for AgriRhythm: FieldReady

Goal: the app must never recommend spraying on the strength of a photo alone.

1. A field sensor reports weather around the leaf (temperature, humidity, hours the leaf
   stayed wet). Each disease has a typical "favourable weather" profile. The sensor
   nudges the image probabilities, but only a little: the weight is capped so a
   confident photo result can never be flipped by weather, only an ambiguous one.
2. An advisory gate decides how far the advice may go. Chemical wording is only allowed
   to reach "consult your officer" when ALL of these agree: confident image, measurable
   damage, favourable weather from a fresh sensor reading, and a field confirmation
   (the symptom questions). Even then the app names NO product and NO dose.

"Cellulose sensor": cellulose/paper-based sensors respond to moisture by changing
resistance or capacitance. This module expects calibrated numbers (%RH, wet hours).
Use adc_to_percent() with a calibration table made against a reference hygrometer.
"""
import re
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

try:
    from backend.app.vision.lesion_stage import analyze_lesions
    from backend.app.vision.stage_guidance import STAGE_LABEL, STAGE_ACTIONS, HEALTHY_BUT_LESIONS, HEALTHY_LESION_LIMIT, DISEASE_NOTE
except ImportError:
    try:
        from app.vision.lesion_stage import analyze_lesions
        from app.vision.stage_guidance import STAGE_LABEL, STAGE_ACTIONS, HEALTHY_BUT_LESIONS, HEALTHY_LESION_LIMIT, DISEASE_NOTE
    except ImportError:
        from lesion_stage import analyze_lesions
        from stage_guidance import STAGE_LABEL, STAGE_ACTIONS, HEALTHY_BUT_LESIONS, HEALTHY_LESION_LIMIT, DISEASE_NOTE

CAP = 0.25            # sensor can scale a class probability by 0.75x .. 1.25x only
MAX_AGE_HOURS = 6.0   # older readings are ignored
CONFIDENT = 0.65


@dataclass
class SensorReading:
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    leaf_wetness_hours_24h: Optional[float] = None
    soil_moisture_pct: Optional[float] = None
    taken_at: Optional[float] = None        # unix seconds
    source: str = "sensor"

    def age_hours(self) -> Optional[float]:
        return None if self.taken_at is None else (time.time() - self.taken_at) / 3600.0

    def usable(self) -> bool:
        age = self.age_hours()
        fresh = age is not None and 0 <= age <= MAX_AGE_HOURS
        have = sum(v is not None for v in (self.temperature_c, self.humidity_pct, self.leaf_wetness_hours_24h))
        return fresh and have >= 2


def adc_to_percent(adc: float, table: List[Tuple[float, float]]) -> float:
    """Piecewise-linear calibration. table = [(adc_value, percent), ...] measured against a
    reference instrument, e.g. [(3900, 30), (3000, 60), (2000, 85), (1200, 100)]."""
    pts = sorted(table)
    if adc <= pts[0][0]:
        return pts[0][1]
    if adc >= pts[-1][0]:
        return pts[-1][1]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x0 <= adc <= x1:
            return y0 + (y1 - y0) * (adc - x0) / (x1 - x0)
    return pts[-1][1]


# temp = (zero_below, full_from, full_to, zero_above) in deg C
# rh   = (zero_at_or_below, full_at_or_above) in %
# wet  = (zero_at_or_below, full_at_or_above) in hours of leaf wetness in the last 24 h
PROFILES: Dict[str, Dict[str, Tuple[float, ...]]] = {
    # banana
    "black_sigatoka": {"temp": (20, 25, 28, 32), "rh": (80, 90), "wet": (4, 10)},
    "cordana":        {"temp": (16, 20, 26, 30), "rh": (80, 92), "wet": (4, 10)},
    "pestalotiopsis": {"temp": (20, 24, 30, 34), "rh": (75, 90), "wet": (3, 8)},
    "bacterial_wilt": {"temp": (24, 28, 32, 38), "rh": (75, 90), "wet": (2, 8)},
    # maize
    "gray_leaf_spot":       {"temp": (20, 25, 30, 34), "rh": (85, 95), "wet": (6, 12)},
    "common_rust":          {"temp": (12, 16, 23, 27), "rh": (85, 95), "wet": (4, 8)},
    "blight":               {"temp": (16, 18, 27, 30), "rh": (85, 95), "wet": (4, 10)},
    "northern_leaf_blight": {"temp": (16, 18, 27, 30), "rh": (85, 95), "wet": (4, 10)},
}


def _trap(x: float, a: float, b: float, c: float, d: float) -> float:
    if x <= a or x >= d:
        return 0.0
    if x < b:
        return (x - a) / (b - a)
    if x <= c:
        return 1.0
    return (d - x) / (d - c)


def _ramp(x: float, lo: float, hi: float) -> float:
    return 0.0 if x <= lo else 1.0 if x >= hi else (x - lo) / (hi - lo)


def favourability(cls: str, r: SensorReading) -> Optional[float]:
    """0..1: how favourable the measured weather is for this disease. None if unknown class/no data."""
    prof = PROFILES.get(cls)
    if prof is None:
        return None
    parts = []
    if r.temperature_c is not None:
        parts.append(_trap(r.temperature_c, *prof["temp"]))
    if r.humidity_pct is not None:
        parts.append(_ramp(r.humidity_pct, *prof["rh"]))
    if r.leaf_wetness_hours_24h is not None:
        parts.append(_ramp(r.leaf_wetness_hours_24h, *prof["wet"]))
    return sum(parts) / len(parts) if parts else None


def fuse(probs: Dict[str, float], r: Optional[SensorReading]) -> Tuple[Dict[str, float], Dict[str, Any]]:
    """Return (fused probabilities, info). Image stays dominant: multipliers are 0.75..1.25."""
    if r is None or not r.usable():
        why = "no sensor reading" if r is None else "sensor reading missing, too old, or incomplete"
        return dict(probs), {"sensor_used": False, "reason": why}

    fav = {c: favourability(c, r) for c in probs}
    disease_fav = [v for c, v in fav.items() if c != "healthy" and v is not None]
    max_f = max(disease_fav) if disease_fav else 0.0

    out = {}
    for c, p in probs.items():
        if c == "healthy":
            m = (1 - CAP) + 2 * CAP * (1 - max_f)       # weather that favours no disease supports "healthy"
        elif fav.get(c) is not None:
            m = (1 - CAP) + 2 * CAP * fav[c]
        else:
            m = 1.0
        out[c] = p * m
    z = sum(out.values()) or 1.0
    out = {c: v / z for c, v in out.items()}
    return out, {
        "sensor_used": True,
        "favourability": {c: (None if v is None else round(v, 2)) for c, v in fav.items()},
        "reading_age_hours": round(r.age_hours(), 2) if r.age_hours() is not None else None,
    }


# --------------------------------------------------------------------------- advisory gate
LEVEL_TEXT = {
    "no_action": {
        "en": "No action needed now. Keep scouting regularly.",
        "te": "ప్రస్తుతం ఎలాంటి చర్య అవసరం లేదు. క్రమం తప్పకుండా పరిశీలించండి.",
        "hi": "अभी किसी कार्रवाई की ज़रूरत नहीं है। नियमित निगरानी रखें।",
    },
    "recheck": {
        "en": "The result is not reliable yet. Retake the photo in daylight, or ask your agriculture officer.",
        "te": "ఫలితం ఇంకా నమ్మదగినది కాదు. పగటి వెలుగులో మళ్లీ ఫోటో తీయండి లేదా వ్యవసాయ అధికారిని అడగండి.",
        "hi": "नतीजा अभी भरोसेमंद नहीं है। दिन की रोशनी में फोटो दोबारा लें या कृषि अधिकारी से पूछें।",
    },
    "cultural_only": {
        "en": "Follow farm-hygiene steps only. Spray advice needs a fresh sensor reading and field confirmation first.",
        "te": "ప్రస్తుతానికి తోట పరిశుభ్రత చర్యలు మాత్రమే పాటించండి. మందు సలహాకు తాజా సెన్సార్ సమాచారం, క్షేత్ర నిర్ధారణ అవసరం.",
        "hi": "अभी केवल खेत की स्वच्छता के उपाय करें। दवा की सलाह के लिए ताज़ा सेंसर रीडिंग और खेत में पुष्टि ज़रूरी है।",
    },
    "consult_officer": {
        "en": "Photo, damage level, weather and your field check all agree. Contact your agriculture officer or KVK to choose a label-approved product. This app does not name products or doses.",
        "te": "ఫోటో, నష్టం స్థాయి, వాతావరణం, మీ క్షేత్ర పరిశీలన అన్నీ సరిపోతున్నాయి. అనుమతి ఉన్న మందు ఎంపిక కోసం వ్యవసాయ అధికారి లేదా KVK ను సంప్రదించండి. ఈ యాప్ మందు పేరు, మోతాదు ఇవ్వదు.",
        "hi": "फोटो, नुकसान का स्तर, मौसम और आपकी खेत जाँच सब मेल खाते हैं। अनुमोदित दवा चुनने के लिए कृषि अधिकारी या KVK से संपर्क करें। यह ऐप दवा का नाम या मात्रा नहीं बताता।",
    },
}


def advise(pred: str, confidence: float, is_uncertain: bool, stage_info: Optional[Dict[str, Any]],
           fav_pred: Optional[float], sensor_ok: bool, field_confirmed: bool) -> Dict[str, Any]:
    stage = (stage_info or {}).get("stage", "unknown")
    stage_ok = bool((stage_info or {}).get("reliable")) and stage in ("moderate", "severe")
    lesion = (stage_info or {}).get("lesion_percent")

    evidence = {
        "image_confident": confidence >= CONFIDENT and not is_uncertain,
        "damage_measured": stage_ok,
        "weather_favourable": bool(sensor_ok and fav_pred is not None and fav_pred >= 0.5),
        "field_confirmed": bool(field_confirmed),
    }

    if pred == "healthy":
        if is_uncertain or (lesion is not None and lesion >= HEALTHY_LESION_LIMIT):
            level = "recheck"
        else:
            level = "no_action"
        missing: List[str] = []
    elif is_uncertain or not evidence["image_confident"]:
        level, missing = "recheck", ["a clearer, confident image result"]
    else:
        missing = []
        if not evidence["damage_measured"]:
            missing.append("damage at moderate or severe level")
        if not sensor_ok:
            missing.append("a fresh sensor reading")
        elif not evidence["weather_favourable"]:
            missing.append("weather that favours this disease")
        if not evidence["field_confirmed"]:
            missing.append("field symptom confirmation")
        level = "consult_officer" if not missing else "cultural_only"

    return {
        "level": level,
        "message": LEVEL_TEXT[level],
        "evidence": evidence,
        "still_needed_for_officer_consult": missing,
        "names_products_or_doses": False
    }


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
    lookup: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Unified decision pipeline invoked at the conclusion of Maize and Banana prediction:
    1. Quantifies lesion percentage and maps to stage via adaptive CIE Lab analysis.
    2. Protects against false-healthy classification when lesions are present.
    3. Fuses visual probabilities with fresh micro-climate sensor readings (max +/-25%).
    4. Evaluates the multi-factor advisory gate (photo + stage + sensor + symptoms).
    5. Enriches management guidance and strictly strips chemical product/dose mentions.
    """
    # 1. Lesion quantification
    try:
        st = analyze_lesions(image_bytes)
    except Exception as e:
        st = {"lesion_percent": None, "yellow_percent": None, "leaf_fraction": None,
              "stage": "unknown", "reliable": False, "error": str(e)}

    stage = st.get("stage", "unknown")
    stage_lbl = STAGE_LABEL.get(stage, STAGE_LABEL["unknown"])
    st["stage_label"] = stage_lbl
    result["stage_info"] = st
    result["lesion_pct"] = st.get("lesion_percent")
    result["severity_stage"] = stage

    # 2. False-Healthy Guardrail
    pred = result.get("predicted_class", "healthy")
    lesion_val = st.get("lesion_percent")
    if pred == "healthy" and st.get("reliable") and lesion_val is not None and lesion_val >= HEALTHY_LESION_LIMIT:
        result["is_uncertain"] = True
        result["uncertainty_reason"] = HEALTHY_BUT_LESIONS
        result["predicted_class_raw"] = "healthy"

    # 3. Sensor Fusion
    probs_dict = {item["label"]: float(item["probability"]) for item in result.get("all_probabilities", [])}
    if probs_dict:
        fused_dict, sensor_info = fuse(probs_dict, sensor)
        result["sensor_fusion"] = sensor_info

        if sensor_info.get("sensor_used"):
            # Update all_probabilities list with fused values
            for item in result["all_probabilities"]:
                lbl = item["label"]
                if lbl in fused_dict:
                    item["probability"] = round(float(fused_dict[lbl]), 4)
                    item["percentage"] = round(float(fused_dict[lbl]) * 100.0, 1)

            # Re-evaluate top class after sensor nudge
            top_class = max(fused_dict, key=fused_dict.get)
            top_prob = float(fused_dict[top_class])
            result["predicted_class"] = top_class
            result["confidence"] = round(top_prob, 4)
            if top_prob < CONFIDENT:
                result["is_uncertain"] = True
    else:
        sensor_info = {"sensor_used": False, "reason": "no probabilities provided"}
        result["sensor_fusion"] = sensor_info

    # 4. Advisory Gate
    cur_pred = result.get("predicted_class", "healthy")
    cur_conf = float(result.get("confidence", 0.0))
    is_uncert = bool(result.get("is_uncertain", False))
    sensor_ok = bool(sensor is not None and sensor.usable())
    fav_pred = favourability(cur_pred, sensor) if (sensor_ok and sensor is not None) else None

    advisory = advise(
        pred=cur_pred,
        confidence=cur_conf,
        is_uncertain=is_uncert,
        stage_info=st,
        fav_pred=fav_pred,
        sensor_ok=sensor_ok,
        field_confirmed=field_confirmed
    )
    result["advisory"] = advisory

    # 5. Management Guidance enrichment & chemical stripping
    guidance = dict(result.get("management_guidance") or (lookup.get(cur_pred, {}) if lookup else {}))
    guidance["stage"] = stage
    guidance["stage_label"] = stage_lbl
    guidance["advisory_level"] = advisory["level"]
    guidance["advisory_message"] = advisory["message"]

    if cur_pred in ("black_sigatoka", "cordana", "pestalotiopsis"):
        guidance["disease_note"] = DISEASE_NOTE.get(cur_pred)

    stage_block = STAGE_ACTIONS.get(stage)
    if stage_block and cur_pred != "healthy":
        guidance["immediate_actions"] = {k: stage_block[k] for k in ("en", "te", "hi")}
        guidance["reinspect_days"] = stage_block.get("reinspect_days", 3)

    result["management_guidance"] = strip_chemicals(guidance, advisory)
    return result
