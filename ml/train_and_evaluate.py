#!/usr/bin/env python3
"""
Reproducible Training & Evaluation Pipeline for AgriRhythm: FieldReady Maize Health Classifier.
Architecture: MobileNetV2 (fine-tuned) with 4 classes:
  0: healthy
  1: common_rust
  2: northern_leaf_blight
  3: gray_leaf_spot

Evaluates:
  - Accuracy
  - Macro-F1
  - Per-class precision & recall
  - Confusion Matrix
  - Inference Latency (batch=1, CPU)
  - Model Size (MB)
Saves artifact to: models/maize_mobilenetv2.pth and models/model_registry.json
"""

import os
import sys
import time
import json
import random
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
from sklearn.metrics import classification_report, confusion_matrix, f1_score, precision_score, recall_score

RANDOM_SEED = 42
torch.manual_seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)
random.seed(RANDOM_SEED)

CLASSES = ["healthy", "common_rust", "northern_leaf_blight", "gray_leaf_spot"]
CLASS_TO_IDX = {c: i for i, c in enumerate(CLASSES)}
IDX_TO_CLASS = {i: c for i, c in enumerate(CLASSES)}

class MaizeDataset(Dataset):
    def __init__(self, manifest_path: Path, transform=None):
        with open(manifest_path, "r") as f:
            self.records = json.load(f)
        self.transform = transform

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx):
        item = self.records[idx]
        img_path = Path(item["file_path"])
        image = Image.open(img_path).convert("RGB")
        label = CLASS_TO_IDX[item["class_label"]]
        if self.transform:
            image = self.transform(image)
        return image, label

def get_transforms():
    train_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    val_test_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    return train_transform, val_test_transform

def build_model(num_classes=4):
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    # Freeze earlier feature extractor layers for fast adaptation and small dataset robustness
    for param in model.features[:10].parameters():
        param.requires_grad = False
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.2),
        nn.Linear(in_features, num_classes)
    )
    return model

def train_and_evaluate():
    print("==================================================")
    print("AgriRhythm: FieldReady - MobileNetV2 Maize Training")
    print("==================================================")

    train_manifest = Path("data/manifests/train.json")
    val_manifest = Path("data/manifests/val.json")
    test_manifest = Path("data/manifests/test.json")

    if not train_manifest.exists():
        print(f"Error: {train_manifest} does not exist. Run prepare_dataset.py first.")
        sys.exit(1)

    train_tf, eval_tf = get_transforms()

    train_ds = MaizeDataset(train_manifest, transform=train_tf)
    val_ds = MaizeDataset(val_manifest, transform=eval_tf)
    test_ds = MaizeDataset(test_manifest, transform=eval_tf)

    print(f"Train samples: {len(train_ds)}, Val samples: {len(val_ds)}, Test samples: {len(test_ds)}")

    train_loader = DataLoader(train_ds, batch_size=8, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=8, shuffle=False)
    test_loader = DataLoader(test_ds, batch_size=8, shuffle=False)

    device = torch.device("cpu")
    model = build_model(num_classes=len(CLASSES)).to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-3, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=12)

    best_val_acc = 0.0
    best_state_dict = None
    epochs = 12

    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        correct, total = 0, 0
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

        scheduler.step()
        train_acc = correct / total if total > 0 else 0
        train_loss = running_loss / total if total > 0 else 0

        # Validation
        model.eval()
        val_correct, val_total = 0, 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                _, preds = torch.max(outputs, 1)
                val_correct += (preds == labels).sum().item()
                val_total += labels.size(0)

        val_acc = val_correct / val_total if val_total > 0 else 0
        print(f"Epoch {epoch:02d}/{epochs:02d} | Train Loss: {train_loss:.4f} | Train Acc: {train_acc*100:.1f}% | Val Acc: {val_acc*100:.1f}%")

        if val_acc >= best_val_acc or best_state_dict is None:
            best_val_acc = val_acc
            best_state_dict = {k: v.cpu().clone() for k, v in model.state_dict().items()}

    # Load best weights
    model.load_state_dict(best_state_dict)

    # Held-out Test Evaluation
    print("\n--------------------------------------------------")
    print("Evaluating Best Model on Held-out Test Split...")
    print("--------------------------------------------------")
    model.eval()

    all_preds = []
    all_labels = []
    all_probs = []
    latencies_ms = []

    with torch.no_grad():
        for images, labels in test_loader:
            for i in range(images.size(0)):
                single_img = images[i:i+1].to(device)
                t0 = time.perf_counter()
                out = model(single_img)
                t1 = time.perf_counter()
                latencies_ms.append((t1 - t0) * 1000.0)

                probs = torch.softmax(out, dim=1).squeeze(0).numpy()
                pred = int(np.argmax(probs))
                all_preds.append(pred)
                all_labels.append(labels[i].item())
                all_probs.append(probs)

    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)

    test_accuracy = float(np.mean(all_preds == all_labels))
    macro_f1 = float(f1_score(all_labels, all_preds, average="macro", zero_division=0))
    precisions = precision_score(all_labels, all_preds, average=None, zero_division=0)
    recalls = recall_score(all_labels, all_preds, average=None, zero_division=0)
    cm = confusion_matrix(all_labels, all_preds, labels=list(range(len(CLASSES)))).tolist()

    avg_latency = float(np.mean(latencies_ms))
    p95_latency = float(np.percentile(latencies_ms, 95))

    # Save model artifact
    models_dir = Path("models")
    models_dir.mkdir(parents=True, exist_ok=True)
    model_path = models_dir / "maize_mobilenetv2.pth"
    torch.save(model.state_dict(), model_path)
    file_size_mb = float(os.path.getsize(model_path) / (1024 * 1024))

    per_class_metrics = {}
    for i, c in enumerate(CLASSES):
        per_class_metrics[c] = {
            "precision": round(float(precisions[i]), 4),
            "recall": round(float(recalls[i]), 4),
            "f1": round(float(f1_score(all_labels == i, all_preds == i, zero_division=0)), 4),
            "support": int(np.sum(all_labels == i))
        }

    evaluation_report = {
        "model_name": "AgriRhythm Maize Health Classifier (MobileNetV2)",
        "architecture": "mobilenet_v2",
        "crop": "maize",
        "classes": CLASSES,
        "class_mapping": CLASS_TO_IDX,
        "parameters_count": sum(p.numel() for p in model.parameters()),
        "artifact_path": str(model_path),
        "artifact_size_mb": round(file_size_mb, 2),
        "device_tested": "CPU (Apple Silicon M-series)",
        "held_out_test_metrics": {
            "total_test_samples": len(all_labels),
            "accuracy": round(test_accuracy, 4),
            "macro_f1": round(macro_f1, 4),
            "per_class": per_class_metrics,
            "confusion_matrix": cm,
            "confusion_matrix_labels": CLASSES
        },
        "latency_benchmark_ms": {
            "mean_latency_ms": round(avg_latency, 2),
            "p95_latency_ms": round(p95_latency, 2),
            "batch_size": 1
        },
        "abstention_policy": {
            "min_confidence_threshold": 0.65,
            "description": "If maximum softmax probability < 0.65 or entropy indicates ambiguity, prediction abstains to 'uncertain'."
        },
        "limitations": [
            "Trained on PlantVillage controlled-background leaf imagery.",
            "Field performance under complex background soil/canopy clutter or shadows requires human verification.",
            "Does not replace a physical agronomy extension inspection or laboratory culture."
        ]
    }

    report_path = models_dir / "model_evaluation_report.json"
    with open(report_path, "w") as f:
        json.dump(evaluation_report, f, indent=2)

    # Save Registry
    registry = {
        "version": "1.0.0",
        "crops": {
            "maize": {
                "status": "supported",
                "model_available": True,
                "model_path": str(model_path),
                "architecture": "mobilenet_v2",
                "classes": CLASSES,
                "accuracy": round(test_accuracy, 4),
                "macro_f1": round(macro_f1, 4),
                "latency_ms": round(avg_latency, 1),
                "size_mb": round(file_size_mb, 1)
            },
            "banana": {
                "status": "limited_demo",
                "model_available": False,
                "note": "Banana (Sigatoka / Cordana) is supported in labeled demo workflow pending validated field dataset."
            },
            "cotton": {
                "status": "extension_ready",
                "model_available": False,
                "note": "Architecture extension-ready. Not certified for diagnosis."
            }
        }
    }
    with open(models_dir / "model_registry.json", "w") as f:
        json.dump(registry, f, indent=2)

    print("\n==================================================")
    print("Model Training & Evaluation Complete!")
    print(f"Saved weights: {model_path} ({file_size_mb:.2f} MB)")
    print(f"Held-out Test Accuracy: {test_accuracy * 100:.2f}% | Macro F1: {macro_f1:.4f}")
    print(f"Average CPU Latency: {avg_latency:.2f} ms")
    print(f"Saved report to: {report_path}")
    print("==================================================")

if __name__ == "__main__":
    train_and_evaluate()
