# AgriRhythm: FieldReady — Model and Dataset Audit

**Audit Date:** 2026-10-10  
**Project:** AgriRhythm — FieldReady (Voice-Guided, Offline-First Crop Health Intelligence)  
**Auditor:** Full-Stack & ML Engineering Team  

---

## Executive Summary

This document provides a factual, evidence-based audit of all machine learning models, datasets, data pipelines, class mappings, inference routes, verification gates, and field management components in the AgriRhythm — FieldReady repository before making targeted modifications.

---

## 1. Audit Questions & Verified Findings

### Q1: Which exact dataset was used to train the current maize model?
- **Finding:** The model was trained on a curated subset of the **PlantVillage Maize Dataset** sourced from the public repository `spMohanty/PlantVillage-Dataset` (color image folder: `raw/color/Corn_(maize)___*`).
- **Classes included:**
  1. `Corn_(maize)___healthy`
  2. `Corn_(maize)___Common_rust_`
  3. `Corn_(maize)___Northern_Leaf_Blight`
  4. `Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot`

### Q2: Where is the original dataset or its manifest?
- **Finding:**
  - Raw image files are stored in `data/raw/maize/{healthy, common_rust, northern_leaf_blight, gray_leaf_spot}/`.
  - Manifest files are located in `data/manifests/`:
    - `dataset_stats.json`: Records metadata, total counts (100 images = 25 per class), and split ratios.
    - `train.json`: 70 training records (17-18 per class).
    - `val.json`: 12 validation records (3 per class).
    - `test.json`: 20 held-out test records (5 per class).
  - Each manifest record contains: `file_path`, `relative_path`, `filename`, `class_label`, `width`, `height`, `channels`, `md5` hash, `source`, and `license` (`CC-BY 4.0`).

### Q3: Are the images real training examples, downloaded demonstration images, or sample assets?
- **Finding:**
  - The 100 images in `data/raw/maize/` are authentic PlantVillage photographs taken against controlled backgrounds.
  - The 4 sample images in `public/assets/demo_images/` (`healthy.jpg`, `common_rust.jpg`, `northern_leaf_blight.jpg`, `gray_leaf_spot.jpg`) were copied directly from the first downloaded sample of each class in `data/raw/maize/` during `ml/prepare_dataset.py`. They are authentic PlantVillage leaf photos, not mock drawings.

### Q4: Which training script produced the current weights?
- **Finding:** `ml/train_and_evaluate.py`.
  - It defines a PyTorch pipeline using `torchvision.models.mobilenet_v2` with `MobileNet_V2_Weights.DEFAULT`.
  - The classifier head is replaced with `nn.Sequential(nn.Dropout(p=0.2), nn.Linear(1280, 4))`.
  - Feature layers 0–9 are frozen; remaining layers are trained with `AdamW(lr=1e-3, weight_decay=1e-4)` and `CosineAnnealingLR` for 12 epochs on CPU.

### Q5: Is the saved model reproducibly connected to that training script and class mapping?
- **Finding:** Yes. The script saves the best checkpoint to `models/maize_mobilenetv2.pth` (8.74 MB) and generates `models/model_evaluation_report.json` and `models/model_registry.json`.
- The exact state dict matches the MobileNetV2 architecture with classifier head out_features=4.

### Q6: What are the exact four model output classes and their order?
- **Finding:** The exact index-to-class mapping is:
  - **Index 0:** `healthy`
  - **Index 1:** `common_rust`
  - **Index 2:** `northern_leaf_blight`
  - **Index 3:** `gray_leaf_spot`
- This mapping is identical in `ml/train_and_evaluate.py`, `backend/app/vision/predictor.py`, and `models/model_evaluation_report.json`.

### Q7: Was the dataset split by original image or source/plant where possible before augmentation?
- **Finding:** Yes. In `ml/prepare_dataset.py`, image hashes were deduplicated first. The dataset was split into 70% train, 15% val, and 15% test *before* any augmentation. Augmentations (`RandomHorizontalFlip`, `RandomRotation(15)`, `ColorJitter`) are applied only to the `train_loader` in `ml/train_and_evaluate.py`.

### Q8: Is the reported 20-image test set genuinely held out?
- **Finding:** Yes. The 20 images listed in `data/manifests/test.json` were never presented to the optimizer during training.
- **Critical Limitation Identified:** The sample size is only 5 images per class (20 images total). In this held-out test set:
  - `healthy`: 5/5 correct (100% recall)
  - `common_rust`: 5/5 correct (100% recall)
  - `gray_leaf_spot`: 5/5 correct (100% recall, 55.6% precision)
  - `northern_leaf_blight`: 1/5 correct (**only 20% recall**; 4 out of 5 were misclassified as `gray_leaf_spot`).
  - Overall accuracy was 80.0%, Macro-F1 was 0.7619.

### Q9: Does the application send the selected image to the actual inference endpoint?
- **Finding:** Yes. When a farmer captures or selects an image, `src/services/api.ts` `predictCropHealth()` sends a `multipart/form-data` POST request containing the raw image binary to `/api/vision/predict`.

### Q10: Does the displayed class and confidence come directly from that endpoint?
- **Finding:** Yes. In `AssessmentScreen.tsx`, the primary disease title, confidence percentage, gauge bar, latency, and probabilities are rendered directly from the `AssessmentResult` object returned by the backend.

### Q11: Is any frontend or backend path replacing failed inference with hardcoded or demonstration predictions?
- **Finding:**
  - If the backend is unreachable (e.g. offline with no server), `src/services/api.ts` catches the network error and provides a client fallback labeled `"model_version": "offline_fallback_demo_v1.0"` with `"source_mode": "demonstration"`.
  - For `crop === "banana"`, the backend previously returned a demonstration payload because no banana model had been trained.
  - For `crop === "maize"`, when the backend is online, real PyTorch inference runs on CPU.

### Q12: What does the current crop verifier actually verify?
- **Finding:**
  - `backend/app/vision/crop_verifier.py` converts the image to HSV and computes the percentage of pixels exhibiting green chlorophyll or necrotic yellow/brown hues.
  - If coverage is $< 15\%$, it rejects the photo as `not_plant_leaf`.
  - If the crop is Cotton, it halts diagnosis because Cotton is not certified.
  - For Maize, it verifies that leaf foliage is present, but explicitly discloses:
    *"Automated crop species classification is unavailable; please confirm that this is a maize leaf before running diagnosis."*
  - **Limitation:** It does NOT classify botanical species (it does not distinguish maize leaves from banana leaves or sugarcane leaves automatically).

### Q13: What field and inspection records are persisted, and how does comparison work?
- **Finding:**
  - Field and inspection records are persisted to browser IndexedDB (`FieldReadyDB`) with stores `fields`, `inspections`, and `sync_queue`.
  - Backend SQLite (`data/fieldready_sync.db`) receives synced records via `/api/sync`.
  - **Defect in UI:** `FieldSelectScreen.tsx` does not clearly highlight the default field or make "Select this field" obvious versus "Create new field".
  - **Defect in History:** `HistoryScreen.tsx` shows list items, but selecting two inspections from the same field to compare symptom changes, confidence differences, and sampling ratios was non-functional or unintuitive.

### Q14: What banana datasets, model weights, and class mappings already exist?
- **Finding:**
  - No banana dataset, manifest, or trained PyTorch model artifact currently exists in the repository.
  - Banana was listed in `models/model_registry.json` as `"status": "limited_demo"` and in `routes.py` as returning `_build_demo_response()`.

---

## 2. Investigation of Common Rust vs Gray Leaf Spot Confusion

### The Reported Defect
The user reported that a leaf image expected to be Common Rust was classified as Gray Leaf Spot at 57.1% confidence. The report flagged this as $<65\%$ confidence (uncertainty abstention), but the underlying prediction was wrong.

### Root Cause Analysis
1. **Sample Diversity & Training Size:**
   The training set only contained 17 images per class (68 images total). In small datasets, MobileNetV2 features for foliar fungal lesions (pustules vs necrotic streaks) have narrow coverage.
2. **Lesion Aspect Ratio & Transform Squashing:**
   In `backend/app/vision/predictor.py`, `transforms.Resize((224, 224))` non-uniformly compresses phone camera aspect ratios (4:3 or 16:9) into a 1:1 square. This distorts circular Common Rust pustules into elongated/rectangular blocks resembling *Cercospora zeae-maydis* (Gray Leaf Spot).
3. **Logit Bias & Asymmetry:**
   In the confusion matrix of the trained model, Gray Leaf Spot had a high false positive rate (capturing 4 out of 5 Northern Leaf Blight samples and ambiguous lesions). Any ambiguous or squashed lesion leans toward Gray Leaf Spot.
4. **Confidence Thresholding:**
   The abstention threshold correctly intercepted the 57.1% score as inconclusive ($<65\%$), preventing a confident false diagnosis, but the top class itself was biased.

### Corrective Action Plan
1. Fix image preprocessing in `predictor.py` and `train_and_evaluate.py` to use aspect-ratio preserving resizing (`Resize(256)` + `CenterCrop(224)`) so lesions are not squashed or distorted.
2. Expand training data and regularization for Maize.
3. Explicitly calibrate confidence and test on held-out samples.
4. Provide genuine crop verification and distinct Banana model.
