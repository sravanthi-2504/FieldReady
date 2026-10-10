"""
Image Quality Gate for AgriRhythm: FieldReady
Performs real-time blur detection, lighting/exposure analysis, and dimension checks.
Produces farmer-friendly feedback in Telugu, Hindi, and English.
"""

import cv2
import numpy as np
from PIL import Image
from typing import Dict, Any, Tuple

BLUR_THRESHOLD = 35.0      # Calibrated: Below 35 is blurry, avoids rejecting smooth green leaves
DARK_THRESHOLD = 45.0      # Average luminance below 45 is too dark
OVEREXPOSED_THRESHOLD = 235.0  # Average luminance above 235 is washed out / overexposed
MIN_DIMENSION = 64         # Minimum width and height (calibrated to support 70x70 field photography)
MAX_DIMENSION = 8000

def evaluate_image_quality(image_bytes: bytes) -> Dict[str, Any]:
    nparr = np.frombuffer(image_bytes, np.uint8)
    cv_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if cv_img is None:
        return {
            "passed": False,
            "status": "unreadable",
            "blur_score": 0.0,
            "is_blurry": True,
            "brightness_score": 0.0,
            "lighting_status": "corrupt",
            "dimensions": [0, 0],
            "aspect_ratio": 1.0,
            "recommendation_code": "corrupt_file",
            "farmer_feedback": {
                "en": "The image file could not be read. Please take a new clear photo.",
                "te": "చిత్రం సరిగ్గా తెరవబడలేదు. దయచేసి స్పష్టమైన కొత్త ఫోటో తీయండి.",
                "hi": "फोटो फ़ाइल पढ़ी नहीं जा सकी। कृपया एक नई स्पष्ट फ़ोटो लें।"
            }
        }

    height, width, _ = cv_img.shape
    aspect_ratio = round(float(width) / float(height), 2)

    # 1. Dimension Check
    if width < MIN_DIMENSION or height < MIN_DIMENSION:
        return {
            "passed": False,
            "status": "too_small",
            "blur_score": 0.0,
            "is_blurry": False,
            "brightness_score": 128.0,
            "lighting_status": "ok",
            "dimensions": [width, height],
            "aspect_ratio": aspect_ratio,
            "recommendation_code": "resolution_too_low",
            "farmer_feedback": {
                "en": "The image resolution is too low. Move closer to the leaf and take another photo.",
                "te": "ఫోటో పరిమాణం చాలా చిన్నదిగా ఉంది. ఆకు దగ్గరకు వెళ్లి మరొక ఫోటో తీయండి.",
                "hi": "फोटो का आकार बहुत छोटा है। पत्ती के करीब जाकर नई फोटो लें।"
            }
        }

    # 2. Blur Check using Laplacian Variance
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    is_blurry = laplacian_var < BLUR_THRESHOLD

    # 3. Brightness / Lighting Check
    mean_brightness = float(np.mean(gray))
    if mean_brightness < DARK_THRESHOLD:
        lighting_status = "too_dark"
    elif mean_brightness > OVEREXPOSED_THRESHOLD:
        lighting_status = "too_bright"
    else:
        lighting_status = "good"

    # Overall Gate Decision
    passed = True
    rec_code = "passed"
    feedback = {
        "en": "Photo quality is good. Proceeding with crop assessment.",
        "te": "ఫోటో స్పష్టంగా ఉంది. పంట ఆరోగ్య తనిఖీని కొనసాగించవచ్చు.",
        "hi": "फ़ोटो की गुणवत्ता अच्छी है। फसल जाँच जारी रख सकते हैं।"
    }

    if is_blurry and lighting_status == "too_dark":
        passed = False
        rec_code = "blurry_and_dark"
        feedback = {
            "en": "The photo is too blurry and too dark. Please hold the phone steady in good daylight.",
            "te": "ఫోటో చాలా అస్పష్టంగా మరియు చీకటిగా ఉంది. దయచేసి మంచి వెలుతురులో కదలకుండా తీయండి.",
            "hi": "फ़ोटो बहुत धुंधली और अंधेरे में है। कृपया अच्छी रोशनी में फ़ोन को स्थिर रखकर फोटो लें।"
        }
    elif is_blurry:
        passed = False
        rec_code = "blurry"
        feedback = {
            "en": "The leaf appears blurry. Please hold steady, tap to focus, and retake.",
            "te": "ఆకు మసకగా కనిపిస్తోంది. దయచేసి ఫోన్ కదలకుండా పట్టుకుని ఫోకస్ చేసి మళ్లీ తీయండి.",
            "hi": "पत्ती धुंधली दिख रही है। कृपया हाथ स्थिर रखकर साफ़ फ़ोटो दोबारा लें।"
        }
    elif lighting_status == "too_dark":
        passed = False
        rec_code = "too_dark"
        feedback = {
            "en": "The photo is too dark to inspect leaf spots. Please move to sunlight or switch on flash.",
            "te": "ఆకు మచ్చలను గుర్తించడానికి వెలుతురు సరిపోదు. దయచేసి ఎండలో లేదా వెలుతురులో తీయండి.",
            "hi": "पत्ती के धब्बे देखने के लिए बहुत अंधेरा है। कृपया धूप में जाकर फोटो लें।"
        }
    elif lighting_status == "too_bright":
        passed = False
        rec_code = "overexposed"
        feedback = {
            "en": "Direct glare or flash reflection hides leaf details. Shade slightly and retake.",
            "te": "అధిక వెలుతురు వల్ల ఆకు వివరాలు కనిపించడం లేదు. కాస్త నీడ చూసి మళ్లీ తీయండి.",
            "hi": "तेज़ चमक के कारण पत्ती साफ़ नहीं दिख रही है। हल्की छाया में रखकर दोबारा लें।"
        }

    return {
        "passed": passed,
        "status": "passed" if passed else "rejected",
        "blur_score": round(laplacian_var, 1),
        "is_blurry": is_blurry,
        "brightness_score": round(mean_brightness, 1),
        "lighting_status": lighting_status,
        "dimensions": [width, height],
        "aspect_ratio": aspect_ratio,
        "recommendation_code": rec_code,
        "farmer_feedback": feedback
    }
