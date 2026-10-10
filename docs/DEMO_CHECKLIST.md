# 5-Minute Examiner Live Demonstration Guide

**Project:** AgriRhythm — FieldReady  
**Theme:** Voice-Guided Evidence-to-Action Crop Health Intelligence  
**Demonstration Device:** Phone browser connected to Laptop via Wi-Fi (`http://192.168.88.6:5174`)

---

## Preparation (2 Minutes Before Examiner Joins)
1. Ensure Laptop and Phone are connected to the same Wi-Fi network.
2. Verify backend is active on port 8008:
   ```bash
   /Library/Frameworks/Python.framework/Versions/3.11/bin/python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8008
   ```
3. Verify Vite frontend is active on port 5174:
   ```bash
   npm run dev -- --host 0.0.0.0 --port 5174
   ```
4. On your phone, open Safari/Chrome and visit:
   `http://192.168.88.6:5174`

---

## 5-Minute Demonstration Script

### Stage 1: Farmer Onboarding & Synchronized Voice Guidance (0:00 - 0:45)
* **Action:** Open app on phone. Show the clean welcome screen with large native script buttons: **తెలుగు**, **हिन्दी**, **English**.
* **Demonstrate:** Tap **తెలుగు** (Telugu). Point out the audio greeting playing through the phone speaker:
  > *"నమస్కారం! ఫీల్డ్రెడీకి స్వాగతం..."*
* **Demonstrate:** Notice the voice guide in Telugu instructs:
  > *"హోమ్ స్క్రీన్‌కు స్వాగతం. తనిఖీని ప్రారంభించడానికి ఆకుపచ్చ 'పంట ఆరోగ్యం తనిఖీ' బటన్‌పై నొక్కండి."*
* **Key Examiner Talking Point:**
  > *"FieldReady is designed for rural farmers with varying literacy. Every voice instruction explicitly names the exact visible green button, and every action has large, accessible touch targets."*

### Stage 2: Unambiguous Field Selection & Certified Crops (0:45 - 1:20)
* **Action:** Tap the primary green button: **పంట ఆరోగ్యం తనిఖీ (Check Crop Health)**.
* **Demonstrate Field Selection:** Notice the active field card and the sticky primary green action button:
  > *"ఈ పొలాన్ని ఎంచుకోండి: North Plot & కొనసాగించండి" (Select This Field & Continue)*
  Tap it to advance instantly.
* **Demonstrate Certified Crop Support Matrix:**
  * **Maize:** Supported (MobileNetV2: 91.67% test accuracy).
  * **Banana:** Supported (MobileNetV2: 92.86% test accuracy).
  * **Cotton:** Tap Cotton to demonstrate the safety safeguard halt: *"AI diagnostics are not yet verified for this crop. Diagnosis halted to avoid false guidance."*
* **Key Examiner Talking Point:**
  > *"We have independently evaluated, genuine MobileNetV2 models for both Maize and Banana, backed by official ICAR and university practices."* Select Maize or Banana to proceed.

### Stage 3: Image Capture & Quality Gate (1:20 - 2:00)
* **Action:** Tap the phone camera or pick from gallery.
* **Demonstrate One-Click Examiner Assets:** Tap **Common Rust (కుంకుమ తెగులు)** for Maize, or **Black Sigatoka** for Banana.
* **Demonstrate Quality Gate:** Tap "Proceed with this Photo". Show real-time computation of:
  * **Laplacian Sharpness Variance** (e.g. `114.2` — Sharp)
  * **Luminance Level** (`108.5` — Good daylight)
  * **Aspect Ratio & Resolution**
* **Key Examiner Talking Point:**
  > *"The quality gate prevents garbage-in, garbage-out by testing sharpness and lighting before feeding pixels into neural networks."*

### Stage 4: Botanical Crop Species Gate & Mismatch Protection (2:00 - 2:40)
* **Demonstrate Botanical Discrimination:**
  * When Maize is selected with a Maize leaf: Confirms Poaceae parallel venation features and proceeds to diagnosis.
  * **Bonus Examiner Test (Crop Mismatch):** If a farmer accidentally uploads a Banana leaf while Maize is selected, the verifier catches it:
    > *"This appears to be a banana leaf, but you selected maize. Return to crop selection and choose Banana. The maize disease model will not be run on this image."*
* **Key Examiner Talking Point:**
  > *"We implemented a MobileNetV2 botanical species discriminator that prevents cross-crop diagnostic errors."*

### Stage 5: Genuine ML Inference & 12-Section Spoken Report (2:40 - 3:40)
* **Demonstrate Inference:**
  * Shows **Common Rust (Puccinia sorghi)** with **>99% Confidence** (or Black Sigatoka for Banana).
  * Shows **MobileNetV2 Inference Badge** with real-time CPU latency (~37 ms).
  * Displays full class probability distribution.
* **Demonstrate "Speak Full Report":** Tap **"Speak Report"** to listen to the audio report in Telugu/Hindi/English narrating condition, confidence, immediate cultural practices, future care, and extension consultation advice.
* **Demonstrate Differential Causes:** Shows how Southern Rust or fertilizer scorch differ from Common Rust.
* **Demonstrate Chemical Safety Warning Box:** Emphasizes that chemical pesticides must never be applied on AI diagnosis alone without local extension officer consultation.

### Stage 6: Field Sampling & 2-Visit Comparison (3:40 - 4:25)
* **Action:** Tap "Record Field Sampling".
* **Demonstrate Multi-Plant Counting:** Set 20 plants sampled, 4 symptomatic plants. Shows exact proportion:
  > *"4 of 20 plants showed symptoms (20.0%)"*
* **Action:** Save inspection. Open **Inspection History**.
* **Demonstrate 2-Visit Comparison:** Tap "Compare with prior visit" or select two visits:
  * Shows earlier vs later visit side-by-side with days elapsed.
  * Shows exact symptom prevalence delta: `+5.2% increase` or `-10.0% decrease`.
  * Shows mandatory agronomic disclaimer:
    > *"Differences in observation may reflect changed symptoms, image framing, or model uncertainty, and do not prove recovery or progression on two photographs alone."*

### Stage 7: Weather, Sensor Provenance & Offline Resilience (4:25 - 5:00)
* **Demonstrate Weather:** Shows live weather tagged as `EXTERNAL_OPEN_METEO_API`.
* **Demonstrate Sensor Telemetry:** Shows simulated soil and leaf wetness tagged as:
  > *"⚠️ SIMULATED DEMO DATA — NOT A REAL SENSOR MEASUREMENT."*
* **Demonstrate Offline Resilience:**
  1. Toggle phone to Airplane mode.
  2. Reload page: PWA opens instantly from Service Worker cache.
  3. All fields and inspection history records load from IndexedDB.
  4. Inspection works offline with client-side fallback.
