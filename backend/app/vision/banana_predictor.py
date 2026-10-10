"""
Banana Model Inference Service for AgriRhythm: FieldReady
Loads PyTorch MobileNetV2 trained on Banana Leaf Disease dataset (3 classes),
computes calibrated softmax scores, applies abstention threshold (0.65),
and returns ICAR-NRCB / TNAU agronomic guidance and differential causes.
"""

import time
import io
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
import cv2
import numpy as np
from PIL import Image
from typing import Dict, Any, List, Optional
from pathlib import Path

from backend.app.vision.banana_guidance import (
    BANANA_CLASSES,
    BANANA_CLASS_DISPLAY_NAMES,
    BANANA_DIFFERENTIALS,
    BANANA_MANAGEMENT_GUIDANCE_DB
)

def estimate_banana_lesion_severity(cv_img: np.ndarray):
    """
    Estimates lesion spread percentage and agronomic severity stage for banana leaves.
    Returns (lesion_pct: float, stage: str).
    """
    if cv_img is None:
        return 0.0, "healthy_or_incubation"

    hsv = cv2.cvtColor(cv_img, cv2.COLOR_BGR2HSV)
    h, w, _ = cv_img.shape
    total_pixels = h * w

    # Leaf foliage mask (green + chlorotic yellow + necrotic brown)
    lower_foliage = np.array([12, 12, 25])
    upper_foliage = np.array([95, 255, 255])
    mask_foliage = cv2.inRange(hsv, lower_foliage, upper_foliage)
    foliage_count = int(cv2.countNonZero(mask_foliage))
    if foliage_count < 100:
        foliage_count = total_pixels

    # Necrotic / disease lesion mask:
    # 1. Dark brown / reddish brown / rust pustules / dark necrosis
    lower_brown = np.array([5, 30, 20])
    upper_brown = np.array([24, 255, 180])
    mask_brown = cv2.inRange(hsv, lower_brown, upper_brown)

    # 2. Dark necrotic spots / black sigatoka streaks
    lower_dark = np.array([0, 0, 10])
    upper_dark = np.array([180, 255, 60])
    mask_dark = cv2.inRange(hsv, lower_dark, upper_dark)
    mask_dark = cv2.bitwise_and(mask_dark, mask_foliage)

    # 3. Tan / grayish necrotic spots
    lower_tan = np.array([10, 15, 60])
    upper_tan = np.array([32, 110, 190])
    mask_tan = cv2.inRange(hsv, lower_tan, upper_tan)

    combined_lesions = cv2.bitwise_or(mask_brown, mask_dark)
    combined_lesions = cv2.bitwise_or(combined_lesions, mask_tan)
    combined_lesions = cv2.bitwise_and(combined_lesions, mask_foliage)
    lesion_pixels = int(cv2.countNonZero(combined_lesions))

    lesion_pct = round((lesion_pixels / float(foliage_count)) * 100.0, 1)

    if lesion_pct < 1.0:
        stage = "healthy_or_incubation"
    elif lesion_pct < 5.0:
        stage = "early"
    elif lesion_pct < 20.0:
        stage = "moderate"
    else:
        stage = "severe"

    return lesion_pct, stage

class BananaPredictor:
    def __init__(self, weights_path: str = None):
        self.device = torch.device("cpu")
        # Resolve relative to the project root, not the folder uvicorn was started from
        self.weights_path = Path(weights_path) if weights_path else Path(__file__).resolve().parents[3] / "models" / "banana_mobilenetv2.pth"
        self.classes = BANANA_CLASSES
        self.model = None
        self.is_loaded = False

        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

        self._load_model()

    def _load_model(self):
        try:
            model = models.mobilenet_v2(weights=None)
            in_features = model.classifier[1].in_features
            model.classifier = nn.Sequential(
                nn.Dropout(p=0.2),
                nn.Linear(in_features, len(self.classes))
            )
            if self.weights_path.exists():
                state_dict = torch.load(self.weights_path, map_location=self.device)
                model.load_state_dict(state_dict)
                model.eval()
                self.model = model
                self.is_loaded = True
                print(f"Loaded banana MobileNetV2 weights from {self.weights_path}")
            else:
                print(f"Warning: Banana model weights not found at {self.weights_path}.")
        except Exception as e:
            print(f"Error loading banana model weights: {e}")
            self.is_loaded = False

    def predict(
        self,
        image_bytes: bytes,
        is_demo_mode: bool = False,
        field_id: Optional[str] = None,
        field_confirmed: bool = False,
        sensor: Optional[Any] = None
    ) -> Dict[str, Any]:
        t0 = time.perf_counter()

        if not self.is_loaded or is_demo_mode:
            latency = (time.perf_counter() - t0) * 1000.0
            return self._build_demo_response(latency)

        try:
            # Estimate lesion severity and stage from leaf pixels
            cv_img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
            lesion_pct, severity_stage = estimate_banana_lesion_severity(cv_img)

            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            tensor = self.transform(image).unsqueeze(0).to(self.device)

            with torch.no_grad():
                logits = self.model(tensor)
                probs = torch.softmax(logits, dim=1).squeeze(0).numpy()

            latency_ms = (time.perf_counter() - t0) * 1000.0

            pred_idx = int(probs.argmax())
            pred_class = self.classes[pred_idx]
            max_prob = float(probs[pred_idx])

            # Abstention & Uncertainty Handling
            is_uncertain = max_prob < 0.65
            uncertainty_reason = None
            if is_uncertain:
                uncertainty_reason = {
                    "en": f"Confidence score ({round(max_prob * 100, 1)}%) is below the safe threshold (65%). Visual evidence is inconclusive.",
                    "te": f"విశ్వసనీయత స్కోరు ({round(max_prob * 100, 1)}%) సురక్షిత పరిమితి (65%) కంటే తక్కువగా ఉంది. మరింత పరిశీలన అవసరం.",
                    "hi": f"विश्वसनीयता स्कोर ({round(max_prob * 100, 1)}%) 65% सीमा से कम है। दृश्य प्रमाण अनिर्णायक हैं।"
                }

            # False-Healthy Guardrail:
            # If the model predicts 'healthy' but lesion pixels are visible (> 3.0%),
            # mark as inconclusive rather than falsely reporting 100% healthy leaf.
            if pred_class == "healthy" and lesion_pct > 3.0:
                is_uncertain = True
                uncertainty_reason = {
                    "en": f"Visual conflict: model predicted Healthy, but {lesion_pct}% necrotic/chlorotic lesion spread was detected. Latent incubation, Cordana leaf spot, or early streak symptoms suspected. Inconclusive.",
                    "te": f"దృశ్య సంకేతాల వైరుధ్యం: మోడల్ ఆరోగ్యకరమైనదిగా సూచించింది, కానీ ఆకుపై {lesion_pct}% నెక్రోటిక్ మచ్చల వ్యాప్తి గుర్తించబడింది. ప్రారంభ ఇన్ఫెక్షన్ లేదా కార్డానా మచ్చ తెగులు అనుమానించబడింది.",
                    "hi": f"दृश्य साक्ष्य में विसंगति: मॉडल ने स्वस्थ अनुमान लगाया, लेकिन पत्ती पर {lesion_pct}% रोगग्रस्त धब्बे पाए गए। प्रारंभिक संक्रमण या कॉर्डाना लीफ स्पॉट का संदेह है। अनिर्णायक।"
                }

            prob_list = []
            for i, c in enumerate(self.classes):
                prob_list.append({
                    "label": c,
                    "name": BANANA_CLASS_DISPLAY_NAMES[c]["en"],
                    "probability": round(float(probs[i]), 4),
                    "percentage": round(float(probs[i]) * 100, 1)
                })

            differentials = BANANA_DIFFERENTIALS.get(pred_class, [])
            guidance = BANANA_MANAGEMENT_GUIDANCE_DB.get(pred_class, BANANA_MANAGEMENT_GUIDANCE_DB["healthy"])

            res = {
                "crop": "banana",
                "predicted_class": pred_class,
                "display_name": BANANA_CLASS_DISPLAY_NAMES[pred_class],
                "confidence": round(max_prob, 4),
                "is_uncertain": is_uncertain,
                "uncertainty_reason": uncertainty_reason,
                "all_probabilities": prob_list,
                "model_version": "banana_mobilenet_v2_v1.0",
                "source_mode": "model_inference",
                "latency_ms": round(latency_ms, 2),
                "differential_possibilities": differentials,
                "management_guidance": guidance,
                "lesion_pct": lesion_pct,
                "severity_stage": severity_stage
            }
            def lookup(cls_name: str):
                return (
                    BANANA_CLASS_DISPLAY_NAMES.get(cls_name, BANANA_CLASS_DISPLAY_NAMES["healthy"]),
                    BANANA_MANAGEMENT_GUIDANCE_DB.get(cls_name, BANANA_MANAGEMENT_GUIDANCE_DB["healthy"])
                )

            try:
                from backend.app.vision.decision_pipeline import run_decision_pipeline
            except ImportError:
                try:
                    from app.vision.decision_pipeline import run_decision_pipeline
                except ImportError:
                    from decision_pipeline import run_decision_pipeline

            return run_decision_pipeline(res, image_bytes, sensor, field_confirmed, lookup)
        except Exception as e:
            latency_ms = (time.perf_counter() - t0) * 1000.0
            print(f"Banana inference error: {e}")
            raise

    def _build_demo_response(self, latency_ms: float, error: str = None) -> Dict[str, Any]:
        pred_class = "black_sigatoka"
        return {
            "crop": "banana",
            "predicted_class": pred_class,
            "display_name": BANANA_CLASS_DISPLAY_NAMES[pred_class],
            "confidence": 0.85,
            "is_uncertain": False,
            "uncertainty_reason": None,
            "all_probabilities": [
                {"label": "black_sigatoka", "name": "Black Sigatoka", "probability": 0.85, "percentage": 85.0},
                {"label": "bacterial_wilt", "name": "Bacterial Wilt", "probability": 0.10, "percentage": 10.0},
                {"label": "healthy", "name": "Healthy Banana Leaf", "probability": 0.05, "percentage": 5.0}
            ],
            "model_version": "banana_demo_workflow_v1.0",
            "source_mode": "demonstration",
            "latency_ms": round(latency_ms, 2),
            "differential_possibilities": BANANA_DIFFERENTIALS[pred_class],
            "management_guidance": BANANA_MANAGEMENT_GUIDANCE_DB[pred_class],
            "note": "Demonstration fallback." if not error else f"Fallback due to: {error}",
            "lesion_pct": 12.5,
            "severity_stage": "moderate"
        }
