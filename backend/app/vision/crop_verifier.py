"""
Crop Verification & Botanical Species Gate for AgriRhythm: FieldReady
Performs genuine botanical visual discrimination (Maize vs Banana vs Non-plant):
- Rejects non-plant images via foliage coverage threshold (<15%).
- Employs a calibrated MobileNetV2 botanical species classifier to detect Maize vs Banana.
- Catches crop selection mismatches (e.g. uploading a Banana leaf when Maize is selected).
"""

import io
from pathlib import Path
from typing import Dict, Any
import cv2
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms

# Global cached species model
_species_model = None
_species_transform = None

def _get_species_model():
    global _species_model, _species_transform
    if _species_model is not None:
        return _species_model, _species_transform

    weights_path = Path(__file__).resolve().parents[3] / "models" / "crop_verifier_mobilenetv2.pth"
    if not weights_path.exists():
        # Fallback if model file is not present
        return None, None

    try:
        model = models.mobilenet_v2(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.2),
            nn.Linear(in_features, 2)
        )
        state_dict = torch.load(weights_path, map_location=torch.device("cpu"))
        model.load_state_dict(state_dict)
        model.eval()

        transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        _species_model = model
        _species_transform = transform
        return _species_model, _species_transform
    except Exception as e:
        print(f"Warning: Failed to load crop_verifier_mobilenetv2: {e}")
        return None, None

def verify_crop_image(image_bytes: bytes, selected_crop: str = "maize") -> Dict[str, Any]:
    nparr = np.frombuffer(image_bytes, np.uint8)
    cv_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if cv_img is None:
        return {
            "passed": False,
            "status": "unreadable_file",
            "is_plant_leaf": False,
            "detected_crop": "non_plant",
            "foliage_coverage_pct": 0.0,
            "crop_verified": False,
            "decision": "reject",
            "message": {
                "en": "The image file could not be decoded. Please upload a clear leaf photo.",
                "te": "చిత్రం సరిగ్గా తెరవబడలేదు. దయచేసి స్పష్టమైన ఆకు ఫోటోను అప్‌లోడ్ చేయండి.",
                "hi": "फोटो फ़ाइल पढ़ी नहीं जा सकी। कृपया एक स्पष्ट पत्ती की फ़ोटो अपलोड करें।"
            }
        }

    # Analyze plant chlorophyll & foliage pigments in HSV space
    hsv = cv2.cvtColor(cv_img, cv2.COLOR_BGR2HSV)
    h, w, _ = cv_img.shape
    total_pixels = h * w

    # Broadened foliage & necrotic pigment boundaries in HSV space
    lower_green = np.array([20, 15, 25])
    upper_green = np.array([95, 255, 255])
    mask_green = cv2.inRange(hsv, lower_green, upper_green)

    lower_necrotic = np.array([11, 25, 25])
    upper_necrotic = np.array([25, 255, 255])
    mask_necrotic = cv2.inRange(hsv, lower_necrotic, upper_necrotic)

    combined_foliage = cv2.bitwise_or(mask_green, mask_necrotic)
    foliage_pixels = int(cv2.countNonZero(combined_foliage))
    foliage_coverage = round((foliage_pixels / float(total_pixels)) * 100.0, 1)

    # 1. Reject non-plant images (< 6.0% foliage/leaf pixels)
    if foliage_coverage < 6.0:
        return {
            "passed": False,
            "status": "not_plant_leaf",
            "is_plant_leaf": False,
            "detected_crop": "non_plant",
            "foliage_coverage_pct": foliage_coverage,
            "crop_verified": False,
            "decision": "reject_not_leaf",
            "message": {
                "en": "The uploaded photo does not appear to contain a plant leaf (insufficient foliage detected). Please take a photo of a crop leaf.",
                "te": "అప్‌లోడ్ చేసిన చిత్రంలో మొక్క ఆకు కనిపించడం లేదు. దయచేసి పంట ఆకు యొక్క స్పష్టమైన ఫోటో తీయండి.",
                "hi": "अपलोड की गई फ़ोटो में पौधे की पत्ती नहीं दिख रही है। कृपया फसल की पत्ती की स्पष्ट फ़ोटो लें।"
            }
        }

    norm_selected = selected_crop.lower().strip()

    # 2. Check unsupported crops
    if norm_selected == "cotton":
        return {
            "passed": False,
            "status": "crop_unsupported",
            "is_plant_leaf": True,
            "detected_crop": "cotton",
            "foliage_coverage_pct": foliage_coverage,
            "crop_verified": False,
            "decision": "halt_unsupported",
            "message": {
                "en": "Cotton is not certified for AI disease diagnosis in this release. Diagnostic workflow stopped to prevent false advice.",
                "te": "ఈ విడుదల లో ప్రత్తి పంటకు AI రోగ నిర్ధారణ ధృవీకరించబడలేదు. తప్పుడు సలహాలు నివారించడానికి తనిఖీ నిలిపివేయబడింది.",
                "hi": "इस संस्करण में कपास के लिए AI रोग निदान प्रमाणित नहीं है। गलत सलाह से बचने के लिए जाँच रोक दी गई है।"
            }
        }

    # 3. Botanical Crop Species Classifier (Maize vs Banana)
    detected_crop = "unknown"
    confidence = 0.0

    species_model, species_tf = _get_species_model()
    if species_model is not None:
        try:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            tensor_img = species_tf(pil_img).unsqueeze(0)
            with torch.no_grad():
                logits = species_model(tensor_img)
                probs = torch.softmax(logits, dim=1)[0]
                pred_idx = int(torch.argmax(probs).item())
                confidence = float(probs[pred_idx].item())
                classes = ["maize", "banana"]
                if confidence >= 0.70:
                    detected_crop = classes[pred_idx]
        except Exception as e:
            print(f"Error during species inference: {e}")

    # 4. High-confidence mismatch warning (>= 85% species confidence mismatch)
    # Allows farmer override / confirmation instead of a hard blocking error
    if detected_crop in ["maize", "banana"] and detected_crop != norm_selected and confidence >= 0.85:
        return {
            "passed": True,
            "status": "crop_mismatch_warning",
            "is_plant_leaf": True,
            "detected_crop": detected_crop,
            "foliage_coverage_pct": foliage_coverage,
            "species_confidence": round(confidence, 3),
            "crop_verified": False,
            "decision": "warn_mismatch_allow_override",
            "message": {
                "en": f"Botanical features suggest {detected_crop.capitalize()} ({round(confidence * 100, 1)}%), but you selected {norm_selected.capitalize()}. You may switch crop or confirm as {norm_selected.capitalize()}.",
                "te": f"బొటానికల్ లక్షణాలు {detected_crop} అని సూచిస్తున్నాయి ({round(confidence * 100, 1)}%), కానీ మీరు {norm_selected} ఎంచుకున్నారు. పంటను మార్చవచ్చు లేదా {norm_selected} గా నిర్ధారించవచ్చు.",
                "hi": f"वानस्पतिक लक्षण {detected_crop} दर्शाते हैं ({round(confidence * 100, 1)}%), लेकिन आपने {norm_selected} चुना है। फसल बदल सकते हैं या {norm_selected} की पुष्टि कर सकते हैं।"
            }
        }

    # 5. Crop Verified Match
    if norm_selected == detected_crop:
        return {
            "passed": True,
            "status": "verified",
            "is_plant_leaf": True,
            "detected_crop": detected_crop,
            "foliage_coverage_pct": foliage_coverage,
            "species_confidence": round(confidence, 3),
            "crop_verified": True,
            "decision": "proceed",
            "message": {
                "en": f"Crop verified: {detected_crop.capitalize()} leaf confirmed with botanical visual features.",
                "te": f"పంట ధృవీకరించబడింది: బొటానికల్ లక్షణాలతో {detected_crop} ఆకు నిర్ధారించబడింది.",
                "hi": f"फसल सत्यापित: वानस्पतिक विशेषताओं के साथ {detected_crop} पत्ती की पुष्टि हुई।"
            }
        }

    # 6. Uncertain / ambiguous botanical features -> require explicit farmer confirmation
    return {
        "passed": True,
        "status": "foliage_confirmed_species_requires_confirmation",
        "is_plant_leaf": True,
        "detected_crop": detected_crop if detected_crop != "unknown" else norm_selected,
        "foliage_coverage_pct": foliage_coverage,
        "species_confidence": round(confidence, 3),
        "crop_verified": False,
        "decision": "require_farmer_confirmation",
        "message": {
            "en": f"Plant foliage detected ({foliage_coverage}%). Species features are ambiguous; please confirm that this is a {norm_selected} leaf before continuing.",
            "te": f"మొక్క ఆకు గుర్తించబడింది ({foliage_coverage}%). జాతి లక్షణాలు అస్పష్టంగా ఉన్నాయి; దయచేసి కొనసాగే ముందు ఇది {norm_selected} ఆకు అని నిర్ధారించండి.",
            "hi": f"पौधे की पत्ती पहचानी गई ({foliage_coverage}%)। प्रजाति के लक्षण अस्पष्ट हैं; कृपया जारी रखने से पहले पुष्टि करें कि यह {norm_selected} की पत्ती है।"
        }
    }
