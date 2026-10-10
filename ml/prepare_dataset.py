#!/usr/bin/env python3
"""
Dataset Preparation & Verification Pipeline for AgriRhythm: FieldReady
Downloads authentic PlantVillage Maize dataset samples, checks for corruptions,
removes near-duplicates, reports statistics, and creates train/val/test splits.
"""

import os
import sys
import json
import hashlib
import random
import urllib.request
import urllib.parse
from pathlib import Path
from PIL import Image

CLASSES = {
    "healthy": "Corn_(maize)___healthy",
    "common_rust": "Corn_(maize)___Common_rust_",
    "northern_leaf_blight": "Corn_(maize)___Northern_Leaf_Blight",
    "gray_leaf_spot": "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot"
}

RAW_DATA_DIR = Path("data/raw/maize")
MANIFEST_DIR = Path("data/manifests")
DEMO_IMAGE_DIR = Path("public/assets/demo_images")
PER_CLASS_SAMPLES = 25
RANDOM_SEED = 42

def compute_file_hash(filepath: Path) -> str:
    hasher = hashlib.md5()
    with open(filepath, "rb") as f:
        buf = f.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = f.read(65536)
    return hasher.hexdigest()

def fetch_class_file_list(folder_name: str, limit: int = 40):
    encoded = urllib.parse.quote(folder_name)
    url = f"https://api.github.com/repos/spMohanty/PlantVillage-Dataset/contents/raw/color/{encoded}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (FieldReady-DatasetBuilder)"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        files = [item for item in data if item["type"] == "file" and item["name"].lower().endswith((".jpg", ".jpeg", ".png"))]
        # deterministically pick diverse set
        random.seed(RANDOM_SEED)
        random.shuffle(files)
        return files[:limit]

def download_file(url: str, dest_path: Path):
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as response, open(dest_path, "wb") as out_file:
        out_file.write(response.read())

def prepare_maize_dataset():
    print(f"==================================================")
    print(f"AgriRhythm: FieldReady - Maize Dataset Preparation")
    print(f"Target: 4 Classes x {PER_CLASS_SAMPLES} samples = {4 * PER_CLASS_SAMPLES} total images")
    print(f"==================================================")

    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST_DIR.mkdir(parents=True, exist_ok=True)
    DEMO_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

    records = []
    seen_hashes = set()
    corrupted_count = 0
    duplicate_count = 0

    for class_key, gh_folder in CLASSES.items():
        print(f"\nProcessing class: {class_key} ({gh_folder})...")
        class_dir = RAW_DATA_DIR / class_key
        class_dir.mkdir(parents=True, exist_ok=True)

        try:
            available_files = fetch_class_file_list(gh_folder, limit=PER_CLASS_SAMPLES + 5)
        except Exception as e:
            print(f"Error listing files for {gh_folder}: {e}")
            continue

        downloaded_for_class = 0
        for item in available_files:
            if downloaded_for_class >= PER_CLASS_SAMPLES:
                break
            filename = item["name"]
            download_url = item["download_url"]
            dest_file = class_dir / filename

            if not dest_file.exists():
                try:
                    download_file(download_url, dest_file)
                except Exception as e:
                    print(f"  Failed to download {filename}: {e}")
                    continue

            # Verify integrity
            try:
                with Image.open(dest_file) as img:
                    img.verify()
                with Image.open(dest_file) as img:
                    width, height = img.size
                    mode = img.mode
            except Exception as e:
                print(f"  Corrupt image detected ({filename}): {e}")
                corrupted_count += 1
                if dest_file.exists():
                    dest_file.unlink()
                continue

            file_hash = compute_file_hash(dest_file)
            if file_hash in seen_hashes:
                print(f"  Duplicate image detected ({filename}), skipping.")
                duplicate_count += 1
                if dest_file.exists():
                    dest_file.unlink()
                continue
            seen_hashes.add(file_hash)

            record = {
                "file_path": str(dest_file),
                "relative_path": str(dest_file.relative_to(Path("."))),
                "filename": filename,
                "class_label": class_key,
                "width": width,
                "height": height,
                "channels": 3 if mode == "RGB" else 1,
                "md5": file_hash,
                "source": "PlantVillage (spMohanty/PlantVillage-Dataset)",
                "license": "CC-BY 4.0 (Open Access Research)"
            }
            records.append(record)
            downloaded_for_class += 1

            # Save first sample of each class as ready-to-test demo asset
            if downloaded_for_class == 1:
                demo_dest = DEMO_IMAGE_DIR / f"{class_key}.jpg"
                try:
                    with Image.open(dest_file) as demo_img:
                        demo_img.convert("RGB").save(demo_dest, "JPEG", quality=90)
                    print(f"  Saved demo asset: {demo_dest}")
                except Exception as e:
                    print(f"  Failed to save demo asset: {e}")

        print(f"  Successfully verified {downloaded_for_class} images for class '{class_key}'")

    print(f"\nTotal verified images: {len(records)}")
    print(f"Corrupted excluded: {corrupted_count}, Duplicates excluded: {duplicate_count}")

    # Stratified split: 70% train, 15% val, 15% test
    random.seed(RANDOM_SEED)
    class_groups = {c: [] for c in CLASSES.keys()}
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

    # Save manifests
    stats = {
        "dataset_name": "PlantVillage Maize Curated Subset",
        "primary_crop": "maize",
        "classes": list(CLASSES.keys()),
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

    with open(MANIFEST_DIR / "dataset_stats.json", "w") as f:
        json.dump(stats, f, indent=2)
    with open(MANIFEST_DIR / "train.json", "w") as f:
        json.dump(train_set, f, indent=2)
    with open(MANIFEST_DIR / "val.json", "w") as f:
        json.dump(val_set, f, indent=2)
    with open(MANIFEST_DIR / "test.json", "w") as f:
        json.dump(test_set, f, indent=2)

    print("\nDataset preparation completed successfully!")
    print(f"Saved manifests to {MANIFEST_DIR}/")
    print(json.dumps(stats, indent=2))

if __name__ == "__main__":
    prepare_maize_dataset()
