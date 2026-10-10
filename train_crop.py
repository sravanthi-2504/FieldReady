"""
Train a leaf-disease classifier for ONE crop (banana or maize) so it works on real field photos.

Why your current models fail on field photos: they were trained on clean lab images (PlantVillage-style)
or tiny grey thumbnails. This script fixes the usual causes:
  * strong field-style augmentation (light, blur, grey, occlusion, crops) so the model stops
    relying on a plain background
  * class-balanced sampling so rare classes are not ignored
  * a SEPARATE field test folder (--test-dir) with a confusion matrix, because a random
    split of lab images always looks great and tells you nothing about field photos
  * temperature scaling, so "97% confident" means roughly 97% of the time (the model
    currently says 100% when it is wrong)

DATA (one folder per class; mix lab AND field photos in train, keep field photos for test):
    data/banana/train/{healthy,black_sigatoka,cordana,pestalotiopsis}/*.jpg
    data/maize/train/{healthy,common_rust,gray_leaf_spot,blight}/*.jpg
    data/banana/field_test/<same class folders>/*.jpg      <- photos NOT used in training
Folder names must match the class names the backend uses.

RUN
    python train_crop.py --crop banana --data data/banana/train --test-dir data/banana/field_test --out ../models
    python train_crop.py --crop maize  --data data/maize/train  --test-dir data/maize/field_test  --out ../models

OUTPUT   <crop>_mobilenetv2.pth   (state_dict, same architecture the backend already loads)
         <crop>_meta.json         {"classes": [...], "temperature": T, ...}
BACKEND  load meta.json; use classes in that order; probs = softmax(logits / temperature).
"""
import argparse
import json
import os
from collections import Counter

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, Subset, WeightedRandomSampler
from torchvision import datasets, models, transforms

MEAN, STD = [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]


def build_transforms():
    train_tf = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.35, 1.0), ratio=(0.7, 1.4)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(30),
        transforms.ColorJitter(brightness=0.45, contrast=0.4, saturation=0.4, hue=0.05),
        transforms.RandomGrayscale(p=0.05),
        transforms.RandomApply([transforms.GaussianBlur(5, sigma=(0.1, 2.0))], p=0.3),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
        transforms.RandomErasing(p=0.25, scale=(0.02, 0.15)),
    ])
    eval_tf = transforms.Compose([
        transforms.Resize(256), transforms.CenterCrop(224),
        transforms.ToTensor(), transforms.Normalize(MEAN, STD),
    ])
    return train_tf, eval_tf


def stratified_split(targets, val_frac=0.2, seed=42):
    g = torch.Generator().manual_seed(seed)
    tr, va = [], []
    for c in sorted(set(targets)):
        idx = [i for i, t in enumerate(targets) if t == c]
        perm = torch.randperm(len(idx), generator=g).tolist()
        n_val = max(1, int(len(idx) * val_frac)) if len(idx) > 1 else 0
        va += [idx[i] for i in perm[:n_val]]
        tr += [idx[i] for i in perm[n_val:]]
    return tr, va


@torch.no_grad()
def collect(model, loader, device):
    model.eval()
    logits, ys = [], []
    for x, y in loader:
        logits.append(model(x.to(device)).cpu())
        ys.append(y)
    return torch.cat(logits), torch.cat(ys)


def fit_temperature(logits, ys):
    """Single scalar T minimising NLL on held-out data."""
    log_t = torch.zeros(1, requires_grad=True)
    opt = torch.optim.LBFGS([log_t], lr=0.1, max_iter=100)

    def closure():
        opt.zero_grad()
        loss = F.cross_entropy(logits / log_t.exp(), ys)
        loss.backward()
        return loss

    opt.step(closure)
    return float(log_t.exp().clamp(0.5, 10.0))


def report(name, logits, ys, classes, T=1.0, paths=None):
    probs = F.softmax(logits / T, dim=1)
    pred = probs.argmax(1)
    n = len(classes)
    cm = torch.zeros(n, n, dtype=torch.long)
    for t, p in zip(ys, pred):
        cm[t, p] += 1
    acc = float((pred == ys).float().mean())
    print(f"\n=== {name}: accuracy {acc:.3f} on {len(ys)} images ===")
    w = max(len(c) for c in classes) + 2
    print(" " * w + "".join(f"{c[:10]:>12}" for c in classes) + "   (rows = truth, columns = predicted)")
    for i, c in enumerate(classes):
        print(f"{c:<{w}}" + "".join(f"{int(cm[i, j]):>12}" for j in range(n)))
    if paths is not None:
        wrong = [(paths[i], classes[int(ys[i])], classes[int(pred[i])], float(probs[i].max()))
                 for i in range(len(ys)) if pred[i] != ys[i]]
        for p, t, pr, conf in wrong[:25]:
            print(f"  WRONG {os.path.basename(p)}: truth={t} predicted={pr} ({conf:.0%})")
    return acc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--crop", required=True, choices=["banana", "maize"])
    ap.add_argument("--data", required=True)
    ap.add_argument("--test-dir", default=None, help="field photos NOT used for training")
    ap.add_argument("--out", default="../models")
    ap.add_argument("--epochs", type=int, default=20)
    ap.add_argument("--batch", type=int, default=32)
    ap.add_argument("--lr", type=float, default=3e-4)
    ap.add_argument("--no-pretrained", action="store_true", help="skip ImageNet weights (smoke tests only)")
    ap.add_argument("--workers", type=int, default=2)
    args = ap.parse_args()

    device = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")
    train_tf, eval_tf = build_transforms()

    full_train = datasets.ImageFolder(args.data, transform=train_tf)
    full_eval = datasets.ImageFolder(args.data, transform=eval_tf)
    classes = full_train.classes
    n = len(classes)
    print("classes:", classes)
    print("images per class:", {classes[k]: v for k, v in sorted(Counter(full_train.targets).items())})

    tr_idx, va_idx = stratified_split(full_train.targets)
    train_ds, val_ds = Subset(full_train, tr_idx), Subset(full_eval, va_idx)
    counts = Counter(full_train.targets[i] for i in tr_idx)
    weights = [1.0 / counts[full_train.targets[i]] for i in tr_idx]
    sampler = WeightedRandomSampler(weights, num_samples=len(tr_idx), replacement=True)
    train_loader = DataLoader(train_ds, batch_size=args.batch, sampler=sampler, num_workers=args.workers)
    val_loader = DataLoader(val_ds, batch_size=args.batch, num_workers=args.workers)

    wts = None if args.no_pretrained else models.MobileNet_V2_Weights.IMAGENET1K_V1
    model = models.mobilenet_v2(weights=wts)
    model.classifier[1] = nn.Linear(model.last_channel, n)
    model.to(device)

    loss_fn = nn.CrossEntropyLoss(label_smoothing=0.05)
    os.makedirs(args.out, exist_ok=True)
    ckpt = os.path.join(args.out, f"{args.crop}_mobilenetv2.pth")
    best = -1.0

    for phase, lr, epochs in (("head", args.lr * 3, 3), ("finetune", args.lr, args.epochs)):
        for p in model.features.parameters():
            p.requires_grad = phase == "finetune"
        opt = torch.optim.AdamW([p for p in model.parameters() if p.requires_grad], lr=lr, weight_decay=1e-4)
        sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=max(1, epochs))
        for ep in range(epochs):
            model.train()
            for x, y in train_loader:
                x, y = x.to(device), y.to(device)
                opt.zero_grad()
                loss_fn(model(x), y).backward()
                opt.step()
            sched.step()
            lg, ys = collect(model, val_loader, device)
            acc = float((lg.argmax(1) == ys).float().mean()) if len(ys) else 0.0
            print(f"[{phase}] epoch {ep + 1}/{epochs}  val_acc={acc:.3f}")
            if phase == "finetune" and acc >= best:
                best = acc
                torch.save(model.state_dict(), ckpt)

    # reload best, calibrate on validation, then judge on the field test set
    model.load_state_dict(torch.load(ckpt, map_location=device))
    lg, ys = collect(model, val_loader, device)
    T = fit_temperature(lg, ys) if len(ys) else 1.0
    print(f"\nfitted temperature T = {T:.2f}  (backend: softmax(logits / T))")
    report("validation (same source as training: optimistic)", lg, ys, classes, T)

    if args.test_dir:
        test_ds = datasets.ImageFolder(args.test_dir, transform=eval_tf)
        if test_ds.classes != classes:
            print("WARNING: test folders differ from training classes:", test_ds.classes)
        tl, ty = collect(model, DataLoader(test_ds, batch_size=args.batch, num_workers=args.workers), device)
        paths = [p for p, _ in test_ds.samples]
        report("FIELD TEST (the number that matters)", tl, ty, test_ds.classes, T, paths)
    else:
        print("\nNo --test-dir given: you have NOT measured field accuracy yet.")

    with open(os.path.join(args.out, f"{args.crop}_meta.json"), "w") as f:
        json.dump({"crop": args.crop, "classes": classes, "temperature": T, "input_size": 224,
                   "mean": MEAN, "std": STD, "arch": "mobilenet_v2"}, f, indent=2)
    print(f"\nSaved {ckpt} and {args.crop}_meta.json")


if __name__ == "__main__":
    main()
