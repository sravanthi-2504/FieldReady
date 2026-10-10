#!/usr/bin/env python3
"""
Lightweight Botanical Crop Species Classifier (Maize vs Banana)
Trained on held-out manifests of Maize and Banana leaves.
Produces models/crop_verifier_mobilenetv2.pth and models/crop_verifier_report.json.
"""

import json
import time
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image

SPECIES_CLASSES = ["maize", "banana"]
CLASS_TO_IDX = {"maize": 0, "banana": 1}

class SpeciesDataset(Dataset):
    def __init__(self, records, transform=None):
        self.records = records
        self.transform = transform

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx):
        item = self.records[idx]
        img = Image.open(item["file_path"]).convert("RGB")
        label = item["species_idx"]
        if self.transform:
            img = self.transform(img)
        return img, label

def load_species_records():
    # Load maize records
    with open("data/manifests/train.json") as f:
        m_train = json.load(f)
    with open("data/manifests/val.json") as f:
        m_val = json.load(f)
    with open("data/manifests/test.json") as f:
        m_test = json.load(f)

    # Load banana records
    with open("data/manifests/banana_train.json") as f:
        b_train = json.load(f)
    with open("data/manifests/banana_val.json") as f:
        b_val = json.load(f)
    with open("data/manifests/banana_test.json") as f:
        b_test = json.load(f)

    train_recs = [
        {"file_path": r["file_path"], "species_idx": 0} for r in m_train
    ] + [
        {"file_path": r["file_path"], "species_idx": 1} for r in b_train
    ]

    val_recs = [
        {"file_path": r["file_path"], "species_idx": 0} for r in m_val
    ] + [
        {"file_path": r["file_path"], "species_idx": 1} for r in b_val
    ]

    test_recs = [
        {"file_path": r["file_path"], "species_idx": 0} for r in m_test
    ] + [
        {"file_path": r["file_path"], "species_idx": 1} for r in b_test
    ]

    return train_recs, val_recs, test_recs

def train_verifier():
    print("Training Botanical Crop Species Classifier...")
    train_recs, val_recs, test_recs = load_species_records()
    print(f"Train samples: {len(train_recs)}, Val: {len(val_recs)}, Test: {len(test_recs)}")

    train_tf = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    eval_tf = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_loader = DataLoader(SpeciesDataset(train_recs, train_tf), batch_size=16, shuffle=True)
    val_loader = DataLoader(SpeciesDataset(val_recs, eval_tf), batch_size=16, shuffle=False)
    test_loader = DataLoader(SpeciesDataset(test_recs, eval_tf), batch_size=16, shuffle=False)

    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    # Freeze lower layers
    for param in model.features[:12].parameters():
        param.requires_grad = False
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.2),
        nn.Linear(in_features, 2)
    )

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-3)

    for epoch in range(1, 6):
        model.train()
        for imgs, lbls in train_loader:
            optimizer.zero_grad()
            out = model(imgs)
            loss = criterion(out, lbls)
            loss.backward()
            optimizer.step()

        model.eval()
        correct, total = 0, 0
        with torch.no_grad():
            for imgs, lbls in val_loader:
                out = model(imgs)
                preds = torch.argmax(out, dim=1)
                correct += (preds == lbls).sum().item()
                total += lbls.size(0)
        print(f"Epoch {epoch}/5 | Val Accuracy: {correct/total*100:.1f}%")

    # Evaluate on held-out test split
    model.eval()
    all_preds, all_lbls = [], []
    with torch.no_grad():
        for imgs, lbls in test_loader:
            out = model(imgs)
            preds = torch.argmax(out, dim=1)
            all_preds.extend(preds.cpu().numpy().tolist())
            all_lbls.extend(lbls.cpu().numpy().tolist())

    acc = float(np.mean(np.array(all_preds) == np.array(all_lbls)))
    print(f"Species Classifier Held-out Test Accuracy: {acc*100:.2f}%")

    out_path = Path("models/crop_verifier_mobilenetv2.pth")
    torch.save(model.state_dict(), out_path)
    print(f"Saved species verifier weights to {out_path}")

if __name__ == "__main__":
    train_verifier()
