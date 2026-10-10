"""
Retrain the banana leaf classifier on real field photos, 4 classes:
healthy, black_sigatoka, cordana, pestalotiopsis.

Why: the current model has 3 classes (healthy, black_sigatoka, bacterial_wilt) trained on
70x70 grayscale thumbnails, so Cordana and Pestalotiopsis can never be predicted.

Folder layout (put your Kaggle images here, one folder per class):
    data/banana/healthy/*.jpg
    data/banana/black_sigatoka/*.jpg
    data/banana/cordana/*.jpg
    data/banana/pestalotiopsis/*.jpg

Run:
    python train_banana.py --data data/banana --out ../models --epochs 15

Outputs: banana_mobilenetv2.pth (state_dict) and banana_classes.json (class order).
After training, set BANANA_CLASSES in the backend to the order inside banana_classes.json.
Check the printed per-class accuracy: if one class is low, add more photos of it.
"""
import argparse
import json
import os
from collections import Counter

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Subset, WeightedRandomSampler
from torchvision import datasets, models, transforms

MEAN, STD = [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]


def build_transforms():
    train_tf = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.5, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(25),
        # field photos vary a lot in light, so simulate it
        transforms.ColorJitter(brightness=0.35, contrast=0.3, saturation=0.3, hue=0.04),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ])
    val_tf = transforms.Compose([
        transforms.Resize(256), transforms.CenterCrop(224),
        transforms.ToTensor(), transforms.Normalize(MEAN, STD),
    ])
    return train_tf, val_tf


def split_indices(targets, val_frac=0.2, seed=42):
    """Stratified split so every class appears in validation."""
    g = torch.Generator().manual_seed(seed)
    train_idx, val_idx = [], []
    for c in sorted(set(targets)):
        idx = [i for i, t in enumerate(targets) if t == c]
        perm = torch.randperm(len(idx), generator=g).tolist()
        n_val = max(1, int(len(idx) * val_frac))
        val_idx += [idx[i] for i in perm[:n_val]]
        train_idx += [idx[i] for i in perm[n_val:]]
    return train_idx, val_idx


def evaluate(model, loader, device, n_classes):
    model.eval()
    correct = [0] * n_classes
    total = [0] * n_classes
    with torch.no_grad():
        for x, y in loader:
            pred = model(x.to(device)).argmax(1).cpu()
            for t, p in zip(y, pred):
                total[t] += 1
                correct[t] += int(t == p)
    return correct, total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", default="../models")
    ap.add_argument("--epochs", type=int, default=15)
    ap.add_argument("--batch", type=int, default=32)
    ap.add_argument("--lr", type=float, default=3e-4)
    args = ap.parse_args()

    device = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")
    train_tf, val_tf = build_transforms()

    # two views of the same folder: one with augmentation, one without
    full_train = datasets.ImageFolder(args.data, transform=train_tf)
    full_val = datasets.ImageFolder(args.data, transform=val_tf)
    classes = full_train.classes
    n = len(classes)
    print("classes:", classes)
    print("images per class:", dict(Counter(full_train.targets)))

    tr_idx, va_idx = split_indices(full_train.targets)
    train_ds, val_ds = Subset(full_train, tr_idx), Subset(full_val, va_idx)

    # balance classes so small ones (e.g. pestalotiopsis) are not ignored
    counts = Counter(full_train.targets[i] for i in tr_idx)
    weights = [1.0 / counts[full_train.targets[i]] for i in tr_idx]
    sampler = WeightedRandomSampler(weights, num_samples=len(tr_idx), replacement=True)

    train_loader = DataLoader(train_ds, batch_size=args.batch, sampler=sampler, num_workers=2)
    val_loader = DataLoader(val_ds, batch_size=args.batch, num_workers=2)

    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
    model.classifier[1] = nn.Linear(model.last_channel, n)
    model.to(device)

    loss_fn = nn.CrossEntropyLoss(label_smoothing=0.05)
    best = 0.0
    os.makedirs(args.out, exist_ok=True)

    for phase, lr, epochs in (("head", args.lr * 3, 3), ("finetune", args.lr, args.epochs)):
        for p in model.features.parameters():
            p.requires_grad = phase == "finetune"
        opt = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=lr, weight_decay=1e-4)
        for ep in range(epochs):
            model.train()
            for x, y in train_loader:
                x, y = x.to(device), y.to(device)
                opt.zero_grad()
                loss = loss_fn(model(x), y)
                loss.backward()
                opt.step()
            correct, total = evaluate(model, val_loader, device, n)
            acc = sum(correct) / max(1, sum(total))
            per = {classes[i]: round(correct[i] / max(1, total[i]), 2) for i in range(n)}
            print(f"[{phase}] epoch {ep + 1}/{epochs}  val_acc={acc:.3f}  per_class={per}")
            if phase == "finetune" and acc > best:
                best = acc
                torch.save(model.state_dict(), os.path.join(args.out, "banana_mobilenetv2.pth"))
                with open(os.path.join(args.out, "banana_classes.json"), "w") as f:
                    json.dump(classes, f)
    print(f"best val_acc={best:.3f}. Saved to {args.out}")
    print("Note: if photos of one leaf/plant appear in both train and val, accuracy is optimistic.")


if __name__ == "__main__":
    main()
