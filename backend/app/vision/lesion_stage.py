"""
Lesion-area stage estimation (v2) for leaf photos.

v1 used fixed colour thresholds. On real photos that failed in two ways:
a pale grey-green healthy banana leaf was read as "background", and small dark
specks were under-counted. v2 compares every pixel with THIS leaf's own healthy
colour (in CIE Lab), so it works for pale, dark, blue-green and yellow-green leaves.

Still a heuristic, not a trained model: tune the numbers in CONFIG on your own photos.
Dependencies: numpy, Pillow only.
"""
import base64
import io
from typing import Any, Dict, Optional

import numpy as np
from PIL import Image, ImageFilter

CONFIG = {
    "max_side": 384,
    # lesion = darker than the leaf's healthy colour by this much (L units) ...
    "dark_dL": -14.0,
    # ... AND darker than its local neighbourhood by this much (ignores shading and shine)
    "dark_local": -7.0,
    # ... or redder/browner (a*) while not brighter, ...
    "brown_da": 7.0,
    # ... or much more yellow-orange (b*) while darker (rust pustules, necrosis)
    "orange_db": 16.0,
    # yellow halo (chlorosis) shows up as a b* rise without darkening
    "yellow_db": 14.0,
    # if less than this share of pixels looks like leaf by colour, assume the leaf fills the frame
    "min_leaf_fraction": 0.30,
    # lesion % of visible leaf -> stage
    "stages": [(3.0, "trace"), (12.0, "early"), (30.0, "moderate"), (101.0, "severe")],
}


def _srgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    c = rgb.astype(np.float32) / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    m = np.array([[0.4124564, 0.3575761, 0.1804375],
                  [0.2126729, 0.7151522, 0.0721750],
                  [0.0193339, 0.1191920, 0.9503041]], dtype=np.float32)
    xyz = c @ m.T / np.array([0.95047, 1.0, 1.08883], dtype=np.float32)
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16.0 / 116.0)
    L = 116.0 * f[..., 1] - 16.0
    a = 500.0 * (f[..., 0] - f[..., 1])
    b = 200.0 * (f[..., 1] - f[..., 2])
    return np.stack([L, a, b], axis=-1)


def _stage_for(pct: float) -> str:
    for limit, name in CONFIG["stages"]:
        if pct < limit:
            return name
    return "severe"


def _extract_leaf_and_lesions(image_bytes: bytes) -> Optional[Dict[str, Any]]:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img.thumbnail((CONFIG["max_side"], CONFIG["max_side"]))
    rgb = np.asarray(img)
    lab = _srgb_to_lab(rgb)
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    total = L.size

    # --- which pixels are leaf? ---------------------------------------------
    # Leaf colours: green-ish (a* negative) or the grey-green of pale leaves.
    greenish = (a < -2.0) & (L > 12) & (L < 92)
    leaf = greenish.copy()
    if leaf.mean() < CONFIG["min_leaf_fraction"]:
        # Not enough green: either a pale leaf or a heavily diseased one that fills the frame.
        leaf = (L > 8) & (L < 97)

    # --- baseline healthy colour of this leaf ---------------------------------
    base_pool = greenish if greenish.sum() > 0.02 * total else leaf
    if base_pool.sum() < 50:
        return None
    bL, ba, bb = (float(np.median(ch[base_pool])) for ch in (L, a, b))
    dL, da, db = L - bL, a - ba, b - bb

    # --- classify pixels ------------------------------------------------------
    L8 = Image.fromarray(np.clip(L * 2.55, 0, 255).astype(np.uint8))
    L_loc = np.asarray(L8.filter(ImageFilter.GaussianBlur(radius=max(8, L.shape[1] // 8))), dtype=np.float32) / 2.55
    dark = (dL < CONFIG["dark_dL"]) & ((L - L_loc) < CONFIG["dark_local"])
    brown = (da > CONFIG["brown_da"]) & (dL < 6.0)
    orange = (db > CONFIG["orange_db"]) & (dL < 4.0) & (da > 0.0)
    yellow = (db > CONFIG["yellow_db"]) & (da <= 0.0) & (dL > -10.0)

    lesion = leaf & (dark | brown | orange)
    yellow = leaf & yellow & ~lesion

    # remove single-pixel noise (keeps specks of a few pixels, drops salt-and-pepper)
    lm = Image.fromarray((lesion * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3))
    lesion = np.asarray(lm) > 127

    leaf_area = int(leaf.sum())
    if leaf_area < 0.05 * total:
        return None

    lesion_pct = float(lesion.sum()) / leaf_area * 100.0
    yellow_pct = float(yellow.sum()) / leaf_area * 100.0

    return {
        "img": img,
        "rgb": rgb,
        "leaf": leaf,
        "lesion": lesion,
        "yellow": yellow,
        "leaf_area": leaf_area,
        "total": total,
        "lesion_pct": lesion_pct,
        "yellow_pct": yellow_pct,
        "leaf_fraction": leaf_area / total,
    }


def analyze_lesions(image_bytes: bytes) -> Dict[str, Any]:
    res = _extract_leaf_and_lesions(image_bytes)
    if res is None:
        return {
            "lesion_percent": None,
            "yellow_percent": None,
            "leaf_fraction": 0.0,
            "stage": "unknown",
            "reliable": False,
        }
    return {
        "lesion_percent": round(res["lesion_pct"], 1),
        "yellow_percent": round(res["yellow_pct"], 1),
        "leaf_fraction": round(res["leaf_fraction"], 3),
        "stage": _stage_for(res["lesion_pct"]),
        "reliable": True,
    }


def highlight_lesions(image_bytes: bytes) -> Optional[Dict[str, Any]]:
    """Generates an affected-area overlay marking suspected damaged tissue in red with white outline,
    and yellowing in amber. Uses the exact same pixel masks as analyze_lesions.
    Returns None for clean foliage (<2.0% lesions) so the frontend shows the un-marked photo."""
    res = _extract_leaf_and_lesions(image_bytes)
    if res is None:
        return None

    lesion_pct = res["lesion_pct"]
    yellow_pct = res["yellow_pct"]

    # Clean leaves or negligible trace damage return None
    if lesion_pct < 2.0:
        return None

    rgb = res["rgb"].copy().astype(np.float32)
    lesion = res["lesion"]
    yellow = res["yellow"]
    leaf = res["leaf"]

    # 1. Tint chlorosis / yellow halos in amber (#ffbe00 = 255, 190, 0)
    if np.any(yellow):
        amber = np.array([255.0, 190.0, 0.0], dtype=np.float32)
        rgb[yellow] = 0.45 * rgb[yellow] + 0.55 * amber

    # 2. Tint necrotic lesions in red (#eb1e1e = 235, 30, 30)
    if np.any(lesion):
        red = np.array([235.0, 30.0, 30.0], dtype=np.float32)
        rgb[lesion] = 0.35 * rgb[lesion] + 0.65 * red

        # 3. White outline along perimeter of lesion regions (#ffffff = 255, 255, 255)
        lesion_im = Image.fromarray((lesion * 255).astype(np.uint8))
        dilated = np.asarray(lesion_im.filter(ImageFilter.MaxFilter(3))) > 0
        outline = dilated & (~lesion) & leaf
        rgb[outline] = [255.0, 255.0, 255.0]

    marked_im = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))
    buf = io.BytesIO()
    marked_im.save(buf, format="JPEG", quality=85)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    image_data_url = f"data:image/jpeg;base64,{b64}"

    return {
        "image_data_url": image_data_url,
        "lesion_percent": round(lesion_pct, 1),
        "yellow_percent": round(yellow_pct, 1),
        "legend": {
            "title": {
                "en": "Suspected damaged tissue",
                "te": "దెబ్బతిన్నట్లు భావిస్తున్న భాగం",
                "hi": "संभावित प्रभावित ऊतक",
            },
            "red": {
                "en": "Lesions / necrosis",
                "te": "మచ్చలు / ఎండిన భాగం",
                "hi": "धब्बे / मृत ऊतक",
            },
            "amber": {
                "en": "Yellowing / chlorosis",
                "te": "పసుపు రంగులోకి మారిన భాగం",
                "hi": "पीलापन / क्लोरोसिस",
            },
            "note": {
                "en": "Colours show damaged leaf tissue from colour analysis, not the disease name.",
                "te": "ఈ రంగులు రంగుల విశ్లేషణ ఆధారంగా దెబ్బతిన్న ఆకు భాగాన్ని మాత్రమే చూపుతాయి, తెగులు పేరును కాదు.",
                "hi": "यह रंग केवल रंग विश्लेषण से प्रभावित हिस्से को दर्शाते हैं, बीमारी का नाम नहीं।",
            },
        },
        "basis": "cie_lab_adaptive_colour",
    }
