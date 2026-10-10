#!/usr/bin/env python3
"""
Maize Lookalike Disease Classifier & Confusion Matrix Evaluator
Specifically measures Common Rust (Puccinia sorghi) versus Southern Rust (Puccinia polysora)
differentiation, as well as per-class precision, recall, F1-score, and accuracy across all classes.

Safeguard: Checks whether the active checkpoint actually contains 'southern_rust' in its weights.
If southern_rust is not trained, reports honest evaluation on supported classes and flags the gap.
"""

import sys
import json
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from sklearn.metrics import classification_report, confusion_matrix

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

MODEL_PATH = ROOT / "models" / "maize_mobilenetv2.pth"
REGISTRY_PATH = ROOT / "models" / "model_registry.json"
TEST_MANIFEST = ROOT / "data" / "manifests" / "test.json"

TARGET_5_CLASSES = ["healthy", "common_rust", "southern_rust", "northern_leaf_blight", "gray_leaf_spot"]
SUPPORTED_4_CLASSES = ["healthy", "common_rust", "northern_leaf_blight", "gray_leaf_spot"]

def inspect_checkpoint(weights_path: Path):
    if not weights_path.exists():
        return None, 0
    state_dict = torch.load(weights_path, map_location="cpu")
    for k, v in state_dict.items():
        if "classifier" in k and "weight" in k:
            out_features = v.shape[0]
            in_features = v.shape[1]
            return state_dict, out_features
    return state_dict, 0

def run_evaluation():
    print("=" * 70)
    print("AGRIRHYTHM: FIELDREADY — MAIZE DISEASE & LOOKALIKE EVALUATION")
    print("=" * 70)

    state_dict, num_classes = inspect_checkpoint(MODEL_PATH)
    if state_dict is None:
        print(f"ERROR: Model checkpoint not found at {MODEL_PATH}")
        sys.exit(1)

    print(f"Checkpoint Path: {MODEL_PATH}")
    print(f"Output Head Dimension: {num_classes} classes")

    has_southern_rust = (num_classes == 5)
    active_classes = TARGET_5_CLASSES if has_southern_rust else SUPPORTED_4_CLASSES

    if not has_southern_rust:
        print("\n[CRITICAL ML AUDIT DISCLOSURE]")
        print("-> The current checkpoint 'models/maize_mobilenetv2.pth' was trained on 4 classes:")
        print(f"   {SUPPORTED_4_CLASSES}")
        print("-> 'southern_rust' (Puccinia polysora) is NOT an output class in this model artifact.")
        print("-> Evaluating supported 4 classes on independent held-out test data...\n")
    else:
        print("\n-> The checkpoint contains 5 classes, including 'southern_rust'.\n")

    # Load model
    model = models.mobilenet_v2(weights=None)
    in_feat = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.2),
        nn.Linear(in_feat, num_classes)
    )
    model.load_state_dict(state_dict)
    model.eval()

    eval_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor], None) if False else transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    if not TEST_MANIFEST.exists():
        print(f"Warning: Test manifest not found at {TEST_MANIFEST}")
        return

    with open(TEST_MANIFEST, "r") as f:
        test_records = json.load(f)

    y_true = []
    y_pred = []
    confidences = []

    for item in test_records:
        true_label = item["class_label"]
        if true_label not in active_classes:
            continue
        p = Path(item["file_path"])
        if not p.exists():
            continue

        try:
            img = Image.open(p).convert("RGB")
            tensor = eval_transform(img).unsqueeze(0)
            with torch.no_grad():
                logits = model(tensor)
                probs = torch.softmax(logits, dim=1).squeeze(0).numpy()
            pred_idx = int(probs.argmax())
            pred_label = active_classes[pred_idx]
            max_conf = float(probs[pred_idx])

            y_true.append(true_label)
            y_pred.append(pred_label)
            confidences.append(max_conf)
        except Exception as e:
            continue

    if not y_true:
        print("No test images could be evaluated.")
        return

    print("----------------------------------------------------------------------")
    print(f"TEST RESULTS ON {len(y_true)} INDEPENDENT SAMPLES")
    print("----------------------------------------------------------------------")

    report_str = classification_report(y_true, y_pred, labels=active_classes, zero_division=0)
    print(report_str)

    cm = confusion_matrix(y_true, y_pred, labels=active_classes)
    print("\nCONFUSION MATRIX (Rows: Ground Truth, Columns: Model Prediction):")
    header = f"{'Class':<22}" + "".join([f"{c[:12]:>14}" for c in active_classes])
    print(header)
    print("-" * len(header))
    for i, row_class in enumerate(active_classes):
        row_str = f"{row_class:<22}" + "".join([f"{cm[i, j]:>14}" for j in range(len(active_classes))])
        print(row_str)

    # Specific Lookalike Rust Analysis
    print("\n----------------------------------------------------------------------")
    print("COMMON RUST VS. SOUTHERN RUST SPECIFIC ANALYSIS")
    print("----------------------------------------------------------------------")
    if "common_rust" in active_classes and "southern_rust" in active_classes:
        cr_idx = active_classes.index("common_rust")
        sr_idx = active_classes.index("southern_rust")
        print(f"True Common Rust -> Predicted Common Rust: {cm[cr_idx, cr_idx]}")
        print(f"True Common Rust -> Predicted Southern Rust: {cm[cr_idx, sr_idx]}")
        print(f"True Southern Rust -> Predicted Southern Rust: {cm[sr_idx, sr_idx]}")
        print(f"True Southern Rust -> Predicted Common Rust: {cm[sr_idx, cr_idx]}")
    else:
        cr_idx = active_classes.index("common_rust")
        total_cr = sum(cm[cr_idx])
        correct_cr = cm[cr_idx, cr_idx]
        print(f"Common Rust Accuracy: {correct_cr}/{total_cr} ({correct_cr/max(1, total_cr)*100:.1f}%)")
        print("Southern Rust: Not trained in current 4-class checkpoint.")
        print("To support Southern Rust differentiation:")
        print("1. Place verified southern rust images in 'data/maize_disease/southern_rust/'")
        print("2. Run 'python scripts/verify_maize_dataset.py' to generate leak-free plant splits")
        print("3. Train 5-class model via 'python train_crop.py --crop maize_5class --data data/maize_disease'")

    acc = np.mean(np.array(y_true) == np.array(y_pred))
    mean_conf = np.mean(confidences)
    print(f"\nOverall Top-1 Test Accuracy: {acc * 100:.2f}%")
    print(f"Mean Prediction Confidence: {mean_conf * 100:.2f}%\n")

if __name__ == "__main__":
    run_evaluation()
