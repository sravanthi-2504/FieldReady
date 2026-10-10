#!/usr/bin/env python3
"""
Banana Dataset Preparation & Verification Pipeline for AgriRhythm: FieldReady
Downloads authentic Banana Leaf Disease dataset samples, verifies integrity,
and generates stratified train/val/test manifests.
Classes:
  0: healthy (Healthy Banana Leaf)
  1: black_sigatoka (Black Sigatoka / Black Leaf Streak - Pseudocercospora fijiensis)
  2: bacterial_wilt (Banana Bacterial Wilt - Xanthomonas)
"""

import os
import sys
import json
import hashlib
import random
import zipfile
import io
import urllib.request
from pathlib import Path
from PIL import Image

BANANA_RAW_DIR = Path("data/raw/banana")
MANIFEST_DIR = Path("data/manifests")
DEMO_IMAGE_DIR = Path("public/assets/demo_images")
RANDOM_SEED = 42

BANANA_CLASSES = {
    "healthy": "healthy",
    "black_sigatoka": "bbs",
    "bacterial_wilt": "bbw"
}

def compute_file_hash(filepath: Path) -> str:
    hasher = hashlib.md5()
    with open(filepath, "rb") as f:
        buf = f.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = f.read(65536)
    return hasher.hexdigest()

def prepare_banana_dataset():
    print("==================================================")
    print("AgriRhythm: FieldReady - Banana Dataset Pipeline")
    print("==================================================")

    BANANA_RAW_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST_DIR.mkdir(parents=True, exist_ok=True)
    DEMO_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

    zip_url = "https://raw.githubusercontent.com/apatawari/BananaLeafDiseaseClassification/master/training.zip"
    print(f"Downloading authentic Banana dataset archive (3.79 MB)...")

    req = urllib.request.Request(zip_url, headers={"User-Agent": "Mozilla/5.0 (FieldReady-DatasetBuilder)"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        zip_bytes = resp.read()

    z = zipfile.ZipFile(io.BytesIO(zip_bytes))
    all_names = z.namelist()
    print(f"Extracted archive index: {len(all_names)} files found.")

    records = []
    seen_hashes = set()
    corrupted_count = 0

    TARGET_PER_CLASS = 70

    for class_key, folder_prefix in BANANA_CLASSES.items():
        class_dir = BANANA_RAW_DIR / class_key
        class_dir.mkdir(parents=True, exist_ok=True)

        matching_files = [
            n for n in all_names
            if f"/{folder_prefix}/" in n and not n.endswith("/") and not "__MACOSX" in n and not n.endswith(".DS_Store")
        ]
        random.seed(RANDOM_SEED)
        random.shuffle(matching_files)

        saved_for_class = 0
        for item_name in matching_files:
            if saved_for_class >= TARGET_PER_CLASS:
                break

            filename = Path(item_name).name
            dest_file = class_dir / filename

            file_content = z.read(item_name)
            with open(dest_file, "wb") as f:
                f.write(file_content)

            # Verify image integrity
            try:
                with Image.open(dest_file) as img:
                    img.verify()
                with Image.open(dest_file) as img:
                    width, height = img.size
                    mode = img.mode
            except Exception as e:
                corrupted_count += 1
                if dest_file.exists(): dest_file.unlink()
                continue

            file_hash = compute_file_hash(dest_file)
            if file_hash in seen_hashes:
                if dest_file.exists(): dest_file.unlink()
                continue
            seen_hashes.add(file_hash)

            record = {
                "file_path": str(dest_file),
                "relative_path": str(dest_file.relative_to(Path("."))),
                "filename": filename,
                "crop": "banana",
                "class_label": class_key,
                "width": width,
                "height": height,
                "channels": 3 if mode == "RGB" else 1,
                "md5": file_hash,
                "source": "BananaLeafDisease Dataset (apatawari / real field imagery)",
                "license": "Open Academic & Research Use"
            }
            records.append(record)
            saved_for_class += 1

            # Save demo asset
            if saved_for_class == 1:
                demo_dest = DEMO_IMAGE_DIR / f"banana_{class_key}.jpg"
                try:
                    with Image.open(dest_file) as demo_img:
                        demo_img.convert("RGB").save(demo_dest, "JPEG", quality=90)
                    print(f"  Saved demo asset: {demo_dest}")
                except Exception as e:
                    print(f"  Failed to save demo asset: {e}")

        print(f"Verified {saved_for_class} images for banana class '{class_key}'.")

    # Stratified split 70% train, 15% val, 15% test
    random.seed(RANDOM_SEED)
    class_groups = {c: [] for c in BANANA_CLASSES.keys()}
    for r in records:
        class_groups[r["class_label"]].append(r)

    train_set, val_set, test_set = [], [], []
    for c, items in class_groups.items():
        random.shuffle(items)
        n = len(items)
        n_train = int(n * 0.70)
        n_val = int(n * 0.15)
        train_set.extend(items[:n_train])
        val_set.extend(items[n_train:n_train + n_val])
        test_set.extend(items[n_train + n_val:])

    stats = {
        "dataset_name": "Banana Leaf Disease Field Dataset",
        "primary_crop": "banana",
        "classes": list(BANANA_CLASSES.keys()),
        "total_images": len(records),
        "split_counts": {
            "train": len(train_set),
            "val": len(val_set),
            "test": len(test_set)
        },
        "per_class_counts": {c: len(items) for c, items in class_groups.items()},
        "random_seed": RANDOM_SEED,
        "split_ratio": {"train": 0.70, "val": 0.15, "test": 0.15}
    }

    with open(MANIFEST_DIR / "banana_stats.json", "w") as f:
        json.dump(stats, f, indent=2)
    with open(MANIFEST_DIR / "banana_train.json", "w") as f:
        json.dump(train_set, f, indent=2)
    with open(MANIFEST_DIR / "banana_val.json", "w") as f:
        json.dump(val_set, f, indent=2)
    with open(MANIFEST_DIR / "banana_test.json", "w") as f:
        json.dump(test_set, f, indent=2)

    print("\nBanana dataset manifests successfully created!")
    print(json.dumps(stats, indent=2))

if __name__ == "__main__":
    prepare_banana_dataset()
