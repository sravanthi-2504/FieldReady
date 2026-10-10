# Engineering Limitations & Next Steps

**Project:** AgriRhythm — FieldReady  
**Evaluation Scope:** Crop Health Intelligence Prototype (Maize + Banana)

---

## 1. Technical Limitations & Progress

### 1.1 Dataset Provenance & Background Clutter
* **Controlled vs. Field Imagery:**
  * **Maize Model:** Trained on the curated PlantVillage maize dataset (320 images, 80/class). PlantVillage images feature controlled single-leaf backgrounds without extensive soil clutter or canopy shadows.
  * **Banana Model:** Trained on authentic field-captured imagery (175 images across Healthy, Black Sigatoka, and Bacterial Wilt from published field research).
* **Mitigation Implemented:**
  1. **Image Quality Gate:** Rejects blurry motion (Laplacian variance < 100) and severe under/over-exposure.
  2. **Representative Multi-Plant Sampling Workflow:** Requires inspecting multiple plants across the quadrant and recording prevalence ("4 of 20 plants showed symptoms (20.0%)"), rather than generalizing from a single photo.

### 1.2 Morphological Overlap & Resolution
* **Aspect-Preserving Cropping:** The baseline model squashed images into 224×224 squares, distorting lesion geometry and confusing Common Rust with Gray Leaf Spot (57.1% confidence in user's initial test). By switching to `Resize(256) + CenterCrop(224)` and expanding the training set, Common Rust test precision reached 100% and test recall reached 91.67%.
* **Honest Abstention:** When softmax confidence drops below 65%, the system abstains from declaring a definitive disease and triggers an amber notice prompting differential review and extension scouting.

### 1.3 Two-Visit Progression Boundaries
* Differences in observation across visits reflect changed symptoms, image framing, or model uncertainty.
* **Mandatory Agronomic Disclaimer:** The system explicitly reminds farmers that two photographs alone do not constitute clinical proof of recovery or spread.

### 1.4 Browser Speech API & Mobile Contexts
* Web Speech API (`SpeechSynthesis` and `SpeechRecognition`) capabilities vary between Android WebViews, Safari on iOS, and Chrome. On non-HTTPS local IP addresses (`http://192.168.x.x`), microphone permission can be restricted.
* **100% Manual Tap Fallback:** The entire application is fully operable with touch buttons alone; no farmer or examiner is ever blocked if microphone or speaker capabilities are restricted.

---

## 2. Agronomic & Chemical Safety Boundaries

### 2.1 Visual Inspection vs. Laboratory Culture
* Foliage photography cannot detect subterranean root rots, sub-clinical viral titers, or early microscopic fungal incubation before lesion emergence.
* AgriRhythm is an **evidence-to-action scouting companion**, not a substitute for diagnostic laboratory culturing or a certified Agricultural Extension Officer (*Kisan Call Center / Krishi Vigyan Kendra*).

### 2.2 Chemical Recommendation Policy
* AgriRhythm strictly adheres to official ICAR-IIMR, ICAR-NRCB, and state university packages of practices. It does **not** generate dynamic pesticide concoctions.
* Chemical treatment requires on-site confirmation by a certified agricultural extension officer, observing local Central Insecticides Board & Registration Committee (CIB&RC) rules and pre-harvest intervals (PHI).

---

## 3. Engineering Roadmap

### Phase 2: In-Browser Edge ML (ONNX Runtime Web)
* Export `models/maize_mobilenetv2.pth` and `models/banana_mobilenetv2.pth` to ONNX format.
* Execute inference directly on mobile CPU/WebGL via `onnxruntime-web`, enabling 100% offline neural network execution even if the laptop backend is completely powered off.

### Phase 3: Physical LoRaWAN Field Node Integration
* Connect physical IoT telemetry (canopy temperature, leaf wetness, soil capacitance sensors) over MQTT / ChirpStack LoRaWAN via `backend/app/services/sensor_service.py`.

### Phase 4: Lesion Segmentation & Quantitative Area Staging
* Implement a lightweight Mobile-UNet model to segment diseased lesion pixels from healthy green blade tissue ($Severity\% = \frac{Lesion\,Pixels}{Foliage\,Pixels} \times 100$), transforming qualitative staging into millimeter-level precision.
