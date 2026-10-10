#!/usr/bin/env python3
"""
Systematic reproduction script for Failure Scenarios A, B, C, D, E, and H.
Uses FastAPI TestClient to test backend endpoints with actual images and edge cases.
"""

import os
import sys
import json
import glob
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from backend.app.main import app
from PIL import Image, ImageDraw
import numpy as np
import cv2

client = TestClient(app)

def banner(title):
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70)

def test_scenario_a():
    banner("SCENARIO A: Select Maize + Upload Genuine Banana Leaf")
    # Take authentic banana leaves from dataset
    banana_imgs = glob.glob("data/raw/banana/*/*.PNG") + glob.glob("data/raw/banana/*/*.jpg")
    if not banana_imgs:
        banana_imgs = ["public/assets/demo_images/banana_black_sigatoka.jpg"]
    
    test_img = banana_imgs[0]
    print(f"Testing with banana image: {test_img}")
    with open(test_img, "rb") as f:
        img_bytes = f.read()

    # 1. Quality check
    q_res = client.post("/api/vision/quality-check", files={"image": ("leaf.jpg", img_bytes, "image/jpeg")})
    print(f"Quality Gate Response: status={q_res.status_code}, passed={q_res.json().get('passed')}, blur={q_res.json().get('blur_score')}")

    # 2. Crop verify with crop='maize'
    v_res = client.post("/api/vision/verify-crop", files={"image": ("leaf.jpg", img_bytes, "image/jpeg")}, data={"crop": "maize"})
    v_data = v_res.json()
    print(f"Crop Verifier Response (selected crop=maize):")
    print(f"  passed={v_data.get('passed')}")
    print(f"  status={v_data.get('status')}")
    print(f"  detected_crop={v_data.get('detected_crop')}")
    print(f"  decision={v_data.get('decision')}")
    print(f"  message={v_data.get('message', {}).get('en')}")

    # 3. What happens if predict endpoint is called directly with crop='maize'?
    p_res = client.post("/api/vision/predict", files={"image": ("leaf.jpg", img_bytes, "image/jpeg")}, data={"crop": "maize"})
    p_data = p_res.json()
    print(f"Direct Predict endpoint (crop=maize) result:")
    print(f"  predicted_class={p_data.get('predicted_class')}")
    print(f"  confidence={p_data.get('confidence')}")
    print(f"  is_uncertain={p_data.get('is_uncertain')}")
    print(f"  CRITICAL QUESTION: Does the system currently prevent /vision/predict when verify-crop fails?")

def test_scenario_b():
    banner("SCENARIO B: Select Banana + Upload Genuine Maize Leaf")
    maize_imgs = glob.glob("data/raw/maize/*/*.JPG") + glob.glob("data/raw/maize/*/*.jpg")
    if not maize_imgs:
        maize_imgs = ["public/assets/demo_images/common_rust.jpg"]
    
    test_img = maize_imgs[0]
    print(f"Testing with maize image: {test_img}")
    with open(test_img, "rb") as f:
        img_bytes = f.read()

    # 1. Quality check
    q_res = client.post("/api/vision/quality-check", files={"image": ("leaf.jpg", img_bytes, "image/jpeg")})
    print(f"Quality Gate Response: status={q_res.status_code}, passed={q_res.json().get('passed')}")

    # 2. Crop verify with crop='banana'
    v_res = client.post("/api/vision/verify-crop", files={"image": ("leaf.jpg", img_bytes, "image/jpeg")}, data={"crop": "banana"})
    v_data = v_res.json()
    print(f"Crop Verifier Response (selected crop=banana):")
    print(f"  passed={v_data.get('passed')}")
    print(f"  status={v_data.get('status')}")
    print(f"  detected_crop={v_data.get('detected_crop')}")
    print(f"  decision={v_data.get('decision')}")
    print(f"  message={v_data.get('message', {}).get('en')}")

def test_scenario_c():
    banner("SCENARIO C: Non-Plant, Unrelated Crop, Hand, Blank, Corrupted Images")
    
    # C1. Blank White
    blank_white = np.ones((300, 300, 3), dtype=np.uint8) * 255
    _, white_buf = cv2.imencode(".jpg", blank_white)
    res_white = client.post("/api/vision/verify-crop", files={"image": ("white.jpg", white_buf.tobytes(), "image/jpeg")}, data={"crop": "maize"})
    print(f"C1. Blank White: passed={res_white.json().get('passed')}, decision={res_white.json().get('decision')}, message={res_white.json().get('message', {}).get('en')}")

    # C2. Human hand / skin tones (RGB ~ 210, 160, 140)
    skin_img = np.zeros((300, 300, 3), dtype=np.uint8)
    skin_img[:] = (140, 160, 210) # BGR
    _, skin_buf = cv2.imencode(".jpg", skin_img)
    res_skin = client.post("/api/vision/verify-crop", files={"image": ("skin.jpg", skin_buf.tobytes(), "image/jpeg")}, data={"crop": "maize"})
    print(f"C2. Human Hand / Skin: passed={res_skin.json().get('passed')}, decision={res_skin.json().get('decision')}, foliage={res_skin.json().get('foliage_coverage_pct')}")

    # C3. Unrelated crop (e.g. Cotton or tomato or random green foliage that is neither maize nor banana)
    # What does the species model output for an out-of-distribution leaf?
    # Let's create an image of a broad circular leaf (like water lily / lotus / eucalyptus)
    circ_leaf = np.zeros((300, 300, 3), dtype=np.uint8)
    cv2.circle(circ_leaf, (150, 150), 120, (30, 180, 50), -1) # BGR green circle
    _, circ_buf = cv2.imencode(".jpg", circ_leaf)
    res_circ = client.post("/api/vision/verify-crop", files={"image": ("other_leaf.jpg", circ_buf.tobytes(), "image/jpeg")}, data={"crop": "maize"})
    print(f"C3. Out-Of-Distribution Green Leaf: passed={res_circ.json().get('passed')}, detected={res_circ.json().get('detected_crop')}, status={res_circ.json().get('status')}")

    # C4. Corrupt / empty bytes
    res_empty = client.post("/api/vision/verify-crop", files={"image": ("empty.jpg", b"", "image/jpeg")}, data={"crop": "maize"})
    print(f"C4. Empty File: status={res_empty.status_code}, response={res_empty.text}")

    # Corrupt garbage bytes
    res_garbage = client.post("/api/vision/verify-crop", files={"image": ("garbage.jpg", b"NOT_AN_IMAGE_DATA_12345", "image/jpeg")}, data={"crop": "maize"})
    print(f"C4. Corrupt Garbage: status={res_garbage.status_code}, passed={res_garbage.json().get('passed')}, decision={res_garbage.json().get('decision')}")

def test_scenario_d():
    banner("SCENARIO D: Maize Images across All 4 Classes (Healthy, Rust, Blight, Gray Spot)")
    classes = ["healthy", "common_rust", "northern_leaf_blight", "gray_leaf_spot"]
    for c in classes:
        files = glob.glob(f"data/raw/maize/{c}/*.JPG") + glob.glob(f"data/raw/maize/{c}/*.jpg")
        print(f"\n--- Testing Class: {c} ({len(files)} available images) ---")
        # Test 3 distinct images for this class
        for i, img_path in enumerate(files[:3]):
            with open(img_path, "rb") as f:
                b = f.read()
            res = client.post("/api/vision/predict", files={"image": ("leaf.jpg", b, "image/jpeg")}, data={"crop": "maize"})
            d = res.json()
            fname = Path(img_path).name
            print(f"  Img #{i+1} ({fname}): pred={d.get('predicted_class')}, conf={d.get('confidence'):.4f}, uncertain={d.get('is_uncertain')}")
            # Top 2 probabilities
            probs = sorted(d.get("all_probabilities", []), key=lambda x: x["probability"], reverse=True)
            top2 = ", ".join([f"{p['label']}: {p['percentage']}%" for p in probs[:2]])
            print(f"    probs -> {top2}")

def test_scenario_e():
    banner("SCENARIO E: Banana Images across Supported Classes (Healthy, Sigatoka, Wilt)")
    classes = ["healthy", "black_sigatoka", "bacterial_wilt"]
    for c in classes:
        files = glob.glob(f"data/raw/banana/{c}/*.PNG") + glob.glob(f"data/raw/banana/{c}/*.jpg")
        print(f"\n--- Testing Banana Class: {c} ({len(files)} available images) ---")
        for i, img_path in enumerate(files[:3]):
            with open(img_path, "rb") as f:
                b = f.read()
            res = client.post("/api/vision/predict", files={"image": ("leaf.jpg", b, "image/jpeg")}, data={"crop": "banana"})
            d = res.json()
            fname = Path(img_path).name
            print(f"  Img #{i+1} ({fname}): pred={d.get('predicted_class')}, conf={d.get('confidence'):.4f}, uncertain={d.get('is_uncertain')}")
            probs = sorted(d.get("all_probabilities", []), key=lambda x: x["probability"], reverse=True)
            top2 = ", ".join([f"{p['label']}: {p['percentage']}%" for p in probs[:2]])
            print(f"    probs -> {top2}")

def test_scenario_h():
    banner("SCENARIO H: Image Quality Gate / False Blur Rejection Investigation")
    # Test all demo images and several raw dataset images through quality check
    all_demo = glob.glob("public/assets/demo_images/*.jpg")
    print("Testing Quality Gate on Demo Assets:")
    for p in all_demo:
        with open(p, "rb") as f:
            b = f.read()
        res = client.post("/api/vision/quality-check", files={"image": ("leaf.jpg", b, "image/jpeg")})
        d = res.json()
        print(f"  {Path(p).name}: passed={d.get('passed')}, blur_score={d.get('blur_score')}, is_blurry={d.get('is_blurry')}, dims={d.get('dimensions')}")

    # Also test several raw images
    raw_samples = glob.glob("data/raw/maize/*/*.JPG")[:5]
    print("\nTesting Quality Gate on Raw Maize Images:")
    for p in raw_samples:
        with open(p, "rb") as f:
            b = f.read()
        res = client.post("/api/vision/quality-check", files={"image": ("leaf.jpg", b, "image/jpeg")})
        d = res.json()
        print(f"  {Path(p).name}: passed={d.get('passed')}, blur_score={d.get('blur_score')}, is_blurry={d.get('is_blurry')}, dims={d.get('dimensions')}")

if __name__ == "__main__":
    test_scenario_a()
    test_scenario_b()
    test_scenario_c()
    test_scenario_d()
    test_scenario_e()
    test_scenario_h()
